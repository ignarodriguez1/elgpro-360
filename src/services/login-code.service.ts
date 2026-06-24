import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import { randomInt } from "crypto";

/**
 * Capa de datos del login passwordless (OTP). Pura: NO manda emails (eso es
 * Fase 3) ni habla con Auth.js (eso es Fase 2). Solo genera, hashea, persiste,
 * invalida, verifica y consume códigos contra la tabla `LoginCode`.
 *
 * Requisitos de seguridad cubiertos acá:
 *  - req. 1 (rate-limit de verificación): `attempts` por código, tope MAX_ATTEMPTS.
 *  - req. 3 (expiry corto): CODE_TTL_MS.
 *  - req. 4 (single-use + invalida anteriores): `consumedAt`.
 *  - req. 5 (hash en DB): bcrypt; el claro solo se devuelve para el email.
 *
 * Requisitos que se componen FUERA (Fase 2/3, comentados en los seams):
 *  - req. 2 (rate-limit de pedido por email/IP): `countRecentRequestsByEmail` da
 *    la mitad por email; la parte por IP usa la IP confiable de Vercel (NO el
 *    `x-forwarded-for` crudo, spoofeable) en la action de pedido.
 *  - req. 6 (no-enumeración + timing parejo): la action responde igual exista o
 *    no el email; solo crea/envía si el usuario existe.
 *  - req. 7 (cuenta desactivada): ver el seam `// FASE activar/desactivar` abajo.
 */

const CODE_TTL_MS = 10 * 60 * 1000; // 10 min (req. 3: rango 5-15)
const MAX_ATTEMPTS = 5; // req. 1: 1.000.000 de combinaciones ⇒ tope duro
const BCRYPT_COST = 10; // consistente con el resto del proyecto (auth.ts, etc.)

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Código numérico de 6 dígitos, uniforme y cripto-seguro (sin sesgo de módulo). */
export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Crea un código para `email`: invalida los pendientes del mismo email (req. 4)
 * y persiste el hash (req. 5), todo en una transacción. Devuelve el código EN
 * CLARO para que la capa de envío (Fase 3) lo mande por email — el claro nunca
 * toca la base.
 *
 * NO decide si el email pertenece a un usuario real: esa lógica de
 * no-enumeración (req. 6) vive en la action de pedido (Fase 2/3), que solo llama
 * acá cuando el usuario existe pero responde igual en ambos casos.
 */
export async function createLoginCode(
  email: string,
  requestIp?: string | null
): Promise<{ code: string; expiresAt: Date }> {
  const normalized = normalizeEmail(email);
  const code = generateCode();
  const codeHash = await hash(code, BCRYPT_COST);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await prisma.$transaction(async (tx) => {
    // Single-use estricto: cualquier código pendiente anterior del mismo email
    // queda invalidado al pedir uno nuevo.
    await tx.loginCode.updateMany({
      where: { email: normalized, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await tx.loginCode.create({
      data: { email: normalized, codeHash, expiresAt, requestIp: requestIp ?? null },
    });
  });

  return { code, expiresAt };
}

export type VerifyFailReason =
  | "no_code" // no hay código vigente para ese email
  | "expired" // venció
  | "too_many_attempts" // se agotaron los intentos (código quemado)
  | "mismatch"; // código incorrecto (quedan intentos)

export type VerifyResult =
  | { ok: true; email: string }
  | { ok: false; reason: VerifyFailReason; remainingAttempts?: number };

/**
 * Verifica `code` contra el último código vigente de `email`. En una sola
 * transacción: chequea expiry, cuenta intentos (req. 1) quemando el código al
 * llegar al tope, y consume en éxito (req. 4, single-use).
 *
 * Devuelve solo el `email` validado; el lookup del User y el seteo de
 * `emailVerified` los hace el `authorize()` de Auth.js (Fase 2). Recordá que con
 * passwordless verificar el código ES verificar el email.
 */
export async function verifyLoginCode(
  email: string,
  code: string
): Promise<VerifyResult> {
  const normalized = normalizeEmail(email);

  return prisma.$transaction(async (tx) => {
    const record = await tx.loginCode.findFirst({
      where: { email: normalized, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!record) return { ok: false, reason: "no_code" };

    if (record.expiresAt < new Date()) {
      await tx.loginCode.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      });
      return { ok: false, reason: "expired" };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await tx.loginCode.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      });
      return { ok: false, reason: "too_many_attempts" };
    }

    const matches = await compare(code, record.codeHash);

    if (!matches) {
      // Incremento atómico del contador de intentos.
      const updated = await tx.loginCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = Math.max(0, MAX_ATTEMPTS - updated.attempts);
      // Si este fallo agotó los intentos, quemamos el código ya mismo.
      if (remaining === 0) {
        await tx.loginCode.update({
          where: { id: record.id },
          data: { consumedAt: new Date() },
        });
      }
      return { ok: false, reason: "mismatch", remainingAttempts: remaining };
    }

    // Éxito: consumir (single-use).
    await tx.loginCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });

    // FASE activar/desactivar (req. 7): cuando exista `User.active`, NEGAR acá el
    // login a usuarios desactivados (además de en el pedido). HOY NO existe el
    // flag — no implementar todavía; este es el punto de enganche señalizado.

    return { ok: true, email: normalized };
  });
}

/**
 * Cuántos códigos se pidieron para `email` dentro de la ventana (req. 2, mitad
 * por email). La parte por IP se compone en la action de pedido (Fase 2) usando
 * la IP confiable de Vercel, no el `x-forwarded-for` crudo.
 */
export async function countRecentRequestsByEmail(
  email: string,
  windowMs: number
): Promise<number> {
  const normalized = normalizeEmail(email);
  const since = new Date(Date.now() - windowMs);
  return prisma.loginCode.count({
    where: { email: normalized, createdAt: { gte: since } },
  });
}

/** Cuántos códigos se pidieron desde `ip` dentro de la ventana (req. 2, mitad por IP). */
export async function countRecentRequestsByIp(
  ip: string,
  windowMs: number
): Promise<number> {
  const since = new Date(Date.now() - windowMs);
  return prisma.loginCode.count({
    where: { requestIp: ip, createdAt: { gte: since } },
  });
}

/** Limpieza opcional de códigos vencidos/consumidos viejos (housekeeping). */
export async function purgeStaleLoginCodes(olderThanMs: number): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMs);
  const { count } = await prisma.loginCode.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: cutoff } }, { consumedAt: { lt: cutoff } }],
    },
  });
  return count;
}

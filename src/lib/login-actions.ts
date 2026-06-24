"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  createLoginCode,
  countRecentRequestsByEmail,
  countRecentRequestsByIp,
} from "@/services/login-code.service";
import { sendLoginCodeEmail } from "@/lib/email";

const REQUEST_WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_PER_EMAIL = 4; // req. 2
const MAX_PER_IP = 10; // req. 2 (NAT/oficina: varios usuarios comparten IP)

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * IP confiable del cliente (req. 2). En Vercel, `x-real-ip` lo setea la
 * plataforma y el cliente NO lo puede falsear; el `x-forwarded-for` crudo SÍ es
 * spoofeable, por eso no se usa como fuente primaria. En local/dev sin proxy
 * puede no venir → "unknown" (el límite por email sigue cubriendo).
 * Alternativa canónica si se quiere agregar la dep: `@vercel/functions.ipAddress(req)`.
 */
async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-real-ip") ??
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export type RequestCodeResult =
  | { ok: true }
  | { ok: false; error: "rate_limited" | "invalid_email" };

/**
 * Pide un código de login para `emailRaw`. Cumple no-enumeración (req. 6):
 * responde IGUAL exista o no el usuario. Siempre crea un registro —lo que empareja
 * el costo de hash (timing) y habilita el rate-limit por IP— pero solo ENVÍA el
 * email si el usuario existe. Rate-limit por email + IP (req. 2) antes de crear.
 *
 * Nota de honestidad (anti-patrón): no se afirma "enviado" como un hecho; la UI
 * usa el condicional "si tu email está registrado, te enviamos un código". Un
 * fallo real de Resend se registra server-side (no queda mudo), sin revelar
 * existencia al cliente.
 *
 * Side-channel residual conocido: cuando el usuario existe se hace el `await` del
 * envío (latencia de red) y cuando no, no — una diferencia de timing menor. El
 * costo dominante (escritura + bcrypt) ocurre en ambos caminos; cerrar del todo
 * el canal exigiría encolar los envíos fuera de banda (fuera de este alcance).
 */
export async function requestLoginCodeAction(emailRaw: string): Promise<RequestCodeResult> {
  const email = (emailRaw ?? "").trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return { ok: false, error: "invalid_email" };
  }

  const ip = await clientIp();

  // req. 2: ambos límites son existencia-independientes (no enumeran). Se
  // chequea ANTES de crear para no inflar filas bajo ataque.
  const [byEmail, byIp] = await Promise.all([
    countRecentRequestsByEmail(email, REQUEST_WINDOW_MS),
    ip === "unknown" ? Promise.resolve(0) : countRecentRequestsByIp(ip, REQUEST_WINDOW_MS),
  ]);
  if (byEmail >= MAX_PER_EMAIL || byIp >= MAX_PER_IP) {
    return { ok: false, error: "rate_limited" };
  }

  const { code } = await createLoginCode(email, ip === "unknown" ? null : ip);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, active: true },
  });
  // req. 7: a una cuenta desactivada NO se le manda código (igual que a un email
  // inexistente). No-enumeración: la respuesta al cliente es idéntica en los tres
  // casos (existe-activo / existe-inactivo / no existe).
  if (user && user.active) {
    try {
      await sendLoginCodeEmail({ to: email, code });
    } catch (err) {
      console.error(
        "[login] Resend falló al enviar el código:",
        err instanceof Error ? err.message : err
      );
    }
  }

  return { ok: true };
}

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { logAudit, type AuditActor } from "./audit.service";

function isKnownError(e: unknown, code: string): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === code;
}

/**
 * Alta de un miembro del equipo interno (STAFF o ADMIN). Passwordless: se crea
 * SIN credencial; entra al panel pidiendo un código por email igual que cualquier
 * login. El gate de permisos (solo ADMIN) vive en la action, no acá.
 */
export async function createTeamUser(
  data: { name: string; email: string; role: "STAFF" | "ADMIN" },
  actor?: AuditActor
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name: data.name, email: data.email, role: data.role },
      });
      if (actor) {
        await logAudit(
          {
            actor,
            action: "USER_CREATED",
            entity: "User",
            entityId: created.id,
            summary: `Usuario creado: ${data.name} (${data.email}) — ${data.role}`,
          },
          tx
        );
      }
      return created;
    });
  } catch (e) {
    if (isKnownError(e, "P2002")) {
      throw new Error("Ya existe un usuario con ese email.");
    }
    throw e;
  }
}

/** Lista el equipo interno (STAFF + ADMIN), excluyendo a los clientes. */
export async function listTeamUsers() {
  return prisma.user.findMany({
    where: { role: { in: ["STAFF", "ADMIN"] } },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      emailVerified: true,
      createdAt: true,
    },
  });
}

/**
 * Activa o desactiva una cuenta (cualquier rol). Una cuenta desactivada no puede
 * loguear (bloqueo en el pedido y en la verificación) y pierde sus sesiones
 * activas en el próximo request (revalidación en getCurrentUser). El gate de
 * permisos (solo ADMIN) y la guarda anti-autobloqueo viven en la action.
 */
export async function setUserActive(
  userId: string,
  active: boolean,
  actor: AuditActor
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { active },
      select: { id: true, name: true, email: true, active: true },
    });
    await logAudit(
      {
        actor,
        action: active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        entity: "User",
        entityId: userId,
        summary: `Usuario ${active ? "activado" : "desactivado"}: ${updated.name} (${updated.email})`,
      },
      tx
    );
    return updated;
  });
}

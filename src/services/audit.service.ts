import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

/**
 * Log de auditoría interno, append-only. NUNCA se actualiza ni se borra.
 * Se diferencia del timeline visible al cliente (WorkOrderStatusUpdate):
 * el AuditLog es interno, total e inmutable.
 */
export type AuditAction =
  | "ORDER_CREATED"
  | "STATUS_ADDED"
  | "STEP_ADVANCED"
  | "STEP_SET_CURRENT"
  | "MARKED_READY"
  | "MARKED_DELIVERED"
  | "SERVICE_CREATED"
  | "SERVICE_UPDATED"
  | "SERVICES_REORDERED"
  | "FLOW_STEP_ADDED"
  | "FLOW_STEP_UPDATED"
  | "FLOW_STEP_DELETED"
  | "FLOW_STEPS_REORDERED"
  | "SERVICE_IMAGES_ADDED"
  | "SERVICE_IMAGES_REORDERED"
  | "SERVICE_COVER_SET"
  | "SERVICE_IMAGE_ALT_UPDATED"
  | "SERVICE_IMAGE_DELETED"
  | "TUTORIAL_TOGGLED"
  | "TUTORIAL_CREATED"
  | "TUTORIAL_UPDATED"
  | "TUTORIAL_DELETED"
  | "WORK_CREATED"
  | "WORK_UPDATED"
  | "WORK_DELETED"
  | "WORK_TOGGLED"
  | "CUSTOMER_CREATED"
  | "CUSTOMER_UPDATED"
  | "USER_CREATED"
  | "USER_ACTIVATED"
  | "USER_DEACTIVATED"
  | "VEHICLE_CREATED"
  | "VEHICLE_UPDATED"
  | "VEHICLE_DELETED";

export interface AuditActor {
  id?: string | null;
  email: string;
}

/** Cliente Prisma o el cliente transaccional (`tx`) de una $transaction interactiva. */
type AuditDb = Prisma.TransactionClient | typeof prisma;

/**
 * Registra un evento de auditoría. Aceptá el `db` transaccional para que el log
 * viva DENTRO de la misma transacción que la operación que audita (si la
 * operación se revierte, el log también).
 */
export async function logAudit(
  data: {
    actor: AuditActor;
    action: AuditAction;
    entity: string;
    entityId: string;
    summary: string;
    diff?: Prisma.InputJsonValue;
  },
  db: AuditDb = prisma
): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: data.actor.id ?? null,
      actorEmail: data.actor.email,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      summary: data.summary,
      ...(data.diff !== undefined && { diff: data.diff }),
    },
  });
}

/** Lista el historial de auditoría de una entidad concreta (más reciente primero). */
export async function listAuditLog(entity: string, entityId: string) {
  return prisma.auditLog.findMany({
    where: { entity, entityId },
    orderBy: { createdAt: "desc" },
    include: { actor: true },
  });
}

/** Eventos recientes de todo el sistema (para el panel de auditoría del admin). */
export async function listRecentAuditLogs(limit = 150) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: true },
  });
}

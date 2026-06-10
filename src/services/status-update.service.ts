import { prisma } from "@/lib/prisma";
import type { Role, OrderStage } from "@/generated/prisma/client";
import { logAudit, type AuditActor } from "./audit.service";

/**
 * Crea un estado intercalado manualmente en el timeline de una orden (no venía
 * del flujo del servicio). Se agrega al final por sortOrder. Por defecto custom=true.
 * El create, la asociación de fotos y el log de auditoría van en una transacción.
 */
export async function createStatusUpdate(data: {
  workOrderId: string;
  title: string;
  description?: string;
  internalDescription?: string;
  stage?: OrderStage;
  visibleToCustomer?: boolean;
  notifyCustomer?: boolean;
  custom?: boolean;
  actor: AuditActor;
  photoIds?: string[];
}) {
  return prisma.$transaction(async (tx) => {
    const last = await tx.workOrderStatusUpdate.findFirst({
      where: { workOrderId: data.workOrderId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const sortOrder = (last?.sortOrder ?? -1) + 1;

    const update = await tx.workOrderStatusUpdate.create({
      data: {
        workOrderId: data.workOrderId,
        title: data.title,
        description: data.description,
        internalDescription: data.internalDescription,
        stage: data.stage,
        visibleToCustomer: data.visibleToCustomer ?? true,
        notifyCustomer: data.notifyCustomer ?? false,
        custom: data.custom ?? true,
        sortOrder,
        createdByUserId: data.actor.id ?? undefined,
      },
      include: {
        workOrder: {
          include: {
            vehicle: { include: { customer: { include: { user: true } } } },
          },
        },
        createdBy: true,
      },
    });

    if (data.photoIds && data.photoIds.length > 0) {
      await tx.workOrderPhoto.updateMany({
        where: { id: { in: data.photoIds } },
        data: { statusUpdateId: update.id },
      });
    }

    await logAudit(
      {
        actor: data.actor,
        action: "STATUS_ADDED",
        entity: "WorkOrder",
        entityId: data.workOrderId,
        summary: `Estado agregado: "${data.title}"`,
        diff: {
          after: {
            title: data.title,
            visibleToCustomer: data.visibleToCustomer ?? true,
          },
        },
      },
      tx
    );

    return update;
  });
}

export async function listStatusUpdates(
  workOrderId: string,
  requestingUserId: string,
  requestingRole: Role
) {
  const order = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: { vehicle: { include: { customer: true } } },
  });

  if (!order) throw new Error("Orden no encontrada");

  if (
    requestingRole === "CUSTOMER" &&
    order.vehicle.customer.userId !== requestingUserId
  ) {
    throw new Error("Sin permisos");
  }

  const updates = await prisma.workOrderStatusUpdate.findMany({
    where: {
      workOrderId,
      ...(requestingRole === "CUSTOMER" && { visibleToCustomer: true }),
    },
    include: {
      createdBy: true,
      photos:
        requestingRole === "CUSTOMER"
          ? { where: { visibleToCustomer: true } }
          : true,
    },
    orderBy: { sortOrder: "asc" },
  });

  if (requestingRole === "CUSTOMER") {
    return updates.map((u: (typeof updates)[number]) => ({
      ...u,
      internalDescription: null,
    }));
  }

  return updates;
}

export async function markNotified(updateId: string) {
  return prisma.workOrderStatusUpdate.update({
    where: { id: updateId },
    data: { notifiedAt: new Date() },
  });
}

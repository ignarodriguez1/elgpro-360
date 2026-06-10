import { prisma } from "@/lib/prisma";
import type {
  Role,
  WorkOrderStatus,
  OrderStage,
} from "@/generated/prisma/client";
import { logAudit, type AuditActor } from "./audit.service";

const ORDER_CODE_PREFIX = "OT-";
const ORDER_CODE_START = 1042;

/**
 * Máquina de estados de la orden. Solo se permiten estas transiciones:
 *   PROCESO → LISTO → ENTREGADO
 * No se puede saltar (PROCESO → ENTREGADO) ni retroceder.
 */
const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PROCESO: ["LISTO"],
  LISTO: ["ENTREGADO"],
  ENTREGADO: [],
};

export class InvalidTransitionError extends Error {
  constructor(from: WorkOrderStatus, to: WorkOrderStatus) {
    super(`Transición de estado inválida: ${from} → ${to}`);
    this.name = "InvalidTransitionError";
  }
}

function assertTransition(from: WorkOrderStatus, to: WorkOrderStatus) {
  if (!VALID_TRANSITIONS[from].includes(to)) {
    throw new InvalidTransitionError(from, to);
  }
}

/**
 * Genera el código legible de la orden: "OT-" + (1042 + cantidad de órdenes).
 * Decisión: las órdenes NO se borran (se marcan ENTREGADO), por eso el count es
 * monótono creciente y el código no colisiona. Simple y O(1). No apto para alta
 * concurrencia (dos altas simultáneas darían el mismo código → falla el @unique);
 * suficiente para el volumen de un taller que carga órdenes de a una.
 */
export async function generateOrderCode(): Promise<string> {
  const count = await prisma.workOrder.count();
  return `${ORDER_CODE_PREFIX}${ORDER_CODE_START + count}`;
}

export interface InitialTimelineStep {
  title: string;
  description: string | null;
  stage: OrderStage;
  visibleToCustomer: boolean;
  custom: boolean;
}

/**
 * Concatena los flujos de los servicios elegidos (en el orden recibido) para
 * armar la secuencia inicial de estados de una orden.
 *
 * Regla de dedupe: el paso de ingreso (etapa INGRESO, típicamente "Vehículo
 * ingresado") aparece UNA sola vez al principio. El resto de los pasos se
 * concatenan respetando el orden de los servicios.
 */
export async function buildInitialTimeline(
  serviceIds: string[]
): Promise<InitialTimelineStep[]> {
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    include: { flow: { orderBy: { sortOrder: "asc" } } },
  });

  // Respetar el orden en que el admin eligió los servicios.
  const byId = new Map(services.map((s) => [s.id, s]));
  const ordered = serviceIds
    .map((id) => byId.get(id))
    .filter((s): s is NonNullable<typeof s> => s != null);

  const timeline: InitialTimelineStep[] = [];
  let ingresoAdded = false;

  for (const service of ordered) {
    for (const step of service.flow) {
      if (step.stage === "INGRESO") {
        if (ingresoAdded) continue; // el ingreso va una sola vez
        ingresoAdded = true;
      }
      timeline.push({
        title: step.title,
        description: step.description,
        stage: step.stage,
        visibleToCustomer: step.visible,
        custom: false,
      });
    }
  }

  return timeline;
}

/**
 * Crea la orden y MATERIALIZA el timeline inicial como WorkOrderStatusUpdate.
 * Snapshot: una vez creada, editar el flujo del servicio NO altera la orden.
 * El primer paso queda confirmado e isCurrent; el resto, pendientes (confirmed=false).
 *
 * El create + el log de auditoría van en una sola transacción.
 */
export async function createWorkOrder(data: {
  vehicleId: string;
  title: string;
  description?: string;
  serviceIds: string[];
  internalNotes?: string;
  estimatedDeliveryDate?: Date;
  budgetAmount?: number;
  actor: AuditActor;
}) {
  const services = await prisma.service.findMany({
    where: { id: { in: data.serviceIds } },
    select: { id: true, name: true },
  });
  const serviceNames = data.serviceIds
    .map((id) => services.find((s) => s.id === id)?.name)
    .filter((n): n is string => !!n);

  const timeline = await buildInitialTimeline(data.serviceIds);
  if (timeline.length === 0) {
    throw new Error(
      "No se puede crear una orden sin pasos: los servicios elegidos no tienen flujo."
    );
  }
  const orderCode = await generateOrderCode();
  const initialStage: OrderStage = timeline[0]?.stage ?? "INGRESO";

  return prisma.$transaction(async (tx) => {
    const order = await tx.workOrder.create({
      data: {
        orderCode,
        vehicleId: data.vehicleId,
        title: data.title,
        description: data.description,
        servicesRequested: serviceNames,
        internalNotes: data.internalNotes,
        estimatedDeliveryDate: data.estimatedDeliveryDate,
        budgetAmount: data.budgetAmount ?? null,
        status: "PROCESO",
        stage: initialStage,
        paymentStatus: "NA",
        statusUpdates: {
          create: timeline.map((step, index) => ({
            title: step.title,
            description: step.description,
            stage: step.stage,
            visibleToCustomer: step.visibleToCustomer,
            custom: step.custom,
            sortOrder: index,
            isCurrent: index === 0,
            confirmed: index === 0,
            createdByUserId: data.actor.id ?? undefined,
          })),
        },
      },
      include: {
        vehicle: { include: { customer: { include: { user: true } } } },
        statusUpdates: { orderBy: { sortOrder: "asc" } },
      },
    });

    await logAudit(
      {
        actor: data.actor,
        action: "ORDER_CREATED",
        entity: "WorkOrder",
        entityId: order.id,
        summary: `Orden ${order.orderCode} creada: ${order.title}`,
        diff: { after: { servicesRequested: serviceNames, stage: initialStage } },
      },
      tx
    );

    return order;
  });
}

export async function getWorkOrderById(
  orderId: string,
  requestingUserId: string,
  requestingRole: Role
) {
  const order = await prisma.workOrder.findUnique({
    where: { id: orderId },
    include: {
      vehicle: { include: { customer: { include: { user: true } } } },
      statusUpdates: {
        orderBy: { sortOrder: "asc" },
        include: { createdBy: true, photos: true },
      },
      photos: true,
    },
  });

  if (!order) throw new Error("Orden no encontrada");

  if (
    requestingRole === "CUSTOMER" &&
    order.vehicle.customer.userId !== requestingUserId
  ) {
    throw new Error("Sin permisos para ver esta orden");
  }

  if (requestingRole === "CUSTOMER") {
    order.statusUpdates = order.statusUpdates.filter(
      (u: { visibleToCustomer: boolean }) => u.visibleToCustomer
    );
    order.internalNotes = null;
  }

  return order;
}

export async function listWorkOrders(filters?: {
  status?: WorkOrderStatus;
  stage?: OrderStage;
  vehicleId?: string;
  customerUserId?: string;
  requestingUserId?: string;
  requestingRole?: Role;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.stage) where.stage = filters.stage;
  if (filters?.vehicleId) where.vehicleId = filters.vehicleId;

  if (filters?.requestingRole === "CUSTOMER" && filters.requestingUserId) {
    where.vehicle = { customer: { userId: filters.requestingUserId } };
  } else if (filters?.customerUserId) {
    where.vehicle = { customer: { userId: filters.customerUserId } };
  }

  return prisma.workOrder.findMany({
    where,
    include: {
      vehicle: { include: { customer: { include: { user: true } } } },
      // estado actual de la orden (para tarjetas/listados)
      statusUpdates: { where: { isCurrent: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Avanza al siguiente paso del plan: confirma el siguiente, mueve isCurrent y
 * recalcula la stage de la orden a partir de la etapa de ese paso.
 * Solo opera si la orden está en PROCESO (idempotente respecto del ciclo).
 */
export async function advanceToNextStep(workOrderId: string, actor?: AuditActor) {
  const order = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: { status: true },
  });
  if (!order) throw new Error("Orden no encontrada");
  if (order.status !== "PROCESO") {
    // Una orden LISTA/ENTREGADA no avanza pasos del plan.
    return null;
  }

  const updates = await prisma.workOrderStatusUpdate.findMany({
    where: { workOrderId },
    orderBy: { sortOrder: "asc" },
  });

  const currentIndex = updates.findIndex((u) => u.isCurrent);
  const nextIndex = currentIndex + 1;
  if (nextIndex >= updates.length) {
    return updates[currentIndex] ?? null; // ya en el último paso
  }

  const current = updates[currentIndex];
  const next = updates[nextIndex];

  await prisma.$transaction(async (tx) => {
    if (current) {
      await tx.workOrderStatusUpdate.update({
        where: { id: current.id },
        data: { isCurrent: false },
      });
    }
    await tx.workOrderStatusUpdate.update({
      where: { id: next.id },
      data: { isCurrent: true, confirmed: true },
    });
    await tx.workOrder.update({
      where: { id: workOrderId },
      data: { stage: next.stage ?? undefined },
    });
    if (actor) {
      await logAudit(
        {
          actor,
          action: "STEP_ADVANCED",
          entity: "WorkOrder",
          entityId: workOrderId,
          summary: `Avanzó al paso "${next.title}"`,
          diff: { before: { step: current?.title ?? null }, after: { step: next.title } },
        },
        tx
      );
    }
  });

  return next;
}

/**
 * Marca un estado concreto como el actual (para saltar/ajustar manualmente).
 * Recalcula la stage de la orden.
 */
export async function markStepAsCurrent(statusUpdateId: string, actor?: AuditActor) {
  const target = await prisma.workOrderStatusUpdate.findUnique({
    where: { id: statusUpdateId },
  });
  if (!target) throw new Error("Estado no encontrado");

  await prisma.$transaction(async (tx) => {
    await tx.workOrderStatusUpdate.updateMany({
      where: { workOrderId: target.workOrderId },
      data: { isCurrent: false },
    });
    await tx.workOrderStatusUpdate.update({
      where: { id: target.id },
      data: { isCurrent: true, confirmed: true },
    });
    await tx.workOrder.update({
      where: { id: target.workOrderId },
      data: { stage: target.stage ?? undefined },
    });
    if (actor) {
      await logAudit(
        {
          actor,
          action: "STEP_SET_CURRENT",
          entity: "WorkOrder",
          entityId: target.workOrderId,
          summary: `Estado actual fijado en "${target.title}"`,
        },
        tx
      );
    }
  });

  return target;
}

/**
 * Marca la orden como LISTA para retirar y crea el estado visible correspondiente.
 * Idempotente: si ya está LISTO, no hace nada (no duplica el estado). Valida la
 * transición desde PROCESO. Todo en una sola transacción.
 */
export async function markAsReady(workOrderId: string, actor: AuditActor) {
  const order = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: { status: true },
  });
  if (!order) throw new Error("Orden no encontrada");
  if (order.status === "LISTO") {
    // Idempotente: ya está lista, evitamos duplicar el estado "Listo para retirar".
    return prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { vehicle: { include: { customer: { include: { user: true } } } } },
    });
  }
  assertTransition(order.status, "LISTO");

  return prisma.$transaction(async (tx) => {
    const last = await tx.workOrderStatusUpdate.findFirst({
      where: { workOrderId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const nextOrder = (last?.sortOrder ?? -1) + 1;

    await tx.workOrderStatusUpdate.updateMany({
      where: { workOrderId },
      data: { isCurrent: false },
    });

    const updated = await tx.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: "LISTO",
        stage: "DETAIL_ENTREGA",
        statusUpdates: {
          create: {
            title: "Listo para retirar",
            description:
              "El trabajo finalizó y el vehículo está listo para retirar.",
            stage: "DETAIL_ENTREGA",
            visibleToCustomer: true,
            notifyCustomer: true,
            isCurrent: true,
            confirmed: true,
            custom: true,
            sortOrder: nextOrder,
            createdByUserId: actor.id ?? undefined,
          },
        },
      },
      include: {
        vehicle: { include: { customer: { include: { user: true } } } },
      },
    });

    await logAudit(
      {
        actor,
        action: "MARKED_READY",
        entity: "WorkOrder",
        entityId: workOrderId,
        summary: `Orden ${updated.orderCode} marcada como LISTA para retirar`,
        diff: { before: { status: "PROCESO" }, after: { status: "LISTO" } },
      },
      tx
    );

    return updated;
  });
}

export interface AdminStats {
  /** Vehículos actualmente en el taller (órdenes PROCESO o LISTO). */
  vehiculosEnTaller: number;
  /** Órdenes en estado PROCESO. */
  ordenesActivas: number;
  /** Órdenes ENTREGADO en el mes calendario actual. */
  completadasDelMes: number;
  /** Clientes únicos con al menos una orden activa (PROCESO o LISTO). */
  clientesActivos: number;
}

/**
 * Agrega contadores del dashboard admin en una sola pasada.
 * Evita múltiples queries crudas en la página.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [vehiculosEnTaller, ordenesActivas, completadasDelMes, clientesActivosRows] =
    await Promise.all([
      // Vehículos distintos con orden activa
      prisma.workOrder.groupBy({
        by: ["vehicleId"],
        where: { status: { in: ["PROCESO", "LISTO"] } },
      }).then((rows) => rows.length),

      // Órdenes en proceso
      prisma.workOrder.count({ where: { status: "PROCESO" } }),

      // Entregadas este mes
      prisma.workOrder.count({
        where: {
          status: "ENTREGADO",
          actualDeliveryDate: { gte: startOfMonth, lt: startOfNextMonth },
        },
      }),

      // Clientes con orden activa (distinct por userId a través de vehicle.customer)
      prisma.workOrder.findMany({
        where: { status: { in: ["PROCESO", "LISTO"] } },
        select: { vehicle: { select: { customer: { select: { userId: true } } } } },
        distinct: ["vehicleId"],
      }),
    ]);

  const uniqueCustomers = new Set(
    clientesActivosRows.map((o) => o.vehicle.customer.userId)
  ).size;

  return {
    vehiculosEnTaller,
    ordenesActivas,
    completadasDelMes,
    clientesActivos: uniqueCustomers,
  };
}

/**
 * Marca la orden como ENTREGADA (retirada por el cliente).
 * Idempotente: si ya está ENTREGADO, no hace nada. Valida la transición desde
 * LISTO (no se puede entregar una orden que sigue en PROCESO).
 */
export async function markAsDelivered(workOrderId: string, actor: AuditActor) {
  const order = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: { status: true },
  });
  if (!order) throw new Error("Orden no encontrada");
  if (order.status === "ENTREGADO") {
    return prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { vehicle: { include: { customer: { include: { user: true } } } } },
    });
  }
  assertTransition(order.status, "ENTREGADO");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.workOrder.update({
      where: { id: workOrderId },
      data: { status: "ENTREGADO", actualDeliveryDate: new Date() },
      include: {
        vehicle: { include: { customer: { include: { user: true } } } },
      },
    });

    await logAudit(
      {
        actor,
        action: "MARKED_DELIVERED",
        entity: "WorkOrder",
        entityId: workOrderId,
        summary: `Orden ${updated.orderCode} marcada como ENTREGADA`,
        diff: { before: { status: "LISTO" }, after: { status: "ENTREGADO" } },
      },
      tx
    );

    return updated;
  });
}

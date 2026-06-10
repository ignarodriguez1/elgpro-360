"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createWorkOrder,
  buildInitialTimeline,
  type InitialTimelineStep,
} from "@/services/work-order.service";
import { workOrderSchema } from "@/lib/validations";

export { type InitialTimelineStep };

/**
 * Devuelve el preview del timeline concatenado para los servicios elegidos.
 * Se usa en el paso 2 ("Trabajo") del wizard para mostrar los pasos que se
 * van a crear ANTES de confirmar la orden.
 */
export async function getTimelinePreview(
  serviceIds: string[]
): Promise<InitialTimelineStep[]> {
  if (serviceIds.length === 0) return [];
  return buildInitialTimeline(serviceIds);
}

/**
 * Crea la orden y redirige al detalle.
 * Valida con Zod antes de tocar la DB. Mantiene el contrato { error } que espera
 * el Wizard del cliente.
 */
export async function createOrderAction(data: {
  vehicleId: string;
  title: string;
  description?: string;
  serviceIds: string[];
  internalNotes?: string;
  estimatedDeliveryDate?: string; // ISO string desde el cliente
  budgetAmount?: number;
}): Promise<{ error: string } | never> {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Sin permisos" };
  }

  const parsed = workOrderSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let order: { id: string };
  try {
    order = await createWorkOrder({
      vehicleId: parsed.data.vehicleId,
      title: parsed.data.title,
      description: parsed.data.description,
      serviceIds: parsed.data.serviceIds,
      internalNotes: parsed.data.internalNotes,
      estimatedDeliveryDate: parsed.data.estimatedDeliveryDate,
      budgetAmount: parsed.data.budgetAmount,
      actor: { id: session.user.id, email: session.user.email },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear la orden";
    return { error: message };
  }

  redirect(`/admin/ordenes/${order.id}`);
}

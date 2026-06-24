"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import {
  createWorkOrder,
  buildInitialTimeline,
  type InitialTimelineStep,
} from "@/services/work-order.service";
import { createWorkOrderPhoto } from "@/services/upload.service";
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
  photos?: { url: string; publicId?: string }[]; // fotos de ingreso ya subidas a Cloudinary (UploadZone)
}): Promise<{ error: string } | never> {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "STAFF"].includes(user.role)) {
    return { error: "Sin permisos" };
  }

  const parsed = workOrderSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let order: Awaited<ReturnType<typeof createWorkOrder>>;
  try {
    order = await createWorkOrder({
      vehicleId: parsed.data.vehicleId,
      title: parsed.data.title,
      description: parsed.data.description,
      serviceIds: parsed.data.serviceIds,
      internalNotes: parsed.data.internalNotes,
      estimatedDeliveryDate: parsed.data.estimatedDeliveryDate,
      budgetAmount: parsed.data.budgetAmount,
      actor: { id: user.id, email: user.email },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear la orden";
    return { error: message };
  }

  // Fotos de ingreso: se cuelgan del PRIMER paso del timeline (etapa INGRESO, que
  // createWorkOrder ya crea como isCurrent), reusando el mismo path que addStatusAction.
  // Best-effort: la orden ya está creada, así que un fallo acá no la revierte.
  if (data.photos?.length) {
    const ingresoStepId = order.statusUpdates[0]?.id;
    for (const p of data.photos) {
      try {
        await createWorkOrderPhoto({
          workOrderId: order.id,
          statusUpdateId: ingresoStepId,
          imageUrl: p.url,
          publicId: p.publicId,
          visibleToCustomer: true,
        });
      } catch {
        // best-effort: no romper la creación de la orden por una foto
      }
    }
  }

  redirect(`/admin/ordenes/${order.id}`);
}

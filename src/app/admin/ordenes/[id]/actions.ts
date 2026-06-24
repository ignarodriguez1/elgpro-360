"use server";

import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { createStatusUpdate } from "@/services/status-update.service";
import {
  markAsReady,
  markAsDelivered,
  advanceToNextStep,
} from "@/services/work-order.service";
import { createWorkOrderPhoto } from "@/services/upload.service";
import {
  notifyCustomerStatusUpdate,
  notifyReadyForPickup,
} from "@/services/notification.service";
import { statusUpdateSchema } from "@/lib/validations";
import { type ActionResult, toActionError } from "@/lib/action-result";
import type { AuditActor } from "@/services/audit.service";
import type { OrderStage } from "@/generated/prisma/client";

/** Devuelve el actor (id + email) si la sesión es ADMIN/STAFF; si no, null. */
async function getActor(): Promise<AuditActor | null> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) return null;
  return { id: user.id, email: user.email };
}

export async function addStatusAction(
  orderId: string,
  data: {
    title: string;
    description?: string;
    internalDescription?: string;
    stage?: OrderStage;
    visibleToCustomer: boolean;
    notifyCustomer: boolean;
    photos?: { url: string; publicId?: string }[];
  }
): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sin permisos" };

  const parsed = statusUpdateSchema
    .omit({ workOrderId: true, photoIds: true })
    .safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    const update = await createStatusUpdate({
      workOrderId: orderId,
      title: parsed.data.title,
      description: parsed.data.description,
      internalDescription: parsed.data.internalDescription,
      stage: parsed.data.stage,
      visibleToCustomer: parsed.data.visibleToCustomer,
      notifyCustomer: parsed.data.notifyCustomer,
      custom: true,
      actor,
    });

    if (data.photos?.length) {
      for (const p of data.photos) {
        await createWorkOrderPhoto({
          workOrderId: orderId,
          statusUpdateId: update.id,
          imageUrl: p.url,
          publicId: p.publicId,
          visibleToCustomer: parsed.data.visibleToCustomer,
        });
      }
    }

    if (parsed.data.notifyCustomer && parsed.data.visibleToCustomer) {
      try {
        await notifyCustomerStatusUpdate(update.id);
      } catch {
        // El email no debe romper el guardado.
      }
    }

    revalidatePath(`/admin/ordenes/${orderId}`);
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo agregar el estado");
  }
}

export async function markReadyAction(orderId: string): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sin permisos" };

  try {
    await markAsReady(orderId, actor);
    // Aviso al cliente de que el vehículo está listo (best-effort: no debe
    // romper la operación si Resend falla o no está configurado).
    try {
      await notifyReadyForPickup(orderId);
    } catch {
      // Email no crítico.
    }
    revalidatePath(`/admin/ordenes/${orderId}`);
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo marcar como listo");
  }
}

export async function advanceStepAction(
  orderId: string,
  gate?: { photo?: { url: string; publicId?: string }; noImageReason?: string }
): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sin permisos" };

  try {
    await advanceToNextStep(orderId, actor, gate);
    revalidatePath(`/admin/ordenes/${orderId}`);
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo avanzar la etapa");
  }
}

export async function markDeliveredAction(orderId: string): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sin permisos" };

  try {
    await markAsDelivered(orderId, actor);
    revalidatePath(`/admin/ordenes/${orderId}`);
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo marcar como entregado");
  }
}

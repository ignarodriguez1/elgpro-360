"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  reorderServices,
  reorderFlowSteps,
  addFlowStep,
  updateFlowStep,
  deleteFlowStep,
  createService,
  updateService,
} from "@/services/service.service";
import { logAudit, type AuditActor } from "@/services/audit.service";
import { serviceSchema, flowStepSchema, reorderSchema } from "@/lib/validations";
import type { OrderStage } from "@/generated/prisma/client";

// Contenido web (servicios) es solo del dueño (ADMIN), no del operario (STAFF).
async function assertOwner(): Promise<AuditActor> {
  const session = await auth();
  const user = session?.user;
  if (!user || user.role !== "ADMIN") {
    throw new Error("No autorizado");
  }
  return { id: user.id, email: user.email };
}

function invalid(message: string | undefined): never {
  throw new Error(message ?? "Datos inválidos");
}

export async function reorderServicesAction(orderedIds: string[]) {
  const actor = await assertOwner();
  const parsed = reorderSchema.safeParse({ orderedIds });
  if (!parsed.success) invalid(parsed.error.issues[0]?.message);
  await reorderServices(parsed.data.orderedIds);
  await logAudit({
    actor,
    action: "SERVICES_REORDERED",
    entity: "Service",
    entityId: "*",
    summary: `Servicios reordenados (${parsed.data.orderedIds.length})`,
  });
  revalidatePath("/admin/servicios");
}

export async function createServiceAction(name: string) {
  const actor = await assertOwner();
  const parsed = serviceSchema.pick({ name: true }).safeParse({ name });
  if (!parsed.success) invalid(parsed.error.issues[0]?.message);
  const svc = await createService({ name: parsed.data.name });
  await logAudit({
    actor,
    action: "SERVICE_CREATED",
    entity: "Service",
    entityId: svc.id,
    summary: `Servicio creado: ${parsed.data.name}`,
  });
  revalidatePath("/admin/servicios");
  return svc.id;
}

export async function renameServiceAction(id: string, name: string) {
  const actor = await assertOwner();
  const parsed = serviceSchema.pick({ name: true }).safeParse({ name });
  if (!parsed.success) invalid(parsed.error.issues[0]?.message);
  await updateService(id, { name: parsed.data.name });
  await logAudit({
    actor,
    action: "SERVICE_UPDATED",
    entity: "Service",
    entityId: id,
    summary: `Servicio renombrado a: ${parsed.data.name}`,
  });
  revalidatePath(`/admin/servicios/${id}`);
}

export async function toggleServiceVisibleAction(id: string, visible: boolean) {
  const actor = await assertOwner();
  await updateService(id, { visible });
  await logAudit({
    actor,
    action: "SERVICE_UPDATED",
    entity: "Service",
    entityId: id,
    summary: `Servicio marcado como ${visible ? "visible" : "oculto"}`,
    diff: { after: { visible } },
  });
  revalidatePath("/admin/servicios");
}

export async function reorderFlowStepsAction(serviceId: string, orderedIds: string[]) {
  const actor = await assertOwner();
  const parsed = reorderSchema.safeParse({ orderedIds });
  if (!parsed.success) invalid(parsed.error.issues[0]?.message);
  await reorderFlowSteps(serviceId, parsed.data.orderedIds);
  await logAudit({
    actor,
    action: "FLOW_STEPS_REORDERED",
    entity: "Service",
    entityId: serviceId,
    summary: `Pasos del flujo reordenados (${parsed.data.orderedIds.length})`,
  });
  revalidatePath(`/admin/servicios/${serviceId}`);
}

export async function addFlowStepAction(
  serviceId: string,
  data: { title: string; description?: string; stage: OrderStage; visible: boolean }
) {
  const actor = await assertOwner();
  const parsed = flowStepSchema
    .pick({ title: true, description: true, stage: true, visible: true })
    .safeParse(data);
  if (!parsed.success) invalid(parsed.error.issues[0]?.message);
  await addFlowStep(serviceId, { ...parsed.data, custom: true });
  await logAudit({
    actor,
    action: "FLOW_STEP_ADDED",
    entity: "Service",
    entityId: serviceId,
    summary: `Paso agregado al flujo: "${parsed.data.title}"`,
  });
  revalidatePath(`/admin/servicios/${serviceId}`);
}

export async function updateFlowStepAction(
  serviceId: string,
  stepId: string,
  data: { title?: string; description?: string; stage?: OrderStage; visible?: boolean }
) {
  const actor = await assertOwner();
  const parsed = flowStepSchema
    .pick({ title: true, description: true, stage: true, visible: true })
    .partial()
    .safeParse(data);
  if (!parsed.success) invalid(parsed.error.issues[0]?.message);
  await updateFlowStep(stepId, parsed.data);
  await logAudit({
    actor,
    action: "FLOW_STEP_UPDATED",
    entity: "FlowStep",
    entityId: stepId,
    summary: `Paso del flujo actualizado`,
    diff: { after: parsed.data },
  });
  revalidatePath(`/admin/servicios/${serviceId}`);
}

export async function deleteFlowStepAction(serviceId: string, stepId: string) {
  const actor = await assertOwner();
  await deleteFlowStep(stepId);
  await logAudit({
    actor,
    action: "FLOW_STEP_DELETED",
    entity: "FlowStep",
    entityId: stepId,
    summary: `Paso del flujo eliminado`,
  });
  revalidatePath(`/admin/servicios/${serviceId}`);
}

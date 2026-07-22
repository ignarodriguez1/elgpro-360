"use server";

import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  reorderServices,
  reorderFlowSteps,
  addFlowStep,
  updateFlowStep,
  deleteFlowStep,
  createService,
  updateService,
  addServiceImages,
  reorderServiceImages,
  setServiceImageCover,
  updateServiceImageAlt,
  deleteServiceImage,
  MAX_SERVICE_IMAGES,
} from "@/services/service.service";
import { deleteAssetsBestEffort } from "@/services/storage/asset-cleanup";
import { logAudit, type AuditActor } from "@/services/audit.service";
import { serviceSchema, flowStepSchema, reorderSchema } from "@/lib/validations";
import type { OrderStage } from "@/generated/prisma/client";

// Contenido web (servicios) es solo del dueño (ADMIN), no del operario (STAFF).
async function assertOwner(): Promise<AuditActor> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("No autorizado");
  }
  return { id: user.id, email: user.email };
}

function invalid(message: string | undefined): never {
  throw new Error(message ?? "Datos inválidos");
}

/**
 * Cinturón anti-caché hacia el público (informe §B.4.4): hoy las páginas
 * públicas son force-dynamic y esto es redundante — pero el día que se optimice
 * el caching, sin esto los cambios del admin dejarían de verse SIN ningún
 * error. Trabajos y tutoriales ya siguen este patrón. Se llama en TODA
 * mutación de servicio.
 */
function revalidatePublicServices() {
  revalidatePath("/");
  revalidatePath("/servicios");
  revalidatePath("/servicios/[slug]", "page");
}

/** slug url-safe a partir del nombre; sufijo incremental si ya existe (patrón Tutorial). */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

/**
 * Se usa SOLO al crear: el slug nace con el servicio y NO cambia al renombrar
 * (renombrar no puede romper URLs indexadas ni links compartidos).
 */
async function uniqueServiceSlug(base: string): Promise<string> {
  const root = slugify(base) || "servicio";
  let slug = root;
  let n = 1;
  while (true) {
    const hit = await prisma.service.findUnique({ where: { slug }, select: { id: true } });
    if (!hit) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
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
  revalidatePublicServices();
}

export async function createServiceAction(name: string) {
  const actor = await assertOwner();
  const parsed = serviceSchema.pick({ name: true }).safeParse({ name });
  if (!parsed.success) invalid(parsed.error.issues[0]?.message);
  // El slug nace con el servicio (regla: renombrar después NO lo cambia).
  const slug = await uniqueServiceSlug(parsed.data.name);
  const svc = await createService({ name: parsed.data.name, slug });
  await logAudit({
    actor,
    action: "SERVICE_CREATED",
    entity: "Service",
    entityId: svc.id,
    summary: `Servicio creado: ${parsed.data.name} (/servicios/${slug})`,
  });
  revalidatePath("/admin/servicios");
  revalidatePublicServices();
  return svc.id;
}

export async function renameServiceAction(id: string, name: string) {
  const actor = await assertOwner();
  const parsed = serviceSchema.pick({ name: true }).safeParse({ name });
  if (!parsed.success) invalid(parsed.error.issues[0]?.message);
  // OJO: renombrar NO toca el slug — las URLs públicas ya compartidas siguen vivas.
  await updateService(id, { name: parsed.data.name });
  await logAudit({
    actor,
    action: "SERVICE_UPDATED",
    entity: "Service",
    entityId: id,
    summary: `Servicio renombrado a: ${parsed.data.name}`,
  });
  revalidatePath(`/admin/servicios/${id}`);
  revalidatePath("/admin/servicios");
  revalidatePublicServices();
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
  revalidatePublicServices();
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
  revalidatePublicServices();
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
  const step = await addFlowStep(serviceId, { ...parsed.data, custom: true });
  await logAudit({
    actor,
    action: "FLOW_STEP_ADDED",
    entity: "Service",
    entityId: serviceId,
    summary: `Paso agregado al flujo: "${parsed.data.title}"`,
  });
  revalidatePath(`/admin/servicios/${serviceId}`);
  revalidatePublicServices();
  // Devuelve el paso creado para que el editor lo agregue a su lista local
  // (patrón optimista, igual que editar/borrar/reordenar).
  return { id: step.id };
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
  revalidatePublicServices();
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
  revalidatePublicServices();
}

// ============ Contenido web del servicio: descripción + galería ============

export async function updateServiceDescriptionAction(id: string, description: string) {
  const actor = await assertOwner();
  const parsed = z.string().trim().max(600, "Máximo 600 caracteres").safeParse(description);
  if (!parsed.success) invalid(parsed.error.issues[0]?.message);
  await updateService(id, { description: parsed.data });
  await logAudit({
    actor,
    action: "SERVICE_UPDATED",
    entity: "Service",
    entityId: id,
    summary: "Descripción del servicio actualizada",
  });
  revalidatePath(`/admin/servicios/${id}`);
  revalidatePublicServices();
}

const ServiceImagesInput = z
  .array(
    z.object({
      url: z.string().trim().url("URL inválida"),
      // La ref es OBLIGATORIA acá: este flujo nace con el patrón de ciclo de
      // vida completo — no se repite el error histórico de PortfolioWork.
      ref: z.string().trim().min(1, "Falta la referencia de storage"),
    })
  )
  .min(1)
  .max(MAX_SERVICE_IMAGES);

export async function addServiceImagesAction(
  serviceId: string,
  images: { url: string; ref: string }[]
) {
  const actor = await assertOwner();
  const parsed = ServiceImagesInput.safeParse(images);
  if (!parsed.success) invalid(parsed.error.issues[0]?.message);
  const created = await addServiceImages(serviceId, parsed.data);
  await logAudit({
    actor,
    action: "SERVICE_IMAGES_ADDED",
    entity: "Service",
    entityId: serviceId,
    summary: `${created.length} imagen(es) agregadas a la galería`,
  });
  revalidatePath(`/admin/servicios/${serviceId}`);
  revalidatePublicServices();
}

export async function reorderServiceImagesAction(serviceId: string, orderedIds: string[]) {
  const actor = await assertOwner();
  const parsed = reorderSchema.safeParse({ orderedIds });
  if (!parsed.success) invalid(parsed.error.issues[0]?.message);
  await reorderServiceImages(serviceId, parsed.data.orderedIds);
  await logAudit({
    actor,
    action: "SERVICE_IMAGES_REORDERED",
    entity: "Service",
    entityId: serviceId,
    summary: `Galería reordenada (${parsed.data.orderedIds.length} imágenes)`,
  });
  revalidatePath(`/admin/servicios/${serviceId}`);
  revalidatePublicServices();
}

export async function setServiceCoverAction(serviceId: string, imageId: string) {
  const actor = await assertOwner();
  await setServiceImageCover(serviceId, imageId);
  await logAudit({
    actor,
    action: "SERVICE_COVER_SET",
    entity: "Service",
    entityId: serviceId,
    summary: "Portada de la galería cambiada",
  });
  revalidatePath(`/admin/servicios/${serviceId}`);
  revalidatePublicServices();
}

export async function updateServiceImageAltAction(
  serviceId: string,
  imageId: string,
  alt: string
) {
  const actor = await assertOwner();
  const parsed = z.string().trim().max(160, "Máximo 160 caracteres").safeParse(alt);
  if (!parsed.success) invalid(parsed.error.issues[0]?.message);
  await updateServiceImageAlt(serviceId, imageId, parsed.data || null);
  await logAudit({
    actor,
    action: "SERVICE_IMAGE_ALT_UPDATED",
    entity: "Service",
    entityId: serviceId,
    summary: "Texto alternativo de imagen actualizado",
  });
  revalidatePath(`/admin/servicios/${serviceId}`);
  revalidatePublicServices();
}

export async function deleteServiceImageAction(serviceId: string, imageId: string) {
  const actor = await assertOwner();
  // Negocio primero (fila + posible promoción de portada + audit)…
  const { ref } = await deleteServiceImage(serviceId, imageId);
  await logAudit({
    actor,
    action: "SERVICE_IMAGE_DELETED",
    entity: "Service",
    entityId: serviceId,
    summary: "Imagen eliminada de la galería",
  });
  // …bucket después, best-effort (patrón asset-cleanup, jamás rompe la operación).
  await deleteAssetsBestEffort([ref], `deleteServiceImageAction:${serviceId}`);
  revalidatePath(`/admin/servicios/${serviceId}`);
  revalidatePublicServices();
}

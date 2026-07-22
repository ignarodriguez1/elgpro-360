"use server";

import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit, type AuditActor } from "@/services/audit.service";
import { deleteAssetsBestEffort } from "@/services/storage/asset-cleanup";

// Contenido web (portfolio) es solo del dueño (ADMIN), no del operario (STAFF).
async function assertOwner(): Promise<AuditActor> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("No autorizado");
  }
  return { id: user.id, email: user.email };
}

const WorkInput = z.object({
  title: z.string().trim().min(1, "El título es obligatorio"),
  category: z.string().trim().min(1, "La categoría es obligatoria"),
  description: z.string().trim().optional(),
  beforeImageUrl: z.string().trim().url("URL inválida").optional().or(z.literal("")),
  afterImageUrl: z.string().trim().url("URL inválida").optional().or(z.literal("")),
  // Refs de storage (object name en el bucket): viajan junto a las URLs para
  // habilitar el borrado real del asset. Vacío = sin imagen o dato histórico.
  beforeImageRef: z.string().trim().optional().or(z.literal("")),
  afterImageRef: z.string().trim().optional().or(z.literal("")),
  tint: z.string().trim().optional(),
  tall: z.boolean().optional(),
  visible: z.boolean().optional(),
});

export type WorkInput = z.infer<typeof WorkInput>;

function revalidate() {
  revalidatePath("/admin/trabajos");
  revalidatePath("/trabajos");
}

export async function createWorkAction(raw: WorkInput) {
  const actor = await assertOwner();
  const data = WorkInput.parse(raw);

  const last = await prisma.portfolioWork.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (last?.sortOrder ?? -1) + 1;

  const created = await prisma.portfolioWork.create({
    data: {
      title: data.title,
      category: data.category,
      description: data.description || null,
      beforeImageUrl: data.beforeImageUrl || null,
      afterImageUrl: data.afterImageUrl || null,
      beforeImageRef: data.beforeImageRef || null,
      afterImageRef: data.afterImageRef || null,
      tint: data.tint || null,
      tall: data.tall ?? false,
      visible: data.visible ?? true,
      sortOrder,
    },
  });

  await logAudit({
    actor,
    action: "WORK_CREATED",
    entity: "PortfolioWork",
    entityId: created.id,
    summary: `Trabajo creado: ${created.title}`,
    diff: { after: { title: created.title, category: created.category } },
  });
  revalidate();
  return { id: created.id };
}

export async function updateWorkAction(id: string, raw: WorkInput) {
  const actor = await assertOwner();
  const data = WorkInput.parse(raw);

  // Refs actuales ANTES de pisar la fila: lo que quede reemplazado o quitado
  // se borra del bucket después de que la DB commitee (ver asset-cleanup.ts
  // por el razonamiento del orden: huérfano recuperable > imagen rota).
  const existing = await prisma.portfolioWork.findUnique({
    where: { id },
    select: { beforeImageRef: true, afterImageRef: true },
  });

  const updated = await prisma.portfolioWork.update({
    where: { id },
    data: {
      title: data.title,
      category: data.category,
      description: data.description || null,
      beforeImageUrl: data.beforeImageUrl || null,
      afterImageUrl: data.afterImageUrl || null,
      beforeImageRef: data.beforeImageRef || null,
      afterImageRef: data.afterImageRef || null,
      tint: data.tint || null,
      tall: data.tall ?? false,
      ...(data.visible != null ? { visible: data.visible } : {}),
    },
  });

  await logAudit({
    actor,
    action: "WORK_UPDATED",
    entity: "PortfolioWork",
    entityId: id,
    summary: `Trabajo editado: ${updated.title}`,
    diff: { after: { title: updated.title, category: updated.category } },
  });

  // Negocio completo (update + audit) commiteado → recién ahora el bucket.
  // Reemplazo o quitado: toda ref vieja que ya no esté en la fila nueva es
  // basura. Best-effort: jamás hace fallar el guardado.
  const staleRefs = [
    existing?.beforeImageRef && existing.beforeImageRef !== (data.beforeImageRef || null)
      ? existing.beforeImageRef
      : null,
    existing?.afterImageRef && existing.afterImageRef !== (data.afterImageRef || null)
      ? existing.afterImageRef
      : null,
  ];
  await deleteAssetsBestEffort(staleRefs, `updateWorkAction:${id}`);
  revalidate();
}

export async function deleteWorkAction(id: string) {
  const actor = await assertOwner();
  const existing = await prisma.portfolioWork.findUnique({ where: { id } });
  await prisma.portfolioWork.delete({ where: { id } });

  await logAudit({
    actor,
    action: "WORK_DELETED",
    entity: "PortfolioWork",
    entityId: id,
    summary: `Trabajo eliminado: ${existing?.title ?? id}`,
  });

  // Negocio completo (fila + audit) commiteado → recién ahora los assets.
  // Refs NULL (obras históricas pre-migración) se saltean sin error en el helper.
  await deleteAssetsBestEffort(
    [existing?.beforeImageRef, existing?.afterImageRef],
    `deleteWorkAction:${id}`
  );
  revalidate();
}

export async function toggleWorkAction(id: string, visible: boolean) {
  const actor = await assertOwner();
  await prisma.portfolioWork.update({ where: { id }, data: { visible } });

  await logAudit({
    actor,
    action: "WORK_TOGGLED",
    entity: "PortfolioWork",
    entityId: id,
    summary: `Trabajo marcado como ${visible ? "visible" : "oculto"}`,
    diff: { after: { visible } },
  });
  revalidate();
}

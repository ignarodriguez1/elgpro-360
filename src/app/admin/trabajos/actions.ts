"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit, type AuditActor } from "@/services/audit.service";

// Contenido web (portfolio) es solo del dueño (ADMIN), no del operario (STAFF).
async function assertOwner(): Promise<AuditActor> {
  const session = await auth();
  const user = session?.user;
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

  const updated = await prisma.portfolioWork.update({
    where: { id },
    data: {
      title: data.title,
      category: data.category,
      description: data.description || null,
      beforeImageUrl: data.beforeImageUrl || null,
      afterImageUrl: data.afterImageUrl || null,
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

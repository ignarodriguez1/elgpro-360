"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit, type AuditActor } from "@/services/audit.service";

// Contenido web (tutoriales) es solo del dueño (ADMIN), no del operario (STAFF).
async function assertOwner(): Promise<AuditActor> {
  const session = await auth();
  const user = session?.user;
  if (!user || user.role !== "ADMIN") {
    throw new Error("No autorizado");
  }
  return { id: user.id, email: user.email };
}

/** slug url-safe a partir del título; sufijo incremental si ya existe. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "tutorial";
  let slug = root;
  let n = 1;
  // colisión contra otros registros (no contra sí mismo al editar)
  while (true) {
    const hit = await prisma.tutorial.findUnique({ where: { slug } });
    if (!hit || hit.id === excludeId) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

const TutorialInput = z.object({
  title: z.string().trim().min(1, "El título es obligatorio"),
  category: z.string().trim().min(1, "La categoría es obligatoria"),
  description: z.string().trim().optional(),
  content: z.string().trim().min(1, "El contenido es obligatorio"),
  videoUrl: z.string().trim().url("URL de video inválida").optional().or(z.literal("")),
  visible: z.boolean().optional(),
});

export type TutorialInput = z.infer<typeof TutorialInput>;

export async function createTutorialAction(raw: TutorialInput) {
  const actor = await assertOwner();
  const data = TutorialInput.parse(raw);
  const slug = await uniqueSlug(data.title);

  const created = await prisma.tutorial.create({
    data: {
      title: data.title,
      category: data.category,
      description: data.description || null,
      content: data.content,
      videoUrl: data.videoUrl || null,
      visible: data.visible ?? true,
      slug,
    },
  });

  await logAudit({
    actor,
    action: "TUTORIAL_CREATED",
    entity: "Tutorial",
    entityId: created.id,
    summary: `Tutorial creado: ${created.title}`,
    diff: { after: { title: created.title, category: created.category } },
  });
  revalidatePath("/admin/tutoriales");
  revalidatePath("/tutoriales");
  return { id: created.id };
}

export async function updateTutorialAction(id: string, raw: TutorialInput) {
  const actor = await assertOwner();
  const data = TutorialInput.parse(raw);
  const slug = await uniqueSlug(data.title, id);

  const updated = await prisma.tutorial.update({
    where: { id },
    data: {
      title: data.title,
      category: data.category,
      description: data.description || null,
      content: data.content,
      videoUrl: data.videoUrl || null,
      ...(data.visible != null ? { visible: data.visible } : {}),
      slug,
    },
  });

  await logAudit({
    actor,
    action: "TUTORIAL_UPDATED",
    entity: "Tutorial",
    entityId: id,
    summary: `Tutorial editado: ${updated.title}`,
    diff: { after: { title: updated.title, category: updated.category } },
  });
  revalidatePath("/admin/tutoriales");
  revalidatePath("/tutoriales");
  revalidatePath(`/tutoriales/${slug}`);
}

export async function deleteTutorialAction(id: string) {
  const actor = await assertOwner();
  const existing = await prisma.tutorial.findUnique({ where: { id } });
  await prisma.tutorial.delete({ where: { id } });

  await logAudit({
    actor,
    action: "TUTORIAL_DELETED",
    entity: "Tutorial",
    entityId: id,
    summary: `Tutorial eliminado: ${existing?.title ?? id}`,
  });
  revalidatePath("/admin/tutoriales");
  revalidatePath("/tutoriales");
}

export async function toggleTutorialAction(id: string, visible: boolean) {
  const actor = await assertOwner();
  await prisma.tutorial.update({ where: { id }, data: { visible } });
  await logAudit({
    actor,
    action: "TUTORIAL_TOGGLED",
    entity: "Tutorial",
    entityId: id,
    summary: `Tutorial marcado como ${visible ? "visible" : "oculto"}`,
    diff: { after: { visible } },
  });
  revalidatePath("/admin/tutoriales");
  revalidatePath("/tutoriales");
}

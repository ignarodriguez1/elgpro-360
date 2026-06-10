"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit, type AuditActor } from "@/services/audit.service";

async function assertAdmin(): Promise<AuditActor> {
  const session = await auth();
  const user = session?.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    throw new Error("No autorizado");
  }
  return { id: user.id, email: user.email };
}

export async function toggleTutorialAction(id: string, visible: boolean) {
  const actor = await assertAdmin();
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
}

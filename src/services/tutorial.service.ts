import { prisma } from "@/lib/prisma";

export async function listTutorials(visibleOnly = true) {
  return prisma.tutorial.findMany({
    where: visibleOnly ? { visible: true } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function getTutorialBySlug(slug: string) {
  const tutorial = await prisma.tutorial.findUnique({
    where: { slug },
  });
  if (!tutorial) throw new Error("Tutorial no encontrado");
  return tutorial;
}

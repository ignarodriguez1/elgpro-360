import { requireOwner } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TutorialEditor, type TutorialRow } from "@/components/admin/TutorialEditor";

export default async function AdminTutorialesPage() {
  await requireOwner();
  const tutorials = await prisma.tutorial.findMany({ orderBy: { createdAt: "desc" } });

  const rows: TutorialRow[] = tutorials.map((t) => ({
    id: t.id,
    title: t.title,
    category: t.category,
    description: t.description,
    content: t.content,
    videoUrl: t.videoUrl,
    visible: t.visible,
  }));

  return <TutorialEditor tutorials={rows} />;
}

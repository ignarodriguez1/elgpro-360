import { requireOwner } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TrabajosEditor, type WorkRow } from "@/components/admin/TrabajosEditor";

export default async function AdminTrabajosPage() {
  await requireOwner();
  const works = await prisma.portfolioWork.findMany({ orderBy: { sortOrder: "asc" } });

  const rows: WorkRow[] = works.map((w) => ({
    id: w.id,
    title: w.title,
    category: w.category,
    description: w.description,
    beforeImageUrl: w.beforeImageUrl,
    afterImageUrl: w.afterImageUrl,
    beforeImageRef: w.beforeImageRef,
    afterImageRef: w.afterImageRef,
    tint: w.tint,
    tall: w.tall,
    visible: w.visible,
  }));

  return <TrabajosEditor works={rows} />;
}

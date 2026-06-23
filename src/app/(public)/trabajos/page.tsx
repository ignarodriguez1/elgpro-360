import { prisma } from "@/lib/prisma";
import { TrabajosGallery, type GalleryWork } from "./TrabajosGallery";

export const dynamic = "force-dynamic";

export default async function TrabajosPage() {
  // DB-driven: solo trabajos visibles, ordenados. El ABM del admin se refleja acá.
  const works = await prisma.portfolioWork.findMany({
    where: { visible: true },
    orderBy: { sortOrder: "asc" },
  });

  const rows: GalleryWork[] = works.map((w) => ({
    id: w.id,
    title: w.title,
    category: w.category,
    tint: w.tint,
    tall: w.tall,
    afterImageUrl: w.afterImageUrl,
    beforeImageUrl: w.beforeImageUrl,
    description: w.description,
  }));

  // Categorías derivadas de la data real (no hardcodeadas) + "Todos".
  const cats = ["Todos", ...Array.from(new Set(rows.map((w) => w.category)))];

  return <TrabajosGallery works={rows} cats={cats} />;
}

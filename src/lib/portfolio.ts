import { prisma } from "@/lib/prisma";

/**
 * Forma pública de un trabajo del portfolio (mapeo del modelo PortfolioWork).
 * Único origen de verdad del tipo: lo consumen la galería de /trabajos, la pila
 * del home (WorkStack) y sus lightbox. Serializable server→client (solo primitivos).
 */
export interface GalleryWork {
  id: string;
  title: string;
  category: string;
  tint: string | null;
  tall: boolean;
  afterImageUrl: string | null;
  beforeImageUrl: string | null;
  description: string | null;
}

/**
 * Trabajos del portfolio VISIBLES y ordenados (respeta el ABM del admin: `visible`
 * + `sortOrder`), mapeados a `GalleryWork`. `limit` acota la cantidad para el home
 * (máximo de N cards); sin `limit` devuelve todos (la página /trabajos).
 */
export async function listPortfolioWorks(limit?: number): Promise<GalleryWork[]> {
  const works = await prisma.portfolioWork.findMany({
    where: { visible: true },
    orderBy: { sortOrder: "asc" },
    ...(limit ? { take: limit } : {}),
  });
  return works.map((w) => ({
    id: w.id,
    title: w.title,
    category: w.category,
    tint: w.tint,
    tall: w.tall,
    afterImageUrl: w.afterImageUrl,
    beforeImageUrl: w.beforeImageUrl,
    description: w.description,
  }));
}

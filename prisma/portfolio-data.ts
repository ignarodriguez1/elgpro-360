import type { PrismaClient } from "../src/generated/prisma/client";

const U = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Las 8 obras actuales de /trabajos, para mantener PARIDAD con el contenido hardcodeado. */
export const PORTFOLIO_SEED = [
  { title: "Audi A3 — Repintado integral", category: "Pintura", tint: "rgba(196,30,42,.22)", img: "1486006920555-c77dcf18193c", tall: true },
  { title: "BMW Serie 3 — Ceramic + corrección", category: "Detail", tint: "rgba(34,197,94,.16)", img: "1552519507-da3b142c6e3d", tall: false },
  { title: "Ford Mustang 68 — Restauración", category: "Restauración", tint: "rgba(245,158,11,.18)", img: "1494976388531-d1058494cdd8", tall: false },
  { title: "VW Golf GTI — Wrap mate", category: "Personalizado", tint: "rgba(80,140,255,.16)", img: "1503376780353-7e6692767b70", tall: true },
  { title: "Mercedes C200 — Detail full", category: "Detail", tint: "rgba(196,30,42,.14)", img: "1542362567-b07e54358753", tall: false },
  { title: "Toyota Hilux — Pintura parcial", category: "Pintura", tint: "rgba(196,30,42,.20)", img: "1487754180451-c456f719a1fc", tall: false },
  { title: "Fiat 600 — Recuperación clásica", category: "Restauración", tint: "rgba(245,158,11,.16)", img: "1492144534655-ae79c964c9d7", tall: true },
  { title: "Llantas — Negro satinado", category: "Personalizado", tint: "rgba(255,255,255,.10)", img: "1619642751034-765dfdf7c58e", tall: false },
];

const DESC =
  "Trabajo realizado íntegramente en taller, documentado paso a paso. Igualación de color computarizada y control de calidad final.";

/**
 * Siembra el portfolio SOLO si la tabla está vacía (idempotente). Para paridad,
 * before/after apuntan a la misma imagen (igual que el lightbox actual); el dueño
 * puede subir una foto real de "antes" desde el ABM.
 */
export async function seedPortfolio(prisma: PrismaClient) {
  const count = await prisma.portfolioWork.count();
  if (count > 0) return { skipped: true, count };

  await prisma.portfolioWork.createMany({
    data: PORTFOLIO_SEED.map((w, i) => ({
      title: w.title,
      category: w.category,
      description: DESC,
      afterImageUrl: U(w.img),
      beforeImageUrl: U(w.img),
      tint: w.tint,
      tall: w.tall,
      visible: true,
      sortOrder: i,
    })),
  });
  return { created: PORTFOLIO_SEED.length };
}

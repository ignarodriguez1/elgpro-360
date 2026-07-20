import { listPortfolioWorks } from "@/lib/portfolio";
import { TrabajosGallery } from "./TrabajosGallery";

export const dynamic = "force-dynamic";

export default async function TrabajosPage() {
  // DB-driven: solo trabajos visibles, ordenados. El ABM del admin se refleja acá.
  const rows = await listPortfolioWorks();

  // Categorías derivadas de la data real (no hardcodeadas) + "Todos".
  const cats = ["Todos", ...Array.from(new Set(rows.map((w) => w.category)))];

  return <TrabajosGallery works={rows} cats={cats} />;
}

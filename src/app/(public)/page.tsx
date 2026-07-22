import { HomeDesktop } from "@/components/public/HomeDesktop";
import { HomeMobile } from "@/components/public/HomeMobile";
import { Intro } from "@/components/public/Intro";
import { serviceVisual, type ServiceItem } from "@/lib/public-data";
import { listServices } from "@/services/service.service";
import { listPortfolioWorks } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

// Máximo de trabajos que muestra la pila del home (puede haber N cargados en el ABM).
const HOME_WORKS_MAX = 8;

export default async function HomePage() {
  // "Servicios destacados": los primeros 4 visibles (respeta orden y toggle del admin).
  // "Trabajos realizados": los primeros 8 visibles del portfolio real (mismo origen que
  // /trabajos) — la pila del home refleja el ABM, no data fija.
  const [services, works] = await Promise.all([
    listServices(false),
    listPortfolioWorks(HOME_WORKS_MAX),
  ]);
  const featured: ServiceItem[] = services.slice(0, 4).map((s, i) => {
    const v = serviceVisual(s.name, i);
    return {
      name: s.name,
      desc: s.description ?? "",
      icon: v.icon,
      tint: v.tint,
      // Portada real de la galería > imageUrl legado > fallback hardcodeado —
      // misma convivencia que las cards de /servicios (sin huecos si no hay fotos).
      img: s.images[0]?.url || s.imageUrl || v.img || "",
    };
  });

  return (
    <>
      <Intro />
      <div className="only-desktop"><HomeDesktop featured={featured} works={works} /></div>
      <div className="only-mobile"><HomeMobile featured={featured} works={works} /></div>
    </>
  );
}

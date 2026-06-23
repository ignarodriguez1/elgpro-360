import { HomeDesktop } from "@/components/public/HomeDesktop";
import { HomeMobile } from "@/components/public/HomeMobile";
import { serviceVisual, type ServiceItem } from "@/lib/public-data";
import { listServices } from "@/services/service.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // "Servicios destacados": los primeros 4 visibles (respeta orden y toggle del admin).
  const services = await listServices(true);
  const featured: ServiceItem[] = services.slice(0, 4).map((s, i) => {
    const v = serviceVisual(s.name, i);
    return {
      name: s.name,
      desc: s.description ?? "",
      icon: v.icon,
      tint: v.tint,
      img: s.imageUrl || v.img || "",
    };
  });

  return (
    <>
      <div className="only-desktop"><HomeDesktop featured={featured} /></div>
      <div className="only-mobile"><HomeMobile featured={featured} /></div>
    </>
  );
}

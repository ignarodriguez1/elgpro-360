import { requireOwner } from "@/lib/session";
import { listServices } from "@/services/service.service";
import { ServicesList } from "@/components/admin/ServicesList";

export default async function AdminServiciosPage() {
  await requireOwner();
  const services = await listServices(true);

  const data = services.map((s) => ({
    id: s.id,
    name: s.name,
    visible: s.visible,
    steps: s.flow.length,
    visibleSteps: s.flow.filter((f) => f.visible).length,
    cover: s.images[0]?.url ?? null,
    photos: s._count.images,
    hasDescription: !!s.description?.trim(),
  }));

  return (
    <div className="apage">
      <ServicesList services={data} />
    </div>
  );
}

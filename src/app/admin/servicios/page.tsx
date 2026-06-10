import { requireAdmin } from "@/lib/session";
import { listServices } from "@/services/service.service";
import { ServicesList } from "@/components/admin/ServicesList";

export default async function AdminServiciosPage() {
  await requireAdmin();
  const services = await listServices(true);

  const data = services.map((s) => ({
    id: s.id,
    name: s.name,
    visible: s.visible,
    steps: s.flow.length,
    visibleSteps: s.flow.filter((f) => f.visible).length,
  }));

  return (
    <div className="apage">
      <ServicesList services={data} />
    </div>
  );
}

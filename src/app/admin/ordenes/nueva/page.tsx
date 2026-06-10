import { requireAdmin } from "@/lib/session";
import { listCustomers } from "@/services/customer.service";
import { listServices } from "@/services/service.service";
import { Wizard } from "@/components/admin/Wizard";

export default async function NuevaOrdenPage() {
  await requireAdmin();

  const [customers, services] = await Promise.all([
    listCustomers(),
    listServices(/* includeHidden = */ false),
  ]);

  // Serializar solo los campos que el wizard necesita (evita pasar objetos Prisma crudos).
  const clientsData = customers.map((u) => ({
    id: u.id,
    name: u.name ?? "",
    email: u.email ?? "",
    phone: u.customerProfile?.phone ?? null,
    vehicles: (u.customerProfile?.vehicles ?? []).map((v) => ({
      id: v.id,
      brand: v.brand,
      model: v.model,
      licensePlate: v.licensePlate,
      year: v.year ?? null,
      color: v.color ?? null,
    })),
  }));

  const servicesData = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description ?? null,
  }));

  return (
    <div className="apage">
      <div className="ahead">
        <div className="ahead-l">
          <h2>Nueva orden</h2>
          <div className="ahead-sub">Completá los pasos para registrar el ingreso del vehículo.</div>
        </div>
      </div>
      <Wizard clients={clientsData} services={servicesData} />
    </div>
  );
}

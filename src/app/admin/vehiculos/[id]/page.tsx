import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getVehicleById } from "@/services/vehicle.service";
import { Icon } from "@/components/shared/Icon";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EditVehicleForm } from "@/components/admin/EditVehicleForm";

export default async function AdminVehiculoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;

  let vehicle;
  try {
    vehicle = await getVehicleById(id, user.id, user.role);
  } catch {
    notFound();
  }

  return (
    <div className="apage">
      <div className="ahead">
        <div className="ahead-l">
          <Link href="/admin/vehiculos" className="alink" style={{ marginBottom: 6, display: "inline-flex", gap: 6, alignItems: "center" }}>
            <Icon name="chevR" size={14} style={{ transform: "rotate(180deg)" }} /> Vehículos
          </Link>
          <h2>{vehicle.brand} {vehicle.model}</h2>
          <div className="ahead-sub mono">{vehicle.licensePlate} · {vehicle.color ?? ""} {vehicle.year ?? ""}</div>
        </div>
      </div>

      <EditVehicleForm
        vehicleId={vehicle.id}
        initial={{
          licensePlate: vehicle.licensePlate,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year ? String(vehicle.year) : "",
          color: vehicle.color ?? "",
          vin: vehicle.vin ?? "",
          notes: vehicle.notes ?? "",
        }}
      />

      <div className="apanel" style={{ padding: 18, marginTop: 16 }}>
        <h3 style={{ fontFamily: "var(--display)", textTransform: "uppercase", marginBottom: 4 }}>Cliente</h3>
        <p style={{ color: "var(--muted-light)" }}>{vehicle.customer.user.name} · {vehicle.customer.user.email}</p>
      </div>

      <div className="apanel" style={{ padding: 18, marginTop: 16 }}>
        <h3 style={{ fontFamily: "var(--display)", textTransform: "uppercase", marginBottom: 12 }}>Órdenes</h3>
        {vehicle.workOrders.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Sin órdenes para este vehículo.</p>
        ) : (
          <table className="atable">
            <thead><tr><th>Código</th><th>Trabajo</th><th>Estado</th></tr></thead>
            <tbody>
              {vehicle.workOrders.map((o) => (
                <tr key={o.id}>
                  <td className="mono"><Link href={`/admin/ordenes/${o.id}`} style={{ color: "var(--primary)", textDecoration: "none" }}>{o.orderCode}</Link></td>
                  <td>{o.title}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

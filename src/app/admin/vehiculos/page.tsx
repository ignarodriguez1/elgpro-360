import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { listAllVehicles } from "@/services/vehicle.service";
import { Icon } from "@/components/shared/Icon";

export default async function AdminVehiculosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const vehicles = await listAllVehicles(q);

  return (
    <div className="apage">
      <div className="ahead">
        <div className="ahead-l">
          <h2>Vehículos</h2>
          <div className="ahead-sub">{vehicles.length} registrados</div>
        </div>
      </div>

      <form className="asearch">
        <Icon name="search" size={17} />
        <input name="q" defaultValue={q ?? ""} placeholder="Buscar por patente, marca o modelo" />
      </form>

      {/* Desktop: tabla */}
      <div className="apanel only-desktop">
        <table className="atable">
          <thead><tr><th>Patente</th><th>Vehículo</th><th>Cliente</th><th>En curso</th></tr></thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td className="mono"><Link href={`/admin/vehiculos/${v.id}`} style={{ color: "var(--primary)", textDecoration: "none" }}>{v.licensePlate}</Link></td>
                <td>{v.brand} {v.model} {v.year ? `· ${v.year}` : ""}</td>
                <td>{v.customer.user.name}</td>
                <td>{v.workOrders.length > 0 ? "Sí" : "—"}</td>
              </tr>
            ))}
            {vehicles.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>Sin vehículos.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="only-mobile">
        <div className="alist">
        {vehicles.map((v) => (
          <Link key={v.id} href={`/admin/vehiculos/${v.id}`} className="alist-card">
            <div className="alist-top">
              <span className="alist-title">{v.brand} {v.model}</span>
              <span className="atable-plate">{v.licensePlate}</span>
            </div>
            <div className="alist-meta">
              <span>{v.customer.user.name}</span>
              {v.year ? <span className="mono">{v.year}</span> : null}
              <span>{v.workOrders.length > 0 ? "En taller" : "Sin orden activa"}</span>
            </div>
          </Link>
        ))}
        {vehicles.length === 0 && <div className="alist-empty">Sin vehículos.</div>}
        </div>
      </div>
    </div>
  );
}

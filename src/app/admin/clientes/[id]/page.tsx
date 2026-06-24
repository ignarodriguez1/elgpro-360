import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getCustomerById } from "@/services/customer.service";
import { Icon } from "@/components/shared/Icon";
import { EditCustomerForm } from "@/components/admin/EditCustomerForm";
import { NewVehicleForm } from "@/components/admin/NewVehicleForm";
import { UserActiveToggle } from "@/components/admin/UserActiveToggle";

export default async function AdminClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;

  let customer;
  try {
    customer = await getCustomerById(id, user.id, user.role);
  } catch {
    notFound();
  }

  const vehicles = customer.customerProfile?.vehicles ?? [];

  return (
    <div className="apage">
      <div className="ahead" data-section="header">
        <div className="ahead-l">
          <Link href="/admin/clientes" className="alink" style={{ marginBottom: 6, display: "inline-flex", gap: 6, alignItems: "center" }}>
            <Icon name="chevR" size={14} style={{ transform: "rotate(180deg)" }} /> Clientes
          </Link>
          <h2>{customer.name}</h2>
          <div className="ahead-sub">{customer.email} · {customer.customerProfile?.phone ?? "sin teléfono"}</div>
        </div>
      </div>

      <div data-section="edit-form">
        <EditCustomerForm
          customerId={customer.id}
          initial={{
            name: customer.name,
            phone: customer.customerProfile?.phone ?? "",
            notes: customer.customerProfile?.notes ?? "",
          }}
        />
      </div>

      {/* Estado de la cuenta — desactivar/activar es solo del dueño (ADMIN). */}
      {user.role === "ADMIN" && (
        <div
          className="apanel"
          style={{ padding: 18, marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}
        >
          <div>
            <div className="afield-label" style={{ marginBottom: 4 }}>Estado de la cuenta</div>
            <p style={{ fontSize: 14, margin: 0, color: customer.active ? "var(--success)" : "#ff5d68" }}>
              {customer.active
                ? "Activa — puede ingresar al portal pidiendo un código."
                : "Desactivada — no puede ingresar; sus sesiones activas se cortan."}
            </p>
          </div>
          <UserActiveToggle userId={customer.id} active={customer.active} />
        </div>
      )}

      <div className="apanel" style={{ padding: 18, marginTop: 16 }} data-section="vehicles-list">
        <h3 style={{ fontFamily: "var(--display)", textTransform: "uppercase", marginBottom: 12 }}>Vehículos</h3>
        {vehicles.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Este cliente no tiene vehículos.</p>
        ) : (
          <>
            {/* Desktop: tabla */}
            <table className="atable only-desktop">
              <thead><tr><th>Vehículo</th><th>Patente</th><th>Órdenes</th></tr></thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="rowlink">
                    <td>
                      <Link href={`/admin/vehiculos/${v.id}`} className="rowlink-a" style={{ textDecoration: "none", color: "inherit" }}>
                        {v.brand} {v.model} {v.year ? `· ${v.year}` : ""}
                      </Link>
                    </td>
                    <td className="mono">{v.licensePlate}</td>
                    <td>{v.workOrders?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>

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
                      {v.year ? <span className="mono">{v.year}</span> : null}
                      <span>{v.workOrders?.length ?? 0} órden(es)</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
        {customer.customerProfile && (
          <div data-section="new-vehicle-form">
            <NewVehicleForm customerProfileId={customer.customerProfile.id} />
          </div>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getCustomerById } from "@/services/customer.service";
import { Icon } from "@/components/shared/Icon";
import { EditCustomerForm } from "@/components/admin/EditCustomerForm";
import { NewVehicleForm } from "@/components/admin/NewVehicleForm";

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
      <div className="ahead">
        <div className="ahead-l">
          <Link href="/admin/clientes" className="alink" style={{ marginBottom: 6, display: "inline-flex", gap: 6, alignItems: "center" }}>
            <Icon name="chevR" size={14} style={{ transform: "rotate(180deg)" }} /> Clientes
          </Link>
          <h2>{customer.name}</h2>
          <div className="ahead-sub">{customer.email} · {customer.customerProfile?.phone ?? "sin teléfono"}</div>
        </div>
      </div>

      <EditCustomerForm
        customerId={customer.id}
        initial={{
          name: customer.name,
          phone: customer.customerProfile?.phone ?? "",
          notes: customer.customerProfile?.notes ?? "",
        }}
      />

      <div className="apanel" style={{ padding: 18, marginTop: 16 }}>
        <h3 style={{ fontFamily: "var(--display)", textTransform: "uppercase", marginBottom: 12 }}>Vehículos</h3>
        {vehicles.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Este cliente no tiene vehículos.</p>
        ) : (
          <table className="atable">
            <thead><tr><th>Vehículo</th><th>Patente</th><th>Órdenes</th></tr></thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>
                    <Link href={`/admin/vehiculos/${v.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      {v.brand} {v.model} {v.year ? `· ${v.year}` : ""}
                    </Link>
                  </td>
                  <td className="mono">{v.licensePlate}</td>
                  <td>{v.workOrders?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {customer.customerProfile && (
          <NewVehicleForm customerProfileId={customer.customerProfile.id} />
        )}
      </div>
    </div>
  );
}

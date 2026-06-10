import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { listWorkOrders } from "@/services/work-order.service";
import { Icon } from "@/components/shared/Icon";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { STAGE_LABELS } from "@/lib/stages";
import type { WorkOrderStatus } from "@/generated/prisma/client";

const FILTERS = [
  { key: "activas", label: "Activas" },
  { key: "completadas", label: "Completadas" },
  { key: "todas", label: "Todas" },
];

export default async function AdminOrdenesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  await requireAdmin();
  const { filtro = "activas" } = await searchParams;

  const all = await listWorkOrders({});
  const orders = all.filter((o) => {
    if (filtro === "completadas") return o.status === "ENTREGADO";
    if (filtro === "todas") return true;
    return o.status === "PROCESO" || o.status === "LISTO";
  });

  return (
    <div className="apage">
      <div className="ahead">
        <div className="ahead-l">
          <h2>Órdenes</h2>
          <div className="ahead-sub">{orders.length} órdenes</div>
        </div>
        <Link href="/admin/ordenes/nueva" className="abtn abtn-primary">
          <Icon name="plus" size={17} /> Nueva orden
        </Link>
      </div>

      <div className="filters" style={{ marginBottom: 18 }}>
        {FILTERS.map((f) => (
          <Link key={f.key} href={`/admin/ordenes?filtro=${f.key}`} className={"chip" + (filtro === f.key ? " active" : "")}>
            {f.label}
          </Link>
        ))}
      </div>

      {/* Desktop: tabla */}
      <div className="apanel only-desktop">
        <table className="atable">
          <thead>
            <tr><th>Código</th><th>Vehículo</th><th>Cliente</th><th>Etapa</th><th>Estado</th><th>Entrega</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="mono"><Link href={`/admin/ordenes/${o.id}`} style={{ color: "var(--primary)", textDecoration: "none" }}>{o.orderCode}</Link></td>
                <td>
                  <div className="atable-veh">
                    <span className="atable-plate mono">{o.vehicle.licensePlate}</span>
                    {o.vehicle.brand} {o.vehicle.model}
                  </div>
                </td>
                <td>{o.vehicle.customer.user.name}</td>
                <td><span className="astage-mini">{STAGE_LABELS[o.stage]}</span></td>
                <td><StatusBadge status={o.status as WorkOrderStatus} /></td>
                <td className="mono">{o.estimatedDeliveryDate ? new Date(o.estimatedDeliveryDate).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : "—"}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>Sin órdenes en este filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="only-mobile">
        <div className="alist">
        {orders.map((o) => (
          <Link key={o.id} href={`/admin/ordenes/${o.id}`} className="alist-card">
            <div className="alist-top">
              <span className="alist-title"><span className="atable-plate">{o.vehicle.licensePlate}</span>{o.vehicle.brand} {o.vehicle.model}</span>
              <StatusBadge status={o.status as WorkOrderStatus} />
            </div>
            <div className="alist-meta">
              <span className="mono">{o.orderCode}</span>
              <span>{o.vehicle.customer.user.name}</span>
              <span>{STAGE_LABELS[o.stage]}</span>
              <span className="mono">{o.estimatedDeliveryDate ? new Date(o.estimatedDeliveryDate).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : "—"}</span>
            </div>
          </Link>
        ))}
        {orders.length === 0 && <div className="alist-empty">Sin órdenes en este filtro.</div>}
        </div>
      </div>
    </div>
  );
}

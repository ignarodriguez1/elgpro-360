import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { listWorkOrders } from "@/services/work-order.service";
import { listCustomers } from "@/services/customer.service";
import { Icon } from "@/components/shared/Icon";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { STAGE_LABELS } from "@/lib/stages";
import { TallerOrdersList, type TallerOrder } from "@/components/admin/TallerOrdersList";

function fmtEta(d: Date | string | null | undefined) {
  return d ? new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : null;
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  const [orders, customers] = await Promise.all([listWorkOrders({}), listCustomers()]);

  const now = new Date();
  const activas = orders.filter((o) => o.status === "PROCESO" || o.status === "LISTO");
  const enTaller = orders.filter((o) => o.status === "PROCESO").length;
  const completadasMes = orders.filter(
    (o) =>
      o.status === "ENTREGADO" &&
      o.actualDeliveryDate &&
      new Date(o.actualDeliveryDate).getMonth() === now.getMonth() &&
      new Date(o.actualDeliveryDate).getFullYear() === now.getFullYear()
  ).length;

  const stats = [
    { icon: "car" as const, label: "Vehículos en taller", value: enTaller, tint: "rgba(80,140,255,.14)", col: "#7aa2ff" },
    { icon: "clipboard" as const, label: "Órdenes activas", value: activas.length, tint: "rgba(245,158,11,.14)", col: "#fbbf24" },
    { icon: "check" as const, label: "Completadas (mes)", value: completadasMes, tint: "rgba(34,197,94,.14)", col: "#4ade80" },
    { icon: "users" as const, label: "Clientes", value: customers.length, tint: undefined, col: undefined },
  ];

  const tallerOrders: TallerOrder[] = activas.map((o) => ({
    id: o.id,
    orderCode: o.orderCode,
    patente: o.vehicle.licensePlate,
    vehiculo: `${o.vehicle.brand} ${o.vehicle.model}`,
    cliente: o.vehicle.customer.user.name,
    etapa: o.stage,
    estado: o.status,
    eta: fmtEta(o.estimatedDeliveryDate),
  }));

  return (
    <>
    {/* MOBILE — Modo Taller */}
    <div className="only-mobile">
      <TallerOrdersList orders={tallerOrders} adminName={admin.name} />
    </div>

    {/* DESKTOP */}
    <div className="only-desktop apage">
      <div className="ahead">
        <div className="ahead-l">
          <h2>Panel general</h2>
          <div className="ahead-sub">{activas.length} órdenes activas · {enTaller} en taller</div>
        </div>
        <Link href="/admin/ordenes/nueva" className="abtn abtn-primary">
          <Icon name="plus" size={17} /> Nueva orden
        </Link>
      </div>

      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="statcard">
            <div className="statcard-top">
              <span
                className="statcard-ic"
                style={s.tint ? ({ "--ic-tint": s.tint, "--ic-color": s.col } as React.CSSProperties) : undefined}
              >
                <Icon name={s.icon} size={18} />
              </span>
            </div>
            <div className="statcard-value">{s.value}</div>
            <div className="statcard-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="apanel">
        <div className="apanel-head">
          <h3>Órdenes activas</h3>
          <Link href="/admin/ordenes" className="alink">Ver todas</Link>
        </div>
        <table className="atable">
          <thead>
            <tr><th>Orden</th><th>Vehículo</th><th>Cliente</th><th>Etapa</th><th>Estado</th><th>Entrega</th></tr>
          </thead>
          <tbody>
            {activas.map((o) => (
              <tr key={o.id}>
                <td className="mono">{o.orderCode}</td>
                <td>
                  <Link href={`/admin/ordenes/${o.id}`} className="atable-veh" style={{ textDecoration: "none", color: "inherit" }}>
                    <span className="atable-plate mono">{o.vehicle.licensePlate}</span>
                    {o.vehicle.brand} {o.vehicle.model}
                  </Link>
                </td>
                <td>{o.vehicle.customer.user.name}</td>
                <td><span className="astage-mini">{STAGE_LABELS[o.stage]}</span></td>
                <td><StatusBadge status={o.status} /></td>
                <td className="mono">{o.estimatedDeliveryDate ? new Date(o.estimatedDeliveryDate).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : "—"}</td>
              </tr>
            ))}
            {activas.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>No hay órdenes activas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}

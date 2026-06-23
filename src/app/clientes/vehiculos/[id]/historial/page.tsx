import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCustomer } from "@/lib/session";
import { getVehicleById } from "@/services/vehicle.service";
import { listWorkOrders } from "@/services/work-order.service";
import { Icon } from "@/components/shared/Icon";

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

export default async function HistorialVehiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCustomer();
  const { id } = await params;

  let vehicle;
  try {
    vehicle = await getVehicleById(id, user.id, user.role);
  } catch {
    notFound();
  }

  const orders = await listWorkOrders({
    vehicleId: id,
    status: "ENTREGADO",
    requestingUserId: user.id,
    requestingRole: user.role,
  });

  const empty = (
    <div className="empty-state">
      <span className="empty-state-ic"><Icon name="clock" size={24} /></span>
      <div className="empty-state-title">Sin historial</div>
      <div className="empty-state-desc">Todavía no hay trabajos completados para este vehículo.</div>
    </div>
  );

  return (
    <>
      {/* MOBILE */}
      <div className="only-mobile p-scroll">
        <div className="p-greet" style={{ paddingTop: 4 }}>
          <div className="p-greet-name" style={{ fontSize: 30 }}>Historial</div>
          <div className="p-greet-sub">{vehicle.brand} {vehicle.model} · {vehicle.licensePlate}</div>
        </div>
        <div className="p-sec-label">
          <h3>Completados</h3>
          <span className="p-sec-count" data-section="jobs-counter">{orders.length} {orders.length === 1 ? "trabajo" : "trabajos"}</span>
        </div>
        {orders.length === 0 ? empty : (
          <div className="hist-list">
            {orders.map((o, i) => (
              <Link key={o.id} href={`/clientes/vehiculos/${id}/orden/${o.id}`} className="hist-card p-rise" style={{ animationDelay: `${i * 60}ms`, textDecoration: "none" }} data-section="job-card-link">
                <span className="hist-ic"><Icon name="check" size={20} stroke={2.4} /></span>
                <div className="hist-main">
                  <div className="hist-title">{o.title}</div>
                  <div className="hist-meta">{o.servicesRequested.length > 0 ? o.servicesRequested.join(" · ") : o.orderCode}</div>
                </div>
                <span className="hist-date">{fmtDate(o.actualDeliveryDate ?? o.createdAt)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* DESKTOP */}
      <div className="only-desktop">
        <div className="pw-wrap">
          <div className="pw-back"><Link href={`/clientes/vehiculos/${id}`} className="pw-link"><Icon name="chevR" size={18} style={{ transform: "rotate(180deg)" }} /> Volver al vehículo</Link></div>
          <div className="pw-greet pw-rise">
            <div className="pw-greet-name" style={{ fontSize: 44 }}>Historial</div>
            <div className="pw-greet-sub">{vehicle.brand} {vehicle.model} · {vehicle.licensePlate}</div>
          </div>
          <div className="pw-sec"><h3>Completados</h3><span className="pwv-foot-l" data-section="jobs-counter">{orders.length} {orders.length === 1 ? "trabajo" : "trabajos"}</span></div>
          {orders.length === 0 ? empty : (
            <div className="pwh-grid">
              {orders.map((o, i) => (
                <Link key={o.id} href={`/clientes/vehiculos/${id}/orden/${o.id}`} className="pwh-card pw-rise" style={{ animationDelay: `${i * 60}ms`, textDecoration: "none" }} data-section="job-card-link">
                  <span className="pwh-ic"><Icon name="check" size={22} stroke={2.4} /></span>
                  <div className="pwh-main">
                    <div className="pwh-title">{o.title}</div>
                    <div className="pwh-meta">{o.servicesRequested.length > 0 ? o.servicesRequested.join(" · ") : o.orderCode}</div>
                  </div>
                  <span className="pwh-date">{fmtDate(o.actualDeliveryDate ?? o.createdAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

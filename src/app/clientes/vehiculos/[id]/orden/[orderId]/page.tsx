import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCustomer } from "@/lib/session";
import { getWorkOrderById } from "@/services/work-order.service";
import { Icon } from "@/components/shared/Icon";
import { Timeline } from "@/components/shared/Timeline";
import { StageDurations } from "@/components/shared/StageDurations";
import { ClosedRecordTag } from "@/components/customer/ClosedRecordTag";
import { projectUpdateForCustomer } from "@/lib/order-live";
import type { WorkOrderStatus } from "@/generated/prisma/client";

function fmtFull(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Detalle (solo lectura) de una OT ya entregada. Resuelve el dead-end (TE4):
 * el historial linkea acá en vez de a la OT activa. Reusa `getWorkOrderById`,
 * que valida pertenencia del cliente y filtra los pasos visibles.
 */
export default async function OrdenEntregadaPage({
  params,
}: {
  params: Promise<{ id: string; orderId: string }>;
}) {
  const user = await requireCustomer();
  const { id, orderId } = await params;

  let order;
  try {
    order = await getWorkOrderById(orderId, user.id, user.role);
  } catch {
    notFound();
  }

  // La OT tiene que pertenecer a este vehículo (URL honesta).
  if (order.vehicleId !== id) notFound();

  const vehicle = order.vehicle;
  const delivered = order.status === "ENTREGADO";
  const deliveryDate = order.actualDeliveryDate ?? order.updatedAt;
  const budgetTotal = order.budgetAmount != null
    ? `$${Number(order.budgetAmount).toLocaleString("es-AR")}`
    : null;

  // Proyección segura: sin createdBy ni notas internas (igual que el seam vivo).
  // El nombre del staff no viaja al cliente tampoco en la vista histórica.
  const updates = order.statusUpdates.map(projectUpdateForCustomer);

  const closedMobile = (
    <div className="od-blocks">
      <div className="od-block" data-section="delivered-banner">
        <div className="od-block-h"><Icon name="check" size={15} /> {delivered ? "Trabajo entregado" : "Trabajo finalizado"}</div>
        <div className="od-kv"><span className="od-kv-k">{delivered ? "Entregado" : "Código"}</span><span className="od-kv-v">{delivered ? fmtFull(deliveryDate) : order.orderCode}</span></div>
        {budgetTotal && <div className="od-kv"><span className="od-kv-k">Total</span><span className="od-kv-v mono">{budgetTotal}</span></div>}
      </div>
    </div>
  );

  const closedDesktop = (
    <div className="pwsb" data-section="delivered-banner" style={{ marginBottom: 16 }}>
      <div className="pwsb-h"><Icon name="check" size={15} /> {delivered ? "Trabajo entregado" : "Trabajo finalizado"}</div>
      <div className="pwsb-row"><span className="pwsb-k">{delivered ? "Entregado" : "Código"}</span><span className="pwsb-v">{delivered ? fmtFull(deliveryDate) : order.orderCode}</span></div>
      {budgetTotal && <div className="pwsb-row"><span className="pwsb-k">Total</span><span className="pwsb-v mono">{budgetTotal}</span></div>}
    </div>
  );

  return (
    <>
      {/* MOBILE */}
      <div className="only-mobile p-scroll">
        <div className="p-greet" style={{ paddingTop: 4 }}>
          <Link href={`/clientes/vehiculos/${id}/historial`} className="pw-link" style={{ fontSize: 13 }}>
            <Icon name="chevR" size={16} style={{ transform: "rotate(180deg)" }} /> Historial
          </Link>
          <div className="p-greet-name" style={{ fontSize: 28, marginTop: 8 }}>{order.title}</div>
          <div className="p-greet-sub">{vehicle.brand} {vehicle.model} · {vehicle.licensePlate}</div>
        </div>
        {closedMobile}
        <div className="tl-head"><ClosedRecordTag /><h3>Seguimiento del trabajo</h3></div>
        <Timeline updates={updates} mode="customer" orderStatus={order.status as WorkOrderStatus} />
        <div className="od-blocks">
          <StageDurations updates={order.statusUpdates} orderStatus={order.status as WorkOrderStatus} variant="mobile" />
        </div>
        {order.servicesRequested.length > 0 && (
          <div className="od-blocks">
            <div className="od-block" data-section="services">
              <div className="od-block-h"><Icon name="spray" size={15} /> Servicios realizados</div>
              <div className="od-chips">{order.servicesRequested.map((s, i) => <span className="od-chip" key={i}>{s}</span>)}</div>
            </div>
          </div>
        )}
        <div style={{ height: 30 }} />
      </div>

      {/* DESKTOP */}
      <div className="only-desktop">
        <div className="pw-wrap">
          <div className="pw-back"><Link href={`/clientes/vehiculos/${id}/historial`} className="pw-link"><Icon name="chevR" size={18} style={{ transform: "rotate(180deg)" }} /> Volver al historial</Link></div>
          <div className="pw-greet pw-rise">
            <div className="pw-greet-name" style={{ fontSize: 40 }}>{order.title}</div>
            <div className="pw-greet-sub">{vehicle.brand} {vehicle.model} · {vehicle.licensePlate}</div>
          </div>
          <div className="pwod">
            <div className="pwod-main">
              {closedDesktop}
              <Timeline updates={updates} mode="customer" variant="panel" orderStatus={order.status as WorkOrderStatus} liveSlot={<ClosedRecordTag />} />
            </div>
            <div className="pwod-side">
              <div className="pwsb" data-section="vehicle-data">
                <div className="pwsb-h"><Icon name="car" size={15} /> Vehículo</div>
                <div className="pwsb-row"><span className="pwsb-k">Modelo</span><span className="pwsb-v">{vehicle.brand} {vehicle.model}</span></div>
                <div className="pwsb-row"><span className="pwsb-k">Patente</span><span className="pwsb-v mono">{vehicle.licensePlate}</span></div>
                {vehicle.color && <div className="pwsb-row"><span className="pwsb-k">Color</span><span className="pwsb-v">{vehicle.color}</span></div>}
                {vehicle.year && <div className="pwsb-row"><span className="pwsb-k">Año</span><span className="pwsb-v mono">{vehicle.year}</span></div>}
              </div>
              <StageDurations updates={order.statusUpdates} orderStatus={order.status as WorkOrderStatus} variant="desktop" />
              {order.servicesRequested.length > 0 && (
                <div className="pwsb">
                  <div className="pwsb-h"><Icon name="spray" size={15} /> Servicios realizados</div>
                  <div className="pwsb-chips">{order.servicesRequested.map((s, i) => <span className="pwsb-chip" key={i}>{s}</span>)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { requireCustomer } from "@/lib/session";
import { getWorkOrderById } from "@/services/work-order.service";
import { getVehicleById } from "@/services/vehicle.service";
import { stageIndex, STAGE_ORDER, STAGE_LABELS } from "@/lib/stages";
import { Photo } from "@/components/shared/Photo";
import { Icon } from "@/components/shared/Icon";
import { StageBar } from "@/components/shared/StageBar";
import { StageDurations } from "@/components/shared/StageDurations";
import { ReadyBanner } from "@/components/shared/ReadyBanner";
import { OrderLiveProvider } from "@/components/customer/OrderLiveProvider";
import { CustomerTimeline } from "@/components/customer/CustomerTimeline";
import { ConnectionIndicator } from "@/components/customer/ConnectionIndicator";
import { PullToRefresh } from "@/components/customer/PullToRefresh";
import { InProgressBadge } from "@/components/customer/InProgressBadge";
import { projectUpdateForCustomer } from "@/lib/order-live";
import { fmtDayMonth } from "@/lib/format";

const CARE_TIPS = [
  { cat: "Exterior", title: "Cómo lavar tu auto correctamente", tint: "rgba(196,30,42,.2)" },
  { cat: "Interior", title: "Limpieza de tapizados y alfombras", tint: "rgba(30,60,196,.2)" },
  { cat: "Pintura", title: "Aplicación de cera protectora", tint: "rgba(196,120,30,.2)" },
];

const fmtD = fmtDayMonth;

export default async function VehiculoClientePage({
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

  const activeOrder = vehicle.workOrders.find((o) => o.status === "PROCESO" || o.status === "LISTO");
  let order = null;
  if (activeOrder) {
    try { order = await getWorkOrderById(activeOrder.id, user.id, user.role); } catch { order = null; }
  }
  const isReady = order?.status === "LISTO";
  const budgetTotal = order?.budgetAmount != null ? `$${Number(order.budgetAmount).toLocaleString("es-AR")}` : null;
  const idx = order ? (isReady ? STAGE_ORDER.length : stageIndex(order.stage)) : 0;
  const stageName = order?.stage ? STAGE_LABELS[order.stage] : null;
  const eta = order?.estimatedDeliveryDate ? fmtD(order.estimatedDeliveryDate) : null;

  // Semilla del seam (proyección segura: sin createdBy ni notas internas).
  const liveOrder = order
    ? { id: order.id, status: order.status, stage: order.stage, title: order.title }
    : null;
  const liveUpdates = order ? order.statusUpdates.map(projectUpdateForCustomer) : [];

  const body = (
    <>
      {/* MOBILE */}
      <div className="only-mobile p-scroll">
        <PullToRefresh>
        <div className="od-hero">
          <Photo label={`${vehicle.brand} ${vehicle.model}`} className="od-hero-photo" tint="rgba(196,30,42,.2)" />
          <div className="od-hero-grad" />
          <div className="od-hero-info">
            <span className="od-hero-plate">{vehicle.licensePlate}</span>
            <div className="od-hero-name">{vehicle.brand} {vehicle.model}</div>
            <div className="od-hero-sub" data-section="hero-subtitle">{[order?.title, vehicle.color, vehicle.year].filter(Boolean).join(" · ")}</div>
          </div>
        </div>
        {order ? (
          <>
            {isReady ? <div data-section="ready-banner"><ReadyBanner total={budgetTotal} /></div> : (
              <div className="od-stage">
                <div className="od-stage-top">
                  <div><div className="od-stage-now">{stageName ?? "En proceso"}</div><div style={{ marginTop: 7 }}><InProgressBadge /></div></div>
                  {eta && <div className="od-stage-eta"><div className="od-stage-eta-n">{eta}</div><div className="od-stage-eta-l">Entrega est.</div></div>}
                </div>
                <StageBar stageIndex={idx} />
              </div>
            )}
            <div className="tl-head"><ConnectionIndicator /><h3>Seguimiento del trabajo</h3></div>
            <CustomerTimeline variant="feed" />
            <div className="od-blocks">
              <StageDurations updates={order.statusUpdates} orderStatus={order.status} variant="mobile" />
            </div>
            <div className="od-blocks">
              {order.servicesRequested.length > 0 && (
                <div className="od-block">
                  <div className="od-block-h"><Icon name="spray" size={15} /> Servicios solicitados</div>
                  <div className="od-chips">{order.servicesRequested.map((s, i) => <span className="od-chip" key={i}>{s}</span>)}</div>
                </div>
              )}
              {order.description && (
                <div className="od-block">
                  <div className="od-block-h"><Icon name="shield" size={15} /> Productos y tratamientos</div>
                  <div className="od-treat"><div className="od-treat-row"><span className="tick"><Icon name="check" size={13} stroke={2.6} /></span>{order.description}</div></div>
                </div>
              )}
            </div>
            <div style={{ height: 30 }} />
          </>
        ) : (
          <div className="od-blocks">
            <div className="od-block" style={{ textAlign: "center", padding: "32px 16px" }}>
              <div style={{ color: "var(--muted)", fontSize: 14 }}>No hay órdenes activas para este vehículo.</div>
              <div style={{ marginTop: 16 }}><Link href={`/clientes/vehiculos/${id}/historial`} className="btn btn-ghost">Ver historial</Link></div>
            </div>
          </div>
        )}
        {/* Paridad con la sidebar desktop: datos del vehículo + cuidados (checkpoint 0, opción A) */}
        <div className="od-blocks" style={{ paddingTop: order ? 0 : 18 }}>
          <div className="od-block" data-section="vehicle-data">
            <div className="od-block-h"><Icon name="car" size={15} /> Vehículo</div>
            <div className="od-kv"><span className="od-kv-k">Modelo</span><span className="od-kv-v">{vehicle.brand} {vehicle.model}</span></div>
            <div className="od-kv"><span className="od-kv-k">Patente</span><span className="od-kv-v mono">{vehicle.licensePlate}</span></div>
            {vehicle.color && <div className="od-kv"><span className="od-kv-k">Color</span><span className="od-kv-v">{vehicle.color}</span></div>}
            {vehicle.year && <div className="od-kv"><span className="od-kv-k">Año</span><span className="od-kv-v mono">{vehicle.year}</span></div>}
          </div>
        </div>
        <div className="od-tutos" data-section="care-tips">
          <div className="od-tutos-h">
            <div className="od-block-h" style={{ marginBottom: 0 }}><Icon name="play" size={15} /> Cuidados recomendados</div>
          </div>
          <div className="od-tutos-scroll">
            {CARE_TIPS.map((t) => (
              <div className="od-tuto" key={t.title}>
                <div className="od-tuto-thumb">
                  <Photo className="od-tuto-img" tint={t.tint} />
                  <span className="od-tuto-play"><Icon name="play" size={16} /></span>
                </div>
                <div className="od-tuto-b">
                  <div className="od-tuto-cat">{t.cat}</div>
                  <div className="od-tuto-t">{t.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 30 }} />
        </PullToRefresh>
      </div>

      {/* DESKTOP */}
      <div className="only-desktop">
        <div className="pw-wrap">
          <div className="pw-back"><Link href="/clientes/dashboard" className="pw-link"><Icon name="chevR" size={18} style={{ transform: "rotate(180deg)" }} /> Mis vehículos</Link></div>
          <div className="pwod">
            <div className="pwod-main">
              <div className="pwod-hero">
                <Photo className="pwod-hero-photo" tint="rgba(196,30,42,.2)" />
                <div className="pwod-hero-grad" />
                <div className="pwod-hero-info">
                  <span className="pwod-hero-plate">{vehicle.licensePlate}</span>
                  <div className="pwod-hero-name">{vehicle.brand} {vehicle.model}</div>
                  <div className="pwod-hero-sub" data-section="hero-subtitle">{[order?.title, vehicle.color, vehicle.year].filter(Boolean).join(" · ")}</div>
                </div>
              </div>

              {order ? (
                <>
                  {isReady ? (
                    <div data-section="ready-banner"><ReadyBanner variant="desktop" total={budgetTotal} /></div>
                  ) : (
                    <div className="pwod-stage">
                      <div className="pwod-stage-top">
                        <div><div className="pwod-stage-now">{stageName ?? "En proceso"}</div><div style={{ marginTop: 8 }}><InProgressBadge /></div></div>
                        {eta && <div className="pwod-stage-eta"><div className="pwod-stage-eta-n">{eta}</div><div className="pwod-stage-eta-l">Entrega estimada</div></div>}
                      </div>
                      <StageBar stageIndex={idx} variant="desktop" />
                    </div>
                  )}

                  <CustomerTimeline variant="panel" />
                </>
              ) : (
                <div className="pwsb" style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ color: "var(--muted)" }}>No hay órdenes activas para este vehículo.</div>
                  <Link href={`/clientes/vehiculos/${id}/historial`} className="pw-btn pw-btn-ghost" style={{ marginTop: 16, display: "inline-flex" }}>Ver historial</Link>
                </div>
              )}
            </div>

            <div className="pwod-side">
              <div className="pwsb" data-section="vehicle-data">
                <div className="pwsb-h"><Icon name="car" size={15} /> Vehículo</div>
                <div className="pwsb-row"><span className="pwsb-k">Modelo</span><span className="pwsb-v">{vehicle.brand} {vehicle.model}</span></div>
                <div className="pwsb-row"><span className="pwsb-k">Patente</span><span className="pwsb-v mono">{vehicle.licensePlate}</span></div>
                {vehicle.color && <div className="pwsb-row"><span className="pwsb-k">Color</span><span className="pwsb-v">{vehicle.color}</span></div>}
                {vehicle.year && <div className="pwsb-row"><span className="pwsb-k">Año</span><span className="pwsb-v mono">{vehicle.year}</span></div>}
              </div>
              {order && <StageDurations updates={order.statusUpdates} orderStatus={order.status} variant="desktop" />}
              {order && order.servicesRequested.length > 0 && (
                <div className="pwsb">
                  <div className="pwsb-h"><Icon name="spray" size={15} /> Servicios</div>
                  <div className="pwsb-chips">{order.servicesRequested.map((s, i) => <span className="pwsb-chip" key={i}>{s}</span>)}</div>
                </div>
              )}
              {order?.description && (
                <div className="pwsb">
                  <div className="pwsb-h"><Icon name="shield" size={15} /> Tratamientos aplicados</div>
                  <div className="pwsb-treat"><div className="pwsb-treat-row"><span className="tick"><Icon name="check" size={13} stroke={2.6} /></span>{order.description}</div></div>
                </div>
              )}
              <div className="pwsb" data-section="care-tips">
                <div className="pwsb-h"><Icon name="play" size={15} /> Cuidados recomendados</div>
                {CARE_TIPS.map((t) => (
                  <div className="pwsb-tuto" key={t.title}>
                    <div className="pwsb-tuto-th"><Photo tint={t.tint} style={{ width: "100%", height: "100%" }} /><span className="pwsb-tuto-play"><Icon name="play" size={12} /></span></div>
                    <div><div className="pwsb-tuto-t">{t.title}</div><div className="pwsb-tuto-c">{t.cat}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return liveOrder ? (
    <OrderLiveProvider initialOrder={liveOrder} initialUpdates={liveUpdates}>
      {body}
    </OrderLiveProvider>
  ) : (
    body
  );
}

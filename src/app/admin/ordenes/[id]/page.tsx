import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getWorkOrderById } from "@/services/work-order.service";
import { OrderActions } from "@/components/admin/OrderActions";
import { Timeline } from "@/components/shared/Timeline";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Icon } from "@/components/shared/Icon";
import { Photo } from "@/components/shared/Photo";
import { NewStateForm } from "@/components/admin/NewStateForm";
import { StageDurations } from "@/components/shared/StageDurations";
import { STAGE_LABELS, stageIndex, STAGE_ORDER } from "@/lib/stages";
import { fmtDayMonth } from "@/lib/format";

export default async function AdminOrdenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;

  let order;
  try {
    order = await getWorkOrderById(id, user.id, user.role);
  } catch {
    notFound();
  }

  const idx = order.status === "LISTO" || order.status === "ENTREGADO"
    ? STAGE_ORDER.length
    : stageIndex(order.stage);

  const listo = order.status === "LISTO" || order.status === "ENTREGADO";
  const fmt = fmtDayMonth;
  const currentStepTitle = order.statusUpdates.find((u) => u.isCurrent)?.title ?? null;

  // Datos comerciales (presupuesto/pago): solo el dueño (ADMIN), no el operario.
  const isOwner = user.role === "ADMIN";

  return (
    <>
    {/* MOBILE — vista taller */}
    <div className="only-mobile">
      <div className="t-scroll" style={{ paddingBottom: 104 }}>
        <div className="tod-hero" data-section="hero">
          <Photo className="tod-hero-photo" tint="rgba(196,30,42,.2)" />
          <div className="tod-hero-grad" />
          <div className="t-top flush" style={{ position: "absolute", top: 0, left: 0, right: 0, background: "transparent", borderBottom: "none" }} data-section="back-link">
            <Link href="/admin/ordenes" className="t-back" style={{ color: "#fff", textDecoration: "none" }}>
              <Icon name="chevR" size={20} style={{ transform: "rotate(180deg)" }} /> Taller
            </Link>
          </div>
          <div className="tod-hero-info">
            <span className="tod-hero-plate">{order.vehicle.licensePlate}</span>
            <div className="tod-hero-name">{order.vehicle.brand} {order.vehicle.model}</div>
            <div className="tod-hero-sub">{order.title} · {order.vehicle.customer.user.name} · {order.orderCode}</div>
          </div>
        </div>

        <div className="tod-statusrow" data-section="status-badge">
          <StatusBadge status={order.status} />
        </div>

        <div className="tod-prog" data-section="stage-track">
          <div className="tod-prog-top">
            <span className="tod-prog-now">{listo ? "Trabajo finalizado" : STAGE_LABELS[order.stage]}</span>
            <span className="tod-prog-eta">{order.estimatedDeliveryDate ? fmt(order.estimatedDeliveryDate) : ""}</span>
          </div>
          <div className="tod-bar">
            {STAGE_ORDER.map((s, i) => <span key={s} className={"tod-bar-seg" + (i < idx ? " done" : "") + (i === idx && !listo ? " current" : "")} />)}
          </div>
          <div className="tod-bar-lbls">
            {STAGE_ORDER.map((s, i) => <span key={s} className={"tod-bar-lbl" + (i <= idx || listo ? " on" : "")}>{STAGE_LABELS[s]}</span>)}
          </div>
        </div>

        {/* Timeline: componente admin COMPARTIDO (mismo que desktop) → trae
            descripciones, notas internas, fotos + lightbox. Antes el `ttl`
            inline mobile no mostraba nada de eso (drift funcional). */}
        <div className="tod-block" data-section="timeline">
          <div className="ttl-head">
            <span>Línea de tiempo · {order.statusUpdates.length}</span>
            <span className="t-mono" style={{ fontSize: 11, color: "var(--muted-dim)" }} data-section="timeline-visible-count">{order.statusUpdates.filter((s) => s.visibleToCustomer).length} visibles</span>
          </div>
          <Timeline updates={order.statusUpdates} mode="admin" orderStatus={order.status} />
        </div>

        {/* Datos comerciales y de cliente (espejo del sidebar desktop) */}
        <div className="tod-side">
          <div className="osb" data-section="client-info">
            <div className="osb-h"><Icon name="user" size={15} /> Cliente</div>
            <div className="osb-client">
              <span className="osb-client-av">
                {order.vehicle.customer.user.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
              </span>
              <div>
                <div className="osb-client-name">{order.vehicle.customer.user.name}</div>
                <div className="osb-client-sub">{order.vehicle.customer.user.email}</div>
              </div>
            </div>
          </div>

          <div className="osb" data-section="vehicle-info">
            <div className="osb-h"><Icon name="car" size={15} /> Vehículo</div>
            <div className="osb-row"><span className="osb-k">Patente</span><span className="osb-v mono">{order.vehicle.licensePlate}</span></div>
            {order.vehicle.year && <div className="osb-row"><span className="osb-k">Año</span><span className="osb-v mono">{order.vehicle.year}</span></div>}
            {order.vehicle.color && <div className="osb-row"><span className="osb-k">Color</span><span className="osb-v">{order.vehicle.color}</span></div>}
            <div className="osb-row"><span className="osb-k">Etapa</span><span className="osb-v">{STAGE_LABELS[order.stage]}</span></div>
          </div>

          <StageDurations updates={order.statusUpdates} orderStatus={order.status} variant="admin" />

          {isOwner && (
            <div className="osb" data-section="budget-payment">
              <div className="osb-h"><Icon name="clipboard" size={15} /> Presupuesto</div>
              <div className="osb-row"><span className="osb-k">Monto</span><span className="osb-v mono">{order.budgetAmount != null ? `$${Number(order.budgetAmount).toLocaleString("es-AR")}` : "—"}</span></div>
              <div className="osb-row"><span className="osb-k">Pago</span><span className="osb-v">{order.paymentStatus}</span></div>
            </div>
          )}

          {order.servicesRequested.length > 0 && (
            <div className="osb" data-section="services">
              <div className="osb-h"><Icon name="spray" size={15} /> Servicios</div>
              <div className="osb-chips">
                {order.servicesRequested.map((s: string, i: number) => <span key={i} className="osb-chip">{s}</span>)}
              </div>
            </div>
          )}

          {order.internalNotes && (
            <div className="osb" data-section="order-internal-notes">
              <div className="osb-note">{order.internalNotes}</div>
            </div>
          )}
        </div>

      </div>

      {/* Dock de acciones fijo: siempre al alcance del pulgar, sin scrollear. */}
      <div className="tod-dock">
        <span data-section="new-state-form" style={{ display: "contents" }}>
          <NewStateForm orderId={order.id} currentStageIndex={idx} />
        </span>
        <span data-section="lifecycle-actions" style={{ display: "contents" }}>
          <OrderActions orderId={order.id} status={order.status} currentStepTitle={currentStepTitle} variant="mobile" />
        </span>
      </div>
    </div>

    {/* DESKTOP */}
    <div className="only-desktop apage">
      <div className="ahead">
        <div className="ahead-l">
          <Link href="/admin/ordenes" className="alink" style={{ marginBottom: 6, display: "inline-flex", gap: 6, alignItems: "center" }} data-section="back-link">
            <Icon name="chevR" size={14} style={{ transform: "rotate(180deg)" }} /> Órdenes
          </Link>
          <h2>{order.title}</h2>
          <div className="ahead-sub mono">{order.orderCode}</div>
        </div>
        <span data-section="status-badge"><StatusBadge status={order.status} /></span>
      </div>

      <div className="od2">
        {/* ── columna principal ── */}
        <div className="od2-main">
          {/* Hero del vehículo */}
          <div className="od2-hero" data-section="hero">
            <Photo className="od2-hero-photo" tint="rgba(196,30,42,.2)" />
            <div className="od2-hero-grad" />
            <div className="od2-hero-info">
              <span className="od2-hero-plate">{order.vehicle.licensePlate}</span>
              <div className="od2-hero-name">{order.vehicle.brand} {order.vehicle.model}</div>
              <div className="od2-hero-meta">{order.orderCode}</div>
            </div>
          </div>

          {/* Barra de etapas */}
          <div className="od2-stages" data-section="stage-track">
            <div className="od2-stages-track">
              {STAGE_ORDER.map((s, i) => (
                <React.Fragment key={s}>
                  <div
                    className={"od2-snode" + (i < idx ? " done" : "") + (i === idx && !listo ? " current" : "")}
                  >
                    <div className="od2-sdot">{i + 1}</div>
                    <div className="od2-slbl">{STAGE_LABELS[s]}</div>
                  </div>
                  {i < STAGE_ORDER.length - 1 && (
                    <div className={"od2-slink" + (i < idx ? " done" : "")} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Timeline de seguimiento */}
          <div className="atl-card" data-section="timeline">
            <div className="atl-card-head">
              <h3>Seguimiento</h3>
            </div>
            <Timeline updates={order.statusUpdates} mode="admin" orderStatus={order.status} />
          </div>

          <div data-section="new-state-form">
            <NewStateForm orderId={order.id} currentStageIndex={idx} />
          </div>
        </div>

        {/* ── columna lateral ── */}
        <aside className="od2-side">
          {/* Acción principal */}
          <div data-section="lifecycle-actions">
            <OrderActions orderId={order.id} status={order.status} currentStepTitle={currentStepTitle} />
          </div>

          {/* Cliente */}
          <div className="osb" data-section="client-info">
            <div className="osb-h">Cliente</div>
            <div className="osb-client">
              <span className="osb-client-av">
                {order.vehicle.customer.user.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase()}
              </span>
              <div>
                <div className="osb-client-name">{order.vehicle.customer.user.name}</div>
                <div className="osb-client-sub">{order.vehicle.customer.user.email}</div>
              </div>
            </div>
          </div>

          {/* Vehículo */}
          <div className="osb" data-section="vehicle-info">
            <div className="osb-h">Vehículo</div>
            <div className="osb-row">
              <span className="osb-k">Patente</span>
              <span className="osb-v mono">{order.vehicle.licensePlate}</span>
            </div>
            {order.vehicle.year && (
              <div className="osb-row">
                <span className="osb-k">Año</span>
                <span className="osb-v mono">{order.vehicle.year}</span>
              </div>
            )}
            {order.vehicle.color && (
              <div className="osb-row">
                <span className="osb-k">Color</span>
                <span className="osb-v">{order.vehicle.color}</span>
              </div>
            )}
            <div className="osb-row">
              <span className="osb-k">Etapa</span>
              <span className="osb-v">{STAGE_LABELS[order.stage]}</span>
            </div>
            {isOwner && (
              <>
                {order.budgetAmount != null && (
                  <div className="osb-row">
                    <span className="osb-k">Presupuesto</span>
                    <span className="osb-v mono">${String(order.budgetAmount)}</span>
                  </div>
                )}
                <div className="osb-row" data-section="budget-payment">
                  <span className="osb-k">Pago</span>
                  <span className="osb-v">{order.paymentStatus}</span>
                </div>
              </>
            )}
          </div>

          {/* Tiempos por etapa (TI1) */}
          <StageDurations updates={order.statusUpdates} orderStatus={order.status} variant="admin" />

          {/* Servicios */}
          {order.servicesRequested.length > 0 && (
            <div className="osb" data-section="services">
              <div className="osb-h">Servicios</div>
              <div className="osb-chips">
                {order.servicesRequested.map((s: string, i: number) => (
                  <span key={i} className="osb-chip">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Nota interna */}
          {order.internalNotes && (
            <div className="osb" data-section="order-internal-notes">
              <div className="osb-note">{order.internalNotes}</div>
            </div>
          )}
        </aside>
      </div>
    </div>
    </>
  );
}

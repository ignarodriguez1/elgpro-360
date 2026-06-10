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
import { STAGE_LABELS, stageIndex, STAGE_ORDER } from "@/lib/stages";

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
  const fmt = (d: Date | string) => new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short" });

  return (
    <>
    {/* MOBILE — vista taller */}
    <div className="only-mobile">
      <div className="t-scroll" style={{ paddingBottom: 104 }}>
        <div className="tod-hero">
          <Photo className="tod-hero-photo" tint="rgba(196,30,42,.2)" />
          <div className="tod-hero-grad" />
          <div className="t-top flush" style={{ position: "absolute", top: 0, left: 0, right: 0, background: "transparent", borderBottom: "none" }}>
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

        <div className="tod-prog">
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

        <div className="ttl-head">
          <span>Línea de tiempo · {order.statusUpdates.length}</span>
          <span className="t-mono" style={{ fontSize: 11, color: "var(--muted-dim)" }}>{order.statusUpdates.filter((s) => s.visibleToCustomer).length} visibles</span>
        </div>
        <div className="ttl">
          {order.statusUpdates.map((e) => (
            <div className={"ttl-row" + (e.isCurrent ? " current" : "") + (!e.visibleToCustomer ? " internal" : "")} key={e.id}>
              <div className="ttl-rail"><div className="ttl-dot"><i /></div><div className="ttl-line" /></div>
              <div className="ttl-body">
                <div className="ttl-top"><div className="ttl-title">{e.title}</div><span className="ttl-date">{fmt(e.createdAt)}</span></div>
                <div className="ttl-tags">
                  {e.visibleToCustomer ? <span className="ttl-vtag visible"><Icon name="sun" size={10} /> Visible</span> : <span className="ttl-vtag hidden"><Icon name="shield" size={10} /> Interno</span>}
                  {e.notifiedAt && <span className="ttl-vtag notified"><Icon name="bell" size={10} /> Notificado</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <OrderActions orderId={order.id} status={order.status} variant="mobile" />

        <div style={{ padding: "0 18px 24px" }}>
          <NewStateForm orderId={order.id} currentStageIndex={idx} />
        </div>
      </div>
    </div>

    {/* DESKTOP */}
    <div className="only-desktop apage">
      <div className="ahead">
        <div className="ahead-l">
          <Link href="/admin/ordenes" className="alink" style={{ marginBottom: 6, display: "inline-flex", gap: 6, alignItems: "center" }}>
            <Icon name="chevR" size={14} style={{ transform: "rotate(180deg)" }} /> Órdenes
          </Link>
          <h2>{order.title}</h2>
          <div className="ahead-sub mono">{order.orderCode}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="od2">
        {/* ── columna principal ── */}
        <div className="od2-main">
          {/* Hero del vehículo */}
          <div className="od2-hero">
            <Photo className="od2-hero-photo" tint="rgba(196,30,42,.2)" />
            <div className="od2-hero-grad" />
            <div className="od2-hero-info">
              <span className="od2-hero-plate">{order.vehicle.licensePlate}</span>
              <div className="od2-hero-name">{order.vehicle.brand} {order.vehicle.model}</div>
              <div className="od2-hero-meta">{order.orderCode}</div>
            </div>
          </div>

          {/* Barra de etapas */}
          <div className="od2-stages">
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
          <div className="atl-card">
            <div className="atl-card-head">
              <h3>Seguimiento</h3>
            </div>
            <Timeline updates={order.statusUpdates} mode="admin" orderStatus={order.status} />
          </div>

          <NewStateForm orderId={order.id} currentStageIndex={idx} />
        </div>

        {/* ── columna lateral ── */}
        <aside className="od2-side">
          {/* Acción principal */}
          <OrderActions orderId={order.id} status={order.status} />

          {/* Cliente */}
          <div className="osb">
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
          <div className="osb">
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
            {order.budgetAmount != null && (
              <div className="osb-row">
                <span className="osb-k">Presupuesto</span>
                <span className="osb-v mono">${String(order.budgetAmount)}</span>
              </div>
            )}
            <div className="osb-row">
              <span className="osb-k">Pago</span>
              <span className="osb-v">{order.paymentStatus}</span>
            </div>
          </div>

          {/* Servicios */}
          {order.servicesRequested.length > 0 && (
            <div className="osb">
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
            <div className="osb">
              <div className="osb-note">{order.internalNotes}</div>
            </div>
          )}
        </aside>
      </div>
    </div>
    </>
  );
}

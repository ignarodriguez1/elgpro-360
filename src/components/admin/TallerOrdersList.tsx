import Link from "next/link";
import { Photo } from "@/components/shared/Photo";
import { Icon } from "@/components/shared/Icon";
import { STAGE_LABELS } from "@/lib/stages";
import type { OrderStage, WorkOrderStatus } from "@/generated/prisma/client";

export interface TallerOrder {
  id: string;
  orderCode: string;
  patente: string;
  vehiculo: string;
  cliente: string;
  etapa: OrderStage;
  estado: WorkOrderStatus;
  eta: string | null;
}

function Card({ o }: { o: TallerOrder }) {
  const listo = o.estado === "LISTO";
  return (
    <div className="tcard t-rise">
      <Link href={`/admin/ordenes/${o.id}`} className="tcard-body" style={{ textDecoration: "none", color: "inherit" }}>
        <Photo className="tcard-photo" tint="rgba(196,30,42,.16)" />
        <div className="tcard-main">
          <div className="tcard-row1">
            <span className="tcard-plate">{o.patente}</span>
            <span className="t-mono" style={{ fontSize: 11, color: "var(--muted-dim)" }}>{o.orderCode}</span>
          </div>
          <div className="tcard-name">{o.vehiculo}</div>
          <div className="tcard-client">{o.cliente}</div>
          <div className={"tcard-stage" + (listo ? " listo" : "")}>
            <Icon name={listo ? "check" : "spray"} size={14} />
            {listo ? "Listo para retirar" : STAGE_LABELS[o.etapa]}
          </div>
        </div>
      </Link>
      <div className="tcard-foot">
        <span className="tcard-eta"><Icon name="clock" size={15} /> {o.eta ?? "Sin fecha"}</span>
        <Link href={`/admin/ordenes/${o.id}`} className="tcard-cta" style={{ textDecoration: "none" }}>
          Actualizar <Icon name="arrow" size={16} />
        </Link>
      </div>
    </div>
  );
}

/** Vista "Hoy en el taller" (mobile) — portada de admin-mobile.jsx TOrdersList. */
export function TallerOrdersList({ orders, adminName }: { orders: TallerOrder[]; adminName: string }) {
  const proceso = orders.filter((o) => o.estado === "PROCESO");
  const listos = orders.filter((o) => o.estado === "LISTO");
  const initials = adminName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="t-scroll" style={{ paddingBottom: 24 }}>
      <div className="t-top">
        <div className="t-role">
          <span className="t-role-mode">Modo Taller</span>
          <span className="t-role-sub">{adminName}</span>
        </div>
        <Link href="/admin/ordenes/nueva" className="t-avatar" style={{ textDecoration: "none" }}>
          <Icon name="plus" size={20} />
        </Link>
      </div>
      <div className="t-strip">
        <div className="t-strip-h">Hoy en el taller</div>
        <div className="t-strip-sub">{proceso.length} en proceso · {listos.length} para entregar</div>
      </div>
      <div className="t-sec">En proceso <span className="c">{proceso.length}</span></div>
      <div className="t-cards">
        {proceso.length === 0 ? <p style={{ padding: "0 18px", color: "var(--muted)", fontSize: 14 }}>Nada en proceso.</p> : proceso.map((o) => <Card key={o.id} o={o} />)}
      </div>
      <div className="t-sec" style={{ paddingTop: 22 }}>Listos para retirar <span className="c">{listos.length}</span></div>
      <div className="t-cards">
        {listos.length === 0 ? <p style={{ padding: "0 18px", color: "var(--muted)", fontSize: 14 }}>Nada para entregar.</p> : listos.map((o) => <Card key={o.id} o={o} />)}
      </div>
    </div>
  );
}

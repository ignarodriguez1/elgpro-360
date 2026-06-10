import Link from "next/link";
import { Photo } from "./Photo";
import { Icon } from "./Icon";
import { StatusBadge } from "./StatusBadge";
import { STAGE_ORDER, STAGE_LABELS, stageIndex } from "@/lib/stages";
import type { WorkOrderStatus, OrderStage } from "@/generated/prisma/client";

interface VehicleCardProps {
  href: string;
  img?: string;
  patente: string;
  marca: string;
  modelo: string;
  color?: string | null;
  colorHex?: string | null;
  anio?: number | null;
  order?: {
    status: WorkOrderStatus;
    stage: OrderStage;
    eta?: string | null;
  } | null;
}

/** Card de vehículo con barra de progreso por etapas (portado del prototipo). */
export function VehicleCard({
  href,
  img,
  patente,
  marca,
  modelo,
  color,
  colorHex,
  anio,
  order,
}: VehicleCardProps) {
  const ready = order?.status === "LISTO";
  const idx = order ? (ready ? STAGE_ORDER.length : stageIndex(order.stage)) : 0;

  return (
    <Link href={href} className="veh-card" style={{ display: "block" }}>
      <div className="veh-photo-wrap">
        <Photo src={img} className="veh-photo" tint="rgba(196,30,42,.16)" />
        <div className="veh-photo-grad" />
        <span className="veh-plate">{patente}</span>
        {order && (
          <span className="veh-statuspill">
            <StatusBadge status={order.status} />
          </span>
        )}
        <div className="veh-head">
          <div className="veh-name">
            {marca} {modelo}
          </div>
          <div className="veh-meta">
            {colorHex && (
              <span className="veh-color-dot" style={{ background: colorHex }} />
            )}
            <span className="veh-meta-txt">
              {[color, anio].filter(Boolean).join(" · ")}
            </span>
          </div>
        </div>
      </div>

      {order ? (
        <div className="veh-body">
          <div className="veh-prog-row">
            <span className="veh-prog-stage">
              <Icon name={ready ? "check" : "spray"} size={16} />
              {ready ? "Trabajo finalizado" : STAGE_LABELS[order.stage]}
            </span>
            {order.eta && <span className="veh-prog-eta">{order.eta}</span>}
          </div>
          <div className="veh-bar">
            {STAGE_ORDER.map((s, i) => (
              <span
                key={s}
                className={
                  "veh-bar-seg" +
                  (i < idx ? " done" : "") +
                  (i === idx ? " current" : "")
                }
              />
            ))}
          </div>
          <div className="veh-foot">
            <span className="veh-foot-stages">
              Etapa {Math.min(idx + 1, STAGE_ORDER.length)} de {STAGE_ORDER.length}
            </span>
            <span className="veh-detail-btn">
              Ver detalle <Icon name="arrow" size={15} />
            </span>
          </div>
        </div>
      ) : (
        <div className="veh-idle">
          <span className="veh-idle-ic">
            <Icon name="check" size={18} />
          </span>
          <span className="veh-idle-txt">
            <b>Sin trabajos en curso</b>
            Mirá su historial de trabajos anteriores.
          </span>
        </div>
      )}
    </Link>
  );
}

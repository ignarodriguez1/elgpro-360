import { Fragment } from "react";
import { Icon } from "./Icon";
import { STAGE_ORDER, STAGE_LABELS, STAGE_ICONS } from "@/lib/stages";

/**
 * Variante visual de la barra de etapas (misma lógica, distinto árbol DOM):
 * - `mobile`  → portal mobile, clases `od-stage-*`.
 * - `desktop` → columna desktop del portal, clases `pwod-*`.
 * Antes el track desktop vivía duplicado inline en clientes/vehiculos/[id]/page.tsx.
 */
export type StageBarVariant = "mobile" | "desktop";

interface StageBarProps {
  /** Índice de la etapa actual (0-3). Si la orden está lista, pasar STAGE_ORDER.length. */
  stageIndex: number;
  /** Default `mobile`. */
  variant?: StageBarVariant;
}

/** Mapa de clases por variante — misma estructura, distinto estilo por árbol. */
const CLASSES = {
  mobile: {
    track: "od-stage-track",
    link: "od-stage-link",
    node: "od-stage-node",
    dot: "od-stage-dot",
    lbl: "od-stage-lbl",
    iconSize: 15,
  },
  desktop: {
    track: "pwod-track",
    link: "pwod-slink",
    node: "pwod-snode",
    dot: "pwod-sdot",
    lbl: "pwod-slbl",
    iconSize: 17,
  },
} as const;

/**
 * Barra de progreso de las 4 etapas macro (portado de StageBar del prototipo).
 * Nodo done (i < actual), current (i === actual), pending (i > actual).
 */
export function StageBar({ stageIndex, variant = "mobile" }: StageBarProps) {
  const c = CLASSES[variant];
  return (
    <div className={c.track}>
      {STAGE_ORDER.map((stage, i) => (
        <Fragment key={stage}>
          {i > 0 && (
            <div className={c.link + (i <= stageIndex ? " done" : "")} />
          )}
          <div
            className={
              c.node +
              (i < stageIndex ? " done" : "") +
              (i === stageIndex ? " current" : "")
            }
          >
            <div className={c.dot}>
              <Icon name={i < stageIndex ? "check" : STAGE_ICONS[i]} size={c.iconSize} />
            </div>
            <span className={c.lbl}>{STAGE_LABELS[stage]}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

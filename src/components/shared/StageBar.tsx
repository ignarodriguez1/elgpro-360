import { Fragment } from "react";
import { Icon } from "./Icon";
import { STAGE_ICONS, stageIndex } from "@/lib/stages";
import type { ServicePhase } from "@/lib/service-phases";

/**
 * Variante visual de la barra de etapas (misma lógica, distinto árbol DOM):
 * - `mobile`  → portal mobile, clases `od-stage-*`.
 * - `desktop` → columna desktop del portal, clases `pwod-*`.
 * Antes el track desktop vivía duplicado inline en clientes/vehiculos/[id]/page.tsx.
 */
export type StageBarVariant = "mobile" | "desktop";

interface StageBarProps {
  /**
   * Segmentos de fase EMERGENTES, derivados de los steps reales del servicio
   * (`computeServicePhases`). N variable: si el servicio no atraviesa una fase,
   * no aparece. Antes era `stageIndex: number` contra el enum global fijo.
   */
  phases: ServicePhase[];
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
 * Barra de progreso EMERGENTE: dibuja N nodos (uno por segmento contiguo de `stage`)
 * y N−1 conectores. El estado de cada nodo (`done`/`current`/`pending`) lo decide el
 * selector a partir de `reachedAt` — la MISMA verdad que el timeline vertical, plegada.
 * No renderiza nada si no hay segmentos (`phases.length === 0`); N=1 dibuja un solo nodo.
 */
export function StageBar({ phases, variant = "mobile" }: StageBarProps) {
  if (phases.length === 0) return null;
  const c = CLASSES[variant];
  return (
    <div className={c.track}>
      {phases.map((phase, i) => {
        const done = phase.state === "done";
        const current = phase.state === "current";
        return (
          <Fragment key={`${phase.stage}-${i}`}>
            {i > 0 && (
              // El conector ANTES de la fase i se llena si el fill llegó a esa fase
              // (done o current, es decir, no pending).
              <div className={c.link + (phase.state !== "pending" ? " done" : "")} />
            )}
            <div className={c.node + (done ? " done" : "") + (current ? " current" : "")}>
              <div className={c.dot}>
                <Icon
                  name={done ? "check" : STAGE_ICONS[stageIndex(phase.stage)]}
                  size={c.iconSize}
                />
              </div>
              <span className={c.lbl}>{phase.label}</span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

import { Fragment } from "react";
import { Icon } from "./Icon";
import { STAGE_ORDER, STAGE_LABELS, STAGE_ICONS } from "@/lib/stages";

interface StageBarProps {
  /** Índice de la etapa actual (0-3). Si la orden está lista, pasar STAGE_ORDER.length. */
  stageIndex: number;
}

/**
 * Barra de progreso de las 4 etapas macro (portado de StageBar del prototipo).
 * Nodo done (i < actual), current (i === actual), pending (i > actual).
 */
export function StageBar({ stageIndex }: StageBarProps) {
  return (
    <div className="od-stage-track">
      {STAGE_ORDER.map((stage, i) => (
        <Fragment key={stage}>
          {i > 0 && (
            <div className={"od-stage-link" + (i <= stageIndex ? " done" : "")} />
          )}
          <div
            className={
              "od-stage-node" +
              (i < stageIndex ? " done" : "") +
              (i === stageIndex ? " current" : "")
            }
          >
            <div className="od-stage-dot">
              <Icon name={i < stageIndex ? "check" : STAGE_ICONS[i]} size={15} />
            </div>
            <span className="od-stage-lbl">{STAGE_LABELS[stage]}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

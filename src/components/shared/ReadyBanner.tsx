import { Icon } from "./Icon";

interface ReadyBannerProps {
  total?: string | null;
  hours?: string;
  address?: string;
  payments?: string;
}

/** Banner verde de "vehículo listo para retirar" (portado del prototipo). */
export function ReadyBanner({
  total,
  hours = "Lun–Vie · 8:30–18",
  address = "Bv. Oroño 1234",
  payments = "Efvo · transf · tarjeta",
}: ReadyBannerProps) {
  return (
    <div className="ready-banner">
      <div className="ready-banner-glow" />
      <div className="ready-inner">
        <div className="ready-row">
          <span className="ready-ic">
            <Icon name="check" size={26} stroke={2.6} />
          </span>
          <div>
            <div className="ready-title">¡Tu vehículo está listo!</div>
            <div className="ready-sub">Podés pasar a retirarlo cuando quieras.</div>
          </div>
        </div>
        <div className="ready-info">
          <div className="ready-info-cell">
            <div className="ready-info-l">Horario de retiro</div>
            <div className="ready-info-v">{hours}</div>
          </div>
          <div className="ready-info-cell">
            <div className="ready-info-l">Dirección</div>
            <div className="ready-info-v mono">{address}</div>
          </div>
          {total && (
            <div className="ready-info-cell">
              <div className="ready-info-l">Total</div>
              <div className="ready-info-v mono">{total}</div>
            </div>
          )}
          <div className="ready-info-cell">
            <div className="ready-info-l">Formas de pago</div>
            <div className="ready-info-v mono">{payments}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

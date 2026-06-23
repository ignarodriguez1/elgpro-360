import { Icon } from "./Icon";

/**
 * Variante visual del banner "listo para retirar" (misma lógica, distinto árbol DOM):
 * - `mobile`  → portal mobile, clases `ready-*`.
 * - `desktop` → columna desktop del portal, clases `pwready-*` (grid de 4 celdas).
 * Antes el banner desktop vivía duplicado inline en clientes/vehiculos/[id]/page.tsx,
 * y divergía en las etiquetas ("Horario"/"Pago" vs "Horario de retiro"/"Formas de pago").
 * Etiqueta canónica: la del componente compartido.
 */
export type ReadyBannerVariant = "mobile" | "desktop";

interface ReadyBannerProps {
  total?: string | null;
  hours?: string;
  address?: string;
  payments?: string;
  /** Default `mobile`. */
  variant?: ReadyBannerVariant;
}

/** Mapa de clases por variante — misma estructura, distinto estilo por árbol. */
const CLASSES = {
  mobile: {
    banner: "ready-banner",
    glow: "ready-banner-glow",
    inner: "ready-inner",
    row: "ready-row",
    ic: "ready-ic",
    title: "ready-title",
    sub: "ready-sub",
    info: "ready-info",
    cell: "ready-info-cell",
    l: "ready-info-l",
    v: "ready-info-v",
    iconSize: 26,
  },
  desktop: {
    banner: "pwready",
    glow: "pwready-glow",
    inner: "pwready-in",
    row: "pwready-row",
    ic: "pwready-ic",
    title: "pwready-t",
    sub: "pwready-s",
    info: "pwready-info",
    cell: "pwready-cell",
    l: "pwready-l",
    v: "pwready-v",
    iconSize: 30,
  },
} as const;

/** Banner verde de "vehículo listo para retirar" (portado del prototipo). */
export function ReadyBanner({
  total,
  hours = "Lun–Vie · 8:30–18",
  address = "Bv. Oroño 1234",
  payments = "Efvo · transf · tarjeta",
  variant = "mobile",
}: ReadyBannerProps) {
  const c = CLASSES[variant];
  return (
    <div className={c.banner}>
      <div className={c.glow} />
      <div className={c.inner}>
        <div className={c.row}>
          <span className={c.ic}>
            <Icon name="check" size={c.iconSize} stroke={2.6} />
          </span>
          <div>
            <div className={c.title}>¡Tu vehículo está listo!</div>
            <div className={c.sub}>Podés pasar a retirarlo cuando quieras.</div>
          </div>
        </div>
        <div className={c.info}>
          <div className={c.cell}>
            <div className={c.l}>Horario de retiro</div>
            <div className={c.v}>{hours}</div>
          </div>
          <div className={c.cell}>
            <div className={c.l}>Dirección</div>
            <div className={`${c.v} mono`}>{address}</div>
          </div>
          {total && (
            <div className={c.cell}>
              <div className={c.l}>Total</div>
              <div className={`${c.v} mono`}>{total}</div>
            </div>
          )}
          <div className={c.cell}>
            <div className={c.l}>Formas de pago</div>
            <div className={`${c.v} mono`}>{payments}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

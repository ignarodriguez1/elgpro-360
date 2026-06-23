import { Icon } from "./Icon";
import {
  computeStageDurations,
  fmtDuration,
  hasDurationData,
  type DurationStep,
} from "@/lib/durations";
import type { WorkOrderStatus } from "@/generated/prisma/client";

/**
 * Card "Tiempos por etapa" (TI1/TI3). Server component: renderiza en SSR sin
 * hidratación, así que es independiente del bug de hidratación (R1).
 * Si no hay ningún tiempo real registrado (OTs históricas sin `reachedAt`),
 * no muestra nada — honestidad por sobre relleno vacío.
 *
 * Variante por árbol del dual-layout, igual que ReadyBanner/Timeline:
 * - `mobile`  → clases `.od-*`
 * - `desktop` → clases `.pwsb-*`
 */
export type StageDurationsVariant = "mobile" | "desktop" | "admin";

interface StageDurationsProps {
  updates: DurationStep[];
  orderStatus: WorkOrderStatus;
  variant?: StageDurationsVariant;
}

const CLASSES = {
  mobile: { card: "od-block", head: "od-block-h", row: "od-kv", k: "od-kv-k", v: "od-kv-v" },
  desktop: { card: "pwsb", head: "pwsb-h", row: "pwsb-row", k: "pwsb-k", v: "pwsb-v" },
  admin: { card: "osb", head: "osb-h", row: "osb-row", k: "osb-k", v: "osb-v" },
} as const;

export function StageDurations({ updates, orderStatus, variant = "mobile" }: StageDurationsProps) {
  const rows = computeStageDurations(updates, orderStatus);
  if (!hasDurationData(rows)) return null;

  const c = CLASSES[variant];
  return (
    <div className={c.card} data-section="stage-durations">
      <div className={c.head}><Icon name="clock" size={15} /> Tiempos por etapa</div>
      {rows.map((r) => (
        <div className={c.row} key={r.stage}>
          <span className={c.k}>{r.label}</span>
          <span className={c.v} style={r.current ? { color: "var(--success)" } : !r.reached ? { color: "var(--muted)" } : undefined}>
            {r.reached ? fmtDuration(r.ms) : "—"}
            {r.current && <span style={{ fontSize: 11, opacity: 0.8 }}> · en curso</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

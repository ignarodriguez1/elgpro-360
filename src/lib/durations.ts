import type { OrderStage, WorkOrderStatus } from "@/generated/prisma/client";
import { STAGE_ORDER, STAGE_LABELS } from "./stages";

/** Forma mínima que necesita el cálculo de duraciones. */
export interface DurationStep {
  stage?: OrderStage | null;
  sortOrder: number;
  reachedAt?: Date | string | null;
}

export interface StageDuration {
  stage: OrderStage;
  label: string;
  ms: number;
  /** true = la etapa ya se alcanzó (tiene tiempo registrado). */
  reached: boolean;
  /** true = es la etapa en curso (sigue corriendo el reloj). */
  current: boolean;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Formatea una duración en ms a texto humano corto en es-AR. */
export function fmtDuration(ms: number): string {
  if (ms < MIN) return "menos de 1 min";
  if (ms < HOUR) return `${Math.round(ms / MIN)} min`;
  if (ms < DAY) {
    const h = Math.floor(ms / HOUR);
    const m = Math.round((ms % HOUR) / MIN);
    return m > 0 ? `${h} h ${m} min` : `${h} h`;
  }
  const d = Math.floor(ms / DAY);
  const h = Math.round((ms % DAY) / HOUR);
  return h > 0 ? `${d} d ${h} h` : `${d} d`;
}

/**
 * Calcula el tiempo que la OT pasó en cada etapa macro a partir de `reachedAt`.
 * El intervalo entre dos pasos alcanzados se atribuye a la etapa del paso que lo
 * inició. La etapa en curso corre hasta `now` (salvo orden ENTREGADA).
 * Pasos sin `reachedAt` (histórico/seed) no suman: la duración solo refleja lo
 * realmente registrado.
 */
export function computeStageDurations(
  updates: DurationStep[],
  orderStatus: WorkOrderStatus,
  now: Date = new Date()
): StageDuration[] {
  const reached = updates
    .filter((u) => u.reachedAt != null)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const ms: Partial<Record<OrderStage, number>> = {};
  for (let i = 0; i < reached.length; i++) {
    const start = new Date(reached[i].reachedAt!).getTime();
    const next = reached[i + 1];
    const end = next
      ? new Date(next.reachedAt!).getTime()
      : orderStatus === "ENTREGADO"
        ? start
        : now.getTime();
    const st = reached[i].stage;
    if (st) ms[st] = (ms[st] ?? 0) + Math.max(0, end - start);
  }

  const currentStage =
    orderStatus !== "ENTREGADO" && reached.length > 0
      ? reached[reached.length - 1].stage ?? null
      : null;

  return STAGE_ORDER.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    ms: ms[stage] ?? 0,
    reached: ms[stage] != null,
    current: stage === currentStage,
  }));
}

/** true si hay al menos una etapa con tiempo real registrado. */
export function hasDurationData(rows: StageDuration[]): boolean {
  return rows.some((r) => r.reached);
}

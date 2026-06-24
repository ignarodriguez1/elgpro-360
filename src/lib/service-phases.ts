import type { OrderStage, WorkOrderStatus } from "@/generated/prisma/client";
import { STAGE_LABELS } from "./stages";

/**
 * Barra de fases EMERGENTE (C1): la barra deja de leer el escalar `WorkOrder.stage`
 * contra el enum global `STAGE_ORDER` fijo, y pasa a derivarse de los steps reales
 * de la OT, agrupados por `stage` contiguo. Es el timeline vertical PLEGADO: misma
 * fuente (los steps, con `reachedAt`), distinta resolución. Por construcción no pueden
 * contradecirse.
 *
 * Verdad temporal = `reachedAt` (NUNCA `confirmed`, `WorkOrder.stage` ni `updatedAt`).
 *
 * Regla de dos capas:
 *  - Un step entra a la barra SII tiene `stage` (pertenece a una categoría).
 *  - Los steps sueltos/custom (`stage == null`) NO van a la barra pero SÍ al vertical,
 *    y actúan de FRONTERA: interrumpen el segmento contiguo en curso.
 *
 * No sobrescribe `computeStageDurations` (durations.ts) — ese otro consumidor solo
 * incluye fases alcanzadas; este selector necesita la lista completa (incluidos
 * `pending`). Independientes.
 */

/** Forma mínima de step que necesita el selector (subset de WorkOrderStatusUpdate). */
export interface PhaseStep {
  /** Etapa macro del paso. `null` = step suelto/custom → frontera, no entra a la barra. */
  stage?: OrderStage | null;
  /** Orden del paso en el timeline materializado. */
  sortOrder: number;
  /** Momento real en que el taller ALCANZÓ el paso. `null` = aún no alcanzado. */
  reachedAt?: Date | string | null;
}

export type PhaseState = "done" | "current" | "pending";

export interface ServicePhase {
  stage: OrderStage;
  /** Etiqueta para UI (de `STAGE_LABELS`). */
  label: string;
  state: PhaseState;
  /** Steps del segmento con tiempo real alcanzado. */
  reachedCount: number;
  /** Steps totales del segmento. */
  total: number;
}

export interface ComputeServicePhasesOptions {
  orderStatus: WorkOrderStatus;
  /** Ancla de ingreso: el PRIMER step cuenta como alcanzado acá si no tiene `reachedAt`. */
  orderCreatedAt: Date | string;
}

/**
 * Deriva los segmentos de fase a partir de los steps materializados de una OT.
 * El caller pasa SU propio set: admin = todos; cliente = filtrados por visibilidad
 * (el mismo set que alimenta su timeline vertical). El selector es puro y solo lee
 * `stage` / `sortOrder` / `reachedAt` (campos seguros, sin identidad de staff).
 */
export function computeServicePhases(
  steps: PhaseStep[],
  { orderStatus, orderCreatedAt }: ComputeServicePhasesOptions
): ServicePhase[] {
  if (steps.length === 0) return [];

  // Defensivo: ordenar por sortOrder (el caller suele pasarlos ya ordenados).
  const ordered = steps.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  // Paso 1 — ancla de ingreso. ÚNICO punto donde `createdAt` sustituye a `reachedAt`:
  // effectiveReachedAt(primerStep) = primerStep.reachedAt ?? orderCreatedAt.
  // Para el resto, sin fallback. Replica el índice 0 del timeline vertical.
  const reached = ordered.map((step, i) =>
    i === 0 ? step.reachedAt != null || orderCreatedAt != null : step.reachedAt != null
  );

  // Paso 2 — partición contigua (run-length por `stage`). `stage == null` = frontera.
  interface Segment {
    stage: OrderStage;
    total: number;
    reachedCount: number;
  }
  const segments: Segment[] = [];
  let open: Segment | null = null;

  ordered.forEach((step, i) => {
    if (step.stage == null) {
      // Suelto/custom: cierra el segmento abierto y no entra a la barra (frontera).
      open = null;
      return;
    }
    if (open && open.stage === step.stage) {
      open.total += 1;
      if (reached[i]) open.reachedCount += 1;
    } else {
      // Nota: agrupa por runs CONTIGUOS, no por valor global. La misma `stage` en dos
      // tramos no contiguos (separados por otra stage o por un suelto) = dos segmentos.
      open = { stage: step.stage, total: 1, reachedCount: reached[i] ? 1 : 0 };
      segments.push(open);
    }
  });

  // Paso 3 + 4 — estado por segmento, con override terminal.
  const terminal = orderStatus === "LISTO" || orderStatus === "ENTREGADO";
  return segments.map((seg) => ({
    stage: seg.stage,
    label: STAGE_LABELS[seg.stage],
    // Terminal (LISTO/ENTREGADO) → todo done. Si no:
    //  reachedCount == total      → done
    //  0 < reachedCount < total   → current
    //  reachedCount == 0          → pending
    // Múltiples `current` solo con datos fuera de orden (anomalía de integridad):
    // no se fuerza nada; cada segmento refleja su propio parcial. El "ahora" canónico
    // vive en el timeline vertical.
    state: terminal
      ? "done"
      : seg.reachedCount === 0
        ? "pending"
        : seg.reachedCount === seg.total
          ? "done"
          : "current",
    reachedCount: seg.reachedCount,
    total: seg.total,
  }));
}

/**
 * Etiqueta de la "etapa actual" para los textos de cabecera/sidebar, derivada de
 * los MISMOS `phases` que la barra (así el header y la barra NO pueden contradecirse):
 *  - el segmento `current`;
 *  - si no hay current, el último `done` (el avance real más lejano);
 *  - si no hay fases, `null` (el caller decide el fallback, p.ej. "En proceso").
 */
export function currentPhaseLabel(phases: ServicePhase[]): string | null {
  const current = phases.find((p) => p.state === "current");
  if (current) return current.label;
  for (let i = phases.length - 1; i >= 0; i--) {
    if (phases[i].state === "done") return phases[i].label;
  }
  return null;
}

import type { OrderStage } from "@/generated/prisma/client";

/** Orden de las 4 etapas macro (alimenta la barra de progreso). */
export const STAGE_ORDER: OrderStage[] = [
  "INGRESO",
  "PREPARACION",
  "PINTURA",
  "DETAIL_ENTREGA",
];

/** Labels cortas para la UI (coinciden con el prototipo). */
export const STAGE_LABELS: Record<OrderStage, string> = {
  INGRESO: "Ingreso",
  PREPARACION: "Preparación",
  PINTURA: "Pintura",
  DETAIL_ENTREGA: "Detail / Entrega",
};

/** Iconos (del set Icon) por etapa, en orden. */
export const STAGE_ICONS = ["arrow", "wrench", "spray", "sparkle"] as const;

/** Índice 0-based de una etapa dentro de la secuencia macro. */
export function stageIndex(stage: OrderStage): number {
  return STAGE_ORDER.indexOf(stage);
}

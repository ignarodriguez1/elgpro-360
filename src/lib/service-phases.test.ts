/**
 * Tests del selector emergente `computeServicePhases`.
 * Runner nativo de Node (`node:test`), corrido con tsx (sin dependencias nuevas):
 *   npx tsx --test src/lib/service-phases.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { OrderStage } from "@/generated/prisma/client";
import {
  computeServicePhases,
  currentPhaseLabel,
  type PhaseStep,
} from "./service-phases";

const CREATED_AT = new Date("2026-06-23T08:51:00Z");

// Helper: arma un step. `reachedAt` por defecto null (no alcanzado).
function step(
  sortOrder: number,
  stage: OrderStage | null,
  reachedAt: Date | null = null
): PhaseStep {
  return { sortOrder, stage, reachedAt };
}

// Resumen compacto para asserts legibles: "STAGE:state(reached/total)".
function summary(phases: ReturnType<typeof computeServicePhases>): string[] {
  return phases.map((p) => `${p.stage}:${p.state}(${p.reachedCount}/${p.total})`);
}

test("OT recién creada — solo ingreso anclado, resto pending", () => {
  const steps: PhaseStep[] = [
    step(0, "INGRESO"), // sin reachedAt → ancla aplica
    step(1, "PREPARACION"),
    step(2, "PREPARACION"),
    step(3, "PINTURA"),
    step(4, "DETAIL_ENTREGA"),
  ];
  const phases = computeServicePhases(steps, {
    orderStatus: "PROCESO",
    orderCreatedAt: CREATED_AT,
  });
  assert.deepEqual(summary(phases), [
    "INGRESO:done(1/1)", // ingreso alcanzado por ancla
    "PREPARACION:pending(0/2)",
    "PINTURA:pending(0/1)",
    "DETAIL_ENTREGA:pending(0/1)",
  ]);
});

test("Servicio que saltea PINTURA (ceramic) — no aparece esa fase", () => {
  const steps: PhaseStep[] = [
    step(0, "INGRESO"),
    step(1, "PREPARACION"),
    step(2, "DETAIL_ENTREGA"),
    step(3, "DETAIL_ENTREGA"),
  ];
  const phases = computeServicePhases(steps, {
    orderStatus: "PROCESO",
    orderCreatedAt: CREATED_AT,
  });
  assert.deepEqual(
    phases.map((p) => p.stage),
    ["INGRESO", "PREPARACION", "DETAIL_ENTREGA"]
  );
  assert.ok(!phases.some((p) => p.stage === "PINTURA"), "no debe haber PINTURA");
});

test("Step suelto como frontera — parte un run en dos segmentos de la misma stage", () => {
  const steps: PhaseStep[] = [
    step(0, "INGRESO", CREATED_AT),
    step(1, "PREPARACION", new Date("2026-06-23T10:00:00Z")),
    step(2, null, new Date("2026-06-23T11:00:00Z")), // custom: frontera
    step(3, "PREPARACION"), // segunda corrida de PREPARACION
  ];
  const phases = computeServicePhases(steps, {
    orderStatus: "PROCESO",
    orderCreatedAt: CREATED_AT,
  });
  // Dos segmentos PREPARACION distintos (el suelto los separa).
  assert.deepEqual(summary(phases), [
    "INGRESO:done(1/1)",
    "PREPARACION:done(1/1)", // primer tramo, alcanzado
    "PREPARACION:pending(0/1)", // segundo tramo, no alcanzado
  ]);
});

test("Último alcanzado es un suelto — ningún segmento current", () => {
  const steps: PhaseStep[] = [
    step(0, "INGRESO", CREATED_AT),
    step(1, "PREPARACION"), // no alcanzado
    step(2, null, new Date("2026-06-23T12:00:00Z")), // suelto alcanzado (último real)
  ];
  const phases = computeServicePhases(steps, {
    orderStatus: "PROCESO",
    orderCreatedAt: CREATED_AT,
  });
  assert.deepEqual(summary(phases), [
    "INGRESO:done(1/1)",
    "PREPARACION:pending(0/1)",
  ]);
  assert.ok(!phases.some((p) => p.state === "current"), "sin current");
});

test("Orden LISTO — todos los segmentos forzados a done", () => {
  const steps: PhaseStep[] = [
    step(0, "INGRESO"),
    step(1, "PREPARACION"),
    step(2, "PINTURA"),
  ];
  const phases = computeServicePhases(steps, {
    orderStatus: "LISTO",
    orderCreatedAt: CREATED_AT,
  });
  assert.ok(
    phases.every((p) => p.state === "done"),
    "todos done en estado terminal"
  );
});

test("Orden ENTREGADO — todos done aunque falten reachedAt", () => {
  const steps: PhaseStep[] = [step(0, "INGRESO"), step(1, "PINTURA")];
  const phases = computeServicePhases(steps, {
    orderStatus: "ENTREGADO",
    orderCreatedAt: CREATED_AT,
  });
  assert.ok(phases.every((p) => p.state === "done"));
});

test("Sin steps con stage (todos sueltos) — barra vacía", () => {
  const steps: PhaseStep[] = [step(0, null), step(1, null)];
  const phases = computeServicePhases(steps, {
    orderStatus: "PROCESO",
    orderCreatedAt: CREATED_AT,
  });
  assert.deepEqual(phases, []);
});

test("Sin steps — barra vacía", () => {
  const phases = computeServicePhases([], {
    orderStatus: "PROCESO",
    orderCreatedAt: CREATED_AT,
  });
  assert.deepEqual(phases, []);
});

test("Caso auditoría OT-1042 — la barra ya NO afirma PREPARACION completa", () => {
  // Estado real observado en Chrome: único reachedAt en "Barniz" (avance UI);
  // ingreso anclado por createdAt; PREPARACION sin un solo reachedAt.
  const steps: PhaseStep[] = [
    step(0, "INGRESO"), // Vehículo ingresado (ancla)
    step(1, "PREPARACION"), // Desarme y enmascarado
    step(2, "PREPARACION"), // Masillado y lijado
    step(3, "PREPARACION"), // Imprimación
    step(4, "PINTURA"), // Color aplicado (sin reachedAt)
    step(5, "PINTURA", new Date("2026-06-23T14:00:00Z")), // Barniz (avanzado → reachedAt)
    step(6, "DETAIL_ENTREGA"), // Armado final
  ];
  const phases = computeServicePhases(steps, {
    orderStatus: "PROCESO",
    orderCreatedAt: CREATED_AT,
  });
  assert.deepEqual(summary(phases), [
    "INGRESO:done(1/1)",
    "PREPARACION:pending(0/3)", // ANTES la barra la pintaba "done" — el bug
    "PINTURA:current(1/2)", // refleja exactamente el único reachedAt real
    "DETAIL_ENTREGA:pending(0/1)",
  ]);
});

test("Flujo sano y monótono — fases se llenan de izquierda a derecha con un solo current", () => {
  const t = (h: number) => new Date(`2026-06-23T${String(h).padStart(2, "0")}:00:00Z`);
  const steps: PhaseStep[] = [
    step(0, "INGRESO", t(8)),
    step(1, "PREPARACION", t(9)),
    step(2, "PREPARACION", t(10)),
    step(3, "PINTURA", t(11)), // current: 1 de 2 alcanzado
    step(4, "PINTURA"),
    step(5, "DETAIL_ENTREGA"),
  ];
  const phases = computeServicePhases(steps, {
    orderStatus: "PROCESO",
    orderCreatedAt: CREATED_AT,
  });
  assert.deepEqual(summary(phases), [
    "INGRESO:done(1/1)",
    "PREPARACION:done(2/2)",
    "PINTURA:current(1/2)",
    "DETAIL_ENTREGA:pending(0/1)",
  ]);
  assert.equal(
    phases.filter((p) => p.state === "current").length,
    1,
    "exactamente un current en flujo sano"
  );
});

test("steps desordenados — el selector los ordena por sortOrder", () => {
  const steps: PhaseStep[] = [
    step(2, "PINTURA"),
    step(0, "INGRESO"),
    step(1, "PREPARACION"),
  ];
  const phases = computeServicePhases(steps, {
    orderStatus: "PROCESO",
    orderCreatedAt: CREATED_AT,
  });
  assert.deepEqual(
    phases.map((p) => p.stage),
    ["INGRESO", "PREPARACION", "PINTURA"]
  );
});

test("currentPhaseLabel — devuelve el segmento current", () => {
  const phases = computeServicePhases(
    [
      step(0, "INGRESO"),
      step(1, "PINTURA", new Date("2026-06-23T14:00:00Z")), // current (1 de 2 más abajo)
      step(2, "PINTURA"),
    ],
    { orderStatus: "PROCESO", orderCreatedAt: CREATED_AT }
  );
  assert.equal(currentPhaseLabel(phases), "Pintura");
});

test("currentPhaseLabel — sin current, devuelve la última fase done", () => {
  // OT recién creada: INGRESO done por ancla, resto pending, ningún current.
  const phases = computeServicePhases(
    [step(0, "INGRESO"), step(1, "PREPARACION"), step(2, "PINTURA")],
    { orderStatus: "PROCESO", orderCreatedAt: CREATED_AT }
  );
  assert.ok(!phases.some((p) => p.state === "current"));
  assert.equal(currentPhaseLabel(phases), "Ingreso");
});

test("currentPhaseLabel — sin fases, null", () => {
  assert.equal(currentPhaseLabel([]), null);
});

test("currentPhaseLabel — caso OT-1042 = Pintura", () => {
  const phases = computeServicePhases(
    [
      step(0, "INGRESO"),
      step(1, "PREPARACION"),
      step(2, "PREPARACION"),
      step(3, "PREPARACION"),
      step(4, "PINTURA"),
      step(5, "PINTURA", new Date("2026-06-23T14:00:00Z")),
      step(6, "DETAIL_ENTREGA"),
    ],
    { orderStatus: "PROCESO", orderCreatedAt: CREATED_AT }
  );
  assert.equal(currentPhaseLabel(phases), "Pintura");
});

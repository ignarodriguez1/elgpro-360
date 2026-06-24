# Hallazgos — Verificación de supuestos (Fase 0, barra emergente)

> Read-only. Confirma los campos/paths concretos antes de escribir el selector `computeServicePhases`.
> Precondición #1: ningún archivo de `src` modificado en los últimos 15 min → sin agente concurrente. Working tree limpio (verificado en la auditoría previa). No se corrió git (precondición #2).

## Resultado: todos los supuestos del plan se confirman. Vía libre para Fase 1.

| # | Supuesto | Estado | Evidencia |
|---|---|---|---|
| 1 | `WorkOrderStatusUpdate.stage` es `OrderStage?` (nullable) | ✅ | [schema.prisma:117](prisma/schema.prisma#L117) `stage OrderStage?` |
| 2 | Los steps custom quedan con `stage == null` | ✅ **(clave)** | `NewStateForm.submit()` no envía `stage` ([NewStateForm.tsx:69-76](src/components/admin/NewStateForm.tsx#L69)); `statusUpdateSchema.stage` es `optional()` sin default ([validations.ts:61](src/lib/validations.ts#L61)); `createStatusUpdate` escribe `stage: data.stage` (=undefined → null) ([status-update.service.ts:60](src/services/status-update.service.ts#L60)) |
| 3 | Los custom tienen `reachedAt` propio | ✅ | `createStatusUpdate` setea `reachedAt: new Date()` ([status-update.service.ts:65](src/services/status-update.service.ts#L65)). Irrelevante para la barra (stage=null → no entra), pero confirma que el step es real y actúa de frontera |
| 4 | `STAGE_LABELS` exportado y usable por `stage` | ✅ | [stages.ts:12-17](src/lib/stages.ts#L12) `Record<OrderStage, string>` |
| 5 | `order.statusUpdates` trae `stage`, `reachedAt`, `sortOrder`, ordenado | ✅ | `getWorkOrderById` incluye `statusUpdates` con `orderBy: sortOrder asc` y sin `select` (devuelve todos los escalares) ([work-order.service.ts:197-202](src/services/work-order.service.ts#L197)) |
| 6 | `order.createdAt` y `order.status` disponibles | ✅ | `findUnique` del WorkOrder devuelve ambos escalares |
| 7 | StageBar interfaz actual = `stageIndex: number` + `variant` | ✅ | [StageBar.tsx:13-18](src/components/shared/StageBar.tsx#L13) |
| 8 | Admin usa barras inline (no `StageBar`) | ✅ | mobile `tod-bar` ([admin page:71-77](src/app/admin/ordenes/[id]/page.tsx#L71)), desktop `od2-stages-track` ([180-196](src/app/admin/ordenes/[id]/page.tsx#L180)) |

## Los 4 call sites a tocar (cálculo actual `stageIndex(order.stage)`)

| Superficie | Archivo | Línea | Hoy |
|---|---|---|---|
| cómputo cliente | [clientes/.../page.tsx](src/app/clientes/vehiculos/[id]/page.tsx#L51) | 51 | `idx = stageIndex(order.stage)` |
| barra cliente mobile | [clientes/.../page.tsx](src/app/clientes/vehiculos/[id]/page.tsx#L83) | 83 | `<StageBar stageIndex={idx} />` |
| barra cliente desktop | [clientes/.../page.tsx](src/app/clientes/vehiculos/[id]/page.tsx#L174) | 174 | `<StageBar stageIndex={idx} variant="desktop" />` |
| cómputo admin | [admin/.../page.tsx](src/app/admin/ordenes/[id]/page.tsx#L31) | 31-33 | `idx = stageIndex(order.stage)` |
| barra admin mobile | [admin/.../page.tsx](src/app/admin/ordenes/[id]/page.tsx#L71) | 71-77 | inline `tod-bar` |
| barra admin desktop | [admin/.../page.tsx](src/app/admin/ordenes/[id]/page.tsx#L180) | 180-196 | inline `od2-stages-track` |

## Decisión de data path (importante)

La barra del cliente se computa **en SSR desde `order.statusUpdates`** (ya filtrado por visibilidad para `CUSTOMER` en `getWorkOrderById:214-217`, y con `reachedAt`/`sortOrder`/`stage`), **no** desde el stream del seam.

Razón: la proyección del seam (`CustomerTimelineUpdate`, [order-live.ts:41-51](src/lib/order-live.ts#L41)) **NO incluye `reachedAt` ni `sortOrder`**. Computar desde `order.statusUpdates` evita tocar el seam y mantiene la barra correcta al cargar (consistente con "barra no gateada por R1, no cableada al `OrderLiveProvider`").

Precedente: el cliente **ya** pasa `order.statusUpdates` a `StageDurations` ([clientes/.../page.tsx:89](src/app/clientes/vehiculos/[id]/page.tsx#L89)) — el patrón existe.

> Consecuencia para un futuro live de la barra (fuera de alcance, gateado por R1): habría que agregar `reachedAt`+`sortOrder` a la proyección del seam.

## Notas

- Modo "Siguiente etapa" del `NewStateForm` autocompleta solo el **título** (desde `STAGE_LABELS`), igual no envía `stage` → también queda `stage=null`. El avance real del plan es "Avanzar etapa" (`advanceStepAction` → `advanceToNextStep`, que sí mueve un step con `stage` y setea `reachedAt`). Coherente con el modelo: los steps del plan llevan `stage` y mueven la barra; los inserts custom son frontera.
- `currentStageIndex` que recibe `NewStateForm` (= `idx`) hoy sale de `stageIndex(order.stage)`. Al cambiar la fuente de `idx`, hay que revisar qué pasarle (ver decisión abierta).

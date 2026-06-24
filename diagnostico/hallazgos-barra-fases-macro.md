# Hallazgos — Barra horizontal de fases macro vs. steps reales

> Auditoría **read-only** (Fase 0). No se tocó código, schema, migraciones ni git.
> Working tree limpio (`git status` vacío, branch `main`) al iniciar → sin interferencia concurrente.
> Reproducción en Chrome real sobre el dev server `elg-pro-dev` (`:3000`), OT-1042.
> Proyecto: `elg-pro-360` (Next 16 / React 19 / Tailwind v4 / Prisma 7).

---

## 1. Resumen ejecutivo

La barra horizontal de 4 fases macro **no deriva de los steps**: lee un escalar denormalizado **`WorkOrder.stage`** (`OrderStage`) y lo convierte en índice con `stageIndex(order.stage)`. El timeline vertical, en cambio, deriva su verdad de campos **por-step** (`confirmed`, y la fecha del índice 0 vía `createdAt`). Son **dos fuentes de verdad independientes**, atadas a campos distintos, con umbrales de honestidad distintos.

`WorkOrder.stage` puede afirmar `PINTURA` sin que exista **ningún** timestamp real (`reachedAt`) de los pasos intermedios: el seed marca `confirmed: i <= currentIndex` sin escribir `reachedAt`, y la barra solo mira el escalar. Resultado reproducido en OT-1042: la barra pinta `INGRESO`✓ · `PREPARACIÓN`✓ · `PINTURA`● mientras el único timestamp real de toda la OT es el ingreso (`23 jun · 08:51`). La hipótesis del pedido se **confirma**: la barra afirma más avance del que el dato real respalda → violación del principio de honestidad / "parece que funciona, no funciona".

La buena noticia para el fix: el mapeo step→fase **existe y es explícito** (cada step tiene su `stage`), y ya hay una función honesta que reduce steps→fases por `reachedAt` (`computeStageDurations`). **Opción A (derivar la barra de los steps) es viable y barata.** No hay nada que fuerce la Opción B.

---

## 2. Mapa de componentes

| Concepto | Portal cliente | Panel admin |
|---|---|---|
| **Barra horizontal** | Componente consolidado **`StageBar`** (`src/components/shared/StageBar.tsx`), 2 instancias (mobile + desktop) | **NO usa `StageBar`** — markup **inline duplicado**: mobile `tod-bar`/`tod-bar-seg` y desktop `od2-stages-track`/`od2-snode` |
| **Timeline vertical** | `Timeline` (`src/components/shared/Timeline.tsx`) vía `CustomerTimeline` (seam) | `Timeline` directo, `mode="admin"` |

Paths exactos de la barra:
- Cliente mobile: [page.tsx:83](src/app/clientes/vehiculos/[id]/page.tsx#L83) → `<StageBar stageIndex={idx} />`
- Cliente desktop: [page.tsx:174](src/app/clientes/vehiculos/[id]/page.tsx#L174) → `<StageBar stageIndex={idx} variant="desktop" />`
- Admin mobile: [admin/.../page.tsx:71-77](src/app/admin/ordenes/[id]/page.tsx#L71) (`tod-bar`)
- Admin desktop: [admin/.../page.tsx:180-196](src/app/admin/ordenes/[id]/page.tsx#L180) (`od2-stages-track`)

Paths del timeline vertical:
- Compartido: [Timeline.tsx](src/components/shared/Timeline.tsx) — `mode: "customer" | "admin"`.
- Cliente mobile [page.tsx:87](src/app/clientes/vehiculos/[id]/page.tsx#L87), desktop [page.tsx:178](src/app/clientes/vehiculos/[id]/page.tsx#L178); admin mobile [page.tsx:87](src/app/admin/ordenes/[id]/page.tsx#L87), desktop [page.tsx:203](src/app/admin/ordenes/[id]/page.tsx#L203).

**Q1 — Son componentes distintos.** Barra ≠ Timeline, confirmado.

**Q2 — Resolución de nomenclatura (crítica):**
- En el **portal cliente**, la barra **SÍ es el `StageBar` consolidado** (presentacional puro: recibe `stageIndex` y pinta). `StageBar` en sí **está bien**; el problema **no** está en `StageBar` sino en **el dato que alimenta `stageIndex`**.
- En el **admin**, la barra **NO es `StageBar`** — son **dos implementaciones inline paralelas** (mobile + desktop) que reimplementan la misma lógica visual pero comparten la **misma fuente de datos**.

Conclusión: el problema es de **fuente de datos**, común a las 4 superficies de render; y de paso queda documentado que el admin tiene una barra duplicada inline que el cliente ya consolidó en `StageBar`.

---

## 3. Fuente de verdad de la barra

**Es `WorkOrder.stage` (escalar `OrderStage` denormalizado).** No es `updatedAt`, no es un conteo de steps, no es un array hardcodeado de estado.

Cómputo del índice (idéntico en ambas áreas):
- Cliente: [page.tsx:51](src/app/clientes/vehiculos/[id]/page.tsx#L51)
  ```ts
  const idx = order ? (isReady ? STAGE_ORDER.length : stageIndex(order.stage)) : 0;
  ```
- Admin: [page.tsx:31-33](src/app/admin/ordenes/[id]/page.tsx#L31)
  ```ts
  const idx = order.status === "LISTO" || order.status === "ENTREGADO"
    ? STAGE_ORDER.length
    : stageIndex(order.stage);
  ```
- `stageIndex` = `STAGE_ORDER.indexOf(stage)` ([stages.ts:23-25](src/lib/stages.ts#L23)).

El schema lo dice **literalmente** — [schema.prisma:96](prisma/schema.prisma#L96):
```prisma
stage  OrderStage  @default(INGRESO) // etapa macro actual (barra de progreso)
```

**Dónde se escribe `WorkOrder.stage`** (cada write es independiente de los timestamps de steps):
| Función | Línea | Valor | Caller UI |
|---|---|---|---|
| `createWorkOrder` | [148](src/services/work-order.service.ts#L148) | `initialStage` (INGRESO) | alta de OT |
| `advanceToNextStep` | [303](src/services/work-order.service.ts#L303) | `next.stage` | **"Avanzar etapa"** (`advanceStepAction`) |
| `markStepAsCurrent` | [364](src/services/work-order.service.ts#L364) | `target.stage` | **sin caller en UI** (latente) |
| `markAsReady` | [421](src/services/work-order.service.ts#L421) | `DETAIL_ENTREGA` | "Marcar listo" |
| `seed materialize` | [seed.ts:282](prisma/seed.ts#L282) | `steps[currentIndex].stage` | (datos demo) |

> **NO** lo escribe `createStatusUpdate` (estado custom): inserta el step con `reachedAt: new Date()` ([status-update.service.ts:65](src/services/status-update.service.ts#L65)) pero **no mueve `WorkOrder.stage`** → divergencia inversa (ver §5).

---

## 4. Catálogo de fases (Q4)

**Fijo. 4 fases macro, cableadas, iguales para TODA OT** — no varían por tipo de servicio.

- Enum: [schema.prisma:22-27](prisma/schema.prisma#L22) → `INGRESO`, `PREPARACION`, `PINTURA`, `DETAIL_ENTREGA`.
- Orden de la barra: [stages.ts:4-9](src/lib/stages.ts#L4) (`STAGE_ORDER` hardcodeado).
- Labels/iconos: [stages.ts:12-20](src/lib/stages.ts#L12).

Implicancia: el flujo macro está **cableado a un proceso de pintura**. Un servicio que no pinta (p. ej. detailing/ceramic) igual muestra las 4 fases con `PINTURA` en el medio, aunque su flujo nunca atraviese esa etapa (en el seed, "Ceramic Coating" mapea sus steps a `INGRESO`/`PREPARACION`/`DETAIL_ENTREGA`, salteando `PINTURA`). La barra **siempre dibuja 4**, traverse o no.

---

## 5. Mapeo step → fase (Q5)

**Existe y es explícito.** Cada paso lleva su propia `stage`:
- Plantilla de servicio: `ServiceFlowStep.stage OrderStage` ([schema.prisma:217](prisma/schema.prisma#L217)).
- Step materializado de la OT: `WorkOrderStatusUpdate.stage OrderStage?` ([schema.prisma:117](prisma/schema.prisma#L117), comentado "deriva la stage de la orden").
- `buildInitialTimeline` copia `step.stage` al materializar ([work-order.service.ts:89-95](src/services/work-order.service.ts#L89)).

**Pero la barra NO usa ese mapeo directamente.** Usa el escalar denormalizado `WorkOrder.stage`. El mapeo per-step está disponible y es la base natural para la Opción A — hoy la barra lo **bypassea**.

Divergencia inversa derivada de esto: un **estado custom** creado por el admin obtiene `reachedAt` real pero **no** actualiza `WorkOrder.stage` → la barra puede **quedarse atrás** de un evento real con timestamp.

---

## 6. Timestamps de fase (Q6)

Las **fases macro no tienen timestamp propio.** No existe `reachedAt` por fase; `StageBar` ni siquiera tiene slot de fecha. El tiempo es propiedad del **step**:
- `WorkOrderStatusUpdate.createdAt` y `WorkOrderStatusUpdate.reachedAt` ([schema.prisma:126-127](prisma/schema.prisma#L126)) — `reachedAt` = "momento real en que el taller ALCANZÓ este paso".
- El tiempo por fase se **deriva** de los `reachedAt` de los steps vía `computeStageDurations` (§9).

Que la barra no muestre fechas es **por diseño** (no tiene dónde), no porque falten: las fechas viven en los steps.

---

## 7. Traza de la divergencia (Q7) — OT-1042, reproducida en Chrome

**Datos sembrados** ([seed.ts:269-290](prisma/seed.ts#L269)):
- `order1CurrentIndex` = índice de `"Color aplicado"` = **4** (fase `PINTURA`).
- `WorkOrder.stage = order1Steps[4].stage = PINTURA`.
- `materialize` ([seed.ts:152-163](prisma/seed.ts#L152)):
  ```ts
  isCurrent: i === currentIndex,
  confirmed: i <= currentIndex,   // 0..4 = true; 5,6 = false
  // ⚠ NO setea reachedAt; NO setea createdAt explícito → todos comparten el createdAt del seed
  ```
  → steps 0-4 `confirmed:true` **sin un solo `reachedAt`**; un único `createdAt` compartido.

**Estado actual en runtime** (extraído del DOM en `/admin/ordenes/cmqql3nw8001kkwhikgy39gm1`): alguien usó **"Avanzar etapa"** una vez → `isCurrent` saltó a `"Barniz"` (5), `advanceToNextStep` le escribió `reachedAt` y dejó `WorkOrder.stage = PINTURA`.

**Cómputo de la barra:** `idx = stageIndex(PINTURA) = 2` → pinta:

```
Ingreso ✓done   Preparación ✓done   ● Pintura (actual)   Detail/Entrega (pendiente)
```

**Cómputo del timeline vertical** ([Timeline.tsx:165-173](src/components/shared/Timeline.tsx#L165) y [240-246](src/components/shared/Timeline.tsx#L240)):
```ts
i === 0            → fecha real (fmtDate(createdAt))
i>0 && confirmed===false → "Pendiente"
else               → null  (ni fecha ni "Pendiente": en blanco)
```

Render real observado (DOM, idéntico en ambos árboles):

| Step | stage | confirmed | Timeline muestra | Barra dice |
|---|---|---|---|---|
| Vehículo ingresado | INGRESO | true | **23 jun · 08:51** | done |
| Desarme y enmascarado | PREPARACION | true | *(en blanco)* | done |
| Masillado y lijado | PREPARACION | true | *(en blanco)* | done |
| Imprimación | PREPARACION | true | *(en blanco)* | done |
| Color aplicado | PINTURA | true | *(en blanco)* | actual |
| Barniz | PINTURA | true (isCurrent) | *(en blanco, "Ahora")* | actual |
| Armado final | DETAIL_ENTREGA | false | **Pendiente** | pendiente |

**Por qué diverge (causa raíz, en una línea):** la barra confía en `WorkOrder.stage`, que fue llevado a `PINTURA` **sin evidencia temporal por-step** (el seed marcó `confirmed` hasta PINTURA con cero `reachedAt`); el timeline solo dibuja fecha real para el índice 0 y "Pendiente" para `confirmed:false`. **Campos distintos, honestidad distinta** → la barra afirma 2 fases completas + 1 alcanzada, cuando el único timestamp real de la OT es el ingreso.

> Matiz de honestidad triple: hay **tres** lecturas del avance, atadas a **tres** campos:
> 1. **Barra** → `WorkOrder.stage` → "PINTURA" (la más optimista, sin requerir timestamps).
> 2. **Timeline** → `confirmed` + `createdAt` del índice 0 → ingreso fechado, resto en blanco/Pendiente.
> 3. **Tiempos por etapa** → `reachedAt` → la más honesta; con el seed puro mostraba nada (`hasDurationData=false`), tras el avance a Barniz aparece (1 step con `reachedAt`).

---

## 8. Cobertura dual-DOM (Q8)

El layout monta **los dos árboles a la vez** y conmuta por CSS (`.only-mobile` / `.only-desktop`, breakpoint 859px). Prueba en runtime: el DOM tenía **14 filas `.atl-row` (7 steps × 2 árboles)** coexistiendo.

- **Cliente:** mismo componente `StageBar`, **2 instancias** — `variant` default (mobile, clases `od-stage-*`) y `variant="desktop"` (clases `pwod-*`). **Mismo `idx`, mismo data path.**
- **Admin:** **2 implementaciones inline distintas** — `tod-bar` (mobile) y `od2-stages-track` (desktop). **Mismo `idx`.**

→ En total **4 sitios de render** de la barra, **1 sola fuente de datos** (`stageIndex(order.stage)`).

---

## 9. Cobertura cliente / admin + seam (Q9)

- **¿Mismo componente?** No (cliente = `StageBar`; admin = inline ×2).
- **¿Mismo data path?** **Sí.** Ambos: `idx = stageIndex(order.stage)`, con `order` de `getWorkOrderById`.
- **¿El seam toca el dato de la barra?** **No.**
  - `projectUpdateForCustomer` ([order-live.ts:99](src/lib/order-live.ts#L99)) proyecta **updates** (stripea `createdBy`/notas internas) — **no toca `order.stage`**. `CustomerOrderView.stage` ([order-live.ts:54-59](src/lib/order-live.ts#L54)) lleva el mismo valor crudo.
  - `getWorkOrderById` para `CUSTOMER` ([work-order.service.ts:214-219](src/services/work-order.service.ts#L214)) filtra `statusUpdates` por visibilidad y anula `internalNotes`, pero **deja `order.stage` intacto**.
  - → La barra muestra el **mismo `order.stage`** a cliente y a admin. **Sin divergencia de datos entre áreas para la barra.**
- **Gap secundario:** el timeline del cliente sí está filtrado por visibilidad; la barra no. Una OT podría tener pasos no-visibles y aun así la barra (que lee `order.stage`) afirmar una fase que el cliente no puede ver en su timeline filtrado.
- **Nota:** el cliente arma `liveOrder.stage` y lo mete en `OrderLiveProvider` ([page.tsx:56-57, 226](src/app/clientes/vehiculos/[id]/page.tsx#L56)), pero `StageBar` consume el `idx` **calculado en SSR**, no el `order` vivo → la barra del cliente **no se mueve en vivo** sin recarga aunque cambie la stage.

**Verificación:** divergencia reproducida **en vivo en Chrome del lado admin** (desktop + mobile). El lado cliente quedó verificado **a nivel código/data-path** (fuente idéntica, probada arriba); el login de cliente en vivo no completó limpio en el harness de esta sesión (NextAuth) — se documenta con honestidad. La conclusión no cambia: el cliente consume el mismo `order.stage`.

---

## 10. Función reutilizable de fechas veraces (Q10)

**Sí existe**, y hace exactamente la reducción que la barra necesitaría:

- `computeStageDurations(updates, orderStatus)` — [durations.ts:46](src/lib/durations.ts#L46). Filtra steps con `reachedAt != null`, los ordena por `sortOrder`, y devuelve por fase `{ stage, label, ms, reached, current }`. La **fase en curso** = `stage` del último step alcanzado. **Solo cuenta lo realmente registrado** (steps sin `reachedAt` no suman).
- `hasDurationData(rows)` — [durations.ts:84](src/lib/durations.ts#L84).
- Ya la consume `StageDurations` ([StageDurations.tsx:35](src/components/shared/StageDurations.tsx#L35)).

Además, el timeline ya tiene su propio predicado de "alcanzado vs pendiente": el campo **`confirmed`** ([Timeline.tsx:171, 244](src/components/shared/Timeline.tsx#L171)).

→ Para Opción A, el `stageIndex` honesto se puede derivar de los steps por cualquiera de los dos predicados (`reachedAt` o `confirmed`). **La función para `reachedAt` ya está escrita.** Eso hace la Opción A barata.

---

## 11. Recomendación

### Opción A — derivar la barra de los steps (recomendada)
**Viable y de bajo costo.** El mapeo step→fase existe (§5), la reducción honesta existe (§10), y los componentes de barra (`StageBar` + inline admin) son presentacionales: solo cambia **qué `idx` reciben**.

- **Cambio puntual:** reemplazar `idx = stageIndex(order.stage)` por un `idx` derivado de los steps, en **2 call sites**: [cliente page.tsx:51](src/app/clientes/vehiculos/[id]/page.tsx#L51) y [admin page.tsx:31-33](src/app/admin/ordenes/[id]/page.tsx#L31).
- **Sin tocar** `StageBar`, las barras inline del admin, ni el Timeline vertical.
- **Sin cambio de schema** (`stage`, `confirmed`, `reachedAt` ya existen). `WorkOrder.stage` puede quedar como caché para listados/filtros (`@@index([stage])`), pero **deja de ser la fuente de la barra**.
- Costo estimado: **bajo** (un selector + 2 líneas), + alinear los tests/datos demo.

### Opción B — eliminar la barra
**No forzada.** Las fases mapean a steps de forma estable (cada step tiene `stage`), así que no hay impedimento estructural para A. La barra aporta un "zoom out" útil de 4 fases que el timeline no da de un vistazo; eliminarla pierde ese valor. **No recomendada**, salvo decisión de producto.

> Nada en esta auditoría **fuerza** B.

---

## 12. Preguntas abiertas / decisiones para Valentín

1. **¿Cuál es el campo canónico de "alcanzado": `confirmed` o `reachedAt`?** Hoy el timeline usa `confirmed` y los tiempos usan `reachedAt`, y **no coinciden** en datos sembrados/saltados. La Opción A debe elegir uno para que barra y timeline no puedan contradecirse. (Recomendación técnica: unificar en `reachedAt` como verdad, con `confirmed` como intención de plan.)
2. **Timeline TI2/S3:** el código dice "Provisorio hasta que exista `reachedAt` (S3)" — hoy el timeline **solo** muestra fecha del índice 0 e ignora `reachedAt` de los demás. ¿Se completa ahora el render de fechas reales por step? Esto **por sí solo** cerraría buena parte de la percepción de "no pasó nada".
3. **Seed demo:** `materialize` marca `confirmed` sin `reachedAt` y con `createdAt` único → las OTs demo nacen divergentes. ¿Se ajusta el seed (reachedAt + createdAt escalonado) para que el demo sea honesto, o se asume que prod solo avanza vía "Avanzar etapa" (que sí es consistente)?
4. **`markStepAsCurrent`** existe pero **no tiene caller en UI**: si se llega a cablear, salta `WorkOrder.stage` **sin** confirmar los steps intermedios → reintroduce la divergencia. ¿Se elimina, o se le agrega backfill de `confirmed`/`reachedAt`?
5. **Estado custom:** `createStatusUpdate` pone `reachedAt` real pero **no** mueve `WorkOrder.stage` (§5). ¿Un estado custom debería poder avanzar la fase macro?
6. **4 fases fijas para servicios que no pintan (§4):** ¿se acepta mostrar siempre las 4, o la barra debería adaptarse a las fases que el flujo del servicio realmente atraviesa?
7. **Barra del cliente no es "en vivo"** (§9): consume el `idx` de SSR, no el `order` del provider. ¿Se cablea a `OrderLiveProvider` cuando se haga A?

---

### Apéndice — precondiciones de la auditoría

| # | Precondición | Estado |
|---|---|---|
| 1 | Read-only absoluto | ✅ sin cambios de código/schema/git |
| 2 | Sin interferencia concurrente | ✅ working tree limpio, branch `main` |
| 3 | No reestructurar consolidado | ✅ `StageBar`/Timeline no tocados; se documenta que el problema es la fuente de datos, no `StageBar` |
| 4 | 3 áreas independientes | ✅ mapeadas por separado (cliente vs admin) |
| 5 | Dual-DOM | ✅ ambos árboles mapeados y observados (14 filas) |
| 6 | Verdad temporal (`MAX(createdAt)`, nunca `updatedAt`) | ✅ la barra **no** usa `updatedAt`; usa `WorkOrder.stage` (defecto distinto, documentado) |
| 7 | Verificación en Chrome real | ✅ admin en vivo (desktop+mobile); cliente por data-path idéntico |

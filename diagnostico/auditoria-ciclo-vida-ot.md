# Auditoría — Ciclo de vida de la OT en progreso

> **Track:** completitud funcional. **Naturaleza:** solo diagnóstico (cero cambios de código/schema/git).
> **Fecha:** 2026-06-19 · **Verificación:** lectura de fuente + runtime (app levantada, DB seedeada, admin + portal cliente).
> **Stack:** Next.js 16.2.6 · React 19.2 · Prisma 7 · Postgres · Auth.js v5 (Credentials/JWT) · Cloudinary.

---

## Resumen ejecutivo

El ciclo de la OT tiene un **núcleo de datos más coherente de lo que aparenta**: la secuencia real que el operario recorre NO son las 4 etapas del enum `OrderStage`, sino la **hoja de ruta del servicio** (`FlowStep`) materializada por OT como lista de `WorkOrderStatusUpdate` (snapshot al crear). `OrderStage` es solo la **etiqueta macro derivada** del paso actual. Las transiciones de macro-estado (`PROCESO→LISTO→ENTREGADO`) están bien restringidas y son atómicas (`$transaction` + `AuditLog`). Hasta acá, sólido.

Las brechas se concentran en **lo que el ciclo registra-pero-no-muestra y en el cierre**: (1) la **atribución existe en datos pero nunca se renderiza** (autor invisible en admin y cliente); (2) los **tiempos por etapa no son calculables** porque los pasos se materializan todos con `createdAt` = momento de creación y avanzar solo mueve flags, sin estampar "cuándo se alcanzó"; (3) el **avance no integra captura de imagen** ni ofrece "Sin imagen" (el flujo objetivo no existe todavía, y arrastra el bug de `publicId` descartado → dep. `01`); (4) el **cierre es incompleto**: entregar no deja rastro visible en el timeline del cliente y la **OT entregada es un dead-end** (el historial linkea a la OT activa, no hay ruta a la entregada). La **fuente de verdad de la barra macro está triplicada** en la UI (dep. `02`).

Y un hallazgo que pasó a primer plano: **el ciclo no se puede manejar por UI**. Los componentes que importan server actions (avanzar etapa, nuevo estado, marcar listo/entregado, alta de OT) **no hidratan** — el click queda inerte. Es **reproducible en instancia fresca**, en Chrome real contra `localhost`, sin proxy del harness, sin chunks fallidos ni errores: la evidencia indica un **defecto real (BLOQUEANTE)**, no un artefacto del entorno (ver R1). Por eso las mecánicas se verificaron por fuente + HTML server-rendered, no por UI.

---

## Nota de verificación en runtime

| Qué | Cómo se verificó |
|---|---|
| Modelo de estados, materialización, transiciones, atomicidad | Lectura de `work-order.service.ts`, `status-update.service.ts`, `schema.prisma` |
| Timeline, timestamps, atribución (lo que se muestra) | HTML server-rendered del portal cliente y del detalle admin (no depende de hidratación) |
| Gate de imagen al avanzar (ausencia) | Runtime: pulsar "Avanzar etapa" no abre diálogo ni `input[type=file]` + lectura de `advanceStepAction` |
| Dead-end de OT entregada | Lectura de `historial/page.tsx` (`<Link href=/clientes/vehiculos/[id]>`) |
| Transiciones vivas por UI (avanzar/nuevo estado/entregar) | **No se pudo** — islas interactivas admin sin hidratar (R1). Verificado por fuente. |

---

## Gap-map

> Severidad: **bloqueante / alta / media / baja**. Un bloque por hallazgo.
> `OK` = comportamiento coherente verificado (se documenta para fijar la línea de base, no es brecha).

### Modelo de estados

**M1 · OK — Fuente de verdad única de la secuencia (por OT)**
La secuencia la define el `flow` del/los servicio(s), materializado en `WorkOrderStatusUpdate` al crear la OT (`buildInitialTimeline` + `createWorkOrder`), es un **snapshot** (editar el servicio luego no toca OTs creadas). `advanceToNextStep` recorre esa lista por `sortOrder` y recalcula `WorkOrder.stage`.
*Archivos:* `src/services/work-order.service.ts:64-182`, `:256-312`. *Dep.:* base para `02`.

**M2 · media — Barra macro de 4 segmentos triplicada y divergente**
El enum `OrderStage` (4 etapas) se dibuja en **tres** implementaciones distintas: admin mobile `.tod-bar` (hardcoded), admin desktop `.od2-snode` (nodos 1–4), y cliente `StageBar`. No comparten componente → riesgo de drift visual.
*Actual:* 3 renders independientes. *Esperado:* una fuente/representación. *Brecha:* duplicación de la proyección macro.
*Archivos:* `src/app/admin/ordenes/[id]/page.tsx` (`.tod-bar` ~l.70, `.od2-snode` ~l.175), `src/components/shared/StageBar.tsx`. *Dep.:* **consolidación `02`**.

**M3 · media — La barra macro es una proyección gruesa que puede mentir**
La barra asume exactamente las 4 etapas del enum en orden fijo, pero el plan real es N pasos materializados del servicio. Si un servicio no cubre las 4 etapas (o las repite), la barra no representa el progreso real del plan.
*Actual:* progreso = etapa macro del paso actual. *Esperado:* progreso coherente con el plan real. *Brecha:* desajuste plan-vs-proyección. *Dep.:* `02` (define dónde queda la fuente de verdad de etapas). Cruza con C2.

**M4 · OK — "etapa" vs "estado intermedio" son conceptos distintos pero ligados**
`OrderStage` (macro) se **deriva** del `stage` del `WorkOrderStatusUpdate` actual. La fusión que pide el modelo objetivo (gate de foto al avanzar) es **viable**: hay un único punto de transición de paso (`advanceToNextStep`) donde colgar la integración. Ver V1.

### Transición ("avanzar etapa")

**T1 · alta — El avance no pide imagen ni ofrece "Sin imagen"**
*Actual (runtime + código):* pulsar "Avanzar etapa" mueve `isCurrent` y listo; no abre diálogo, no exige artefacto. *Esperado:* gate de imagen con escape "Sin imagen" antes de confirmar. *Brecha:* el flujo objetivo no existe.
*Archivos:* `advanceStepAction` `src/app/admin/ordenes/[id]/actions.ts:110-121`, `advanceToNextStep` `work-order.service.ts:256-312`. *Dep.:* **`01`** (cableado de `onUpload`).

**T2 · OK — La transición es atómica**
`advanceToNextStep` envuelve flip de `isCurrent` + update de `stage` + `AuditLog` en una `$transaction`. Si falla a mitad, revierte. Igual `markReady`/`markDelivered` con `assertTransition`.
*Archivos:* `work-order.service.ts:281-309`.

**T3 · alta — El avance no estampa "cuándo se alcanzó" el paso**
La transición registra actor+timestamp **solo en `AuditLog`** (`STEP_ADVANCED`). El `WorkOrderStatusUpdate` alcanzado NO recibe un timestamp de "alcanzado"; conserva su `createdAt` original (= creación de la OT). Raíz del problema de tiempos (ver TI1).
*Archivos:* `work-order.service.ts:288-291`. *Dep.:* requiere campo de schema futuro (`reachedAt`).

### Estados intermedios

**E1 · baja — El alta de estado intermedio ya es un flujo integrado (no engorroso)**
`NewStateForm` es **un solo formulario** (modo "siguiente etapa"/"personalizado", título, descripción, nota interna, fotos opcionales, toggles visibilidad/notificar). La premisa de "engorroso/multi-paso" del objetivo está en buena parte resuelta.
*Archivos:* `src/components/admin/NewStateForm.tsx`.

**E2 · media — Avanzar y "agregar estado con foto" son dos caminos separados**
La integración que pide el objetivo (capturar foto+nota **en el momento de avanzar**) NO existe: avanzar (botón `OrderActions`) y cargar estado con foto (`NewStateForm`, otra sección) son flujos distintos. Avanzar nunca captura foto.
*Archivos:* `OrderActions.tsx` (avance) vs `NewStateForm.tsx` (estado+foto). *Dep.:* `01`, y decisión abierta #7.

**E3 · alta — `publicId`/`ref` se descarta en el `onUpload`**
`UploadZone` devuelve `{ url, thumbnailUrl, ref(=public_id) }`, pero ambos consumidores hacen `files.map(f => f.url)` y **tiran `ref`**. Sin `publicId` no hay borrado en Cloudinary (orfandad/costo).
*Actual:* solo `url` persiste. *Esperado:* persistir `ref`. *Brecha:* pérdida del identificador de borrado.
*Archivos:* `src/components/admin/Wizard.tsx:~208`, `NewStateForm.tsx:~147`; falta campo en schema (ver S1). *Dep.:* **`01`**.

### Tiempos

**TI1 · alta — La duración por etapa NO es calculable con los datos actuales**
*Actual (runtime confirmado):* todos los pasos materializados comparten `createdAt` = creación de la OT. Avanzar solo mueve flags. El timeline (cliente y admin) muestra los 4 pasos con el **mismo** `19 jun · 13:32`. *Esperado:* duración legible por etapa. *Brecha:* no hay marca temporal de "alcanzado"; solo reconstruíble parcialmente desde `AuditLog` (y nada para OTs históricas/seed).
*Archivos:* `work-order.service.ts:148-159` (materialización), `:288-291` (avance sin timestamp). *Dep.:* schema `reachedAt`; decisión abierta #6.

**TI2 · media — Los timestamps mostrados son engañosos para pasos no alcanzados**
El cliente ve pasos futuros (EVALUACIÓN, RESTAURACIÓN, TERMINACIÓN) con un timestamp que parece "ya ocurrió", cuando es la hora de creación. Solo el paso actual lleva "AHORA".
*Archivos:* `src/components/shared/Timeline.tsx` (render de `createdAt`). *Dep.:* ligado a TI1.

**TI3 · media — No se muestra duración por etapa en ningún lado**
No hay cálculo ni display de "tiempo en esta etapa" / "días desde ingreso".
*Archivos:* `Timeline.tsx`, `StageBar.tsx`. *Dep.:* TI1.

### Atribución

**A1 · alta — `createdBy` se trae pero NUNCA se renderiza**
*Actual (runtime confirmado):* la interfaz del Timeline tiene `createdBy?: { name }`, el service lo incluye, pero ningún modo (admin/cliente) lo pinta. Cero filas con autor.
*Esperado:* nombre del autor visible en cada acción. *Brecha:* atribución invisible.
*Archivos:* `Timeline.tsx:~21` (interfaz) y bloques de render `:111-191` / `:195-253` (sin referencia a `createdBy`). *Dep.:* ninguna (solo display).

**A2 · alta — `WorkOrderPhoto` no tiene autor**
Las fotos no registran quién las subió (`WorkOrderPhoto` sin `createdByUserId`). Acción sin rastro de autor.
*Esperado:* toda acción (incl. subir foto) con autor. *Brecha:* campo de schema ausente.
*Archivos:* `schema.prisma:136-150`, `createWorkOrderPhoto` `src/services/upload.service.ts:4-23`. *Dep.:* **migración futura** (registrar, no actuar — ver S2).

**A3 · OK — La atribución a nivel sistema sí existe (interna)**
`WorkOrderStatusUpdate.createdByUserId` se captura en creación/avance/estado, y `AuditLog` guarda `actorId` + `actorEmail` (snapshot inmutable). El "quién" existe; falta **superficie**.
*Archivos:* `schema.prisma:111-134`, `:192-208`.

### Terminal y cierre

**TE1 · OK — En ENTREGADO no se muestran controles de avance**
`OrderActions` con `status==="ENTREGADO"` renderiza "Orden entregada — sin acciones pendientes." (mobile y desktop). Coincide con el objetivo.
*Archivos:* `OrderActions.tsx:47-51`, `:101-106`.

**TE2 · OK — No se puede progresar después de entregado (capa de servicio)**
`advanceToNextStep` corta si `status!=="PROCESO"`; `markReady`/`markDelivered` validan con `assertTransition`. Sin acciones de progreso post-entrega.
*Archivos:* `work-order.service.ts:262-265`, `assertTransition`.

**TE3 · alta — Entregar no deja rastro visible en el timeline del cliente**
`markAsDelivered` actualiza `status` + `actualDeliveryDate` pero **NO crea** un `WorkOrderStatusUpdate` visible (a diferencia de `markAsReady`, que sí crea "Listo para retirar"). El cliente nunca ve un hito "Entregado".
*Actual:* cierre silencioso. *Esperado:* cierre visible. *Brecha:* asimetría ready/delivered.
*Archivos:* `markAsDelivered` `work-order.service.ts:493-530` vs `markAsReady` `:359-427`.

**TE4 · alta — La OT entregada es un dead-end**
*Actual (confirmado):* las tarjetas del historial (mobile y desktop) linkean a `/clientes/vehiculos/[id]` (la OT **activa** del vehículo), no a la OT entregada. **No existe ruta** para ver el timeline/fotos de una OT ya entregada.
*Esperado:* detalle de OST entregada navegable (timeline y fotos accesibles). *Brecha:* sin vista de OT entregada.
*Archivos:* `src/app/clientes/vehiculos/[id]/historial/page.tsx:57` y `:82`. *Dep.:* requiere ruta/vista nueva (no en esta auditoría).

### Coherencia / estados imposibles

**C1 · OK — Boundaries de avance manejados**
Avanzar desde el último paso es no-op (`nextIndex >= length` devuelve el actual); primer paso `isCurrent` en índice 0 al crear. Sin off-by-one evidente.
*Archivos:* `work-order.service.ts:272-276`, `:156-157`.

**C2 · media — La barra macro puede contradecir el paso actual**
Derivado de M3: si el plan diverge de las 4 etapas canónicas, la barra (proyección) puede resaltar una etapa distinta a la del paso actual. Estado "visualmente imposible" sin ser imposible en datos.
*Dep.:* `02`.

**C3 · media — `markStepAsCurrent` permite saltar/retroceder a cualquier paso**
Existe un service que setea cualquier `WorkOrderStatusUpdate` como actual y recalcula `stage` — bypassa la unidireccionalidad a nivel **paso** (el `assertTransition` estricto solo gobierna el macro-status). No se halló cableado a la UI admin, pero el vector existe.
*Actual:* retroceso de paso posible por servicio. *Esperado:* depende de decisión #3. *Brecha:* regla de unidireccionalidad no explícita a nivel paso.
*Archivos:* `markStepAsCurrent` `work-order.service.ts:318+`. *Dep.:* decisión abierta #3; verificar wiring UI.

### Cross-área (admin ↔ cliente, mobile ↔ desktop)

**X1 · OK/media — Misma data, fallas consistentes**
Cliente filtra `visibleToCustomer`; admin ve todo (intencional). Ambos **omiten autor** y muestran los **mismos timestamps engañosos** → son consistentes en sus defectos (A1, TI2 aplican a los dos).

**X2 · baja — Dual-layout renderiza ambos árboles siempre**
El corte 859px es CSS (`.only-mobile`/`.only-desktop`): ambos árboles viven en el DOM (verificado: 8 filas de timeline = 4×2). Sin drift de **datos** entre ramas; sí drift **visual** en la barra admin (barra hardcoded mobile vs nodos numerados desktop → M2). Costo: doble render.
*Archivos:* `src/components/shared/shared.css:222-228`.

### Schema (hallazgos — registrar, no actuar)

**S1 · alta — Falta `WorkOrderPhoto.publicId`** (borrado en Cloudinary imposible). Dep. `01` + migración.
**S2 · alta — Falta autor en `WorkOrderPhoto`** (`createdByUserId`). Migración futura.
**S3 · media — Falta marca temporal de "alcanzado" por paso** (`reachedAt` o equivalente) para duraciones reales. Migración futura.
**S4 · media — Falta marca explícita de "sin imagen"** en la transición, que el flujo objetivo necesita para distinguir "sin foto a propósito" de "todavía no". Migración futura.
*Archivos:* `schema.prisma:136-150` (`WorkOrderPhoto`), `:111-134` (`WorkOrderStatusUpdate`).

### Viabilidad del flujo objetivo (Fase 9)

**V1 · viable — El gate de imagen + "Sin imagen" tiene dónde engancharse**
Punto único de transición: `advanceToNextStep` / `advanceStepAction`. El gate iría antes de confirmar. **Reutiliza** `UploadZone` (ya usado en `NewStateForm`) y la ruta `createWorkOrderPhoto`. Arquitectónicamente factible.

**V2 · condicionado a `01` — El gate hereda el bug de `publicId`**
Mientras `onUpload` descarte `ref` (E3/S1), cualquier gate construido persistiría imágenes sin identificador de borrado. **El gate depende de que `01` cablee bien `onUpload`.**

**V3 · condicionado a `02` — Dónde queda la fuente de verdad de etapas**
La forma final del gate y de la barra de progreso depende de la consolidación de `Timeline`/etapas (`02`). M2/M3/C2 se reevalúan cuando `02` corra.

### Runtime / hidratación (transversal)

**R1 · BLOQUEANTE — Las islas interactivas que importan server actions NO hidratan: el ciclo no se puede manejar por UI**
*Actual (confirmado, repro dedicada):* los componentes cliente que importan server actions — `OrderActions` (Avanzar etapa / Marcar listo / Marcar entregado), `NewStateForm` (Nuevo estado) y `Wizard` (alta de OT) — **no son reclamados por React** en el cliente (`__reactFiber$` y `__reactProps$` ausentes en sus nodos). El click no dispara nada: cero red, cero cambio de estado. En cambio, los componentes cliente que **no** importan server actions sí hidratan (menú del shell admin, modal interstitial de `/clientes`, tabs/menú del portal cliente).
*Esperado:* el operario avanza etapa, agrega estado, marca listo/entregado, y crea OTs desde la UI. *Brecha:* toda la conducción del ciclo por UI está **inerte**.

*Evidencia que descarta "artefacto del entorno":*
1. **Reproducible en instancia fresca** (server reiniciado), no era un dev server degradado.
2. **Chrome real pegándole directo a `localhost:3000`** — el `proxy.ts` es el middleware de auth de la app (limpio) y su `matcher` excluye `/_next/static`; no hay proxy del harness en el medio.
3. **Sin chunks fallidos** (red), **sin errores** en consola ni server.
4. **Correlación nítida:** falla ⇔ el componente importa `"use server"` del `actions.ts` de la ruta; hidrata ⇔ no lo importa.

*Causa raíz (hipótesis principal, requiere debug con cambios = fuera de esta auditoría):* en este Next 16.2.6, los componentes cliente que importan el grafo `"use server"` de la ruta no quedan registrados/hidratados en el cliente. Hipótesis secundaria: el patrón dual-layout duplica el componente cliente en ambos árboles (`only-mobile`/`only-desktop`) — aunque el `Wizard` (no dual) también falla, lo que pesa a favor de la causa de server actions.
*Confirmación de 10 segundos para Valentín:* abrir `/admin/ordenes/[id]` en tu propio Chrome y pulsar "Avanzar etapa". Si no pasa nada, está confirmado fuera de todo harness.
*Archivos:* `OrderActions.tsx`, `NewStateForm.tsx`, `Wizard.tsx` (`"use client"`), que importan `src/app/admin/ordenes/[id]/actions.ts` y `src/app/admin/ordenes/nueva/actions.ts` (`"use server"`).
*Impacto sobre el resto de la auditoría:* las mecánicas de Fase 2/3/6 se verificaron por **fuente + HTML server-rendered**, no por UI, precisamente por este bloqueo.

---

## Decisiones abiertas para Valentín

1. **Gate de imagen:** ¿aplica a **todas** las transiciones o se exceptúa alguna (p.ej. la primera, INGRESO)?
2. **"Sin imagen":** ¿exige nota/razón obligatoria, o es realmente sin nada?
3. **Retroceso de etapa:** ¿unidireccional estricto, o se permite retroceder? (El service `markStepAsCurrent` ya lo permitiría — C3.)
4. **Terminal:** ¿`ENTREGADO` es el único terminal, o hay alternativos (cancelado, etc.)? Hoy solo existe `PROCESO/LISTO/ENTREGADO`.
5. **Post-entrega:** ¿queda cerrado total, o se admiten fotos/notas posteriores (garantía/retoque)?
6. **Duración por etapa:** ¿se mide entre transiciones (requiere `reachedAt`)? ¿Qué hacemos con OTs viejas/seed sin timestamps históricos?
7. **Estado intermedio suelto:** ¿se mantiene el alta de estado sin avanzar etapa (hoy existe vía `NewStateForm`), o todo pasa por el avance?

---

## Dependencias con la secuencia de estabilización

- **`01` (cableado `onUpload`)** condiciona: T1, E3, S1, V2.
- **`02` (consolidación `Timeline`/etapas)** condiciona: M2, M3, C2, V3.
- **Migraciones futuras** (no en esta auditoría): S1–S4, TE4 (ruta nueva), A2.
- Esta auditoría es de solo lectura: captura la realidad **pre-estabilización**.

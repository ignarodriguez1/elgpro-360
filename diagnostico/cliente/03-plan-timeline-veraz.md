# Plan — Timeline veraz (A1 autor + TI2 timestamps honestos)

> **Naturaleza:** PLAN de implementación. No implementado todavía — espera aprobación final.
> **Trabajo planificado:** solo display. Cero schema, cero migraciones, cero service, cero git.
> **Fecha:** 2026-06-19 · Deriva de `auditoria-ciclo-vida-ot.md` (A1, TI2).
> **Decisiones de Valentín:** (1) TI2 = la opción más simple y honesta (ancla de ingreso; egreso queda fuera, ver §4). (2) Autor = **solo admin** por ahora.

---

## 1. Integración

**Standalone.** `Timeline.tsx` ya está consolidado (feed/panel/admin por props); `02` no lo reestructura (su scope abierto es `VehicleCard` y la barra macro admin, otros archivos). Riesgo de colisión bajo.

**Un solo archivo a tocar:** `src/components/shared/Timeline.tsx`. Sin cambios en páginas ni en el service (el dato ya llega: `getWorkOrderById` incluye `createdBy` y ordena por `sortOrder asc`; `confirmed` viaja como escalar de la fila).

---

## 2. Datos verificados (base del plan)

- `getWorkOrderById` (`work-order.service.ts:184`) → `statusUpdates` con `orderBy: sortOrder asc` + `include: { createdBy, photos }`. Lo usan **cliente y admin** (mismo fetch).
- `createdBy?: { name } | null` ya está en la interfaz `TimelineUpdate` (`Timeline.tsx:21`). Dato presente, solo falta pintarlo.
- `confirmed` está bien mantenido: `true` en pasos alcanzados (≤ actual), `false` en pendientes (`work-order.service.ts:157,290,331,401`; seed `i<=currentIndex`). **No está tipado en la interfaz** → se agrega `confirmed?: boolean` (cambio de tipo, no schema).
- **Único timestamp real por OT:** su `createdAt` de creación (= ingreso), compartido por todos los pasos. No hay marca de "alcanzado" por paso hasta `reachedAt` (S3, fuera de alcance).

---

## 3. Cambios (todos en `Timeline.tsx`)

### C1 — Interfaz: exponer `confirmed` (tipo)
Agregar `confirmed?: boolean;` a `TimelineUpdate` (junto a `isCurrent`). El campo ya viaja en runtime; esto solo lo tipa.

### C2 — A1: autor visible, SOLO modo admin (`:195-253`, clases `atl-*`)
- En cada fila admin, mostrar `u.createdBy?.name` cuando exista. Ubicación: byline muted en la fila `atl-tags` (junto a los tags visible/interno/notificado).
- **Fallback:** `createdBy` ausente → **no renderizar** la línea de autor. Nada de "Desconocido".
- Modo cliente: **sin autor** (decisión 2).
- Requiere una clase CSS chica (p.ej. `.atl-by`, muted) en `admin.css`/`shared.css` — styling, dentro de "display".

### C3 — TI2: fechas honestas, AMBOS modos (builder cliente `:116-167` + bloque admin `:195-253`)
Agregar índice al map (`visible.map((u, i) =>` y `updates.map((u, i) =>`) y reemplazar el span de fecha incondicional por esta regla por fila:

| Condición | Qué se muestra en el slot de fecha |
|---|---|
| `i === 0` (ancla de ingreso) | la fecha real: `fmtDate · fmtTime` |
| `u.confirmed === false` (no alcanzado) | **"Pendiente"** (muted), sin fecha |
| resto (alcanzado no-ingreso, o en curso) | **nada** (el paso actual ya lleva su badge "AHORA"/"Listo" aparte) |

Esto saca las fechas engañosas por paso, conserva la única fecha verdadera (ingreso) y marca lo pendiente con honestidad. El "AHORA" del paso actual no se toca.

> Detalle: como todos los pasos comparten `createdAt`, la fecha del índice 0 es la de creación de la OT (= ingreso) aunque el primer paso visible no sea literalmente "INGRESO". Es verdadera de todos modos (la OT arrancó en ese momento).

---

## 4. Egreso — por qué queda afuera (no es olvido)

El egreso real existe (`WorkOrder.actualDeliveryDate`, seteado en `markAsDelivered`), pero:
- Es **nivel OT, no un paso** del timeline — `markAsDelivered` no crea un `WorkOrderStatusUpdate` (hallazgo TE3), así que no hay fila donde colgar la fecha.
- Solo existe en OTs **ENTREGADO**, cuya vista de detalle es el **dead-end** (TE4) — fuera de este plan (corresponde a la Fase 5 del track del portal vivo).

**Cuando se construya la vista de OT entregada**, el ancla de egreso entra trivial: pasar `actualDeliveryDate` como prop y agregar un ancla al pie (+1 condicional). No acá.

---

## 5. Provisionalidad (nota obligatoria)

Todo C3 es **provisorio hasta que exista `reachedAt`** (S3, schema futuro que Valentín migra a mano). Cuando ese campo exista, vuelven las fechas reales por paso y esta supresión se revierte/evoluciona. C1 (`confirmed`) y C2 (autor) quedan.

---

## 6. Verificación en runtime (guion)

**Ventaja:** A1/TI2 son SSR puro (texto server-rendered, no interactividad) → **verificable incluso bajo el harness** (no aplica el caveat R1 de hidratación).

Sobre una OT en proceso con varios pasos (p.ej. la del seed en PREPARACIÓN):

1. **Admin** `/admin/ordenes/[id]`, ambos árboles (<859 y ≥859):
   - Primer paso: muestra fecha de ingreso. Pasos alcanzados intermedios: sin fecha. Paso actual: "AHORA". Pasos futuros: "Pendiente".
   - Paso con autor: muestra el nombre. Paso sin autor: sin byline (no "Desconocido").
2. **Cliente** `/clientes/vehiculos/[id]`, ambos árboles (feed mobile, panel desktop):
   - Mismo comportamiento de fechas (ingreso / nada / AHORA / Pendiente), solo en filas `visibleToCustomer`.
   - **Sin autor** (modo cliente).

Probar **comportamiento**, no que compile.

---

## 6b. IMPLEMENTADO Y VERIFICADO (2026-06-19)

Cambios aplicados en `Timeline.tsx` (C1/C2/C3) + clase `.atl-by` en `admin.css` y `shared.css`. `tsc --noEmit` limpio.

**Verificación en runtime (SSR, fetch con cookie de sesión real — no aplica R1):**

- **Admin** (`/admin/ordenes/...`, OT con pasos pendientes):
  - "Vehículo ingresado" (índice 0): fecha real `10 jun · 17:06` ✓
  - pasos alcanzados intermedios: sin fecha ✓
  - "Barniz" / "Armado final" (no alcanzados): **"Pendiente"** ✓
  - paso actual: sin fecha ✓
  - byline de autor "Admin ELG Pro" en cada fila ✓ (captura confirma estilo correcto)
- **Cliente** (`/clientes/vehiculos/...`), **feed mobile** y **panel desktop** idénticos:
  - ingreso con fecha, resto sin fecha / "Pendiente", actual sin fecha ✓
  - **sin byline de autor** (`.atl-by` count = 0; `Admin ELG Pro` no aparece en ningún elemento visible) ✓

**Hallazgo registrado (pre-existente, NO introducido por este cambio):** `Timeline` es `"use client"` y recibe el array de updates con `createdBy`. Por eso el nombre del staff viaja en los props serializados (RSC flight payload, dentro de `<script>`) al browser del cliente, aunque **no se muestra**. Cerrar esa exposición = quitar `createdBy` del fetch en modo cliente (capa de servicio) → fuera del alcance display-only de este plan. Queda anotado por si se quiere endurecer.

---

## 7. Resumen de alcance

| Cambio | Modo | Archivo | Tipo |
|---|---|---|---|
| C1 `confirmed` en interfaz | — | Timeline.tsx | tipo |
| C2 autor | admin | Timeline.tsx (+ CSS chica) | display |
| C3 fechas honestas | admin + cliente | Timeline.tsx | display |

**Fuera:** TI1/TI3, gate de imagen, barra macro (M2/M3), A2, TE3/TE4, egreso, cualquier schema/migración/service/git.

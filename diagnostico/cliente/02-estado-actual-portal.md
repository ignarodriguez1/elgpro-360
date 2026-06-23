# Auditoría — Estado ACTUAL del Portal de Clientes

> **Track:** experiencia viva (prompt "Portal de Clientes"). **Naturaleza:** solo diagnóstico — cero código, cero schema, cero git.
> **Fecha:** 2026-06-19 · **Método:** lectura de fuente directa, archivo por archivo.
> **Por qué este doc:** el inventario `diagnostico/01b-inventario-portal-cliente.md` (10-jun) quedó **desactualizado**. Una sesión posterior metió mano y parchó buena parte de la paridad y consolidó dos componentes. Este documento captura la realidad de HOY para no trabajar sobre un mapa mentiroso.

---

## Resumen ejecutivo

El portal **avanzó respecto del inventario del 10-jun** sin que esos docs se actualizaran. Hay marcas en el código (`checkpoint 0, opción A`) y dos componentes ya consolidados con comentarios que lo documentan. La foto real:

- **Paridad funcional:** casi todas las divergencias serias del 01b **ya están parcheadas** (precio en mobile, card desktop clickeable, colorHex, "Ver sitio público" en ambos, counter de historial en ambos, cards de tutoriales clickeables en ambos).
- **Consolidación de componentes:** `Timeline` y `StageBar` **ya consolidados** (un componente con variantes). `VehicleCard` y `ReadyBanner` **siguen duplicados** vía markup inline desktop — y `ReadyBanner` además **diverge en etiquetas**.
- **Capa viva:** **no existe.** El "en vivo" es decoración CSS pura. Cero transporte, cero estado de conexión, cero polling/WS. SSR estático total.
- **Dead-end post-entrega:** intacto. Sigue sin haber ruta al detalle de una OT entregada.

---

## 1. Rutas y pantallas

| # | Ruta | Archivo | Árboles |
|---|---|---|---|
| 1 | (layout/nav) | `app/clientes/layout.tsx` | PwNav (desktop) + BottomNav (mobile) |
| 2 | `/clientes/login` | `login/ClienteLoginForm.tsx` | dual |
| 3 | `/clientes/activar` | `activar/ActivarForm.tsx` | dual |
| 4 | `/clientes/dashboard` | `dashboard/page.tsx` | dual |
| 5 | `/clientes/perfil` | `perfil/page.tsx` | dual |
| 6 | `/clientes/tutoriales` | `tutoriales/page.tsx` | dual |
| 7 | `/clientes/vehiculos/[id]` | `vehiculos/[id]/page.tsx` | dual |
| 8 | `/clientes/vehiculos/[id]/historial` | `.../historial/page.tsx` | dual |

`/clientes/vehiculos` sin id **no tiene página** — el listado vive en el dashboard. By design, no drift.

Patrón de layout: doble árbol `.only-mobile` / `.only-desktop`, corte CSS a 859px. **Ambos árboles viven en el DOM siempre** (doble render). Mobile prefijo `p-*` / `od-*`; desktop `pw-*` / `pwod-*`.

---

## 2. Estado de consolidación de componentes

| Componente | Mobile | Desktop | Estado |
|---|---|---|---|
| `Timeline` | `variant="feed"` | `variant="panel"` | ✅ **CONSOLIDADO** — un componente, toda la lógica compartida (lightbox, filtrado, formato). `DesktopTimeline.tsx` eliminado. Comentario en fuente lo documenta. **NO TOCAR.** |
| `StageBar` | `variant="mobile"` | `variant="desktop"` | ✅ **CONSOLIDADO** — un componente, mismo recorrido de etapas. Track desktop inline eliminado. Comentario en fuente. **NO TOCAR.** |
| `VehicleCard` | usa el componente | markup `pwv` **inline** en `dashboard/page.tsx` | ❌ **DUPLICADO** — el componente compartido se usa solo en mobile; desktop reimplementa lo mismo con clases `pwv-*`. Funcionalmente equivalentes hoy. |
| `ReadyBanner` | usa el componente | markup `pwready` **inline** en `vehiculos/[id]/page.tsx` | ❌ **DUPLICADO Y DIVERGENTE** — etiquetas distintas: componente dice "Horario de retiro" / "Formas de pago"; inline desktop dice "Horario" / "Pago". Drift real de contenido. |

> **Lectura:** la consolidación (prompt `02-consolidacion-componentes`) está **en curso, no terminada**. Timeline y StageBar hechos; VehicleCard y ReadyBanner pendientes. **Si ese prompt los va a cerrar, no pisarlos desde acá.**

---

## 3. Paridad mobile/desktop — estado HOY (vs inventario 10-jun)

### Ya parcheado (divergencias del 01b que YA NO existen)

| Divergencia (01b) | Estado HOY |
|---|---|
| Precio del presupuesto oculto en mobile ("listo") | ✅ Mobile pasa `total={budgetTotal}` a `ReadyBanner`. |
| Card de vehículo sin orden no clickeable en desktop | ✅ Desktop siempre `<Link>` (`dashboard:146`). |
| Punto de color (`colorHex`) faltante en mobile | ✅ Mobile pasa `colorHex` a `VehicleCard`. |
| "Ver sitio público" solo en mobile (perfil) | ✅ Ahora en ambos (`perfil:43` y `:64`). |
| Counter de trabajos solo en desktop (historial) | ✅ Ahora en ambos (`data-section="jobs-counter"`). |
| Cards de tutoriales muertas (sin link) en ambos | ✅ Ahora clickeables a `/tutoriales/[slug]` en ambos. |
| Sidebar (datos del vehículo + cuidados) solo desktop | ✅ Mobile ya tiene `vehicle-data` + `care-tips` (`vehiculos/[id]:100-128`). |
| Timeline empty state solo mobile | ✅ Resuelto al consolidar (`Timeline:118` `data-section="timeline-empty"`, ambas variantes). |

### Divergencias que QUEDAN (sin clasificar — decisión de Valentín)

| # | Divergencia | Archivos | Pre-lectura |
|---|---|---|---|
| D1 | `ReadyBanner` (component) vs `pwready` inline divergen en etiquetas | `ReadyBanner.tsx` vs `vehiculos/[id]:151-162` | Drift de contenido, no intencional. |
| D3 | Título de página "Tutoriales" vs sección "Guías de cuidado" (desktop) + label de nav "Cuidados" | `tutoriales/page.tsx`, `BottomNav`, `PwNav` | Tres nombres para lo mismo. Probable cosmético. |
| D4 | Links "volver" solo en desktop (`pw-back`) | `vehiculos/[id]:135`, `historial:73` | Mobile navega por `BottomNav`. Probable intencional. |
| D5 | `UserMenu` (cerrar sesión) solo en desktop nav | `PwNav` vs `BottomNav` | Mobile cierra sesión desde Perfil. Probable intencional. |
| D6 | Avatar de iniciales solo en mobile (perfil) | `perfil:28` | Compacto mobile vs título desktop. Probable intencional. |
| D8 | `CARE_TIPS` hardcodeados (3 tips fijos) en ambos | `vehiculos/[id]:16-20` | No es drift mobile/desktop, pero es contenido falso/placeholder. |

> **D2 y D7 descartados tras lectura de fuente:** el subtítulo del hero ya es idéntico en ambos árboles (`[title, color, year]`), y `activar` ya tiene `HeroBg` en ambos árboles y los 3 estados (comentario "paridad con login"). No son divergencias.

### Honestidad del copy (cruza con el principio del prompt)

- **C-H1 — el login promete "en tiempo real" sin que exista.** `ClienteLoginForm` dice "Seguí el trabajo de tu vehículo en tiempo real" (mobile `:51`, desktop `:72`). Hoy no hay nada en tiempo real (SSR estático). El copy ya está vendiendo la promesa que las Fases 2-4 tienen que hacer verdadera — o se cumple, o el copy miente.
- **C-H2 — el reset de contraseña no existe:** "Olvidé mi contraseña" va a WhatsApp (`login:13`, comentario lo declara: schema + Resend, tranche aparte). Fuera del scope de la capa viva, pero registrado.

---

## 4. Cómo entra el dato (seam de la capa viva)

**100% SSR.** Los server components piden a los services (Prisma) en el request y bajan el estado como **props**:

- `dashboard/page.tsx` → `listVehiclesByCustomer()` → `v.workOrders[0]` por card.
- `vehiculos/[id]/page.tsx` → `getVehicleById()` + `getWorkOrderById()` → `order.statusUpdates` a `<Timeline>`, `idx` a `<StageBar>`, `budgetTotal` a `<ReadyBanner>`.
- `Timeline` es `"use client"` pero **no fetchea**: recibe `updates` por props y pinta.

**Dónde va el seam (Fase 2):** entre el fetch del server page y los componentes de presentación. Un provider/hook cliente que tome el estado inicial de SSR como semilla y exponga `{ order, updates, connectionState }` por una sola interfaz, agnóstica de transporte (SSR hoy, WS mañana).

**Transporte real:** `rg` sobre `app/clientes` + `components/shared` + `components/customer` → **CERO** `setInterval` / `EventSource` / `WebSocket` / `useSWR` / `router.refresh`. Nada.

---

## 5. El "en vivo" actual — maquillaje CSS

Decoración pura, sin nada atrás:

- `portal.css:72` → `.tl-head .livedot { animation: pulse 1.6s infinite }`
- `portal-web.css:125` → `.pwtl-head .live { animation: pulse 1.6s infinite }`
- `portal-web.css:86-87` → `.pws.proceso .d { animation: pulse }`
- `shared.css:38-39` → `.statuspill.proceso .dotpulse { animation: pulse }`

`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }` — un punto verde que respira **siempre**, infinito, sin transporte ni estado de conexión. Es exactamente el patrón "parece vivo, no está vivo".

---

## 6. Dead-end post-entrega (intacto)

`historial/page.tsx:57` (mobile) y `:82` (desktop) → **ambos** linkean a `/clientes/vehiculos/[id]` (la OT **activa** del vehículo), no a la OT entregada. **No existe ruta** al timeline/fotos de una orden ya entregada. La paridad lo dejó simétrico pero igual de roto en los dos árboles.

Cruza con `auditoria-ciclo-vida-ot.md` → TE3 (entregar no deja hito visible) y TE4 (dead-end). Una vista de OT entregada necesita ruta nueva.

---

## 7. Datos para "frescura" (dependencia de schema, PARCIAL)

| Modelo | Timestamps | Sirve para "actualizado hace X" |
|---|---|---|
| `WorkOrder` | `createdAt`, **`updatedAt @updatedAt`** | ✅ Sin migrar. Matiz: es grueso — bumpea al cambiar `stage`/`status`, NO garantiza bump al agregar un status update visible o una foto. |
| `WorkOrderStatusUpdate` | **solo `createdAt`** | ❌ Sin `updatedAt`/`reachedAt`. |
| `WorkOrderPhoto` | **solo `createdAt`** | ❌ Solo creación. |

- **"Actualizado hace X" básico:** posible **sin migración** usando `WorkOrder.updatedAt`.
- **"Última novedad" fiel** (lo que el cliente percibe como novedad): `MAX(createdAt)` de status updates visibles + sus fotos → **también sin migración**.
- **Duración real por etapa** (`reachedAt` por paso): **SÍ requiere migración** (ver `auditoria-ciclo-vida-ot.md` S3/TI1). La Fase 3 (reencuentro) **NO lo necesita**.

> **Flag de schema (registrar, no migrar):** si más adelante se quiere "tiempo en cada etapa", hace falta `WorkOrderStatusUpdate.reachedAt`. Valentín lo migra a mano, agrupado.

---

## 8. Verificación en runtime

No se re-ejercitó en esta pasada (auditoría de fuente). La auditoría hermana del mismo día (`auditoria-ciclo-vida-ot.md`) ya verificó el render del portal vía HTML server-rendered y dejó un caveat transversal **R1**: en la instancia bajo el harness de preview, las islas interactivas del **contenido admin** no hidrataban. No afecta el portal cliente (sus pantallas son SSR + `Timeline`/`Lightbox` como única isla), pero conviene tenerlo presente al verificar Fases 3-4.

---

## FASE 1 — ejecutada (2026-06-19)

| Cambio | Archivos | Verificación |
|---|---|---|
| `ReadyBanner` consolidado con `variant="mobile"/"desktop"` (patrón Timeline/StageBar). Markup inline `pwready` eliminado de la página. Etiqueta canónica = la del componente ("Horario de retiro" / "Formas de pago"). Total ahora condicional (antes "—" fijo en desktop). | `components/shared/ReadyBanner.tsx`, `vehiculos/[id]/page.tsx` | `tsc` limpio. **Estado LISTO no exercitable en runtime** (ver nota). |
| D3 — naming canónico **"Cuidados"** en título de página (ambos árboles). Header desktop suelto "Guías de cuidado" eliminado (paridad con mobile). | `tutoriales/page.tsx` | ✅ Runtime, ambos árboles: títulos "Cuidados", header removido. |
| D2 — confirmado: subtítulo del hero idéntico en ambos árboles. Sin cambio. | — | ✅ confirmado en fuente. |
| D5/D6/D7 — confirmados intencionales. Sin cambio. | — | — |

**No tocado:** `VehicleCard` (queda para prompt `02`), `Timeline`, `StageBar`, care tips.

**Nota de verificación — ReadyBanner LISTO:** no exercitable en este entorno. (1) El seed no tiene ninguna orden LISTO (ambas PROCESO). (2) No se puede alcanzar la DB de la app desde un script standalone: su `DATABASE_URL` vive en un `.env` no legible y `dotenv` no lo levanta; el fallback a localhost pega contra un **clon** de la DB (mismos cuids, distinta instancia) que la app no lee. (3) Marcar LISTO por el admin no es opción bajo el harness (R1: islands admin no hidratan). El cambio es refactor puro: mismas clases `pwready-*`, solo cambian etiquetas (canónicas) y Total pasa a condicional. Para prueba visual: marcar una orden LISTO en un entorno con hidratación real, o apuntar a una orden ya LISTO.

---

## Mapa de dependencias para arrancar

- **No pisar:** `Timeline` y `StageBar` (ya consolidados). VehicleCard/ReadyBanner si los cierra el prompt `02`.
- **Seam Fase 2:** entre fetch SSR y componentes de presentación (sección 4).
- **Sin migrar para Fase 3:** "actualizado hace X" sale de `WorkOrder.updatedAt` o `MAX(createdAt)`.
- **Migración futura (flag):** `reachedAt` por paso (solo si se quiere duración por etapa).
- **Ruta nueva (Fase 5):** detalle de OT entregada (hoy dead-end).

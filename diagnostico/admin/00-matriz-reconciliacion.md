# Fase 0 — Matriz de reconciliación: Panel Admin

> Insumo: inventario `diagnostico/01c-inventario-panel-admin.md` (Fase 1C, verificado contra código).
> Decisión de producto vigente: **admin 100% usable en mobile**. Las pantallas sin árbol
> mobile son trabajo pendiente, no scope deliberado.
>
> Baldes: `INTENCIONAL` · `DRIFT ACCIDENTAL` · `SIN MOBILE — FALTA CONSTRUIR` · `A DECIDIR`
> Severidad: `NAVEGACIÓN` · `FUNCIONAL` · `COSMÉTICO`

---

## 1. Chrome global — `AdminShell` (`components/admin/AdminShell.tsx` + `admin.css:657`)

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| AdminShell | Sidebar — nav completa (7 secciones) | ❌ `display:none` | ✅ | SIN MOBILE — FALTA CONSTRUIR | **NAVEGACIÓN** | **Fundacional.** Sin esto, 5 secciones son inalcanzables en mobile. Va primero (Fase 2). |
| AdminShell | Logout / `UserMenu` | ❌ | ✅ | SIN MOBILE — FALTA CONSTRUIR | **NAVEGACIÓN** | No existe forma de cerrar sesión en mobile. Parte de la nav mobile de Fase 2. |
| AdminShell | Topbar — título de página | ❌ | ✅ | SIN MOBILE — FALTA CONSTRUIR | COSMÉTICO | Resolver junto con el patrón de nav elegido (header mobile). |
| AdminShell | Sidebar — usuario (avatar/nombre/rol) | ❌ | ✅ | SIN MOBILE — FALTA CONSTRUIR | COSMÉTICO | Incluir en el menú mobile. |
| AdminShell | Sidebar — colapsar/expandir | ❌ | ✅ | INTENCIONAL | COSMÉTICO | Control propio del layout sidebar; sin sentido en mobile. |
| AdminShell | Topbar — buscador global | ❌ | ✅ (decorativo, sin lógica) | **A DECIDIR** | COSMÉTICO | ¿Se construye en mobile, o se elimina también de desktop? Hoy no busca nada. Propuesta: NO portarlo; tratarlo como feature aparte. |
| AdminShell | Topbar — campana de notificaciones | ❌ | ✅ (decorativa) | **A DECIDIR** | COSMÉTICO | Ídem buscador: sin lógica detrás. Propuesta: NO portarla. |

## 2. Dashboard — `/admin` (doble árbol: Modo Taller / Panel general)

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Dashboard | Stats (en taller / activas / completadas mes / clientes) | ❌ | ✅ | **A DECIDIR** | FUNCIONAL | El dueño gestiona desde el celular → las stats parecen necesarias en mobile. Pero "Modo Taller" fue un concepto deliberado pensado para el operario. ¿El home mobile es vista-operario, vista-dueño, o híbrido? Toca a futuros roles. Propuesta: agregar strip compacto de stats al Modo Taller (no rehacer la pantalla). |
| Dashboard | Link "Ver todas" → `/admin/ordenes` | ❌ | ✅ | DRIFT ACCIDENTAL | FUNCIONAL | El listado completo (con filtros Completadas/Todas) hoy solo se alcanza en mobile por el back-link "Taller" del detalle de orden — accidental, no diseñado. Fix trivial: link en el Modo Taller. |
| Dashboard | Botón "Nueva orden" | ✅ (ícono "+") | ✅ | INTENCIONAL | — | Paridad funcional con forma distinta. OK. |
| Dashboard | Agrupación "Listos para retirar" como sección propia | ✅ | ⚠️ mezclado en tabla con badge | INTENCIONAL | COSMÉTICO | La tabla desktop expresa lo mismo vía `StatusBadge`. OK. |
| Dashboard | Saludo/cabecera | ✅ | ✅ | INTENCIONAL | — | Formas distintas, misma función. |

## 3. Login — `/admin/login` (árbol único)

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Login | Card de login completa | ⚠️ árbol único | ⚠️ árbol único | INTENCIONAL | — | `max-width: calc(100% - 32px)` — responsive real con un solo markup. Verificar en runtime (Fase 4B) y documentarlo como decisión en la fuente de verdad. No construir doble árbol. |

## 4. Órdenes (listado) — `/admin/ordenes` (doble árbol)

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Órdenes | Cabecera + contador + botón nueva + filtros + listado + empty | ✅ | ✅ | — (paridad total) | — | Patrón tabla↔cards de referencia. Es el modelo a replicar en Fase 4. |

## 5. Nueva orden — `/admin/ordenes/nueva` (árbol único, `Wizard`)

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Nueva orden | Wizard 5 pasos (Cliente/Vehículo/Trabajo/Fotos/Revisión) | ⚠️ árbol único, sin verificar | ✅ | SIN MOBILE — FALTA CONSTRUIR | **FUNCIONAL** | Es EL flujo de alta del negocio y el Modo Taller linkea acá desde el "+". Verificar en runtime qué tan roto está a 430px (selector de cliente con grid, stepper). Probablemente alcance con CSS responsive del wizard, no doble árbol. (Fase 4B) |

## 6. Detalle de orden — `/admin/ordenes/[id]` (doble árbol: vista taller / panel 2 col)

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Orden detalle | Timeline — **fotos + lightbox** | ❌ | ✅ | **DRIFT ACCIDENTAL** | **FUNCIONAL** | El operario sube fotos desde mobile (`NewStateForm`) y no puede verlas. El dato ya viene en `order.statusUpdates`. Prioridad #1 de Fase 3. |
| Orden detalle | Timeline — descripciones | ❌ | ✅ | **DRIFT ACCIDENTAL** | **FUNCIONAL** | El dato ya está en cada update; la `ttl` mobile no lo renderiza. |
| Orden detalle | Timeline — notas internas (texto) | ❌ | ✅ | **DRIFT ACCIDENTAL** | **FUNCIONAL** | Mobile muestra el tag "Interno" pero no el contenido de la nota. |
| Orden detalle | Sidebar — presupuesto + estado de pago | ❌ | ✅ | **DRIFT ACCIDENTAL** | **FUNCIONAL** | El dueño fuera del taller no ve montos. `order.budgetAmount` / `paymentStatus` ya están en la query. |
| Orden detalle | Sidebar — cliente (nombre/email) | ❌ | ✅ | **DRIFT ACCIDENTAL** | **FUNCIONAL** | Mobile muestra el nombre en el sub del hero; sin email ni bloque propio. |
| Orden detalle | Sidebar — vehículo (año/color) | ❌ | ✅ | DRIFT ACCIDENTAL | FUNCIONAL | Dato ya disponible en `order.vehicle`. |
| Orden detalle | Sidebar — servicios solicitados | ❌ | ✅ | DRIFT ACCIDENTAL | FUNCIONAL | `order.servicesRequested` ya disponible. |
| Orden detalle | Sidebar — nota interna de la orden (`internalNotes`) | ❌ | ✅ | DRIFT ACCIDENTAL | FUNCIONAL | Distinta de las notas por update; también falta. |
| Orden detalle | `StatusBadge` global de la orden | ❌ | ✅ | DRIFT ACCIDENTAL | COSMÉTICO | El estado se infiere de la barra de etapas, pero el badge es gratis. |
| Orden detalle | Mensaje "orden entregada — sin acciones" | ❌ (render `null`) | ✅ | DRIFT ACCIDENTAL | COSMÉTICO | `OrderActions` variant mobile devuelve null en ENTREGADO; queda un hueco mudo. |
| Orden detalle | Contador "N visibles" en timeline | ✅ | ❌ | INTENCIONAL | COSMÉTICO | Útil en taller; no molesta que sea mobile-only. Documentar como `mobile` en la fuente de verdad. |
| Orden detalle | Acciones de ciclo de vida (avanzar/listo/entregado) | ✅ | ✅ | — (paridad) | — | `OrderActions` con variants explícitas. OK. |
| Orden detalle | `NewStateForm` | ✅ | ✅ | — (paridad) | — | Única pieza con switch JS (`matchMedia`). Anotado para normalizar criterio, no urgente. |

## 7. Clientes (listado) — `/admin/clientes` (doble árbol)

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Clientes | Cabecera + alta + buscador + listado + empty | ✅ | ✅ | — (paridad total) | — | OK. |

## 8. Detalle de cliente — `/admin/clientes/[id]` (árbol único)

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Cliente detalle | Cabecera + `EditCustomerForm` + `NewVehicleForm` | ⚠️ árbol único | ✅ | SIN MOBILE — FALTA CONSTRUIR | FUNCIONAL | Forms probablemente aguanten con CSS; verificar runtime. |
| Cliente detalle | **Tabla** de vehículos del cliente | ⚠️ tabla servida a mobile | ✅ | SIN MOBILE — FALTA CONSTRUIR | **FUNCIONAL** | Desborda a 430px. Aplicar patrón tabla→cards (`alist`) ya existente. (Fase 4A) |

## 9. Vehículos (listado) — `/admin/vehiculos` (doble árbol)

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Vehículos | Cabecera + buscador + listado + empty | ✅ | ✅ | — (paridad total) | — | OK. |

## 10. Detalle de vehículo — `/admin/vehiculos/[id]` (árbol único)

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Vehículo detalle | Cabecera + `EditVehicleForm` + panel cliente | ⚠️ árbol único | ✅ | SIN MOBILE — FALTA CONSTRUIR | FUNCIONAL | Ídem cliente/[id]: forms posiblemente OK, verificar. |
| Vehículo detalle | **Tabla** de órdenes del vehículo | ⚠️ tabla servida a mobile | ✅ | SIN MOBILE — FALTA CONSTRUIR | **FUNCIONAL** | Patrón tabla→cards. (Fase 4A) |

## 11. Servicios — `/admin/servicios` (árbol único, `ServicesList`)

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Servicios | Cabecera + botón nuevo + lista + toggles + editar | ⚠️ árbol único | ✅ | SIN MOBILE — FALTA CONSTRUIR | FUNCIONAL | Maquetar mobile sin romper la vista. (Fase 4C) |
| Servicios | Reordenar por drag & drop | ❌ en touch | ✅ | — **FUERA DE SCOPE** | FUNCIONAL | Bug funcional propio (HTML5 dnd no dispara en touch). Prompt aparte. Acá solo: no romperlo. |

## 12. Editor de flujo — `/admin/servicios/[id]` (árbol único, `FlowEditor`)

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Flow editor | Renombrar + alta/baja de pasos + toggles | ⚠️ árbol único | ✅ | SIN MOBILE — FALTA CONSTRUIR | FUNCIONAL | (Fase 4C) |
| Flow editor | Reordenar pasos drag & drop | ❌ en touch | ✅ | — **FUERA DE SCOPE** | FUNCIONAL | Ídem servicios. |

## 13. Tutoriales — `/admin/tutoriales` (árbol único)

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Tutoriales | Cabecera + lista crud + toggles | ⚠️ árbol único | ✅ | **A DECIDIR** | COSMÉTICO | Es lista (no tabla); probablemente aguante con ajustes CSS mínimos. ¿Alcanza árbol único documentado, o se maqueta card mobile? Propuesta: verificar runtime y, si aguanta, documentar árbol único como decisión. (Fase 4B) |
| Tutoriales | Botón "Nuevo tutorial" sin handler | ⚠️ muerto en ambos | ⚠️ | — **FUERA DE SCOPE** | FUNCIONAL | Bug en ambos viewports, no drift. Prompt aparte. |

## 14. Auditoría — `/admin/auditoria` (árbol único)

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Auditoría | **Tabla** 4 columnas (fecha/actor/acción/detalle) | ⚠️ tabla servida a mobile | ✅ | SIN MOBILE — FALTA CONSTRUIR | FUNCIONAL | Patrón tabla→cards. (Fase 4A) |

---

## Resumen por balde

| Balde | Secciones | Detalle |
|---|---|---|
| **DRIFT ACCIDENTAL** | **11** | 10 en detalle de orden (8 FUNCIONAL + 2 COSMÉTICO) + 1 en dashboard ("Ver todas") |
| **SIN MOBILE — FALTA CONSTRUIR** | **13** | 4 de chrome/nav (AdminShell) + 9 repartidas en 7 pantallas de árbol único |
| **INTENCIONAL** | 6 | Colapso de sidebar, login árbol único, formas distintas con paridad funcional, contador "N visibles" |
| **A DECIDIR** | **4** | Stats en dashboard mobile · buscador global · campana notificaciones · tutoriales árbol único |
| Fuera de scope (anotado, no se resuelve acá) | 4 | Drag&drop touch (×2) · triple timeline · botón "Nuevo tutorial" |

## Resumen por severidad (solo lo accionable)

| Severidad | Secciones | Dónde |
|---|---|---|
| **NAVEGACIÓN** | 2 | AdminShell: nav completa + logout. **Bloquea todo lo demás → Fase 2 primero.** |
| **FUNCIONAL** | 17 | Detalle de orden (8), pantallas árbol único con tablas/forms (7), dashboard "Ver todas" (1), stats si se decide portarlas (1) |
| **COSMÉTICO** | 9 | Título de página, badges, mensajes, decorativos |

## Decisiones tomadas (CHECKPOINT 0 — confirmadas por el humano)

1. **Dashboard mobile**: ✅ **Strip de stats + link "Ver todas"** sobre el Modo Taller existente. No se rediseña; el rediseño por rol llega con los roles. → Stats pasan de `A DECIDIR` a `DRIFT ACCIDENTAL / FUNCIONAL` (fix en Fase 3 junto al link).
2. **Buscador global del topbar**: ✅ **No se porta a mobile.** Queda `desktop` en la fuente de verdad con nota "feature pendiente (decorativo)".
3. **Campana de notificaciones**: ✅ **No se porta.** Ídem buscador.
4. **Tutoriales admin**: ✅ **Árbol único aceptado** si el runtime lo confirma a 430px (Fase 4B). Queda documentado como decisión, no como omisión.
5. **Orden de ataque**: ✅ confirmado tal como está en la sección siguiente.

## Orden de ataque propuesto (mapea a las fases del prompt)

1. **Fase 2** — Nav mobile de `AdminShell` (NAVEGACIÓN, fundacional).
2. **Fase 3** — Paridad detalle de orden (8 drifts FUNCIONALES, dato ya existe — máximo valor/esfuerzo) + "Ver todas" del dashboard.
3. **Fase 4A** — Tablas que desbordan: cliente/[id], vehículo/[id], auditoría → patrón `alist` (tabla→cards).
4. **Fase 4B** — Wizard nueva orden, login (verificar), tutoriales (verificar + decisión 4).
5. **Fase 4C** — Servicios + editor de flujo (maquetar; dnd intacto, fuera de scope).
6. **Fase 5** — Reconciliación contra la fuente de verdad.

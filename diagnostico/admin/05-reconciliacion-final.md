# Fase 5 — Reconciliación final del Panel Admin

> Verificación de runtime contra la fuente de verdad (`src/lib/admin-sections.ts`).
> Server de dev levantado, sesión admin, viewport mobile (≤390px) y desktop (≥1280px).
> Método: como **ambos árboles viven en el DOM** (el switch es CSS), se verifica por
> `data-section` que cada sección `both` exista en `.only-mobile` Y en `.only-desktop`.

## Resultado global: ✅ sin violaciones del contrato

Las cinco fases de implementación quedaron aplicadas y verificadas en runtime. El drift
accidental que el diagnóstico (Fase 0) detectó está cerrado; lo que queda fuera de paridad
está **declarado** en el registry con su `reason`.

## Verificación por pantalla

### Navegación (AdminShell) — Fase 2 ✅
- ≤859px: header `.anav` (burger + título + UserMenu/logout) + overlay con las 7 secciones
  derivadas de `navScreens()`. Las 5 secciones antes inalcanzables (Clientes, Vehículos,
  Servicios, Tutoriales, Auditoría) ahora se navegan. Logout accesible.
- ≥1280px: sidebar (7 ítems) + topbar intactos; chrome mobile oculto.
- `global-search` y `notifications-bell`: presentes solo en desktop, **declarado** (decorativos).

### Detalle de orden `/admin/ordenes/[id]` — Fase 3 ✅ (reconciliación automática: 0 violaciones)
Las 11 secciones `both` presentes en ambos árboles:
`back-link, hero, status-badge, stage-track, timeline, lifecycle-actions, new-state-form,
client-info, vehicle-info, budget-payment, services`.
- **Timeline**: mobile ahora usa el componente compartido `<Timeline mode="admin">` →
  trae descripciones, notas internas, fotos + lightbox idénticas a desktop (paridad
  estructural: 7 filas mobile = 7 filas desktop en el dato de prueba).
- **Presupuesto + pago** visibles en mobile ("$1.200.000 · PARTIAL").
- **Cliente** (nombre + email) y datos de vehículo, en mobile.
- `timeline-visible-count`: solo mobile, **declarado**.
- `delivered-notice` / `order-internal-notes`: condicionales (estado ENTREGADO / nota
  cargada); presentes en ambos árboles cuando la condición se cumple.

### Dashboard `/admin` — Fase 3 ✅
- Mobile (Modo Taller): strip de stats (en taller / activas / completadas mes / clientes)
  + link "Ver todas las órdenes" + cards de proceso/listos.
- Desktop: panel general con statcards + tabla. Ambos derivan del mismo `page.tsx`.
- `ready-group`: agrupación "listos" solo mobile, **declarada**.

### Tablas → cards — Fase 4A ✅
| Pantalla | mobile | desktop | overflow horizontal |
|---|---|---|---|
| `/admin/auditoria` | 17 cards `.alist` | tabla 4 col | ninguno (scrollWidth = viewport) |
| `/admin/clientes/[id]` (Lucía Fernández) | vehículo como card | tabla `.only-desktop` | ninguno |
| `/admin/vehiculos/[id]` (Porsche 911) | órdenes como card / empty | tabla `.only-desktop` | ninguno |

### Árbol único responsive — Fases 4B / 4C ✅
| Pantalla | verificación |
|---|---|
| `/admin/ordenes/nueva` (Wizard) | 390px sin overflow; stepper compacto (label solo en paso activo); cards de cliente full-width |
| `/admin/login` | card centrada `maxWidth: calc(100% - 32px)`; login real ejecutado en mobile |
| `/admin/tutoriales` | 390px sin overflow; lista crud (decisión: árbol único, confirmada) |
| `/admin/servicios` | 390px sin overflow; 10 filas |
| `/admin/servicios/[id]` (FlowEditor) | 390px sin overflow; 8 pasos con grip/título/descr/select/toggle/borrar, envuelven limpio |

## Pendientes declarados (NO son drift — están escritos en el registry)

- `global-search`, `notifications-bell` → `desktop`, "feature pendiente (decorativo)".
- `reorder-dnd` (servicios y flow) → `desktop`, "HTML5 dnd no dispara en touch".
- `sidebar-collapse` → `desktop`, "control propio del layout con sidebar".

## Fuera de scope de esta normalización (prompts aparte)

1. **Drag & drop por touch** en servicios y editor de flujo (bug funcional propio).
2. **Consolidación de timelines**: quedan `Timeline` (compartido, ahora usado por admin
   mobile + desktop), `DesktopTimeline` (portal cliente) y el `ttl` inline del cliente.
   El `ttl` de admin mobile **se eliminó** al adoptar el componente compartido — la deuda
   bajó de 3 a sus piezas de cliente.
3. **Botón "Nuevo tutorial"** sin handler (bug en ambos viewports).
4. **Roles de usuario**: `SectionDef` quedó extensible para recibir `roles?` de forma
   aditiva; sin implementar.

## Nota técnica observada (no bloqueante)

El detalle de orden emite un **hydration warning recuperable** por formateo de fecha/hora
con locale (`toLocaleDateString`/`toLocaleString` difieren server vs cliente — p. ej.
"05:06 p. m."). Es preexistente (desktop ya lo usaba), benigno (React regenera el subárbol)
y no afecta funcionalidad. Si se quiere eliminar el warning, el fix es formatear con una
zona horaria fija o `suppressHydrationWarning` en esos nodos — fuera de este scope.

## Archivos tocados (resumen)

- **Nuevos**: `src/lib/admin-sections.ts` (+ `section-contract.ts`, tipos compartidos).
- **Navegación**: `components/admin/AdminShell.tsx`, `app/admin/admin.css` (chrome mobile + CSS 3–4).
- **Detalle de orden**: `app/admin/ordenes/[id]/page.tsx`, `components/admin/OrderActions.tsx`.
- **Dashboard**: `app/admin/page.tsx`, `components/admin/TallerOrdersList.tsx`.
- **4A**: `app/admin/auditoria/page.tsx`, `app/admin/clientes/[id]/page.tsx`, `app/admin/vehiculos/[id]/page.tsx`.
- **4C tags**: `components/admin/ServicesList.tsx`, `components/admin/FlowEditor.tsx`.

El panel admin es ahora **100% usable en mobile**, gobernado por una fuente de verdad que
hace del drift por omisión un bug detectable, no un accidente silencioso.

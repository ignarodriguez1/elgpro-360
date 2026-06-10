# Fase 1C — Inventario de secciones: Panel Admin

> Área: `app/admin`. Switch: doble árbol `.only-mobile` / `.only-desktop` a 859px,
> PERO solo 5 de 13 pantallas lo usan. El resto es árbol único "desktop" servido a
> mobile con un fallback CSS mínimo (`admin.css:657` borra sidebar/topbar y padding).
> Solo lectura. "En mobile / En desktop" = la sección existe en ese árbol del DOM.

## Dato estructural que condiciona todo

En `admin.css:657-665`, a <860px:

```css
.asb { display: none; }          /* sidebar */
.amain .atop { display: none; }  /* topbar */
```

**El admin mobile no tiene navegación.** Ni sidebar, ni topbar, ni buscador global,
ni UserMenu (no hay logout accesible). La única navegación mobile es: dashboard →
"Modo Taller" → cards de órdenes → detalle → volver. Secciones enteras del panel
(Clientes, Vehículos, Auditoría, Tutoriales, Servicios) **no son alcanzables desde
mobile** salvo por URL directa.

## Pantallas del área

| # | Ruta | Estrategia de maquetación |
|---|---|---|
| 1 | (global) `AdminShell` | árbol único; CSS borra el chrome en mobile |
| 2 | `/admin` (dashboard) | ✅ doble árbol (Modo Taller / Panel general) |
| 3 | `/admin/login` | árbol único (card centrada, responsive por max-width) |
| 4 | `/admin/ordenes` | ✅ doble árbol (tabla / cards) |
| 5 | `/admin/ordenes/nueva` | árbol único (`Wizard`) |
| 6 | `/admin/ordenes/[id]` | ✅ doble árbol (vista taller / panel 2 columnas) |
| 7 | `/admin/clientes` | ✅ doble árbol (tabla / cards) |
| 8 | `/admin/clientes/[id]` | árbol único **con tabla** |
| 9 | `/admin/vehiculos` | ✅ doble árbol (tabla / cards) |
| 10 | `/admin/vehiculos/[id]` | árbol único **con tabla** |
| 11 | `/admin/servicios` | árbol único (`ServicesList`, drag & drop) |
| 12 | `/admin/servicios/[id]` | árbol único (`FlowEditor`, drag & drop) |
| 13 | `/admin/tutoriales` | árbol único (crud-list) |
| 14 | `/admin/auditoria` | árbol único **con tabla de 4 columnas** |

---

## 1. Chrome global (`AdminShell`)

| Sección | En mobile | En desktop |
|---|---|---|
| Sidebar — nav completa (Dashboard/Órdenes/Clientes/Vehículos/Auditoría/Tutoriales/Servicios) | ❌ (display:none) | ✅ |
| Sidebar — colapsar/expandir | ❌ | ✅ |
| Sidebar — usuario (avatar/nombre/rol) | ❌ | ✅ |
| Topbar — título de página | ❌ (display:none) | ✅ |
| Topbar — buscador global | ❌ | ✅ |
| Topbar — campana de notificaciones | ❌ | ✅ |
| Topbar — `UserMenu` (sesión/logout) | ❌ | ✅ |
| `SessionNotice` (cliente en zona admin) | ✅ compartido | ✅ compartido |

## 2. Dashboard `/admin`

| Sección | En mobile ("Modo Taller") | En desktop ("Panel general") |
|---|---|---|
| Cabecera | ✅ "Modo Taller" + nombre | ✅ "Panel general" + resumen |
| Botón Nueva orden | ✅ (ícono "+") | ✅ |
| Stats (en taller / activas / completadas mes / clientes) | ❌ | ✅ (4 statcards) |
| Resumen "hoy" | ✅ ("N en proceso · N para entregar") | ✅ (sub del header) |
| Órdenes en proceso | ✅ cards con foto + CTA "Actualizar" | ✅ filas de tabla |
| Listos para retirar (agrupado) | ✅ sección propia | ⚠️ mezclado en la tabla (badge) |
| Link "Ver todas" las órdenes | ❌ | ✅ |
| Columna Cliente / ETA por orden | ✅ en card | ✅ en tabla |

## 3. Login `/admin/login` — árbol único

| Sección | En mobile | En desktop |
|---|---|---|
| Card de login (logo, form, error) | ⚠️ árbol único | ⚠️ árbol único |

Responsive por `max-width` — funciona en ambos. Sin drift.

## 4. Órdenes `/admin/ordenes`

| Sección | En mobile | En desktop |
|---|---|---|
| Cabecera + contador | ✅ | ✅ |
| Botón Nueva orden | ✅ | ✅ |
| Filtros (Activas/Completadas/Todas) | ✅ | ✅ |
| Listado (código/vehículo/cliente/etapa/estado/ETA) | ✅ cards | ✅ tabla |
| Empty state | ✅ | ✅ |

**Paridad total** (tabla↔cards con los mismos datos).

## 5. Nueva orden `/admin/ordenes/nueva` — árbol único

| Sección | En mobile | En desktop |
|---|---|---|
| Wizard 5 pasos (Cliente/Vehículo/Trabajo/Fotos/Revisión) | ⚠️ árbol único | ⚠️ árbol único |

Sin maquetación mobile dedicada; depende del fallback CSS. A verificar en runtime.

## 6. Detalle de orden `/admin/ordenes/[id]`

| Sección | En mobile (vista taller) | En desktop |
|---|---|---|
| Link volver | ✅ ("Taller") | ✅ ("Órdenes") |
| Hero del vehículo (foto/patente/nombre) | ✅ | ✅ |
| `StatusBadge` del estado global | ❌ | ✅ |
| Barra/track de etapas con labels | ✅ | ✅ |
| Timeline — títulos + fechas | ✅ (`ttl` propio) | ✅ (`Timeline mode="admin"`) |
| Timeline — tags visible/interno/notificado | ✅ | ✅ |
| Timeline — **descripciones** | ❌ | ✅ |
| Timeline — **notas internas** (texto) | ❌ | ✅ |
| Timeline — **fotos + lightbox** | ❌ | ✅ |
| Timeline — contador "N visibles" | ✅ | ❌ |
| Acciones de ciclo de vida (avanzar/listo/entregado) | ✅ (barra fija) | ✅ (sidebar) |
| Mensaje "orden entregada, sin acciones" | ❌ (render null) | ✅ |
| `NewStateForm` (nuevo estado + fotos + toggles) | ✅ | ✅ |
| Sidebar — Cliente (nombre/email) | ❌ | ✅ |
| Sidebar — Vehículo (año/color/etapa) | ❌ | ✅ |
| Sidebar — **Presupuesto y estado de pago** | ❌ | ✅ |
| Sidebar — Servicios solicitados | ❌ | ✅ |
| Sidebar — Nota interna de la orden | ❌ | ✅ |

## 7. Clientes `/admin/clientes`

| Sección | En mobile | En desktop |
|---|---|---|
| Cabecera + contador | ✅ | ✅ |
| `NewCustomerForm` (alta de cliente) | ✅ | ✅ |
| Buscador por nombre/email | ✅ | ✅ |
| Listado (nombre/contacto/vehículos) | ✅ cards | ✅ tabla |
| Empty state | ✅ | ✅ |

**Paridad total.**

## 8. Detalle de cliente `/admin/clientes/[id]` — árbol único

| Sección | En mobile | En desktop |
|---|---|---|
| Link volver + cabecera | ⚠️ árbol único | ⚠️ árbol único |
| `EditCustomerForm` | ⚠️ árbol único | ⚠️ árbol único |
| **Tabla** de vehículos del cliente | ⚠️ tabla servida a mobile | ✅ |
| `NewVehicleForm` (alta de vehículo) | ⚠️ árbol único | ⚠️ árbol único |

La tabla interna no tiene versión card. Riesgo de desborde a 430px — verificar en runtime.

## 9. Vehículos `/admin/vehiculos`

| Sección | En mobile | En desktop |
|---|---|---|
| Cabecera + contador | ✅ | ✅ |
| Buscador | ✅ | ✅ |
| Listado | ✅ cards | ✅ tabla |
| Empty state | ✅ | ✅ |

**Paridad total.** Nota: no hay botón "nuevo vehículo" en ningún viewport (el alta vive en el detalle del cliente).

## 10. Detalle de vehículo `/admin/vehiculos/[id]` — árbol único

| Sección | En mobile | En desktop |
|---|---|---|
| Link volver + cabecera | ⚠️ árbol único | ⚠️ árbol único |
| `EditVehicleForm` | ⚠️ árbol único | ⚠️ árbol único |
| Panel Cliente | ⚠️ árbol único | ⚠️ árbol único |
| **Tabla** de órdenes del vehículo | ⚠️ tabla servida a mobile | ✅ |

## 11. Servicios `/admin/servicios` — árbol único

| Sección | En mobile | En desktop |
|---|---|---|
| Cabecera + botón nuevo servicio (`window.prompt`) | ⚠️ árbol único | ⚠️ árbol único |
| Lista reordenable **drag & drop HTML5** | ❌ funcional (touch no dispara dragstart) | ✅ |
| Toggle de visibilidad | ⚠️ árbol único | ✅ |
| Botón Editar → flujo | ⚠️ árbol único | ✅ |

## 12. Editor de flujo `/admin/servicios/[id]` — árbol único

| Sección | En mobile | En desktop |
|---|---|---|
| `FlowEditor` (renombrar, alta/baja de pasos, toggles) | ⚠️ árbol único | ✅ |
| Reordenar pasos **drag & drop HTML5** | ❌ funcional en touch | ✅ |

## 13. Tutoriales `/admin/tutoriales` — árbol único

| Sección | En mobile | En desktop |
|---|---|---|
| Cabecera + contador | ⚠️ árbol único | ⚠️ árbol único |
| Botón "Nuevo tutorial" | ⚠️ **sin handler — botón muerto en ambos** | ⚠️ ídem |
| Lista crud (título/categoría/toggle) | ⚠️ árbol único (lista, no tabla — debería aguantar) | ✅ |

## 14. Auditoría `/admin/auditoria` — árbol único

| Sección | En mobile | En desktop |
|---|---|---|
| Cabecera + contador de eventos | ⚠️ árbol único | ⚠️ árbol único |
| **Tabla** de 4 columnas (fecha/actor/acción/detalle) | ⚠️ tabla servida a mobile | ✅ |

---

## Candidatos a divergencia (pre-clasificación, se confirma en Fase 2)

**Críticos (capacidad operativa que mobile no tiene):**
1. **Sin navegación en mobile** (`AdminShell` borrado por CSS): Clientes, Vehículos, Servicios, Tutoriales y Auditoría inalcanzables sin URL directa. Sin logout.
2. **Detalle de orden mobile sin datos comerciales ni fotos**: presupuesto, estado de pago, datos del cliente, servicios, nota interna y TODAS las fotos/descripciones de la timeline solo existen en desktop. El operario en el taller (el caso de uso del "Modo Taller") no puede ver las fotos que él mismo sube.
3. **Drag & drop HTML5 en servicios/flujo**: no funciona en touch — reordenar es imposible desde mobile.

**Drift estructural:**
4. **8 de 13 pantallas sin árbol mobile**, dependiendo de un fallback CSS que solo borra chrome y padding. Tres de ellas con tablas que desbordan (clientes/[id], vehiculos/[id], auditoría).
5. Dashboard: stats y "Ver todas" solo desktop (defendible como decisión Modo Taller, pero no documentada).
6. Timeline admin: tercera implementación (`ttl` mobile) además de `Timeline` y `DesktopTimeline` — ya divergió (sin fotos/descripciones).

**Menores:**
- `StatusBadge` global de la orden solo desktop; contador "N visibles" solo mobile.
- Mensaje "orden entregada" solo desktop (mobile render null).
- Botón "Nuevo tutorial" sin handler (bug en ambos viewports, no drift — anotado igual).
- Buscador global del topbar: solo desktop y sin lógica aparente (decorativo).

## Resumen

- **Pantallas:** 14 (13 rutas + chrome).
- **Doble árbol real:** 5 (dashboard, órdenes, órdenes/[id], clientes, vehículos).
- **Paridad total entre las de doble árbol:** 3 (órdenes, clientes, vehículos — patrón tabla↔cards consistente y limpio).
- **Árbol único sin decisión documentada:** 8.
- Es, por lejos, el área con más drift — y del tipo más caro: **funcionalidad y
  navegación ausentes en mobile**, no solo cosmética. La hipótesis del prompt
  ("el problema es más visible en admin") se confirma en código.

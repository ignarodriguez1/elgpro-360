# Fase 1B — Inventario de secciones: Portal Cliente

> Área: `app/clientes`. Switch: doble árbol `.only-mobile` / `.only-desktop` a 859px
> (sin breakpoints propios). Mobile usa prefijo CSS `p-*`, desktop `pw-*`.
> Solo lectura. "En mobile / En desktop" = la sección existe en ese árbol del DOM.

## Pantallas del área

| # | Ruta | Archivo |
|---|---|---|
| 1 | (global) navegación | `app/clientes/layout.tsx` |
| 2 | `/clientes/login` | `app/clientes/login/ClienteLoginForm.tsx` |
| 3 | `/clientes/activar` | `app/clientes/activar/ActivarForm.tsx` |
| 4 | `/clientes/dashboard` | `app/clientes/dashboard/page.tsx` |
| 5 | `/clientes/perfil` | `app/clientes/perfil/page.tsx` |
| 6 | `/clientes/tutoriales` | `app/clientes/tutoriales/page.tsx` |
| 7 | `/clientes/vehiculos/[id]` | `app/clientes/vehiculos/[id]/page.tsx` + `DesktopTimeline.tsx` |
| 8 | `/clientes/vehiculos/[id]/historial` | `.../historial/page.tsx` |

Nota: `/clientes/vehiculos` (sin id) **no tiene página** — el listado de vehículos
vive en el dashboard. No es drift, es diseño de rutas.

---

## 1. Navegación global (layout)

| Sección | En mobile | En desktop |
|---|---|---|
| Navegación principal | ✅ `BottomNav` (3 tabs íconos) | ✅ `PwNav` (navbar con tabs) |
| Logo + pill "Portal de clientes" | ❌ | ✅ (en `PwNav`) |
| `UserMenu` (sesión: nombre/email/salir) | ❌ (no hay UserMenu en nav mobile) | ✅ (en `PwNav`) |
| `SessionNotice` (admin en zona cliente) | ✅ compartido | ✅ compartido |

## 2. Login `/clientes/login`

| Sección | En mobile | En desktop |
|---|---|---|
| Fondo hero + veil | ✅ | ✅ |
| Logo | ✅ | ✅ |
| Card de login (form email/password + error) | ✅ | ✅ |
| Links "activar cuenta" / "olvidé contraseña" | ✅ | ✅ |

**Paridad total.**

## 3. Activar `/clientes/activar` (3 estados: sin token / éxito / form)

| Sección | En mobile | En desktop |
|---|---|---|
| Estado "token inválido" | ✅ | ✅ |
| Estado "cuenta activada" + ir al login | ✅ | ✅ |
| Form contraseña + confirmación + error | ✅ | ✅ |
| Fondo hero (imagen) | ✅ (`p-login` con bg) | ⚠️ sin `Photo` de fondo (solo `background: var(--bg)`) |

**Paridad funcional total.** Única nota: el login tiene foto de fondo en ambos, activar la pierde en desktop (estético menor).

## 4. Dashboard `/clientes/dashboard`

| Sección | En mobile | En desktop |
|---|---|---|
| Saludo ("Hola, {nombre}" + resumen de trabajos) | ✅ | ✅ |
| Label "Mis vehículos" + contador | ✅ | ✅ |
| Cards de vehículo (foto, patente, status, progreso) | ✅ (`VehicleCard` compartido) | ✅ (markup propio `pwv`, duplicado) |
| Card de vehículo **clickeable sin orden activa** | ✅ (siempre `Link`) | ❌ (`div` sin link si no hay orden) |
| Punto de color del vehículo en la card | ❌ (`colorHex` no se pasa a `VehicleCard`) | ✅ (`pwv-dot` con `colorDot()`) |
| Empty state "Sin vehículos" | ✅ | ✅ |

## 5. Perfil `/clientes/perfil`

| Sección | En mobile | En desktop |
|---|---|---|
| Cabecera (nombre + "cliente desde") | ✅ con avatar de iniciales | ✅ sin avatar (título "Mi perfil") |
| Datos de cuenta (email/tel/vehículos/notificaciones) | ✅ | ✅ |
| Link "Ver sitio público" | ✅ | ❌ |
| Botón logout | ✅ | ✅ |

## 6. Tutoriales `/clientes/tutoriales`

| Sección | En mobile | En desktop |
|---|---|---|
| Cabecera | ✅ ("Tutoriales") | ✅ ("Cuidados" — título distinto) |
| Lista/grilla de tutoriales | ✅ | ✅ |
| Cards clickeables hacia el detalle | ❌ (`div`, sin link) | ❌ (`div`, sin link) |
| Empty state | ✅ | ✅ |

**Paridad interna.** Nota cross-área: el listado público de tutoriales SÍ linkea a
`/tutoriales/[slug]`; en el portal las cards no llevan a ningún lado en ningún viewport.

## 7. Detalle de vehículo `/clientes/vehiculos/[id]`

| Sección | En mobile | En desktop |
|---|---|---|
| Link volver ("Mis vehículos") | ❌ | ✅ |
| Hero del vehículo (foto, patente, nombre) | ✅ | ✅ |
| Subtítulo del hero | ✅ `title · orderCode` | ✅ `title · color · año` (contenido distinto) |
| Banner "vehículo listo" | ✅ `ReadyBanner` **sin `total`** | ✅ `pwready` **con total** (`budgetAmount`) |
| Etapa actual + ETA | ✅ (`StageBar` compacta) | ✅ (track horizontal con labels por etapa) |
| Timeline de seguimiento con fotos + lightbox | ✅ (`Timeline` compartido, máx. 3 fotos) | ✅ (`DesktopTimeline` duplicado, todas las fotos) |
| Timeline — empty state ("Todavía no hay novedades") | ✅ | ❌ (card de timeline queda vacía) |
| Bloque "Servicios solicitados" | ✅ | ✅ (en sidebar) |
| Bloque "Productos y tratamientos" | ✅ | ✅ (en sidebar, "Tratamientos aplicados") |
| Sidebar — datos del vehículo (modelo/patente/color/año) | ❌ | ✅ |
| Sidebar — "Cuidados recomendados" (3 tips hardcodeados) | ❌ | ✅ |
| Estado sin orden activa + link a historial | ✅ | ✅ |

## 8. Historial `/clientes/vehiculos/[id]/historial`

| Sección | En mobile | En desktop |
|---|---|---|
| Link volver ("Volver al vehículo") | ❌ | ✅ |
| Cabecera (vehículo + patente) | ✅ | ✅ |
| Contador de trabajos completados | ❌ | ✅ ("N trabajos") |
| Cards de trabajos completados | ✅ **clickeables** (`Link` al vehículo) | ❌ **no clickeables** (`div`) |
| Empty state "Sin historial" | ✅ | ✅ |

---

## Candidatos a divergencia (pre-clasificación, se confirma en Fase 2)

**Funcionales (los más serios):**
1. **Detalle vehículo — total del presupuesto en "listo"**: desktop lo muestra, mobile invoca `ReadyBanner` sin `total` aunque el componente lo soporta. El cliente mobile no ve el precio.
2. **Dashboard — card sin orden no clickeable en desktop**: mobile siempre linkea al vehículo (donde está el acceso al historial); desktop deja la card muerta.
3. **Historial — cards clickeables solo en mobile**: el espejo invertido del anterior.
4. **Detalle vehículo — sidebar entera solo desktop**: datos del vehículo + cuidados recomendados no existen en mobile.
5. **Perfil — "Ver sitio público" solo mobile.**
6. **Timeline — empty state solo mobile**: en desktop, una orden sin novedades visibles deja la card de seguimiento vacía sin mensaje.

**Estructurales (riesgo de drift futuro):**
- `Timeline` (compartido) vs `DesktopTimeline` (copia local) — misma feature, dos implementaciones; ya divergen en límite de fotos (3 vs todas) y empty state.
- `VehicleCard` (compartido, mobile) vs markup `pwv` inline (desktop) en dashboard.
- `ReadyBanner` (compartido, mobile) vs markup `pwready` inline (desktop).

**Menores / probablemente intencionales:**
- Links "volver" solo desktop (mobile navega con `BottomNav`).
- `UserMenu` solo en desktop (mobile no tiene acceso a "cerrar sesión" desde la nav — pero sí desde perfil).
- Títulos distintos ("Tutoriales" vs "Cuidados"); subtítulo del hero con contenido distinto.
- Activar sin foto de fondo en desktop.
- Punto de color del vehículo solo desktop.

## Resumen

- **Pantallas:** 8 (7 + layout).
- **Paridad total:** login, activar — 2 pantallas limpias.
- **Paridad con notas:** tutoriales (paridad interna, pero cards muertas en ambos).
- **Con divergencia a revisar:** layout/nav, dashboard, perfil, detalle de vehículo, historial — 5 pantallas.
- El drift acá es **más funcional que en la web pública**: interactividad asimétrica
  (links que existen en un viewport y no en el otro) y datos que el cliente ve o no ve
  según el dispositivo (precio del trabajo). Eso pega directo en la experiencia.

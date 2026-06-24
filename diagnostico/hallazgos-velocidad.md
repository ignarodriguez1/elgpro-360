# Hallazgos — Velocidad de navegación (Fase 0, read-only)

> Auditoría de la lentitud percibida al navegar ("apreto el menú y tarda en cargar").
> Cero modificaciones de código. Este documento es el único artefacto producido.
> Fecha: 2026-06-23.

---

## Precondiciones (verificadas antes de auditar)

| # | Precondición | Estado | Detalle |
|---|---|---|---|
| 1 | Sin agente concurrente sobre `app/` / componentes cliente | ⚠️ **Atención** | No hay editor concurrente **activo** ahora (solo el dev server propio). PERO los cambios de la sesión anterior aparecen **auto-commiteados** bajo mensajes "favicon" (`18986fb` toca `public.css` y `TrabajosGallery.tsx`), y los docs registran un agente concurrente en sesiones previas. Algo commitea automáticamente. No bloquea esta auditoría read-only, pero hay que tenerlo presente. |
| 2 | Estado de R1 (hidratación de server actions) | 🔴 **ABIERTO (BLOQUEANTE)** | Per `diagnostico/auditoria-ciclo-vida-ot.md:178` y `reporte-sesion-ciclo-ot.md:70`: las islas interactivas del admin que importan server actions **no hidratan**. No re-confirmado en esta corrida. **Gate duro: la Fase 2 NO se ejecuta hasta confirmar R1 con Valentín.** |
| 3 | Árbol de trabajo limpio | ✅ | `git status` = 0 cambios (rama `main`). Ver salvedad de precondición 1 (auto-commit). |

**Decisión:** dado R1 abierto, esta corrida es **estrictamente read-only**. Se entrega este mapa y se frena en el checkpoint humano.

---

## Resumen ejecutivo

La lentitud **NO viene de primitivas de navegación equivocadas**. Los tres menús (institucional, portal, admin) usan `<Link>` correctamente. Viene de **dos causas que se potencian**, más infra:

1. **CERO `loading.tsx` en toda la app.** Toda ruta dinámica muestra pantalla quieta hasta que el server responde entero. Causa #1 del "tarda en cargar". → **arreglable en código (Fase 2)**.
2. **R1 — el admin no hidrata.** Sin hidratación, el `<Link>` no dispara prefetch ni soft-navigation: cada click cae a **navegación dura** (full page load). → **bloqueante, track aparte, gate de Fase 2**.
3. **Infra (región / pooler):** a confirmar por Valentín. El pooler ya está previsto en el template; la región de la función vs. la de la DB no es legible desde el código.

El efecto combinado: tocás el menú admin → no hay prefetch (R1) → arranca una navegación dura → no hay `loading.tsx` (A2) → **pantalla congelada hasta la respuesta completa**. Eso es exactamente "parece que no pasa nada".

---

## A1 — Mecanismo de navegación

**Veredicto: los menús están BIEN. No es la primitiva.**

| Área | Componente | Primitiva | Estado |
|---|---|---|---|
| Institucional | `PublicChrome.tsx` / `MobileChrome.tsx` / `Footer.tsx` / `MobileFooter.tsx` | `<Link>` (next/link) | ✅ |
| Portal cliente | `BottomNav.tsx:25` / `PwNav.tsx:28` | `<Link>` | ✅ |
| Admin (el síntoma) | `AdminShell.tsx:70` (sidebar desktop **y** overlay mobile comparten `navLinks()`) | `<Link>` | ✅ |

- **Ningún menú usa `<button onClick={router.push}>`.** No hay `asChild` roto (cero usos de `asChild`).
- `router.push` aparece solo en **redirects post-mutación** (uso legítimo): `EditVehicleForm.tsx:73`, `ServicesList.tsx:35`, y los `useRouter` de `NewVehicleForm`/`NewCustomerForm`/`TrabajosEditor`/`TutorialEditor`/`EditCustomerForm` (refrescos tras crear/editar).
- Único `router.push` en un botón de navegación: `SessionNotice.tsx:75` (`onClick={() => router.push(primaryHref)}`) — es el CTA de un aviso de sesión, no navegación de menú. Prioridad baja; podría ser `<Link>` pero no es el síntoma.
- Login admin/cliente usan **navegación dura a propósito** (`AdminLoginForm.tsx:31`, `ClienteLoginForm.tsx:36`) para re-ejecutar el layout tras autenticar. Correcto, no tocar.

**Bandera roja real:** el menú admin es `<Link>` correcto, pero su beneficio (prefetch + soft-nav) está **anulado por R1** (no hidrata) y por A2 (no hay loading boundary).

---

## A2 — Cobertura de `loading.tsx`

**Veredicto: CERO `loading.tsx` en todo `src/app`. Causa #1.**

- `fd "loading.tsx$" src` → **vacío**. No existe ningún boundary de carga.
- Hay `error.tsx` en `(public)`, `admin`, `clientes` y root + `global-error.tsx`, pero **ningún `loading.tsx`**.
- Único `Suspense`: `clientes/activar/page.tsx` (flujo de activación), no cubre navegación.
- `admin/layout.tsx` es `async` con `await auth()` (dinámico por cookies) → cada navegación admin re-corre auth + el fetch de la page, **sin nada visible mientras tanto**.

**Regla aplicada:** en ruta dinámica, el prefetch precarga solo hasta el `loading.tsx` más cercano. Sin `loading.tsx` → la navegación espera la respuesta completa del server.

**Huecos prioritarios (todos dinámicos — Auth.js + datos en vivo):**

| Prioridad | Segmento | Por qué |
|---|---|---|
| 🔴 P0 | `/admin` y todo `src/app/admin/**` (ordenes, ordenes/[id], ordenes/nueva, clientes, clientes/[id], vehiculos, vehiculos/[id], servicios, servicios/[id], trabajos, tutoriales, auditoria) | Es el síntoma reportado. 14 rutas, todas sin loading. |
| 🟠 P1 | `/clientes/dashboard`, `/clientes/vehiculos/[id]`, `/clientes/vehiculos/[id]/historial`, `/clientes/vehiculos/[id]/orden/[orderId]`, `/clientes/tutoriales`, `/clientes/perfil` | Portal cliente, datos vivos de OT. |
| 🟡 P2 | `(public)`: `page`, `servicios`, `trabajos`, `tutoriales`, `tutoriales/[slug]`, `contacto` (todas `export const dynamic = "force-dynamic"`) | Menos crítico; el público ya tiene reveals, pero igual entra "frío". |

---

## A3 — Instanciación de Prisma

**Veredicto: SANO. No requiere el Grupo 3 de Fase 2.**

- **Singleton:** presente y correcto en `src/lib/prisma.ts` — patrón `globalForPrisma` con `PrismaPg` adapter; reusa la instancia en dev y no abre conexión por request.
- **Connection string (sin exponer secretos):** el `.env` real está **protegido** (no legible — correcto). El template `.env.example` documenta el setup previsto:
  - Runtime `DATABASE_URL` = endpoint **POOLED de Neon** (host con `-pooler`, `pgbouncer=true`, `connection_limit=1`). ✅ Apropiado para serverless.
  - `DIRECT_URL` (sin pooler) reservada para migraciones — el template aclara que **el código aún no la lee** (`prisma.config.ts` usa `DATABASE_URL`).
- **A confirmar (Valentín):** que el `.env` de **producción** efectivamente apunte al pooler como el template. No verificable desde acá.

→ Como A3 no está ausente, **el Grupo 3 (singleton) no aplica**.

---

## A4 — Overrides de prefetch

- `rg "prefetch" src` → **vacío**. No hay ningún `prefetch={false}`.
- El prefetch está en default (automático en viewport).
- **Pero el default es inútil acá** mientras: (a) no haya `loading.tsx` en rutas dinámicas (A2), y (b) el admin no hidrate (R1). No tocar: no forzar `prefetch={true}` global (inflaría requests en páginas con muchos links).

---

## A5 — Config de Vercel / Next (read-only)

- **`vercel.json`: no existe** en el repo. → Región de función, plan y Fluid Compute se manejan en el **dashboard de Vercel**, no en código.
- **`next.config.ts`:** solo headers de seguridad + `allowedDevOrigins` (dev). **Sin** región, **sin** `experimental.*` de performance, **sin** `output`.
- 🟦 **Decisión de infraestructura — Valentín:** región de la función (default Vercel = `iad1` / Washington D.C.), plan, Fluid Compute / scale-to-one. No resolubles desde el código.

---

## A6 — Interacción con hidratación (relación con R1)

- **R1 es la causa raíz transversal.** `auditoria-ciclo-vida-ot.md:178`: "las islas interactivas que importan server actions NO hidratan" (reproducible). Sin hidratación de la app cliente, `<Link>` no prefetchea ni hace soft-nav → navegación dura.
- **Clientes pesados en rutas críticas:**
  - Portal: `OrderLiveProvider.tsx` + `useOrderSocket.ts` (WebSocket/Redis realtime) — el más pesado; evaluar si retrasa la hidratación del dashboard del cliente.
  - Admin: `AdminShell` (`use client`) es liviano (nav = Links); los pesos están en las islas de contenido (`OrderActions`, `FlowEditor`, forms con server actions) — las afectadas por R1.
  - Público: `RevealRoot.tsx` (agregado en la sesión anterior) es liviano (un IntersectionObserver); no es factor.
- **Esta auditoría NO contradice R1; lo confirma** como bloqueante upstream del prefetch.

---

## Fuera de alcance — kickback a Valentín (NO ejecutar)

1. **Región de función ↔ región de la DB (Neon).** Si la DB está en otra región que la función (default `iad1`), cada query es un round-trip extra. Medir y alinear en el dashboard de Vercel.
2. **Plan de Vercel / Fluid Compute / scale-to-one** (instancia tibia = solo Pro+).
3. **Confirmar el pooler en prod** (el template lo prevé; falta verificar el `.env` real).

---

## Orden de remediación recomendado (Fase 2 — GATED por R1)

1. **R1 primero (hidratación).** Sin esto, ningún prefetch sirve y el resto rinde a medias. Track aparte, con permiso de tocar código y sin agente concurrente encima.
2. **`loading.tsx` con skeletons honestos** (Grupo 2), admin primero. El skeleton debe reflejar la forma real (card de OT, barra de etapas, timeline), no un spinner. Pasa por las skills de motion/taste. Sin simular liveness.
3. **Navegación (Grupo 1):** mínimo — solo evaluar `SessionNotice.tsx:75`. Los menús ya son `<Link>`.
4. **Prisma (Grupo 3): N/A** — el singleton ya está.
5. **Infra:** región + confirmar pooler (Valentín).

## Verificación pendiente (cuando se ejecute Fase 2, en Chrome real)

- Network tab sobre la **misma navegación del admin**: TTFB de la request + tiempo hasta primer render visible, **antes y después**.
- Confirmar que al tocar el menú **aparece el skeleton de inmediato**, no pantalla quieta.
- Si hay deploy: comparar contra `next start` local para aislar el dev server.
- Registrar números concretos. Sin números medidos, no está verificado.

---

## Fase 2 — Grupo 2 implementado y verificado (2026-06-23)

> Aprobado por Valentín ("dale, segui con todo"). Grupo 1: N/A (los menús ya son `<Link>`; único pendiente menor `SessionNotice.tsx:75`). Grupo 3: N/A (singleton ya presente).

**Implementado (cobertura completa — 22 `loading.tsx`):**
- `src/components/shared/RouteSkeletons.tsx` — skeletons honestos (tree-agnósticos, `aria-busy`, basados en `.sk`): `AdminPageSkeleton`, `AdminListSkeleton`, `OrderDetailSkeleton` (hero + barra de etapas + timeline + sidebar), `DetailSkeleton`, `AdminFormSkeleton`, `CustomerDashboardSkeleton`, `CustomerTrackingSkeleton`, `PublicPageSkeleton`, `PublicTutorialSkeleton`.
- **Admin (13):** `/admin` (fallback), `/admin/ordenes`, `/admin/ordenes/[id]` (forma real de OT), `/admin/ordenes/nueva` (wizard), `/admin/clientes`, `/admin/clientes/[id]`, `/admin/vehiculos`, `/admin/vehiculos/[id]`, `/admin/servicios`, `/admin/servicios/[id]`, `/admin/trabajos`, `/admin/tutoriales`, `/admin/auditoria`.
- **Portal (4):** `/clientes/dashboard`, `/clientes/vehiculos/[id]` (cubre orden/historial anidados), `/clientes/tutoriales`, `/clientes/perfil`.
- **Web pública (5):** `/servicios`, `/trabajos`, `/tutoriales`, `/tutoriales/[slug]` (reproductor), `/contacto`. **Home excluido a propósito:** un skeleton antes del hero le resta a la primera impresión de marketing, y la entrada coreografiada ya da feedback. (Reversible si se prefiere.)
- `shared.css`: `.sk-two-col` (2 col desktop / 1 mobile) + `@media (prefers-reduced-motion: reduce){ .sk{ animation:none } }`.

**Verificación adicional:** skeleton público confirmado en soft-nav (Inicio → Servicios), 21 bloques `.sk` con la silueta header + grilla de cards. `tsc --noEmit` exit 0 tras la cobertura completa. Sin errores de server.

**Verificado en Chrome real (login admin@elgpro.com):**

| Navegación | Tiempo a skeleton (primer feedback) | Tiempo a contenido | Antes (sin loading.tsx) |
|---|---|---|---|
| Menú → Órdenes (desktop, soft-nav) | **136 ms** | — | pantalla quieta |
| Menú → OT detalle (desktop, soft-nav) | **93 ms** | 3324 ms* | **~3,3 s congelado** |
| Menú → Vehículos (mobile, burger→overlay) | **99 ms** | — | pantalla quieta |

*El tiempo a contenido incluye el compile del dev en la primera visita; en prod es mucho menor. El punto: el skeleton aparece a ~100ms **sea cual sea** la latencia del server.

**Hallazgos de verificación:**
- Confirmado **soft-navigation** (el eval sobrevivió a la navegación) → **AdminShell hidrata** en este entorno y el menú hace client-nav. Para la NAVEGACIÓN del admin, R1 no está bloqueando acá.
- Skeleton con la forma correcta por ruta (13 bloques `.sk` en listas, 46 en OT detalle).
- Contenido real renderiza bien en todas las rutas probadas (clientes, OT detalle, auditoría, vehículos). `tsc --noEmit` exit 0. Sin errores de server (solo warning SSL de pg, preexistente).
- El skeleton no se logró congelar en screenshot (el dev carga el contenido más rápido que la latencia eval→captura); verificado por DOM (timing + estructura), más preciso que una foto.

**Nota R1:** el login admin (form cliente con `signIn`) hidrató y funcionó; AdminShell hidrata. R1 sigue documentado como bloqueante para las **islas que importan server actions** (avanzar etapa, etc.) — eso es un track aparte y NO se tocó. La mejora de navegación no depende de R1.

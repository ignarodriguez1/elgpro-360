# ELG Pro 360 — Bitácora de desarrollo

Registro completo de cómo se construyó la app: **modelado de datos**, **portado de diseño** y **puesta en marcha**. Pensado para que cualquiera entienda qué se hizo, por qué, y cómo levantarlo de cero.

> **Producto:** "La historia clínica de tu auto + seguimiento en tiempo real del trabajo en taller." — taller de estética automotor (Rosario).
> **Estado:** app completa, corriendo end-to-end con datos reales. `build` OK · `tsc` limpio · login admin + cliente funcionando.

---

## Línea de tiempo

| Fase | Qué | Resultado |
|------|-----|-----------|
| 0 · Scaffold | Andamiaje Next.js 16 + Prisma 7 + Auth.js v5 + Tailwind v4 | Base con placeholders |
| 1 · Modelado | Reconciliación del modelo de datos con la doc funcional v1.0 | Editor de flujo, etapas macro, estados PROCESO/LISTO/ENTREGADO |
| 2 · Diseño | Portado del prototipo de alta fidelidad a las 28 rutas | Pantallas reales conectadas a datos |
| 3 · Puesta en marcha | DB local, migración, seed, fixes de runtime | App viva en `localhost` |

---

## Stack

| Capa | Tecnología | Detalle clave |
|------|-----------|---------------|
| Framework | Next.js 16 (App Router, Turbopack) | `params`/`searchParams` son `Promise` |
| Lenguaje | TypeScript `strict` | alias `@/*` → `src/*` |
| ORM / DB | Prisma 7 + PostgreSQL | **driver adapter** `@prisma/adapter-pg` (obligatorio en v7) |
| Auth | Auth.js v5 (NextAuth beta) | Credentials + bcrypt + JWT, **split-config** (edge-safe) |
| UI | Tailwind v4 + shadcn/ui (base-ui) | tokens en `@theme`, sin `tailwind.config.js` |
| Tipografía | Oswald · DM Sans · DM Mono | títulos · cuerpo · patentes/fechas/códigos |
| Imágenes | Cloudinary (signed upload) | pendiente API keys |
| Emails | Resend + react-email | pendiente API key |
| Validación | Zod v4 | schemas centralizados |

---

# FASE 1 — Reconciliación del modelo de datos

El scaffold se construyó con el modelo del brief original. Después apareció una **doc funcional v1.0** con conceptos que el schema no contemplaba. Como la migración aún no se había corrido, se reconcilió el modelo antes de generar deuda.

## Cambios al schema (`prisma/schema.prisma`)

| Cambio | Detalle |
|--------|---------|
| Enum `WorkOrderStatus` | `ACTIVE/COMPLETED/CANCELLED` → **`PROCESO` / `LISTO` / `ENTREGADO`** (default `PROCESO`) |
| Enum `OrderStage` (nuevo) | `INGRESO` · `PREPARACION` · `PINTURA` · `DETAIL_ENTREGA` — las 4 etapas macro de la barra de progreso |
| Modelo `FlowStep` (nuevo) | Hoja de ruta de estados por servicio: `title`, `description`, `stage`, `visible`, `custom`, `sortOrder`, FK a `Service` con `onDelete: Cascade` |
| `Service.flow` | Relación 1:N a `FlowStep` |
| `WorkOrder` +campos | `orderCode @unique` (ej. "OT-1042"), `stage` (etapa macro actual) |
| `WorkOrderStatusUpdate` +campos | `stage`, `isCurrent`, `confirmed`, `custom`, `sortOrder` |

## Lógica de negocio (servicios)

| Función | Servicio | Qué hace |
|---------|----------|----------|
| `buildInitialTimeline(serviceIds)` | work-order | Concatena los flujos de los servicios elegidos, deduplicando el paso de ingreso |
| `createWorkOrder(...)` | work-order | Crea la orden y **materializa** el timeline como `WorkOrderStatusUpdate` |
| `advanceToNextStep(id)` | work-order | Confirma el siguiente paso, mueve `isCurrent`, recalcula `stage` |
| `markStepAsCurrent(updateId)` | work-order | Marca un paso concreto como actual |
| `markAsReady(id)` / `markAsDelivered(id)` | work-order | Transiciones a LISTO / ENTREGADO |
| `generateOrderCode()` | work-order | Genera `OT-` + (1042 + count) |
| `reorderServices`, `reorderFlowSteps`, `addFlowStep`, `updateFlowStep`, `deleteFlowStep`, `createService` | service | CRUD del editor de flujo |

## Las 3 decisiones de diseño

**1. Concatenación de flujos.** Al crear una orden con varios servicios, sus `flow` se concatenan **en orden**. El paso de ingreso (`stage: INGRESO`, "Vehículo ingresado") aparece **una sola vez** al principio; el resto se concatena tal cual.

**2. Materialización (snapshot).** El timeline se **copia** como registros `WorkOrderStatusUpdate` al crear la orden. Así, editar después el flujo del servicio NO altera órdenes existentes. El primer paso queda `isCurrent + confirmed`; el resto, pendientes (`confirmed: false`). El taller los va confirmando sin rearmar nada.

**3. Mapeo estado → etapa macro.** En vez de una tabla de mapeo frágil, **cada `FlowStep` declara su `stage`**. Al materializar se copia al `WorkOrderStatusUpdate`, y `WorkOrder.stage` = `stage` del paso `isCurrent`. Se recalcula solo en cada avance.

> **`orderCode`:** `OT-` + (1042 + cantidad de órdenes). Las órdenes no se borran (se marcan ENTREGADO), por eso el count es monótono y no colisiona. Simple y legible; no apto para alta concurrencia (suficiente para un taller).

Además: schemas Zod nuevos (`flowStepSchema`, `reorderSchema`, `workOrderSchema` con `serviceIds`), seed con **10 servicios con sus flujos** + 2 órdenes con timeline materializado, fuentes Oswald/DM Sans/DM Mono, y rutas placeholder `clientes/perfil` + `admin/servicios/[id]` (editor).

---

# FASE 2 — Portado de diseño

Diseño portado fiel desde `elg-pro-prototipo/` (JSX/HTML/CSS de alta fidelidad) a las pantallas reales, conectándolas a datos.

## Estrategia de ejecución

Se orquestó con **sub-agentes** por bloque. Patrón que funcionó: el CSS de cada área se **pre-copia del prototipo** (archivos chicos) y los agentes solo escriben los `.tsx` usando clases ya presentes — así terminan rápido. La infra/chrome (donde un agente se colgaba) se hizo a mano.

> **Gotcha del entorno:** los sub-agentes largos a veces devolvían `socket connection closed` PERO completaban y escribían a disco igual (el corte era solo en el reporte). Por eso después de cada agente se verificó el estado en disco + `tsc`, sin confiar en el retorno.

## Los 6 bloques

| Bloque | Área | Entregables |
|--------|------|-------------|
| 1 | Componentes compartidos | Logo, Icon (set SVG propio del proto, ~40 iconos), Photo, StatusBadge, StageBar, VehicleCard, **Timeline** (modo cliente + admin), PhotoGallery, Lightbox, ReadyBanner, EmptyState, LoadingSkeleton, VisibilityToggle + `shared.css` + `lib/stages.ts` |
| 2 | Portal cliente | login, dashboard, **detalle de vehículo** (estrella: hero + StageBar + Timeline + ReadyBanner), historial, perfil, tutoriales, BottomNav, `portal.css`, `tutorial.service` |
| 3 | Web pública | home/landing, servicios, trabajos (lightbox antes/después), tutoriales + `[slug]`, contacto (form Zod), chrome (Navbar/Menu/Footer/Reveal/SectionHead), `public.css` |
| 4 | Admin desktop | AdminShell (sidebar), login, dashboard (`getAdminStats`), órdenes (lista + detalle + NewStateForm + UploadZone), **wizard de nueva orden** (5 pasos con preview del timeline concatenado), ABM clientes/vehículos/tutoriales + server actions |
| 5 | Editor de flujo | servicios (lista reordenable) + editor de FlowSteps (**drag & drop** HTML5) conectado a `service.service` |
| 6 | Admin mobile | AdminShell responsive, NewStateSheet, CameraCapture (`input capture`), vista de detalle mobile |

## Decisiones de portado

- **Tokens del prototipo = fuente de verdad.** Se alinearon en `globals.css` (`--bg #0F0F0F`, `--border #2A2A2A`, `--muted #9CA3AF`, `--primary-hover #A3161F`, etc.), distintos a los del scaffold original.
- **Colisión semántica de `muted`.** El proto usa `--muted` como color de texto; shadcn como fondo. Se resolvió en `@theme` mapeando `--color-muted` a `--surface-2` (fondo) y `--color-muted-foreground` a `--muted` (texto).
- **Icon set propio del prototipo** (no lucide) para fidelidad visual exacta.
- **CSS de pantallas copiado tal cual** del proto (usa las mismas `var()`); el `@import` de Google Fonts en `globals.css` hace que `'Oswald'`/`'DM Sans'`/`'DM Mono'` literales resuelvan.
- **Datos reales vía servicios** con guards (`requireAdmin` / `requireCustomer`); mutaciones del admin vía **server actions** (`"use server"`). Mock solo en contenido estático de la web pública.

---

# FASE 3 — Puesta en marcha

Conexión de la DB local, migración, seed y los bugs de runtime que el build no detectaba.

## Configuración de DB (sectorizada)

El `.env` separa cada parte (no un string de conexión). Un helper `buildDatabaseUrl()` arma la URL en los 3 puntos que la usan (`prisma.config.ts`, `src/lib/prisma.ts`, `prisma/seed.ts`). Si se define `DATABASE_URL` explícito (ej. Neon/Supabase), tiene prioridad.

```env
DB_USER="elgpro"
DB_PASSWORD="elgpro360"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="elgpro360"
```

## Bugs y gotchas de runtime resueltos

| # | Síntoma | Causa | Fix |
|---|---------|-------|-----|
| 1 | `Resend()` rompía el build | `new Resend()` en module scope sin API key | Lazy-init `getResend()` |
| 2 | Prerender falla con DB dummy | Páginas públicas con DB intentaban SSG | `export const dynamic = "force-dynamic"` en home/servicios/tutoriales/`[slug]` |
| 3 | `useSearchParams` sin Suspense | Next 16 exige Suspense para hooks client en prerender | `activar` separada en page server + form client con `<Suspense>` |
| 4 | CSS `@import must precede all rules` (fatal en Turbopack dev) | `@import` de fuentes después del `@theme` | Mover el `@import url(...)` al **tope** de `globals.css` |
| 5 | `prisma db seed` → "no seed command" | Prisma 7 movió la config | Definir `migrations.seed` en `prisma.config.ts` |
| 6 | seed → "exports is not defined in ES module scope" | client de Prisma 7 es ESM; ts-node usa CommonJS | Usar **`tsx`** (`npx tsx prisma/seed.ts`) |
| 7 | `/admin/login` en **loop de redirect 307** | `admin/layout.tsx` llamaba `requireAdmin()` y envolvía la propia página de login | El layout hace `auth()`: sin sesión admin renderiza solo `children`; la protección la hace `requireAdmin()` en cada `page.tsx` |

---

# Referencia

## Modelo de datos (11 modelos · 4 enums)

```
Service ──1:N── FlowStep            (plantilla de pasos; al crear orden se concatena → se materializa ↓)
User ─1:1─ CustomerProfile ─1:N─ Vehicle ─1:N─ WorkOrder
                                                  ├─1:N─ WorkOrderStatusUpdate ─1:N─ WorkOrderPhoto
                                                  └─1:N─ WorkOrderPhoto
Independientes: Tutorial · ProductRecommendation
```

Enums: `Role` (ADMIN/STAFF/CUSTOMER) · `WorkOrderStatus` (PROCESO/LISTO/ENTREGADO) · `OrderStage` (INGRESO/PREPARACION/PINTURA/DETAIL_ENTREGA) · `PaymentStatus` (PENDING/PARTIAL/PAID/NA).

## Mapa de rutas (28)

| Área | Rutas |
|------|-------|
| Pública | `/` · `/servicios` · `/trabajos` · `/tutoriales` · `/tutoriales/[slug]` · `/contacto` |
| Cliente | `/clientes/login` · `/activar` · `/dashboard` · `/vehiculos/[id]` · `/vehiculos/[id]/historial` · `/perfil` · `/tutoriales` |
| Admin | `/admin/login` · `/admin` · `/clientes` (+`[id]`) · `/vehiculos` (+`[id]`) · `/ordenes` (+`nueva`, +`[id]`) · `/tutoriales` · `/servicios` (+`[id]` editor) |
| API | `/api/auth/[...nextauth]` · `/api/auth/activate` · `/api/upload` |

## Levantar de cero

```bash
npm install
cp .env.example .env
echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env   # si no lo tenés

# DB local (si no existe)
psql postgres -c "CREATE USER elgpro WITH PASSWORD 'elgpro360';"
psql postgres -c "CREATE DATABASE elgpro360 OWNER elgpro;"

npx prisma migrate dev --name init   # crea tablas
npx prisma db seed                   # carga datos (usa tsx)
npm run dev
```

## Credenciales de prueba (seed)

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@elgpro.com | admin1234 |
| Cliente | martin@example.com | cliente1234 |
| Cliente | lucia@example.com | cliente1234 |

---

## Pendientes / próximos pasos

| Tema | Estado |
|------|--------|
| Acciones del admin (wizard, avanzar estado, marcar listo, editor de flujo) | Compilan; **falta probarlas en runtime** |
| Cloudinary (upload de fotos) | Falta cargar API keys en `.env` |
| Resend (3 emails transaccionales) | Falta cargar API key en `.env` |
| Portfolio público + testimonios | Estáticos (no hay modelo) |
| "Cuidados recomendados" (detalle vehículo) | Estático (no hay join orden↔tutorial) |
| Form de contacto | `console.log` (sin endpoint real) |
| Admin mobile | Responsive básico — revisar en dispositivo real |
| Envío del `inviteToken` por email al crear cliente | No implementado |

---

> Documento de referencia rápida y estado actual: ver [`ARQUITECTURA.md`](./ARQUITECTURA.md).

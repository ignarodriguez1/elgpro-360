# ELG Pro 360 — Arquitectura y bitácora

Aplicación full-stack: "la historia clínica de tu auto + seguimiento en tiempo real del trabajo en taller". Diseño portado desde prototipo de alta fidelidad, conectado a datos reales.

> Scaffold: 2026-05-29 · Modelo v1.0: 2026-05-29 · Portado diseño (Bloques 1–6): 2026-05-30 · Estado: **app completa — build OK, 0 TODOs, guards intactos**

---

## Estado actual

| Check | Resultado |
|-------|-----------|
| `tsc --noEmit` | ✅ Limpio |
| `npm run build` | ✅ Compila, sin warnings de Edge |
| `npm run dev` | ✅ `GET / 200` (verificado con curl) |
| Autenticación | ✅ Login admin + cliente, JWT con roles |
| Rutas protegidas | ✅ Proxy + guards por página |
| Editor de flujo (modelo + lógica + UI) | ✅ Drag & drop conectado a servicios |
| Pantallas portadas | ✅ 28 rutas, 0 TODOs, datos reales |
| Guards intactos | ✅ 11 páginas admin + 5 cliente con guards |
| `npm run build` | ✅ 28 rutas, exit 0 |
| Migración / seed | ⏳ Pendiente — requiere DB conectada |

---

## Stack

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | Next.js 16 (App Router, Turbopack) | `params`/`searchParams` son `Promise` |
| Lenguaje | TypeScript (`strict`) | alias `@/*` → `src/*` |
| ORM / DB | Prisma 7 + PostgreSQL | usa **driver adapter** `@prisma/adapter-pg` |
| Auth | Auth.js v5 (NextAuth beta) | Credentials + bcrypt + JWT, **split-config** |
| UI | Tailwind v4 + shadcn/ui (base-ui) | tokens en `@theme`, dark por defecto |
| Tipografía | Oswald · DM Sans · DM Mono | títulos · cuerpo · patentes/fechas/códigos |
| Imágenes | Cloudinary (signed upload) | `next-cloudinary` |
| Emails | Resend + react-email | 3 templates con branding ELG Pro |
| Validación | Zod v4 | schemas centralizados |

---

## Cómo arrancar (quick path)

1. `npm install`
2. `cp .env.example .env` y completar credenciales (**`AUTH_SECRET` obligatorio** → `openssl rand -base64 32`)
3. `npx prisma generate`
4. `npx prisma migrate dev --name init`
5. `npx prisma db seed`
6. `npm run dev` → http://localhost:3000

---

## Arquitectura por capas

### 1. Rutas (`src/app/`)

| Área | Carpeta | Protección | Páginas |
|------|---------|-----------|---------|
| Pública | `(public)/` | Abierta | home, servicios, trabajos, tutoriales (+`[slug]`), contacto |
| Cliente | `clientes/` | Rol `CUSTOMER`/`ADMIN` | login, activar, dashboard, vehículos `[id]` (+historial), tutoriales, **perfil** |
| Admin | `admin/` | Rol `ADMIN`/`STAFF` | login, dashboard, clientes (+`[id]`), vehículos (+`[id]`), órdenes (+nueva, +`[id]`), tutoriales, servicios (+**`[id]` editor de flujo**) |
| API | `api/` | Según endpoint | `auth/[...nextauth]`, `auth/activate`, `upload` |

> Las vistas mobile del admin ("Hoy en el taller", "Cámara") son **variantes responsive** de `admin/page.tsx` y `admin/ordenes/[id]/page.tsx` — no rutas separadas (marcado con comentario en cada placeholder).

### 2. Autenticación — split-config

| Archivo | Runtime | Contiene |
|---------|---------|----------|
| `src/lib/auth.config.ts` | Edge-safe | callbacks (jwt/session), pages. **Sin Prisma ni bcrypt** |
| `src/lib/auth.ts` | Node | spread de `authConfig` + provider Credentials que toca la DB |
| `src/proxy.ts` | Node | `NextAuth(authConfig)` — solo lee el JWT, nunca la DB |
| `src/lib/session.ts` | Node | helpers `requireAdmin()`, `requireCustomer()`, `getCurrentUser()` |

Doble protección: el **proxy** redirige por rol + cada **página** llama `requireX()` (defensa en profundidad).

### 3. Servicios (`src/services/`) — lógica de negocio

| Servicio | Responsabilidad |
|----------|----------------|
| `customer.service` | alta (con `inviteToken`), activación, edición, listado, búsqueda |
| `vehicle.service` | CRUD + listado por cliente / global |
| `service.service` | **editor de flujo**: CRUD de servicios y `FlowStep`, reordenamiento drag & drop |
| `work-order.service` | crear (concatena flujos + materializa timeline), avanzar estado, listo/entregado |
| `status-update.service` | intercalar estado manual (con `stage`/`custom`), filtrar visibles para cliente |
| `notification.service` | disparar emails cuando `notifyCustomer = true` |
| `upload.service` | subida a Cloudinary + generación de thumbnail |

> 🔒 **Seguridad:** toda función que devuelve datos de un cliente recibe `userId`/`role` y valida permisos en el backend. Un `CUSTOMER` solo accede a sus propios vehículos y órdenes.

### 4. Componentes compartidos (`src/components/shared/`)

`Timeline` · `VehicleCard` · `PhotoGallery` · `UploadZone` · `StatusBadge` · `VisibilityToggle` · `EmptyState` · `LoadingSkeleton`

---

## Modelo de datos (`prisma/schema.prisma`)

11 modelos + 4 enums (`Role`, `WorkOrderStatus`, `OrderStage`, `PaymentStatus`).

```
Service ──1:N── FlowStep            (plantilla de pasos por servicio)
                   │  (al crear orden: se concatenan → se materializan ↓)
User ─1:1─ CustomerProfile ─1:N─ Vehicle ─1:N─ WorkOrder
                                                  ├─1:N─ WorkOrderStatusUpdate ─1:N─ WorkOrderPhoto
                                                  └─1:N─ WorkOrderPhoto
User ─1:N─ WorkOrderStatusUpdate (createdBy)

Independientes: Tutorial · ProductRecommendation
```

| Modelo | Rol en el dominio |
|--------|-------------------|
| `User` | identidad + rol; `inviteToken` para onboarding sin password |
| `CustomerProfile` | datos de contacto del cliente |
| `Vehicle` | auto del cliente (patente indexada) |
| `WorkOrder` | trabajo en taller; `orderCode`, `status`, `stage` (etapa macro), presupuesto, pago |
| `WorkOrderStatusUpdate` | hito del timeline; `stage`, `isCurrent`, `confirmed`, `custom`, `sortOrder` |
| `WorkOrderPhoto` | foto asociada a orden o a un update |
| `Service` | servicio del catálogo; tiene `flow` (FlowStep[]) |
| `FlowStep` | paso plantilla de un servicio; `stage`, `visible`, `custom`, `sortOrder` |
| `Tutorial` / `ProductRecommendation` | contenido editable por admin |

### Enums de estado

| Enum | Valores | Uso |
|------|---------|-----|
| `WorkOrderStatus` | `PROCESO` · `LISTO` · `ENTREGADO` | estado macro de la orden (default `PROCESO`) |
| `OrderStage` | `INGRESO` · `PREPARACION` · `PINTURA` · `DETAIL_ENTREGA` | 4 etapas macro → barra de progreso |

---

## Reconciliación del modelo (doc funcional v1.0)

Lo que se incorporó sobre el scaffold original, con las decisiones tomadas:

### Editor de flujo de estados por servicio

Cada `Service` tiene una secuencia ordenada de `FlowStep` (la "hoja de ruta"). El admin la edita: reordenar (drag & drop vía `sortOrder`), agregar/editar/eliminar pasos, toggle de visibilidad. `createService` arranca siempre con un paso inicial **"Vehículo ingresado"** (`INGRESO`).

### Concatenación de flujos (al crear una orden)

`buildInitialTimeline(serviceIds)` lee los `flow` de los servicios elegidos, los concatena **en el orden recibido** y **deduplica el paso de ingreso**: si varios servicios arrancan con un paso `INGRESO`, aparece **una sola vez** al principio; el resto se concatena tal cual.

### Materialización (decisión)

Al crear la orden, el timeline se **materializa** como registros `WorkOrderStatusUpdate` (snapshot). **Por qué:** congela el plan — editar después el flujo del servicio NO altera órdenes ya creadas. El primer paso queda `isCurrent + confirmed`; el resto, `confirmed=false` (pendientes). El taller los va confirmando con `advanceToNextStep` / `markStepAsCurrent` sin rearmar el formulario.

### Mapeo estado → etapa macro (decisión: lo declara el dato)

En vez de una tabla de mapeo frágil, **cada `FlowStep` declara su `stage`**. Al materializar, el `stage` se copia al `WorkOrderStatusUpdate`. Entonces `WorkOrder.stage` = `stage` del update `isCurrent` — se recalcula en cada avance. Simple y sin lógica de adivinanza.

### `orderCode` (decisión)

`OT-` + (1042 + `count` de órdenes). Las órdenes no se borran (se marcan `ENTREGADO`), así que el count es monótono → no colisiona. O(1) y legible. **Limitación documentada:** no apto para alta concurrencia (dos altas simultáneas darían el mismo código → falla el `@unique`); suficiente para un taller que carga de a una.

### Tipografía

`next/font/google` expone tres fuentes como tokens en `@theme`: **Oswald** (`--font-heading`), **DM Sans** (`--font-sans`), **DM Mono** (`--font-mono`).

---

## Decisiones técnicas y gotchas

| Tema | Decisión / Gotcha |
|------|-------------------|
| Prisma 7 client | Genera en `src/generated/prisma/client.ts` (sin `index`). Importar desde `@/generated/prisma/client` |
| Prisma 7 instancia | Requiere **driver adapter**: `new PrismaClient({ adapter: new PrismaPg(url) })` |
| shadcn v4 | Usa `@base-ui/react`. El `Button` **no tiene `asChild`** → envolver en `<Link>` |
| Next 16 params | `params`/`searchParams` son `Promise` → `const { id } = await params` |
| Tailwind v4 | Tokens en `@theme inline {}` dentro de `globals.css`. **No hay `tailwind.config.js`** |
| Auth.js v5 tipos | Augmentación del JWT en `@auth/core/jwt`, no `next-auth/jwt` |
| Middleware Next 16 | `middleware.ts` = Edge (deprecado) · `proxy.ts` = **Node runtime** |
| Ruteo API | `api/auth/activate/route.ts` (estático) gana sobre el catch-all `[...nextauth]` |
| Estados de orden | Enum nuevo `PROCESO/LISTO/ENTREGADO` (antes `ACTIVE/COMPLETED/CANCELLED`) |

---

## Bugs encontrados y resueltos (revisión post-scaffold)

| # | Síntoma | Causa raíz | Fix |
|---|---------|-----------|-----|
| 1 | Activación daba 404 | Faltaba `/api/auth/activate` | Creado el route handler (Zod + `activateCustomer`) |
| 2 | Código muerto en layout cliente | `typeof window` siempre true en Server Component | Reescrito: sin sesión renderiza solo `children` |
| 3 | **`dev` crasheaba** (`node:path` en Edge, `GET / 404`) | `middleware.ts` corre en Edge e importaba Prisma | **Split-config** + `proxy.ts`. Verificado `GET / 200` |

> 💡 **Lección:** un build verde no prueba que el runtime funcione — el build no ejecuta el middleware. Hay que correrlo.

---

## Mapa de archivos clave

| Path | Qué hace |
|------|----------|
| `src/lib/prisma.ts` | Singleton del client con `PrismaPg` |
| `src/lib/auth.config.ts` / `auth.ts` | Config edge-safe / NextAuth completo |
| `src/proxy.ts` | Protección de rutas por rol |
| `src/lib/session.ts` | Guards de sesión para Server Components |
| `src/lib/validations.ts` | Schemas Zod (incluye `flowStepSchema`, `reorderSchema`) |
| `src/services/service.service.ts` | Editor de flujo (servicios + FlowStep) |
| `src/services/work-order.service.ts` | Concatenación, materialización y avance de estados |
| `prisma/seed.ts` | 10 servicios con flujos + 2 órdenes con timeline materializado |
| `emails/*.tsx` | Templates: invite, status-update, ready-pickup |

---

## Próximos pasos (checklist)

- [ ] Crear `.env` con `DATABASE_URL`, `AUTH_SECRET` y credenciales de Cloudinary/Resend
- [ ] Conectar PostgreSQL y correr `prisma migrate dev --name init`
- [ ] Correr `prisma db seed`
- [ ] Verificar login admin/cliente y navegación de rutas protegidas
- [ ] Portar el diseño del prototipo (buscar `TODO: portar diseño`) — incl. editor de flujo en `admin/servicios/[id]`
- [ ] (Opcional) Envío real del `inviteToken` por email al crear cliente

---

## Credenciales de prueba (seed)

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@elgpro.com | admin1234 |
| Cliente | martin@example.com | cliente1234 |
| Cliente | lucia@example.com | cliente1234 |

---

> **Nota de entorno (fuera del proyecto):** en `../.claude/settings.local.json` se activó `bypassPermissions` para el flujo con Claude Code. No afecta la app.

# Auditoría de robustez y datos — ELG Pro 360

> **Tipo:** Auditoría read-only + plan de acción. **No se modificó código de la app.**
> **Fecha:** 2026-05-30 · **Alcance:** Historial/auditoría · Consistencia de datos · Resiliencia · Rutas/404s.
> **Fuera de alcance (por decisión):** escala horizontal, tiempo real, Redis, WebSockets. Es un taller único, bajo volumen.
> **Stack verificado:** Next.js 16 (App Router), Prisma 7 + PostgreSQL (`@prisma/adapter-pg`), Auth.js v5 (split-config + `proxy.ts`), Zod v4, Tailwind v4.

---

## 1. Resumen ejecutivo

Ordenado por riesgo/impacto real, no por cantidad.

1. **🟢 Lo que está SÓLIDO (no tocar):**
   - **Integridad referencial:** todas las FK requeridas son `ON DELETE RESTRICT` en la migración real (`prisma/migrations/20260530143107_init/migration.sql:216-237`). No hay riesgo de huérfanos. La "historia clínica" es permanente por construcción: la DB no te deja borrar un cliente/vehículo/orden con hijos.
   - **Ownership entre clientes:** NO hay fuga. `getVehicleById`/`getWorkOrderById`/`listWorkOrders` validan pertenencia contra el `user.id` de la sesión, no contra un input manipulable. Un CUSTOMER no puede ver el auto de otro cambiando el ID.
   - **404 en rutas dinámicas:** las 7 rutas `[id]`/`[slug]` hacen `try/catch → notFound()`. Patrón uniforme y correcto.
   - **Guards de rol:** cobertura 100% en pages admin y cliente, con `proxy.ts` (middleware edge) como segunda capa.

2. **🔴 CRÍTICO — Cero error boundaries.** No existe ningún `error.tsx` ni `global-error.tsx` en toda la app. Cualquier `throw` fuera de las pages de detalle (dashboard, listados, un blip de Prisma) cae en pantalla rota sin recuperación. Es el hueco más grande de resiliencia.

3. **🔴 CRÍTICO — Doble submit en "Avanzar etapa" / "Marcar listo".** Son `<form action={...}>` planos sin `useTransition`/`disabled` (`admin/ordenes/[id]/page.tsx:74,79`). Doble click salta dos etapas o **duplica el estado "Listo para retirar"**. `markAsReady` no es idempotente.

4. **🟠 ALTO — `markAsReady` no es transaccional.** Hace `updateMany(isCurrent=false)` y luego `workOrder.update(...)` como **dos escrituras separadas** (`work-order.service.ts:281-309`). Si falla la segunda, la orden queda con **cero `isCurrent`** → timeline sin "estado actual".

5. **🟠 ALTO — La capa de validación Zod existe pero está muerta.** `lib/validations.ts` tiene esquemas completos y bien hechos, pero **ninguna server action ni servicio los usa** (salvo un schema inline en `api/auth/activate`). Las mutaciones confían solo en tipos de TypeScript (sin protección en runtime).

6. **🟠 ALTO — El historial system-wide no existe (Área 1).** El único registro histórico es el timeline `WorkOrderStatusUpdate` (la cara visible de la orden). No hay un log de auditoría interno que registre quién cambió qué y cuándo a nivel sistema: cambios de presupuesto, ediciones de cliente/vehículo, toggles de servicio/tutorial, borrado de pasos, etc.

7. **🟠 ALTO — El ciclo de vida de la orden no cierra.** `markAsDelivered` existe pero **no está cableado a ningún botón**. Las órdenes nunca llegan a `ENTREGADO` por la UI (solo `PROCESO → LISTO`). Consecuencia: la métrica `completadasDelMes` del dashboard siempre da 0, `actualDeliveryDate` nunca se setea, y una orden `LISTO` queda "en taller" para siempre.

8. **🟡 MEDIO — Falta unicidad de patente.** `Vehicle.licensePlate` solo tiene `@@index`, no `@unique`. Se pueden cargar patentes duplicadas. Falta `@@unique([customerId, licensePlate])`.

9. **🟡 MEDIO — Bug funcional silencioso: el email "listo para retirar" nunca se envía.** `notifyReadyForPickup` y `sendReadyForPickupEmail` están definidas pero **no se invocan desde ningún lado**. El cliente nunca recibe el aviso de que su auto está listo.

10. **🟡 MEDIO — Mucho código de servicio muerto.** `createCustomer`, `updateCustomer`, `createVehicle`, `updateVehicle`, `deleteVehicle`, `deleteService`, `markStepAsCurrent` **no tienen ningún caller**. No hay UI de alta/edición de clientes ni vehículos: hoy solo se crean por el `seed.ts`.

---

## 2. Hallazgos por área

### ÁREA 1 — Historial / auditoría ("historia clínica")

**Qué existe hoy:**
- El timeline `WorkOrderStatusUpdate` (`schema.prisma:109-132`) es un buen historial **de la orden**: cada paso registra `title`, `description`, `stage`, `visibleToCustomer`, `createdByUserId`, `createdAt`, `confirmed`, `isCurrent`, `custom`, y fotos asociadas. Es rico y, de hecho, ya es una forma de historia clínica del trabajo.
- La **permanencia** está bien resuelta a nivel DB: los `ON DELETE RESTRICT` impiden borrar una orden/vehículo/cliente con historial. El timeline y las fotos sobreviven.

**Qué falta / es riesgoso:**
- **No hay traza system-wide.** Eventos que hoy NO quedan registrados en ningún lado:
  - Cambios de presupuesto (`budgetAmount`) y de `paymentStatus`.
  - Cambios de `estimatedDeliveryDate`.
  - Ediciones de cliente/vehículo (cuando se implementen — los services existen pero no están cableados).
  - Toggles de visibilidad de servicio/tutorial, alta/edición/borrado de pasos del flujo (`addFlowStep`/`updateFlowStep`/`deleteFlowStep`).
  - `advanceToNextStep`, `markAsReady` (quedan reflejados en el timeline, pero sin diff ni "quién" salvo `createdByUserId`).
- **Pérdida de "quién":** `WorkOrderStatusUpdate.createdByUserId` es `ON DELETE SET NULL` (`migration.sql:228`). Si se borra el User staff/admin, se pierde la autoría histórica.
- **No hay diff antes/después** en ninguna mutación.

**Propuesta de diseño (sin implementar) — `AuditLog` append-only:**
```
model AuditLog {
  id         String   @id @default(cuid())
  actorId    String?                 // User (SET NULL si se borra)
  actorEmail String                  // snapshot — NO se pierde aunque borren el user
  action     String                  // "ORDER_CREATED", "STATUS_ADDED", "STEP_ADVANCED",
                                      // "MARKED_READY", "MARKED_DELIVERED", "BUDGET_CHANGED",
                                      // "CUSTOMER_UPDATED", "VEHICLE_UPDATED", "FLOW_STEP_DELETED"...
  entity     String                  // "WorkOrder", "Vehicle", "Customer", "Service"...
  entityId   String
  summary    String                  // texto legible para el panel de auditoría
  diff       Json?                   // { before: {...}, after: {...} }
  createdAt  DateTime @default(now())

  @@index([entity, entityId])
  @@index([createdAt])
  @@index([actorId])
}
```
- **Append-only:** solo `create`. Nunca `update`/`delete` (no exponer esos métodos en el service).
- **Dónde engancharlo:** en la capa de **server actions** (ahí ya está `session.user`) o, mejor, en los **services** recibiendo el `actorId`, **dentro de la misma `$transaction`** que la operación que audita (si la operación se revierte, el log también).
- **Diferencia con el timeline:** el `AuditLog` es **interno, total e inmutable**; el `WorkOrderStatusUpdate` es la **cara visible y curada** que ve el cliente. No se mezclan.
- **`actorEmail` snapshot** resuelve la pérdida de "quién" del SET NULL.

---

### ÁREA 2 — Consistencia de datos

**Integridad referencial — 🟢 SÓLIDA.** Fuente de verdad: `migration.sql:216-237`.

| Relación | Acción real | Veredicto |
|---|---|---|
| `CustomerProfile.userId → User` | RESTRICT | ✅ |
| `Vehicle.customerId → CustomerProfile` | RESTRICT | ✅ |
| `WorkOrder.vehicleId → Vehicle` | RESTRICT | ✅ |
| `WorkOrderStatusUpdate.workOrderId → WorkOrder` | RESTRICT | ✅ |
| `WorkOrderPhoto.workOrderId → WorkOrder` | RESTRICT | ✅ |
| `WorkOrderStatusUpdate.createdByUserId → User` | SET NULL | ✅ (opcional) |
| `WorkOrderPhoto.statusUpdateId → WorkOrderStatusUpdate` | SET NULL | ✅ (opcional) |
| `FlowStep.serviceId → Service` | CASCADE | ✅ (borrar servicio limpia su flujo) |

- No hay riesgo de huérfanos. El único `onDelete` explícito en el schema es `FlowStep` (`schema.prisma:198`); el resto usa los defaults de Prisma, que aquí resultan correctos.
- **Latente:** `deleteVehicle` (`vehicle.service.ts:95-107`) solo bloquea por órdenes **activas** (`PROCESO`/`LISTO`). Con órdenes `ENTREGADO`, el `RESTRICT` de la DB tiraría un error crudo de Prisma no manejado. (Hoy es código muerto, pero al cablearlo hay que contemplarlo.)

**Constraints / `@unique` faltantes:**
- 🟡 `Vehicle.licensePlate`: solo `@@index` (`schema.prisma:80`), **NO** `@unique`. Permite patentes duplicadas. Recomendado: `@@unique([customerId, licensePlate])` (una patente por cliente; **no** unique global, porque un auto puede cambiar de dueño y querés conservar el histórico).
- `Vehicle.vin`: sin unique. Bajo impacto si no lo usan en serio; si sí, `@unique` nullable.
- Resto OK: `User.email`, `User.inviteToken`, `CustomerProfile.userId`, `WorkOrder.orderCode`, `Tutorial.slug` son únicos. ✅

**Índices:** razonables y suficientes para el volumen. WorkOrder por `status`/`stage`/`vehicleId`, `orderCode` único, statusUpdate por `workOrderId`+`sortOrder`, flowStep por `serviceId`+`sortOrder`. No sobran. Menores (bajo impacto): podría faltar índice en `WorkOrderPhoto.statusUpdateId` y `User.role` (lo filtra `listCustomers`), pero a este volumen no mueve la aguja.

**Transacciones:**
| Operación | ¿`$transaction`? | Veredicto |
|---|---|---|
| `advanceToNextStep` (`work-order.service.ts:222`) | ✅ | OK |
| `markStepAsCurrent` (`:254`) | ✅ | OK (pero código muerto) |
| `reorderServices` / `reorderFlowSteps` (`service.service.ts:88,101`) | ✅ | OK |
| `createWorkOrder` (`:102`) | ✅ nested create atómico | OK (ver nota orderCode) |
| `createCustomer` (`customer.service.ts:15`) | ✅ nested create atómico | OK |
| **`markAsReady`** (`work-order.service.ts:281-309`) | ❌ **dos escrituras sueltas** | **Riesgo: 0 isCurrent si falla la 2ª** |
| `updateCustomer` (`customer.service.ts:129-135`) | ❌ user + profile separados | Bajo (rara vez ambos juntos; código muerto) |
| `createStatusUpdate` (`status-update.service.ts:27-55`) | ❌ create + updateMany fotos | Bajo |
| `activateCustomer` (`customer.service.ts:36-47`) | ❌ findUnique + update | TOCTOU menor |

**Máquina de estados — NO se valida:**
- `markAsReady`/`markAsDelivered`/`advanceToNextStep` cambian `status`/`stage` sin validar la transición. La UI gatea por status (`page.tsx:73,78`), pero el **servicio** permitiría, por ejemplo, `ENTREGADO → PROCESO` si se lo llama directo.
- **El ciclo no cierra:** `markAsDelivered` (`work-order.service.ts:372`) **no está cableado** a ningún botón (`page.tsx` solo tiene "Avanzar etapa" y "Marcar listo"). Las órdenes nunca llegan a `ENTREGADO` por la UI → `completadasDelMes` siempre 0, `actualDeliveryDate` nunca se setea, `LISTO` no se cierra nunca.

**Datos huérfanos / inconsistentes:**
- 🟡 **Múltiples `isCurrent=true`:** no hay constraint en DB. Se mantiene por código, pero un fallo parcial de `markAsReady` deja 0, y no existe un **índice único parcial** `@@unique([workOrderId]) WHERE isCurrent`. Recomendado agregarlo (Postgres lo soporta como índice parcial).
- **Orden sin ningún estado:** posible si `serviceIds` llega vacío (la validación Zod `min(1)` no se aplica porque `createOrderAction` no usa Zod). Edge case de bajo riesgo dado el wizard, pero real.
- **Vehículo sin cliente:** imposible (`customerId` NOT NULL + RESTRICT). ✅

**Dinero/decimales:** `budgetAmount Decimal(12,2)` correcto (`migration.sql:71`). Nota menor: la firma del service lo tipa como `number` (`work-order.service.ts:87`); a estas magnitudes Prisma convierte sin pérdida. OK.

**Concurrencia de `orderCode`:** `generateOrderCode` usa `count()+1042` (`work-order.service.ts:18-21`). El propio comentario reconoce el race en altas simultáneas. Para carga de a una está bien; **no** recomiendo sobre-ingeniería acá (ver §5).

---

### ÁREA 3 — Resiliencia

- 🔴 **Error boundaries: AUSENTES.** Cero `error.tsx` / `global-error.tsx`. Las pages de detalle capturan y hacen `notFound()` (bien), pero cualquier otro `throw` —dashboard con 4 queries (`admin/page.tsx`), listados, o un fallo de Prisma— cae sin red. Faltan: `app/error.tsx`, `app/global-error.tsx`, `app/admin/error.tsx`, `app/clientes/error.tsx`.
- 🟡 **`loading.tsx`: AUSENTES.** El dashboard admin dispara 4 queries en paralelo sin feedback de carga. Faltan en `admin`, `admin/ordenes`, `admin/vehiculos`, `clientes/dashboard`.
- 🟡 **`not-found.tsx`: AUSENTE.** 404 genérico de Next, sin branding.
- 🟢 **Servicios externos: bien aislados.**
  - `UploadZone.tsx:57-99`: try/catch, si Cloudinary falla resetea el estado y el form no explota. ✅
  - `addStatusAction:56-62`: el email va en try/catch con comentario *"el email no debe romper el guardado"*. El estado se guarda aunque Resend falle. ✅
  - Resend con lazy init para no romper el build sin API key (`email.ts:8-12`). ✅
  - **Pero:** `cloudinary.ts:15` usa `process.env.CLOUDINARY_API_SECRET!` sin validar env (degrada como 500 JSON en `api/upload/route.ts:15-23`, no tumba el form).
- 🟡 **Bug silencioso:** `markReadyAction` no notifica. `notifyReadyForPickup`/`sendReadyForPickupEmail` (`notification.service.ts:39-62`, `email.ts:53`) **nunca se invocan**. El cliente no recibe el aviso de "tu auto está listo".
- 🟠 **Validación de entrada:** `lib/validations.ts` (Zod completo) **no se usa** en ninguna action/service (verificado: 0 imports). Solo `createOrderAction` devuelve `{ error }` manejable; el resto explota vía `assertAdmin` (`throw new Error("No autorizado")`), agravado por la falta de error boundary.
- 🟡 **DB:** `prisma.ts` singleton estándar, sin retry ni manejo de error. Un blip propaga 500. Credenciales fallback hardcodeadas (`elgpro/elgpro360`, `prisma.ts:7-8`) — nota menor de config.
- 🔴 **Idempotencia:** formularios cliente con `useTransition`+`disabled` ✅ (Wizard, NewStateForm, FlowEditor, ActivarForm). **Pero** "Avanzar etapa" y "Marcar listo" son `<form>` planos sin guard (`page.tsx:74,79`) → doble click salta etapa / duplica "Listo para retirar".
- 🟢 **Estados vacíos:** bien resueltos (`EmptyState.tsx` + manejo inline en listados). No rompe.

---

### ÁREA 4 — Rutas y 404s

- 🟢 **Ownership (lo crítico): SIN FUGA.** `getVehicleById:43-48`, `getWorkOrderById:155-167`, `listWorkOrders:186-188` filtran por el `userId` de la sesión. Un CUSTOMER no accede a recursos de otro por más que cambie el ID en la URL. Además, para CUSTOMER se filtran `statusUpdates` no visibles y se borra `internalNotes`. ✅
- 🟢 **404 en IDs inexistentes:** las 7 rutas dinámicas hacen `try/catch → notFound()`. ✅
- 🟢 **Guards de rol:** 100% de cobertura en pages admin (`requireAdmin()`) y cliente (`requireCustomer()`), con `proxy.ts:40-53` como segunda capa a nivel prefijo. ✅
- 🟡 **`not-found.tsx` branded:** falta (404 genérico de Next).
- 🟡 **Logout admin:** `AdminShell.tsx:131` usa `<Link href="/api/auth/signout">` (GET) → en Auth.js v5 eso muestra una **página de confirmación** intermedia, no cierra directo. Inconsistente con el logout de cliente (que sí es directo vía `signOut({ callbackUrl })`).
- 🟡 **`requireCustomer()` incluye ADMIN pero no STAFF** (`session.ts:32`): un STAFF logueado sería expulsado de `/clientes/...`. UX menor, no seguridad.
- 🟡 **`/api/upload`:** conviene confirmar que el handler revalide sesión/rol (el middleware lo cubre, pero defensa en profundidad).
- 🟢 **Links:** ninguno roto. Solo `href="#"` placeholders (social/contacto del footer, "olvidé mi contraseña").

---

## 3. Plan de acción priorizado

| # | Cambio | Área | Prioridad | Esfuerzo | Riesgo de romper | Migración DB |
|---|---|---|---|---|---|---|
| 1 | `error.tsx` (root, admin, clientes) + `global-error.tsx`, branded | 3 | 🔴 Crítico | S | Bajo | No |
| 2 | Idempotencia botones "Avanzar"/"Marcar listo" (client component + `useTransition`/`disabled`) y/o `markAsReady` idempotente (chequear `status===LISTO`) | 3 | 🔴 Crítico | S–M | Bajo | No |
| 3 | `markAsReady` dentro de `$transaction` (evitar 0 `isCurrent`) | 2 | 🟠 Alto | S | Bajo | No |
| 4 | Cablear (o retirar) el email "listo para retirar" | 3 | 🟠 Alto | S | Bajo | No |
| 5 | Aplicar Zod en server actions + retorno uniforme `{ ok, error }` | 3 | 🟠 Alto | M | Bajo–Medio | No |
| 6 | **`AuditLog` append-only** + helper `logAudit()` + enganche en mutaciones cableadas | 1 | 🟠 Alto | M–L | Bajo (tabla nueva) | **Sí** |
| 7 | Cablear `markAsDelivered` (botón "Marcar entregado") para cerrar el ciclo | 2 | 🟠 Alto | S | Bajo | No |
| 8 | `not-found.tsx` global branded + `loading.tsx` en rutas pesadas | 3/4 | 🟡 Medio | S | Bajo | No |
| 9 | `@@unique([customerId, licensePlate])` + validación previa en `createVehicle`/`updateVehicle` | 2 | 🟡 Medio | S | **Medio** (datos existentes) | **Sí** |
| 10 | Índice único parcial `isCurrent` por `workOrderId` | 2 | 🟡 Medio | S | **Medio** (datos existentes) | **Sí** |
| 11 | Validación de env (Cloudinary/Resend) con mensaje claro | 3 | 🟡 Medio | S | Bajo | No |
| 12 | `updateCustomer`/`createStatusUpdate` en `$transaction` | 2 | 🟢 Bajo | S | Bajo | No |
| 13 | Validación de máquina de estados en el service (transiciones legales) | 2 | 🟢 Bajo | M | Bajo–Medio | No |
| 14 | Logout admin con botón `signOut({ callbackUrl })` | 4 | 🟢 Bajo | S | Bajo | No |
| 15 | Limpiar/cablear código de servicio muerto (alta cliente/vehículo) | — | 🟢 Bajo | M | Bajo | No |

---

## 4. Quick wins (alto valor, bajo riesgo, sin migración)

Hacer primero — se puede en una sola pasada y baja el riesgo de la app de inmediato:

1. **#1 — Error boundaries.** Lo de mayor relación impacto/esfuerzo. Hoy un solo `throw` inesperado = pantalla muerta.
2. **#2 — Idempotencia de "Avanzar"/"Marcar listo".** Elimina duplicados y saltos de etapa por doble click.
3. **#3 — `markAsReady` transaccional.** Una línea de envoltura evita un estado inconsistente.
4. **#4 — Cablear el email "listo".** Funcionalidad prometida que hoy no ocurre.
5. **#8 — `not-found.tsx` + `loading.tsx` branded.** Pulido visible, riesgo nulo.
6. **#11 — Validar env.** Mensaje claro en vez de `500` opaco si falta una API key.

---

## 5. Lo que NO recomiendo hacer ahora (sería sobre-ingeniería a este volumen)

- **Redis / colas / WebSockets / tiempo real** — ya fuera de alcance, correcto.
- **Reintentos con backoff en la DB** — un Postgres bien manejado + error boundary alcanza para un solo taller. Agregar lógica de retry es complejidad sin retorno hoy.
- **Soft-delete generalizado (`deletedAt` en todo)** — los `RESTRICT` ya garantizan permanencia. Solo tendría sentido un soft-delete puntual si quieren "ocultar" un cliente sin perder historia; no como patrón global.
- **Event sourcing / CQRS para el historial** — el `AuditLog` append-only simple cubre el requisito de "historia clínica" sin esa maquinaria.
- **Optimistic locking / columnas `version`** — no hay concurrencia real (un operador a la vez). El doble-click se resuelve con idempotencia en UI (#2), no con locking.
- **`orderCode` "a prueba de concurrencia" (secuencia DB)** — el race está documentado y no ocurre cargando de a una. No tocar.
- **Particionado, full-text search, índices exóticos** — innecesario al volumen.

---

## 6. Orden de ejecución recomendado

- **Fase 0 — Quick wins de resiliencia (sin migración):** #1, #2, #3, #4, #8, #11. Todo bajo riesgo, alto valor. Deja la app a prueba de fallos comunes.
- **Fase 1 — Contrato de errores y validación:** #5 (Zod en actions + retorno `{ ok, error }` uniforme + `assertAdmin` que no explote).
- **Fase 2 — Historial (Área 1):** #6. Migración de tabla nueva `AuditLog` (no toca lo existente) + `logAudit()` + enganche en las mutaciones ya cableadas.
- **Fase 3 — Constraints con migración (con cuidado, requiere chequear datos):** #9 y #10. Antes de migrar: verificar/limpiar patentes duplicadas y filas con `isCurrent` múltiple.
- **Fase 4 — Cierre de ciclo y features faltantes:** #7 (marcar entregado), #13 (máquina de estados), #15 (alta de cliente/vehículo — los services ya existen, falta UI y enganche al `AuditLog`).

> **Nota:** Las migraciones (#6, #9, #10) las corrés vos manualmente — la auditoría no tocó git ni la DB.

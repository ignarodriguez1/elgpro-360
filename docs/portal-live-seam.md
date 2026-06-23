# Capa viva del portal — contrato del seam (para el adaptador WS)

> **Qué es:** el portal cliente consume el estado de la orden + un stream de
> actualizaciones a través de **una sola interfaz** (`useOrderLive`). Los
> componentes NO saben si el dato viene de SSR, poll o WebSocket. Este doc es el
> contrato contra el que se enchufa el adaptador WS, **sin tocar componentes**.
>
> **Estado:** Fase 2 implementada y verificada (2026-06-19). Sin animación todavía
> (eso es Fase 4); acá están los rieles.

## Archivos

| Archivo | Rol |
|---|---|
| `src/lib/order-live.ts` | Tipos del contrato + helpers puros (proyección, frescura, tiempo relativo). |
| `src/components/customer/OrderLiveProvider.tsx` | El seam: provider + `useOrderLive`. Semilla SSR, reducer de eventos, estado de conexión. |
| `src/components/customer/ConnectionIndicator.tsx` | Indicador honesto (lee `useOrderLive`). |
| `src/components/customer/CustomerTimeline.tsx` | Puente seam → `Timeline` compartido. |

## La interfaz única

```ts
useOrderLive(): {
  order: CustomerOrderView;              // proyección segura (sin identidad interna)
  updates: CustomerTimelineUpdate[];     // timeline proyectado (sin createdBy)
  connectionState: ConnectionState;      // "live" | "fresh" | "reconnecting" | "offline"
  lastVisibleUpdateAt: string | null;    // ISO — última novedad VISIBLE (frescura honesta)
  dispatch: (event: OrderLiveEvent) => void; // punto de entrada del transporte
}
```

## Eventos que entran (lo que el adaptador WS debe emitir)

```ts
type OrderLiveEvent =
  | { type: "status-added";   update: CustomerTimelineUpdate }
  | { type: "status-updated"; update: CustomerTimelineUpdate }
  | { type: "photo-added";    updateId: string; photo: CustomerTimelinePhoto }
  | { type: "order-changed";  order: Partial<CustomerOrderView> }
  | { type: "connection";     state: ConnectionState };
```

El reducer (en `OrderLiveProvider`) aplica cada evento al estado local:
`status-added` agrega (idempotente por `id`), `status-updated` reemplaza por `id`,
`photo-added` agrega foto al hito, `order-changed` mergea la orden, `connection`
cambia el estado de conexión. `lastVisibleUpdateAt` se recalcula solo.

## Cómo se enchufa el adaptador WS

```ts
const { dispatch } = useOrderLive();
useEffect(() => {
  const ws = openSocket(orderId);
  ws.on("open",    () => dispatch({ type: "connection", state: "live" }));
  ws.on("message", (msg) => dispatch(toOrderLiveEvent(msg)));   // status/photo/order
  ws.on("close",   () => dispatch({ type: "connection", state: "reconnecting" }));
  ws.on("error",   () => dispatch({ type: "connection", state: "offline" }));
  return () => ws.close();
}, [orderId]);
```

El adaptador es lo único nuevo. `Timeline`, `ReadyBanner`, `StageBar`, el indicador
y la página no cambian: ya consumen del seam.

## Estado de conexión — honestidad

- **`fresh`** es el **default de hoy** (SSR ok, sin stream). El indicador muestra
  "Actualizado hace X". **Nunca arranca en `live`** sin transporte real.
- **`live`** solo cuando hay stream activo (lo setea el adaptador WS en `open`).
- **`reconnecting`** / **`offline`**: caída con gracia, muestran la última novedad
  conocida ("Sin conexión · hace 21 min"), nunca fingen vida.
- Motion = actividad real: solo `live` (respira) y `reconnecting` (parpadea) se
  mueven; `fresh` y `offline` quietos.

## Frescura (sin migración)

`lastVisibleUpdateAt` = `MAX(createdAt)` de los updates **visibles al cliente** y
sus fotos (`computeLastVisibleUpdateAt`). **Nunca** `WorkOrder.updatedAt` (grueso,
mentiría). Dependencia de schema futura para "duración por etapa": `reachedAt` (S3)
— NO la necesita esta capa.

## Privacidad — proyección del cliente

`projectUpdateForCustomer` descarta `createdBy` (identidad del staff) y notas
internas **en la frontera de la página**, antes de pasar el dato al provider
cliente. Resultado: el nombre del operario ya **no viaja** al browser del cliente
(verificado: 0 ocurrencias en el flight payload; antes 5). Se resolvió en capa de
display (proyección), **sin tocar el service** — el modo admin sigue mostrando el
autor a propósito.

## Bridge solo-dev (verificación + Fase 4)

Fuera de producción, el provider expone `window.__orderLive`:
- `setConnection(state)` — forzar estados (verificación del indicador honesto).
- `emit(event)` — inyectar un evento falso por el contrato (trigger de la Fase 4).

Se desmonta solo y no existe en prod.

---

# Enchufar el transporte real (WebSocket + Redis)

Arquitectura: **Vercel (app Next)** publica eventos a **Redis**; un **servidor WS
aparte** (proceso vivo) se suscribe a Redis y empuja a los browsers. Vercel
serverless NO sostiene sockets — por eso el WS server es separado.

```
[admin muta] → app Next: redis.publish("order:{id}", OrderLiveEvent)   (corre en Vercel)
                                   │
                       [WS server: SUBSCRIBE order:{id}]   ← proceso vivo, NO Vercel
                                   │ push (JSON OrderLiveEvent)
                       [browser: useOrderSocket → dispatch]   ← YA implementado
```

## Lo que YA está implementado (lado cliente — verificado)

- `useOrderSocket` (`src/components/customer/useOrderSocket.ts`): pide ticket,
  conecta, mapea mensajes a `OrderLiveEvent`, `dispatch`, backoff + reconexión,
  estados `live`/`reconnecting`/`offline`. **Dormido sin `NEXT_PUBLIC_WS_URL`.**
- `GET /api/realtime/ticket?order={id}`: valida sesión + propiedad → ticket firmado
  de 60s. (200 dueño · 403 ajeno · 401 sin sesión — verificado.)
- `GET /api/realtime/snapshot/{orderId}`: snapshot proyectado (sin `createdBy`)
  para reconciliar en reconexión → `dispatch({type:"snapshot", ...})`.

## Variables de entorno

| Var | Dónde | Para qué |
|---|---|---|
| `NEXT_PUBLIC_WS_URL` | app Next (build) | URL del WS server. **Sin esto, el portal queda dormido en `fresh`.** |
| `REDIS_URL` | app Next **y** WS server | pub (Next) / sub (WS server) |
| `AUTH_SECRET` | app Next **y** WS server | firmar (Next) / verificar (WS server) el ticket |

## Lo que falta — lado servidor (a cargo de Valentín)

### 1. Servidor WS (proceso aparte)
- Acepta conexión `wss://…?order={id}&ticket={t}`.
- **Verifica el ticket**: `ticket = base64url(payload).hmacSha256`, con
  `payload = "{orderId}.{userId}.{exp}"`. Recalcular HMAC-SHA256 sobre el `payload`
  decodificado con `AUTH_SECRET`, comparar la firma, chequear `exp > now` y que
  `orderId` coincida con el `?order=` de la conexión. Si falla → cerrar.
- `SUBSCRIBE` Redis `order:{orderId}`; cada mensaje recibido se reenvía **verbatim**
  al socket (ya viene como JSON `OrderLiveEvent`).

### 2. Puntos de publicación (en los services de la app Next) — ✅ HECHO
`src/lib/realtime.ts` → `publishOrderSnapshot(orderId)`: carga la OT, proyecta
(filtra `visibleToCustomer` + `projectUpdateForCustomer`) y publica un
`{type:"snapshot", order, updates}` a `order:{id}`. **Dormido sin `REDIS_URL`**
(no-op), best-effort (nunca rompe la mutación). Cableado en:

| Mutación | Archivo |
|---|---|
| `advanceToNextStep` | `work-order.service.ts` |
| `markStepAsCurrent` | `work-order.service.ts` |
| `markAsReady` | `work-order.service.ts` |
| `markAsDelivered` | `work-order.service.ts` |
| `createStatusUpdate` | `status-update.service.ts` |
| `createWorkOrderPhoto` (si va a un hito) | `upload.service.ts` |

**Por qué snapshot y no eventos granulares:** simple y a prueba de balas — el
cliente recibe la verdad completa y la presencia de Fase 4 se dispara sola al
detectar el hito nuevo en el snapshot (diff por id). Idempotente.

> Lo único que falta del lado server: el **proceso WS aparte** (sección 1) y los
> **3 env vars**. Apenas estén, el círculo se cierra y el portal pasa a vivo real.

## Forma del mensaje en el cable
Es exactamente un **`OrderLiveEvent` en JSON** (ver arriba). El WS server no lo
transforma: publish proyectado → reenvío verbatim → `dispatch`. Idempotente:
`status-added` deduplica por `id`, seguro ante replays de reconexión.

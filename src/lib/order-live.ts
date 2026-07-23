/* ============================================================
   CONTRATO DE LA CAPA VIVA DEL PORTAL (seam transporte-agnóstico)

   El portal consume el estado de la orden + un stream de
   actualizaciones a través de UNA sola interfaz (`useOrderLive`).
   La capa de componentes NO sabe si el dato viene de:
     - SSR inicial (hoy, semilla),
     - un poll liviano,
     - un WebSocket (mañana — el adaptador WS se enchufa contra
       este mismo contrato sin tocar componentes).

   Honestidad: los timestamps de "frescura" salen de la última
   NOVEDAD VISIBLE al cliente (MAX createdAt de updates visibles +
   sus fotos), nunca de WorkOrder.updatedAt.

   Privacidad: la proyección del cliente OMITE la identidad del
   staff (createdBy) y las notas internas. El nombre del operario
   nunca viaja al browser del cliente (cierra el leak del flight
   payload del Timeline "use client").
   ============================================================ */

import type { WorkOrderStatus, OrderStage } from "@/generated/prisma/client";

/** Estado de conexión HONESTO. El indicador refleja esto, nunca finge. */
export type ConnectionState =
  | "live" // stream activo, recibiendo en vivo
  | "fresh" // datos frescos (SSR/última carga ok), SIN stream activo — default hoy
  | "reconnecting" // intentando (re)establecer el stream
  | "offline"; // sin conexión

/** Foto proyectada para el cliente. Incluye createdAt (define frescura). */
export interface CustomerTimelinePhoto {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  createdAt: string; // ISO
}

/** Update del timeline ya proyectado para el cliente: SIN createdBy ni notas internas. */
export interface CustomerTimelineUpdate {
  id: string;
  title: string;
  description?: string | null;
  stage?: OrderStage | null;
  visibleToCustomer: boolean;
  isCurrent: boolean;
  confirmed?: boolean;
  createdAt: string; // ISO
  photos?: CustomerTimelinePhoto[];
}

/** Proyección segura de la orden para el cliente (sin identidad interna). */
export interface CustomerOrderView {
  id: string;
  status: WorkOrderStatus;
  stage: OrderStage;
  title?: string | null;
}

/* --- Eventos que entran por el seam (forma que el adaptador WS debe emitir) --- */

export type OrderLiveEvent =
  /** Nuevo hito agregado al timeline. */
  | { type: "status-added"; update: CustomerTimelineUpdate }
  /** Hito existente actualizado (texto, isCurrent, confirmed). */
  | { type: "status-updated"; update: CustomerTimelineUpdate }
  /** Foto nueva sobre un hito existente. */
  | { type: "photo-added"; updateId: string; photo: CustomerTimelinePhoto }
  /** Cambio de estado macro de la orden (p.ej. PROCESO → LISTO). */
  | { type: "order-changed"; order: Partial<CustomerOrderView> }
  /** Reemplazo completo del estado (reconciliación en (re)conexión). */
  | { type: "snapshot"; order: CustomerOrderView; updates: CustomerTimelineUpdate[] }
  /** Cambio de estado de conexión (lo emite el transporte). */
  | { type: "connection"; state: ConnectionState };

/* --- Forma cruda que devuelve el service (con identidad interna) --- */

interface RawUpdate {
  id: string;
  title: string;
  description?: string | null;
  stage?: OrderStage | null;
  visibleToCustomer: boolean;
  isCurrent: boolean;
  confirmed?: boolean;
  createdAt: Date | string;
  photos?: {
    id: string;
    imageUrl: string;
    thumbnailUrl?: string | null;
    caption?: string | null;
    /** Flag por-foto. Ausente en payloads viejos → se trata como visible. */
    visibleToCustomer?: boolean;
    createdAt: Date | string;
  }[];
  // createdBy / internalDescription existen en el crudo pero NO se proyectan.
}

/** Proyecta un update crudo a la forma segura del cliente (descarta createdBy/internos). */
export function projectUpdateForCustomer(u: RawUpdate): CustomerTimelineUpdate {
  return {
    id: u.id,
    title: u.title,
    description: u.description ?? null,
    stage: u.stage ?? null,
    visibleToCustomer: u.visibleToCustomer,
    isCurrent: u.isCurrent,
    confirmed: u.confirmed,
    createdAt: new Date(u.createdAt).toISOString(),
    // Brecha #3 del informe: el flag por-foto no se filtraba en NINGÚN camino
    // al cliente. La proyección es "para el cliente" por definición → filtra acá
    // (cubre seed SSR, snapshot API y realtime de una vez).
    photos: u.photos
      ?.filter((p) => p.visibleToCustomer !== false)
      .map((p) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        thumbnailUrl: p.thumbnailUrl ?? null,
        caption: p.caption ?? null,
        createdAt: new Date(p.createdAt).toISOString(),
      })),
  };
}

/**
 * Última novedad VISIBLE al cliente: MAX(createdAt) sobre updates visibles
 * y sus fotos. Base honesta de "actualizado hace X". Devuelve ISO o null.
 */
export function computeLastVisibleUpdateAt(
  updates: CustomerTimelineUpdate[]
): string | null {
  let max = 0;
  for (const u of updates) {
    if (!u.visibleToCustomer) continue;
    const t = new Date(u.createdAt).getTime();
    if (t > max) max = t;
    for (const p of u.photos ?? []) {
      const pt = new Date(p.createdAt).getTime();
      if (pt > max) max = pt;
    }
  }
  return max ? new Date(max).toISOString() : null;
}

/** "hace 5 min" / "hace 2 h" / "recién". CLIENT-ONLY (usa now → computar post-mount). */
export function relativeFromNow(iso: string, now: number = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

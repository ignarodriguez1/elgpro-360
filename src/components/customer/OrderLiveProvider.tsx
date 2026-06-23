"use client";

/* ============================================================
   OrderLiveProvider — el SEAM de la capa viva.

   Toma el estado SSR como semilla y expone una sola interfaz
   `{ order, updates, connectionState, lastVisibleUpdateAt, dispatch }`.
   Los componentes consumen de acá vía `useOrderLive()` y NO saben
   de dónde viene el dato (SSR / poll / WebSocket).

   Hoy: semilla SSR, connectionState = "fresh" (honesto: datos
   frescos, sin stream). Mañana: el adaptador WS llama `dispatch`
   con OrderLiveEvent contra este mismo contrato.

   Fase 2 NO anima: `dispatch` actualiza el dato y el árbol
   re-renderiza. La PRESENCIA de evento (animación) es Fase 4.
   ============================================================ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  computeLastVisibleUpdateAt,
  type ConnectionState,
  type CustomerOrderView,
  type CustomerTimelineUpdate,
  type OrderLiveEvent,
} from "@/lib/order-live";
import { useOrderSocket } from "./useOrderSocket";

interface LiveState {
  order: CustomerOrderView;
  updates: CustomerTimelineUpdate[];
  connectionState: ConnectionState;
}

function reducer(state: LiveState, event: OrderLiveEvent): LiveState {
  switch (event.type) {
    case "connection":
      if (event.state === state.connectionState) return state;
      return { ...state, connectionState: event.state };

    case "status-added": {
      if (state.updates.some((u) => u.id === event.update.id)) return state;
      return { ...state, updates: [...state.updates, event.update] };
    }

    case "status-updated":
      return {
        ...state,
        updates: state.updates.map((u) =>
          u.id === event.update.id ? event.update : u
        ),
      };

    case "photo-added":
      return {
        ...state,
        updates: state.updates.map((u) =>
          u.id === event.updateId
            ? { ...u, photos: [...(u.photos ?? []), event.photo] }
            : u
        ),
      };

    case "order-changed":
      return { ...state, order: { ...state.order, ...event.order } };

    case "snapshot":
      // Reconciliación: reemplaza estado tras (re)conexión. Conserva connectionState.
      return { ...state, order: event.order, updates: event.updates };

    default:
      return state;
  }
}

interface OrderLiveValue extends LiveState {
  /** ISO de la última novedad visible (frescura honesta) o null. */
  lastVisibleUpdateAt: string | null;
  /** IDs de hitos que LLEGARON post-mount (por el seam) — presencia de evento (Fase 4).
   *  Transitorio: cada id se limpia tras la animación. NO incluye los de la carga inicial. */
  arrivedIds: string[];
  /** Punto de entrada del transporte (WS / poll / trigger dev). */
  dispatch: (event: OrderLiveEvent) => void;
  /** Refresh honesto explícito (pull-to-refresh): re-consulta el snapshot ya. */
  refresh: () => void;
}

const OrderLiveContext = createContext<OrderLiveValue | null>(null);

export function OrderLiveProvider({
  initialOrder,
  initialUpdates,
  children,
}: {
  initialOrder: CustomerOrderView;
  initialUpdates: CustomerTimelineUpdate[];
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, {
    order: initialOrder,
    updates: initialUpdates,
    // Honesto: arrancamos "fresh" (SSR ok, sin stream). NUNCA "live" sin transporte.
    connectionState: "fresh",
  });

  const lastVisibleUpdateAt = useMemo(
    () => computeLastVisibleUpdateAt(state.updates),
    [state.updates]
  );

  // Detecta hitos que LLEGARON post-mount (por el seam) para la presencia de Fase 4.
  // Los de la semilla SSR ya están "vistos" → no disparan presencia. Cada arribo se
  // marca ~2.2s (lo que dura la animación) y se limpia solo.
  const seenRef = useRef<Set<string>>(new Set(initialUpdates.map((u) => u.id)));
  const [arrivedIds, setArrivedIds] = useState<string[]>([]);
  useEffect(() => {
    const fresh = state.updates
      .filter((u) => !seenRef.current.has(u.id))
      .map((u) => u.id);
    if (fresh.length === 0) return;
    fresh.forEach((id) => seenRef.current.add(id));
    setArrivedIds((prev) => [...prev, ...fresh]);
    const t = setTimeout(
      () => setArrivedIds((prev) => prev.filter((id) => !fresh.includes(id))),
      2200
    );
    return () => clearTimeout(t);
  }, [state.updates]);

  // Puente solo-dev para verificación (forzar caída de conexión) y para el
  // trigger de evento falso de la Fase 4. Fuera de producción.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __orderLive?: unknown };
    w.__orderLive = {
      setConnection: (s: ConnectionState) =>
        dispatch({ type: "connection", state: s }),
      emit: (e: OrderLiveEvent) => dispatch(e),
    };
    return () => {
      delete w.__orderLive;
    };
  }, []);

  // Reconciliación tras (re)conexión: refetch del snapshot proyectado.
  const reconcile = useCallback(async () => {
    try {
      const res = await fetch(`/api/realtime/snapshot/${initialOrder.id}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) return;
      const snap = (await res.json()) as {
        order: CustomerOrderView;
        updates: CustomerTimelineUpdate[];
      };
      dispatch({ type: "snapshot", order: snap.order, updates: snap.updates });
    } catch {
      /* sin red: el indicador ya refleja el estado real */
    }
  }, [initialOrder.id]);

  // Adaptador del transporte real (WebSocket). Dormido sin NEXT_PUBLIC_WS_URL.
  useOrderSocket({ orderId: initialOrder.id, dispatch, reconcile });

  // REFRESH HONESTO (sin WS, es UX): revalidar de verdad cuando el cliente vuelve
  // a la app (foco / visibilidad). Re-consulta el snapshot; si hay novedad, la
  // presencia (arrivedIds) dispara sola. Anti-spam: máximo 1 cada 8s.
  const lastRefresh = useRef(0);
  const revalidate = useCallback(() => {
    const now = Date.now();
    if (now - lastRefresh.current < 8000) return;
    lastRefresh.current = now;
    reconcile();
  }, [reconcile]);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") revalidate();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", revalidate);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", revalidate);
    };
  }, [revalidate]);

  const value = useMemo<OrderLiveValue>(
    () => ({ ...state, lastVisibleUpdateAt, arrivedIds, dispatch, refresh: reconcile }),
    [state, lastVisibleUpdateAt, arrivedIds, reconcile]
  );

  return (
    <OrderLiveContext.Provider value={value}>
      {children}
    </OrderLiveContext.Provider>
  );
}

export function useOrderLive(): OrderLiveValue {
  const ctx = useContext(OrderLiveContext);
  if (!ctx) {
    throw new Error("useOrderLive debe usarse dentro de <OrderLiveProvider>");
  }
  return ctx;
}

/** Versión tolerante: null si no hay provider (p.ej. vehículo sin orden activa). */
export function useOrderLiveOptional(): OrderLiveValue | null {
  return useContext(OrderLiveContext);
}

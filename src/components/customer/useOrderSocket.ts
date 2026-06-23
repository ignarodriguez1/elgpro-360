"use client";

/* ============================================================
   useOrderSocket — adaptador WebSocket contra el seam.

   Es lo ÚNICO nuevo del lado cliente para enchufar el transporte
   real. No reemplaza nada: solo alimenta `dispatch` con eventos
   `OrderLiveEvent` y refleja el estado de conexión honesto.

   DORMIDO por defecto: sin `NEXT_PUBLIC_WS_URL` no conecta y el
   portal queda en "fresh" (datos SSR frescos, sin stream). Se
   activa solo cuando se configura el env.

   Flujo:
     1. pide un ticket de corta vida a /api/realtime/ticket
        (el server Next valida sesión + propiedad de la OT),
     2. conecta a NEXT_PUBLIC_WS_URL?order=..&ticket=..,
     3. open  → connection:live (+ snapshot si reconectó),
        message→ dispatch(evento),
        close  → reconnecting → offline, con backoff exponencial.

   El servidor WS (proceso aparte) valida el ticket con AUTH_SECRET,
   se suscribe a Redis `order:{id}` y reenvía los OrderLiveEvent.
   ============================================================ */

import { useEffect, useRef } from "react";
import type { OrderLiveEvent } from "@/lib/order-live";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

interface UseOrderSocketArgs {
  orderId: string;
  dispatch: (event: OrderLiveEvent) => void;
  /** Refetch del snapshot para reconciliar lo perdido tras una reconexión. */
  reconcile: () => void;
}

export function useOrderSocket({ orderId, dispatch, reconcile }: UseOrderSocketArgs) {
  // callbacks en refs → el efecto depende solo de orderId (no reconecta de más)
  const dispatchRef = useRef(dispatch);
  const reconcileRef = useRef(reconcile);
  dispatchRef.current = dispatch;
  reconcileRef.current = reconcile;

  useEffect(() => {
    if (!WS_URL) return; // sin transporte configurado → portal en "fresh", todo OK

    let ws: WebSocket | null = null;
    let retries = 0;
    let stopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = async () => {
      if (stopped) return;

      let ticket: string;
      try {
        const res = await fetch(`/api/realtime/ticket?order=${encodeURIComponent(orderId)}`, {
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error("ticket denegado");
        ticket = (await res.json()).ticket;
      } catch {
        dispatchRef.current({ type: "connection", state: "offline" });
        return;
      }
      if (stopped) return;

      ws = new WebSocket(
        `${WS_URL}?order=${encodeURIComponent(orderId)}&ticket=${encodeURIComponent(ticket)}`
      );

      ws.onopen = () => {
        const reconnected = retries > 0;
        retries = 0;
        dispatchRef.current({ type: "connection", state: "live" });
        if (reconnected) reconcileRef.current(); // reconciliar lo que se perdió
      };

      ws.onmessage = (ev) => {
        try {
          dispatchRef.current(JSON.parse(ev.data) as OrderLiveEvent);
        } catch {
          /* frame malformado: ignorar */
        }
      };

      ws.onclose = () => {
        if (stopped) return;
        retries += 1;
        dispatchRef.current({
          type: "connection",
          state: retries > 5 ? "offline" : "reconnecting",
        });
        const backoff = Math.min(1000 * 2 ** retries, 15000);
        reconnectTimer = setTimeout(connect, backoff);
      };

      ws.onerror = () => ws?.close();
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [orderId]);
}

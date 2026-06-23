"use client";

/* ============================================================
   CustomerTimeline — puente entre el seam y el Timeline compartido.

   Lee `updates` + `order` del seam (ya proyectados, SIN createdBy)
   y los pasa al Timeline puro. Así el Timeline consume del stream
   sin acoplarse al transporte, y el nombre del staff nunca llega
   al cliente. En `panel` (desktop) inyecta el indicador de conexión
   en el header del Timeline vía `liveSlot`.
   ============================================================ */

import { Timeline, type TimelineVariant } from "@/components/shared/Timeline";
import { useOrderLive } from "./OrderLiveProvider";
import { ConnectionIndicator } from "./ConnectionIndicator";

export function CustomerTimeline({ variant = "feed" }: { variant?: TimelineVariant }) {
  const { order, updates, arrivedIds } = useOrderLive();
  return (
    <Timeline
      updates={updates}
      mode="customer"
      variant={variant}
      orderStatus={order.status}
      arrivedIds={arrivedIds}
      liveSlot={variant === "panel" ? <ConnectionIndicator /> : undefined}
    />
  );
}

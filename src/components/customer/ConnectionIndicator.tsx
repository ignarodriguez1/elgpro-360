"use client";

/* ============================================================
   ConnectionIndicator — dice la VERDAD sobre la conexión.

   4 estados, motion = actividad real (solo live/reconnecting se
   mueven; fresh/offline quietos). Reemplaza el punto verde que
   latía infinito sin nada atrás. Peso sin ruido, nunca grita.

   Jerarquía con "actualizado hace X":
     - fresh   → "Actualizado hace X" (el dato es el mensaje)
     - live    → "En vivo" (la frescura es implícita)
     - recon   → "Reconectando"
     - offline → "Sin conexión · última novedad hace X"
   ============================================================ */

import { useEffect, useState } from "react";
import { relativeFromNow, type ConnectionState } from "@/lib/order-live";
import { useOrderLive } from "./OrderLiveProvider";

const META: Record<ConnectionState, { label: string; cls: string }> = {
  live: { label: "En vivo", cls: "ci-live" },
  fresh: { label: "Actualizado", cls: "ci-fresh" },
  reconnecting: { label: "Reconectando", cls: "ci-recon" },
  offline: { label: "Sin conexión", cls: "ci-off" },
};

export function ConnectionIndicator() {
  const { connectionState, lastVisibleUpdateAt } = useOrderLive();

  // "hace X" + recencia son client-only (dependen de now) → post-mount para no
  // romper la hidratación, refrescados cada 30s (reloj relativo vivo).
  const [rel, setRel] = useState<string | null>(null);
  const [recent, setRecent] = useState(false);
  useEffect(() => {
    if (!lastVisibleUpdateAt) {
      setRel(null);
      setRecent(false);
      return;
    }
    const tick = () => {
      setRel(relativeFromNow(lastVisibleUpdateAt));
      // RECIENTE = última novedad hace < 10 min. Único caso donde un latido leve
      // es honesto (el dato ES reciente). Viejo → calmo, sin latir.
      setRecent(Date.now() - new Date(lastVisibleUpdateAt).getTime() < 10 * 60_000);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [lastVisibleUpdateAt]);

  const meta = META[connectionState];
  const cls =
    `ci ${meta.cls}` +
    (connectionState === "fresh" && recent ? " ci-recent" : "");

  let text = meta.label;
  if (connectionState === "fresh" && rel) text = `Actualizado ${rel}`;
  else if (connectionState === "offline" && rel) text = `Sin conexión · ${rel}`;

  return (
    <span className={cls} data-state={connectionState} role="status" aria-live="polite">
      <span className="ci-dot" aria-hidden="true" />
      <span className="ci-label">{text}</span>
    </span>
  );
}

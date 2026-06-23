"use client";

/* ============================================================
   PullToRefresh — refresh honesto por gesto (mobile).

   Tirar hacia abajo desde el tope → re-consulta REAL (el `refresh`
   del seam = fetch del snapshot proyectado). Si hay novedad, la
   presencia (arrivedIds) dispara sola. Si no, solo se actualiza la
   frescura. NO es transporte: es un fetch por gesto, sin WS.

   El contenido sigue al dedo (con damping); al soltar pasado el
   umbral, gira el spinner hasta que la consulta termina. Solo
   actúa cuando el scroll está en el tope.
   ============================================================ */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/shared/Icon";
import { useOrderLiveOptional } from "./OrderLiveProvider";

const THRESHOLD = 70;
const MAX = 100;

export function PullToRefresh({ children }: { children: ReactNode }) {
  const refresh = useOrderLiveOptional()?.refresh;
  const ref = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const doRefresh = refresh;
    if (!el || !doRefresh) return;

    const atTop = () =>
      (window.scrollY || document.documentElement.scrollTop || 0) <= 0;

    const onStart = (e: TouchEvent) => {
      if (refreshing || !atTop()) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
      setDragging(true);
    };
    const onMove = (e: TouchEvent) => {
      if (startY.current == null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        pullRef.current = 0;
        setPull(0);
        return;
      }
      e.preventDefault(); // bloquea el overscroll nativo mientras se tira
      const damped = Math.min(MAX, dy * 0.5);
      pullRef.current = damped;
      setPull(damped);
    };
    const onEnd = async () => {
      if (startY.current == null) return;
      startY.current = null;
      setDragging(false);
      if (pullRef.current >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPull(THRESHOLD);
        try {
          await doRefresh();
        } finally {
          setRefreshing(false);
          pullRef.current = 0;
          setPull(0);
        }
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [refreshing, refresh]);

  const progress = Math.min(1, pull / THRESHOLD);

  // Sin orden activa (sin provider) → passthrough, sin gesto.
  if (!refresh) return <>{children}</>;

  return (
    <div ref={ref} className="ptr">
      <div
        className={"ptr-ind" + (refreshing ? " ptr-spin" : "")}
        style={{ height: pull, opacity: progress }}
        aria-hidden="true"
      >
        <Icon
          name="arrow"
          size={18}
          style={{ transform: `rotate(${refreshing ? 0 : 90 + progress * 180}deg)` }}
        />
      </div>
      <div
        className="ptr-body"
        style={{
          transform: `translateY(${pull}px)`,
          transition: dragging ? "none" : "transform .32s cubic-bezier(.23,1,.32,1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  /** scrollY a partir del cual el header pasa a estado "scrolled" (frosted). */
  scrolledAt?: number;
  /** Cerca del top nunca se oculta (px). */
  revealNear?: number;
  /** Umbral de delta para evitar jitter al cambiar de dirección (px). */
  threshold?: number;
};

/**
 * Estado del header ligado al scroll, compartido por el chrome desktop y mobile.
 *
 * Performance: un único listener `scroll` pasivo, throttleado por rAF. Lee
 * `scrollY` una sola vez por frame y NO lee layout — cero forced reflow. Devuelve
 * dos flags que el CSS traduce a `transform`/`backdrop` (compositor, off-main).
 *
 * - `scrolled`: pasó el umbral → fondo frosted.
 * - `hidden`: bajando (reveal-on-scroll-up / hide-on-scroll-down); nunca cerca del top.
 */
export function useHeaderScroll({ scrolledAt = 10, revealNear = 80, threshold = 6 }: Options = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      setScrolled(y > scrolledAt);
      const delta = y - lastY.current;
      if (y < revealNear) setHidden(false);
      else if (delta > threshold) setHidden(true);
      else if (delta < -threshold) setHidden(false);
      lastY.current = y;
      ticking.current = false;
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrolledAt, revealNear, threshold]);

  return { scrolled, hidden };
}

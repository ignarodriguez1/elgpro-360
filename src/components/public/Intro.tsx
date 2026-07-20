"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { INTRO_SEEN_KEY } from "./intro-preload";

const MIN_VISIBLE = 1400; // piso para que el reveal de marca SE VEA, no un flash
const OUT_MS = 650; // duración del lift de salida (coincide con la transición CSS)

// El pre-script bloqueante que decide si saltear la intro (antes del paint) vive
// en el layout público como <script> inline de un Server Component — ver
// intro-preload.ts. Acá solo va la lógica de React del overlay.

/**
 * Intro de marca: solo en el home, una vez por sesión.
 *
 * - Atado a la carga con un piso visible (MIN_VISIBLE) para que el momento de
 *   marca se aprecie; luego levanta para descubrir el hero.
 * - `sessionStorage` evita repetirlo en navegaciones internas de la sesión.
 * - `prefers-reduced-motion` lo saltea (no es una espera con un logo quieto).
 * - El estado de React arranca siempre en "in" (consistente SSR/cliente, sin
 *   hydration mismatch); el ocultado real lo hace el CSS vía `.intro-skip`.
 */
export function Intro() {
  const [phase, setPhase] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    const markDone = () => document.documentElement.classList.add("intro-skip");

    let reduce = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {}

    let seen = false;
    try {
      seen = !!sessionStorage.getItem(INTRO_SEEN_KEY);
    } catch {}

    if (reduce || seen) {
      markDone();
      setPhase("done");
      return;
    }

    const start = performance.now();
    let outTimer = 0;
    let doneTimer = 0;
    let onLoad: (() => void) | null = null;

    const finish = () => {
      try {
        sessionStorage.setItem(INTRO_SEEN_KEY, "1");
      } catch {}
      // El telón empieza a levantar → avisar al hero que entre coreografiado.
      (window as { __elgIntro?: number }).__elgIntro = 0;
      window.dispatchEvent(new Event("elg:intro-done"));
      setPhase("out");
      doneTimer = window.setTimeout(() => {
        markDone();
        setPhase("done");
      }, OUT_MS);
    };

    const schedule = () => {
      const wait = Math.max(0, MIN_VISIBLE - (performance.now() - start));
      outTimer = window.setTimeout(finish, wait);
    };

    // Esperar a que la página esté lista Y a que pase el piso visible.
    if (document.readyState === "complete") {
      schedule();
    } else {
      onLoad = schedule;
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      window.clearTimeout(outTimer);
      window.clearTimeout(doneTimer);
      if (onLoad) window.removeEventListener("load", onLoad);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div className={"intro" + (phase === "out" ? " intro-out" : "")} aria-hidden="true">
      <div className="intro-inner">
        <Logo size={46} tagline center />
        <span className="intro-line" />
      </div>
    </div>
  );
}

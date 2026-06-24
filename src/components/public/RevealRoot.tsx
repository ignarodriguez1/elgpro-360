"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Revelado on-scroll para TODO el sitio público (ambos árboles + footer).
 *
 * Los elementos `.drise` / `.rise` nacen ocultos (opacity:0 + translateY) y este
 * componente les agrega `.in` cuando entran al viewport, disparando la transición
 * con el `transition-delay` que cada uno ya trae (coreografía escalonada).
 *
 * Estrategia:
 *  - `sweep()` revela lo que ya está en viewport (o en el árbol oculto del layout
 *    dual) y manda a observar lo que está por debajo del fold.
 *  - IntersectionObserver dispara el reveal real al scrollear.
 *  - MutationObserver (con rAF) re-corre `sweep()` cuando cambia el DOM: cubre los
 *    filtros de Trabajos/Tutoriales, que reposicionan/reinyectan cards en pantalla
 *    sin cambiar de ruta (el IO no dispara fiable en un reflow por layout).
 *  - Re-escanea al cambiar de ruta (App Router no desmonta el layout).
 *  - prefers-reduced-motion / sin IO: revela todo de una. Nunca deja nada oculto.
 */
export function RevealRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const reveal = (el: Element) => el.classList.add("in");
    const collect = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          ".dweb .drise:not(.in), .dweb .rise:not(.in)"
        )
      );

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || typeof IntersectionObserver === "undefined") {
      collect().forEach(reveal);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    const inView = (el: HTMLElement) => {
      // Árbol oculto (.only-* en display:none): offsetParent null → tratar como
      // "a revelar" para que al cruzar el breakpoint por resize esté visible.
      if (el.offsetParent === null) return true;
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };

    // Revela lo visible ya; observa lo de abajo. io.observe es idempotente.
    const sweep = () =>
      collect().forEach((el) => (inView(el) ? reveal(el) : io.observe(el)));

    // Si el intro de marca está tapando el viewport (primer ingreso al home), NO
    // revelar lo in-view todavía: que el hero entre coreografiado cuando el telón
    // levante (evento "elg:intro-done"). Lo de abajo del fold se observa igual.
    const introActive =
      typeof window !== "undefined" && (window as { __elgIntro?: number }).__elgIntro === 1;
    let onIntroDone: (() => void) | null = null;
    let introTimer = 0;
    if (introActive) {
      collect().forEach((el) => {
        if (!inView(el)) io.observe(el);
      });
      onIntroDone = () => sweep();
      window.addEventListener("elg:intro-done", onIntroDone, { once: true });
      introTimer = window.setTimeout(sweep, 3000); // red de seguridad si el intro no avisa
    } else {
      sweep();
    }

    // Cambios de DOM sin cambio de ruta (filtros que re-renderizan la grilla).
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        sweep();
      });
    };
    const root = document.querySelector(".dweb");
    const mo = new MutationObserver(schedule);
    if (root) mo.observe(root, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (onIntroDone) window.removeEventListener("elg:intro-done", onIntroDone);
      if (introTimer) window.clearTimeout(introTimer);
    };
  }, [pathname]);

  return <>{children}</>;
}

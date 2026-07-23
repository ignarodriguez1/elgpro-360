"use client";

import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/shared/Photo";
import { Icon } from "@/components/shared/Icon";
import type { GalleryWork } from "@/lib/portfolio";

const nn = (n: number) => String(n).padStart(2, "0");
const FALLBACK_DESC = "Trabajo realizado íntegramente en taller, documentado paso a paso.";

/**
 * Galería "pila de archivo" (scroll stacking) del portfolio del home.
 *
 * DB-driven: recibe `works` (PortfolioWork visibles, ya acotados a un máximo por el
 * server) — la MISMA fuente que /trabajos. No hay data fija: refleja el ABM del admin.
 *
 * Reparto de técnica (para no gastar la vara de 60fps):
 * - APILADO: `position:sticky` con `top` escalonado → CSS puro.
 * - REVELADO (fade + zoom): CSS scroll-driven `view()` en .wstack-inner → 0 JS.
 * - PROFUNDIDAD por cobertura: un único listener de scroll rAF-throttled (read-all →
 *   write-all) que escribe transform/opacity DIRECTO (no vía CSS var → Emil).
 *
 * Click en una card → abre el mismo lightbox antes/después de /trabajos (reusa sus
 * clases; `variant` elige el árbol). Sin JS: la pila y el revelado siguen; solo se
 * pierde la profundidad. `variant` porque este componente vive en los DOS árboles.
 */
export function WorkStack({ variant, works }: { variant: "desktop" | "mobile"; works: GalleryWork[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lbRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null); // la card que abrió, para restaurar el foco
  const [lb, setLb] = useState<number | null>(null);
  const [side, setSide] = useState<"antes" | "despues">("despues");

  // --- profundidad por cobertura (rAF) ---
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cards = Array.from(root.querySelectorAll<HTMLElement>(".wstack-card"));
    const shades = cards.map((c) => c.querySelector<HTMLElement>(".wstack-shade"));
    let raf = 0;
    const smooth = (t: number) => t * t * (3 - 2 * t);

    const update = () => {
      raf = 0;
      if (root.offsetParent === null) return; // árbol oculto (dual-DOM)
      // Early-out barato: si la pila no está cerca del viewport, ni calculamos.
      // Así el handler no cuesta nada durante el resto del scroll del home (largo).
      const rr = root.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rr.bottom < -100 || rr.top > vh + 100) return;
      const tops = cards.map((c) => c.getBoundingClientRect().top);
      // offsetHeight = alto de LAYOUT (no el transformado): evita que el propio
      // scale que escribimos abajo contamine el denominador de las demás.
      const h = cards[0]?.offsetHeight || 1;
      for (let i = 0; i < cards.length; i++) {
        const next = tops[i + 1];
        let cover = 0;
        if (next !== undefined) cover = smooth(Math.min(1, Math.max(0, (tops[i] + h - next) / h)));
        // Además de oscurecer + encoger, la card tapada se HUNDE unos px: eso crea
        // el diferencial de profundidad que hace leer la pila como copias físicas.
        cards[i].style.transform = cover > 0
          ? `translate3d(0,${(cover * 7).toFixed(1)}px,0) scale(${(1 - cover * 0.06).toFixed(4)})`
          : "";
        const sh = shades[i];
        if (sh) sh.style.opacity = (cover * 0.5).toFixed(3);
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };

    let attached = false;
    const attach = () => {
      if (attached || reduce.matches) return;
      attached = true;
      // will-change gestionado acá (no en CSS estático): solo promueve las capas
      // mientras el efecto está activo, no toda la vida de la página.
      cards.forEach((c) => { c.style.willChange = "transform"; });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      update();
    };
    const detach = () => {
      if (!attached) return;
      attached = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      cards.forEach((c, i) => { c.style.transform = ""; c.style.willChange = ""; if (shades[i]) shades[i]!.style.opacity = ""; });
    };
    const sync = () => (reduce.matches ? detach() : attach());
    sync();
    reduce.addEventListener("change", sync);
    return () => { reduce.removeEventListener("change", sync); detach(); };
  }, [works.length]);

  // --- lightbox = diálogo modal: foco adentro, trap, scroll-lock, restore ---
  // Keyeado en isOpen (no en lb): así prev/next NO re-disparan el lock ni el foco.
  const isOpen = lb !== null;
  useEffect(() => {
    if (!isOpen) return;
    const inner = lbRef.current;

    const focusables = () =>
      inner
        ? Array.from(inner.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null)
        : [];
    const raf = requestAnimationFrame(() => (focusables()[0] ?? inner)?.focus({ preventScroll: true }));

    // scroll-lock que preserva la posición (misma técnica que el menú mobile).
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); setLb(null); return; }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (i === -1) { e.preventDefault(); (e.shiftKey ? items[items.length - 1] : items[0]).focus(); return; }
      if (e.shiftKey && i === 0) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  const open = (i: number, el: HTMLElement) => { triggerRef.current = el; setSide("despues"); setLb(i); };
  const close = () => setLb(null);
  const go = (d: number) => { if (lb === null || works.length === 0) return; setSide("despues"); setLb((lb + d + works.length) % works.length); };
  const w = lb !== null ? works[lb] : null;
  // SIN fallback al "después" cuando falta el "antes": mostrar el resultado
  // etiquetado "Antes" es mentirle al visitante (principio de honestidad).
  // Igual que /trabajos: placeholder con la etiqueta "Estado de ingreso".
  const sideImg = (wk: GalleryWork) => (side === "antes" ? wk.beforeImageUrl : wk.afterImageUrl) ?? undefined;
  const lbTint = w ? (side === "antes" ? "rgba(120,120,120,.18)" : (w.tint ?? undefined)) : undefined;
  const lbLabel = side === "antes" ? "Estado de ingreso" : "Resultado final";

  return (
    <>
      <div className="wstack" ref={rootRef}>
        {works.map((wk, i) => (
          <button
            key={wk.id}
            type="button"
            className="wstack-card"
            style={{ ["--i" as string]: i, zIndex: i + 1 }}
            onClick={(e) => open(i, e.currentTarget)}
            aria-label={`${wk.title} — ver antes y después`}
          >
            <span className="wstack-inner">
              <Photo src={wk.afterImageUrl ?? undefined} className="wstack-photo" tint={wk.tint ?? undefined} />
              <span className="wstack-grad" />
              <span className="wstack-shade" aria-hidden="true" />
              <span className="wstack-count mono">{nn(i + 1)} / {nn(works.length)}</span>
              <span className="wstack-meta">
                <span className="wstack-cat">{wk.category}</span>
                <span className="wstack-title">{wk.title}</span>
              </span>
              <span className="wstack-go"><Icon name="swap" size={17} /></span>
            </span>
          </button>
        ))}
      </div>

      {w && variant === "desktop" && (
        <div className="dlightbox" onClick={close} role="dialog" aria-modal="true" aria-label={w.title}>
          <div className="dlb-inner" ref={lbRef} onClick={(e) => e.stopPropagation()}>
            <button className="dlb-close" onClick={close} aria-label="Cerrar"><Icon name="close" size={22} /></button>
            <div className="dlb-stage">
              <Photo key={side} src={sideImg(w)} className="dlb-photo" tint={lbTint} label={lbLabel} alt={`${w.title} — ${lbLabel}`} />
              <span className={"dlb-tag " + side}>{side === "antes" ? "Antes" : "Después"}</span>
              <button className="dlb-nav dlb-prev" onClick={() => go(-1)} aria-label="Anterior"><Icon name="chevR" size={22} style={{ transform: "rotate(180deg)" }} /></button>
              <button className="dlb-nav dlb-next" onClick={() => go(1)} aria-label="Siguiente"><Icon name="chevR" size={22} /></button>
            </div>
            <div className="dlb-side">
              <span className="dlb-cat">{w.category}</span>
              <h3>{w.title}</h3>
              <div className="dlb-swap">
                <button className={side === "antes" ? "active" : ""} onClick={() => setSide("antes")}>Antes</button>
                <button className={side === "despues" ? "active" : ""} onClick={() => setSide("despues")}>Después</button>
              </div>
              <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                {w.description ?? FALLBACK_DESC}
              </p>
            </div>
          </div>
        </div>
      )}

      {w && variant === "mobile" && (
        <div className="lightbox open" onClick={close} role="dialog" aria-modal="true" aria-label={w.title}>
          <div className="lb-inner" ref={lbRef} onClick={(e) => e.stopPropagation()}>
            <button className="lb-close" onClick={close} aria-label="Cerrar"><Icon name="close" size={22} /></button>
            <div className="lb-stage">
              <Photo key={side} src={sideImg(w)} className="lb-photo" tint={lbTint} label={lbLabel} alt={`${w.title} — ${lbLabel}`} />
              <span className={"lb-tag " + side}>{side === "antes" ? "Antes" : "Después"}</span>
              <button className="lb-nav lb-prev" onClick={() => go(-1)} aria-label="Anterior"><Icon name="chevR" size={22} style={{ transform: "rotate(180deg)" }} /></button>
              <button className="lb-nav lb-next" onClick={() => go(1)} aria-label="Siguiente"><Icon name="chevR" size={22} /></button>
            </div>
            <div className="lb-swap">
              <button className={side === "antes" ? "active" : ""} onClick={() => setSide("antes")}>Antes</button>
              <button className={side === "despues" ? "active" : ""} onClick={() => setSide("despues")}>Después</button>
            </div>
            <div className="lb-info">
              <span className="work-cat">{w.category}</span>
              <h3 className="display">{w.title}</h3>
              <p className="kicker">{w.description ?? FALLBACK_DESC}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

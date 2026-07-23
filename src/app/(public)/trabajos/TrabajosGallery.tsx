"use client";

import { useEffect, useRef, useState } from "react";
import { PageHead } from "@/components/public/PageHead";
import { Photo } from "@/components/shared/Photo";
import { Icon } from "@/components/shared/Icon";
import type { GalleryWork } from "@/lib/portfolio";

export type { GalleryWork };

const dlayout = (i: number) => { const m = i % 6; return m === 0 ? "dwork-tall" : m === 4 ? "dwork-wide" : ""; };
const FALLBACK_DESC = "Trabajo realizado íntegramente en taller, documentado paso a paso.";

export function TrabajosGallery({ works, cats }: { works: GalleryWork[]; cats: string[] }) {
  const [cat, setCat] = useState<string>("Todos");
  const [lb, setLb] = useState<number | null>(null);
  const [side, setSide] = useState<"antes" | "despues">("despues");
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null); // la card que abrió, para restaurar el foco

  const list = works.map((w, i) => ({ ...w, _i: i })).filter((w) => cat === "Todos" || w.category === cat);
  const open = (i: number, el?: HTMLElement) => { if (closeTimer.current) clearTimeout(closeTimer.current); if (el) triggerRef.current = el; setClosing(false); setSide("despues"); setLb(i); };
  const go = (d: number) => { if (lb == null || works.length === 0) return; setSide("despues"); setLb((lb + d + works.length) % works.length); };
  // Cierre coreografiado: marca .closing, espera la animación de salida y recién ahí desmonta.
  const requestClose = () => {
    setClosing(true);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => { setLb(null); setSide("despues"); setClosing(false); }, 200);
  };
  const w = lb != null ? works[lb] : null;
  const sideImg = (wk: GalleryWork) => (side === "antes" ? wk.beforeImageUrl : wk.afterImageUrl) ?? undefined;
  const sideLabel = side === "antes" ? "Estado de ingreso" : "Resultado final";

  // Diálogo modal de verdad (portado de WorkStack, que ya lo hacía bien): foco
  // inicial, trap de Tab, Escape, ← → entre obras, scroll-lock con restauración
  // de posición y foco al cerrar. Antes: Escape era INERTE y el foco quedaba
  // atrapado atrás (informe §4.10). Dual-DOM: el root visible se resuelve en vivo.
  const isOpen = lb !== null;
  useEffect(() => {
    if (!isOpen) return;
    const visibleRoot = () =>
      Array.from(document.querySelectorAll<HTMLElement>(".dlb-inner, .lb-inner")).find(
        (el) => el.offsetParent !== null
      ) ?? null;
    const focusables = () => {
      const root = visibleRoot();
      return root
        ? Array.from(root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null)
        : [];
    };
    const raf = requestAnimationFrame(() => (focusables()[0] ?? visibleRoot())?.focus({ preventScroll: true }));

    const scrollY = window.scrollY;
    const body = document.body;
    const prev = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); requestClose(); return; }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); go(e.key === "ArrowRight" ? 1 : -1); return; }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <>
      {/* DESKTOP */}
      <div className="only-desktop">
        <div className="dpage">
          <PageHead eyebrow="Portfolio" title="Trabajos realizados" sub="Tocá cualquier proyecto para ver el antes y después." />
          <section className="dsection-sm" style={{ paddingTop: 48 }}>
            <div className="wrap">
              <div className="dfilters" style={{ marginBottom: 40 }}>
                {cats.map((c) => (
                  <button key={c} className={"dchip" + (cat === c ? " active" : "")} onClick={() => setCat(c)}>{c}</button>
                ))}
              </div>
              {list.length === 0 ? (
                <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px 0" }}>Todavía no hay trabajos publicados.</p>
              ) : (
              <div className="dwork-grid">
                {list.map((wk, i) => (
                  <div key={wk.id} className={"dwork-item drise " + dlayout(i)}>
                    <button className="dwork-btn" onClick={(e) => open(wk._i, e.currentTarget)} aria-label={`${wk.title} — ver antes y después`}>
                      {/* Sin priority: los DOS árboles se renderizan siempre (el
                          corte es CSS), así que en un teléfono este eager+high del
                          árbol desktop OCULTO competía con el LCP real. Las 2
                          primeras ya vienen priority desde el árbol mobile — misma
                          `list`, mismas URLs — así que desktop igual las tiene. */}
                      <Photo src={wk.afterImageUrl ?? undefined} className="dwork-photo" tint={wk.tint ?? undefined} />
                      <span className="dwork-swap"><Icon name="swap" size={16} /></span>
                      <span className="dwork-ov"><span className="dwork-cat">{wk.category}</span><span className="dwork-title">{wk.title}</span></span>
                    </button>
                  </div>
                ))}
              </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* MOBILE */}
      <div className="only-mobile">
        <div className="page">
          <header className="page-header">
            <div className="page-header-glow" />
            <div className="eyebrow rise">Portfolio</div>
            <h1 className="page-header-title display rise" style={{ transitionDelay: "50ms" }}>Trabajos realizados</h1>
            <p className="page-header-sub rise" style={{ transitionDelay: "110ms" }}>Tocá cualquier proyecto para ver el antes y después.</p>
          </header>
          <div className="filters">
            {cats.map((c) => (
              <button key={c} className={"chip" + (cat === c ? " active" : "")} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <section className="section-tight" style={{ paddingTop: 16 }}>
            {list.length === 0 ? (
              <p style={{ color: "var(--muted)", textAlign: "center", padding: "32px 0" }}>Todavía no hay trabajos publicados.</p>
            ) : (
            <div className="work-grid">
              {list.map((wk, i) => (
                <div key={wk.id} className={"work-item" + (wk.tall ? " work-tall" : "")}>
                  <button className="work-btn" onClick={(e) => open(wk._i, e.currentTarget)} aria-label={`${wk.title} — ver antes y después`}>
                    <Photo src={wk.afterImageUrl ?? undefined} className="work-photo" tint={wk.tint ?? undefined} grad priority={i < 2} />
                    <span className="work-meta"><span className="work-cat">{wk.category}</span><span className="work-title display">{wk.title}</span></span>
                    <span className="work-swap"><Icon name="swap" size={15} /></span>
                  </button>
                </div>
              ))}
            </div>
            )}
          </section>
        </div>
      </div>

      {/* LIGHTBOX (estado compartido) — antes/después REAL */}
      {w && (
        <>
          <div className="only-desktop">
            <div className={"dlightbox" + (closing ? " closing" : "")} onClick={requestClose} role="dialog" aria-modal="true" aria-label={w.title}>
              <div className="dlb-inner" onClick={(e) => e.stopPropagation()}>
                <button className="dlb-close" onClick={requestClose} aria-label="Cerrar"><Icon name="close" size={22} /></button>
                <div className="dlb-stage">
                  <Photo key={side} src={sideImg(w)} className="dlb-photo" tint={side === "antes" ? "rgba(120,120,120,.18)" : (w.tint ?? undefined)} label={sideLabel} alt={`${w.title} — ${sideLabel}`} />
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
                  <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6, margin: 0 }}>{w.description ?? FALLBACK_DESC}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="only-mobile">
            <div className={"lightbox open" + (closing ? " closing" : "")} onClick={requestClose} role="dialog" aria-modal="true" aria-label={w.title}>
              <div className="lb-inner" onClick={(e) => e.stopPropagation()}>
                <button className="lb-close" onClick={requestClose} aria-label="Cerrar"><Icon name="close" size={22} /></button>
                <div className="lb-stage">
                  <Photo key={side} src={sideImg(w)} className="lb-photo" tint={side === "antes" ? "rgba(120,120,120,.18)" : (w.tint ?? undefined)} label={sideLabel} alt={`${w.title} — ${sideLabel}`} />
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
          </div>
        </>
      )}
    </>
  );
}

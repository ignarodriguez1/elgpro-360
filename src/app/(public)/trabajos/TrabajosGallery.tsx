"use client";

import { useState } from "react";
import { PageHead } from "@/components/public/PageHead";
import { Photo } from "@/components/shared/Photo";
import { Icon } from "@/components/shared/Icon";

export interface GalleryWork {
  id: string;
  title: string;
  category: string;
  tint: string | null;
  tall: boolean;
  afterImageUrl: string | null;
  beforeImageUrl: string | null;
  description: string | null;
}

const dlayout = (i: number) => { const m = i % 6; return m === 0 ? "dwork-tall" : m === 4 ? "dwork-wide" : ""; };
const FALLBACK_DESC = "Trabajo realizado íntegramente en taller, documentado paso a paso.";

export function TrabajosGallery({ works, cats }: { works: GalleryWork[]; cats: string[] }) {
  const [cat, setCat] = useState<string>("Todos");
  const [lb, setLb] = useState<number | null>(null);
  const [side, setSide] = useState<"antes" | "despues">("despues");

  const list = works.map((w, i) => ({ ...w, _i: i })).filter((w) => cat === "Todos" || w.category === cat);
  const open = (i: number) => { setSide("despues"); setLb(i); };
  const go = (d: number) => { if (lb == null || works.length === 0) return; setSide("despues"); setLb((lb + d + works.length) % works.length); };
  const w = lb != null ? works[lb] : null;
  const sideImg = (wk: GalleryWork) => (side === "antes" ? wk.beforeImageUrl : wk.afterImageUrl) ?? undefined;

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
                  <div key={wk.id} className={"dwork-item drise in " + dlayout(i)}>
                    <button className="dwork-btn" onClick={() => open(wk._i)}>
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
            <div className="eyebrow rise in">Portfolio</div>
            <h1 className="page-header-title display rise in" style={{ transitionDelay: "50ms" }}>Trabajos realizados</h1>
            <p className="page-header-sub rise in" style={{ transitionDelay: "110ms" }}>Tocá cualquier proyecto para ver el antes y después.</p>
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
              {list.map((wk) => (
                <div key={wk.id} className={"work-item" + (wk.tall ? " work-tall" : "")}>
                  <button className="work-btn" onClick={() => open(wk._i)}>
                    <Photo src={wk.afterImageUrl ?? undefined} className="work-photo" tint={wk.tint ?? undefined} grad />
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
            <div className="dlightbox" onClick={() => setLb(null)}>
              <div className="dlb-inner" onClick={(e) => e.stopPropagation()}>
                <button className="dlb-close" onClick={() => setLb(null)} aria-label="Cerrar"><Icon name="close" size={22} /></button>
                <div className="dlb-stage">
                  <Photo src={sideImg(w)} className="dlb-photo" tint={side === "antes" ? "rgba(120,120,120,.18)" : (w.tint ?? undefined)} label={side === "antes" ? "Estado de ingreso" : "Resultado final"} />
                  <span className={"dlb-tag " + side}>{side === "antes" ? "Antes" : "Después"}</span>
                  <button className="dlb-nav dlb-prev" onClick={() => go(-1)}><Icon name="chevR" size={22} style={{ transform: "rotate(180deg)" }} /></button>
                  <button className="dlb-nav dlb-next" onClick={() => go(1)}><Icon name="chevR" size={22} /></button>
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
            <div className="lightbox open" onClick={() => setLb(null)}>
              <div className="lb-inner" onClick={(e) => e.stopPropagation()}>
                <button className="lb-close" onClick={() => setLb(null)} aria-label="Cerrar"><Icon name="close" size={22} /></button>
                <div className="lb-stage">
                  <Photo src={sideImg(w)} className="lb-photo" tint={side === "antes" ? "rgba(120,120,120,.18)" : (w.tint ?? undefined)} label={side === "antes" ? "Estado de ingreso" : "Resultado final"} />
                  <span className={"lb-tag " + side}>{side === "antes" ? "Antes" : "Después"}</span>
                  <button className="lb-nav lb-prev" onClick={() => go(-1)}><Icon name="chevR" size={22} style={{ transform: "rotate(180deg)" }} /></button>
                  <button className="lb-nav lb-next" onClick={() => go(1)}><Icon name="chevR" size={22} /></button>
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

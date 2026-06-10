"use client";

import { useState } from "react";
import { PageHead } from "@/components/public/PageHead";
import { Photo } from "@/components/shared/Photo";
import { Icon } from "@/components/shared/Icon";
import { WORKS, WORK_CATS } from "@/lib/public-data";

const dlayout = (i: number) => { const m = i % 6; return m === 0 ? "dwork-tall" : m === 4 ? "dwork-wide" : ""; };

export default function TrabajosPage() {
  const [cat, setCat] = useState<string>("Todos");
  const [lb, setLb] = useState<number | null>(null);
  const [side, setSide] = useState<"antes" | "despues">("despues");

  const list = WORKS.map((w, i) => ({ ...w, _i: i })).filter((w) => cat === "Todos" || w.cat === cat);
  const open = (i: number) => { setSide("despues"); setLb(i); };
  const go = (d: number) => { if (lb == null) return; setSide("despues"); setLb((lb + d + WORKS.length) % WORKS.length); };
  const w = lb != null ? WORKS[lb] : null;

  return (
    <>
      {/* DESKTOP */}
      <div className="only-desktop">
        <div className="dpage">
          <PageHead eyebrow="Portfolio" title="Trabajos realizados" sub="Tocá cualquier proyecto para ver el antes y después." />
          <section className="dsection-sm" style={{ paddingTop: 48 }}>
            <div className="wrap">
              <div className="dfilters" style={{ marginBottom: 40 }}>
                {WORK_CATS.map((c) => (
                  <button key={c} className={"dchip" + (cat === c ? " active" : "")} onClick={() => setCat(c)}>{c}</button>
                ))}
              </div>
              <div className="dwork-grid">
                {list.map((wk, i) => (
                  <div key={wk._i} className={"dwork-item drise in " + dlayout(i)}>
                    <button className="dwork-btn" onClick={() => open(wk._i)}>
                      <Photo src={wk.img} className="dwork-photo" tint={wk.tint} />
                      <span className="dwork-swap"><Icon name="swap" size={16} /></span>
                      <span className="dwork-ov"><span className="dwork-cat">{wk.cat}</span><span className="dwork-title">{wk.title}</span></span>
                    </button>
                  </div>
                ))}
              </div>
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
            {WORK_CATS.map((c) => (
              <button key={c} className={"chip" + (cat === c ? " active" : "")} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <section className="section-tight" style={{ paddingTop: 16 }}>
            <div className="work-grid">
              {list.map((wk) => (
                <div key={wk._i} className={"work-item" + (wk.tall ? " work-tall" : "")}>
                  <button className="work-btn" onClick={() => open(wk._i)}>
                    <Photo src={wk.img} className="work-photo" tint={wk.tint} grad />
                    <span className="work-meta"><span className="work-cat">{wk.cat}</span><span className="work-title display">{wk.title}</span></span>
                    <span className="work-swap"><Icon name="swap" size={15} /></span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* LIGHTBOX (estado compartido) */}
      {w && (
        <>
          <div className="only-desktop">
            <div className="dlightbox" onClick={() => setLb(null)}>
              <div className="dlb-inner" onClick={(e) => e.stopPropagation()}>
                <button className="dlb-close" onClick={() => setLb(null)} aria-label="Cerrar"><Icon name="close" size={22} /></button>
                <div className="dlb-stage">
                  <Photo src={w.img} className="dlb-photo" tint={side === "antes" ? "rgba(120,120,120,.18)" : w.tint} label={side === "antes" ? "Estado de ingreso" : "Resultado final"} />
                  <span className={"dlb-tag " + side}>{side === "antes" ? "Antes" : "Después"}</span>
                  <button className="dlb-nav dlb-prev" onClick={() => go(-1)}><Icon name="chevR" size={22} style={{ transform: "rotate(180deg)" }} /></button>
                  <button className="dlb-nav dlb-next" onClick={() => go(1)}><Icon name="chevR" size={22} /></button>
                </div>
                <div className="dlb-side">
                  <span className="dlb-cat">{w.cat}</span>
                  <h3>{w.title}</h3>
                  <div className="dlb-swap">
                    <button className={side === "antes" ? "active" : ""} onClick={() => setSide("antes")}>Antes</button>
                    <button className={side === "despues" ? "active" : ""} onClick={() => setSide("despues")}>Después</button>
                  </div>
                  <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6, margin: 0 }}>Repintado y acabado realizados íntegramente en taller, con igualación de color computarizada y secado en cabina presurizada.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="only-mobile">
            <div className="lightbox open" onClick={() => setLb(null)}>
              <div className="lb-inner" onClick={(e) => e.stopPropagation()}>
                <button className="lb-close" onClick={() => setLb(null)} aria-label="Cerrar"><Icon name="close" size={22} /></button>
                <div className="lb-stage">
                  <Photo src={w.img} className="lb-photo" tint={side === "antes" ? "rgba(120,120,120,.18)" : w.tint} label={side === "antes" ? "Estado de ingreso" : "Resultado final"} />
                  <span className={"lb-tag " + side}>{side === "antes" ? "Antes" : "Después"}</span>
                  <button className="lb-nav lb-prev" onClick={() => go(-1)}><Icon name="chevR" size={22} style={{ transform: "rotate(180deg)" }} /></button>
                  <button className="lb-nav lb-next" onClick={() => go(1)}><Icon name="chevR" size={22} /></button>
                </div>
                <div className="lb-swap">
                  <button className={side === "antes" ? "active" : ""} onClick={() => setSide("antes")}>Antes</button>
                  <button className={side === "despues" ? "active" : ""} onClick={() => setSide("despues")}>Después</button>
                </div>
                <div className="lb-info">
                  <span className="work-cat">{w.cat}</span>
                  <h3 className="display">{w.title}</h3>
                  <p className="kicker">Repintado y acabado realizados íntegramente en taller, con control de color y secado en cabina.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

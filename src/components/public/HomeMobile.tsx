import Link from "next/link";
import { Photo } from "@/components/shared/Photo";
import { Icon } from "@/components/shared/Icon";
import { Logo } from "@/components/shared/Logo";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";
import { HERO_IMG, PROCESS, WORKS, TESTIMONIAL, type ServiceItem } from "@/lib/public-data";

export function HomeMobile({ featured }: { featured: ServiceItem[] }) {
  return (
    <div className="page page-home">
      {/* HERO */}
      <section className="hero">
        <Photo src={HERO_IMG} className="hero-bg" tint="rgba(196,30,42,.30)" />
        <div className="hero-veil" />
        <div className="hero-inner">
          <div className="eyebrow rise in">ELG Pro · Rosario</div>
          <h1 className="hero-title rise in" style={{ transitionDelay: "60ms" }}>
            Tu auto en<br />las mejores<br /><span className="hl">manos</span>
          </h1>
          <p className="hero-sub rise in" style={{ transitionDelay: "140ms" }}>
            Pintura, chapería, detail y trabajos personalizados. Y por primera vez, seguís cada etapa en tiempo real.
          </p>
          <div className="hero-cta rise in" style={{ transitionDelay: "220ms" }}>
            <Link href="/contacto" className="btn btn-primary btn-block">
              Solicitar cotización <Icon name="arrow" size={18} />
            </Link>
            <Link href="/trabajos" className="btn btn-ghost btn-block">
              Ver trabajos <Icon name="arrowUR" size={17} />
            </Link>
          </div>
        </div>
        <div className="hero-track rise in" style={{ margin: "0 var(--pad) 26px", transitionDelay: "300ms" }}>
          <div className="hero-track-top">
            <span className="badge">En proceso</span>
            <span className="mono hero-track-plate">AB 123 CD</span>
          </div>
          <div className="hero-track-car">Toyota Hilux SRX</div>
          <div className="hero-track-stage"><Icon name="spray" size={14} /> Pintura · cabina presurizada</div>
          <div className="hero-track-bar"><span style={{ width: "70%" }} /></div>
          <div className="hero-track-foot"><span>Etapa 3 de 4</span><span className="hero-track-eta">Entrega · Vie 30</span></div>
        </div>
        <div className="hero-scroll mono">scroll ↓</div>
      </section>

      {/* CONCEPT */}
      <Reveal className="concept">
        <div className="concept-mark">+</div>
        <p className="concept-text">
          La <strong>historia clínica</strong> de tu auto
          <span className="concept-plus">+</span>
          <strong>seguimiento en tiempo real</strong> del trabajo en taller.
        </p>
      </Reveal>

      {/* SERVICIOS */}
      <section className="section-tight">
        <SectionHead eyebrow="Servicios" title="Lo que hacemos">
          Estética automotor integral, de la chapa al brillo final.
        </SectionHead>
        <div className="svc-mini-grid">
          {featured.map((s, i) => (
            <Reveal key={s.name} className="svc-mini" delay={i * 60}>
              <Link href="/servicios" className="svc-mini-btn">
                <span className="svc-ic"><Icon name={s.icon} size={22} /></span>
                <span className="svc-mini-name display">{s.name}</span>
                <span className="svc-mini-desc">{s.desc}</span>
                <span className="svc-mini-go"><Icon name="arrowUR" size={18} /></span>
              </Link>
            </Reveal>
          ))}
        </div>
        <Link href="/servicios" className="btn btn-ghost btn-block" style={{ marginTop: 18 }}>
          Ver todos los servicios <Icon name="arrow" size={17} />
        </Link>
      </section>

      <div className="divider" />

      {/* PROCESO */}
      <section className="section-tight">
        <SectionHead eyebrow="¿Cómo trabajamos?" title="Cuatro pasos claros">
          Del ingreso a la entrega, con seguimiento en cada etapa.
        </SectionHead>
        <div className="proc-list">
          {PROCESS.map((p, i) => (
            <Reveal key={p.n} className="proc-step" delay={i * 70}>
              <div className="proc-rail"><span className="proc-dot" /></div>
              <div className="proc-body">
                <div className="proc-head">
                  <span className="proc-n mono">{p.n}</span>
                  <span className="proc-ic"><Icon name={p.icon} size={18} /></span>
                </div>
                <h3 className="proc-title display">{p.title}</h3>
                <p className="proc-desc">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TRACKING */}
      <section className="track-feat">
        <Reveal className="track-feat-intro">
          <div className="eyebrow">Lo que nos hace distintos</div>
          <h2 className="track-feat-title display">Mirá tu auto<br />sin venir al taller</h2>
          <p className="kicker" style={{ maxWidth: 300 }}>
            Cada etapa queda documentada con fotos y notas. Vos entrás desde el celular y ves
            exactamente en qué anda tu vehículo.
          </p>
        </Reveal>
        <Reveal className="track-demo" delay={80}>
          <div className="track-demo-head">
            <Logo size={15} />
            <span className="badge" style={{ background: "rgba(34,197,94,.14)", color: "#4ade80", borderColor: "rgba(34,197,94,.3)" }}>● En vivo</span>
          </div>
          <div className="track-tl">
            {[
              { t: "Pintura aplicada", d: "Hoy · 14:20", active: true, ph: "rgba(196,30,42,.2)" },
              { t: "Masillado y lijado", d: "Ayer · 17:05", active: false, ph: "rgba(245,158,11,.16)" },
              { t: "Vehículo ingresado", d: "Lun · 09:30", active: false, ph: "rgba(255,255,255,.08)" },
            ].map((e, i) => (
              <div className={"track-tl-row" + (e.active ? " active" : "")} key={i}>
                <div className="track-tl-rail">
                  <span className="track-tl-dot" />
                  {i < 2 && <span className="track-tl-line" />}
                </div>
                <div className="track-tl-card">
                  <div className="track-tl-top">
                    <span className="track-tl-t">{e.t}</span>
                    <span className="track-tl-d mono">{e.d}</span>
                  </div>
                  <div className="track-tl-thumbs">
                    <Photo className="track-tl-thumb" tint={e.ph} ratio="1" />
                    <Photo className="track-tl-thumb" tint={e.ph} ratio="1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/clientes/login" className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 4 }}>
            Ver demo del portal <Icon name="arrow" size={16} />
          </Link>
        </Reveal>
      </section>

      {/* PORTFOLIO */}
      <section className="section-tight">
        <div className="peek-head">
          <SectionHead eyebrow="Portfolio" title="Trabajos realizados" />
          <Link href="/trabajos" className="peek-all">Ver todos <Icon name="arrow" size={15} /></Link>
        </div>
        <div className="peek-grid">
          {WORKS.slice(0, 4).map((w, i) => (
            <Reveal key={w.title} delay={i * 60} className={"peek-item" + (i === 0 ? " peek-wide" : "")}>
              <Link href="/trabajos" className="peek-btn" style={{ display: "block" }}>
                <Photo src={w.img} className="peek-photo" tint={w.tint} grad />
                <span className="peek-cat">{w.cat}</span>
                <span className="peek-title display">{w.title}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <Reveal className="testi">
        <Icon name="quote" size={40} className="testi-q" />
        <p className="testi-text">{TESTIMONIAL.quote}</p>
        <div className="testi-by">
          <span className="testi-av"><Icon name="user" size={18} /></span>
          <div>
            <div className="testi-name">{TESTIMONIAL.name}</div>
            <div className="testi-car mono">{TESTIMONIAL.car}</div>
          </div>
        </div>
      </Reveal>

      {/* CTA */}
      <Reveal className="ctaband">
        <div className="ctaband-glow" />
        <div className="eyebrow" style={{ color: "#ffb3b9" }}>¿Listo para empezar?</div>
        <h2 className="ctaband-title display">Pedí tu<br />cotización hoy</h2>
        <p className="ctaband-sub">Contanos qué necesita tu auto y te respondemos a la brevedad.</p>
        <Link href="/contacto" className="btn ctaband-btn btn-block">
          Solicitar cotización <Icon name="arrow" size={18} />
        </Link>
      </Reveal>
    </div>
  );
}

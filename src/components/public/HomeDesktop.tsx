import Link from "next/link";
import { Photo } from "@/components/shared/Photo";
import { Icon } from "@/components/shared/Icon";
import { Logo } from "@/components/shared/Logo";
import { HERO_IMG, PROCESS, WORKS, TESTIMONIAL, type ServiceItem } from "@/lib/public-data";

const WORK_LAYOUT = ["dwork-tall", "", "", "", "dwork-wide", ""];

function TrackDemo() {
  const rows = [
    { t: "Pintura aplicada", d: "Hoy · 14:20", active: true, ph: "rgba(196,30,42,.2)" },
    { t: "Masillado y lijado", d: "Ayer · 17:05", active: false, ph: "rgba(245,158,11,.16)" },
    { t: "Vehículo ingresado", d: "Lun · 09:30", active: false, ph: "rgba(255,255,255,.08)" },
  ];
  return (
    <>
      {rows.map((e, i) => (
        <div className={"dtl-row" + (e.active ? " active" : "")} key={i}>
          <div className="dtl-rail">
            <span className="dtl-dot" />
            {i < rows.length - 1 && <span className="dtl-line" />}
          </div>
          <div className="dtl-card">
            <div className="dtl-top">
              <span className="dtl-t">{e.t}</span>
              <span className="dtl-d">{e.d}</span>
            </div>
            <div className="dtl-thumbs">
              <Photo className="dtl-thumb" tint={e.ph} ratio="1" />
              <Photo className="dtl-thumb" tint={e.ph} ratio="1" />
              <Photo className="dtl-thumb" tint={e.ph} ratio="1" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function HomeDesktop({ featured }: { featured: ServiceItem[] }) {
  return (
    <div className="dpage">
      <section className="dhero">
        <Photo src={HERO_IMG} className="dhero-bg" tint="rgba(196,30,42,.3)" />
        <div className="dhero-veil" />
        <div className="dhero-veil2" />
        <div className="wrap">
          <div className="dhero-copy">
            <div className="deyebrow drise in">ELG Pro · Rosario, Santa Fe</div>
            <h1 className="dhero-title drise in" style={{ transitionDelay: "60ms" }}>
              Tu auto en<br />las mejores<br /><span className="hl">manos</span>
            </h1>
            <p className="dhero-sub drise in" style={{ transitionDelay: "130ms" }}>
              Pintura, chapería, detail y trabajos personalizados. Y por primera vez, seguís
              cada etapa del trabajo en tiempo real.
            </p>
            <div className="dhero-cta drise in" style={{ transitionDelay: "200ms" }}>
              <Link href="/contacto" className="dbtn dbtn-primary">
                Solicitar cotización <Icon name="arrow" size={19} />
              </Link>
              <Link href="/trabajos" className="dbtn dbtn-ghost">Ver trabajos</Link>
            </div>
            <div className="dhero-stats drise in" style={{ transitionDelay: "280ms" }}>
              <div><div className="dhero-stat-n">+12</div><div className="dhero-stat-l">años de oficio</div></div>
              <div><div className="dhero-stat-n">+800</div><div className="dhero-stat-l">autos entregados</div></div>
              <div><div className="dhero-stat-n">100%</div><div className="dhero-stat-l">trabajo documentado</div></div>
            </div>
          </div>
          <div className="dhero-track drise in">
            <div className="dhero-track-head">
              <Logo size={16} />
              <span className="badge" style={{ background: "rgba(34,197,94,.14)", color: "#4ade80", borderColor: "rgba(34,197,94,.3)" }}>● En vivo</span>
            </div>
            <div className="dtl"><TrackDemo /></div>
          </div>
        </div>
      </section>

      <div className="dconcept">
        <div className="wrap drise in">
          <span className="dconcept-mark">+</span>
          <p className="dconcept-text">
            La <strong>historia clínica</strong> de tu auto
            <span className="dconcept-plus">+</span>
            <strong>seguimiento en tiempo real</strong> del trabajo en taller.
          </p>
        </div>
      </div>

      <section className="dsection">
        <div className="wrap">
          <div className="dhead">
            <div className="dhead-l">
              <div className="deyebrow">Servicios</div>
              <h2>Lo que hacemos</h2>
              <p>Estética automotor integral, de la chapa al brillo final, con materiales premium y acabado de fábrica.</p>
            </div>
            <Link href="/servicios" className="dlink">Ver todos <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="dsvc-grid">
            {featured.map((s) => (
              <Link key={s.name} href="/servicios" className="dsvc-card drise in" style={{ display: "flex" }}>
                <Photo src={s.img} className="dsvc-img" tint={s.tint} grad />
                <span className="dsvc-go"><Icon name="arrowUR" size={17} /></span>
                <span className="dsvc-body">
                  <span className="dsvc-ic"><Icon name={s.icon} size={22} /></span>
                  <span className="dsvc-name">{s.name}</span>
                  <span className="dsvc-desc">{s.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="dsection dproc">
        <div className="wrap">
          <div className="dhead">
            <div className="dhead-l">
              <div className="deyebrow">¿Cómo trabajamos?</div>
              <h2>Cuatro pasos claros</h2>
              <p>Del ingreso a la entrega, con seguimiento documentado en cada etapa.</p>
            </div>
          </div>
          <div className="dproc-grid">
            {PROCESS.map((p) => (
              <div key={p.n} className="dproc-step drise in">
                <div className="dproc-dot"><Icon name={p.icon} size={22} /></div>
                <span className="dproc-n">{p.n}</span>
                <h3 className="dproc-title">{p.title}</h3>
                <p className="dproc-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dsection dtrack">
        <div className="wrap">
          <div className="dtrack-copy drise in">
            <div className="deyebrow">Lo que nos hace distintos</div>
            <h2 className="dtrack-title">Mirá tu auto sin venir al taller</h2>
            <p style={{ color: "var(--muted)", fontSize: 17, lineHeight: 1.6, margin: 0, maxWidth: 440 }}>
              Cada etapa queda documentada con fotos y notas. Entrás desde cualquier dispositivo y
              ves exactamente en qué anda tu vehículo.
            </p>
            <div className="dtrack-feats">
              {["Fotos de cada etapa del trabajo", "Notas y fecha estimada de entrega", "Aviso cuando está listo para retirar"].map((f) => (
                <div className="dtrack-feat" key={f}><span><Icon name="check" size={17} /></span>{f}</div>
              ))}
            </div>
            <Link href="/clientes/login" className="dbtn dbtn-ghost" style={{ marginTop: 8 }}>
              Ver el portal de clientes <Icon name="arrow" size={18} />
            </Link>
          </div>
          <div className="dtrack-demo drise in">
            <div className="dtrack-demo-head">
              <Logo size={17} />
              <span className="badge" style={{ background: "rgba(34,197,94,.14)", color: "#4ade80", borderColor: "rgba(34,197,94,.3)" }}>● En vivo</span>
            </div>
            <div className="dtl"><TrackDemo /></div>
          </div>
        </div>
      </section>

      <section className="dsection">
        <div className="wrap">
          <div className="dhead">
            <div className="dhead-l">
              <div className="deyebrow">Portfolio</div>
              <h2>Trabajos realizados</h2>
              <p>Una muestra de proyectos. Entrá a la galería para ver el antes y después.</p>
            </div>
            <Link href="/trabajos" className="dlink">Ver galería completa <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="dwork-grid">
            {WORKS.slice(0, 6).map((w, i) => (
              <Link key={w.title} href="/trabajos" className={"dwork-item drise in " + WORK_LAYOUT[i]}>
                <span className="dwork-btn" style={{ display: "block" }}>
                  <Photo src={w.img} className="dwork-photo" tint={w.tint} />
                  <span className="dwork-swap"><Icon name="swap" size={16} /></span>
                  <span className="dwork-ov">
                    <span className="dwork-cat">{w.cat}</span>
                    <span className="dwork-title">{w.title}</span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="dsection dsection-sm">
        <div className="wrap drise in">
          <div className="dtesti">
            <Icon name="quote" size={56} className="dtesti-q" />
            <p className="dtesti-text">{TESTIMONIAL.quote}</p>
            <div className="dtesti-by">
              <span className="dtesti-av"><Icon name="user" size={22} /></span>
              <div style={{ textAlign: "left" }}>
                <div className="dtesti-name">{TESTIMONIAL.name}</div>
                <div className="dtesti-car">{TESTIMONIAL.car}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dcta">
        <div className="dcta-glow" />
        <div className="wrap drise in">
          <div className="deyebrow" style={{ color: "#ffd0d4" }}>¿Listo para empezar?</div>
          <h2 className="dcta-title">Pedí tu cotización hoy</h2>
          <p className="dcta-sub">Contanos qué necesita tu auto y te respondemos a la brevedad. Sin compromiso.</p>
          <Link href="/contacto" className="dbtn dcta-btn">Solicitar cotización <Icon name="arrow" size={19} /></Link>
        </div>
      </section>
    </div>
  );
}

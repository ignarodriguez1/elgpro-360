import Link from "next/link";
import { PageHead } from "@/components/public/PageHead";
import { Photo } from "@/components/shared/Photo";
import { Icon } from "@/components/shared/Icon";
import { serviceVisual } from "@/lib/public-data";
import { listServices } from "@/services/service.service";

export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  // DB-driven: solo servicios visibles. El toggle del admin se refleja acá.
  const services = (await listServices(false)).map((s, i) => {
    const v = serviceVisual(s.name, i);
    return {
      name: s.name,
      desc: s.description ?? "",
      icon: v.icon,
      tint: v.tint,
      img: s.imageUrl || v.img,
    };
  });

  return (
    <>
      {/* DESKTOP */}
      <div className="only-desktop">
        <div className="dpage">
          <PageHead
            eyebrow="Servicios"
            title="Todo para tu auto"
            sub="Estética automotor integral con acabado de fábrica, materiales premium y trabajo 100% documentado."
          />
          <section className="dsection-sm" style={{ paddingTop: 60 }}>
            <div className="wrap">
              {services.length === 0 ? (
                <div className="svc-empty drise">
                  <h3>Pronto, nuevos servicios</h3>
                  <p>Estamos renovando nuestro catálogo. Escribinos y te asesoramos sin compromiso.</p>
                </div>
              ) : (
                <div className="dsvc-full-grid">
                  {services.map((s) => (
                    <Link key={s.name} href="/contacto" className="dsvc-card drise" style={{ display: "flex" }}>
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
              )}
            </div>
          </section>

          <section className="dcta">
            <div className="dcta-glow" />
            <div className="wrap drise">
              <div className="deyebrow" style={{ color: "#ffd0d4" }}>¿Listo para empezar?</div>
              <h2 className="dcta-title">Pedí tu cotización hoy</h2>
              <p className="dcta-sub">Contanos qué necesita tu auto y te respondemos a la brevedad. Sin compromiso.</p>
              <Link href="/contacto" className="dbtn dcta-btn">Solicitar cotización <Icon name="arrow" size={19} /></Link>
            </div>
          </section>
        </div>
      </div>

      {/* MOBILE */}
      <div className="only-mobile">
        <div className="page">
          <header className="page-header">
            <div className="page-header-glow" />
            <div className="eyebrow rise">Servicios</div>
            <h1 className="page-header-title display rise" style={{ transitionDelay: "50ms" }}>Todo para tu auto</h1>
            <p className="page-header-sub rise" style={{ transitionDelay: "110ms" }}>
              Estética automotor integral con acabado de fábrica y materiales premium.
            </p>
          </header>
          <section className="section-tight svc-full-list" style={{ paddingTop: 16 }}>
            {services.length === 0 ? (
              <div className="svc-empty rise">
                <h3>Pronto, nuevos servicios</h3>
                <p>Estamos renovando nuestro catálogo. Escribinos y te asesoramos sin compromiso.</p>
              </div>
            ) : (
              services.map((s) => (
                <Link key={s.name} href="/contacto" className="svc-full" style={{ display: "block" }}>
                  <Photo src={s.img} className="svc-full-img" tint={s.tint} grad />
                  <div className="svc-full-body">
                    <span className="svc-ic"><Icon name={s.icon} size={20} /></span>
                    <h3 className="svc-full-name display">{s.name}</h3>
                    <p className="svc-full-desc">{s.desc}</p>
                  </div>
                </Link>
              ))
            )}
          </section>

          <div className="ctaband rise">
            <div className="ctaband-glow" />
            <div className="eyebrow" style={{ color: "#ffb3b9" }}>¿Listo para empezar?</div>
            <h2 className="ctaband-title display">Pedí tu<br />cotización hoy</h2>
            <p className="ctaband-sub">Contanos qué necesita tu auto y te respondemos a la brevedad.</p>
            <Link href="/contacto" className="btn ctaband-btn btn-block">
              Solicitar cotización <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

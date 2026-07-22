import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/public/PageHead";
import { ServiceGallery } from "@/components/public/ServiceGallery";
import { Icon } from "@/components/shared/Icon";
import { getServiceBySlug } from "@/services/service.service";

export const dynamic = "force-dynamic";

/**
 * Primer generateMetadata del sitio público (informe §B.1: no existía SEO por
 * página). Title y description salen de los datos del servicio. Open Graph y
 * sitemap quedan fuera de alcance a propósito (decisión aparte).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service || !service.visible) {
    return { title: "Servicio — ELG Pro 360" };
  }
  const description = (
    service.description ??
    `${service.name} en ELG Pro 360 — Paint & Detail. Estética automotor con trabajo 100% documentado.`
  ).slice(0, 160);
  return { title: `${service.name} — ELG Pro 360`, description };
}

export default async function ServicioDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  // 404 REAL también para ocultos: un servicio despublicado no es alcanzable
  // por URL directa (mismo contrato que el toggle del listado).
  if (!service || !service.visible) notFound();

  const images = service.images.map((i) => ({ url: i.url, alt: i.alt }));
  const hasGallery = images.length > 0;

  return (
    <>
      {/* DESKTOP */}
      <div className="only-desktop">
        <div className="dpage">
          <PageHead
            eyebrow="Servicios"
            title={service.name}
            sub={service.description ?? undefined}
          />
          <section className="dsection-sm" style={{ paddingTop: 44 }}>
            <div className="wrap">
              <Link href="/servicios" className="dsg-back drise">
                <Icon name="chevR" size={14} style={{ transform: "rotate(180deg)" }} />
                Todos los servicios
              </Link>
              {hasGallery ? (
                <ServiceGallery serviceName={service.name} images={images} variant="desktop" />
              ) : (
                <div className="svc-empty drise">
                  <h3>Galería en preparación</h3>
                  <p>
                    Muy pronto vas a ver fotos reales de este trabajo. Mientras tanto,
                    escribinos y te contamos todo sobre {service.name}.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="dcta">
            <div className="dcta-glow" />
            <div className="wrap drise">
              <div className="deyebrow" style={{ color: "#ffd0d4" }}>¿Lo querés para tu auto?</div>
              <h2 className="dcta-title">Pedí tu cotización hoy</h2>
              <p className="dcta-sub">
                Contanos qué necesita tu auto y te respondemos a la brevedad. Sin compromiso.
              </p>
              <Link href="/contacto" className="dbtn dcta-btn">
                Solicitar cotización <Icon name="arrow" size={19} />
              </Link>
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
            <h1 className="page-header-title display rise" style={{ transitionDelay: "50ms" }}>
              {service.name}
            </h1>
            {service.description && (
              <p className="page-header-sub rise" style={{ transitionDelay: "110ms" }}>
                {service.description}
              </p>
            )}
          </header>

          <section className="section-tight" style={{ paddingTop: 16 }}>
            {hasGallery ? (
              <ServiceGallery serviceName={service.name} images={images} variant="mobile" />
            ) : (
              <div className="svc-empty rise">
                <h3>Galería en preparación</h3>
                <p>
                  Muy pronto vas a ver fotos reales de este trabajo. Mientras tanto,
                  escribinos y te contamos todo.
                </p>
              </div>
            )}
          </section>

          <div className="ctaband rise">
            <div className="ctaband-glow" />
            <div className="eyebrow" style={{ color: "#ffb3b9" }}>¿Lo querés para tu auto?</div>
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

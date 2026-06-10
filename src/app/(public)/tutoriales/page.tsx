import Link from "next/link";
import { PageHead } from "@/components/public/PageHead";
import { Photo } from "@/components/shared/Photo";
import { Icon } from "@/components/shared/Icon";
import { listTutorials } from "@/services/tutorial.service";

export const dynamic = "force-dynamic";

const TINTS = ["rgba(80,140,255,.16)", "rgba(34,197,94,.16)", "rgba(245,158,11,.16)", "rgba(196,30,42,.16)"];

export default async function TutorialesPublicPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const tutorials = await listTutorials(true);
  const { cat } = await searchParams;

  // Derivar categorías únicas del modelo
  const allCats = Array.from(new Set(tutorials.map((t) => t.category).filter(Boolean))) as string[];
  const cats = ["Todos", ...allCats];

  const activeCat = cat && allCats.includes(cat) ? cat : "Todos";
  const filtered = activeCat === "Todos" ? tutorials : tutorials.filter((t) => t.category === activeCat);

  return (
    <>
      {/* DESKTOP */}
      <div className="only-desktop">
        <div className="dpage">
          <PageHead eyebrow="Aprendé con nosotros" title="Tutoriales" sub="Cuidá tu auto entre visita y visita con nuestras guías." />
          <section className="dsection-sm" style={{ paddingTop: 48 }}>
            <div className="wrap">
              <div className="dfilters" style={{ marginBottom: 40 }}>
                {cats.map((c) => (
                  <Link
                    key={c}
                    href={c === "Todos" ? "/tutoriales" : `/tutoriales?cat=${encodeURIComponent(c)}`}
                    className={"dchip" + (activeCat === c ? " active" : "")}
                  >
                    {c}
                  </Link>
                ))}
              </div>
              <div className="dtuto-grid">
                {filtered.map((t, i) => (
                  <Link key={t.id} href={`/tutoriales/${t.slug}`} className="dtuto-card drise in">
                    <div className="dtuto-thumb-wrap">
                      <Photo className="dtuto-thumb" tint={TINTS[i % TINTS.length]} grad />
                      <span className="dtuto-play"><Icon name="play" size={22} /></span>
                    </div>
                    <div className="dtuto-body">
                      <span className="dtuto-cat">{t.category}</span>
                      <h3 className="dtuto-title">{t.title}</h3>
                    </div>
                  </Link>
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
            <div className="eyebrow rise in">Aprendé con nosotros</div>
            <h1 className="page-header-title display rise in" style={{ transitionDelay: "50ms" }}>Tutoriales</h1>
            <p className="page-header-sub rise in" style={{ transitionDelay: "110ms" }}>
              Cuidá tu auto entre visita y visita con nuestras guías.
            </p>
          </header>
          <div className="filters">
            {cats.map((c) => (
              <Link
                key={c}
                href={c === "Todos" ? "/tutoriales" : `/tutoriales?cat=${encodeURIComponent(c)}`}
                className={"chip" + (activeCat === c ? " active" : "")}
              >
                {c}
              </Link>
            ))}
          </div>
          <section className="section-tight" style={{ paddingTop: 16 }}>
            <div className="tuto-list">
              {filtered.map((t, i) => (
                <Link key={t.id} href={`/tutoriales/${t.slug}`} className="tuto-card" style={{ display: "block" }}>
                  <div className="tuto-thumb-wrap">
                    <Photo className="tuto-thumb" tint={TINTS[i % TINTS.length]} grad />
                    <span className="tuto-play"><Icon name="play" size={20} /></span>
                  </div>
                  <div className="tuto-body">
                    <span className="tuto-cat">{t.category}</span>
                    <h3 className="tuto-title display">{t.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

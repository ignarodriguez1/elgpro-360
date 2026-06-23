import Link from "next/link";
import { requireCustomer } from "@/lib/session";
import { listTutorials } from "@/services/tutorial.service";
import { Icon } from "@/components/shared/Icon";
import { Photo } from "@/components/shared/Photo";
import { EmptyState } from "@/components/shared/EmptyState";
import { youtubeThumbFromUrl } from "@/lib/youtube";

const TINTS = ["rgba(80,140,255,.16)", "rgba(34,197,94,.16)", "rgba(245,158,11,.16)", "rgba(196,30,42,.16)"];

export default async function TutorialesClientePage() {
  await requireCustomer();
  const tutorials = await listTutorials(true);

  return (
    <>
      {/* MOBILE */}
      <div className="only-mobile p-scroll">
        <div className="p-greet" style={{ paddingTop: 4 }}>
          <div className="p-greet-name" style={{ fontSize: 30 }}>Cuidados</div>
          <div className="p-greet-sub">Cuidá tu auto entre visitas.</div>
        </div>
        <div className="p-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {tutorials.length === 0 ? (
            <EmptyState icon="film" title="Sin tutoriales" description="Pronto vamos a subir guías de cuidado para tu vehículo." />
          ) : (
            tutorials.map((t, i) => (
              <Link key={t.id} href={`/tutoriales/${t.slug}`} className="tuto-card p-rise" style={{ animationDelay: `${i * 60}ms`, display: "block", textDecoration: "none" }} data-section="card-link">
                <div className="tuto-thumb-wrap">
                  <Photo src={youtubeThumbFromUrl(t.videoUrl) ?? undefined} className="tuto-thumb" tint={TINTS[i % TINTS.length]} grad />
                  <span className="tuto-play"><Icon name="play" size={20} /></span>
                </div>
                <div className="tuto-body">
                  <span className="tuto-cat">{t.category}</span>
                  <h3 className="tuto-title">{t.title}</h3>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* DESKTOP */}
      <div className="only-desktop">
        <div className="pw-wrap">
          <div className="pw-greet pw-rise">
            <div className="pw-greet-name" style={{ fontSize: 44 }}>Cuidados</div>
            <div className="pw-greet-sub">Cuidá tu auto entre visitas con nuestras guías.</div>
          </div>
          {tutorials.length === 0 ? (
            <EmptyState icon="film" title="Sin tutoriales" description="Pronto vamos a subir guías de cuidado." />
          ) : (
            <div className="pwt-grid">
              {tutorials.map((t, i) => (
                <Link key={t.id} href={`/tutoriales/${t.slug}`} className="pwt-card pw-rise" style={{ animationDelay: `${(i % 3) * 60}ms`, display: "block", textDecoration: "none" }} data-section="card-link">
                  <div className="pwt-th">
                    <Photo src={youtubeThumbFromUrl(t.videoUrl) ?? undefined} className="pwt-img" tint={TINTS[i % TINTS.length]} grad />
                    <span className="pwt-play"><Icon name="play" size={22} /></span>
                  </div>
                  <div className="pwt-b">
                    <div className="pwt-cat">{t.category}</div>
                    <div className="pwt-t">{t.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

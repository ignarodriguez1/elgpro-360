import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/public/PageHead";
import { Photo } from "@/components/shared/Photo";
import { Icon } from "@/components/shared/Icon";
import { getTutorialBySlug } from "@/services/tutorial.service";

export const dynamic = "force-dynamic";

export default async function TutorialDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let tutorial;
  try {
    tutorial = await getTutorialBySlug(slug);
  } catch {
    notFound();
  }

  return (
    <div className="dpage">
      <PageHead eyebrow={tutorial.category} title={tutorial.title} sub={tutorial.description ?? undefined} />
      <section className="dsection-sm" style={{ paddingTop: 32 }}>
        <div className="wrap" style={{ maxWidth: 820 }}>
          <Link href="/tutoriales" className="dlink" style={{ marginBottom: 24, display: "inline-flex" }}>
            <Icon name="chevR" size={16} style={{ transform: "rotate(180deg)" }} /> Volver a tutoriales
          </Link>
          <div className="dtuto-thumb-wrap" style={{ borderRadius: 16, overflow: "hidden", marginBottom: 28 }}>
            <Photo className="dtuto-thumb" tint="rgba(196,30,42,.18)" grad style={{ aspectRatio: "16/9" }} />
            {tutorial.videoUrl ? (
              <a href={tutorial.videoUrl} target="_blank" rel="noopener noreferrer" className="dtuto-play" aria-label="Ver video">
                <Icon name="play" size={24} />
              </a>
            ) : (
              <span className="dtuto-play"><Icon name="play" size={24} /></span>
            )}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {tutorial.content}
          </div>
        </div>
      </section>
    </div>
  );
}

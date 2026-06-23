import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/public/PageHead";
import { Icon } from "@/components/shared/Icon";
import { TutorialVideo } from "@/components/public/TutorialVideo";
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

  // Un tutorial oculto no debe ser accesible ni por link directo (no solo sale del listado).
  if (!tutorial.visible) notFound();

  return (
    <div className="dpage">
      <PageHead eyebrow={tutorial.category} title={tutorial.title} sub={tutorial.description ?? undefined} />
      <section className="dsection-sm" style={{ paddingTop: 32 }}>
        <div className="wrap" style={{ maxWidth: 820 }}>
          <Link href="/tutoriales" className="dlink" style={{ marginBottom: 24, display: "inline-flex" }}>
            <Icon name="chevR" size={16} style={{ transform: "rotate(180deg)" }} /> Volver a tutoriales
          </Link>
          <TutorialVideo url={tutorial.videoUrl} />
          <div style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {tutorial.content}
          </div>
        </div>
      </section>
    </div>
  );
}

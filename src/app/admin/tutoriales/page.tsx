import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/shared/Icon";
import { TutorialToggle } from "@/components/admin/TutorialToggle";

export default async function AdminTutorialesPage() {
  await requireAdmin();
  const tutorials = await prisma.tutorial.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="apage">
      <div className="ahead">
        <div className="ahead-l">
          <h2>Tutoriales</h2>
          <div className="ahead-sub">{tutorials.length} guías</div>
        </div>
        <button className="abtn abtn-primary"><Icon name="plus" size={17} /> Nuevo tutorial</button>
      </div>

      <div className="apanel">
        <div className="crud-list">
          {tutorials.map((t) => (
            <div className="crud-row" key={t.id}>
              <span className="t-avatar"><Icon name="play" size={15} /></span>
              <div className="crud-main">
                <div className="crud-title">{t.title}</div>
                <div className="crud-meta">{t.category}</div>
              </div>
              <TutorialToggle id={t.id} visible={t.visible} />
            </div>
          ))}
          {tutorials.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>Sin tutoriales.</div>
          )}
        </div>
      </div>
    </div>
  );
}

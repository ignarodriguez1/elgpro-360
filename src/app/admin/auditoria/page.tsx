import { requireOwner } from "@/lib/session";
import { listRecentAuditLogs } from "@/services/audit.service";

export default async function AuditoriaPage() {
  await requireOwner();
  const logs = await listRecentAuditLogs(150);

  const fmt = (d: Date | string) =>
    new Date(d).toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="apage">
      <div className="ahead" data-section="header">
        <div className="ahead-l">
          <h2>Auditoría</h2>
          <div className="ahead-sub">
            Registro interno de cambios · {logs.length} eventos recientes
          </div>
        </div>
      </div>

      {/* Desktop: tabla */}
      <div className="apanel only-desktop" data-section="logs-list">
        <table className="atable">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Actor</th>
              <th>Acción</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="mono" style={{ whiteSpace: "nowrap" }}>{fmt(l.createdAt)}</td>
                <td>{l.actor?.name ?? l.actorEmail}</td>
                <td>
                  <span className="chip">{l.action}</span>
                </td>
                <td>{l.summary}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
                  Sin eventos registrados aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="only-mobile" data-section="logs-list">
        <div className="alist">
          {logs.map((l) => (
            <div key={l.id} className="alist-card">
              <div className="alist-top">
                <span className="alist-title"><span className="chip">{l.action}</span></span>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted-dim)", whiteSpace: "nowrap" }}>{fmt(l.createdAt)}</span>
              </div>
              <div className="alist-meta">
                <span>{l.actor?.name ?? l.actorEmail}</span>
              </div>
              {l.summary && <div className="alist-meta"><span>{l.summary}</span></div>}
            </div>
          ))}
          {logs.length === 0 && <div className="alist-empty">Sin eventos registrados aún.</div>}
        </div>
      </div>
    </div>
  );
}

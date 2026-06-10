import { requireAdmin } from "@/lib/session";
import { listRecentAuditLogs } from "@/services/audit.service";

export default async function AuditoriaPage() {
  await requireAdmin();
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
      <div className="ahead">
        <div className="ahead-l">
          <h2>Auditoría</h2>
          <div className="ahead-sub">
            Registro interno de cambios · {logs.length} eventos recientes
          </div>
        </div>
      </div>

      <div className="apanel">
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
    </div>
  );
}

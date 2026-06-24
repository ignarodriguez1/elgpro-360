import { requireOwner } from "@/lib/session";
import { listTeamUsers } from "@/services/user.service";
import { NewUserForm } from "@/components/admin/NewUserForm";
import { UserActiveToggle } from "@/components/admin/UserActiveToggle";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  STAFF: "Operario",
};

function roleBadgeColor(role: string): string {
  return role === "ADMIN" ? "var(--primary)" : "var(--muted-light)";
}

/** Estado de la cuenta para mostrar: desactivada > activa-sin-acceso > activa. */
function accountStatus(active: boolean, emailVerified: Date | null) {
  if (!active) return { label: "Desactivada", color: "#ff5d68" };
  if (!emailVerified) return { label: "Sin primer acceso", color: "var(--muted)" };
  return { label: "Activa", color: "var(--success)" };
}

export default async function AdminUsuariosPage() {
  // Solo el dueño (ADMIN) gestiona el equipo. requireOwner redirige al STAFF a
  // /admin (no a login) → sin loop 307.
  const me = await requireOwner();
  const users = await listTeamUsers();

  return (
    <div className="apage">
      <div className="ahead">
        <div className="ahead-l">
          <h2>Equipo</h2>
          <div className="ahead-sub">{users.length} usuarios internos (operarios y administradores)</div>
        </div>
      </div>

      <NewUserForm />

      {/* Desktop: tabla */}
      <div className="apanel only-desktop">
        <table className="atable">
          <thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
            {users.map((u) => {
              const initials = u.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
              const st = accountStatus(u.active, u.emailVerified);
              return (
                <tr key={u.id}>
                  <td>
                    <span className="atable-cli">
                      <span className="atable-av">{initials}</span>
                      {u.name}{u.id === me.id && <span style={{ color: "var(--muted)", marginLeft: 6 }}>(vos)</span>}
                    </span>
                  </td>
                  <td><span className="mono">{u.email}</span></td>
                  <td><span style={{ color: roleBadgeColor(u.role), fontWeight: 600 }}>{ROLE_LABEL[u.role] ?? u.role}</span></td>
                  <td style={{ color: st.color }}>{st.label}</td>
                  <td><UserActiveToggle userId={u.id} active={u.active} disabled={u.id === me.id} /></td>
                </tr>
              );
            })}
            {users.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>Sin usuarios internos.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="only-mobile">
        <div className="alist">
          {users.map((u) => {
            const initials = u.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
            const st = accountStatus(u.active, u.emailVerified);
            return (
              <div key={u.id} className="alist-card">
                <div className="alist-top">
                  <span className="alist-title">
                    <span className="atable-av">{initials}</span>
                    {u.name}{u.id === me.id && <span style={{ color: "var(--muted)", marginLeft: 6 }}>(vos)</span>}
                  </span>
                  <span style={{ color: roleBadgeColor(u.role), fontWeight: 600, fontSize: 13 }}>{ROLE_LABEL[u.role] ?? u.role}</span>
                </div>
                <div className="alist-meta">
                  <span>{u.email}</span>
                  <span style={{ color: st.color }}>{st.label}</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <UserActiveToggle userId={u.id} active={u.active} disabled={u.id === me.id} />
                </div>
              </div>
            );
          })}
          {users.length === 0 && <div className="alist-empty">Sin usuarios internos.</div>}
        </div>
      </div>
    </div>
  );
}

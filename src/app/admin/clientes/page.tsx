import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { listCustomers } from "@/services/customer.service";
import { Icon } from "@/components/shared/Icon";
import { NewCustomerForm } from "@/components/admin/NewCustomerForm";

export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const customers = await listCustomers(q);

  return (
    <div className="apage">
      <div className="ahead">
        <div className="ahead-l">
          <h2>Clientes</h2>
          <div className="ahead-sub">{customers.length} registrados</div>
        </div>
      </div>

      <NewCustomerForm />

      <form className="asearch">
        <Icon name="search" size={17} />
        <input name="q" defaultValue={q ?? ""} placeholder="Buscar por nombre o email" />
      </form>

      {/* Desktop: tabla */}
      <div className="apanel only-desktop">
        <table className="atable">
          <thead><tr><th>Cliente</th><th>Contacto</th><th>Vehículos</th></tr></thead>
          <tbody>
            {customers.map((c) => {
              const initials = c.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
              return (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/clientes/${c.id}`} className="atable-cli" style={{ textDecoration: "none", color: "inherit" }}>
                      <span className="atable-av">{initials}</span>{c.name}
                    </Link>
                  </td>
                  <td>
                    <div className="atable-contact">
                      <span>{c.email}</span>
                      <span className="mono">{c.customerProfile?.phone ?? "—"}</span>
                    </div>
                  </td>
                  <td>{c.customerProfile?.vehicles.length ?? 0}</td>
                </tr>
              );
            })}
            {customers.length === 0 && <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>Sin clientes.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="only-mobile">
        <div className="alist">
        {customers.map((c) => {
          const initials = c.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
          return (
            <Link key={c.id} href={`/admin/clientes/${c.id}`} className="alist-card">
              <div className="alist-top">
                <span className="alist-title"><span className="atable-av">{initials}</span>{c.name}</span>
              </div>
              <div className="alist-meta">
                <span>{c.email}</span>
                <span className="mono">{c.customerProfile?.phone ?? "—"}</span>
                <span>{c.customerProfile?.vehicles.length ?? 0} veh.</span>
              </div>
            </Link>
          );
        })}
        {customers.length === 0 && <div className="alist-empty">Sin clientes.</div>}
        </div>
      </div>
    </div>
  );
}

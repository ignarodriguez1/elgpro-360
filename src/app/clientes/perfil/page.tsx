import Link from "next/link";
import { requireCustomer } from "@/lib/session";
import { getCustomerById } from "@/services/customer.service";
import { Icon } from "@/components/shared/Icon";
import { LogoutButton } from "@/components/customer/LogoutButton";

export default async function PerfilClientePage() {
  const user = await requireCustomer();
  const customer = await getCustomerById(user.id, user.id, user.role);

  const initials = user.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  const vehicleCount = customer.customerProfile?.vehicles.length ?? 0;
  const phone = customer.customerProfile?.phone ?? "—";
  const since = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(customer.createdAt));

  const rows = [
    { icon: "mail" as const, l: "Email", v: user.email },
    { icon: "phone" as const, l: "Teléfono", v: phone },
    { icon: "car" as const, l: "Vehículos", v: `${vehicleCount} ${vehicleCount === 1 ? "registrado" : "registrados"}` },
    { icon: "bell" as const, l: "Notificaciones", v: "Email activado" },
  ];

  return (
    <>
      {/* MOBILE */}
      <div className="only-mobile p-scroll">
        <div className="perf-head">
          <div className="perf-av">{initials}</div>
          <div>
            <div className="perf-name">{user.name}</div>
            <div className="perf-since">Cliente desde {since}</div>
          </div>
        </div>
        <div className="perf-list">
          {rows.map((r) => (
            <div className="perf-row" key={r.l}>
              <Icon name={r.icon} size={19} />
              <div className="perf-row-txt"><div className="perf-row-l">{r.l}</div><div className="perf-row-v">{r.v}</div></div>
            </div>
          ))}
        </div>
        <div className="perf-logout" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/" className="btn btn-ghost btn-block">
            <Icon name="home" size={17} /> Ver sitio público
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* DESKTOP */}
      <div className="only-desktop">
        <div className="pw-wrap" style={{ maxWidth: 720 }}>
          <div className="pw-greet pw-rise">
            <div className="pw-greet-name" style={{ fontSize: 44 }}>Mi perfil</div>
            <div className="pw-greet-sub">Cliente desde {since}</div>
          </div>
          <div className="pwsb" style={{ marginBottom: 16 }}>
            <div className="pwsb-h"><Icon name="user" size={15} /> Datos de la cuenta</div>
            {rows.map((r) => (
              <div className="pwsb-row" key={r.l}><span className="pwsb-k">{r.l}</span><span className="pwsb-v">{r.v}</span></div>
            ))}
          </div>
          <LogoutButton />
        </div>
      </div>
    </>
  );
}

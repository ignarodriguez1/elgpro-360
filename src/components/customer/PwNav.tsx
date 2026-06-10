"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { UserMenu } from "@/components/shared/UserMenu";

const TABS = [
  { href: "/clientes/dashboard", label: "Mis vehículos", match: ["/clientes/dashboard", "/clientes/vehiculos"] },
  { href: "/clientes/tutoriales", label: "Cuidados", match: ["/clientes/tutoriales"] },
  { href: "/clientes/perfil", label: "Perfil", match: ["/clientes/perfil"] },
];

/** Navbar DESKTOP del portal (.pw-nav) con tabs + menú de sesión global. */
export function PwNav({ name, email }: { name: string; email?: string | null }) {
  const pathname = usePathname();
  return (
    <header className="pw-nav">
      <div className="pw-nav-in">
        <Link href="/clientes/dashboard" className="pw-nav-logo">
          <Logo size={17} tagline />
          <span className="pw-nav-pill">Portal de clientes</span>
        </Link>
        <nav className="pw-nav-tabs">
          {TABS.map((t) => {
            const active = t.match.some((m) => pathname.startsWith(m));
            return (
              <Link key={t.href} href={t.href} className={"pw-tab" + (active ? " active" : "")}>
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="pw-nav-user">
          {/* PwNav solo se monta para clientes (el layout filtra el rol). */}
          <UserMenu name={name} email={email} role="CUSTOMER" />
        </div>
      </div>
    </header>
  );
}

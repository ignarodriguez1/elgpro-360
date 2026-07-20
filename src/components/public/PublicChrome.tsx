"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { Icon } from "@/components/shared/Icon";
import { UserMenu } from "@/components/shared/UserMenu";
import { useHeaderScroll } from "./useHeaderScroll";
import { scrollToTop } from "./scrollToTop";

type ChromeUser = { name: string | null; email: string | null; role: string } | null;

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/trabajos", label: "Trabajos" },
  { href: "/tutoriales", label: "Tutoriales" },
  { href: "/contacto", label: "Contacto" },
];

/** Navbar DESKTOP (.dnav): links inline + sesión global. Solo se muestra ≥1024px. */
export function PublicChrome({ user }: { user: ChromeUser }) {
  const pathname = usePathname();
  const { scrolled, hidden } = useHeaderScroll({ scrolledAt: 12 });

  return (
    <header
      className={"dnav" + (scrolled ? " scrolled" : "") + (hidden ? " dnav-hidden" : "")}
    >
      <Link
        href="/"
        className="dnav-logo"
        aria-label="Inicio"
        onClick={(e) => {
          // Estando ya en la home: no recargar, solo ir arriba de todo (SPA).
          if (pathname === "/") {
            e.preventDefault();
            scrollToTop();
          }
        }}
      >
        <Logo size={20} />
      </Link>
      <nav className="dnav-links">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={"dnav-link" + (pathname === l.href ? " active" : "")}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      {user ? (
        <UserMenu name={user.name} email={user.email} role={user.role} />
      ) : (
        <Link href="/clientes/login" className="dnav-cta">
          <Icon name="user" size={16} /> Acceso clientes
        </Link>
      )}
    </header>
  );
}

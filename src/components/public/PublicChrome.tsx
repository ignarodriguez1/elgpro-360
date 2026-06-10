"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { Icon } from "@/components/shared/Icon";
import { UserMenu } from "@/components/shared/UserMenu";

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
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={"dnav" + (scrolled ? " scrolled" : "")}>
      <Link href="/" className="dnav-logo" aria-label="Inicio">
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

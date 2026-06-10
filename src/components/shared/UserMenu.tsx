"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Icon, type IconName } from "@/components/shared/Icon";

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
  role: string;
  /** Variante visual del trigger: con nombre (desktop) o solo avatar (compacto). */
  compact?: boolean;
}

function initialsOf(name?: string | null): string {
  if (!name) return "?";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function roleLabel(role: string): string {
  if (role === "ADMIN") return "Administrador";
  if (role === "STAFF") return "Staff";
  if (role === "CUSTOMER") return "Cliente";
  return role;
}

interface MenuLink {
  href: string;
  label: string;
  icon: IconName;
}

/** Links de navegación según rol — saltos de área permitidos. */
function linksFor(role: string): MenuLink[] {
  if (role === "ADMIN" || role === "STAFF") {
    return [
      { href: "/admin", label: "Panel de administración", icon: "gauge" },
      { href: "/", label: "Ver sitio público", icon: "home" },
    ];
  }
  // CUSTOMER
  return [
    { href: "/clientes/dashboard", label: "Mi portal", icon: "car" },
    { href: "/", label: "Ver sitio público", icon: "home" },
  ];
}

/**
 * Barra/menú de sesión global. Server-first: recibe el usuario por props
 * (leído con auth() en el layout), no usa useSession ni SessionProvider.
 * Reutilizable en las 3 áreas; el logout siempre vuelve a la home pública.
 */
export function UserMenu({ name, email, role, compact = false }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const initials = initialsOf(name);
  const displayName = name?.trim() || roleLabel(role);

  return (
    <div className="umenu">
      <button
        type="button"
        className="umenu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={displayName}
      >
        {!compact && <span className="umenu-trigger-name">{displayName}</span>}
        <span className="umenu-av">{initials}</span>
      </button>

      {open && (
        <>
          <div className="umenu-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="umenu-pop" role="menu">
            <div className="umenu-head">
              <span className="umenu-head-av">{initials}</span>
              <div className="umenu-head-txt">
                <div className="umenu-head-name">{displayName}</div>
                {email && <div className="umenu-head-mail">{email}</div>}
                <span className="umenu-role">{roleLabel(role)}</span>
              </div>
            </div>

            <div className="umenu-list">
              {linksFor(role).map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="umenu-item"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <Icon name={l.icon} size={18} />
                  {l.label}
                </Link>
              ))}
              <div className="umenu-sep" />
              <button
                type="button"
                className="umenu-item danger"
                role="menuitem"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <Icon name="logout" size={18} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

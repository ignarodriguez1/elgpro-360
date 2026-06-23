"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/shared/Icon";
import { Logo } from "@/components/shared/Logo";
import { UserMenu } from "@/components/shared/UserMenu";
import { navScreensForRole, type ScreenDef, type AdminRole } from "@/lib/admin-sections";

interface AdminShellUser {
  name: string | null;
  email: string | null;
  role: string;
}

interface AdminShellProps {
  user: AdminShellUser;
  children: React.ReactNode;
}

const NAV_SECTIONS = ["Taller", "Contenido web"] as const;

function avatarInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** ¿La pantalla está activa para este pathname? */
function isActive(screen: ScreenDef, pathname: string): boolean {
  if (screen.route === "/admin") return pathname === "/admin";
  return pathname.startsWith(screen.route);
}

/**
 * La navegación se DERIVA de la fuente de verdad (admin-sections.ts) y se
 * FILTRA por rol: sidebar desktop y nav mobile consumen la misma lista, así
 * que una pantalla restringida (p. ej. Auditoría) desaparece de ambas para el
 * operario (STAFF). Contrato anti-drift + gating en un solo lugar.
 */
export function AdminShell({ user, children }: AdminShellProps) {
  const NAV = navScreensForRole(user.role as AdminRole);
  const pageTitle = (pathname: string): string =>
    NAV.find((s) => isActive(s, pathname))?.nav?.label ?? "Dashboard";

  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);

  // Cierra el menú mobile al cambiar de ruta (ajuste de estado durante el
  // render, mismo patrón que MobileChrome del sitio público).
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setMenuOpen(false);
  }

  const navLinks = (onNavigate?: () => void) =>
    NAV_SECTIONS.filter((sec) => NAV.some((s) => s.nav!.section === sec)).map((sec) => (
      <div key={sec}>
        <div className="asb-sec">{sec}</div>
        {NAV.filter((s) => s.nav!.section === sec).map((s) => {
          const active = isActive(s, pathname);
          return (
            <Link
              key={s.route}
              href={s.route}
              className={"asb-item" + (active ? " active" : "")}
              title={s.nav!.label}
              onClick={onNavigate}
            >
              <Icon name={s.nav!.icon as IconName} size={20} stroke={active ? 2.3 : 2} />
              <span className="asb-item-lbl">{s.nav!.label}</span>
            </Link>
          );
        })}
      </div>
    ));

  return (
    <div className="admin">
      {/* ===== CHROME MOBILE (<860px) — data-section: nav / logout / page-title ===== */}
      <div className="only-mobile">
        <header className="anav" data-section="page-title">
          <button
            className="anav-burger"
            onClick={() => setMenuOpen(true)}
            aria-label="Menú"
            type="button"
          >
            <Icon name="menu" size={22} stroke={2.2} />
          </button>
          <div className="anav-title">{pageTitle(pathname)}</div>
          <div data-section="logout">
            <UserMenu name={user.name} email={user.email} role={user.role} compact />
          </div>
        </header>

        <div
          className={"anav-overlay" + (menuOpen ? " open" : "")}
          aria-hidden={!menuOpen}
          data-section="nav"
        >
          <div className="anav-overlay-top">
            <Logo size={17} tagline />
            <button
              className="anav-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar"
              type="button"
            >
              <Icon name="close" size={22} stroke={2.2} />
            </button>
          </div>
          <nav className="anav-overlay-nav">{navLinks(() => setMenuOpen(false))}</nav>
          <div className="anav-overlay-foot">
            <div className="asb-user">
              <span className="asb-user-av">{avatarInitials(user.name)}</span>
              <div className="asb-user-txt">
                <div className="asb-user-name">{user.name ?? "Admin"}</div>
                <div className="asb-user-role">{user.role}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SIDEBAR DESKTOP ===== */}
      <aside className={"asb" + (collapsed ? " collapsed" : "")} data-section="nav">
        <div className="asb-top">
          <div className="asb-logo-full">
            <Logo size={17} tagline />
          </div>
          <div className="asb-logo-mini">
            E<b>P</b>
          </div>
          <button
            className="asb-collapse"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            type="button"
            data-section="sidebar-collapse"
          >
            <Icon name={collapsed ? "chevR" : "menu"} size={17} />
          </button>
        </div>

        <nav className="asb-nav">{navLinks()}</nav>

        <div className="asb-foot">
          <div className="asb-user">
            <span className="asb-user-av">{avatarInitials(user.name)}</span>
            <div className="asb-user-txt">
              <div className="asb-user-name">{user.name ?? "Admin"}</div>
              <div className="asb-user-role">{user.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="amain">
        {/* TOPBAR DESKTOP */}
        <div className="atop">
          <div className="atop-l">
            <div className="atop-title" data-section="page-title">{pageTitle(pathname)}</div>
          </div>
          <div className="atop-r">
            {/* Buscador global y campana de notificaciones removidos: eran controles
                muertos (input sin handler; campana con punto rojo que fingía novedades
                y sin onClick). La búsqueda de OT real es otro tranche. */}
            <div data-section="logout">
              <UserMenu name={user.name} email={user.email} role={user.role} />
            </div>
          </div>
        </div>

        <div className="acontent">{children}</div>
      </div>
    </div>
  );
}

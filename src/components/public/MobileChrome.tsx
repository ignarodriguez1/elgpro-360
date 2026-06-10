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

/** Navbar MOBILE (.navbar) + menú overlay. Solo se muestra <1024px. */
export function MobileChrome({ user }: { user: ChromeUser }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);

  // Cierra el menú al cambiar de ruta. Ajuste de estado DURANTE el render
  // (patrón recomendado por React) en vez de un effect que llama a setState.
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={"navbar" + (scrolled ? " is-scrolled" : "")}>
        <Link href="/" className="nav-logo-btn" aria-label="Inicio">
          <Logo size={18} />
        </Link>
        <div className="nav-actions">
          {user ? (
            <UserMenu name={user.name} email={user.email} role={user.role} compact />
          ) : (
            <Link href="/clientes/login" className="nav-access">
              <Icon name="user" size={16} stroke={2.2} />
              <span>Clientes</span>
            </Link>
          )}
          <button className="nav-burger" onClick={() => setOpen(true)} aria-label="Menú">
            <Icon name="menu" size={24} stroke={2.2} />
          </button>
        </div>
      </header>

      <div className={"menu-overlay" + (open ? " open" : "")} aria-hidden={!open}>
        <div className="menu-top">
          <Logo size={18} tagline />
          <button className="menu-close" onClick={() => setOpen(false)} aria-label="Cerrar">
            <Icon name="close" size={24} stroke={2.2} />
          </button>
        </div>
        <nav className="menu-links">
          {NAV_LINKS.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              className={"menu-link" + (pathname === l.href ? " active" : "")}
              onClick={() => setOpen(false)}
            >
              <span className="menu-link-n mono">0{i + 1}</span>
              <span>{l.label}</span>
              <Icon name="arrowUR" size={20} className="menu-link-ar" />
            </Link>
          ))}
        </nav>
        <div className="menu-foot">
          <Link href="/contacto" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
            Solicitar cotización
          </Link>
          {!user && (
            <Link href="/clientes/login" className="btn btn-ghost btn-block">
              <Icon name="user" size={17} /> Acceso clientes
            </Link>
          )}
          <div className="menu-contact">
            <a href="https://wa.me/5493415550142" target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={16} /> +54 341 555-0142
            </a>
            <a href="https://instagram.com/elgpro.detail" target="_blank" rel="noopener noreferrer">
              <Icon name="instagram" size={16} /> @elgpro.detail
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

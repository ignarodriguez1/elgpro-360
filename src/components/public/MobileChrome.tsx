"use client";

import { useState, useEffect, useRef } from "react";
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

/** Navbar MOBILE (.navbar) + menú overlay. Solo se muestra <1024px. */
export function MobileChrome({ user }: { user: ChromeUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);
  const { scrolled, hidden } = useHeaderScroll({ scrolledAt: 10 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // El menú se cerró porque el usuario lo descartó (Escape / botón cerrar), no
  // porque navegó. Solo en ese caso corresponde devolver el foco al burger.
  const dismissRef = useRef(false);
  // Ref "último valor": el cleanup necesita la ruta ACTUAL, y en una navegación
  // corre después del render pero antes de los effects. Por eso se escribe acá.
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  // Cierra el menú al cambiar de ruta. Ajuste de estado DURANTE el render
  // (patrón recomendado por React) en vez de un effect que llama a setState.
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setOpen(false);
  }

  // Menú abierto = diálogo modal: bloquear el scroll de fondo, atrapar el foco,
  // cerrar con Escape y devolver el foco al burger al cerrar. Solo corre cuando
  // el overlay está visible; en desktop `open` nunca es true (burger oculto).
  useEffect(() => {
    if (!open) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const openPath = pathRef.current;
    dismissRef.current = false;

    const focusables = () =>
      Array.from(
        overlay.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);
    const target = () => closeRef.current ?? overlay;

    // Enfocar el botón de cerrar ANTES de fijar el body: el lock de scroll
    // interfiere con focus(). `preventScroll` evita el scroll inducido por el
    // foco, que pelearía con el desplazamiento del lock.
    target().focus({ preventScroll: true });

    // Bloqueo de scroll que PRESERVA la posición: fijar el body desplazado por
    // -scrollY (overflow:hidden a secas salta al top y pierde el lugar).
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    // Reasegurar el foco unos frames por si el commit o el lock lo desplazaron.
    let tries = 0;
    let raf = requestAnimationFrame(function ensure() {
      if (overlay.contains(document.activeElement)) return;
      target().focus({ preventScroll: true });
      if (!overlay.contains(document.activeElement) && tries++ < 20) {
        raf = requestAnimationFrame(ensure);
      }
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismissRef.current = true;
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      // El foco quedó FUERA del overlay (p.ej. se tocó una zona vacía y cayó en
      // el contenedor o el body). Antes esto caía por el else sin preventDefault
      // y Shift+Tab se escapaba al header vivo debajo del panel.
      if (i === -1) {
        e.preventDefault();
        (e.shiftKey ? items[items.length - 1] : items[0]).focus();
        return;
      }
      if (e.shiftKey && i === 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && i === items.length - 1) {
        e.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      // Restaurar el scroll SOLO si seguimos en la misma página. Si el menú se
      // cerró por una navegación (link o gesto Back), replayar el offset viejo
      // te deja 2000px abajo en la página destino, sin contexto.
      if (pathRef.current === openPath) window.scrollTo(0, scrollY);
      // Devolver el foco al burger SOLO si el usuario descartó el menú. Si navegó,
      // aterrizar en "Abrir menú" es desorientador para un lector de pantalla.
      if (dismissRef.current) burgerRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <>
      {/* inert mientras el menú está abierto: `aria-modal` esconde el fondo de las
          ayudas técnicas pero NO afecta el orden de tabulación secuencial. Sin
          esto, el trap de JS era la única defensa contra tabular a controles
          invisibles debajo del panel opaco. */}
      <header
        inert={open}
        className={"navbar" + (scrolled ? " is-scrolled" : "") + (hidden ? " nav-hidden" : "")}
      >
        <Link
          href="/"
          className="nav-logo-btn"
          aria-label="Inicio"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              scrollToTop();
            }
          }}
        >
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
          <button
            ref={burgerRef}
            className="nav-burger"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <Icon name="menu" size={24} stroke={2.2} />
          </button>
        </div>
      </header>

      <div
        ref={overlayRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        tabIndex={-1}
        inert={!open}
        className={"menu-overlay" + (open ? " open" : "")}
      >
        <div className="menu-top">
          <Logo size={18} tagline />
          <button
            ref={closeRef}
            className="menu-close"
            onClick={() => {
              dismissRef.current = true;
              setOpen(false);
            }}
            aria-label="Cerrar menú"
          >
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
        </div>
      </div>
    </>
  );
}

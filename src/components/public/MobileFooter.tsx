import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Icon } from "@/components/shared/Icon";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/trabajos", label: "Trabajos" },
  { href: "/tutoriales", label: "Tutoriales" },
  { href: "/contacto", label: "Contacto" },
];

/** Footer MOBILE (.footer), portado de components.jsx. Solo <1024px. */
export function MobileFooter() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <Logo size={30} tagline location />
      </div>
      <p className="footer-tag">
        La historia clínica de tu auto y el seguimiento del trabajo, en un solo lugar.
      </p>
      <div className="footer-grid">
        <div className="footer-col">
          <span className="footer-h">Navegación</span>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </div>
        <div className="footer-col">
          <span className="footer-h">Contacto</span>
          <a href="#"><Icon name="pin" size={15} /> Bv. Oroño 1234, Rosario</a>
          <a href="#"><Icon name="phone" size={15} /> +54 341 555-0142</a>
          <a href="#"><Icon name="mail" size={15} /> hola@elgpro.com.ar</a>
          <a href="#"><Icon name="clock" size={15} /> Lun a Vie · 8:30–18:00</a>
        </div>
      </div>
      <div className="footer-social">
        <a href="#" aria-label="Instagram"><Icon name="instagram" size={20} /></a>
        <a href="#" aria-label="WhatsApp"><Icon name="whatsapp" size={20} /></a>
        <a href="#" aria-label="Mail"><Icon name="mail" size={20} /></a>
      </div>
      <div className="footer-legal">
        <span>© 2026 ELG Pro · Paint &amp; Detail</span>
        <span className="mono">Rosario, Santa Fe · AR</span>
      </div>
    </footer>
  );
}

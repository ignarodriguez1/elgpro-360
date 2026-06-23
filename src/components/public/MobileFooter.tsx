import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Icon } from "@/components/shared/Icon";
import { CONTACT } from "@/lib/contact";

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
      <div className="footer-grid rise">
        <div className="footer-col">
          <span className="footer-h">Navegación</span>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </div>
        <div className="footer-col">
          <span className="footer-h">Contacto</span>
          <span><Icon name="pin" size={15} /> Rosario, Santa Fe</span>
          <a href={`tel:+${CONTACT.whatsappNumber}`}><Icon name="phone" size={15} /> {CONTACT.whatsappDisplay}</a>
          <a href={`mailto:${CONTACT.email}`}><Icon name="mail" size={15} /> {CONTACT.email}</a>
          <span><Icon name="clock" size={15} /> Lun a Vie · 8:30–18:00</span>
        </div>
      </div>
      <div className="footer-social">
        <a href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Icon name="instagram" size={20} /></a>
        <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><Icon name="whatsapp" size={20} /></a>
        <a href={`mailto:${CONTACT.email}`} aria-label="Mail"><Icon name="mail" size={20} /></a>
      </div>
      <div className="footer-legal">
        <span>© 2026 ELG Pro · Paint &amp; Detail</span>
        <span className="mono">Rosario, Santa Fe · AR</span>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Icon } from "@/components/shared/Icon";
import { CONTACT } from "@/lib/contact";
import { listServices } from "@/services/service.service";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/trabajos", label: "Trabajos" },
  { href: "/tutoriales", label: "Tutoriales" },
  { href: "/contacto", label: "Contacto" },
];

/** Footer desktop (.dfooter), portado del prototipo. */
export async function Footer() {
  const services = await listServices(false);
  return (
    <footer className="dfooter">
      <div className="wrap">
        <div className="dfooter-top">
          <div>
            <Logo size={34} tagline location />
            <p className="dfooter-tag">
              La historia clínica de tu auto y el seguimiento del trabajo, en un solo lugar.
              Rosario, Santa Fe.
            </p>
          </div>
          <div className="dfooter-col">
            <span className="dfooter-h">Navegación</span>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </div>
          <div className="dfooter-col">
            <span className="dfooter-h">Servicios</span>
            {services.slice(0, 5).map((s) => (
              <Link key={s.id} href="/servicios">{s.name}</Link>
            ))}
          </div>
          <div className="dfooter-col">
            <span className="dfooter-h">Contacto</span>
            <span><Icon name="pin" size={15} /> Rosario, Santa Fe</span>
            <a href={`tel:+${CONTACT.whatsappNumber}`}><Icon name="phone" size={15} /> {CONTACT.whatsappDisplay}</a>
            <a href={`mailto:${CONTACT.email}`}><Icon name="mail" size={15} /> {CONTACT.email}</a>
            <span><Icon name="clock" size={15} /> Lun a Vie · 8:30–18:00</span>
          </div>
        </div>
        <div className="dfooter-bot">
          <span>© 2026 ELG Pro · Paint &amp; Detail</span>
          <div className="dfooter-social">
            <a href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Icon name="instagram" size={19} /></a>
            <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><Icon name="whatsapp" size={19} /></a>
            <a href={`mailto:${CONTACT.email}`} aria-label="Mail"><Icon name="mail" size={19} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

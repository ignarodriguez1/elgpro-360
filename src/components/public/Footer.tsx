import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Icon } from "@/components/shared/Icon";
import { SERVICES } from "@/lib/public-data";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/trabajos", label: "Trabajos" },
  { href: "/tutoriales", label: "Tutoriales" },
  { href: "/contacto", label: "Contacto" },
];

/** Footer desktop (.dfooter), portado del prototipo. */
export function Footer() {
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
            {SERVICES.slice(0, 5).map((s) => (
              <Link key={s.name} href="/servicios">{s.name}</Link>
            ))}
          </div>
          <div className="dfooter-col">
            <span className="dfooter-h">Contacto</span>
            <a href="#"><Icon name="pin" size={15} /> Bv. Oroño 1234, Rosario</a>
            <a href="#"><Icon name="phone" size={15} /> +54 341 555-0142</a>
            <a href="#"><Icon name="mail" size={15} /> hola@elgpro.com.ar</a>
            <a href="#"><Icon name="clock" size={15} /> Lun a Vie · 8:30–18:00</a>
          </div>
        </div>
        <div className="dfooter-bot">
          <span>© 2026 ELG Pro · Paint &amp; Detail</span>
          <div className="dfooter-social">
            <a href="#" aria-label="Instagram"><Icon name="instagram" size={19} /></a>
            <a href="#" aria-label="WhatsApp"><Icon name="whatsapp" size={19} /></a>
            <a href="#" aria-label="Mail"><Icon name="mail" size={19} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

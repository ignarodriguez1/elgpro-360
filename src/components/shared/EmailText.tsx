import { CONTACT } from "@/lib/contact";

/**
 * El email con una oportunidad de corte de línea en el "@".
 *
 * Sin esto no hay ancho que alcance: es un token de 30 caracteres sin espacios,
 * así que en columnas angostas (el footer mobile, las cards a 320px) o desborda
 * o el browser lo parte donde se llena el renglón — "administracionelgpro@g /
 * mail.com". El `<wbr>` le da al browser el único corte que se lee bien, y es
 * inerte cuando el email entra completo.
 *
 * Va junto con `overflow-wrap:break-word` (NO `anywhere`) en quien lo contenga:
 * `anywhere` ignora esta oportunidad y corta igual al medio.
 */
export function EmailText() {
  const [user, domain] = CONTACT.email.split("@");
  return (
    <>
      {user}
      <wbr />@{domain}
    </>
  );
}

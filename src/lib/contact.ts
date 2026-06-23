/**
 * Fuente única de verdad de los canales de contacto reales del taller.
 * Usado por la web pública (contacto, footers) y el portal del cliente.
 * Si cambia un dato, se toca SOLO acá.
 */
export const CONTACT = {
  whatsappNumber: "5493416150712", // E.164 sin "+" para wa.me
  whatsappUrl: "https://wa.me/5493416150712",
  whatsappDisplay: "+54 9 3416 15-0712",
  email: "administracionelgpro@gmail.com",
  instagramUrl: "https://www.instagram.com/elgpro/",
  instagramDisplay: "@elgpro",
} as const;

/** Arma el link de WhatsApp con un mensaje prellenado opcional. */
export function whatsappUrl(text?: string): string {
  return text
    ? `${CONTACT.whatsappUrl}?text=${encodeURIComponent(text)}`
    : CONTACT.whatsappUrl;
}

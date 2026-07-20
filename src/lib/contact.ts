/**
 * Fuente única de verdad de los canales de contacto reales del taller.
 * Usado por la web pública (contacto, footers) y el portal del cliente.
 * Si cambia un dato, se toca SOLO acá.
 */

// Coordenadas del local verificadas contra OpenStreetMap (way 301584417).
// Son la fuente del mapa estático public/mapa-taller.webp: si estas cambian,
// el mapa queda mintiendo → hay que regenerarlo, no solo editar el número.
const LAT = -32.9620261;
const LON = -60.6537073;

export const CONTACT = {
  whatsappNumber: "5493416150712", // E.164 sin "+" para wa.me
  whatsappUrl: "https://wa.me/5493416150712",
  whatsappDisplay: "+54 9 3416 15-0712",
  email: "administracionelgpro@gmail.com",
  instagramUrl: "https://www.instagram.com/elgpro/",
  instagramDisplay: "@elgpro",
  // La calle es oficialmente "Manuel Dorrego"; se muestra "Dorrego" porque es
  // como la nombra y la busca todo Rosario.
  addressStreet: "Dorrego 2298",
  addressCity: "Rosario, Santa Fe",
  addressFull: "Dorrego 2298, Rosario, Santa Fe",
  lat: LAT,
  lon: LON,
  /** Abre la ubicación en Google Maps para MIRARLA (vista del lugar). No arranca
   *  navegación: es el destino del click en el mapa. */
  mapUrl: `https://www.google.com/maps/search/?api=1&query=${LAT},${LON}`,
  /** Abre la app de mapas del usuario con la RUTA hacia el taller (cómo llegar). */
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LON}`,
} as const;

/** Arma el link de WhatsApp con un mensaje prellenado opcional. */
export function whatsappUrl(text?: string): string {
  return text
    ? `${CONTACT.whatsappUrl}?text=${encodeURIComponent(text)}`
    : CONTACT.whatsappUrl;
}

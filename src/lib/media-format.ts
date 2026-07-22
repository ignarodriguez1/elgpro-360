/**
 * Detección de HEIC/HEIF (formato de foto por defecto del iPhone). La web no
 * puede mostrarlo: Chrome/Firefox no lo decodifican, así que "sube bien y no se
 * ve nunca" — el peor modo de falla (informe §4.1: ya hay 2 HEIC huérfanos en
 * el bucket). Decisión tomada: RECHAZAR, no transcodificar.
 *
 * Detección por MIME **y** por extensión, porque el `type` del File no alcanza:
 * según el navegador/OS puede venir vacío o como application/octet-stream para
 * HEIC. Cualquiera de las dos señales positivas → rechazo.
 * Módulo puro sin dependencias de browser: lo comparten los pickers del cliente
 * y la validación server-side de /api/upload (defensa en profundidad).
 */

const HEIC_MIMES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const HEIC_EXTENSION = /\.(heic|heif)$/i;

/** Mensaje accionable para el dueño del taller: qué hacer, no qué pasó. */
export const HEIC_REJECTION_MESSAGE =
  "Esta foto está en un formato del iPhone que no se puede mostrar en la web. " +
  "En el iPhone: Ajustes → Cámara → Formatos → elegí «Más compatible» y sacá la foto de nuevo.";

export function isHeicFile(filename: string, mimeType: string): boolean {
  if (HEIC_MIMES.has(mimeType.trim().toLowerCase())) return true;
  return HEIC_EXTENSION.test(filename.trim());
}

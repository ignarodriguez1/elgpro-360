/**
 * Sanea un destino de redirect post-login contra open redirect (req. 8).
 * Solo permite paths internos del propio sitio: deben empezar con "/" y NO ser
 * "//" (que el navegador interpreta como otra autoridad) ni contener esquema.
 * Cualquier otra cosa cae al `fallback`.
 */
export function safeInternalPath(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  // Rechaza "//evil.com", "/\evil.com", esquemas ("http:", "javascript:") y back-slashes.
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (raw.includes("\\")) return fallback;
  return raw;
}

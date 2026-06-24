import { headers } from "next/headers";

/**
 * Origin absoluto de la request actual (para construir links en emails).
 * Deriva del header `host` — más confiable que una env var de dominio que puede
 * quedar como placeholder.
 */
export async function currentOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

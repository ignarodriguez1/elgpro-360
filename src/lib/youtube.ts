/**
 * Helpers para embeber videos de YouTube. El admin pega cualquier URL de YouTube
 * en el editor; acá extraemos el ID y armamos la URL de embed / la miniatura.
 * Si la URL no es de YouTube (o no se puede parsear) devolvemos null → la UI cae
 * al link-out (no rompe).
 */

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Extrae el ID de video (11 chars) de una URL de YouTube. null si no aplica. */
export function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return ID_RE.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      return id && ID_RE.test(id) ? id : null;
    }
    // /embed/ID · /shorts/ID · /v/ID · /live/ID
    const m = u.pathname.match(/^\/(?:embed|shorts|v|live)\/([^/?#]+)/);
    if (m && ID_RE.test(m[1])) return m[1];
  }

  return null;
}

/** URL de embed (dominio nocookie: no setea cookies hasta reproducir). */
export function youtubeEmbedUrl(id: string, autoplay = false): string {
  const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
  if (autoplay) params.set("autoplay", "1");
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

/** Miniatura del video (siempre disponible). */
export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Miniatura directo desde una URL; null si no es un video de YouTube válido. */
export function youtubeThumbFromUrl(url: string | null | undefined): string | null {
  const id = getYouTubeId(url);
  return id ? youtubeThumb(id) : null;
}

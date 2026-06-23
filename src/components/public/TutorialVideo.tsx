"use client";

import { useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { Photo } from "@/components/shared/Photo";
import { getYouTubeId, youtubeEmbedUrl, youtubeThumb } from "@/lib/youtube";

const WRAP_STYLE = { borderRadius: 16, overflow: "hidden", marginBottom: 28 } as const;

/**
 * Bloque de video del tutorial. Para YouTube usa un "facade": muestra la miniatura
 * real + botón play y solo carga el iframe (autoplay) al hacer click — más rápido y
 * sin cookies de YouTube hasta reproducir. Si no hay video, placeholder; si la URL
 * no es de YouTube, cae al link-out (abre en pestaña nueva).
 */
export function TutorialVideo({ url }: { url: string | null }) {
  const [playing, setPlaying] = useState(false);
  const id = getYouTubeId(url);

  // Sin video → placeholder decorativo (igual que antes).
  if (!url) {
    return (
      <div className="dtuto-thumb-wrap" style={WRAP_STYLE}>
        <Photo className="dtuto-thumb" tint="rgba(196,30,42,.18)" grad style={{ aspectRatio: "16/9" }} />
        <span className="dtuto-play"><Icon name="play" size={24} /></span>
      </div>
    );
  }

  // No es YouTube → link-out (comportamiento anterior, no rompe).
  if (!id) {
    return (
      <div className="dtuto-thumb-wrap" style={WRAP_STYLE}>
        <Photo className="dtuto-thumb" tint="rgba(196,30,42,.18)" grad style={{ aspectRatio: "16/9" }} />
        <a href={url} target="_blank" rel="noopener noreferrer" className="dtuto-play" aria-label="Ver video">
          <Icon name="play" size={24} />
        </a>
      </div>
    );
  }

  // YouTube reproduciéndose dentro de la app.
  if (playing) {
    return (
      <div className="dtuto-thumb-wrap" style={{ ...WRAP_STYLE, aspectRatio: "16/9" }}>
        <iframe
          src={youtubeEmbedUrl(id, true)}
          title="Video del tutorial"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        />
      </div>
    );
  }

  // Facade: miniatura de YouTube + botón play (carga el iframe al tocar).
  return (
    <div className="dtuto-thumb-wrap" style={WRAP_STYLE}>
      <Photo src={youtubeThumb(id)} className="dtuto-thumb" tint="rgba(0,0,0,.12)" style={{ aspectRatio: "16/9" }} />
      <button type="button" onClick={() => setPlaying(true)} className="dtuto-play" aria-label="Reproducir video">
        <Icon name="play" size={24} />
      </button>
    </div>
  );
}

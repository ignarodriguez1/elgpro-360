"use client";

import { Icon } from "./Icon";
import { Photo } from "./Photo";

export interface LightboxPhoto {
  src?: string;
  caption?: string | null;
  sub?: string | null;
  tint?: string;
}

interface LightboxProps {
  photos: LightboxPhoto[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

/** Visor de fotos full-screen (portado de .p-lb del prototipo). */
export function Lightbox({ photos, index, onClose, onIndexChange }: LightboxProps) {
  if (index < 0 || !photos[index]) return null;
  const p = photos[index];

  return (
    <div className="p-lb" onClick={onClose}>
      <div className="p-lb-top">
        <span className="p-lb-count">
          {index + 1} / {photos.length}
        </span>
        <button className="p-lb-close" onClick={onClose} aria-label="Cerrar">
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className="p-lb-stage" onClick={(e) => e.stopPropagation()}>
        <Photo src={p.src} tint={p.tint} className="p-lb-photo" />
        {photos.length > 1 && (
          <>
            <button
              className="p-lb-nav p-lb-prev"
              onClick={() => onIndexChange((index - 1 + photos.length) % photos.length)}
              aria-label="Anterior"
            >
              <Icon name="chevR" size={20} style={{ transform: "scaleX(-1)" }} />
            </button>
            <button
              className="p-lb-nav p-lb-next"
              onClick={() => onIndexChange((index + 1) % photos.length)}
              aria-label="Siguiente"
            >
              <Icon name="chevR" size={20} />
            </button>
          </>
        )}
      </div>

      {(p.caption || p.sub) && (
        <div className="p-lb-cap">
          {p.caption && <div className="p-lb-cap-t">{p.caption}</div>}
          {p.sub && <div className="p-lb-cap-d">{p.sub}</div>}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Photo } from "./Photo";
import { Lightbox, type LightboxPhoto } from "./Lightbox";

interface GalleryPhoto {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
}

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
  columns?: number;
}

/** Grid de miniaturas con lightbox (portado del prototipo). */
export function PhotoGallery({ photos, columns = 4 }: PhotoGalleryProps) {
  const [index, setIndex] = useState(-1);

  if (photos.length === 0) return null;

  const lbPhotos: LightboxPhoto[] = photos.map((p) => ({
    src: p.imageUrl,
    caption: p.caption,
  }));

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 8,
        }}
      >
        {photos.map((p, i) => (
          <Photo
            key={p.id}
            src={p.thumbnailUrl || p.imageUrl}
            className="tl-photo"
            onClick={() => setIndex(i)}
          />
        ))}
      </div>

      <Lightbox
        photos={lbPhotos}
        index={index}
        onClose={() => setIndex(-1)}
        onIndexChange={setIndex}
      />
    </>
  );
}

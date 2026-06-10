"use client";

import { useState, useRef, useEffect, type CSSProperties } from "react";

interface PhotoProps {
  src?: string;
  alt?: string;
  label?: string;
  tint?: string;
  ratio?: string;
  className?: string;
  style?: CSSProperties;
  grad?: boolean;
  onClick?: () => void;
}

/**
 * Imagen con fallback a gradiente oscuro diseñado (portado del prototipo).
 * Si la imagen carga, hace fade-in; si falla o no hay src, queda el fill premium.
 */
export function Photo({
  src,
  alt = "",
  label,
  tint,
  ratio,
  className = "",
  style = {},
  grad,
  onClick,
}: PhotoProps) {
  const [ok, setOk] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Caso borde clásico de SSR + caché: si la imagen ya terminó de cargar
  // ANTES de que React enganche el onLoad (porque ya estaba cacheada o cargó
  // durante la hidratación), el evento `load` ya pasó y onLoad no se dispara,
  // dejando la imagen en opacity:0 hasta una recarga/re-render. Al montar
  // chequeamos si ya está completa y la mostramos igual.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setOk(true);
    }
  }, [src]);

  const wrapStyle: CSSProperties = { ...style };
  if (ratio) wrapStyle.aspectRatio = ratio;
  if (tint) (wrapStyle as Record<string, string>)["--ph-tint"] = tint;

  return (
    <div className={"photo " + className} style={wrapStyle} onClick={onClick}>
      <div className="ph-fill" />
      {label && !ok && <span className="ph-label">{label}</span>}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          className={ok ? "loaded" : ""}
          onLoad={() => setOk(true)}
          onError={() => setOk(false)}
        />
      )}
      {grad && <div className="grad-top" />}
    </div>
  );
}

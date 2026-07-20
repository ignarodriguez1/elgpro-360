import { Photo } from "@/components/shared/Photo";

/**
 * Fondo del hero desktop. Ya NO es una isla cliente: el parallax por puntero se
 * retiró (movía ±3.8px en el interior, sub-umbral para el costo de un rAF + 2
 * listeners; decisión de restraint). El wrapper `.dhero-bg-layer` se conserva como
 * contenedor de posicionamiento; el parallax de SCROLL sigue viviendo en `.dhero-bg`
 * (CSS scroll-driven, compositor). Como no hay interactividad, es server component.
 */
export function HeroBg({ src, tint }: { src: string; tint?: string }) {
  return (
    <div className="dhero-bg-layer">
      <Photo src={src} className="dhero-bg" tint={tint} priority />
    </div>
  );
}

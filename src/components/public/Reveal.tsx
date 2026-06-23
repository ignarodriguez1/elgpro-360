"use client";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Wrapper de revelado on-scroll. El observer global (RevealRoot) le agrega `.in`
 * cuando entra al viewport; acá solo fijamos el `transition-delay` para el stagger.
 *
 * Antes tenía su propio IntersectionObserver + fallback de 1400ms, pero RevealRoot
 * ya cubre todos los `.rise`/`.drise` del sitio público — mantenerlo acá revelaba
 * el contenido de más abajo antes de tiempo. Ahora es presentacional.
 */
export function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  return (
    <div className={"rise " + className} style={{ transitionDelay: delay + "ms" }}>
      {children}
    </div>
  );
}

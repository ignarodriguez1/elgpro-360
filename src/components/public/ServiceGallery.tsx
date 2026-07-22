"use client";

import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/shared/Photo";
import { Icon } from "@/components/shared/Icon";

const nn = (n: number) => String(n).padStart(2, "0");

export interface ServiceGalleryImage {
  url: string;
  alt: string | null;
}

/**
 * Galería de la página de detalle de servicio (/servicios/[slug]).
 *
 * Grilla asimétrica (la primera imagen manda) + lightbox modal. El lightbox
 * PORTA el patrón bueno que ya shippea WorkStack — role=dialog, aria-modal,
 * focus trap, Escape, scroll-lock con restauración de posición y foco — y NO el
 * de /trabajos (que no tiene nada de eso; informe §4.10). Suma navegación por
 * flechas ← →, que ninguno de los dos tenía.
 *
 * Reusa las clases de lightbox existentes (.dlightbox/.lb-*): mismo look, misma
 * animación de entrada one-shot ya definida en public.css. Cero loops infinitos
 * (principio de honestidad). `variant` porque vive en los DOS árboles del DOM.
 */
export function ServiceGallery({
  serviceName,
  images,
  variant,
}: {
  serviceName: string;
  images: ServiceGalleryImage[];
  variant: "desktop" | "mobile";
}) {
  const lbRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [lb, setLb] = useState<number | null>(null);
  const isOpen = lb !== null;
  const count = images.length;

  useEffect(() => {
    if (!isOpen) return;
    const inner = lbRef.current;

    const focusables = () =>
      inner
        ? Array.from(
            inner.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => el.offsetParent !== null)
        : [];
    const raf = requestAnimationFrame(() =>
      (focusables()[0] ?? inner)?.focus({ preventScroll: true })
    );

    // Scroll-lock que preserva la posición (misma técnica que WorkStack/menú mobile).
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setLb(null);
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const d = e.key === "ArrowRight" ? 1 : -1;
        setLb((cur) => (cur === null ? cur : (cur + d + count) % count));
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (i === -1) {
        e.preventDefault();
        (e.shiftKey ? items[items.length - 1] : items[0]).focus();
        return;
      }
      if (e.shiftKey && i === 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && i === items.length - 1) {
        e.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen, count]);

  const open = (i: number, el: HTMLElement) => {
    triggerRef.current = el;
    setLb(i);
  };
  const close = () => setLb(null);
  const go = (d: number) => setLb((cur) => (cur === null ? cur : (cur + d + count) % count));

  const altOf = (i: number) => images[i].alt || `${serviceName} — foto ${i + 1}`;
  const img = lb !== null ? images[lb] : null;

  const gridClass = variant === "desktop" ? "dsg-grid" : "sg-grid";
  const itemClass = variant === "desktop" ? "dsg-item drise" : "sg-item rise";

  return (
    <>
      <div className={gridClass}>
        {images.map((im, i) => (
          <button
            key={im.url + i}
            type="button"
            className={itemClass}
            onClick={(e) => open(i, e.currentTarget)}
            aria-label={`Ver en grande: ${altOf(i)}`}
          >
            <Photo src={im.url} alt={altOf(i)} />
            <span className={variant === "desktop" ? "mono sg-count" : "mono sg-count"} aria-hidden="true">
              {nn(i + 1)}
            </span>
            {variant === "desktop" && (
              <span className="dsg-zoom" aria-hidden="true">
                <Icon name="search" size={15} />
              </span>
            )}
          </button>
        ))}
      </div>

      {img && variant === "desktop" && (
        <div className="dlightbox" onClick={close} role="dialog" aria-modal="true" aria-label={serviceName}>
          <div className="dlb-inner" ref={lbRef} onClick={(e) => e.stopPropagation()}>
            <button className="dlb-close" onClick={close} aria-label="Cerrar">
              <Icon name="close" size={22} />
            </button>
            <div className="dlb-stage">
              <Photo key={lb} src={img.url} className="dlb-photo" alt={altOf(lb!)} />
              {count > 1 && (
                <>
                  <button className="dlb-nav dlb-prev" onClick={() => go(-1)} aria-label="Anterior">
                    <Icon name="chevR" size={22} style={{ transform: "rotate(180deg)" }} />
                  </button>
                  <button className="dlb-nav dlb-next" onClick={() => go(1)} aria-label="Siguiente">
                    <Icon name="chevR" size={22} />
                  </button>
                </>
              )}
            </div>
            <div className="dlb-side">
              <span className="dlb-cat">Galería</span>
              <h3>{serviceName}</h3>
              <span className="mono dlb-count">
                {nn(lb! + 1)} / {nn(count)}
              </span>
              {img.alt && (
                <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6, margin: 0 }}>{img.alt}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {img && variant === "mobile" && (
        <div className="lightbox open" onClick={close} role="dialog" aria-modal="true" aria-label={serviceName}>
          <div className="lb-inner" ref={lbRef} onClick={(e) => e.stopPropagation()}>
            <button className="lb-close" onClick={close} aria-label="Cerrar">
              <Icon name="close" size={22} />
            </button>
            <div className="lb-stage">
              <Photo key={lb} src={img.url} className="lb-photo" alt={altOf(lb!)} />
              {count > 1 && (
                <>
                  <button className="lb-nav lb-prev" onClick={() => go(-1)} aria-label="Anterior">
                    <Icon name="chevR" size={22} style={{ transform: "rotate(180deg)" }} />
                  </button>
                  <button className="lb-nav lb-next" onClick={() => go(1)} aria-label="Siguiente">
                    <Icon name="chevR" size={22} />
                  </button>
                </>
              )}
            </div>
            <div className="lb-info">
              <span className="work-cat">Galería · {nn(lb! + 1)} / {nn(count)}</span>
              <h3 className="display">{serviceName}</h3>
              {img.alt && <p className="kicker">{img.alt}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

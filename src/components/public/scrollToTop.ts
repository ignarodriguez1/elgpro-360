/**
 * Scroll suave al tope, controlado por rAF (duración capada). El smooth nativo
 * en una página larga se arrastra; esto mantiene un tiempo premium y consistente.
 * Respeta prefers-reduced-motion (salto instantáneo).
 *
 * Uso: en el click del logo, si ya estás en "/", preventDefault + scrollToTop()
 * → comportamiento SPA (sin recarga, va arriba de todo).
 */
export function scrollToTop() {
  const start = window.scrollY;
  if (start <= 0) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, 0);
    return;
  }
  const dur = Math.min(850, 300 + start * 0.09);
  const t0 = performance.now();
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / dur);
    window.scrollTo(0, Math.round(start * (1 - easeOutCubic(p))));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

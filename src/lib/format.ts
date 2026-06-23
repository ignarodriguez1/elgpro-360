/* ============================================================
   Formateo de fecha/hora DETERMINÍSTICO (server === client).

   `toLocaleDateString/TimeString` con am/pm locale produce un espacio
   fino (U+202F) y depende de la versión de ICU + zona horaria del
   runtime → mismatch de hidratación entre Node (SSR) y el navegador.

   Estos helpers fijan zona horaria (AR) y evitan am/pm, así el texto
   renderizado es idéntico en ambos lados.
   ============================================================ */

const TZ = "America/Argentina/Buenos_Aires";

/** "10 jun" — día y mes corto, zona AR fija. */
export function fmtDayMonth(d: Date | string): string {
  return new Date(d).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    timeZone: TZ,
  });
}

/** "10 jun 2026" — con año. */
export function fmtDayMonthYear(d: Date | string): string {
  return new Date(d).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
}

/** "17:06" — 24h, sin am/pm (evita el U+202F que rompe la hidratación). */
export function fmtTime(d: Date | string): string {
  return new Date(d).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  });
}

/** "10 jun · 17:06" — combinado, para timelines. */
export function fmtDateTime(d: Date | string): string {
  return `${fmtDayMonth(d)} · ${fmtTime(d)}`;
}

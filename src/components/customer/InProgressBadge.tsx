/**
 * Badge "EN PROGRESO" con latido constante. Se muestra mientras la orden está
 * en PROCESO (el header de etapa solo se renderiza en ese estado). Honesto: el
 * auto SE ESTÁ TRABAJANDO ahora — el latido refleja eso, no la frescura del dato.
 * Server component: puro CSS, sin hidratación.
 */
export function InProgressBadge() {
  return (
    <span className="liveprog" role="status">
      <span className="liveprog-dot" aria-hidden="true" />
      En progreso
    </span>
  );
}

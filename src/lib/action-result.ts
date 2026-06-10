/**
 * Contrato uniforme de retorno para server actions.
 * En vez de `throw` (que sin error boundary deja la UI rota), las actions
 * devuelven un resultado que el cliente puede mostrar de forma controlada.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/** Mensaje de error seguro a partir de un unknown capturado. */
export function toActionError(err: unknown, fallback = "Ocurrió un error"): {
  ok: false;
  error: string;
} {
  const error = err instanceof Error ? err.message : fallback;
  return { ok: false, error };
}

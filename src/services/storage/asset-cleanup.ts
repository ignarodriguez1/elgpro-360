import { getStorageProvider } from "./index";

/**
 * Borrado best-effort de assets del storage. Primer (y único) punto de entrada
 * al `StorageProvider.delete()` desde la app — el patrón que ServiceImage va a
 * replicar.
 *
 * Contrato:
 *  - NUNCA lanza: el borrado de un asset no puede hacer fallar la operación de
 *    negocio que lo dispara. Un huérfano en el bucket cuesta centavos; una obra
 *    que no se puede borrar porque el bucket falló es un bug de cara al dueño.
 *  - NUNCA traga en silencio: cada fallo queda loggeado server-side con ref y
 *    contexto (el informe §G encontró cero logs en todo el camino de media —
 *    esto corta esa deuda, no la extiende).
 *  - Refs null/undefined/"" se saltean sin error ni log: son las filas
 *    históricas pre-migración, huérfanos conocidos que limpia el script aparte.
 *
 * Orden de operaciones (decisión razonada): se llama SIEMPRE DESPUÉS de que la
 * escritura de negocio en la base commiteó. Si el proceso muere en el medio:
 *  - DB primero → asset queda huérfano en el bucket (recuperable con el script
 *    de limpieza, invisible para el usuario final).
 *  - Asset primero → la fila apuntaría a un objeto que ya no existe → imagen
 *    rota visible en la web pública e irrecuperable (el objeto ya no está).
 * Huérfano recuperable > imagen rota irrecuperable. DB primero, siempre.
 */
export async function deleteAssetsBestEffort(
  refs: Array<string | null | undefined>,
  context: string
): Promise<void> {
  const provider = getStorageProvider();
  for (const ref of refs) {
    if (!ref) continue; // fila histórica sin ref: se saltea sin error
    try {
      await provider.delete(ref);
    } catch (err) {
      console.error(
        `[storage:${provider.name}] No se pudo borrar el asset (${context})`,
        { ref, error: err instanceof Error ? err.message : String(err) }
      );
    }
  }
}

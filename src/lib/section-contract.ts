/* ============================================================
   Contrato anti-drift del doble árbol .only-mobile / .only-desktop.
   Tipos compartidos entre áreas (panel admin, portal cliente):

   - Una sección `visibility: "both"` que falta en uno de los dos
     árboles es un BUG contra la fuente de verdad de su área,
     no un olvido aceptable.
   - Para que una sección viva en un solo viewport hay que
     declararlo (con `reason`), no dejarlo pasar por omisión.
   - `layout: "single"` documenta que la pantalla usa UN solo markup
     responsive por decisión, no por fallback.

   Cada área define su propio ScreenDef sobre estos tipos (la forma
   de `nav` difiere entre áreas) y su propio registry de pantallas:
   ver admin-sections.ts y cliente-sections.ts.
   ============================================================ */

/** Dónde debe renderizarse una sección. */
export type SectionVisibility = "both" | "mobile" | "desktop";

/**
 * Descriptor de sección — objeto extensible a propósito.
 * Futuro (solo admin): se agregará `roles?` de forma aditiva
 * (visibility = dónde se renderiza; roles = quién la ve).
 */
export interface SectionDef {
  /** id estable, kebab-case, único dentro de la pantalla */
  id: string;
  /** nombre humano, para reportes de reconciliación */
  label: string;
  visibility: SectionVisibility;
  /** por qué NO es "both" — completar siempre que visibility !== "both" */
  reason?: string;
}

/** Estrategia de maquetación de la pantalla. */
export type ScreenLayout =
  | "dual" // doble árbol .only-mobile / .only-desktop
  | "single"; // un solo markup responsive (decisión explícita)

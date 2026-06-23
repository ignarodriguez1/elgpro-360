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

/** Roles del panel admin. ADMIN = dueño/manager; STAFF = operario. */
export type AdminRole = "ADMIN" | "STAFF";

/**
 * Descriptor de sección.
 * `visibility` = en qué viewport se renderiza.
 * `roles`      = QUIÉN la ve. Si se omite, la ven todos los roles admin;
 *                si se especifica, solo esos roles. (Ortogonal a visibility.)
 */
export interface SectionDef {
  /** id estable, kebab-case, único dentro de la pantalla */
  id: string;
  /** nombre humano, para reportes de reconciliación */
  label: string;
  visibility: SectionVisibility;
  /** por qué NO es "both" — completar siempre que visibility !== "both" */
  reason?: string;
  /** si se especifica, la sección solo es visible para estos roles */
  roles?: AdminRole[];
}

/** ¿Un rol puede ver algo gateado por esta lista? (sin lista = todos los admin) */
export function roleCanSee(roles: AdminRole[] | undefined, role: AdminRole): boolean {
  return !roles || roles.includes(role);
}

/** Estrategia de maquetación de la pantalla. */
export type ScreenLayout =
  | "dual" // doble árbol .only-mobile / .only-desktop
  | "single"; // un solo markup responsive (decisión explícita)

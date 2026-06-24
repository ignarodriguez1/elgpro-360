/* ============================================================
   FUENTE DE VERDAD de secciones del Panel Admin.
   Contrato anti-drift del doble árbol .only-mobile / .only-desktop:

   - Una sección `visibility: "both"` que falta en uno de los dos
     árboles es un BUG contra este archivo, no un olvido aceptable.
   - Para que una sección viva en un solo viewport hay que
     declararlo acá (con `reason`), no dejarlo pasar por omisión.
   - `layout: "single"` documenta que la pantalla usa UN solo markup
     responsive por decisión, no por fallback.

   Las pantallas describen su estado OBJETIVO (post-normalización);
   la reconciliación (diagnostico/admin/05) verifica DOM vs registry.

   Ver diseño: diagnostico/admin/01-fuente-de-verdad.md
   ============================================================ */

import type { SectionDef, ScreenLayout, AdminRole } from "./section-contract";
import { roleCanSee } from "./section-contract";

/* Tipos genéricos extraídos a section-contract.ts (compartidos con el
   portal cliente). Re-export para no romper imports existentes. */
export type { SectionVisibility, SectionDef, ScreenLayout, AdminRole } from "./section-contract";
export { roleCanSee } from "./section-contract";

export interface ScreenDef {
  route: string;
  title: string;
  layout: ScreenLayout;
  /** presencia en la navegación (sidebar desktop + nav mobile).
   *  `roles` opcional: si se especifica, la entrada solo aparece para esos roles. */
  nav?: { label: string; icon: string; section: "Taller" | "Contenido web"; roles?: AdminRole[] };
  sections: SectionDef[];
}

export const ADMIN_SCREENS: Record<string, ScreenDef> = {
  shell: {
    route: "(layout)",
    title: "AdminShell",
    layout: "dual",
    sections: [
      { id: "nav", label: "Navegación principal", visibility: "both" },
      { id: "logout", label: "Sesión / logout (UserMenu)", visibility: "both" },
      { id: "page-title", label: "Título de página", visibility: "both" },
      {
        id: "sidebar-collapse",
        label: "Colapsar sidebar",
        visibility: "desktop",
        reason: "control propio del layout con sidebar",
      },
      // global-search y notifications-bell removidos: eran controles muertos
      // (input sin handler, campana sin onClick) — eliminados del AdminShell.
    ],
  },

  dashboard: {
    route: "/admin",
    title: "Dashboard",
    layout: "dual",
    nav: { label: "Dashboard", icon: "gauge", section: "Taller" },
    sections: [
      { id: "header", label: "Cabecera", visibility: "both" },
      { id: "new-order-cta", label: "Botón nueva orden", visibility: "both" },
      { id: "stats", label: "Stats del taller", visibility: "both" },
      { id: "active-orders", label: "Órdenes activas", visibility: "both" },
      { id: "see-all-link", label: "Link a listado completo", visibility: "both" },
      {
        id: "ready-group",
        label: "Agrupación 'listos para retirar'",
        visibility: "mobile",
        reason: "la tabla desktop lo expresa con StatusBadge",
      },
    ],
  },

  login: {
    route: "/admin/login",
    title: "Login",
    layout: "single",
    sections: [{ id: "login-card", label: "Card de login", visibility: "both" }],
  },

  ordenes: {
    route: "/admin/ordenes",
    title: "Órdenes de trabajo",
    layout: "dual",
    nav: { label: "Órdenes de trabajo", icon: "spray", section: "Taller" },
    sections: [
      { id: "header", label: "Cabecera + contador", visibility: "both" },
      { id: "new-order-cta", label: "Botón nueva orden", visibility: "both" },
      { id: "filters", label: "Filtros activas/completadas/todas", visibility: "both" },
      { id: "list", label: "Listado (tabla ↔ cards)", visibility: "both" },
    ],
  },

  ordenNueva: {
    route: "/admin/ordenes/nueva",
    title: "Nueva orden",
    layout: "single",
    sections: [
      { id: "header", label: "Cabecera", visibility: "both" },
      { id: "wizard", label: "Wizard 5 pasos", visibility: "both" },
    ],
  },

  ordenDetalle: {
    route: "/admin/ordenes/[id]",
    title: "Detalle de orden",
    layout: "dual",
    sections: [
      { id: "back-link", label: "Volver", visibility: "both" },
      { id: "hero", label: "Hero del vehículo", visibility: "both" },
      { id: "status-badge", label: "Estado global de la orden", visibility: "both" },
      { id: "stage-track", label: "Barra/track de etapas", visibility: "both" },
      {
        id: "timeline",
        label: "Timeline (descripciones, notas internas, fotos, lightbox)",
        visibility: "both",
      },
      {
        id: "timeline-visible-count",
        label: "Contador 'N visibles'",
        visibility: "mobile",
        reason: "métrica rápida de taller; sin valor en el panel ancho",
      },
      { id: "lifecycle-actions", label: "Acciones de ciclo de vida", visibility: "both" },
      { id: "delivered-notice", label: "Mensaje 'orden entregada'", visibility: "both" },
      { id: "new-state-form", label: "Form nuevo estado", visibility: "both" },
      { id: "client-info", label: "Cliente (nombre/email)", visibility: "both" },
      { id: "vehicle-info", label: "Vehículo (año/color/etapa)", visibility: "both" },
      {
        id: "budget-payment",
        label: "Presupuesto y estado de pago",
        visibility: "both",
        roles: ["ADMIN"], // datos comerciales: el operario (STAFF) no los ve
      },
      { id: "services", label: "Servicios solicitados", visibility: "both" },
      { id: "order-internal-notes", label: "Nota interna de la orden", visibility: "both" },
    ],
  },

  clientes: {
    route: "/admin/clientes",
    title: "Clientes",
    layout: "dual",
    nav: { label: "Clientes", icon: "user", section: "Taller" },
    sections: [
      { id: "header", label: "Cabecera + contador", visibility: "both" },
      { id: "new-customer-form", label: "Alta de cliente", visibility: "both" },
      { id: "search", label: "Buscador", visibility: "both" },
      { id: "list", label: "Listado (tabla ↔ cards)", visibility: "both" },
    ],
  },

  usuarios: {
    route: "/admin/usuarios",
    title: "Equipo",
    layout: "dual",
    // Solo el dueño (ADMIN) gestiona el equipo interno (alta de operarios/admins).
    nav: { label: "Equipo", icon: "users", section: "Taller", roles: ["ADMIN"] },
    sections: [
      { id: "header", label: "Cabecera + contador", visibility: "both" },
      { id: "new-user-form", label: "Alta de usuario (rol STAFF/ADMIN)", visibility: "both" },
      { id: "list", label: "Listado de equipo (tabla ↔ cards)", visibility: "both" },
    ],
  },

  clienteDetalle: {
    route: "/admin/clientes/[id]",
    title: "Detalle de cliente",
    layout: "dual",
    sections: [
      { id: "header", label: "Volver + cabecera", visibility: "both" },
      { id: "edit-form", label: "Editar cliente", visibility: "both" },
      { id: "vehicles-list", label: "Vehículos del cliente (tabla ↔ cards)", visibility: "both" },
      { id: "new-vehicle-form", label: "Alta de vehículo", visibility: "both" },
    ],
  },

  vehiculos: {
    route: "/admin/vehiculos",
    title: "Vehículos",
    layout: "dual",
    nav: { label: "Vehículos", icon: "car", section: "Taller" },
    sections: [
      { id: "header", label: "Cabecera + contador", visibility: "both" },
      { id: "search", label: "Buscador", visibility: "both" },
      { id: "list", label: "Listado (tabla ↔ cards)", visibility: "both" },
    ],
  },

  vehiculoDetalle: {
    route: "/admin/vehiculos/[id]",
    title: "Detalle de vehículo",
    layout: "dual",
    sections: [
      { id: "header", label: "Volver + cabecera", visibility: "both" },
      { id: "edit-form", label: "Editar vehículo", visibility: "both" },
      { id: "client-panel", label: "Panel cliente", visibility: "both" },
      { id: "orders-list", label: "Órdenes del vehículo (tabla ↔ cards)", visibility: "both" },
    ],
  },

  auditoria: {
    route: "/admin/auditoria",
    title: "Auditoría",
    layout: "dual",
    nav: { label: "Auditoría", icon: "shield", section: "Taller", roles: ["ADMIN"] },
    sections: [
      { id: "header", label: "Cabecera + contador de eventos", visibility: "both" },
      { id: "logs-list", label: "Eventos (tabla ↔ cards)", visibility: "both" },
    ],
  },

  tutoriales: {
    route: "/admin/tutoriales",
    title: "Tutoriales",
    layout: "single", // decisión checkpoint 0, condicionada a verificación runtime (4B)
    nav: { label: "Tutoriales", icon: "play", section: "Contenido web", roles: ["ADMIN"] },
    sections: [
      { id: "header", label: "Cabecera + contador + nuevo", visibility: "both" },
      { id: "tutorial-form", label: "Form alta/edición", visibility: "both" },
      { id: "crud-list", label: "Lista con toggles + editar/borrar", visibility: "both" },
    ],
  },

  trabajos: {
    route: "/admin/trabajos",
    title: "Trabajos",
    layout: "single",
    nav: { label: "Trabajos", icon: "sparkle", section: "Contenido web", roles: ["ADMIN"] },
    sections: [
      { id: "header", label: "Cabecera + contador + nuevo", visibility: "both" },
      { id: "work-form", label: "Form alta/edición (con upload de fotos)", visibility: "both" },
      { id: "crud-list", label: "Lista con toggles + editar/borrar", visibility: "both" },
    ],
  },

  servicios: {
    route: "/admin/servicios",
    title: "Servicios",
    layout: "single",
    nav: { label: "Servicios", icon: "layers", section: "Contenido web", roles: ["ADMIN"] },
    sections: [
      { id: "header", label: "Cabecera + nuevo servicio", visibility: "both" },
      { id: "services-list", label: "Lista con toggles + editar", visibility: "both" },
      {
        id: "reorder-dnd",
        label: "Reordenar por drag & drop",
        visibility: "desktop",
        reason: "HTML5 dnd no dispara en touch — fix fuera de este scope (prompt aparte)",
      },
    ],
  },

  flowEditor: {
    route: "/admin/servicios/[id]",
    title: "Editor de flujo",
    layout: "single",
    sections: [
      { id: "header", label: "Volver + renombrar servicio", visibility: "both" },
      { id: "steps-list", label: "Pasos con toggles + borrar", visibility: "both" },
      { id: "add-step-form", label: "Agregar paso", visibility: "both" },
      {
        id: "reorder-dnd",
        label: "Reordenar pasos por drag & drop",
        visibility: "desktop",
        reason: "HTML5 dnd no dispara en touch — fix fuera de este scope (prompt aparte)",
      },
    ],
  },
};

type NavScreen = ScreenDef & { nav: NonNullable<ScreenDef["nav"]> };

/** Pantallas con entrada de navegación, en orden de declaración. */
export function navScreens(): NavScreen[] {
  return Object.values(ADMIN_SCREENS).filter((s): s is NavScreen => Boolean(s.nav));
}

/** Navegación visible para un rol — oculta las entradas gateadas (p. ej. STAFF
 *  no ve Auditoría / Contenido web). */
export function navScreensForRole(role: AdminRole): NavScreen[] {
  return navScreens().filter((s) => roleCanSee(s.nav.roles, role));
}

/** ¿La ruta admin está permitida para el rol? Usado por los guards de página
 *  (requireOwner). Una pantalla con `nav.roles` define quién puede entrar. */
export function screenAllowsRole(route: string, role: AdminRole): boolean {
  const screen = Object.values(ADMIN_SCREENS).find((s) => s.route === route);
  return roleCanSee(screen?.nav?.roles, role);
}

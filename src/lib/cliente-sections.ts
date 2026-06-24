/* ============================================================
   FUENTE DE VERDAD de secciones del Portal Cliente.
   Mismo contrato anti-drift que el panel admin (ver
   section-contract.ts): una sección `visibility: "both"` que
   falta en un árbol es un BUG contra este archivo.

   Sin dimensión de roles: el portal tiene un solo rol efectivo
   (cliente final).

   Las pantallas describen su estado OBJETIVO (post-normalización,
   decisiones de checkpoints 0 y 1 aplicadas); la reconciliación
   (diagnostico/cliente/05) verifica DOM vs registry.

   Ver diseño: diagnostico/cliente/01-fuente-de-verdad.md
   ============================================================ */

import type { SectionDef, ScreenLayout } from "./section-contract";

export interface ClienteScreenDef {
  route: string;
  title: string;
  layout: ScreenLayout;
  /** presencia en la nav (BottomNav mobile + PwNav desktop) — misma lista, drift imposible */
  nav?: { label: string; icon: string };
  sections: SectionDef[];
}

export const CLIENTE_SCREENS: Record<string, ClienteScreenDef> = {
  shell: {
    route: "(layout)",
    title: "Portal — navegación",
    layout: "dual",
    sections: [
      { id: "nav", label: "Navegación principal (BottomNav / PwNav)", visibility: "both" },
      {
        id: "brand-pill",
        label: "Logo + pill 'Portal de clientes'",
        visibility: "desktop",
        reason: "chrome propio del navbar desktop",
      },
      {
        id: "user-menu",
        label: "UserMenu (sesión/salir) en nav",
        visibility: "desktop",
        reason: "en mobile el logout vive en Perfil — verificado, alcanzable",
      },
      { id: "session-notice", label: "SessionNotice (admin en zona cliente)", visibility: "both" },
    ],
  },

  login: {
    route: "/clientes/login",
    title: "Login",
    layout: "dual",
    sections: [
      { id: "hero-bg", label: "Fondo hero + veil", visibility: "both" },
      { id: "logo", label: "Logo", visibility: "both" },
      { id: "form", label: "Card de login OTP (email → código de 6 dígitos + error)", visibility: "both" },
      { id: "aux-links", label: "Link cambiar email / reenviar código (paso código)", visibility: "both" },
    ],
  },

  dashboard: {
    route: "/clientes/dashboard",
    title: "Dashboard",
    layout: "dual",
    nav: { label: "Inicio", icon: "home" },
    sections: [
      { id: "greeting", label: "Saludo + resumen de trabajos", visibility: "both" },
      { id: "vehicles-header", label: "Label 'Mis vehículos' + contador", visibility: "both" },
      { id: "vehicle-cards", label: "Cards de vehículo (foto/patente/status/progreso)", visibility: "both" },
      // regla Fase 3: la card linkea al detalle CON y SIN orden activa
      { id: "vehicle-card-link", label: "Card navegable al detalle", visibility: "both" },
      // hoy falta en mobile — Fase 4
      { id: "vehicle-color-dot", label: "Punto de color del vehículo", visibility: "both" },
      { id: "empty-state", label: "Empty 'Sin vehículos'", visibility: "both" },
    ],
  },

  perfil: {
    route: "/clientes/perfil",
    title: "Perfil",
    layout: "dual",
    nav: { label: "Perfil", icon: "user" },
    sections: [
      { id: "header", label: "Cabecera (nombre + 'cliente desde')", visibility: "both" },
      {
        id: "avatar-initials",
        label: "Avatar de iniciales",
        visibility: "mobile",
        reason: "tratamiento de cabecera propio del diseño mobile — intencional (matriz Fase 0)",
      },
      { id: "account-data", label: "Datos de cuenta (email/tel/vehículos/notificaciones)", visibility: "both" },
      // hoy falta en desktop — Fase 4
      { id: "public-site-link", label: "Link 'Ver sitio público'", visibility: "both" },
      { id: "logout", label: "Botón cerrar sesión", visibility: "both" },
    ],
  },

  tutoriales: {
    route: "/clientes/tutoriales",
    title: "Tutoriales",
    layout: "dual",
    nav: { label: "Tutoriales", icon: "play" },
    sections: [
      // checkpoint 1: título unificado "Tutoriales" en ambos árboles — Fase 4
      { id: "header", label: "Cabecera — título 'Tutoriales'", visibility: "both" },
      { id: "grid", label: "Lista/grilla de tutoriales", visibility: "both" },
      // checkpoint 0: card navegable a /tutoriales/[slug] como el listado público — Fase 3
      { id: "card-link", label: "Card navegable a /tutoriales/[slug]", visibility: "both" },
      { id: "empty-state", label: "Empty state", visibility: "both" },
    ],
  },

  vehiculoDetalle: {
    route: "/clientes/vehiculos/[id]",
    title: "Detalle de vehículo",
    layout: "dual",
    sections: [
      {
        id: "back-link",
        label: "Volver ('Mis vehículos')",
        visibility: "desktop",
        reason: "mobile navega con BottomNav — patrón del área",
      },
      { id: "hero", label: "Hero (foto, patente, nombre)", visibility: "both" },
      // checkpoint 1: contenido unificado `title · color · año` — Fase 4
      { id: "hero-subtitle", label: "Subtítulo del hero (title · color · año)", visibility: "both" },
      { id: "ready-banner", label: "Banner 'listo' CON total del presupuesto", visibility: "both" },
      { id: "stage-eta", label: "Etapa actual + ETA", visibility: "both" },
      // paridad de CONTENIDO (3 fotos vs todas) → prompt de consolidación, anotado
      { id: "timeline", label: "Timeline de seguimiento (fotos + lightbox)", visibility: "both" },
      { id: "timeline-empty", label: "Timeline — empty 'Todavía no hay novedades'", visibility: "both" },
      { id: "services", label: "Servicios solicitados", visibility: "both" },
      { id: "products", label: "Productos y tratamientos", visibility: "both" },
      // checkpoint 0: en mobile se apilan al final del detalle — Fase 4
      { id: "vehicle-data", label: "Datos del vehículo (modelo/patente/color/año)", visibility: "both" },
      { id: "care-tips", label: "Cuidados recomendados", visibility: "both" },
      { id: "no-active-order", label: "Estado sin orden activa + link a historial", visibility: "both" },
    ],
  },

  historial: {
    route: "/clientes/vehiculos/[id]/historial",
    title: "Historial",
    layout: "dual",
    sections: [
      {
        id: "back-link",
        label: "Volver al vehículo",
        visibility: "desktop",
        reason: "mobile navega con BottomNav — patrón del área",
      },
      { id: "header", label: "Cabecera (vehículo + patente)", visibility: "both" },
      // hoy falta en mobile — Fase 4
      { id: "jobs-counter", label: "Contador 'N trabajos'", visibility: "both" },
      { id: "job-cards", label: "Cards de trabajos completados", visibility: "both" },
      // regla Fase 3: navegable en ambos árboles (destino: detalle del vehículo)
      { id: "job-card-link", label: "Card navegable", visibility: "both" },
      { id: "empty-state", label: "Empty 'Sin historial'", visibility: "both" },
    ],
  },
};

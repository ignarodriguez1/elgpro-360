# Fase 1 — Fuente de verdad de secciones del Portal Cliente (diseño)

> Diseño, sin código de runtime. El archivo TS se crea en Fase 2, cuando lo consuma
> la primera pieza real. **Reutiliza el patrón de admin** (`diagnostico/admin/01-fuente-de-verdad.md`,
> ya materializado en `src/lib/admin-sections.ts`): mismo contrato, mismos tipos.

## Contrato (idéntico al de admin)

> **Para que una sección viva en un solo viewport hay que escribirlo.**
> Una sección `'both'` que falta en un árbol es un **bug contra la fuente de verdad**.

Sin dimensión de roles: el portal tiene un solo rol efectivo (cliente final).
`SectionDef` sigue siendo objeto extensible, pero acá no se anticipa `roles`.

## Dónde vive y cómo se comparten los tipos

```
src/lib/section-contract.ts      ← tipos genéricos extraídos (SectionVisibility,
                                    SectionDef, ScreenLayout) — type-only move
src/lib/admin-sections.ts        ← re-exporta los tipos (back-compat, nada se rompe)
                                    y conserva ADMIN_SCREENS con su nav propio
src/lib/cliente-sections.ts      ← CLIENTE_SCREENS (nuevo, Fase 2)
```

Por qué extraer en vez de que cliente importe desde `admin-sections`: evita el
acoplamiento cliente→admin; el contrato es del sistema de doble árbol, no del panel.
Es un movimiento de tipos puro (cero runtime), y `admin-sections.ts` re-exporta para
que ningún import existente cambie.

Lo único NO compartible es `ScreenDef.nav`: admin agrupa por `section: "Taller" | "Contenido web"`;
el portal tiene una nav plana de 3 tabs. Cada área define su `ScreenDef` propio sobre
los tipos genéricos:

```ts
// src/lib/cliente-sections.ts
import type { SectionDef, ScreenLayout } from "./section-contract";

export interface ClienteScreenDef {
  route: string;
  title: string;
  layout: ScreenLayout;
  /** presencia en la nav (BottomNav mobile + PwNav desktop) — misma lista, drift imposible */
  nav?: { label: string; icon: string };
  sections: SectionDef[];
}

export const CLIENTE_SCREENS: Record<string, ClienteScreenDef> = { /* abajo */ };
```

Igual que en admin: la nav se DERIVA del registry (`BottomNav` y `PwNav` consumen
`Object.values(CLIENTE_SCREENS).filter(s => s.nav)`), las secciones se etiquetan con
`data-section` en ambos árboles al tocarlas, y la Fase 5 reconcilia DOM visible vs
registry a ≤859px / ≥860px con los mismos niveles (both ausente → CRITICAL, etc.).

## Contenido (estado OBJETIVO — decisiones del CHECKPOINT 0 aplicadas)

Como en admin: los `DRIFT ACCIDENTAL` se cargan con su estado objetivo (`both`),
no el actual. La fuente de verdad es el contrato; Fases 2–4 hacen que el código lo cumpla.

```ts
export const CLIENTE_SCREENS: Record<string, ClienteScreenDef> = {
  shell: {
    route: "(layout)",
    title: "Portal — navegación",
    layout: "dual",
    sections: [
      { id: "nav", label: "Navegación principal (BottomNav / PwNav)", visibility: "both" },
      { id: "brand-pill", label: "Logo + pill 'Portal de clientes'", visibility: "desktop",
        reason: "chrome propio del navbar desktop" },
      { id: "user-menu", label: "UserMenu (sesión/salir) en nav", visibility: "desktop",
        reason: "en mobile el logout vive en Perfil — verificado, alcanzable" },
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
      { id: "form", label: "Card de login (email/password + error)", visibility: "both" },
      { id: "aux-links", label: "Links activar / olvidé contraseña", visibility: "both" },
    ],
  },

  activar: {
    route: "/clientes/activar",
    title: "Activar cuenta",
    layout: "dual",
    sections: [
      { id: "state-invalid", label: "Estado token inválido", visibility: "both" },
      { id: "state-success", label: "Estado cuenta activada + ir al login", visibility: "both" },
      { id: "form", label: "Form contraseña + confirmación", visibility: "both" },
      { id: "hero-bg", label: "Fondo hero con foto", visibility: "both" }, // hoy falta en desktop — Fase 4
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
      { id: "vehicle-card-link", label: "Card navegable al detalle (CON y SIN orden activa)", visibility: "both" }, // regla Fase 3
      { id: "vehicle-color-dot", label: "Punto de color del vehículo", visibility: "both" }, // hoy falta en mobile — Fase 4
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
      { id: "avatar-initials", label: "Avatar de iniciales", visibility: "mobile",
        reason: "tratamiento de cabecera propio del diseño mobile — INTENCIONAL (matriz Fase 0)" },
      { id: "account-data", label: "Datos de cuenta (email/tel/vehículos/notificaciones)", visibility: "both" },
      { id: "public-site-link", label: "Link 'Ver sitio público'", visibility: "both" }, // hoy falta en desktop — Fase 4
      { id: "logout", label: "Botón cerrar sesión", visibility: "both" },
    ],
  },

  tutoriales: {
    route: "/clientes/tutoriales",
    title: "Tutoriales",
    layout: "dual",
    nav: { label: "Tutoriales", icon: "play" },
    sections: [
      { id: "header", label: "Cabecera — título unificado", visibility: "both" }, // propuesta: "Tutoriales" (ver Pendientes)
      { id: "grid", label: "Lista/grilla de tutoriales", visibility: "both" },
      { id: "card-link", label: "Card navegable a /tutoriales/[slug]", visibility: "both" }, // decisión checkpoint 0 — Fase 3
      { id: "empty-state", label: "Empty state", visibility: "both" },
    ],
  },

  vehiculoDetalle: {
    route: "/clientes/vehiculos/[id]",
    title: "Detalle de vehículo",
    layout: "dual",
    sections: [
      { id: "back-link", label: "Volver ('Mis vehículos')", visibility: "desktop",
        reason: "mobile navega con BottomNav — patrón del área" },
      { id: "hero", label: "Hero (foto, patente, nombre)", visibility: "both" },
      { id: "hero-subtitle", label: "Subtítulo del hero — contenido unificado", visibility: "both" }, // propuesta: title · color · año (ver Pendientes)
      { id: "ready-banner", label: "Banner 'listo' CON total del presupuesto", visibility: "both" }, // hoy mobile sin total — Fase 2 (#1)
      { id: "stage-eta", label: "Etapa actual + ETA", visibility: "both" },
      { id: "timeline", label: "Timeline de seguimiento (fotos + lightbox)", visibility: "both" },
        // paridad de CONTENIDO (3 fotos vs todas) → prompt de consolidación, anotado
      { id: "timeline-empty", label: "Timeline — empty 'Todavía no hay novedades'", visibility: "both" }, // hoy falta en desktop — Fase 2 (#2)
      { id: "services", label: "Servicios solicitados", visibility: "both" },
      { id: "products", label: "Productos y tratamientos", visibility: "both" },
      { id: "vehicle-data", label: "Datos del vehículo (modelo/patente/color/año)", visibility: "both" },
        // decisión checkpoint 0: mobile los apila al final — Fase 4
      { id: "care-tips", label: "Cuidados recomendados", visibility: "both" },
        // ídem — apilado al final en mobile, Fase 4
      { id: "no-active-order", label: "Estado sin orden activa + link a historial", visibility: "both" },
    ],
  },

  historial: {
    route: "/clientes/vehiculos/[id]/historial",
    title: "Historial",
    layout: "dual",
    sections: [
      { id: "back-link", label: "Volver al vehículo", visibility: "desktop",
        reason: "mobile navega con BottomNav — patrón del área" },
      { id: "header", label: "Cabecera (vehículo + patente)", visibility: "both" },
      { id: "jobs-counter", label: "Contador 'N trabajos'", visibility: "both" }, // hoy falta en mobile — Fase 4
      { id: "job-cards", label: "Cards de trabajos completados", visibility: "both" },
      { id: "job-card-link", label: "Card navegable", visibility: "both" }, // regla Fase 3
      { id: "empty-state", label: "Empty 'Sin historial'", visibility: "both" },
    ],
  },
};
```

## Regla única de interacción (insumo para Fase 3)

> **Toda card que representa una entidad navegable linkea a su detalle, en ambos árboles.**

| Card | Destino | Estado actual |
|---|---|---|
| Dashboard — vehículo (con o sin orden) | `/clientes/vehiculos/[id]` | mobile ✅ / desktop solo con orden |
| Historial — trabajo completado | `/clientes/vehiculos/[id]` (no existe detalle de trabajo) | mobile ✅ / desktop ❌ |
| Tutoriales — tutorial | `/tutoriales/[slug]` (como el listado público) | ❌ en ambos |

Nota historial: el destino actual del `Link` mobile (detalle del vehículo) se mantiene
como regla — no existe pantalla de detalle de trabajo. Si algún día existe, se cambia
el destino en UN lugar conceptual, no en dos árboles.

## Decisiones del CHECKPOINT 1 (RATIFICADAS)

1. **Título de Tutoriales** → **"Tutoriales"** en ambos árboles — consistente con la ruta
   `/clientes/tutoriales`, el tab de la nav y el área pública `/tutoriales`. (Fase 4)
2. **Subtítulo del hero del detalle** → unificado en **`title · color · año`** en ambos
   árboles; el `orderCode` es dato de la orden y su lugar natural es el bloque de
   seguimiento. (Fase 4)

## Plan de adopción

| Fase | Qué consume el registry |
|---|---|
| 2 | Se crean `section-contract.ts` + `cliente-sections.ts`; los fixes funcionales etiquetan sus secciones con `data-section` al tocarlas |
| 3 | Cards navegables: `data-section` en dashboard / historial / tutoriales |
| 4 | Sidebar apilada + cosméticos: etiquetado al pasar; `BottomNav`/`PwNav` derivan la nav del registry |
| 5 | Reconciliación completa DOM ↔ registry en ambos viewports → `diagnostico/cliente/05-reconciliacion-final.md` |

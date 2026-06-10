# Fase 1 — Fuente de verdad de secciones del Panel Admin (diseño)

> Diseño, sin código de runtime. El archivo TS propuesto acá se crea recién en Fase 2,
> cuando lo consuma la primera pieza real (la navegación mobile).

## Problema que esto mata

Hoy una sección puede existir en un árbol y faltar en el otro **por omisión** y nada
lo detecta: ambos árboles viven en el DOM y el CSS oculta uno. El drift del detalle
de orden (fotos, presupuesto) pasó exactamente así. La regla nueva:

> **Para que una sección viva en un solo viewport hay que escribirlo.**
> Una sección `'both'` que falta en un árbol es un **bug contra la fuente de verdad**,
> no un descuido aceptable.

## Dónde vive

```
src/lib/admin-sections.ts        ← fuente de verdad (config tipada, sin React)
```

Sin dependencias de React ni de Prisma: importable desde server components, client
components y (a futuro) scripts de verificación.

## Forma propuesta

```ts
// src/lib/admin-sections.ts

/** Dónde debe renderizarse una sección. */
export type SectionVisibility = "both" | "mobile" | "desktop";

/**
 * Descriptor de sección — OBJETO extensible a propósito.
 * Mañana se agrega `roles?: AdminRole[]` acá sin tocar la estructura.
 * NO agregar `roles` ahora (decisión: roles se diseñan después).
 */
export interface SectionDef {
  /** id estable, kebab-case, único dentro de la pantalla */
  id: string;
  /** nombre humano, para reportes de reconciliación */
  label: string;
  visibility: SectionVisibility;
  /** por qué esta sección NO es 'both' — obligatoria si visibility !== 'both' */
  reason?: string;
}

/** Estrategia de maquetación de la pantalla. */
export type ScreenLayout =
  | "dual"    // doble árbol .only-mobile / .only-desktop
  | "single"; // un solo markup responsive (decisión explícita, no fallback)

export interface ScreenDef {
  route: string;
  title: string;
  layout: ScreenLayout;
  /** aparece en la navegación (sidebar desktop / nav mobile) */
  nav?: { label: string; icon: string; section: "Taller" | "Contenido web" };
  sections: SectionDef[];
}

export const ADMIN_SCREENS: Record<string, ScreenDef> = { /* … */ };
```

Regla de tipos: `reason` obligatoria cuando `visibility !== 'both'` se puede endurecer
con una unión discriminada; arrancamos simple (campo opcional + convención) y se
endurece si hace falta.

## Contenido inicial (extracto — las 14 pantallas van completas en el archivo real)

Refleja la matriz de Fase 0 **ya con las decisiones del checkpoint aplicadas**.
Los `DRIFT ACCIDENTAL` se cargan con su estado OBJETIVO (`both`), no el actual —
la fuente de verdad describe el contrato, y la Fase 3/4 hace que el código lo cumpla.

```ts
export const ADMIN_SCREENS: Record<string, ScreenDef> = {
  shell: {
    route: "(layout)",
    title: "AdminShell",
    layout: "dual",
    sections: [
      { id: "nav", label: "Navegación principal", visibility: "both" },
      { id: "logout", label: "Sesión / logout", visibility: "both" },
      { id: "page-title", label: "Título de página", visibility: "both" },
      { id: "sidebar-collapse", label: "Colapsar sidebar", visibility: "desktop",
        reason: "control propio del layout con sidebar" },
      { id: "global-search", label: "Buscador global", visibility: "desktop",
        reason: "decorativo; feature pendiente — decisión checkpoint 0" },
      { id: "notifications-bell", label: "Campana de notificaciones", visibility: "desktop",
        reason: "decorativa; feature pendiente — decisión checkpoint 0" },
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
      { id: "stats", label: "Stats del taller", visibility: "both" },          // decisión: strip en mobile
      { id: "active-orders", label: "Órdenes activas", visibility: "both" },
      { id: "see-all-link", label: "Link a listado completo", visibility: "both" },
      { id: "ready-group", label: "Agrupación 'listos para retirar'", visibility: "mobile",
        reason: "la tabla desktop lo expresa con StatusBadge" },
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
      { id: "timeline", label: "Timeline (desc, notas internas, fotos, lightbox)", visibility: "both" },
      { id: "timeline-visible-count", label: "Contador 'N visibles'", visibility: "mobile",
        reason: "métrica de taller; sin valor en el panel ancho" },
      { id: "lifecycle-actions", label: "Acciones de ciclo de vida", visibility: "both" },
      { id: "delivered-notice", label: "Mensaje 'orden entregada'", visibility: "both" },
      { id: "new-state-form", label: "Nuevo estado", visibility: "both" },
      { id: "client-info", label: "Cliente (nombre/email)", visibility: "both" },
      { id: "vehicle-info", label: "Vehículo (año/color/etapa)", visibility: "both" },
      { id: "budget-payment", label: "Presupuesto y pago", visibility: "both" },
      { id: "services", label: "Servicios solicitados", visibility: "both" },
      { id: "order-internal-notes", label: "Nota interna de la orden", visibility: "both" },
    ],
  },

  tutoriales: {
    route: "/admin/tutoriales",
    title: "Tutoriales",
    layout: "single",   // decisión checkpoint 0 (condicionada a verificación runtime 4B)
    nav: { label: "Tutoriales", icon: "play", section: "Contenido web" },
    sections: [
      { id: "header", label: "Cabecera", visibility: "both" },
      { id: "crud-list", label: "Lista con toggles", visibility: "both" },
    ],
  },

  // … resto: login (single), ordenes (dual), ordenNueva (single), clientes (dual),
  //   clienteDetalle, vehiculos (dual), vehiculoDetalle, servicios, flowEditor, auditoria
};
```

Punto clave: en pantallas `layout: "single"` las secciones son `'both'` por
definición (un markup sirve a ambos viewports). El campo `layout` documenta que eso
es una **decisión**, no un fallback.

## Cómo se consume

### 1. La navegación se DERIVA del registry (Fase 2)

`AdminShell` deja de tener su array `NAV` hardcodeado y lo construye desde
`ADMIN_SCREENS`:

```ts
// dentro de AdminShell.tsx (y de la futura nav mobile)
import { ADMIN_SCREENS } from "@/lib/admin-sections";

const NAV_SCREENS = Object.values(ADMIN_SCREENS).filter((s) => s.nav);
// → sidebar desktop y nav mobile consumen LA MISMA lista.
//   Una pantalla nueva con `nav` aparece en ambas o en ninguna. Drift imposible.
```

### 2. Las secciones se etiquetan con `data-section` (Fases 3–4)

Cada raíz de sección, en **ambos** árboles, lleva el id del registry:

```tsx
{/* árbol desktop */}
<div className="osb" data-section="budget-payment">…</div>

{/* árbol mobile */}
<div className="tod-budget" data-section="budget-payment">…</div>
```

Costo: un atributo. No cambia estilos ni comportamiento. Es la bisagra que permite
verificar el contrato contra el DOM real.

### 3. Reconciliación contra runtime (Fase 5)

Con la app levantada, para cada pantalla y cada viewport (430px / 1280px) se
recorre el DOM **visible** y se compara contra el registry:

- sección `both` ausente en un viewport → **CRITICAL**
- sección `mobile`/`desktop` apareciendo del lado contrario → **WARNING**
- `data-section` en el DOM que no existe en el registry → **WARNING** (sección sin contrato)

El mismo chequeo queda repetible para cualquier cambio futuro (a mano con la app
levantada, o automatizable con Playwright más adelante — fuera de este scope).

## Preparación para roles (sin implementarlos)

`SectionDef` es un objeto: agregar `roles?: AdminRole[]` mañana es **aditivo** —
ninguna pantalla, consumo ni reporte se reestructura. La semántica futura
(`visibility` = dónde se renderiza; `roles` = quién la ve) ya queda enunciada para
que nadie meta roles dentro de `visibility`. Eso es todo lo que se hace hoy.

## Qué NO es esto

- No es un sistema de render dinámico: las pantallas siguen escribiendo su JSX.
  El registry **describe y verifica**, no genera UI. (Única excepción: la nav, que
  sí se deriva — es una lista, el caso donde derivar es trivial y rinde.)
- No valida en runtime de producción: cero costo para el usuario final.

## Plan de adopción

| Fase | Qué consume el registry |
|---|---|
| 2 | Se crea `admin-sections.ts`; `AdminShell` (desktop + nav mobile nueva) deriva la nav de él |
| 3 | Detalle de orden + dashboard: secciones etiquetadas con `data-section` al tocarlas |
| 4 | Cada pantalla que se maqueta se etiqueta al pasar |
| 5 | Reconciliación completa DOM ↔ registry en ambos viewports |

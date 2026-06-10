# Fase 0 — Mapa de áreas y mecanismo de switch

> Diagnóstico ELG Pro. Solo lectura. No se modificó código.
> Stack: Next.js (App Router) + CSS plano por área (no Tailwind responsive).

## Mecanismo de switch (resumen)

El switch mobile/desktop **NO** es Tailwind mobile-first. De hecho casi no hay
prefijos responsive de Tailwind en todo el proyecto (9 ocurrencias totales, todas
en primitivos de shadcn/ui).

El patrón real es **"renderizar las dos maquetaciones y ocultar una por CSS"**:

```tsx
// app/(public)/page.tsx
<div className="only-desktop"><HomeDesktop /></div>
<div className="only-mobile"><HomeMobile /></div>
```

Las clases `.only-desktop` / `.only-mobile` se definen **una sola vez** en
`components/shared/shared.css` (importado global en `app/layout.tsx`):

```css
.only-desktop { display: block; }
.only-mobile  { display: none !important; }
@media (max-width: 859px) {
  .only-desktop { display: none !important; }
  .only-mobile  { display: block !important; }
}
```

Comentario textual del código: *"Corte mobile/desktop alineado al prototipo
(~860px). Vale para las 3 áreas."*

Implicancia clave para el diagnóstico de drift: **ambas maquetaciones viven en el
DOM al mismo tiempo**; el CSS solo oculta una. Por eso una sección puede existir en
un árbol y no en el otro sin que nada explote — es exactamente el drift que vamos a
cazar en las fases siguientes.

## Tabla: área → rutas → switch → breakpoint → tablet

| Área | Rutas raíz | Mecanismo de switch | Breakpoint de corte | Comportamiento en tablet (~768–1024px) |
|---|---|---|---|---|
| **Web pública** | `app/(public)`: `/`, `/contacto`, `/servicios`, `/trabajos`, `/tutoriales`, `/tutoriales/[slug]` | CSS `.only-mobile`/`.only-desktop` (doble árbol) **+** colapsos responsive internos del árbol desktop en `public.css` | **859px** (corte global) + **920px** (refinamiento intra-desktop) | 768px → árbol **mobile**. 860–920px → árbol **desktop** pero con burger + 1 columna (solapa con el árbol mobile). ≥921px → desktop pleno. |
| **Portal cliente** | `app/clientes`: `/login`, `/activar`, `/dashboard`, `/perfil`, `/tutoriales`, `/vehiculos`, `/vehiculos/[id]`, `/vehiculos/[id]/historial` | CSS `.only-mobile`/`.only-desktop` (doble árbol). `portal.css` y `portal-web.css` **sin** ninguna `@media`. | **859px** (solo el corte global) | 768px → **mobile**. 1024px → **desktop**. Sin ajustes intermedios: salto seco en 859/860. |
| **Panel admin** | `app/admin`: `/`, `/login`, `/clientes`, `/clientes/[id]`, `/ordenes`, `/ordenes/nueva`, `/ordenes/[id]`, `/servicios`, `/servicios/[id]`, `/vehiculos`, `/vehiculos/[id]`, `/tutoriales`, `/auditoria` | CSS `.only-mobile`/`.only-desktop` (doble árbol) **+** refinamiento "desktop angosto" a 1100px **+** un **JS `matchMedia("(max-width: 859px)")`** en `NewStateForm.tsx` | **859px** (corte global) + **1100px** (desktop angosto) | 768px → **mobile**. 860–1100px → desktop "angosto" (detalle de orden a 1 columna, tablas con scroll interno). ≥1101px → desktop pleno. |

## ¿El mecanismo es consistente entre las tres áreas?

**El núcleo, SÍ. Los bordes, NO.**

- **Consistente (núcleo):** las tres áreas usan el mismo switch — doble árbol con
  `.only-mobile`/`.only-desktop` y corte único a **859px** definido en `shared.css`.
  El breakpoint primario es uniforme.

- **Divergente (bordes):** el manejo del rango tablet/desktop-angosto difiere por área:
  - **Pública** mete colapsos responsive *dentro* del árbol desktop a 920px (burger,
    grids a 1 columna). Resultado: en la banda 860–920px el árbol "desktop" se
    re-adapta a algo casi-mobile, solapándose con lo que ya hace `HomeMobile`.
    Es el área con la lógica de corte más enredada.
  - **Admin** agrega un breakpoint propio a 1100px ("desktop angosto") **y** además
    es la única que usa **JS** (`matchMedia`) para decidir comportamiento, en
    `NewStateForm.tsx`. Mezcla CSS + JS.
  - **Cliente** no tiene nada extra: corte seco a 859px y listo. Es la más simple
    y la más consistente consigo misma.

### Notas / banderas para fases siguientes

1. **Doble árbol en DOM** → el drift es estructural, no de estilos. Hay que comparar
   *qué secciones existen* en cada árbol, no cómo se ven. Esto valida el enfoque de
   las Fases 1–2.
2. **Público con doble adaptación** (switch a 859 + colapsos a 920) es candidato a
   confusión: una sección podría estar tanto en `HomeMobile` como en el `HomeDesktop`
   colapsado. Ojo en Fase 3 (runtime) con la banda 860–920px.
3. **Admin con JS `matchMedia`** rompe la regla "todo el switch es CSS". Si hay más
   lógica JS de viewport escondida, conviene detectarla en Fase 1C.
4. **Breakpoints mágicos** (859 / 920 / 1100) hardcodeados en CSS plano, sin tokens
   compartidos. No es objeto de este diagnóstico cambiarlo, pero queda anotado.

## Inventario de archivos relevantes

- `src/components/shared/shared.css` — define el switch global (859px).
- `src/app/layout.tsx` — importa `shared.css` global.
- `src/app/(public)/public.css` — breakpoints 920/921 (intra-desktop).
- `src/app/admin/admin.css` — breakpoints 859/1100 (desktop angosto).
- `src/app/clientes/portal.css`, `portal-web.css` — sin `@media`.
- `src/components/admin/NewStateForm.tsx` — único uso de `matchMedia` (JS, 859px).
- Componentes Mobile/Desktop dedicados: `HomeDesktop`, `HomeMobile`, `MobileChrome`,
  `MobileFooter` (público); `DesktopTimeline` (cliente).

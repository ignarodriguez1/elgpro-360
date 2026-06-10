# Fase 1A — Inventario de secciones: Web Pública

> Área: `app/(public)`. Switch: doble árbol `.only-mobile` / `.only-desktop` a 859px.
> Solo lectura. "En mobile / En desktop" = la sección existe en ese árbol del DOM.

## Pantallas del área

| # | Ruta | Archivo |
|---|---|---|
| 1 | (global) header + footer | `app/(public)/layout.tsx` |
| 2 | `/` | `components/public/HomeDesktop.tsx` + `HomeMobile.tsx` |
| 3 | `/servicios` | `app/(public)/servicios/page.tsx` |
| 4 | `/contacto` | `app/(public)/contacto/page.tsx` |
| 5 | `/trabajos` | `app/(public)/trabajos/page.tsx` |
| 6 | `/tutoriales` | `app/(public)/tutoriales/page.tsx` |
| 7 | `/tutoriales/[slug]` | `app/(public)/tutoriales/[slug]/page.tsx` |

---

## 1. Chrome global (layout)

| Sección | En mobile | En desktop |
|---|---|---|
| Navbar / header (logo + acceso clientes/UserMenu) | ✅ (`MobileChrome`, burger) | ✅ (`PublicChrome`, links inline) |
| Menú overlay full-screen (nav + contacto) | ✅ | ❌ |
| Footer — marca + tagline | ✅ | ✅ |
| Footer — columna "Navegación" | ✅ | ✅ |
| Footer — columna "Contacto" | ✅ | ✅ |
| Footer — columna "Servicios" (5 ítems) | ❌ | ✅ |
| Footer — redes sociales | ✅ | ✅ |
| Footer — legal / copyright | ✅ | ✅ |

## 2. Home `/`

| Sección | En mobile | En desktop |
|---|---|---|
| Hero — título + sub + CTAs | ✅ | ✅ |
| Hero — trío de stats (+12 años / +800 autos / 100% documentado) | ❌ | ✅ |
| Hero — teaser de seguimiento en vivo | ✅ (card "En proceso" Hilux + barra) | ✅ (timeline demo "En vivo") |
| Hero — hint "scroll ↓" | ✅ | ❌ |
| Banda "concept" (historia clínica + seguimiento) | ✅ | ✅ |
| Sección Servicios ("Lo que hacemos") | ✅ | ✅ |
| Sección Proceso ("Cuatro pasos claros") | ✅ | ✅ |
| Sección Tracking ("Mirá tu auto sin venir al taller") + demo | ✅ | ✅ |
| Sección Portfolio ("Trabajos realizados") | ✅ (4 ítems) | ✅ (6 ítems) |
| Testimonial | ✅ | ✅ |
| CTA final ("Pedí tu cotización hoy") | ✅ | ✅ |

## 3. Servicios `/servicios`

| Sección | En mobile | En desktop |
|---|---|---|
| Header de página | ✅ | ✅ |
| Grilla / lista de servicios | ✅ | ✅ |
| CTA final | ✅ | ✅ |

## 4. Contacto `/contacto`

| Sección | En mobile | En desktop |
|---|---|---|
| Header de página | ✅ | ✅ |
| Formulario (+ estado "enviado") | ✅ | ✅ |
| Mapa | ✅ | ✅ |
| Tarjetas de contacto (WhatsApp/Mail/IG/Horarios) | ✅ | ✅ |

## 5. Trabajos `/trabajos`

| Sección | En mobile | En desktop |
|---|---|---|
| Header de página | ✅ | ✅ |
| Filtros (chips de categoría) | ✅ | ✅ |
| Grilla de trabajos | ✅ | ✅ |
| Lightbox antes/después | ✅ | ✅ |

## 6. Tutoriales `/tutoriales`

| Sección | En mobile | En desktop |
|---|---|---|
| Header de página | ✅ | ✅ |
| Filtros (categorías) | ✅ | ✅ |
| Grilla / lista de tutoriales | ✅ | ✅ |

## 7. Tutorial detalle `/tutoriales/[slug]`

> ⚠️ **Sin switch.** Esta pantalla NO usa `.only-mobile`/`.only-desktop`: renderiza
> un único árbol `.dpage` (estilo desktop) que se sirve igual a mobile.

| Sección | En mobile | En desktop |
|---|---|---|
| Header de página (categoría + título + desc) | ⚠️ árbol único | ⚠️ árbol único |
| Link "Volver a tutoriales" | ⚠️ árbol único | ⚠️ árbol único |
| Thumbnail + play (video) | ⚠️ árbol único | ⚠️ árbol único |
| Contenido del tutorial | ⚠️ árbol único | ⚠️ árbol único |

---

## Candidatos a divergencia (pre-clasificación, se confirma en Fase 2)

1. **Footer — columna "Servicios"**: solo desktop. El `MobileFooter` no la tiene.
2. **Home — trío de stats del hero** (+12 / +800 / 100%): solo desktop. El hero mobile
   muestra en su lugar una card de seguimiento distinta.
3. **`/tutoriales/[slug]` sin maquetación mobile**: árbol desktop único servido a todos.
   Puede ser intencional (página de artículo simple) o drift — a verificar en runtime.

### Divergencias menores (probablemente intencionales)

- Menú overlay full-screen: solo mobile (patrón de navegación móvil estándar).
- Hint "scroll ↓" del hero: solo mobile.
- Teaser de seguimiento del hero: existe en ambos pero con forma distinta.
- Densidad de portfolio en home: 4 ítems mobile vs 6 desktop (densidad, no sección).

## Resumen

- **Pantallas:** 7.
- **Paridad total:** servicios, contacto, trabajos, tutoriales (listado) — 4 pantallas limpias.
- **Con divergencia a revisar:** layout (footer), home (hero), tutorial detalle — 3 pantallas.
- El área pública es la **más pareja** de las tres: el grueso del drift se concentra en
  el footer, el hero de la home y una pantalla sin árbol mobile.

# Fase 0 — Matriz de reconciliación: Portal Cliente

> Insumo: inventario `diagnostico/01b-inventario-portal-cliente.md` (Fase 1B). Los hallazgos
> de alta prioridad fueron re-verificados contra código en esta fase (referencias por línea abajo).
> A diferencia de admin: **todas las pantallas ya tienen doble árbol** — no hay balde
> "SIN MOBILE — FALTA CONSTRUIR". El problema es drift entre árboles existentes.
> Un solo rol efectivo (cliente final): la dimensión de roles no aplica.
>
> Baldes: `INTENCIONAL` · `DRIFT ACCIDENTAL` · `A DECIDIR`
> Severidad: `FUNCIONAL` (no ve un dato) · `INTERACCIÓN` (puede operar en un viewport y no en otro) · `COSMÉTICO`

---

## 1. Navegación global — `app/clientes/layout.tsx`

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Layout | Navegación principal | ✅ `BottomNav` (3 tabs) | ✅ `PwNav` (navbar) | INTENCIONAL | — | Patrones de nav distintos por diseño. OK. |
| Layout | Logo + pill "Portal de clientes" | ❌ | ✅ | INTENCIONAL | COSMÉTICO | Chrome propio del navbar desktop. OK. |
| Layout | `UserMenu` / logout en nav | ❌ | ✅ | INTENCIONAL | — | **Condición verificada**: el logout SÍ es alcanzable en mobile vía Perfil (botón logout presente en ambos árboles de `/clientes/perfil`). Documentar como `desktop` en la fuente de verdad. |
| Layout | `SessionNotice` (admin en zona cliente) | ✅ | ✅ | — (paridad) | — | Componente compartido. OK. |

## 2. Login — `/clientes/login`

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Login | Todo (fondo, logo, form, links) | ✅ | ✅ | — (paridad total) | — | Pantalla limpia. Modelo de referencia. |

## 3. Activar — `/clientes/activar`

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Activar | 3 estados (token inválido / éxito / form) | ✅ | ✅ | — (paridad) | — | OK. |
| Activar | Fondo hero con foto | ✅ | ❌ (solo `var(--bg)`) | DRIFT ACCIDENTAL | COSMÉTICO | Login tiene foto en ambos; activar la pierde en desktop. Fix barato en Fase 4. |

## 4. Dashboard — `/clientes/dashboard`

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Dashboard | Saludo + label "Mis vehículos" + contador + empty state | ✅ | ✅ | — (paridad) | — | OK. |
| Dashboard | **Card de vehículo SIN orden activa → navegable** | ✅ siempre `Link` | ❌ `div` muerto | **DRIFT ACCIDENTAL** | **INTERACCIÓN** | Verificado: `dashboard/page.tsx:143-146` — `order ? <Link> : <div>`. Mobile siempre linkea al detalle (donde está el acceso al historial); desktop deja la card muerta. Espejo de Historial #8. **Definir UNA regla en Fase 3 y aplicarla a ambos** (propuesta: card siempre navegable — el detalle tiene contenido útil aun sin orden: estado + link a historial). |
| Dashboard | Punto de color del vehículo en la card | ❌ (`colorHex` no se pasa a `VehicleCard`) | ✅ (`pwv-dot`) | DRIFT ACCIDENTAL | COSMÉTICO | El dato ya viene en la query. Fix menor en Fase 4. Causa raíz: componente compartido vs markup `pwv` inline (ver "Fuera de scope"). |

## 5. Perfil — `/clientes/perfil`

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Perfil | Datos de cuenta + botón logout | ✅ | ✅ | — (paridad) | — | OK. |
| Perfil | Avatar de iniciales en cabecera | ✅ | ❌ (título "Mi perfil") | INTENCIONAL | COSMÉTICO | Tratamientos de cabecera distintos por diseño. Documentar y no tocar. |
| Perfil | Link "Ver sitio público" | ✅ | ❌ | DRIFT ACCIDENTAL | COSMÉTICO | En desktop el sitio público es alcanzable por URL pero no hay link. Sin razón aparente para omitirlo. Propuesta: agregarlo en desktop (Fase 4). |

## 6. Tutoriales — `/clientes/tutoriales`

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Tutoriales | Lista/grilla + empty state | ✅ | ✅ | — (paridad) | — | OK. |
| Tutoriales | Título de cabecera | "Tutoriales" | "Cuidados" | A DECIDIR | COSMÉTICO | Títulos distintos para la misma pantalla. Decisión menor: unificar o documentar como intencional. |
| Tutoriales | Cards clickeables al detalle | ❌ `div` | ❌ `div` | — (paridad… en el bug) | — | **NO es drift de viewport** — es bug funcional parejo (el listado público SÍ linkea a `/tutoriales/[slug]`). Ver "Decisiones pendientes" #2. |

## 7. Detalle de vehículo — `/clientes/vehiculos/[id]`

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Vehículo | **Total del presupuesto en banner "listo"** | ❌ `<ReadyBanner />` sin `total` | ✅ `pwready` con `budgetAmount` | **DRIFT ACCIDENTAL** | **FUNCIONAL** | Verificado: `vehiculos/[id]/page.tsx:66` (mobile, sin prop) vs `:129` (desktop, total formateado). El componente YA soporta `total` — el cliente mobile no ve el precio de su trabajo. **Prioridad #1, Fase 2.** |
| Vehículo | **Timeline — empty state ("Todavía no hay novedades")** | ✅ | ❌ card vacía | **DRIFT ACCIDENTAL** | **FUNCIONAL** | Verificado: `DesktopTimeline.tsx` renderiza `visible.map(...)` sin rama para lista vacía — orden sin novedades = card de seguimiento muda. **Fase 2.** |
| Vehículo | **Sidebar — datos del vehículo (modelo/patente/color/año)** | ❌ | ✅ | **A DECIDIR** | **FUNCIONAL** | No existe en mobile en ningún lado. ¿Dónde va esta info en mobile? Ver "Decisiones pendientes" #1. |
| Vehículo | **Sidebar — "Cuidados recomendados" (3 tips)** | ❌ | ✅ | **A DECIDIR** | FUNCIONAL | Ídem anterior. Nota: contenido hardcodeado; en mobile existe la pantalla Tutoriales/Cuidados — ¿la sidebar desktop duplica eso o es otra cosa? Ver "Decisiones pendientes" #1. |
| Vehículo | Timeline — límite de fotos | máx. 3 (`Timeline`) | todas (`DesktopTimeline`) | DRIFT ACCIDENTAL | FUNCIONAL | Causa raíz: componente duplicado. **NO parchar acá** — se resuelve en el prompt de consolidación (ver "Fuera de scope"). Anotado para que la fuente de verdad lo registre como `both` con paridad de contenido. |
| Vehículo | Subtítulo del hero | `title · orderCode` | `title · color · año` | A DECIDIR | COSMÉTICO | Contenido distinto para el mismo slot. Decisión menor: ¿cuál es el correcto? |
| Vehículo | Link volver ("Mis vehículos") | ❌ | ✅ | INTENCIONAL | — | Mobile navega con `BottomNav`. Patrón consistente en toda el área (ídem Historial). Documentar como `desktop`. |
| Vehículo | Hero, etapa+ETA, servicios, productos, estado sin orden | ✅ | ✅ | — (paridad) | — | Formas distintas (StageBar compacta vs track horizontal), misma función. OK. |

## 8. Historial — `/clientes/vehiculos/[id]/historial`

| Pantalla | Sección | En mobile | En desktop | Tipo de divergencia | Severidad | Notas / decisión propuesta |
|---|---|---|---|---|---|---|
| Historial | **Cards de trabajos completados → navegables** | ✅ `Link` al vehículo | ❌ `div` muerto | **DRIFT ACCIDENTAL** | **INTERACCIÓN** | Verificado: `historial/page.tsx:53` (mobile `Link`) vs `:78` (desktop `div`). Espejo invertido de Dashboard #4 — acá mobile linkea y desktop no. Confirma que no hay regla: cada árbol decidió solo. **Misma regla única de Fase 3.** Nota: el `Link` mobile apunta al detalle del vehículo, no a un detalle del trabajo — revisar si ese destino es el correcto al definir la regla. |
| Historial | Contador "N trabajos" | ❌ | ✅ | DRIFT ACCIDENTAL | COSMÉTICO | Dato gratis (`orders.length`). Fase 4. |
| Historial | Link volver ("Volver al vehículo") | ❌ | ✅ | INTENCIONAL | — | Mismo patrón de nav que el detalle. Documentar como `desktop`. |
| Historial | Cabecera + empty state | ✅ | ✅ | — (paridad) | — | OK. |

---

## Resumen por balde y severidad

| Balde | FUNCIONAL | INTERACCIÓN | COSMÉTICO | Total |
|---|---|---|---|---|
| DRIFT ACCIDENTAL | 3 (total presupuesto, empty timeline, límite fotos*) | 2 (dashboard card, historial cards) | 5 (foto activar, dot color, ver sitio público, contador trabajos, —) | 10 |
| A DECIDIR | 2 (sidebar datos, sidebar cuidados) | — | 2 (título tutoriales, subtítulo hero) | 4 |
| INTENCIONAL | — | — | 6 (nav, logo, UserMenu, avatar, links volver ×2) | 6 |

\* el límite de fotos se resuelve en consolidación, no acá — figura para que la fuente de verdad registre el contrato.

**Lectura:** 2 pantallas limpias (login, activar casi), 1 con bug parejo (tutoriales), 5 con drift real. Las dos divergencias FUNCIONALES de Fase 2 son fixes de una línea conceptual cada una; las de INTERACCIÓN requieren primero definir la regla (Fase 3); las `A DECIDIR` bloquean la Fase 4.

## Decisiones del CHECKPOINT 0 (gate humano — RESUELTAS)

1. **Sidebar del detalle de vehículo en mobile** → **Opción A: apilar al final del detalle mobile** (datos del vehículo + cuidados recomendados como bloques apilados). Paridad de información completa; costo aceptado: scroll más largo. Se implementa en Fase 4.
2. **Cards de tutoriales sin link en NINGÚN viewport** → **ENTRA en este prompt**: envolver con `Link` a `/tutoriales/[slug]` en ambos árboles, igual que el listado público. Se implementa junto con la Fase 3 (regla de "qué card linkea a dónde").
3. **Menores `A DECIDIR`** (título "Tutoriales" vs "Cuidados"; subtítulo del hero `orderCode` vs `color · año`): sin decisión explícita del checkpoint — la Fase 1 carga una propuesta por defecto en la fuente de verdad y se ratifica en CHECKPOINT 1.

## Fuera del scope de esta normalización (anotado, NO se resuelve acá)

- **Componentes duplicados** — causa raíz de los drifts #1, #2 y del límite de fotos:
  `Timeline` (compartido) vs `DesktopTimeline` (copia), `VehicleCard` vs markup `pwv` inline,
  `ReadyBanner` vs `pwready` inline. → **Prompt de consolidación aparte, COMPARTIDO con admin**
  (la `Timeline` vive en ambas áreas; se consolida una vez, no por área).
- **Secuencia asumida**: reconciliación primero, consolidación después. Los fixes de Fase 2
  son parches sobre los duplicados y parte se descartará al consolidar — asumido y aceptado.

## Próximo paso

Con las decisiones del checkpoint tomadas → **Fase 1**: fuente de verdad de secciones del
portal cliente, **reutilizando el patrón de admin** (`SectionDef` / `ScreenDef` de
`diagnostico/admin/01-fuente-de-verdad.md`), en `src/lib/cliente-sections.ts`.

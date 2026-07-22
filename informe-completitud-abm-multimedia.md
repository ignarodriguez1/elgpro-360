# Informe de completitud — ABM de contenido + multimedia (imagen y video)

**Fase 0 — Auditoría de solo lectura** · 22 de julio de 2026
**Ámbito:** Panel admin · Portal cliente · Sitio público
**Método:** análisis estático con evidencia archivo:línea + verificación de runtime sobre `next build && next start` en Chromium y WebKit reales + consultas de solo lectura a la base y al bucket. Detalle completo en la sección 7.

---

## 1. Resumen ejecutivo

**Lo que pide el cliente NO es alcanzable con el schema actual: requiere migración, de tamaño medio y aditiva (sin reescritura destructiva).** Concretamente:

1. **Multi-imagen por servicio: NO EXISTE.** `Service.imageUrl` es un escalar (`String?`) que además está *muerto en escritura* (ninguna UI ni action lo setea; hoy hay 0 servicios con imagen en la base). Requiere modelo nuevo (`ServiceImage` con orden, portada, alt y ref de storage) + UI de carga + migración.
2. **Video en OT: NO EXISTE NADA** — ni campo, ni `<video>`, ni validación `video/*`, ni poster, ni transcodificación, ni signed upload. Y hay una **restricción dura de plataforma**: todo upload pasa por una función de Vercel (límite 4.5 MB), así que video por el camino actual **no es viable**; exige upload directo navegador→bucket con URL firmada de GCS, que hay que construir de cero.
3. **Antes/después (trabajos): ~75% real, no 90%.** El ABM y el sitio público funcionan (verificado en runtime), pero falta reordenar, cada reemplazo/borrado de imagen **filtra un asset huérfano irrecuperable** (no se persiste la ref de storage), y el lightbox de `/trabajos` tiene déficits de accesibilidad confirmados en runtime.
4. **El bloqueante PUBID está RESUELTO** en código y en datos (migración `20260621011353`, cadena completa persiste `publicId`, 0 filas sin ref). El patrón que denunciaba **sigue vivo en PortfolioWork** (la ref se descarta) y ya produjo **5 huérfanos medidos en el bucket** (33% de los objetos), dos de ellos HEIC de iPhone que ningún navegador Chrome puede mostrar.
5. **R1 no se reprodujo** en el build de producción local: server actions desde componentes cliente funcionaron (rename de servicio ejecutado y verificado end-to-end), consola sin errores de hidratación. No lo doy por cerrado —ver §7— pero no bloqueó nada de lo probado.

---

## 2. Tabla maestra de brechas

Orden: primero pérdida de datos, después lo que bloquea el objetivo del cliente, después el resto.

| # | Área | Brecha | Estado | ¿Migración? | ¿Bloqueada por R1/PUBID? | Esfuerzo |
|---|---|---|---|---|---|---|
| 1 | Storage | Assets huérfanos por diseño: `ImageSlot` descarta la `ref`, `PortfolioWork`/`Service` no tienen columna para persistirla, y **ningún** flujo llama `StorageProvider.delete()` (5 huérfanos ya medidos, 14.6 MB→33%) | ⚠️ | Sí (columnas `beforeRef`/`afterRef` o equivalente) | No — es el patrón PUBID replicado | Medio |
| 2 | Uploads | HEIC de iPhone sube crudo (la compresión cliente no lo decodifica y lo deja pasar) y **no renderiza en Chrome**: "sube bien, no se ve". 2 casos reales en bucket | ⚠️ | No | No | Bajo |
| 3 | Portal | Fotos con `visibleToCustomer=false` **llegan igual al portal** (el query y el snapshot realtime no filtran a nivel foto). Hoy latente (0 fotos ocultas en DB) | ⚠️ | No | No | Bajo |
| 4 | Servicios | Multi-imagen por servicio no existe (escalar muerto en escritura; 0 imágenes cargadas) | ❌ | **Sí** (modelo `ServiceImage`) | No | Alto |
| 5 | Servicios | Editar descripción e imagen del servicio: la UI solo permite renombrar; el action descarta `description`/`imageUrl` | ⚠️ | No | No | Bajo |
| 6 | Video OT | Video: nada existe en ninguna capa | ❌ | **Sí** (ver §D.3) | No | Alto |
| 7 | Video OT | Upload por server-proxy tope 4.5 MB Vercel → video inviable por el camino actual; no hay infraestructura de signed upload GCS | ❌ | No (infra nueva) | No | Alto |
| 8 | Trabajos | Reordenar obras del portfolio: no hay UI ni action (solo append al crear) | ❌ | No | No | Bajo |
| 9 | Trabajos | Borrado físico de obra sin borrar assets + sin confirmación de integridad (no hay vínculo a OT, así que no rompe integridad, pero filtra assets — ver #1) | ⚠️ | — | No | — |
| 10 | Trabajos | Inconsistencia de "antes" faltante: el home hace fallback al "después"; `/trabajos` muestra placeholder | ⚠️ | No | No | Bajo |
| 11 | A11y | Lightbox de `/trabajos`: Escape NO cierra (confirmado runtime), sin `role="dialog"`, sin focus trap, prev/next sin `aria-label`; el de home (WorkStack) sí tiene todo | ⚠️ | No | No | Bajo |
| 12 | Admin | `budgetAmount`/`paymentStatus`/`internalNotes`: se muestran pero **no hay UI que los cargue ni edite** (params fantasma del action) | ⚠️ | No | No | Bajo |
| 13 | Admin | WorkOrder sin edición post-creación (título, descripción, ETA) ni borrado (decisión de diseño: las órdenes no se borran) | ❌ parcial | No | No | Medio |
| 14 | Admin | Usuarios: sin cambio de rol post-creación, sin editar nombre/email, sin borrar | ❌ | No | No | Bajo |
| 15 | Portal | Cards "Cuidados recomendados" con overlay de play: **muertas** (confirmado runtime — el tap no hace nada); no leen de `Tutorial` | ⚠️ | No | No | Bajo |
| 16 | Portal | "Notificaciones — Email activado" en perfil: texto estático, no hay preferencia ni toggle | ⚠️ | Sí si se quiere real | No | Bajo |
| 17 | Portal | Segunda OT activa sobre el mismo vehículo: invisible (`take:1` sin `orderBy` + `.find()`) | ⚠️ | No | No | Bajo |
| 18 | Portal | Timeline mobile trunca a 3 fotos sin indicador "+N" (el CSS existe, ningún TSX lo usa) | ⚠️ | No | No | Bajo |
| 19 | Honestidad | `InProgressBadge` + paso actual + StageBar pulsan en loop infinito sin dato vivo detrás (también a las 3 AM de un domingo) | ⚠️ | No | No | Bajo |
| 20 | Realtime | Con `NEXT_PUBLIC_WS_URL` seteada y sin servidor WS alcanzable, el cliente ve "Reconectando"→"offline" perpetuo (observado en runtime local; en Vercel depende de la env) | ⚠️ | No | No | Bajo |
| 21 | Config local | `.env` local con `GCS_BUCKET_NAME` que **no existe** y `AUTH_URL=https://tu-dominio-de-prod` (placeholder): upload local roto y redirects de auth rotos en prod-mode local | ⚠️ | No | No | Trivial |
| 22 | Servicios | Ocultar un servicio de la web también lo saca del picker de nueva orden (`listServices(false)` en el wizard) — efecto lateral no obvio | ⚠️ | No | No | Bajo |
| 23 | Errores | Camino de upload sin ningún log server-side; el mensaje crudo del provider (p. ej. credenciales GCS) viaja al cliente en el 500 | ⚠️ | No | No | Bajo |
| 24 | Limpieza | Código muerto: `uploadAndSavePhoto`, `generateSignedUploadParams`, `deleteService`, `markStepAsCurrent`, `getAdminStats`, `next-cloudinary` (0 usos), schemas de password, `TutorialToggle`/`ABadge`/`StatCard` | ℹ️ | No | No | Bajo |

**Nota positiva verificada:** monetario en `Decimal(12,2)` ✅ (cero `Float` en el schema), búsquedas de admin **cableadas de verdad** (no fantasma, verificado runtime), roles validados server-side en todas las páginas y actions del admin, snapshot de flujo en OTs (sin reescritura retroactiva), y skeletons 14/14 rutas admin.

---

## 3. Bloque por bloque

### BLOQUE A — Infraestructura de almacenamiento

#### A.1 Inventario de proveedores

Tres proveedores instalados, factory por env en `src/services/storage/index.ts:19-33` (`STORAGE_PROVIDER`: `local` | `cloudinary` (default) | `gcs`), detrás del puerto hexagonal `src/services/storage/storage-provider.ts`.

**El proveedor VIVO es GCS.** Evidencia: `STORAGE_PROVIDER=gcs` en el entorno, y el 100% de los medios persistidos en la base apunta a `https://storage.googleapis.com/elg-pro-gcs/…` (4 fotos de OT, 6 imágenes de portfolio; primera foto 2026-06-23, última 2026-07-17/21).

**Cloudinary: instalado y muerto en el camino de subida, pero con acoplamientos residuales vivos:**
- `uploadAndSavePhoto` ([upload.service.ts:33-50](src/services/upload.service.ts#L33-L50)) sube directo a Cloudinary — **cero llamadores** (código muerto).
- `generateSignedUploadParams` ([cloudinary.ts:23-40](src/lib/cloudinary.ts#L23-L40)) — **cero llamadores** (infra de signed upload muerta).
- `generateThumbnailUrl` ([cloudinary.ts:62-71](src/lib/cloudinary.ts#L62-L71)) **sí está en caminos vivos** ([upload.service.ts:13](src/services/upload.service.ts#L13) y [work-order.service.ts:313](src/services/work-order.service.ts#L313)): hace `replace("/upload/", "/upload/c_fill,w_200,h_200/")`. Con URLs de GCS es un **no-op silencioso** → `thumbnailUrl` = imagen full (confirmado en datos: 0 filas con thumb distinto). El "thumbnail" no existe con GCS; el portal descarga la imagen completa como miniatura.
- `next-cloudinary` en `package.json`: **0 usos** en `src` — dependencia muerta.

**Mapa por tipo de medio:**

| Tipo de medio | Proveedor hoy | Camino de carga | ¿Ref durable? |
|---|---|---|---|
| Fotos de OT (cambio de estado, alta, estados custom) | GCS | `UploadZone`/`OrderActions` → `POST /api/upload` ([route.ts](src/app/api/upload/route.ts)) → factory → [gcs.ts:105-126](src/lib/gcs.ts#L105-L126); persisten [nueva/actions.ts:76-87](src/app/admin/ordenes/nueva/actions.ts#L76-L87), [[id]/actions.ts:63-73](src/app/admin/ordenes/%5Bid%5D/actions.ts#L63-L73), gate [work-order.service.ts:307-318](src/services/work-order.service.ts#L307-L318) | **SÍ** — `publicId` en toda la cadena desde migración `20260621011353` |
| Imágenes de servicios | — | **NO EXISTE camino de carga** (`Service.imageUrl` muerto en escritura; 0 en DB) | N/A |
| Antes/después (PortfolioWork) | GCS | `ImageSlot` → `uploadImageFile` ([upload-client.ts:17-28](src/lib/upload-client.ts#L17-L28)) → `/api/upload`; persisten [trabajos/actions.ts:51-52, 82-83](src/app/admin/trabajos/actions.ts#L51-L52) | **NO** — [ImageSlot.tsx:38-39](src/components/shared/ImageSlot.tsx#L38-L39) descarta `asset.ref`; el modelo no tiene columna |
| Avatares / otros | — | No existen | N/A |
| Videos | — | No existe nada (ver Bloque D) | N/A |

#### A.2 GCS: estado real

- Cliente lazy en [gcs.ts:78-89](src/lib/gcs.ts#L78-L89). Credenciales: `GCS_CREDENTIALS_JSON` (prioridad; `JSON.parse` resuelve los `\n`) o `GCS_CLIENT_EMAIL`+`GCS_PRIVATE_KEY` con **desescape explícito** `privateKey.replace(/\\n/g, "\n")` en [gcs.ts:73](src/lib/gcs.ts#L73). **La falla conocida del `\n` está resuelta en ambas ramas.** Validación en runtime (no module scope) con mensajes claros.
- **Bucket PÚBLICO a nivel IAM, sin CDN delante, sin signed URLs.** URL directa `https://storage.googleapis.com/<bucket>/<obj>` ([gcs.ts:123](src/lib/gcs.ts#L123)). Verificado en runtime: `GET` anónimo → **200**. `Cache-Control: public, max-age=31536000, immutable` ([gcs.ts:119](src/lib/gcs.ts#L119)).
- **TTL de URLs firmadas: N/A** — no hay firma. Consecuencia positiva: el historial del portal **no se rompe nunca** (las URLs son permanentes). Contrapartida: cualquiera con la URL accede a la foto (mitigado por UUID no adivinable, pero las fotos de vehículos de clientes son públicas de facto). Es una **decisión abierta** (§5).
- Soporte de **byte-range verificado**: `Range: 0-99` → **206** (relevante para video futuro y Safari).
- **Drift de config local:** el `GCS_BUCKET_NAME` del `.env` local **no coincide** con el bucket real que usan los datos (`elg-pro-gcs`) — listar el bucket configurado da "The specified bucket does not exist". **El upload en dev local está roto hoy**; producción (Vercel) evidentemente tiene el valor correcto.

#### A.3 Límite duro de Vercel

- **Todo upload atraviesa la función serverless**: `POST /api/upload` es server-proxy explícito ([route.ts:8-10](src/app/api/upload/route.ts#L8-L10)); el binario viaja en el body.
- El límite real es **4.5 MB de Vercel**, no los 10 MB de `MAX_BYTES` ([route.ts:5](src/app/api/upload/route.ts#L5)): un archivo de 5-10 MB pasa la validación de la app pero muere antes con `413 FUNCTION_PAYLOAD_TOO_LARGE` de plataforma. Esto ya pasó y se mitigó con **compresión cliente** ([image-compression.ts](src/lib/image-compression.ts): 1920px máx, JPEG 0.8, ~1-2 MB).
- **Conclusión dura, no opinión:** un video de celular de 30 s (30-100 MB) **no puede subirse por esta vía**. No existe hoy ninguna infraestructura de signed upload URL (búsqueda exhaustiva: `getSignedUrl|presigned|createResumableUpload|signBlob|generateSignedPostPolicy` → 0 hits en `src`; lo único que existía era el helper muerto de Cloudinary). **Hay que construir upload directo navegador→GCS desde cero.**

#### A.4 Ciclo de vida y huérfanos (medido, no estimado)

- **Ningún flujo de la app borra objetos del storage.** Los tres adapters implementan `delete(ref)` pero hay **cero call sites** (la propia interfaz lo admite: "Aún no se cablea desde la app" — [storage-provider.ts:36](src/services/storage/storage-provider.ts#L36)). `deleteWorkAction` borra solo la fila ([trabajos/actions.ts:104](src/app/admin/trabajos/actions.ts#L104)). No hay UI para borrar fotos de OT. No hay job de limpieza.
- **Medición real del bucket `elg-pro-gcs` (22/7/2026):** 15 objetos, 14.6 MB. Referenciados por la DB: 10. **Huérfanos: 5 (33%)** — 3 JPG (20-21/7, subidas de prueba o reemplazos) y **2 HEIC de ~2 MB** (iPhone; ver ⚠️ #2 del catálogo).
- **PUBID en filas: 0 huérfanos.** Las 4 `WorkOrderPhoto` tienen `publicId`. El bloqueante como "pérdida de datos activa que empeora a diario" está **desactualizado**: quedó cerrado por la migración `20260621011353_add_photo_public_id` + la cadena completa de persistencia. **El patrón sigue abierto en PortfolioWork** (brecha #1).

---

### BLOQUE B — ABM de Servicios

#### B.1 Modelo de datos

```prisma
model Service {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  imageUrl    String?
  visible     Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  flow FlowStep[] // hoja de ruta de estados del servicio (editor de flujo)
}
```
([schema.prisma:199-210](prisma/schema.prisma#L199-L210))

- **Imágenes: escalar** (`imageUrl String?`) → **multi-imagen NO EXISTE y requiere migración.** Así de claro. No hay modelo de galería, ni orden, ni portada, ni `alt`, ni ref de storage. Peor: el escalar está **muerto en escritura** — ninguna UI/action/seed lo setea (grep exhaustivo: solo lectores en [(public)/servicios/page.tsx:19](src/app/(public)/servicios/page.tsx#L19) y [(public)/page.tsx:28](src/app/(public)/page.tsx#L28)); hoy `imageUrl` es `NULL` en los 10 servicios. Las cards públicas usan el fallback hardcodeado de [public-data.ts:39-56](src/lib/public-data.ts#L39-L56).
- **Publicación:** boolean `visible` (no hay borrador como estado separado). Toggle completo en admin.
- **Slug: NO. SEO (meta title/description): NO** (tampoco `generateMetadata` en la página pública). Los tutoriales sí tienen slug — el patrón existe en el codebase, no se aplicó acá.
- **Orden entre servicios: SÍ, ciclo completo** — drag con Pointer Events (mouse+touch, [usePointerReorder.ts](src/components/admin/usePointerReorder.ts)) → `reorderServicesAction` → transacción → el público consume `orderBy sortOrder` ([service.service.ts:14](src/services/service.service.ts#L14)).

#### B.2 Servicio ↔ FlowStep ↔ OT — **SNAPSHOT, no referencia viva** ✅

Respuesta central con evidencia:

- `createWorkOrder` **materializa** el timeline como filas `WorkOrderStatusUpdate` en el momento de la creación ([work-order.service.ts:150-164](src/services/work-order.service.ts#L150-L164)); el doc-comment lo dice textual: *"Snapshot: una vez creada, editar el flujo del servicio NO altera la orden"* ([:102-105](src/services/work-order.service.ts#L102-L105)).
- `WorkOrderStatusUpdate` **no tiene FK** a `FlowStep` ni a `Service` ([schema.prisma:133-157](prisma/schema.prisma#L133-L157)); la orden guarda **nombres** de servicios, no IDs (`servicesRequested String[]`, [:113](prisma/schema.prisma#L113)).
- Ninguna ruta de código propaga cambios de `FlowStep` hacia updates existentes. Incluso borrar físicamente un servicio (cascade sobre FlowStep) deja las OTs intactas.

**El riesgo de reescritura retroactiva NO existe.** Riesgo lateral real encontrado: el wizard de nueva orden solo ofrece servicios **visibles** ([nueva/page.tsx:11](src/app/admin/ordenes/nueva/page.tsx#L11)) → ocultar de la web = ocultar del taller (brecha #22).

#### B.3 UI del panel admin

Las pantallas de servicios son **single-tree responsive** (no dual-DOM): cero `only-desktop/only-mobile` en `admin/servicios/**` (el switch dual existe en el chrome del AdminShell y en otras pantallas). Por construcción, **paridad total desktop/mobile**; el reorder usa Pointer Events (touch OK a nivel código; el comentario CSS de [admin.css:829-831](src/app/admin/admin.css#L829-L831) que dice lo contrario está **obsoleto**).

| Operación | Desktop | Mobile | Notas |
|---|---|---|---|
| Listar servicios | ✅ | ✅ | Verificado runtime; [page.tsx:5-22](src/app/admin/servicios/page.tsx#L5-L22) |
| Crear servicio | ✅ | ✅ | Solo nombre, vía `window.prompt` ([ServicesList.tsx:30-37](src/components/admin/ServicesList.tsx#L30-L37)); el action descarta description/imageUrl ([actions.ts:48](src/app/admin/servicios/actions.ts#L48)) |
| Editar servicio | ⚠️ | ⚠️ | **Solo rename** (blur → action, verificado runtime end-to-end). `description`/`imageUrl` sin UI — únicos callers de `updateService`: rename y toggle ([actions.ts:66,79](src/app/admin/servicios/actions.ts#L66)) |
| Eliminar / desactivar | ⚠️ | ⚠️ | Solo lógico (`visible`). `deleteService` (físico, [service.service.ts:81-84](src/services/service.service.ts#L81-L84)) es **código muerto sin caller** — no hay botón. Bien: borrado físico con OTs históricas no rompería integridad (snapshot), pero mejor que siga sin exponerse |
| Subir 1 imagen | ❌ | ❌ | No existe (ver B.1) |
| Subir N imágenes | ❌ | ❌ | Estructuralmente imposible con el escalar |
| Reordenar imágenes | ❌ | ❌ | Ídem |
| Elegir portada | ❌ | ❌ | Ídem |
| Eliminar una imagen | ❌ | ❌ | Ídem |
| Editar pasos de flujo | ✅ | ✅ | Add/edit inline/delete/reorder completos ([FlowEditor.tsx](src/components/admin/FlowEditor.tsx), [actions.ts:91-160](src/app/admin/servicios/actions.ts#L91-L160)). Delete de paso **sin confirmación** |
| Publicar / despublicar | ✅ | ✅ | Toggle optimista ([ServicesList.tsx:63-69](src/components/admin/ServicesList.tsx#L63-L69)) |

Autorización: todas las actions con `assertOwner()` (ADMIN only) + audit log en cada mutación.

#### B.4 Propagación al sitio público — ✅ FUNCIONA (verificado en runtime de producción)

1. `/servicios` **lee de la base**: `listServices(false)` ([page.tsx:12](src/app/(public)/servicios/page.tsx#L12)). Los hardcodes de `public-data.ts` sobreviven solo como mapa de visuales/fallback de imagen. El home igual (primeros 4 visibles, [page.tsx:17-30](src/app/(public)/page.tsx#L17-L30)).
2. Estrategia de rendering: **`export const dynamic = "force-dynamic"` en las 6 páginas públicas** (servicios:8, home:8, trabajos:4, contacto:4, tutoriales:8, [slug]:8). La tabla del build lo confirma: **todas las rutas son ƒ (Dynamic)**, ninguna estática. Cada request consulta Prisma.
3. **Verificación de runtime ejecutada (build de prod):** renombré "Detail exterior" → "Detail exterior AUDIT-TEMP" desde el admin (blur → `renameServiceAction`), verifiqué la fila en DB, abrí `/servicios` en contexto de navegador nuevo → **el cambio apareció inmediatamente**, y revertí (DB verificada restaurada). Los 5 servicios visibles de la DB aparecen en **ambos árboles** (5/5 desktop, 5/5 mobile) y los 5 ocultos **no** aparecen.
4. `revalidatePath`: las actions de servicios revalidan **solo rutas admin** ([actions.ts:43,58,74,88,103,123,146,159](src/app/admin/servicios/actions.ts#L43)) — **nunca `/` ni `/servicios`**. Hoy es inocuo porque todo es `force-dynamic` (el server siempre está fresco). Contraste: tutoriales y trabajos sí revalidan sus rutas públicas. **Nota preventiva:** si mañana se optimiza el caching (ISR/`revalidate`), los cambios del admin dejarán de verse y nadie va a saber por qué — el `revalidatePath` público debería agregarse igual como cinturón.
5. Modo de verificación: **`next build && next start`** (no `next dev`). El staleness residual del Router Cache del cliente en navegación SPA no se midió exhaustivamente (ver §7).

---

### BLOQUE C — Trabajos realizados (antes/después)

#### C.1 Modelo

```prisma
model PortfolioWork {
  id             String   @id @default(cuid())
  title          String
  category       String
  description    String?  @db.Text
  afterImageUrl  String?
  beforeImageUrl String?
  tint           String?
  tall           Boolean  @default(false)
  visible        Boolean  @default(true)
  sortOrder      Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  @@index([visible, sortOrder])
}
```
([schema.prisma:254-268](prisma/schema.prisma#L254-L268))

- Entidad propia de **marketing**, derivada de nada: **sin vínculo a `WorkOrder`** (cero relaciones, sin picker que copie datos de una orden).
- Par antes/después: **dos escalares nullable**. Sin ref de storage → **mismo problema PUBID** (la brecha #1).
- **Privacidad:** el flujo de campos al público es una allowlist cerrada ([portfolio.ts:30-39](src/lib/portfolio.ts#L30-L39)) — patente/nombre/dominio **no pueden filtrarse automáticamente**. Riesgo residual solo manual: el admin puede tipear una patente en el título (el placeholder modela identificación del vehículo: "Audi A3 — Repintado integral") o subir una foto con la patente visible. Hoy: título/descripcion de las 3 obras no contienen datos de clientes (revisado), las fotos no se auditaron visualmente una a una.
- Hay título, categoría, descripción, fecha (`createdAt`); servicio asociado: NO (categoría libre con datalist).

#### C.2 Admin y público

- **ABM:** listar/crear/editar/eliminar (**físico**, con `window.confirm`)/toggle visible — todos completos, ADMIN only, auditados ([trabajos/actions.ts](src/app/admin/trabajos/actions.ts), [TrabajosEditor.tsx](src/components/admin/TrabajosEditor.tsx)). **Reordenar: NO EXISTE** pese a que `sortOrder` define el orden público — solo append al crear ([actions.ts:40-44](src/app/admin/trabajos/actions.ts#L40-L44)).
- **Carga del par:** se puede guardar solo-antes, solo-después o **ninguna** (zod: solo `title`/`category` requeridos, [actions.ts:18-27](src/app/admin/trabajos/actions.ts#L18-L27)). El público **no rompe**: `Photo` renderiza un fill de gradiente con overlay de texto ([Photo.tsx:55-70](src/components/shared/Photo.tsx#L55-L70)). **Inconsistencia real:** con "antes" faltante, el **home** hace fallback a la foto "después" ([WorkStack.tsx:148](src/components/public/WorkStack.tsx#L148) — muestra el "después" etiquetado "Antes"), mientras `/trabajos` muestra placeholder ([TrabajosGallery.tsx:31](src/app/(public)/trabajos/TrabajosGallery.tsx#L31)).
- **Visualización pública:** ni slider ni lado-a-lado — **lightbox con toggle Antes/Después** + prev/next, duplicado por árbol con estado compartido. El `Lightbox.tsx` compartido NO se usa acá (ambos lightboxes de portfolio son markup propio). ✅ **Runtime:** 3/3 obras en ambos árboles, lightbox abre en desktop y mobile, imágenes GCS cargan 6/6, filtros de categoría presentes.
- **Caché:** `force-dynamic` en `/trabajos` y home; las actions revalidan `/admin/trabajos` + `/trabajos` ([actions.ts:31-34](src/app/admin/trabajos/actions.ts#L31-L34)) pero **nunca `/`** (mitigado por `force-dynamic`, misma nota preventiva de B.4.4). Propagación server-side garantizada por el mismo mecanismo verificado en B.4.3.

#### C.3 Veredicto sobre el 90%

**El 90% es optimista. Mi número: ~75%.** Lo que anda de verdad (✅ runtime): ABM completo con auditoría, público en ambos árboles, lightbox funcional, propagación inmediata. Lo que falta o está mal: (1) reordenar obras — no existe; (2) **cada reemplazo/quitar/borrar filtra un asset huérfano irrecuperable** (sin ref persistida); (3) inconsistencia del "antes" faltante entre home y /trabajos; (4) a11y del lightbox de /trabajos (Escape no cierra — confirmado runtime —, sin dialog semantics, sin focus trap, prev/next sin aria-label, alt vacíos) cuando el de home ya lo hace bien; (5) se puede publicar una obra sin ninguna imagen (placeholder, no crash — pero probablemente no deseado).

---

### BLOQUE D — Multimedia en OT: imágenes + video

#### D.1 Estado actual de imágenes

```prisma
model WorkOrderPhoto {
  id                String   @id @default(cuid())
  workOrderId       String
  statusUpdateId    String?
  imageUrl          String
  thumbnailUrl      String?
  publicId          String?  // ref del provider de storage; habilita el borrado del asset
  caption           String?
  visibleToCustomer Boolean  @default(true)
  createdAt         DateTime @default(now())
  workOrder    WorkOrder              @relation(...)
  statusUpdate WorkOrderStatusUpdate? @relation(...)
  @@index([workOrderId])
}
```
([schema.prisma:159-174](prisma/schema.prisma#L159-L174))

- **PUBID — alcance real hoy: RESUELTO.** Se guarda: `imageUrl`, `thumbnailUrl` (= imageUrl con GCS, ver A.1), `publicId` (toda la cadena: [UploadZone.tsx:105](src/components/shared/UploadZone.tsx#L105) → actions → [upload.service.ts:21](src/services/upload.service.ts#L21) / [work-order.service.ts:314](src/services/work-order.service.ts#L314)), `caption`, `visibleToCustomer`, `createdAt`. **0 filas sin publicId en la base.** Lo que falta en el modelo: **actor** (quién subió — solo reconstruible por AuditLog/`statusUpdate.createdByUserId`), `contentType`, tamaño, dimensiones.
- **Enganches de carga confirmados:** (1) alta de orden — Wizard paso "Fotos", `UploadZone` multi (default **10 archivos máx**, [UploadZone.tsx:33](src/components/shared/UploadZone.tsx#L33)); (2) estado nuevo — `NewStateForm` multi; (3) **compuerta de avance** — `advanceStepAction` → `advanceToNextStep(gate)` ([ordenes/[id]/actions.ts:110-124](src/app/admin/ordenes/%5Bid%5D/actions.ts#L110-L124), [work-order.service.ts:260-341](src/services/work-order.service.ts#L260-L341)): **1 foto máx** (`maxFiles={1}`, [OrderActions.tsx:134](src/components/admin/OrderActions.tsx#L134)), la foto cuelga del paso que se DEJA, escape "Sin imagen" con razón opcional, y el audit registra actor + "con/sin imagen" + razón.
- Timestamp: `createdAt` ✅. Actor en la foto: ❌ (solo indirecto).

#### D.2 Video: qué existe realmente — **NADA** (probado, no asumido)

- Schema: único campo con "video" es `Tutorial.videoUrl` ([schema.prisma:182](prisma/schema.prisma#L182)) = URL de YouTube renderizada como **iframe facade** ([TutorialVideo.tsx](src/components/public/TutorialVideo.tsx), [youtube.ts](src/lib/youtube.ts)) — nunca un `<video>`.
- `<video>` en el árbol: **cero matches** en todo `src/**` (las tres áreas).
- Validación `video/*`: **cero** — al contrario, el upload **rechaza** activamente todo lo que no sea `image/*` con 415 ([route.ts:34-36](src/app/api/upload/route.ts#L34-L36)); pickers `accept="image/*"`; Cloudinary muerto pineaba `resource_type: "image"`.
- Poster/thumbnail de video, transcodificación (ffmpeg/mux/etc.): **cero matches**.
- Signed upload URL (GCS o cualquiera): **cero** (solo el helper muerto de Cloudinary).

#### D.3 Decisión de modelado — opciones con consecuencias (no elijo)

Dato de contexto: hoy hay **4 filas** de `WorkOrderPhoto` — cualquier migración de datos es trivial en volumen.

| | Opción 1: extender `WorkOrderPhoto` + enum `MediaType` (renombrando a Media) | Opción 2: `WorkOrderVideo` separado | Opción 3: `WorkOrderMedia` polimórfico |
|---|---|---|---|
| Migración de schema | Sí (enum + columnas + rename de tabla) | Sí (tabla nueva, no toca la existente) | Sí (tabla nueva + migrar 4 filas + drop) |
| Migración de datos | Solo rename (o alias) | **Ninguna** | Sí (4 filas — trivial) |
| Archivos a tocar (medido por referencias vivas a `WorkOrderPhoto`/`photos`) | ~12: `upload.service`, `work-order.service`, `status-update.service`, actions ×2, `realtime.ts`, `order-live.ts` (seam), `Timeline`, `Lightbox`, `PhotoGallery`, `OrderActions`, portal pages | ~6-8 nuevos + `Timeline` (merge cronológico de dos colecciones por update) + seam + realtime | Igual que Opción 1 |
| Costo runtime | 1 query (como hoy) | 2 queries + merge por `createdAt`/update | 1 query |
| ¿Rompe el portal en prod durante el deploy? | Riesgo medio si se renombra la tabla (ventana entre migrate y deploy); mitigable con rename en dos pasos | **No** (aditivo puro) | Riesgo medio (igual que 1) |

Campos que **cualquier** opción necesita para video (estado actual): key del objeto ✅ (existe el patrón `publicId`) · `contentType` ❌ · tamaño en bytes ❌ · duración ❌ · poster URL/key ❌ · actor ❌ (hoy solo audit) · timestamp ✅.

#### D.4 Camino de carga de video — restricciones duras

1. **¿Sirve el camino actual? NO.** Binario: (a) tope 4.5 MB de Vercel en el server-proxy (A.3); (b) el endpoint rechaza `!image/*` (415); (c) la compresión cliente es solo de imagen.
2. **Signed upload GCS: no existe, hay que construirlo de cero** — `lib/gcs.ts` solo expone `uploadImage`/`deleteImage` server-side; ninguna generación de V4 signed URL / resumable session en el proyecto.
3. **Formatos:** iPhone graba `.mov` HEVC por defecto; **HEVC no reproduce en Chrome de escritorio** (ni en muchos Android). Android graba `.mp4` H.264 (OK universal). **No está contemplado en ninguna parte** (confirmado). El riesgo "sube bien y no se reproduce" no es teórico acá: **ya ocurre con HEIC en imágenes** — 2 HEIC en el bucket que ningún Chrome puede mostrar (catálogo ⚠️ #2). Video HEVC repetiría el patrón exacto.
4. **Transcodificación: no hay.** Implicancias de no tenerla: HEVC irreproducible en Chrome/Android, sin poster generado, sin compresión de peso (un video de 60 MB viaja entero al cliente del portal con datos móviles), sin normalización de rotación/metadata.
5. **Límites a definir (faltan todos):** tamaño máximo por video, duración máxima, cantidad por cambio de estado, formatos aceptados, política HEVC (rechazar vs transcodificar), y si el gate de avance acepta video o solo imagen.

#### D.5 Reproducción en el portal

- **Cómo llegan las imágenes hoy:** URL pública directa de GCS en `<img>` nativo ([Photo.tsx:60-69](src/components/shared/Photo.tsx#L60-L69), [Timeline.tsx:180-191](src/components/shared/Timeline.tsx#L180-L191)) — sin proxy, sin firma, sin TTL. ✅ Runtime: 4/4 fotos cargan en el portal (desktop y mobile).
- **El mismo camino para video sirve a nivel entrega**: URL pública permanente (no hay TTL que rompa el historial) y el bucket **soporta range requests (206 verificado)** → Safari podría reproducir a nivel storage. Lo que falta es todo lo demás: elemento `<video>`, `playsinline`, `preload="none"` + poster (crítico con datos móviles en Rosario — sin poster+preload=none cada video se descargaría al abrir la página), indicador de tamaño/duración antes de reproducir. **Nada de esto existe** (no hay `<video>` alguno).
- Autoplay: no existe ninguno hoy (los tutoriales YouTube usan facade con thumbnail — patrón correcto para datos móviles).
- El pipeline de render es **`<img>`-specific de punta a punta** (seam `CustomerTimelinePhoto` con `imageUrl/thumbnailUrl` en [order-live.ts:32-38](src/lib/order-live.ts#L32-L38), gestos del Lightbox asumen imagen estática) — video toca seam + Timeline + Lightbox del portal.
- **Safari iOS real: no verificado** (sin dispositivo). WebKit desktop engine: público y portal renderizan sin errores (smoke test).

#### D.6 Compuerta de avance de etapa

**Corrección al enunciado: la compuerta NO está "planificada" — ya está construida y operativa.** Modal con `UploadZone maxFiles={1}`, escape "Sin imagen" + razón, actor y timestamp en AuditLog ([OrderActions.tsx:83-171](src/components/admin/OrderActions.tsx#L83-L171) → [advanceStepAction](src/app/admin/ordenes/%5Bid%5D/actions.ts#L110-L124) → [work-order.service.ts:305-336](src/services/work-order.service.ts#L305-L336)). Verificado presente en runtime mobile (dock "Estado / Avanzar etapa").
**¿El enganche sigue viable con video?** Sí: el gate ya viaja tipado (`gate.photo {url, publicId}`) y el punto de extensión es claro (aceptar `gate.media {url, ref, type}`). Lo que lo complica no es el enganche sino el upload (D.4): el modal usa `UploadZone` → `/api/upload`, que es el camino inviable para video. El gate deberá consumir el futuro camino de signed upload.

---

### BLOQUE E — Inventario del portal cliente

Rutas: `/clientes/login`, `/clientes/dashboard`, `/clientes/perfil`, `/clientes/tutoriales`, `/clientes/vehiculos/[id]`, `/clientes/vehiculos/[id]/historial`, `/clientes/vehiculos/[id]/orden/[orderId]`. **`/clientes` raíz no tiene página → 404 (verificado runtime, ambos viewports).** Todas las páginas con `requireCustomer()` server-side; deactivación de cuenta mata sesiones vivas (re-check de `active` en DB por request, [session.ts:14-18](src/lib/session.ts#L14-L18)).

- **Auth (pivot OTP): COMPLETO y vivo.** Login passwordless de dos pasos (email → código 6 dígitos bcrypt-hasheado, TTL 10 min, 5 intentos, single-use, rate-limit 4/email y 10/IP por 15 min, anti-enumeración) — [login-actions.ts](src/lib/login-actions.ts), [login-code.service.ts](src/services/login-code.service.ts), [auth.ts:33-83](src/lib/auth.ts#L33-L83). Sesión JWT 60 días. **No hay camino de password vivo** (`passwordHash`, `inviteToken`, `loginSchema`, `activateAccountSchema` = restos muertos). Todo el portal depende de este flujo. Detalle: "Cambiar email / reenviar código" es un `<a role="button">` sin handler de teclado ([ClienteLoginForm.tsx:173,206](src/app/clientes/login/ClienteLoginForm.tsx#L173)).
- **Multi-vehículo:** todas las cards en el dashboard ✅ (runtime: 2 vehículos). **Multi-OT activa sobre el mismo vehículo: solo se ve UNA** — `take: 1` **sin orderBy** en el include ([vehicle.service.ts:99-102](src/services/vehicle.service.ts#L99-L102)) y `.find()` del primer activo ([vehiculos/[id]/page.tsx:44](src/app/clientes/vehiculos/%5Bid%5D/page.tsx#L44)). La segunda OT activa es inalcanzable desde la UI.
- **Historial clínico:** existe vista completa ([historial/page.tsx](src/app/clientes/vehiculos/%5Bid%5D/historial/page.tsx)) — estrictamente `ENTREGADO` (una LISTO solo se ve como activa). Detalle de orden cerrada read-only con timeline completo. ✅ Runtime ambos viewports.
- **Timeline/StageBar:** consolidadas; fotos como strip de `<Photo>` con lightbox (pinch/zoom/swipe; Escape cierra — ✅ runtime). **Impacto de video:** StageBar cero (no tiene media); Timeline/Lightbox/seam son `<img>`-specific (D.5). Mobile trunca a **3 fotos sin "+N"** (brecha #18).
- **Estados vacíos:** sin vehículos ✅, sin orden activa ✅ (con CTA a historial), sin novedades ✅, sin fotos ✅ (strip no se renderiza), sin historial ✅, sin tutoriales ✅. **Para video: no existe concepto** (nada que mostrar u ocultar).
- **Notificaciones:** el único canal real es **email por acción del staff** (update custom con "notificar" activado, y "listo para retirar"). **No hay email en avance de plan ni en entrega.** Sin push/web-push. Realtime WS: requiere servidor externo (no está en el repo) + `NEXT_PUBLIC_WS_URL` + `REDIS_URL`; sin transporte el estado honesto es "fresh" + revalidación on-focus + pull-to-refresh (fetches reales). **Observado en runtime local: "Reconectando"** — la env está seteada pero no hay WS server alcanzable; si en Vercel pasa lo mismo, el cliente ve "Reconectando"→"offline" perpetuo (brecha #20). En resumen: **el cliente tiene que entrar a mirar**, salvo los dos emails manuales.
- **Liveness sin dato real (violación de honestidad):** `InProgressBadge` pulsa infinito por CSS puro sobre estado SSR (`status === "PROCESO"`) — late igual a las 3 AM ([InProgressBadge.tsx](src/components/customer/InProgressBadge.tsx), [portal.css:163-170](src/app/clientes/portal.css#L163-L170)); ídem el punto del paso actual y el anillo/gradiente del StageBar. Los honestos: `ConnectionIndicator` (estados reales), wash "arrived" one-shot con dato nuevo, spinner de pull-to-refresh. CSS muerto: `.tl-head .livedot`, `.pws.proceso .d`, `.tl-photo-more`.
- **Cards "Cuidados recomendados": muertas** — array hardcodeado con overlay de play, sin href/onClick, no leen de `Tutorial` (✅ confirmado runtime: el tap no navega). "Notificaciones — Email activado" en perfil: **texto estático** sin preferencia detrás. Slots de foto de vehículo: siempre placeholder (no existe campo de imagen en `Vehicle`).
- **Fotos → cliente:** URL GCS directa en `<img>`. **Brecha de privacidad latente:** `getWorkOrderById` filtra updates por visibilidad pero incluye `photos: true` sin filtrar ([work-order.service.ts:199-201](src/services/work-order.service.ts#L199-L201)); el snapshot realtime ídem ([realtime.ts:44-61](src/lib/realtime.ts#L44-L61)). Una foto marcada oculta colgada de un update visible **llega al portal**. Hoy: 0 fotos ocultas en la base (latente, no activo).

### BLOQUE F — Inventario del panel admin

**Protección:** `src/proxy.ts` (no `middleware.ts`): `/admin/*` exige JWT con rol ADMIN/STAFF ([proxy.ts:39-43](src/proxy.ts#L39-L43)); cada page llama `requireAdmin()` o `requireOwner()`; cada action re-valida actor. **No se encontró ninguna pantalla/action protegida solo en cliente.** Única action sin guard: `getTimelinePreview` ([nueva/actions.ts:20-25](src/app/admin/ordenes/nueva/actions.ts#L20-L25)) — lee templates de flujo, riesgo bajo. STAFF pierde: usuarios, auditoría, servicios, trabajos, tutoriales (requireOwner) — coherente en nav y páginas. Presupuesto/pagos visibles solo para ADMIN dentro del detalle de orden. Login admin: mismo OTP passwordless.

**ABM por entidad (crear / leer / actualizar / borrar):**

| Entidad | C | R | U | D |
|---|---|---|---|---|
| Service | ✅ | ✅ | ⚠️ solo name/visible/orden | ❌ (solo lógico; `deleteService` sin caller) |
| FlowStep | ✅ | ✅ | ✅ | ✅ |
| WorkOrder | ✅ | ✅ | ⚠️ solo ciclo de vida (avanzar/listo/entregado); sin editar título/desc/ETA/budget | ❌ (por diseño) |
| StatusUpdate | ✅ (custom) | ✅ | ❌ (`markStepAsCurrent` existe sin UI) | ❌ |
| WorkOrderPhoto | ✅ | ✅ | ❌ (sin editar caption/visibilidad post-alta) | ❌ (sin borrar foto) |
| Vehicle | ✅ | ✅ | ✅ | ✅ |
| Cliente (User+Profile) | ✅ | ✅ | ⚠️ name/phone/notes + activar/desactivar; **sin cambiar email** | ❌ |
| Equipo (STAFF/ADMIN) | ✅ (con rol) | ✅ | ⚠️ solo activar/desactivar; **sin cambio de rol/nombre/email** | ❌ |
| Tutorial | ✅ | ✅ | ✅ | ✅ |
| PortfolioWork | ✅ | ✅ | ✅ (sin reorden) | ✅ físico |
| ProductRecommendation | ❌ | ❌ | ❌ | ❌ — modelo 100% sin implementar |
| AuditLog | ✅ (implícito) | ✅ (últimos 150, sin filtros/paginación/diff-viewer) | correcto inmutable | correcto inmutable |

- **Búsquedas/filtros: cableados, no fantasma.** Clientes (name/email insensitive) y vehículos (patente/marca/modelo) via GET nativo → `searchParams` → Prisma `where` — ✅ **verificado runtime** (Enter → `?q=` → filtro server + estado vacío). Chips de órdenes (Activas/Completadas/Todas) por link server-side. Sin búsqueda de texto en órdenes, sin filtros en auditoría/usuarios. Los inputs fantasma históricos (search global/campana) ya fueron **eliminados**.
- **R1 (candidatos):** 15 componentes cliente importan server actions (lista completa en el anexo del agente: todos los formularios + FlowEditor + ServicesList + TrabajosEditor + TutorialEditor + OrderActions + Wizard + login forms). **Runtime en build de prod: cero errores de consola/hidratación en admin desktop y mobile, y la action de rename ejecutó correctamente desde FlowEditor** (el caso arquetípico de R1). No reproducido; ver §7.
- **Skeletons:** 14/14 segmentos no-login cubiertos vía `RouteSkeletons` (dashboard, 8 listas, 3 detalles, orden-detalle shape-matched, wizard). Sin huecos.
- **DOM dual:** AdminShell con dos chromes (mobile burger / desktop sidebar) derivados del mismo registry por rol; pantallas `dual` (dashboard, órdenes, clientes, vehículos, usuarios, auditoría) con dos árboles; `single` responsive (wizard, servicios, trabajos, tutoriales). Sin drift funcional no declarado; el registry `admin-sections.ts` tiene notas obsoletas (reorder "desktop-only" cuando ya es Pointer Events).
- **Multimedia en admin (capacidades):** Wizard paso Fotos (multi hasta 10, sube ANTES de crear la orden y asocia al paso INGRESO), NewStateForm (multi + visibilidad + notificar email), OrderActions (gate 1 foto + "Sin imagen" + razón). ✅ Runtime mobile: dock visible, fotos del timeline renderizan.
- **Muertos/no cableados:** `TutorialToggle`, `ABadge`, `StatCard` (huérfanos); `deleteService`, `markStepAsCurrent`, `getAdminStats`, `uploadAndSavePhoto`, `listAuditLog(entity)` (dormidos); params fantasma `internalNotes`/`budgetAmount` en `createOrderAction` sin UI que los recolecte.

### BLOQUE G — Transversales

- **DOM dual consolidado:** público y portal = dual completo por página (switch CSS único en [shared.css:231-239](src/components/shared/shared.css#L231-L239), max-width 859px de un solo lado, anti-hueco 859.5px documentado). Admin = mixto declarado (dual en listas/detalles, single responsive en editores). **No se encontró funcionalidad presente en un árbol y ausente en el otro** más allá de las declaradas intencionales en los registries (`admin-sections.ts` / `cliente-sections.ts`); ✅ runtime: árbol correcto visible/oculto en cada viewport en público, admin y portal. Los registries tienen ~4 notas "pendiente" obsoletas respecto del código actual.
- **Tipos monetarios: ✅ correcto.** Único campo de dinero: `budgetAmount Decimal @db.Decimal(12,2)` ([schema.prisma:119](prisma/schema.prisma#L119)); **cero `Float` en el schema**. Menores: formateo ad-hoc repetido (`` `$${Number(x).toLocaleString("es-AR")}` `` ×3) + un `String(order.budgetAmount)` crudo sin formato en [ordenes/[id]/page.tsx:281](src/app/admin/ordenes/%5Bid%5D/page.tsx#L281) (inconsistente con la línea 130 del mismo archivo); no existe helper de moneda; y el campo no tiene UI de carga (brecha #12).
- **Errores tragados en uploads:** ningún `console.error`/log server-side en TODO el camino de subida. [route.ts:49-52](src/app/api/upload/route.ts#L49-L52) devuelve el mensaje crudo del provider al cliente (puede filtrar detalles de credenciales GCS) sin loggear. [UploadZone.tsx:117-119](src/components/shared/UploadZone.tsx#L117-L119) reemplaza cualquier excepción por "Sin conexión…" (enmascara errores no-red, aunque muestra retry). [TrabajosEditor.tsx:117-124](src/components/admin/TrabajosEditor.tsx#L117-L124): el error de borrado se setea en un estado que solo se renderiza con el form abierto → **borrado fallido desde la lista = silencio total**; toggle de visibilidad sin manejo ninguno ([:230](src/components/admin/TrabajosEditor.tsx#L230)). [Wizard.tsx:67-70](src/components/admin/Wizard.tsx#L67-L70): `getTimelinePreview` sin catch → unhandled rejection sin feedback. La compresión ([image-compression.ts:81-83](src/lib/image-compression.ts#L81-L83)) traga el fallo de decode **por diseño documentado** — es la causa raíz del ⚠️ HEIC.
- **A11y en galerías:** jerarquía clara de calidad: **WorkStack (home) el mejor** — dialog/aria-modal, focus trap, Escape, restauración de foco, alt reales; **Lightbox compartido (portal/admin) intermedio** — Escape sí, aria-labels en botones, pero sin dialog role, sin trap, sin flechas de teclado, foto sin alt (caption existe y no se usa como alt); **TrabajosGallery el peor** — nada de lo anterior (Escape confirmado inerte en runtime), prev/next sin aria-label; **PhotoGallery** — thumbs clickeables no accesibles por teclado (div con onClick, sin botón). `Photo` default `alt=""` en todos los usos de grillas.

---

## 4. Catálogo de ⚠️ PARECE FUNCIONAR

Los casos donde la UI muestra una cosa y la realidad es otra. Para cada uno: qué muestra / qué pasa / cómo se verificó.

1. **HEIC de iPhone: sube "bien", no se ve nunca.** La UI de subida muestra éxito (la compresión está diseñada para "nunca romper el flujo": si no puede decodificar, manda el original — [image-compression.ts:60-83](src/lib/image-compression.ts#L60-L83)). El servidor acepta (`image/heic` pasa `image/*`). Resultado: un asset que **Chrome no puede renderizar** — el admin/cliente vería el placeholder o imagen rota. *Verificación:* forense — 2 objetos `image/heic` (~2 MB c/u, 20-21/7) en el bucket real + lectura del código del catch. No subí un HEIC yo (prohibición de escritura); los dos del bucket quedaron huérfanos (probable formulario abandonado al no ver el preview).
2. **Tope de 10 MB que en producción es 4.5 MB.** El endpoint valida `> 10MB → 413` propio ([route.ts:37-39](src/app/api/upload/route.ts#L37-L39)), pero en Vercel un archivo de 5-10 MB muere antes en la plataforma con otro 413 que la app nunca ve. La compresión cliente lo esquiva casi siempre — excepto justamente HEIC (que va sin comprimir). *Verificación:* límite documentado de Vercel + historia del bug 413 ya sufrido en este proyecto + lectura del camino.
3. **"Editar servicio" que solo renombra.** La pantalla del servicio sugiere edición; `description`/`imageUrl` existen en schema, zod y service layer, pero el action los descarta — el único editor es el nombre (blur). Las descripciones públicas actuales son del seed y **no se pueden cambiar desde el admin**. *Verificación:* estática (grep de callers de `updateService`: solo name y visible) + runtime (la página del servicio solo expone input de nombre + pasos).
4. **Presupuesto y estado de pago: se muestran, no se cargan.** El detalle de orden ADMIN renderiza `budgetAmount`/`paymentStatus`, y `createOrderAction` los acepta — pero **ninguna UI los recolecta ni edita**: nacen `null`/`NA` para siempre (salvo seed). *Verificación:* estática exhaustiva (grep de escritores) — los valores no-null actuales vienen del seed.
5. **Cards "Cuidados recomendados" con botón de play.** Parecen videos tappeables; son un array hardcodeado sin href ni onClick, desconectado de `Tutorial`. *Verificación:* **runtime** — tap ejecutado, URL no cambia, nada ocurre.
6. **"Notificaciones — Email activado" en el perfil.** Parece una preferencia gestionable; es texto estático sin campo en el schema ni action. *Verificación:* estática ([perfil/page.tsx:20](src/app/clientes/perfil/page.tsx#L20) + ausencia de modelo).
7. **Badges y barras "latiendo" sin dato vivo.** `InProgressBadge`, el punto del paso actual y el anillo del StageBar pulsan en loop infinito por CSS sobre un render SSR estático — comunican "estamos trabajando AHORA" sin ningún dato de actividad detrás. Violación directa del principio de honestidad del proyecto. *Verificación:* estática (CSS `infinite` + componentes server sin fuente viva) — el contraste es el wash "arrived", que sí es one-shot sobre dato nuevo.
8. **Timeline mobile: fotos que desaparecen sin aviso.** El admin sube 5 fotos a un estado; el cliente en mobile ve 3, sin indicador de que hay más (el CSS del "+N" existe, ningún TSX lo renderiza; el panel desktop muestra todas). *Verificación:* estática ([Timeline.tsx:72,182](src/components/shared/Timeline.tsx#L72) + grep de `.tl-photo-more`).
9. **El flag "oculta al cliente" de una foto no oculta nada en el portal.** El toggle por-foto existe en el modelo y el service de listado lo respeta, pero el portal usa `getWorkOrderById` (`photos: true` sin filtro) y el snapshot realtime ídem. Hoy 0 fotos ocultas en DB → latente. *Verificación:* estática + conteo en DB.
10. **Lightbox de `/trabajos`: usuario de teclado atrapado.** Se abre y navega con mouse; **Escape no lo cierra** (sin handler), sin focus trap ni dialog semantics — mientras el lightbox equivalente del home hace todo bien. *Verificación:* **runtime** (Escape presionado, overlay persiste — ambos árboles) + estática.
11. **`revalidatePath` ausente hacia el público (servicios) y hacia `/` (trabajos): bomba silenciosa futura.** Hoy TODO es `force-dynamic` y la propagación es inmediata (verificada). El día que se optimice el caching, los cambios del admin dejarán de aparecer **sin ningún error**. *Verificación:* runtime de la propagación actual + inventario estático de revalidaciones.
12. **"Reconectando" perpetuo del portal.** Con `NEXT_PUBLIC_WS_URL` seteada y sin servidor WS, el indicador muestra "Reconectando" (5 retries → "offline") — implica un problema transitorio cuando es permanente-por-configuración. *Verificación:* **runtime local** (observado); el valor de la env en Vercel no es verificable desde acá.
13. **Dev local roto en silencio (dos por drift de `.env`):** upload local falla ("bucket does not exist" — el bucket del `.env` no existe) y, en prod-mode local, toda ruta protegida sin sesión redirige a `https://tu-dominio-de-prod/...` (placeholder sin completar) → `ERR_NAME_NOT_RESOLVED`. *Verificación:* **runtime** (ambos reproducidos hoy).

---

## 5. Decisiones abiertas que requieren criterio humano

1. **Modelado de video** — ¿Opción 1 (extender/renombrar `WorkOrderPhoto` con `MediaType`), 2 (`WorkOrderVideo` separado) o 3 (`WorkOrderMedia` polimórfico)? Consecuencias en la tabla D.3. La 2 es la única sin riesgo de deploy; la 1/3 dejan el modelo más limpio a costa de migración y ventana de deploy.
2. **Visibilidad del bucket** — ¿Sigue público (URLs permanentes, historial nunca se rompe, fotos de clientes accesibles a quien tenga la URL) o pasa a privado con signed URLs (privacidad real, pero hay que decidir TTL y regenerar URLs en cada render — con TTL corto el historial del portal se rompe al recargar, exactamente el problema que hoy NO existe)? Decisión de privacidad vs. complejidad; afecta también al video.
3. **Política de huérfanos** — ¿Se persiste la ref en `PortfolioWork` (y futura `ServiceImage`) y se cablea `StorageProvider.delete()` en reemplazo/borrado? ¿Se limpian los 5 huérfanos actuales a mano o con un job? ¿Se acepta el leak como costo (hoy: centavos) hasta que haya volumen?
4. **HEIC (ya) y HEVC (futuro)** — ¿Rechazar en el cliente con mensaje claro ("sacá la foto en JPEG / convertí el video") o aceptar y transcodificar server-side (costo: servicio de transcodificación, no hay ninguno)? Rechazar es barato y honesto; transcodificar es invisible para el dueño del taller.
5. **Límites de video** — tamaño máximo (¿100 MB?), duración máxima (¿60-90 s?), cantidad por cambio de estado (¿1?), ¿el gate de avance acepta video o solo imagen? Sin definir, cualquier implementación queda coja.
6. **Multi-OT activa por vehículo** — ¿Es un caso real del negocio? Si sí, el portal necesita selector de orden activa (hoy la segunda es invisible). Si no, ¿se valida en el alta que no haya dos activas?
7. **Fotos `visibleToCustomer=false`** — ¿Se cablea el filtro en portal + snapshot (esfuerzo bajo) o se elimina el flag por-foto para no prometer lo que no se cumple?
8. **Multi-imagen de servicios: forma** — ¿Galería libre con portada elegible + orden (lo pedido) y `alt` por imagen? ¿La portada reemplaza al fallback hardcodeado de `public-data.ts` o convive?
9. **Snapshot de pasos: ya es snapshot** (B.2) — la decisión abierta que queda es la inversa: cuando el dueño edita un flujo, ¿quiere poder "resembrar" los pasos pendientes de OTs en curso (hoy imposible)? Documentar la respuesta aunque sea "no".
10. **Equipo** — ¿Hace falta cambio de rol/edición de email post-creación, o alta+desactivación alcanza para un taller?

---

## 6. Propuesta de secuencia

Una sola secuencia, ordenada por dependencias. Sin fechas.

1. **Sanear config local** (`GCS_BUCKET_NAME` real + `AUTH_URL` local en `.env`) — trivial, desbloquea el desarrollo local de TODO lo que sigue (hoy el upload local está roto).
2. **Cerrar el patrón PUBID donde sigue vivo:** migración aditiva de refs (`PortfolioWork.beforeRef/afterRef`), `ImageSlot` deja de descartar `asset.ref`, y se cablea `StorageProvider.delete()` en reemplazo/quitar/borrar de obra. Limpieza manual de los 5 huérfanos actuales. *(Depende de decisión #3; es prerequisito conceptual de 3 y 5.)*
3. **Multi-imagen de servicios:** modelo `ServiceImage {serviceId, url, ref, alt, sortOrder, isCover}` + migración + UI admin (subir N, reordenar reutilizando `usePointerReorder`, portada, eliminar con delete real del asset) + action de editar `description` (la brecha #5 se cierra gratis acá) + consumo en `/servicios` y home. *(Depende de 1 y 2; decisión #8.)*
4. **Fix de privacidad de fotos:** filtrar `visibleToCustomer` a nivel foto en `getWorkOrderById` (rol CUSTOMER) y en `publishOrderSnapshot`. Puntual e independiente. *(Decisión #7.)*
5. **Video en OT — en este orden interno:**
   a. Decisión de modelado (#1) y límites (#5).
   b. **Signed upload GCS V4** (browser→bucket directo): endpoint que firma, validación de `contentType`/tamaño en la policy de firma — esquiva el 4.5 MB. Es LA pieza nueva de infraestructura.
   c. Modelo + persistencia (ref, contentType, size, duration, posterRef, actor).
   d. Política de formatos (#4): mínimo viable = aceptar solo `video/mp4` (H.264) y rechazar `.mov`/HEVC con mensaje claro en el picker; transcodificación queda como evolución.
   e. Poster: captura de frame en el cliente al subir (canvas sobre `<video>` local) — sin servicio server-side.
   f. Render portal: `<video preload="none" playsinline controls poster=…>` en Timeline + Lightbox (extender seam `order-live.ts`), indicador de duración/peso, cero autoplay. El bucket ya soporta range requests (206 verificado).
   g. Extender el gate de avance a media tipada (imagen sigue por el camino actual; video por el nuevo).
6. **Deuda corta de trabajos:** reorden de obras (reutilizar `usePointerReorder` + action), unificar el fallback del "antes" faltante (home vs /trabajos), a11y del lightbox de `/trabajos` (portar lo que WorkStack ya hace), rechazo de HEIC en el picker.
7. **Limpiezas transversales:** log server-side en `/api/upload` + mensaje genérico al cliente, helper único de formato monetario, borrar código muerto (lista en brecha #24), corregir notas obsoletas de los registries.

**R1:** no se reprodujo en build de producción local (§7). Antes de tratarlo como bloqueante de cualquier punto anterior, retest dirigido en el deploy real de Vercel; si reaparece, es transversal a los formularios y pasa al frente.

---

## 7. Método de verificación

**Runtime — `next build && next start` (build de producción local, puerto 3123), Chromium real (Playwright 1.61):**
- Desktop 1280×800 y mobile 390×844 (touch): home, `/servicios`, `/trabajos` (público); dashboard admin, `/admin/clientes` + búsqueda, `/admin/servicios/[id]`, `/admin/ordenes/[id]` (OT-1047, mobile); portal: dashboard, vehículo, historial, `/clientes` (404). Árbol dual verificado por `display` computado en cada viewport.
- **Única escritura ejecutada (mandada por B.4.3):** rename de servicio "Detail exterior" → sufijo temporal → verificación en DB → verificación en `/servicios` público (contexto de navegador nuevo) → revert verificado en DB. Nada más se escribió a través de la app.
- Sesiones admin/cliente: **acuñadas localmente** con el `@auth/core` del proyecto (JWT firmado con el secreto del entorno local) porque el login es OTP-por-email y no había forma no invasiva de recibir el código. El flujo OTP end-to-end (email real) **no se probó**.
- Lightboxes: apertura/click/Escape probados en público (ambos árboles) y portal (ambos árboles). Carga de imágenes GCS por `naturalWidth>0`. Consola y `pageerror` capturados en todas las páginas: **cero errores**.
- WebKit (motor Safari desktop): smoke de render en home, `/trabajos` y portal dashboard — sin errores. **Safari iOS real: NO verificado** (sin dispositivo).

**Datos (solo lectura):** SELECTs agregados contra la base (conteos, dominios de URLs, extensiones, fotos ocultas) y listado del bucket GCS real cruzado contra las URLs referenciadas (15 objetos / 10 referenciados / 5 huérfanos). Transparencia: la primera tanda de consultas usó `SET default_transaction_read_only` de sesión que, vía el pooler de Neon, **afectó temporalmente producción** (error 25006 en login); se resolvió reiniciando el compute de Neon y los scripts se corrigieron a SELECT puros sin estado de sesión.

**Estático:** todos los hallazgos archivo:línea de los bloques A–G provienen de lectura directa del código de este árbol (commit `333d6c9`), con barridos exhaustivos para las afirmaciones de ausencia (patrones buscados citados en cada caso).

**NO verificado (sin rellenar con inferencia):**
- Safari iOS real (dispositivo físico): reproducción, `playsinline`, gestos.
- Envs de producción en Vercel (`NEXT_PUBLIC_WS_URL`, `AUTH_URL`, `GCS_*`, `STORAGE_PROVIDER`): inferidas por evidencia de datos (las fotos recientes están en GCS), no leídas.
- R1 en el deploy real de Vercel: lo probado fue el build de producción **local** — cero errores de hidratación y server actions funcionando. Si R1 es específico del deploy (edge/CDN), este método no lo detecta.
- Staleness del Router Cache del cliente en navegación SPA pública tras una mutación del admin (la verificación de propagación usó contexto de navegador nuevo).
- Upload real de archivo (imagen o HEIC) end-to-end: no ejecutado por la prohibición de escrituras; el camino se verificó por código + evidencia forense del bucket.
- Emails de Resend (OTP, bienvenida, notificaciones): no enviados.
- Drag táctil de reorder en dispositivo real (el código usa Pointer Events correctamente; la sensación de uso no se midió).
- Restricciones de delivery de la cuenta Cloudinary (irrelevante mientras GCS sea el proveedor vivo).

---
*Fin del informe. Ningún archivo del proyecto fue modificado, salvo la creación de este informe.*

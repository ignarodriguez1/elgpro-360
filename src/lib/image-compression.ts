/**
 * Compresión de imágenes EN EL CLIENTE, antes de subirlas. Motivo concreto: las
 * Vercel Functions cortan el body del request en 4.5MB (413 FUNCTION_PAYLOAD_TOO_LARGE),
 * y una foto de celular pesa 4-12MB. Además, en el 4G del taller mandar 8MB es
 * lento y frágil. Redimensionamos + reencodeamos a JPEG ~1-2MB → el 413 desaparece
 * y el upload vuela.
 *
 * Separación a propósito: la LÓGICA PURA (dimensiones, nombre) se testea en Node;
 * el encode (canvas/createImageBitmap) es glue de navegador y sólo corre client-side.
 */

const DEFAULT_MAX_DIMENSION = 1920; // suficiente para ver una foto de un trabajo
const DEFAULT_QUALITY = 0.8;
const OUTPUT_MIME = "image/jpeg";
const OUTPUT_EXT = "jpg";

export interface CompressOptions {
  /** Lado más largo permitido en px. La imagen se escala para no superarlo. */
  maxDimension?: number;
  /** Calidad JPEG 0..1. */
  quality?: number;
}

/**
 * Dimensiones destino preservando el aspecto: escala hacia ABAJO para que el lado
 * más largo no supere `maxDimension`. NUNCA agranda (si ya entra, la deja igual).
 * Redondea a enteros porque un canvas no acepta fracciones de píxel.
 */
export function computeTargetDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) {
    return { width, height };
  }
  const scale = maxDimension / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Cambia la extensión del archivo por la de salida (`foo.png` -> `foo.jpg`). Sólo
 * toca la última extensión; si no hay, la agrega. Mantiene el nombre coherente con
 * los bytes reales (importa: gcs.ts deriva la extensión del objeto desde el nombre).
 */
export function compressedFileName(originalName: string, outputExt: string): string {
  const dot = originalName.lastIndexOf(".");
  const base = dot > 0 ? originalName.slice(0, dot) : originalName;
  return `${base}.${outputExt}`;
}

/**
 * Comprime una imagen a JPEG redimensionado. GLUE DE NAVEGADOR (usa canvas) — sólo
 * se llama desde componentes "use client".
 *
 * Filosofía anti-sorpresa: NUNCA rompe el flujo de subida. Si algo falla (formato
 * no decodificable como HEIC en algunos browsers, canvas sin contexto, encode nulo)
 * o si el resultado quedara MÁS grande que el original, devuelve el `File` original.
 * Peor caso = como estaba antes, nunca peor.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  // Sólo imágenes; cualquier otra cosa pasa sin tocar.
  if (!file.type.startsWith("image/")) return file;

  const {
    maxDimension = DEFAULT_MAX_DIMENSION,
    quality = DEFAULT_QUALITY,
  } = options;

  let bitmap: ImageBitmap;
  try {
    // `imageOrientation: from-image` respeta el EXIF: la foto no sale rotada.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // formato que el browser no sabe decodificar → mandamos el original
  }

  const { width, height } = computeTargetDimensions(
    bitmap.width,
    bitmap.height,
    maxDimension
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  // Fondo blanco: si el original trae alpha (PNG), JPEG lo aplanaría a negro.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, OUTPUT_MIME, quality)
  );

  // Encode nulo o resultado más pesado (imagen ya optimizada) → original.
  if (!blob || blob.size >= file.size) return file;

  return new File([blob], compressedFileName(file.name, OUTPUT_EXT), {
    type: OUTPUT_MIME,
    lastModified: file.lastModified,
  });
}

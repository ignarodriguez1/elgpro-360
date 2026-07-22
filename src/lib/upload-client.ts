import { compressImage } from "./image-compression";
import { isHeicFile, HEIC_REJECTION_MESSAGE } from "./media-format";

/**
 * Sube UN archivo de imagen desde el cliente: comprime primero (esquiva el límite
 * de 4.5MB de Vercel y acelera el 4G) y hace el POST a /api/upload. Camino único
 * de subida single-file — lo usa cualquier slot de una sola imagen (ej. ImageSlot).
 * Lanza Error con mensaje legible si el server rechaza; el caller decide la UI.
 */

export interface UploadedAsset {
  url: string;
  thumbnailUrl?: string;
  /** Object path / public_id según el proveedor de storage, para borrar después. */
  ref: string;
}

export async function uploadImageFile(file: File): Promise<UploadedAsset> {
  // HEIC se rechaza ANTES de subir: la compresión no puede decodificarlo (lo
  // mandaría crudo) y el navegador después no puede mostrarlo. Mejor cortar acá
  // con mensaje accionable que gastar 2MB de 4G en un asset inservible.
  if (isHeicFile(file.name, file.type)) {
    throw new Error(HEIC_REJECTION_MESSAGE);
  }
  const compressed = await compressImage(file);
  const formData = new FormData();
  formData.append("file", compressed);

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `No se pudo subir (error ${res.status})`);
  }
  return res.json();
}

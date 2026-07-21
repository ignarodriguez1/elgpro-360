import { compressImage } from "./image-compression";

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

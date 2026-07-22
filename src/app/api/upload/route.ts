import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getStorageProvider } from "@/services/storage";
import { isHeicFile, HEIC_REJECTION_MESSAGE } from "@/lib/media-format";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Recibe UN archivo (multipart) y lo sube vía el proveedor de storage activo
 * (`STORAGE_PROVIDER`). Server-proxy: el archivo pasa por acá, así el mecanismo
 * es uniforme para local/Cloudinary/GCS. Devuelve { url, thumbnailUrl, ref }.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  let file: File | null = null;
  try {
    const formData = await request.formData();
    const f = formData.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ error: "Form data inválido" }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  }
  // Validación server-side honesta (antes solo había hints de cliente).
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 415 });
  }
  // HEIC pasa el filtro image/* pero ningún navegador lo muestra: defensa en
  // profundidad por si el cliente está desactualizado o lo puentean (curl).
  // Detección por MIME y extensión — el type del File puede venir vacío o mentir.
  if (isHeicFile(file.name, file.type)) {
    return NextResponse.json({ error: HEIC_REJECTION_MESSAGE }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera los 10MB" }, { status: 413 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const asset = await getStorageProvider().upload({
      bytes,
      filename: file.name,
      contentType: file.type,
    });
    return NextResponse.json(asset);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al subir el archivo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

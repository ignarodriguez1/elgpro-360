import { randomUUID } from "node:crypto";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider } from "./storage-provider";

/**
 * Adapter local: escribe los archivos a `public/uploads/`, que `next dev` sirve
 * estáticamente. Sin transformaciones (el thumbnail = la misma URL en el MVP).
 *
 * CAVEAT de producción: en build, `public/` es read-only horneado, así que para
 * deploy real con storage local haría falta un route handler que sirva los
 * archivos desde un dir escribible. Para dev/preview, esto alcanza.
 */

const PUBLIC_DIR = path.join(process.cwd(), "public");
const UPLOAD_SUBDIR = "uploads";
const UPLOAD_DIR = path.join(PUBLIC_DIR, UPLOAD_SUBDIR);

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function deriveExt(filename: string, contentType: string): string {
  const fromName = path.extname(filename).replace(/^\./, "").toLowerCase();
  if (fromName) return fromName;
  return MIME_EXT[contentType.toLowerCase()] ?? "bin";
}

export const localAdapter: StorageProvider = {
  name: "local",

  async upload({ bytes, filename, contentType }) {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = deriveExt(filename, contentType);
    const id = `${randomUUID()}.${ext}`;
    await writeFile(path.join(UPLOAD_DIR, id), bytes);

    const url = `/${UPLOAD_SUBDIR}/${id}`;
    return {
      url,
      thumbnailUrl: url, // sin transform en local (MVP)
      ref: `${UPLOAD_SUBDIR}/${id}`,
    };
  },

  async delete(ref) {
    // `ref` es relativo a public/ (ej. "uploads/<uuid>.jpg"). Normalizamos para
    // que no pueda escaparse del dir con "../".
    const normalized = path.normalize(ref).replace(/^(\.\.(\/|\\|$))+/, "");
    await unlink(path.join(PUBLIC_DIR, normalized)).catch(() => {
      // Borrado best-effort: si el archivo ya no está, no es un error.
    });
  },

  thumbnailUrl(url) {
    return url;
  },
};

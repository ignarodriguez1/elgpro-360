import { uploadImage, deleteImage } from "@/lib/gcs";
import type { StorageProvider } from "./storage-provider";

/**
 * Adapter GCS: sube a un bucket de Google Cloud Storage servido por URL pública.
 * GCS no transforma imágenes (a diferencia de Cloudinary), así que el thumbnail
 * es la misma URL. La `ref` para borrado es el object name dentro del bucket.
 */
export const gcsAdapter: StorageProvider = {
  name: "gcs",

  async upload({ bytes, filename, contentType }) {
    const { url, objectName } = await uploadImage(bytes, filename, contentType);
    return {
      url,
      thumbnailUrl: url, // sin transform server-side: el thumb es la imagen full.
      ref: objectName,
    };
  },

  async delete(ref) {
    await deleteImage(ref);
  },

  thumbnailUrl(url) {
    return url;
  },
};

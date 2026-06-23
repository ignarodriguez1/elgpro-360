import type { StorageProvider } from "./storage-provider";
import { cloudinaryAdapter } from "./cloudinary-adapter";
import { gcsAdapter } from "./gcs-adapter";
import { localAdapter } from "./local-adapter";

export type {
  StorageProvider,
  StoredAsset,
  UploadInput,
} from "./storage-provider";

/**
 * Factory del proveedor de storage activo. Se elige por `STORAGE_PROVIDER`:
 *   - "cloudinary" (default): upload server-side a Cloudinary.
 *   - "gcs": upload a un bucket público de Google Cloud Storage.
 *   - "local": escribe a public/uploads/ (dev/preview, sin keys de nube).
 * El dominio nunca toca un proveedor concreto: solo esta interfaz.
 */
export function getStorageProvider(): StorageProvider {
  const provider = (process.env.STORAGE_PROVIDER ?? "cloudinary").toLowerCase();
  switch (provider) {
    case "local":
      return localAdapter;
    case "cloudinary":
      return cloudinaryAdapter;
    case "gcs":
      return gcsAdapter;
    default:
      throw new Error(
        `STORAGE_PROVIDER desconocido: "${provider}". Valores válidos: "local", "cloudinary", "gcs".`
      );
  }
}

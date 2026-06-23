import { uploadImage, generateThumbnailUrl, cloudinary } from "@/lib/cloudinary";
import type { StorageProvider } from "./storage-provider";

/**
 * Adapter Cloudinary: envuelve la lógica existente en `lib/cloudinary.ts` SIN
 * cambiar su comportamiento. Sube por `upload_stream` (server-side), deriva el
 * thumbnail por transform de URL y borra por `public_id`.
 */
export const cloudinaryAdapter: StorageProvider = {
  name: "cloudinary",

  async upload({ bytes }) {
    const result = await uploadImage(bytes); // { secure_url, public_id }
    return {
      url: result.secure_url,
      thumbnailUrl: generateThumbnailUrl(result.secure_url),
      ref: result.public_id,
    };
  },

  async delete(ref) {
    await cloudinary.uploader.destroy(ref);
  },

  thumbnailUrl(url) {
    return generateThumbnailUrl(url);
  },
};

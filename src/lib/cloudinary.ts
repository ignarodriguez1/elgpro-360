import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Valida la config en RUNTIME (no en module scope, para no romper el build sin
 * keys). Lanza un error claro y accionable en vez de un fallo opaco de firma.
 */
function assertCloudinaryConfig(): string {
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !secret) {
    throw new Error(
      "Cloudinary no está configurado: faltan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET en el entorno."
    );
  }
  return secret;
}

export function generateSignedUploadParams() {
  const secret = assertCloudinaryConfig();
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = "elg-pro";

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    secret
  );

  return {
    signature,
    timestamp,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  };
}

export async function uploadImage(file: Buffer) {
  assertCloudinaryConfig();
  return new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "elg-pro",
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) reject(error || new Error("Upload failed"));
            else resolve(result);
          }
        )
        .end(file);
    }
  );
}

export function generateThumbnailUrl(
  imageUrl: string,
  width = 200,
  height = 200
): string {
  return imageUrl.replace(
    "/upload/",
    `/upload/c_fill,w_${width},h_${height}/`
  );
}

export { cloudinary };

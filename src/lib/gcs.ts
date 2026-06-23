import { Storage } from "@google-cloud/storage";
import { randomUUID } from "node:crypto";

/**
 * Cliente GCS + helpers de subida. Espeja el rol de `lib/cloudinary.ts` para el
 * proveedor de Google Cloud Storage. Bucket servido por URL pública (acceso
 * público a nivel IAM — ver .env.example).
 */

const FOLDER = "elg-pro";

/**
 * Resuelve bucket + credenciales del service account desde el entorno. Dos formas
 * de credencial, en orden de prioridad:
 *   1. GCS_CREDENTIALS_JSON: el key JSON COMPLETO del service account. Es lo que
 *      Vercel necesita — no hay filesystem para montar un archivo. Recomendado.
 *      (Al venir como JSON, los "\n" de la private key los resuelve JSON.parse;
 *      no hay que des-escapar a mano.)
 *   2. GCS_CLIENT_EMAIL + GCS_PRIVATE_KEY: campos sueltos. La private key trae
 *      "\n" literales que se des-escapan a saltos reales.
 * Valida en RUNTIME (no en module scope) para no romper el build sin keys, con
 * mensajes claros en vez de un fallo opaco de firma.
 */
function resolveGcsConfig(): {
  bucket: string;
  projectId?: string;
  credentials: { client_email?: string; private_key?: string };
} {
  const bucket = process.env.GCS_BUCKET_NAME;
  if (!bucket) {
    throw new Error("GCS no está configurado: falta GCS_BUCKET_NAME en el entorno.");
  }

  const json = process.env.GCS_CREDENTIALS_JSON;
  if (json) {
    let parsed: { client_email?: string; private_key?: string; project_id?: string };
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error(
        "GCS_CREDENTIALS_JSON no es JSON válido: pegá el contenido completo del gcs-key.json (en .env usá comillas simples para no expandir los \\n)."
      );
    }
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error(
        "GCS_CREDENTIALS_JSON no tiene client_email/private_key: ¿es el key JSON del service account?"
      );
    }
    return {
      bucket,
      projectId: process.env.GCS_PROJECT_ID ?? parsed.project_id,
      credentials: {
        client_email: parsed.client_email,
        private_key: parsed.private_key,
      },
    };
  }

  // Fallback: campos sueltos.
  const clientEmail = process.env.GCS_CLIENT_EMAIL;
  const privateKey = process.env.GCS_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    throw new Error(
      "GCS no está configurado: definí GCS_CREDENTIALS_JSON (recomendado) o GCS_CLIENT_EMAIL + GCS_PRIVATE_KEY."
    );
  }
  return {
    bucket,
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
      client_email: clientEmail,
      // En Vercel la private key se guarda con "\n" literales; des-escapar.
      private_key: privateKey.replace(/\\n/g, "\n"),
    },
  };
}

let _client: { storage: Storage; bucket: string } | null = null;

function getClient(): { storage: Storage; bucket: string } {
  if (!_client) {
    const cfg = resolveGcsConfig();
    _client = {
      storage: new Storage({ projectId: cfg.projectId, credentials: cfg.credentials }),
      bucket: cfg.bucket,
    };
  }
  return _client;
}

function extensionFor(filename: string, contentType: string): string {
  const fromName = filename.includes(".")
    ? filename.split(".").pop()!.toLowerCase()
    : "";
  if (fromName) return fromName;
  // Fallback al MIME: "image/jpeg" → "jpeg".
  return (contentType.split("/")[1] ?? "bin").toLowerCase();
}

/**
 * Sube los bytes a GCS con un nombre único y devuelve la URL pública + el object
 * name (la ref para borrar después). El bucket debe tener acceso público a nivel
 * IAM para que la URL resuelva sin firma.
 */
export async function uploadImage(
  bytes: Buffer,
  filename: string,
  contentType: string
): Promise<{ url: string; objectName: string }> {
  const { storage, bucket } = getClient();
  const objectName = `${FOLDER}/${randomUUID()}.${extensionFor(filename, contentType)}`;

  await storage
    .bucket(bucket)
    .file(objectName)
    .save(bytes, {
      contentType,
      resumable: false, // archivos chicos (≤10MB): upload directo, sin overhead.
      metadata: { cacheControl: "public, max-age=31536000, immutable" },
    });

  return {
    url: `https://storage.googleapis.com/${bucket}/${objectName}`,
    objectName,
  };
}

/** Borra un objeto por su nombre (la ref persistida como publicId). */
export async function deleteImage(objectName: string): Promise<void> {
  const { storage, bucket } = getClient();
  await storage.bucket(bucket).file(objectName).delete();
}

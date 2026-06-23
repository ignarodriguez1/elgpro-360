/**
 * Puerto de almacenamiento (hexagonal): el dominio habla con esta interfaz, NUNCA
 * con un proveedor concreto. Los adapters (Cloudinary, GCS, local) la implementan
 * y se eligen por env vía `getStorageProvider()`. Cambiar de proveedor = cambiar
 * el adapter, sin tocar el dominio.
 */

export interface UploadInput {
  /** Bytes del archivo ya en memoria (el endpoint recibe el multipart y los pasa). */
  bytes: Buffer;
  /** Nombre original del archivo, para derivar la extensión. */
  filename: string;
  /** MIME type reportado por el cliente (ej. "image/jpeg"). */
  contentType: string;
}

export interface StoredAsset {
  /** URL pública para renderizar el asset. */
  url: string;
  /** URL del thumbnail (puede coincidir con `url` si el proveedor no transforma). */
  thumbnailUrl: string;
  /**
   * Referencia AGNÓSTICA del asset, para borrarlo después: en Cloudinary es el
   * `public_id`, en GCS el object path, en local el file path relativo. Persistir
   * esta ref habilita el borrado real — pero eso requiere un campo de schema y
   * vive en el tranche de schema, no acá.
   */
  ref: string;
}

export interface StorageProvider {
  /** Nombre del proveedor activo (para logs/diagnóstico). */
  readonly name: string;
  /** Sube un archivo y devuelve sus URLs + la ref para borrado. */
  upload(input: UploadInput): Promise<StoredAsset>;
  /** Borra un asset por su `ref`. Aún no se cablea desde la app (espera schema). */
  delete(ref: string): Promise<void>;
  /** Deriva la URL de thumbnail a partir de una URL ya almacenada. */
  thumbnailUrl(url: string): string;
}

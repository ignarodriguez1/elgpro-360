"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { Photo } from "@/components/shared/Photo";
import { uploadImageFile } from "@/lib/upload-client";

/** Imagen subida: URL para mostrar + ref de storage para poder borrar el objeto después. */
export interface ImageSlotAsset {
  url: string;
  /** Object name en el provider (misma semántica que WorkOrderPhoto.publicId). null solo en datos históricos pre-ref. */
  ref: string | null;
}

interface ImageSlotProps {
  /** URL de la imagen ya cargada, o null/"" si el slot está vacío. */
  value: string | null;
  /** Set con el asset nuevo ({url, ref}), o null al quitar. La ref VIAJA — no repetir el error de descartarla (informe, brecha #1). */
  onChange: (asset: ImageSlotAsset | null) => void;
  label: string;
  /** Aclaración chica al lado del label (ej. "resultado", "opcional"). */
  hint?: string;
  /** Marca el slot como el principal/obligatorio (ej. la foto «Después»). */
  primary?: boolean;
}

type Status = "idle" | "uploading" | "error";

/**
 * Slot de UNA imagen: elegís → sube solo (comprimido) → llena el tile. Al hover/tap
 * aparecen Reemplazar y Quitar. Reemplaza el uso forzado de UploadZone (que es un
 * cargador batch) para los casos de una sola foto — Antes/Después del portfolio.
 */
export function ImageSlot({ value, onChange, label, hint, primary = false }: ImageSlotProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const pickRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setStatus("uploading");
    setError(null);
    try {
      const asset = await uploadImageFile(file);
      onChange({ url: asset.url, ref: asset.ref ?? null });
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "No se pudo subir.");
    }
  }

  const openPicker = () => pickRef.current?.click();
  const openCamera = () => camRef.current?.click();

  return (
    <div className="afield">
      <label className="afield-label">
        {primary && <span className="imgslot-req">● </span>}
        {label}
        {hint && <span className="imgslot-hint"> · {hint}</span>}
      </label>

      <div className={"imgslot" + (primary ? " imgslot-primary" : "") + (value ? " has-image" : "")}>
        {value ? (
          <>
            <Photo src={value} className="imgslot-photo" />
            <div className="imgslot-bar">
              <button type="button" className="imgslot-icon" onClick={openPicker} title="Reemplazar" aria-label="Reemplazar foto">
                <Icon name="swap" size={15} />
              </button>
              <button
                type="button"
                className="imgslot-icon danger"
                onClick={() => { onChange(null); setStatus("idle"); setError(null); }}
                title="Quitar"
                aria-label="Quitar foto"
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          </>
        ) : (
          <>
            <button type="button" className="imgslot-empty-main" onClick={openPicker}>
              <Icon name="plus" size={22} />
              <span>Subir foto</span>
            </button>
            <button type="button" className="imgslot-cam" onClick={openCamera}>
              <Icon name="camera" size={14} /> Cámara
            </button>
          </>
        )}

        {status === "uploading" && (
          <div className="imgslot-loading"><span className="imgslot-spin" /></div>
        )}
      </div>

      {status === "error" && (
        <p className="imgslot-error">
          {error} <button type="button" onClick={openPicker}>Reintentar</button>
        </p>
      )}

      {/* Inputs ocultos: reseteamos value tras elegir para poder re-elegir el mismo archivo. */}
      <input
        ref={pickRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => { handleFile(e.target.files?.[0]); e.currentTarget.value = ""; }}
      />
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => { handleFile(e.target.files?.[0]); e.currentTarget.value = ""; }}
      />
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Upload, Camera, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image-compression";

interface UploadedFile {
  url: string;
  thumbnailUrl?: string;
  publicId: string;
}

type PreviewStatus = "idle" | "uploading" | "done" | "error";

interface PreviewItem {
  id: string;
  file: File;
  preview: string;
  status: PreviewStatus;
  error?: string;
}

interface UploadZoneProps {
  onUpload: (files: UploadedFile[]) => void;
  maxFiles?: number;
  accept?: string;
  disabled?: boolean;
}

export function UploadZone({
  onUpload,
  maxFiles = 10,
  accept = "image/*",
  disabled = false,
}: UploadZoneProps) {
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newFiles: PreviewItem[] = Array.from(files)
        .slice(0, maxFiles - previews.length)
        .map((file) => ({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          status: "idle",
        }));

      setPreviews((prev) => [...prev, ...newFiles]);
    },
    [maxFiles, previews.length]
  );

  function removePreview(id: string) {
    setPreviews((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  function setStatus(id: string, status: PreviewStatus, error?: string) {
    setPreviews((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status, error } : p))
    );
  }

  /**
   * Sube los archivos pendientes (idle o con error previo) UNO POR UNO. Cada
   * archivo lleva su propio estado: un fallo NO descarta el archivo ni corta el
   * resto — queda marcado en error y se puede reintentar. Los que suben bien se
   * entregan al padre y se sacan de la lista; los que fallan quedan para reintentar.
   * Pensado para mobile/4G: nada desaparece en silencio.
   */
  async function uploadPending() {
    const pending = previews.filter(
      (p) => p.status === "idle" || p.status === "error"
    );
    if (pending.length === 0) return;

    const uploaded: UploadedFile[] = [];
    const doneIds: string[] = [];

    for (const item of pending) {
      setStatus(item.id, "uploading");

      try {
        // Comprimir en el cliente: baja la foto a ~1-2MB antes de viajar. Sin esto,
        // una foto de celular (4-12MB) revienta el límite de 4.5MB de las Vercel
        // Functions (413). compressImage nunca lanza: si falla, devuelve el original.
        const fileToUpload = await compressImage(item.file);
        const formData = new FormData();
        formData.append("file", fileToUpload);
        const res = await fetch("/api/upload", { method: "POST", body: formData });

        if (res.ok) {
          const asset = await res.json();
          uploaded.push({
            url: asset.url,
            thumbnailUrl: asset.thumbnailUrl,
            publicId: asset.ref,
          });
          doneIds.push(item.id);
          setStatus(item.id, "done");
        } else {
          const body = await res.json().catch(() => null);
          setStatus(
            item.id,
            "error",
            body?.error ?? `No se pudo subir (error ${res.status})`
          );
        }
      } catch {
        setStatus(item.id, "error", "Sin conexión. Tocá para reintentar.");
      }
    }

    // Entregamos al padre solo lo que subió bien y lo quitamos de la lista
    // (sus URLs ya quedaron capturadas). Los que fallaron permanecen visibles.
    if (uploaded.length > 0) {
      onUpload(uploaded);
      setPreviews((prev) => {
        prev
          .filter((p) => doneIds.includes(p.id))
          .forEach((p) => URL.revokeObjectURL(p.preview));
        return prev.filter((p) => !doneIds.includes(p.id));
      });
    }
  }

  const isUploading = previews.some((p) => p.status === "uploading");
  const errorCount = previews.filter((p) => p.status === "error").length;
  const pendingCount = previews.filter(
    (p) => p.status === "idle" || p.status === "error"
  ).length;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-card/50"
        } ${disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
      >
        <Upload className="h-8 w-8 text-muted" />
        <p className="mt-3 text-sm text-muted-light">
          Arrastrá fotos acá o
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = accept;
              input.multiple = true;
              input.onchange = () => handleFiles(input.files);
              input.click();
            }}
            disabled={disabled || previews.length >= maxFiles}
          >
            <Upload className="mr-2 h-4 w-4" />
            Seleccionar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.capture = "environment";
              input.onchange = () => handleFiles(input.files);
              input.click();
            }}
            disabled={disabled || previews.length >= maxFiles}
          >
            <Camera className="mr-2 h-4 w-4" />
            Cámara
          </Button>
        </div>
      </div>

      {previews.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {previews.map((p) => (
              <div
                key={p.id}
                className={`group relative aspect-square overflow-hidden rounded-lg border ${
                  p.status === "error" ? "border-primary" : "border-border"
                }`}
              >
                <img
                  src={p.preview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                {p.status === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
                {p.status === "error" && (
                  <button
                    type="button"
                    onClick={uploadPending}
                    title={p.error}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-primary/70 p-1 text-center"
                  >
                    <AlertCircle className="h-5 w-5 text-white" />
                    <span className="text-[10px] font-medium leading-tight text-white">
                      Reintentar
                    </span>
                  </button>
                )}
                {p.status !== "uploading" && (
                  <button
                    type="button"
                    onClick={() => removePreview(p.id)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {errorCount > 0 && (
            <p className="flex items-center gap-1.5 text-sm text-primary">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorCount} foto{errorCount !== 1 ? "s" : ""} no se{" "}
              {errorCount !== 1 ? "subieron" : "subió"}. Tocá la foto o el botón
              para reintentar.
            </p>
          )}

          <Button
            onClick={uploadPending}
            disabled={isUploading || disabled || pendingCount === 0}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : errorCount > 0 ? (
              `Reintentar ${pendingCount} foto${pendingCount !== 1 ? "s" : ""}`
            ) : (
              `Subir ${pendingCount} foto${pendingCount !== 1 ? "s" : ""}`
            )}
          </Button>
        </>
      )}
    </div>
  );
}

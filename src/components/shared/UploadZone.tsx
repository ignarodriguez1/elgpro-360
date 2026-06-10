"use client";

import { useState, useCallback } from "react";
import { Upload, Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedFile {
  url: string;
  thumbnailUrl?: string;
  publicId: string;
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
  const [previews, setPreviews] = useState<
    { file: File; preview: string; uploading: boolean }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newFiles = Array.from(files)
        .slice(0, maxFiles - previews.length)
        .map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          uploading: false,
        }));

      setPreviews((prev) => [...prev, ...newFiles]);
    },
    [maxFiles, previews.length]
  );

  function removePreview(index: number) {
    setPreviews((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  }

  async function uploadAll() {
    setPreviews((prev) => prev.map((p) => ({ ...p, uploading: true })));

    try {
      const res = await fetch("/api/upload", { method: "POST" });
      if (!res.ok) throw new Error("Error obteniendo firma de upload");

      const signedParams = await res.json();
      const uploaded: UploadedFile[] = [];

      for (const preview of previews) {
        const formData = new FormData();
        formData.append("file", preview.file);
        formData.append("api_key", signedParams.apiKey);
        formData.append("timestamp", signedParams.timestamp);
        formData.append("signature", signedParams.signature);
        if (signedParams.folder) formData.append("folder", signedParams.folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${signedParams.cloudName}/image/upload`,
          { method: "POST", body: formData }
        );

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          uploaded.push({
            url: data.secure_url,
            thumbnailUrl: data.secure_url.replace(
              "/upload/",
              "/upload/c_fill,w_200,h_200/"
            ),
            publicId: data.public_id,
          });
        }
      }

      onUpload(uploaded);
      setPreviews([]);
    } catch (error) {
      console.error("Upload failed:", error);
      setPreviews((prev) => prev.map((p) => ({ ...p, uploading: false })));
    }
  }

  const isUploading = previews.some((p) => p.uploading);

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
            {previews.map((p, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                <img
                  src={p.preview}
                  alt={`Preview ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                {p.uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                ) : (
                  <button
                    onClick={() => removePreview(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={uploadAll}
            disabled={isUploading || disabled}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              `Subir ${previews.length} foto${previews.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/Icon";
import { Photo } from "@/components/shared/Photo";
import { UploadZone } from "@/components/shared/UploadZone";
import { usePointerReorder } from "@/components/admin/usePointerReorder";
import {
  addServiceImagesAction,
  reorderServiceImagesAction,
  setServiceCoverAction,
  updateServiceImageAltAction,
  deleteServiceImageAction,
  updateServiceDescriptionAction,
} from "@/app/admin/servicios/actions";

export interface ServiceImageRow {
  id: string;
  url: string;
  alt: string | null;
  isCover: boolean;
}

/**
 * Contenido web del servicio: descripción pública + galería multi-imagen.
 * Lista vertical (no grilla) a propósito: `usePointerReorder` ordena por eje Y
 * y el alt inline necesita ancho de fila. Un fallo de action se muestra SIEMPRE
 * (el error vive junto a la galería, no dentro de un form colapsable — la
 * lección del delete invisible de TrabajosEditor, informe §G).
 */
export function ServiceGalleryEditor({
  serviceId,
  description,
  images: initial,
  maxImages,
}: {
  serviceId: string;
  description: string | null;
  images: ServiceImageRow[];
  maxImages: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [images, setImages] = useState<ServiceImageRow[]>(initial);
  const [error, setError] = useState<string | null>(null);

  // El server es la fuente de verdad tras cada router.refresh().
  useEffect(() => setImages(initial), [initial]);

  const { dragId, registerRow, handleProps } = usePointerReorder(
    images,
    setImages,
    (ids) => start(async () => {
      try {
        await reorderServiceImagesAction(serviceId, ids);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo reordenar.");
      }
    })
  );

  function run(fn: () => Promise<void>, fallback: string) {
    setError(null);
    start(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : fallback);
      }
    });
  }

  return (
    <section style={{ marginTop: 28 }} data-section="service-web-content">
      <div className="flow-intro">
        <Icon name="eye" size={18} />
        <p>Lo que se ve en la web pública: descripción y galería de fotos del servicio.</p>
      </div>

      <div className="afield" style={{ marginTop: 14 }}>
        <label className="afield-label">Descripción pública</label>
        <textarea
          defaultValue={description ?? ""}
          rows={3}
          placeholder="Qué incluye el servicio, materiales, resultado esperado…"
          onBlur={(e) =>
            run(
              () => updateServiceDescriptionAction(serviceId, e.target.value),
              "No se pudo guardar la descripción."
            )
          }
        />
      </div>

      <div className="afield" style={{ marginBottom: 10 }}>
        <label className="afield-label">
          Galería · {images.length}/{maxImages}
          {images.length > 1 && <span style={{ textTransform: "none", letterSpacing: 0 }}> — arrastrá para ordenar</span>}
        </label>
      </div>

      <div className="flow-list" data-section="gallery-list">
        {images.map((img) => (
          <div
            key={img.id}
            ref={registerRow(img.id)}
            className={"flow-step" + (dragId === img.id ? " dragging" : "")}
          >
            <span className="flow-grip" {...handleProps(img.id)}><Icon name="grip" size={18} /></span>
            <span style={{ width: 74, height: 56, borderRadius: 8, overflow: "hidden", flexShrink: 0, position: "relative" }}>
              <Photo src={img.url} alt={img.alt ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </span>
            <div className="flow-body" style={{ minWidth: 0 }}>
              <input
                className="flow-title-in"
                defaultValue={img.alt ?? ""}
                placeholder="Texto alternativo (qué se ve en la foto)…"
                onBlur={(e) =>
                  run(
                    () => updateServiceImageAltAction(serviceId, img.id, e.target.value),
                    "No se pudo guardar el texto alternativo."
                  )
                }
              />
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
                {img.isCover ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--primary)", fontFamily: "var(--display)", letterSpacing: ".06em" }}>
                    <Icon name="star2" size={13} /> PORTADA
                  </span>
                ) : (
                  <button
                    type="button"
                    className="abtn abtn-ghost abtn-sm"
                    disabled={pending}
                    onClick={() =>
                      run(() => setServiceCoverAction(serviceId, img.id), "No se pudo cambiar la portada.")
                    }
                  >
                    <Icon name="star2" size={13} /> Hacer portada
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              className="abtn abtn-ghost abtn-sm"
              disabled={pending}
              title="Eliminar imagen"
              aria-label="Eliminar imagen"
              onClick={() => {
                if (!window.confirm("¿Eliminar esta imagen de la galería? También se borra del almacenamiento. Esta acción no se puede deshacer.")) return;
                run(() => deleteServiceImageAction(serviceId, img.id), "No se pudo eliminar la imagen.");
              }}
            >
              <Icon name="trash" size={15} />
            </button>
          </div>
        ))}
        {images.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 10px" }}>
            Sin fotos todavía. La card pública usa la imagen por defecto hasta que subas la primera.
          </p>
        )}
      </div>

      {images.length < maxImages ? (
        <div style={{ marginTop: 12 }}>
          <UploadZone
            maxFiles={maxImages - images.length}
            disabled={pending}
            onUpload={(files) =>
              run(
                () =>
                  addServiceImagesAction(
                    serviceId,
                    files.map((f) => ({ url: f.url, ref: f.publicId }))
                  ),
                "No se pudieron agregar las imágenes."
              )
            }
          />
        </div>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 10 }}>
          Galería completa ({maxImages}/{maxImages}). Eliminá una imagen para subir otra.
        </p>
      )}

      {error && <p className="form-error-text" style={{ marginTop: 10 }}>{error}</p>}
    </section>
  );
}

"use client";

import { useState, useTransition, useEffect } from "react";
import { ToggleRow } from "@/components/admin/ToggleRow";
import { UploadZone } from "@/components/shared/UploadZone";
import { Icon } from "@/components/shared/Icon";
import { addStatusAction } from "@/app/admin/ordenes/[id]/actions";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";
import { STAGE_ORDER, STAGE_LABELS } from "@/lib/stages";

type Mode = "next" | "custom";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 859px)");
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}

interface NewStateFormProps {
  orderId: string;
  /** Índice 0-based de la etapa actual de la orden (para autocompletar el título). */
  currentStageIndex?: number;
}

export function NewStateForm({ orderId, currentStageIndex = 0 }: NewStateFormProps) {
  const { toast } = useAdminFeedback();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("next");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [internal, setInternal] = useState("");
  const [visible, setVisible] = useState(true);
  const [notify, setNotify] = useState(true);
  const [photoUrls, setPhotoUrls] = useState<{ url: string; publicId: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Cuando cambia el modo, autocompleta o limpia el título
  useEffect(() => {
    if (mode === "next") {
      const nextIdx = currentStageIndex;
      const stage = STAGE_ORDER[nextIdx];
      setTitle(stage ? STAGE_LABELS[stage] : "");
    } else {
      setTitle("");
    }
  }, [mode, currentStageIndex]);

  function reset() {
    setTitle(""); setDescription(""); setInternal("");
    setVisible(true); setNotify(true); setPhotoUrls([]);
    setError(null); setMode("next");
  }

  function handleClose() {
    reset();
    setOpen(false);
  }

  function submit() {
    if (!title.trim()) return;
    setError(null);
    start(async () => {
      const res = await addStatusAction(orderId, {
        title,
        description: description || undefined,
        internalDescription: internal || undefined,
        visibleToCustomer: visible,
        notifyCustomer: notify,
        photos: photoUrls,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast("success", notify ? "Estado publicado y cliente notificado." : "Estado publicado.");
      reset();
      setOpen(false);
    });
  }

  if (!open) {
    // Mobile: trigger compacto para el dock fijo. Desktop: botón inline.
    return isMobile ? (
      <button className="tod-newstate" type="button" onClick={() => setOpen(true)}>
        <Icon name="plus" size={18} /> Estado
      </button>
    ) : (
      <button className="abtn abtn-primary" onClick={() => setOpen(true)} style={{ marginTop: 16 }}>
        <Icon name="plus" size={16} /> Nuevo estado
      </button>
    );
  }

  const formBody = (
    <>
      {/* Segmented control: Siguiente etapa / Personalizado */}
      <div className="nsf-seg">
        <button
          className={"nsf-seg-btn" + (mode === "next" ? " active" : "")}
          onClick={() => setMode("next")}
        >
          <Icon name="arrow" size={15} /> Siguiente etapa
        </button>
        <button
          className={"nsf-seg-btn" + (mode === "custom" ? " active" : "")}
          onClick={() => setMode("custom")}
        >
          <Icon name="spray" size={15} /> Personalizado
        </button>
      </div>

      <div className="nsf-field">
        <label className="nsf-label">Título</label>
        <input
          className="nsf-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Masillado terminado"
          readOnly={mode === "next"}
        />
      </div>

      <div className="nsf-field">
        <label className="nsf-label">Descripción <span className="hint">(visible al cliente)</span></label>
        <textarea
          className="nsf-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Lo que verá el cliente sobre esta etapa…"
        />
      </div>

      <div className="nsf-field">
        <label className="nsf-label">Nota interna <span className="hint">(solo taller)</span></label>
        <textarea
          className="nsf-textarea"
          value={internal}
          onChange={(e) => setInternal(e.target.value)}
          rows={2}
          placeholder="Detalles técnicos, recordatorios…"
        />
      </div>

      <div className="nsf-field">
        <label className="nsf-label">Fotos</label>
        <UploadZone onUpload={(files) => setPhotoUrls((prev) => [...prev, ...files.map((f) => ({ url: f.url, publicId: f.publicId }))])} />
      </div>

      <ToggleRow
        icon="sun"
        title="Visible al cliente"
        desc="Aparece en el portal del cliente"
        on={visible}
        onChange={setVisible}
      />
      <ToggleRow
        icon="bell"
        title="Notificar por email"
        desc="Envía un email con la actualización"
        on={notify}
        onChange={setNotify}
      />

      {error && <p className="form-error-text">{error}</p>}
    </>
  );

  // ── Mobile: sheet desde abajo ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <div
          className={"sheet-veil" + (open ? " open" : "")}
          onClick={handleClose}
          style={{ pointerEvents: open ? "auto" : "none" }}
        />
        <div className={"sheet" + (open ? " open" : "")}>
          <div className="sheet-grab" />
          <div className="sheet-head">
            <h3>Nuevo estado</h3>
            <button className="sheet-x" onClick={handleClose}>
              <Icon name="close" size={20} />
            </button>
          </div>
          <div className="sheet-body">
            {formBody}
          </div>
          <div className="sheet-foot">
            <button
              className="abtn abtn-primary"
              style={{ flex: 1 }}
              onClick={submit}
              disabled={pending || !title.trim()}
            >
              <Icon name="check" size={17} />
              {pending ? "Guardando..." : "Guardar estado"}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Desktop: panel .nsf inline ────────────────────────────────────────────
  return (
    <div className="nsf" style={{ marginTop: 16 }}>
      <div className="nsf-head">
        <Icon name="spray" size={18} />
        <h3>Nuevo estado</h3>
      </div>
      <div className="nsf-body">
        {formBody}
      </div>
      <div className="nsf-foot">
        <button
          className="abtn abtn-primary"
          style={{ flex: 1 }}
          onClick={submit}
          disabled={pending || !title.trim()}
        >
          <Icon name="check" size={17} />
          {pending ? "Guardando..." : "Guardar estado"}
        </button>
        <button className="abtn abtn-ghost" onClick={handleClose} disabled={pending}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

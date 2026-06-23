"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/Icon";
import { TutorialVideo } from "@/components/public/TutorialVideo";
import { getYouTubeId } from "@/lib/youtube";
import {
  createTutorialAction,
  updateTutorialAction,
  deleteTutorialAction,
  toggleTutorialAction,
} from "@/app/admin/tutoriales/actions";

export interface TutorialRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  content: string;
  videoUrl: string | null;
  visible: boolean;
}

const EMPTY = { title: "", category: "", description: "", content: "", videoUrl: "", visible: true };
type FormState = typeof EMPTY;

export function TutorialEditor({ tutorials }: { tutorials: TutorialRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<TutorialRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const open = creating || editing != null;

  function startCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    setCreating(true);
  }

  function startEdit(t: TutorialRow) {
    setCreating(false);
    setEditing(t);
    setError(null);
    setForm({
      title: t.title,
      category: t.category,
      description: t.description ?? "",
      content: t.content,
      videoUrl: t.videoUrl ?? "",
      visible: t.visible,
    });
  }

  function close() {
    setCreating(false);
    setEditing(null);
    setError(null);
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit() {
    if (pending) return;
    if (!form.title.trim() || !form.category.trim() || !form.content.trim()) {
      setError("Título, categoría y contenido son obligatorios.");
      return;
    }
    setError(null);
    const payload = {
      title: form.title,
      category: form.category,
      description: form.description || undefined,
      content: form.content,
      videoUrl: form.videoUrl || undefined,
      visible: form.visible,
    };
    start(async () => {
      try {
        if (editing) await updateTutorialAction(editing.id, payload);
        else await createTutorialAction(payload);
        close();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar el tutorial.");
      }
    });
  }

  function remove(t: TutorialRow) {
    if (pending) return;
    if (!window.confirm(`¿Eliminar el tutorial "${t.title}"? Esta acción no se puede deshacer.`)) return;
    start(async () => {
      try {
        await deleteTutorialAction(t.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo eliminar.");
      }
    });
  }

  return (
    <div className="apage">
      <div className="ahead" data-section="header">
        <div className="ahead-l">
          <h2>Tutoriales</h2>
          <div className="ahead-sub">{tutorials.length} guías</div>
        </div>
        {!open && (
          <button className="abtn abtn-primary" type="button" onClick={startCreate}>
            <Icon name="plus" size={17} /> Nuevo tutorial
          </button>
        )}
      </div>

      {open && (
        <div className="apanel" style={{ padding: 20, marginBottom: 16 }} data-section="tutorial-form">
          <h3 style={{ fontFamily: "var(--display)", textTransform: "uppercase", marginBottom: 14 }}>
            {editing ? "Editar tutorial" : "Nuevo tutorial"}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="afield">
              <label className="afield-label">Título</label>
              <input value={form.title} onChange={set("title")} placeholder="Cómo lavar tu auto" />
            </div>
            <div className="afield">
              <label className="afield-label">Categoría</label>
              <input value={form.category} onChange={set("category")} placeholder="Exterior · Interior · Pintura…" />
            </div>
            <div className="afield">
              <label className="afield-label">Descripción (opcional)</label>
              <textarea value={form.description} onChange={set("description")} rows={2} />
            </div>
            <div className="afield">
              <label className="afield-label">Contenido</label>
              <textarea value={form.content} onChange={set("content")} rows={6} placeholder="Texto de la guía…" />
            </div>
            <div className="afield">
              <label className="afield-label">URL de video (opcional)</label>
              <input value={form.videoUrl} onChange={set("videoUrl")} placeholder="https://youtube.com/…" />
            </div>
            {getYouTubeId(form.videoUrl) && (
              <div style={{ maxWidth: 360 }}>
                <div className="afield-label" style={{ marginBottom: 8 }}>Preview</div>
                <TutorialVideo url={form.videoUrl} />
              </div>
            )}
            <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <button
                type="button"
                className={"atoggle" + (form.visible ? " on" : "")}
                onClick={() => setForm((f) => ({ ...f, visible: !f.visible }))}
                aria-pressed={form.visible}
              >
                <span />
              </button>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                {form.visible ? "Visible en la web pública" : "Oculto"}
              </span>
            </label>
            {error && <p className="form-error-text">{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="abtn abtn-primary" type="button" onClick={submit} disabled={pending}>
                {pending ? "Guardando…" : editing ? "Guardar cambios" : "Crear tutorial"}
              </button>
              <button className="abtn abtn-ghost" type="button" onClick={close} disabled={pending}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="apanel" data-section="crud-list">
        <div className="crud-list">
          {tutorials.map((t) => (
            <div className="crud-row" key={t.id}>
              <span className="t-avatar"><Icon name="play" size={15} /></span>
              <div className="crud-main">
                <div className="crud-title">{t.title}</div>
                <div className="crud-meta">{t.category}</div>
              </div>
              <button
                type="button"
                className={"atoggle" + (t.visible ? " on" : "")}
                disabled={pending}
                onClick={() => start(async () => { await toggleTutorialAction(t.id, !t.visible); router.refresh(); })}
                aria-pressed={t.visible}
                title={t.visible ? "Visible" : "Oculto"}
              >
                <span />
              </button>
              <button className="abtn abtn-ghost abtn-sm" type="button" onClick={() => startEdit(t)}>
                <Icon name="pencil" size={15} /> Editar
              </button>
              <button className="abtn abtn-destructive abtn-sm" type="button" onClick={() => remove(t)} disabled={pending} title="Eliminar">
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
          {tutorials.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>Sin tutoriales.</div>
          )}
        </div>
      </div>
    </div>
  );
}

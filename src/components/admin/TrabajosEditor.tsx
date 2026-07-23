"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/Icon";
import { Photo } from "@/components/shared/Photo";
import { ImageSlot } from "@/components/shared/ImageSlot";
import { usePointerReorder } from "@/components/admin/usePointerReorder";
import {
  createWorkAction,
  updateWorkAction,
  deleteWorkAction,
  toggleWorkAction,
  reorderWorksAction,
} from "@/app/admin/trabajos/actions";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";

export interface WorkRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  beforeImageRef: string | null;
  afterImageRef: string | null;
  tint: string | null;
  tall: boolean;
  visible: boolean;
}

const CATS = ["Pintura", "Detail", "Restauración", "Personalizado"];

const EMPTY = {
  title: "",
  category: "",
  description: "",
  beforeImageUrl: "",
  afterImageUrl: "",
  beforeImageRef: "",
  afterImageRef: "",
  tint: "",
  tall: false,
  visible: true,
};
type FormState = typeof EMPTY;

export function TrabajosEditor({ works }: { works: WorkRow[] }) {
  const router = useRouter();
  const { toast, confirm } = useAdminFeedback();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<WorkRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<WorkRow[]>(works);

  // El server manda tras cada refresh; el estado local es para el drag.
  useEffect(() => setItems(works), [works]);

  const { dragId, registerRow, handleProps } = usePointerReorder(
    items,
    setItems,
    (ids) =>
      start(async () => {
        try {
          await reorderWorksAction(ids);
          toast("success", "Orden del portfolio guardado.");
        } catch {
          toast("error", "No se pudo guardar el orden.");
        }
      })
  );

  const open = creating || editing != null;

  function startCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    setCreating(true);
  }

  function startEdit(w: WorkRow) {
    setCreating(false);
    setEditing(w);
    setError(null);
    setForm({
      title: w.title,
      category: w.category,
      description: w.description ?? "",
      beforeImageUrl: w.beforeImageUrl ?? "",
      afterImageUrl: w.afterImageUrl ?? "",
      beforeImageRef: w.beforeImageRef ?? "",
      afterImageRef: w.afterImageRef ?? "",
      tint: w.tint ?? "",
      tall: w.tall,
      visible: w.visible,
    });
  }

  function close() {
    setCreating(false);
    setEditing(null);
    setError(null);
  }

  const setText =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit() {
    if (pending) return;
    if (!form.title.trim() || !form.category.trim()) {
      setError("Título y categoría son obligatorios.");
      return;
    }
    setError(null);
    const payload = {
      title: form.title,
      category: form.category,
      description: form.description || undefined,
      beforeImageUrl: form.beforeImageUrl || undefined,
      afterImageUrl: form.afterImageUrl || undefined,
      beforeImageRef: form.beforeImageRef || undefined,
      afterImageRef: form.afterImageRef || undefined,
      tint: form.tint || undefined,
      tall: form.tall,
      visible: form.visible,
    };
    start(async () => {
      try {
        if (editing) {
          await updateWorkAction(editing.id, payload);
          toast("success", "Trabajo guardado.");
        } else {
          await createWorkAction(payload);
          toast("success", `Trabajo "${payload.title}" creado.`);
        }
        close();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar el trabajo.");
      }
    });
  }

  async function remove(w: WorkRow) {
    if (pending) return;
    const ok = await confirm({
      title: "Eliminar trabajo",
      message: `"${w.title}" se quita del portfolio y sus fotos se borran del almacenamiento. Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    start(async () => {
      try {
        await deleteWorkAction(w.id);
        toast("success", `Trabajo "${w.title}" eliminado.`);
        router.refresh();
      } catch (e) {
        // Toast, no solo setError: el form puede estar cerrado y el inline no se ve (informe §G).
        toast("error", e instanceof Error ? e.message : "No se pudo eliminar.");
      }
    });
  }

  return (
    <div className="apage">
      <div className="ahead" data-section="header">
        <div className="ahead-l">
          <h2>Trabajos</h2>
          <div className="ahead-sub">{works.length} en el portfolio · arrastrá para ordenar cómo se ven en la web</div>
        </div>
        {!open && (
          <button className="abtn abtn-primary" type="button" onClick={startCreate}>
            <Icon name="plus" size={17} /> Nuevo trabajo
          </button>
        )}
      </div>

      {open && (
        <div className="apanel" style={{ padding: 20, marginBottom: 16 }} data-section="work-form">
          <h3 style={{ fontFamily: "var(--display)", textTransform: "uppercase", marginBottom: 14 }}>
            {editing ? "Editar trabajo" : "Nuevo trabajo"}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="afield">
              <label className="afield-label">Título</label>
              <input value={form.title} onChange={setText("title")} placeholder="Audi A3 — Repintado integral" />
            </div>
            <div className="afield">
              <label className="afield-label">Categoría</label>
              <input value={form.category} onChange={setText("category")} list="work-cats" placeholder="Pintura · Detail · Restauración…" />
              <datalist id="work-cats">{CATS.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="afield">
              <label className="afield-label">Descripción (texto del lightbox)</label>
              <textarea value={form.description} onChange={setText("description")} rows={3} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <ImageSlot
                label="Antes"
                hint="ingreso, opcional"
                value={form.beforeImageUrl || null}
                onChange={(asset) =>
                  setForm((f) => ({ ...f, beforeImageUrl: asset?.url ?? "", beforeImageRef: asset?.ref ?? "" }))
                }
              />
              <ImageSlot
                label="Después"
                hint="resultado"
                primary
                value={form.afterImageUrl || null}
                onChange={(asset) =>
                  setForm((f) => ({ ...f, afterImageUrl: asset?.url ?? "", afterImageRef: asset?.ref ?? "" }))
                }
              />
            </div>

            <div className="afield">
              <label className="afield-label">Tint / overlay (opcional, ej. rgba(196,30,42,.18))</label>
              <input value={form.tint} onChange={setText("tint")} placeholder="rgba(196,30,42,.18)" />
            </div>

            <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <button type="button" className={"atoggle" + (form.tall ? " on" : "")} onClick={() => setForm((f) => ({ ...f, tall: !f.tall }))} aria-pressed={form.tall}>
                <span />
              </button>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Destacar en la grilla (item grande)</span>
            </label>

            <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <button type="button" className={"atoggle" + (form.visible ? " on" : "")} onClick={() => setForm((f) => ({ ...f, visible: !f.visible }))} aria-pressed={form.visible}>
                <span />
              </button>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                {form.visible ? "Visible en la web pública" : "Oculto"}
              </span>
            </label>

            {error && <p className="form-error-text">{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="abtn abtn-primary" type="button" onClick={submit} disabled={pending}>
                {pending ? "Guardando…" : editing ? "Guardar cambios" : "Crear trabajo"}
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
          {items.map((w) => (
            <div
              className={"crud-row" + (dragId === w.id ? " dragging" : "")}
              key={w.id}
              ref={registerRow(w.id)}
            >
              <span className="flow-grip" {...handleProps(w.id)}><Icon name="grip" size={18} /></span>
              <span className="t-avatar" style={{ overflow: "hidden", padding: 0 }}>
                {w.afterImageUrl ? (
                  <Photo src={w.afterImageUrl} className="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Icon name="spray" size={15} />
                )}
              </span>
              <div className="crud-main">
                <div className="crud-title">{w.title}</div>
                <div className="crud-meta">{w.category}{w.tall ? " · destacado" : ""}</div>
              </div>
              <button
                type="button"
                className={"atoggle" + (w.visible ? " on" : "")}
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    try {
                      await toggleWorkAction(w.id, !w.visible);
                      router.refresh();
                    } catch {
                      toast("error", "No se pudo cambiar la visibilidad.");
                    }
                  })
                }
                aria-pressed={w.visible}
                title={w.visible ? "Visible" : "Oculto"}
              >
                <span />
              </button>
              <button className="abtn abtn-ghost abtn-sm" type="button" onClick={() => startEdit(w)}>
                <Icon name="pencil" size={15} /> Editar
              </button>
              <button className="abtn abtn-destructive abtn-sm" type="button" onClick={() => remove(w)} disabled={pending} title="Eliminar">
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>Sin trabajos.</div>
          )}
        </div>
      </div>
    </div>
  );
}

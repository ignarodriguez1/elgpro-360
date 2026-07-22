"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Icon } from "@/components/shared/Icon";
import { STAGE_ORDER, STAGE_LABELS } from "@/lib/stages";
import { usePointerReorder } from "@/components/admin/usePointerReorder";
import type { OrderStage } from "@/generated/prisma/client";
import {
  reorderFlowStepsAction,
  addFlowStepAction,
  updateFlowStepAction,
  deleteFlowStepAction,
  renameServiceAction,
} from "@/app/admin/servicios/actions";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";

interface Step {
  id: string;
  title: string;
  description: string | null;
  stage: OrderStage;
  visible: boolean;
}

export function FlowEditor({
  serviceId,
  serviceName,
  steps: initial,
  children,
}: {
  serviceId: string;
  serviceName: string;
  steps: Step[];
  /** Secciones extra al pie (ej. galería + descripción), dentro del mismo .apage. */
  children?: React.ReactNode;
}) {
  const { toast, confirm } = useAdminFeedback();
  const [name, setName] = useState(serviceName);
  const [steps, setSteps] = useState(initial);
  const [newTitle, setNewTitle] = useState("");
  const [newStage, setNewStage] = useState<OrderStage>("PREPARACION");
  const [pending, start] = useTransition();

  // Bug latente pre-existente: el estado local nunca se resincronizaba tras la
  // revalidación del server (un paso agregado no aparecía hasta recargar).
  useEffect(() => setSteps(initial), [initial]);

  // Reorden por Pointer Events (mouse + touch).
  const { dragId, registerRow, handleProps } = usePointerReorder(
    steps,
    setSteps,
    (ids) =>
      start(async () => {
        try {
          await reorderFlowStepsAction(serviceId, ids);
        } catch {
          toast("error", "No se pudo guardar el orden de los pasos.");
        }
      })
  );

  function patch(stepId: string, data: Partial<Step>) {
    setSteps((prev) => prev.map((s) => s.id === stepId ? { ...s, ...data } : s));
    const { description, ...rest } = data;
    start(async () => {
      try {
        await updateFlowStepAction(serviceId, stepId, {
          ...rest,
          ...(description != null ? { description } : {}),
        });
      } catch {
        // Blur-save: sin toast de éxito (sería spam), pero el fallo NUNCA en silencio.
        toast("error", "No se pudo guardar el paso.");
      }
    });
  }

  function add() {
    if (pending || !newTitle.trim()) return; // anti doble-click
    const title = newTitle.trim();
    const stage = newStage;
    start(async () => {
      try {
        const created = await addFlowStepAction(serviceId, { title, stage, visible: true });
        // Optimista con ID real: el paso aparece al instante, sin esperar refresh.
        setSteps((prev) => [...prev, { id: created.id, title, description: null, stage, visible: true }]);
        toast("success", `Paso "${title}" agregado.`);
      } catch (e) {
        toast("error", e instanceof Error ? e.message : "No se pudo agregar el paso.");
      }
    });
    setNewTitle("");
  }

  async function remove(stepId: string) {
    const step = steps.find((s) => s.id === stepId);
    // Antes borraba directo, sin confirmación (peor que el confirm nativo).
    const ok = await confirm({
      title: "Eliminar paso",
      message: `"${step?.title ?? "Este paso"}" se quita del flujo. Las órdenes ya creadas no cambian.`,
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    start(async () => {
      try {
        await deleteFlowStepAction(serviceId, stepId);
        toast("success", "Paso eliminado.");
      } catch {
        if (step) setSteps((prev) => [...prev, step]); // revertir el optimista
        toast("error", "No se pudo eliminar el paso.");
      }
    });
  }

  return (
    <div className="apage svc-editor">
      <div className="ahead" data-section="header">
        <div className="ahead-l">
          <Link href="/admin/servicios" className="alink" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <Icon name="chevR" size={14} style={{ transform: "rotate(180deg)" }} /> Servicios
          </Link>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && start(() => renameServiceAction(serviceId, name))}
            className="flow-svc-name"
          />
        </div>
      </div>

      {/* Contenido web PRIMERO: es lo que el dueño carga más seguido. */}
      {children}

      <div className="apanel" style={{ marginTop: 24 }} data-section="steps-panel">
        <div className="apanel-head">
          <h3>Flujo de trabajo</h3>
          <span className="apanel-hint">Se precarga en cada orden nueva · arrastrá para ordenar</span>
        </div>
        <div className="apanel-body">
          <div className="flow-list" data-section="steps-list">
            {steps.map((s) => (
              <div
                key={s.id}
                ref={registerRow(s.id)}
                className={"flow-step compact" + (dragId === s.id ? " dragging" : "")}
              >
                <span className="flow-grip" {...handleProps(s.id)}><Icon name="grip" size={18} /></span>
                <div className="flow-body">
                  <div className="flow-main-row">
                    <input
                      className="flow-title-in"
                      value={s.title}
                      onChange={(e) => setSteps((p) => p.map((x) => x.id === s.id ? { ...x, title: e.target.value } : x))}
                      onBlur={() => patch(s.id, { title: s.title })}
                      placeholder="Título del paso"
                    />
                    <select
                      value={s.stage}
                      onChange={(e) => patch(s.id, { stage: e.target.value as OrderStage })}
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--muted)", fontSize: 12, padding: "3px 8px" }}
                    >
                      {STAGE_ORDER.map((st) => <option key={st} value={st}>{STAGE_LABELS[st]}</option>)}
                    </select>
                    <button
                      className={"atoggle" + (s.visible ? " on" : "")}
                      onClick={() => patch(s.id, { visible: !s.visible })}
                      title={s.visible ? "Visible al cliente" : "Interno (el cliente no lo ve)"}
                    ><span /></button>
                    <button className="abtn abtn-ghost abtn-sm" onClick={() => remove(s.id)} title="Eliminar paso" aria-label="Eliminar paso">
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                  <textarea
                    className="flow-desc-in compact"
                    defaultValue={s.description ?? ""}
                    onBlur={(e) => patch(s.id, { description: e.target.value })}
                    placeholder="Agregar descripción…"
                    rows={1}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flow-step compact" style={{ marginTop: 12 }} data-section="add-step-form">
            <input
              className="flow-title-in"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Nuevo estado…"
              style={{ flex: 1 }}
            />
            <select value={newStage} onChange={(e) => setNewStage(e.target.value as OrderStage)} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--muted)", padding: "3px 8px" }}>
              {STAGE_ORDER.map((st) => <option key={st} value={st}>{STAGE_LABELS[st]}</option>)}
            </select>
            <button className="abtn abtn-primary abtn-sm" onClick={add}><Icon name="plus" size={15} /> Agregar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

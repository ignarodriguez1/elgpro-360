"use client";

import { useState, useTransition } from "react";
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
  const [name, setName] = useState(serviceName);
  const [steps, setSteps] = useState(initial);
  const [newTitle, setNewTitle] = useState("");
  const [newStage, setNewStage] = useState<OrderStage>("PREPARACION");
  const [, start] = useTransition();

  // Reorden por Pointer Events (mouse + touch).
  const { dragId, registerRow, handleProps } = usePointerReorder(
    steps,
    setSteps,
    (ids) => start(() => reorderFlowStepsAction(serviceId, ids))
  );

  function patch(stepId: string, data: Partial<Step>) {
    setSteps((prev) => prev.map((s) => s.id === stepId ? { ...s, ...data } : s));
    const { description, ...rest } = data;
    start(() =>
      updateFlowStepAction(serviceId, stepId, {
        ...rest,
        ...(description != null ? { description } : {}),
      })
    );
  }

  function add() {
    if (!newTitle.trim()) return;
    start(() => addFlowStepAction(serviceId, { title: newTitle, stage: newStage, visible: true }));
    setNewTitle("");
  }

  function remove(stepId: string) {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    start(() => deleteFlowStepAction(serviceId, stepId));
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

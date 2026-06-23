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
}: {
  serviceId: string;
  serviceName: string;
  steps: Step[];
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
    <div className="apage">
      <div className="ahead" data-section="header">
        <div className="ahead-l">
          <Link href="/admin/servicios" className="alink" style={{ marginBottom: 6, display: "inline-flex", gap: 6, alignItems: "center" }}>
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

      <div className="flow-intro">
        <Icon name="layers" size={18} />
        <p>Arrastrá los estados para reordenarlos. Cada paso se precarga en las órdenes que usen este servicio.</p>
      </div>

      <div className="flow-list" data-section="steps-list">
        {steps.map((s) => (
          <div
            key={s.id}
            ref={registerRow(s.id)}
            className={"flow-step" + (dragId === s.id ? " dragging" : "")}
          >
            <span className="flow-grip" {...handleProps(s.id)}><Icon name="grip" size={18} /></span>
            <div className="flow-body">
              <input
                className="flow-title-in"
                value={s.title}
                onChange={(e) => setSteps((p) => p.map((x) => x.id === s.id ? { ...x, title: e.target.value } : x))}
                onBlur={() => patch(s.id, { title: s.title })}
                placeholder="Título del paso"
              />
              <textarea
                className="flow-desc-in"
                defaultValue={s.description ?? ""}
                onBlur={(e) => patch(s.id, { description: e.target.value })}
                placeholder="Descripción (opcional)…"
                rows={2}
              />
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
                  title="Visible al cliente"
                ><span /></button>
                <span style={{ fontSize: 11, color: "var(--muted-dim)" }}>{s.visible ? "Visible" : "Interno"}</span>
              </div>
            </div>
            <button className="abtn abtn-ghost abtn-sm" onClick={() => remove(s.id)}><Icon name="trash" size={15} /></button>
          </div>
        ))}
      </div>

      <div className="flow-step" style={{ marginTop: 12 }} data-section="add-step-form">
        <input
          className="flow-svc-name"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Nuevo estado..."
          style={{ flex: 1 }}
        />
        <select value={newStage} onChange={(e) => setNewStage(e.target.value as OrderStage)} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--muted)", padding: "3px 8px" }}>
          {STAGE_ORDER.map((st) => <option key={st} value={st}>{STAGE_LABELS[st]}</option>)}
        </select>
        <button className="abtn abtn-primary abtn-sm" onClick={add}><Icon name="plus" size={15} /> Agregar</button>
      </div>
    </div>
  );
}

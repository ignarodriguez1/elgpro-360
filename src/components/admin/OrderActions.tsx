"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { Icon } from "@/components/shared/Icon";
import { UploadZone } from "@/components/shared/UploadZone";
import {
  advanceStepAction,
  markReadyAction,
  markDeliveredAction,
} from "@/app/admin/ordenes/[id]/actions";
import type { ActionResult } from "@/lib/action-result";
import type { WorkOrderStatus } from "@/generated/prisma/client";

/**
 * Botones de ciclo de vida de la orden (PROCESO → LISTO → ENTREGADO).
 * Usa useTransition + disabled para que un doble click no dispare la acción dos
 * veces (idempotencia en la UI); los services son idempotentes como segunda red.
 *
 * Gate operativo: "Avanzar etapa" NO avanza directo — abre un modal que pide una
 * foto del estado actual, con escape "Sin imagen" (motivo opcional). Recién al
 * confirmar se dispara la transición, que queda asentada con autor + timestamp.
 *
 * variant "desktop" usa las clases .abtn; "mobile" replica la barra .tod-actions.
 */
const veilStyle: CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200,
  display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
};
const dialogStyle: CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16,
  padding: 20, maxWidth: 460, width: "100%", maxHeight: "90vh", overflowY: "auto",
};
const textareaStyle: CSSProperties = {
  width: "100%", marginTop: 12, background: "var(--bg)", border: "1px solid var(--border)",
  borderRadius: 8, padding: "8px 10px", color: "var(--text)", fontSize: 13,
  minHeight: 54, resize: "vertical", fontFamily: "inherit",
};

export function OrderActions({
  orderId,
  status,
  currentStepTitle,
  pendingStepTitles = [],
  variant = "desktop",
}: {
  orderId: string;
  status: WorkOrderStatus;
  currentStepTitle?: string | null;
  /** Etapas del plan sin completar. Si hay, "Avanzar etapa" se muestra y "Marcar
   *  listo" pide confirmación; si está vacío, no hay nada que avanzar. */
  pendingStepTitles?: string[];
  variant?: "desktop" | "mobile";
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Estado del gate de avance.
  const [gateOpen, setGateOpen] = useState(false);
  const [photo, setPhoto] = useState<{ url: string; publicId?: string } | null>(null);
  const [reason, setReason] = useState("");

  // Estado del modal de confirmación de "Marcar listo" con etapas pendientes.
  const [readyConfirmOpen, setReadyConfirmOpen] = useState(false);
  const pendingCount = pendingStepTitles.length;
  const hasNextStep = pendingCount > 0;

  function run(fn: () => Promise<ActionResult>) {
    if (pending) return;
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
    });
  }

  function openGate() {
    setError(null);
    setPhoto(null);
    setReason("");
    setGateOpen(true);
  }

  function confirmAdvance(gate: { photo?: { url: string; publicId?: string }; noImageReason?: string }) {
    if (pending) return;
    setError(null);
    start(async () => {
      const res = await advanceStepAction(orderId, gate);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setGateOpen(false);
      setPhoto(null);
      setReason("");
    });
  }

  const ready = () => run(() => markReadyAction(orderId));
  const deliver = () => run(() => markDeliveredAction(orderId));

  // Click en "Marcar listo": si quedan etapas sin completar, confirma primero
  // (se registrarán como completadas); si no, cierra directo.
  function onReadyClick() {
    if (pending) return;
    if (hasNextStep) {
      setError(null);
      setReadyConfirmOpen(true);
    } else {
      ready();
    }
  }
  function confirmReady() {
    if (pending) return;
    setError(null);
    start(async () => {
      const res = await markReadyAction(orderId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setReadyConfirmOpen(false);
    });
  }

  const gateModal = gateOpen ? (
    <div style={veilStyle} onClick={() => !pending && setGateOpen(false)}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>Avanzar etapa</div>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "6px 0 14px" }}>
          Sacá una foto del estado actual{currentStepTitle ? `: ${currentStepTitle}` : ""} antes de confirmar.
        </p>

        <UploadZone
          maxFiles={1}
          onUpload={(files) => {
            const f = files[0];
            if (f) setPhoto({ url: f.url, publicId: f.publicId });
          }}
        />
        {photo && (
          <p style={{ color: "var(--success)", fontSize: 12, marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="check" size={13} stroke={2.6} /> Imagen lista
          </p>
        )}

        <textarea
          placeholder="Motivo (opcional, si avanzás sin imagen)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={textareaStyle}
        />

        {error && <p style={{ color: "var(--primary)", fontSize: 13, marginTop: 8 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button
            className="abtn abtn-primary"
            type="button"
            disabled={pending || !photo}
            onClick={() => confirmAdvance({ photo: photo ?? undefined })}
          >
            <Icon name="check" size={16} /> Confirmar con imagen
          </button>
          <button
            className="abtn abtn-ghost"
            type="button"
            disabled={pending}
            onClick={() => confirmAdvance({ noImageReason: reason.trim() || undefined })}
          >
            Sin imagen
          </button>
          <button
            className="abtn abtn-ghost"
            type="button"
            disabled={pending}
            onClick={() => setGateOpen(false)}
            style={{ marginLeft: "auto" }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const readyModal = readyConfirmOpen ? (
    <div style={veilStyle} onClick={() => !pending && setReadyConfirmOpen(false)}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>Marcar listo para retirar</div>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "6px 0 10px" }}>
          {pendingCount === 1 ? "Queda 1 etapa sin avanzar." : `Quedan ${pendingCount} etapas sin avanzar.`} Al marcar listo se registran como completadas con la fecha de ahora:
        </p>
        <ul style={{ margin: "0 0 12px", paddingLeft: 18, color: "var(--text)", fontSize: 13, display: "flex", flexDirection: "column", gap: 4 }}>
          {pendingStepTitles.map((t, i) => <li key={i}>{t}</li>)}
        </ul>

        {error && <p style={{ color: "var(--primary)", fontSize: 13, marginBottom: 8 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="abtn abtn-primary" type="button" disabled={pending} onClick={confirmReady}>
            <Icon name="check" size={16} /> Marcar listo igual
          </button>
          <button
            className="abtn abtn-ghost"
            type="button"
            disabled={pending}
            onClick={() => setReadyConfirmOpen(false)}
            style={{ marginLeft: "auto" }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (variant === "mobile") {
    if (status === "ENTREGADO") {
      return (
        <p style={{ color: "var(--muted)", fontSize: 13, padding: "4px 18px 0", textAlign: "center" }}>
          Orden entregada — sin acciones pendientes.
        </p>
      );
    }
    return (
      <>
        <div className="tod-actions">
          {status === "PROCESO" && hasNextStep && (
            <button
              className="tbtn tbtn-primary"
              type="button"
              style={{ flex: 1 }}
              disabled={pending}
              onClick={openGate}
            >
              <Icon name="arrow" size={19} /> Avanzar etapa
            </button>
          )}
          {status === "PROCESO" && (
            <button
              className="tbtn tbtn-success"
              type="button"
              title="Marcar listo"
              style={!hasNextStep ? { flex: 1 } : undefined}
              disabled={pending}
              onClick={onReadyClick}
            >
              <Icon name="check" size={22} stroke={2.5} />
              {!hasNextStep && <span style={{ marginLeft: 6 }}>Marcar listo</span>}
            </button>
          )}
          {status === "LISTO" && (
            <button
              className="tbtn tbtn-success"
              type="button"
              style={{ flex: 1 }}
              disabled={pending}
              onClick={deliver}
            >
              <Icon name="check" size={19} /> Marcar entregado
            </button>
          )}
        </div>
        {error && !gateOpen && (
          <p style={{ color: "var(--primary)", fontSize: 13, padding: "8px 18px 0" }}>
            {error}
          </p>
        )}
        {gateModal}
        {readyModal}
      </>
    );
  }

  // Desktop
  if (status === "ENTREGADO") {
    return (
      <p style={{ color: "var(--muted)", fontSize: 13 }}>
        Orden entregada — sin acciones pendientes.
      </p>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {status === "PROCESO" && hasNextStep && (
          <button
            className="abtn abtn-ghost"
            type="button"
            disabled={pending}
            onClick={openGate}
          >
            <Icon name="arrow" size={16} /> Avanzar etapa
          </button>
        )}
        {status === "PROCESO" && (
          <button
            className="abtn abtn-primary"
            type="button"
            disabled={pending}
            onClick={onReadyClick}
          >
            <Icon name="check" size={16} /> Marcar listo para retirar
          </button>
        )}
        {status === "LISTO" && (
          <button
            className="abtn abtn-primary"
            type="button"
            disabled={pending}
            onClick={deliver}
          >
            <Icon name="check" size={16} /> Marcar entregado
          </button>
        )}
      </div>
      {error && !gateOpen && (
        <p style={{ color: "var(--primary)", fontSize: 13, marginTop: 8 }}>{error}</p>
      )}
      {gateModal}
      {readyModal}
    </div>
  );
}

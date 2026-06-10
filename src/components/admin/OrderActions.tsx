"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/shared/Icon";
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
 * Muestra el error de forma controlada en vez de explotar.
 *
 * variant "desktop" usa las clases .abtn; "mobile" replica la barra .tod-actions.
 */
export function OrderActions({
  orderId,
  status,
  variant = "desktop",
}: {
  orderId: string;
  status: WorkOrderStatus;
  variant?: "desktop" | "mobile";
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<ActionResult>) {
    if (pending) return;
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
    });
  }

  const advance = () => run(() => advanceStepAction(orderId));
  const ready = () => run(() => markReadyAction(orderId));
  const deliver = () => run(() => markDeliveredAction(orderId));

  if (variant === "mobile") {
    if (status === "ENTREGADO") return null;
    return (
      <>
        <div className="tod-actions">
          {status === "PROCESO" && (
            <button
              className="tbtn tbtn-primary"
              type="button"
              style={{ flex: 1 }}
              disabled={pending}
              onClick={advance}
            >
              <Icon name="arrow" size={19} /> Avanzar etapa
            </button>
          )}
          {status === "PROCESO" && (
            <button
              className="tbtn tbtn-success"
              type="button"
              title="Marcar listo"
              disabled={pending}
              onClick={ready}
            >
              <Icon name="check" size={22} stroke={2.5} />
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
        {error && (
          <p style={{ color: "var(--primary)", fontSize: 13, padding: "8px 18px 0" }}>
            {error}
          </p>
        )}
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
        {status === "PROCESO" && (
          <button
            className="abtn abtn-ghost"
            type="button"
            disabled={pending}
            onClick={advance}
          >
            <Icon name="arrow" size={16} /> Avanzar etapa
          </button>
        )}
        {status === "PROCESO" && (
          <button
            className="abtn abtn-primary"
            type="button"
            disabled={pending}
            onClick={ready}
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
      {error && (
        <p style={{ color: "var(--primary)", fontSize: 13, marginTop: 8 }}>{error}</p>
      )}
    </div>
  );
}

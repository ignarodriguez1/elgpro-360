import type { WorkOrderStatus } from "@/generated/prisma/client";

interface StatusBadgeProps {
  status: WorkOrderStatus;
}

const config: Record<WorkOrderStatus, { cls: string; label: string }> = {
  PROCESO: { cls: "proceso", label: "En proceso" },
  LISTO: { cls: "listo", label: "Listo para retirar" },
  ENTREGADO: { cls: "entregado", label: "Entregado" },
};

/** Pill de estado de orden con dot pulsante (portado de StatusPill del prototipo). */
export function StatusBadge({ status }: StatusBadgeProps) {
  const { cls, label } = config[status];
  return (
    <span className={"statuspill " + cls}>
      <span className="dotpulse" />
      {label}
    </span>
  );
}

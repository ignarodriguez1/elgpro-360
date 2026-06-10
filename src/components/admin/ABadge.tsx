import type { WorkOrderStatus } from "@/generated/prisma/enums";

interface ABadgeProps {
  estado: WorkOrderStatus;
}

const map: Record<WorkOrderStatus, { cls: string; label: string }> = {
  PROCESO: { cls: "proceso", label: "En proceso" },
  LISTO: { cls: "listo", label: "Listo" },
  ENTREGADO: { cls: "entregado", label: "Entregado" },
};

/**
 * Badge de estado de orden para tablas admin.
 * Usa las clases .abadge de admin.css (dot pulsante + pill).
 */
export function ABadge({ estado }: ABadgeProps) {
  const { cls, label } = map[estado];
  return (
    <span className={"abadge " + cls}>
      <span className="d" />
      {label}
    </span>
  );
}

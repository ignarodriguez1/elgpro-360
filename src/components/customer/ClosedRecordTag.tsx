import { Icon } from "@/components/shared/Icon";

/**
 * Indicador para una OT CERRADA (entregada/finalizada). Honestidad: un registro
 * cerrado NO está "en vivo" — nada de punto que late. Reusa la familia visual del
 * indicador de conexión (.ci) pero en variante estática y muda. Server component:
 * no necesita el seam (no hay stream que reflejar).
 */
export function ClosedRecordTag({ label = "Registro cerrado" }: { label?: string }) {
  return (
    <span className="ci ci-closed" role="status">
      <Icon name="check" size={12} />
      <span className="ci-label">{label}</span>
    </span>
  );
}

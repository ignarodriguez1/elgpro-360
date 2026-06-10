import { Icon } from "@/components/shared/Icon";
import type { IconName } from "@/components/shared/Icon";
import type { CSSProperties } from "react";

interface StatCardProps {
  icon: IconName;
  value: number | string;
  label: string;
  delta?: string;
  tint: string;
  col: string;
}

/**
 * Tarjeta de métrica para el dashboard admin.
 * Portado del metric block de admin-screens.jsx ADashboard.
 * Usa clases .metric / .metric-ic / .metric-val de admin.css.
 */
export function StatCard({ icon, value, label, delta, tint, col }: StatCardProps) {
  const icStyle: CSSProperties = { background: tint, color: col };
  return (
    <div className="metric">
      <div className="metric-ic" style={icStyle}>
        <Icon name={icon} size={22} />
      </div>
      <div className="metric-val">{value}</div>
      <div className="metric-lbl">{label}</div>
      {delta && <div className="metric-delta">{delta}</div>}
    </div>
  );
}

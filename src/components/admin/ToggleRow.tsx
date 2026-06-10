"use client";

import { Icon } from "@/components/shared/Icon";
import type { IconName } from "@/components/shared/Icon";
import { Toggle } from "./Toggle";

interface ToggleRowProps {
  icon: IconName;
  title: string;
  desc: string;
  on: boolean;
  onChange: (val: boolean) => void;
}

/**
 * Fila con ícono, título, descripción y toggle.
 * Portado de admin-screens.jsx ToggleRow.
 * Usa clases .tgl-row / .tgl-info de admin.css.
 */
export function ToggleRow({ icon, title, desc, on, onChange }: ToggleRowProps) {
  return (
    <div className={"tgl-row" + (on ? " on" : "")}>
      <div className="tgl-info">
        <Icon name={icon} size={19} />
        <div>
          <div className="tgl-t">{title}</div>
          <div className="tgl-d">{desc}</div>
        </div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

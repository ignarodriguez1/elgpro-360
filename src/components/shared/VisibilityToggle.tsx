"use client";

import { Icon } from "./Icon";

interface VisibilityToggleProps {
  visible: boolean;
  onToggle: (visible: boolean) => void;
  label?: string;
  disabled?: boolean;
}

/** Toggle visible/interno con icono ojo/escudo (coherente con el prototipo). */
export function VisibilityToggle({
  visible,
  onToggle,
  label = "Visible al cliente",
  disabled = false,
}: VisibilityToggleProps) {
  return (
    <button
      type="button"
      className={"vis-toggle" + (visible ? " on" : "")}
      onClick={() => !disabled && onToggle(!visible)}
      disabled={disabled}
      aria-pressed={visible}
    >
      <Icon name={visible ? "sun" : "shield"} size={14} />
      <span className="vis-track">
        <span className="vis-knob" />
      </span>
      <span className="vis-label">{label}</span>
    </button>
  );
}

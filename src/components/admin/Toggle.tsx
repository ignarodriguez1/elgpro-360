"use client";

interface ToggleProps {
  on: boolean;
  onChange: (val: boolean) => void;
}

/**
 * Toggle switch admin (portado de admin-screens.jsx Toggle).
 * Usa clases .tgl / .tgl.on de admin.css.
 */
export function Toggle({ on, onChange }: ToggleProps) {
  return (
    <button
      className={"tgl" + (on ? " on" : "")}
      onClick={() => onChange(!on)}
      aria-pressed={on}
      type="button"
    />
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserActiveAction } from "@/app/admin/usuarios/actions";

/**
 * Toggle de activar/desactivar una cuenta. Cualquier rol (equipo o cliente).
 * `disabled` se usa para la propia cuenta del admin (no puede autodesactivarse).
 */
export function UserActiveToggle({
  userId,
  active,
  disabled,
}: {
  userId: string;
  active: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    if (pending || disabled) return;
    setError(null);
    start(async () => {
      const res = await setUserActiveAction(userId, !active);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
      <button
        type="button"
        className={active ? "abtn abtn-ghost" : "abtn abtn-primary"}
        onClick={toggle}
        disabled={pending || disabled}
        title={disabled ? "No podés cambiar el estado de tu propia cuenta" : undefined}
        style={{ fontSize: 13, padding: "4px 12px" }}
      >
        {pending ? "..." : active ? "Desactivar" : "Activar"}
      </button>
      {error && <span style={{ color: "#ff5d68", fontSize: 12 }}>{error}</span>}
    </span>
  );
}

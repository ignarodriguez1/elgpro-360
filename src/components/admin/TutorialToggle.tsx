"use client";

import { useTransition } from "react";
import { toggleTutorialAction } from "@/app/admin/tutoriales/actions";

export function TutorialToggle({ id, visible }: { id: string; visible: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      className={"atoggle" + (visible ? " on" : "")}
      disabled={pending}
      onClick={() => start(() => toggleTutorialAction(id, !visible))}
      aria-pressed={visible}
    >
      <span />
    </button>
  );
}

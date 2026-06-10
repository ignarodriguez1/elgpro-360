"use client";

import { signOut } from "next-auth/react";
import { Icon } from "@/components/shared/Icon";

export function LogoutButton() {
  return (
    <button
      className="btn btn-ghost btn-block"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <Icon name="logout" size={17} /> Cerrar sesión
    </button>
  );
}

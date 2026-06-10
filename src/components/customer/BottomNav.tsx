"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/shared/Icon";

const NAV_ITEMS = [
  { id: "autos", href: "/clientes/dashboard", icon: "car" as const, label: "Mis autos" },
  { id: "tutoriales", href: "/clientes/tutoriales", icon: "play" as const, label: "Cuidados" },
  { id: "perfil", href: "/clientes/perfil", icon: "user" as const, label: "Perfil" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="p-nav">
      {NAV_ITEMS.map((item) => {
        const active =
          item.id === "autos"
            ? pathname === "/clientes/dashboard" ||
              pathname.startsWith("/clientes/vehiculos")
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={"p-nav-btn" + (active ? " active" : "")}
          >
            <Icon name={item.icon} size={22} />
            <span className="p-nav-lbl">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

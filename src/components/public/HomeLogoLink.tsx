"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { scrollToTop } from "./scrollToTop";

/**
 * Envuelve el lockup de marca en un link a la home. Estando YA en la home no
 * recarga: hace scroll-to-top suave (SPA), igual que el logo del header. Es un
 * client component para poder leer el pathname y frenar la navegación; se usa
 * desde los footers, que son server components (server puede renderizar client).
 */
export function HomeLogoLink({ children, className }: { children: ReactNode; className?: string }) {
  const pathname = usePathname();
  return (
    <Link
      href="/"
      aria-label="Inicio"
      className={className}
      style={{ display: "inline-flex", width: "fit-content" }}
      onClick={(e) => {
        if (pathname === "/") {
          e.preventDefault();
          scrollToTop();
        }
      }}
    >
      {children}
    </Link>
  );
}

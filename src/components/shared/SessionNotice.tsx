"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/shared/Icon";
import { Logo } from "@/components/shared/Logo";

type SessionNoticeVariant = "admin-on-customer" | "customer-on-admin";

interface SessionNoticeProps {
  variant: SessionNoticeVariant;
  /** Nombre del usuario conectado (puede venir null). */
  name?: string | null;
  /** Email del usuario conectado (puede venir null). */
  email?: string | null;
  /** Rol real, para afinar el copy (ADMIN vs STAFF). */
  role?: string;
}

function roleLabel(role?: string): string {
  if (role === "STAFF") return "personal del taller";
  return "administrador";
}

/**
 * Aviso full-screen cuando un usuario logueado cae en un área que no
 * le corresponde. NUNCA un estado mudo: muestra quién está conectado y
 * ofrece dos salidas claras (ir a tu área / cerrar sesión e ingresar al área pedida).
 *
 * No redirige por su cuenta — solo navega cuando el usuario elige una acción,
 * por eso es seguro montarlo desde un layout sin riesgo de loop 307.
 */
export function SessionNotice({ variant, name, email, role }: SessionNoticeProps) {
  const router = useRouter();
  const displayName = name?.trim() || "tu cuenta";

  const isAdminOnCustomer = variant === "admin-on-customer";

  const title = isAdminOnCustomer
    ? `Ya estás como ${roleLabel(role)}`
    : "Estás conectado como cliente";

  const context = isAdminOnCustomer
    ? "Esta es la zona de clientes."
    : "Esta es la zona de administración.";

  const primaryLabel = isAdminOnCustomer
    ? "Ir al panel de administración"
    : "Ir a mi portal";
  const primaryHref = isAdminOnCustomer ? "/admin" : "/clientes/dashboard";

  const secondaryLabel = isAdminOnCustomer
    ? "Cerrar sesión e ingresar como cliente"
    : "Cerrar sesión e ingresar como administrador";
  // Tras cerrar sesión, lo llevamos al login del área que estaba intentando ver.
  const secondaryCallback = isAdminOnCustomer ? "/clientes/login" : "/admin/login";

  return (
    <div className="snotice" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="snotice-card">
        <Logo size={20} tagline center />
        <div className="snotice-ic" style={{ marginTop: 24 }}>
          <Icon name={isAdminOnCustomer ? "shield" : "user"} size={26} />
        </div>
        <h2 className="snotice-title">{title}</h2>
        <p className="snotice-sub">
          Estás conectado como <b>{displayName}</b>. {context}
        </p>
        {email && <p className="snotice-id">{email}</p>}

        <div className="snotice-actions">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => router.push(primaryHref)}
          >
            <Icon name="arrow" size={18} /> {primaryLabel}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => signOut({ callbackUrl: secondaryCallback })}
          >
            <Icon name="logout" size={17} /> {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

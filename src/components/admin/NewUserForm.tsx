"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/Icon";
import { createTeamUserAction } from "@/app/admin/usuarios/actions";

type Role = "STAFF" | "ADMIN";

export function NewUserForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("STAFF");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ emailSent: boolean } | null>(null);

  function submit() {
    if (pending) return;
    setError(null);
    start(async () => {
      const res = await createTeamUserAction({ name, email, role });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setCreated({ emailSent: res.data!.emailSent });
      setName("");
      setEmail("");
      setRole("STAFF");
      router.refresh();
    });
  }

  if (created) {
    return (
      <div
        className="apanel"
        style={{ padding: 18, marginBottom: 16, borderColor: "rgba(34,197,94,.3)" }}
      >
        <div className="afield-label" style={{ color: "var(--success)", marginBottom: 6 }}>
          Usuario creado
        </div>
        <p style={{ fontSize: 14, color: "var(--muted-light)" }}>
          {created.emailSent
            ? "Le enviamos un email para que active su cuenta ingresando con su email."
            : "El email no se pudo enviar. Avisale que ingrese al panel con su email — va a recibir un código de acceso al instante."}
        </p>
        <button
          className="abtn abtn-ghost"
          type="button"
          style={{ marginTop: 12 }}
          onClick={() => {
            setCreated(null);
            setOpen(false);
          }}
        >
          Cerrar
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button className="abtn abtn-primary" type="button" onClick={() => setOpen(true)}>
        <Icon name="plus" size={17} /> Nuevo usuario
      </button>
    );
  }

  return (
    <div className="apanel" style={{ padding: 20, marginBottom: 16 }}>
      <h3 style={{ fontFamily: "var(--display)", textTransform: "uppercase", marginBottom: 14 }}>
        Nuevo usuario
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="afield">
          <label className="afield-label">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" />
        </div>
        <div className="afield">
          <label className="afield-label">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@elgpro.com" type="email" />
        </div>
        <div className="afield">
          <label className="afield-label">Rol</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="STAFF">Operario (STAFF) — acceso al taller</option>
            <option value="ADMIN">Administrador (ADMIN) — acceso total</option>
          </select>
        </div>
        {error && <p className="form-error-text">{error}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="abtn abtn-primary" type="button" onClick={submit} disabled={pending}>
            {pending ? "Creando..." : "Crear usuario"}
          </button>
          <button className="abtn abtn-ghost" type="button" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

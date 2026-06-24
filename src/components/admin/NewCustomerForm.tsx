"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/Icon";
import { createCustomerAction } from "@/app/admin/clientes/actions";

export function NewCustomerForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ emailSent: boolean } | null>(null);

  function submit() {
    if (pending) return;
    setError(null);
    start(async () => {
      const res = await createCustomerAction({
        name,
        email,
        phone: phone || undefined,
        notes: notes || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setCreated({ emailSent: res.data!.emailSent });
      setName("");
      setEmail("");
      setPhone("");
      setNotes("");
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
          Cliente creado
        </div>
        <p style={{ fontSize: 14, color: "var(--muted-light)" }}>
          {created.emailSent
            ? "Le enviamos un email para que active su cuenta ingresando con su email al portal."
            : "El email no se pudo enviar. Avisale que ingrese al portal con su email — va a recibir un código de acceso al instante."}
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
        <Icon name="plus" size={17} /> Nuevo cliente
      </button>
    );
  }

  return (
    <div className="apanel" style={{ padding: 20, marginBottom: 16 }}>
      <h3 style={{ fontFamily: "var(--display)", textTransform: "uppercase", marginBottom: 14 }}>
        Nuevo cliente
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="afield">
          <label className="afield-label">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" />
        </div>
        <div className="afield">
          <label className="afield-label">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@email.com" type="email" />
        </div>
        <div className="afield">
          <label className="afield-label">Teléfono (opcional)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 ..." />
        </div>
        <div className="afield">
          <label className="afield-label">Notas (opcional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        {error && <p className="form-error-text">{error}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="abtn abtn-primary" type="button" onClick={submit} disabled={pending}>
            {pending ? "Creando..." : "Crear cliente"}
          </button>
          <button className="abtn abtn-ghost" type="button" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

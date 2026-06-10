"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/Icon";
import { updateCustomerAction } from "@/app/admin/clientes/actions";

export function EditCustomerForm({
  customerId,
  initial,
}: {
  customerId: string;
  initial: { name: string; phone: string; notes: string };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [notes, setNotes] = useState(initial.notes);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (pending) return;
    setError(null);
    start(async () => {
      const res = await updateCustomerAction(customerId, { name, phone, notes });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button className="abtn abtn-ghost abtn-sm" type="button" onClick={() => setOpen(true)}>
        <Icon name="pencil" size={15} /> Editar datos
      </button>
    );
  }

  return (
    <div className="apanel" style={{ padding: 20, marginTop: 16 }}>
      <h3 style={{ fontFamily: "var(--display)", textTransform: "uppercase", marginBottom: 14 }}>
        Editar cliente
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="afield">
          <label className="afield-label">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="afield">
          <label className="afield-label">Teléfono</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 ..." />
        </div>
        <div className="afield">
          <label className="afield-label">Notas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        {error && <p style={{ color: "var(--primary)", fontSize: 13 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="abtn abtn-primary" type="button" onClick={submit} disabled={pending}>
            {pending ? "Guardando..." : "Guardar cambios"}
          </button>
          <button className="abtn abtn-ghost" type="button" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

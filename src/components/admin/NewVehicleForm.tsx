"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/Icon";
import { createVehicleAction } from "@/app/admin/vehiculos/actions";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";

export function NewVehicleForm({ customerProfileId }: { customerProfileId: string }) {
  const router = useRouter();
  const { toast } = useAdminFeedback();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [licensePlate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [vin, setVin] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (pending) return;
    setError(null);
    const parsedYear = year ? Number(year) : undefined;
    start(async () => {
      const res = await createVehicleAction(customerProfileId, {
        licensePlate,
        brand,
        model,
        year: parsedYear && !Number.isNaN(parsedYear) ? parsedYear : undefined,
        color: color || undefined,
        vin: vin || undefined,
        notes: notes || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPlate(""); setBrand(""); setModel(""); setYear(""); setColor(""); setVin(""); setNotes("");
      toast("success", "Vehículo creado.");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button className="abtn abtn-ghost abtn-sm" type="button" onClick={() => setOpen(true)}>
        <Icon name="plus" size={15} /> Agregar vehículo
      </button>
    );
  }

  return (
    <div className="apanel" style={{ padding: 20, marginTop: 14 }}>
      <h3 style={{ fontFamily: "var(--display)", textTransform: "uppercase", marginBottom: 14 }}>
        Nuevo vehículo
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="afield">
          <label className="afield-label">Patente</label>
          <input value={licensePlate} onChange={(e) => setPlate(e.target.value)} placeholder="AB 123 CD" />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="afield" style={{ flex: 1, minWidth: 140 }}>
            <label className="afield-label">Marca</label>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="BMW" />
          </div>
          <div className="afield" style={{ flex: 1, minWidth: 140 }}>
            <label className="afield-label">Modelo</label>
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="M4 Competition" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="afield" style={{ flex: 1, minWidth: 120 }}>
            <label className="afield-label">Año</label>
            <input value={year} onChange={(e) => setYear(e.target.value)} type="number" placeholder="2023" />
          </div>
          <div className="afield" style={{ flex: 1, minWidth: 120 }}>
            <label className="afield-label">Color</label>
            <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Negro" />
          </div>
        </div>
        <div className="afield">
          <label className="afield-label">VIN (opcional)</label>
          <input value={vin} onChange={(e) => setVin(e.target.value)} />
        </div>
        <div className="afield">
          <label className="afield-label">Notas (opcional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        {error && <p style={{ color: "var(--primary)", fontSize: 13 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="abtn abtn-primary" type="button" onClick={submit} disabled={pending}>
            {pending ? "Creando..." : "Crear vehículo"}
          </button>
          <button className="abtn abtn-ghost" type="button" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

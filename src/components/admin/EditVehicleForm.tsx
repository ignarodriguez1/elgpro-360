"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/Icon";
import {
  updateVehicleAction,
  deleteVehicleAction,
} from "@/app/admin/vehiculos/actions";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";

interface VehicleInitial {
  licensePlate: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  vin: string;
  notes: string;
}

export function EditVehicleForm({
  vehicleId,
  initial,
}: {
  vehicleId: string;
  initial: VehicleInitial;
}) {
  const router = useRouter();
  const { toast, confirm } = useAdminFeedback();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [licensePlate, setPlate] = useState(initial.licensePlate);
  const [brand, setBrand] = useState(initial.brand);
  const [model, setModel] = useState(initial.model);
  const [year, setYear] = useState(initial.year);
  const [color, setColor] = useState(initial.color);
  const [vin, setVin] = useState(initial.vin);
  const [notes, setNotes] = useState(initial.notes);
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (pending) return;
    setError(null);
    const parsedYear = year ? Number(year) : undefined;
    start(async () => {
      const res = await updateVehicleAction(vehicleId, {
        licensePlate,
        brand,
        model,
        year: parsedYear && !Number.isNaN(parsedYear) ? parsedYear : undefined,
        color,
        vin,
        notes,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast("success", "Vehículo guardado.");
      setOpen(false);
      router.refresh();
    });
  }

  async function remove() {
    if (pending) return;
    const ok = await confirm({
      title: "Eliminar vehículo",
      message: "Se elimina el vehículo y su historial deja de estar accesible. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    setError(null);
    start(async () => {
      const res = await deleteVehicleAction(vehicleId);
      if (!res.ok) {
        setError(res.error);
        toast("error", res.error);
        return;
      }
      toast("success", "Vehículo eliminado.");
      router.push("/admin/vehiculos");
    });
  }

  if (!open) {
    return (
      <button className="abtn abtn-ghost abtn-sm" type="button" onClick={() => setOpen(true)}>
        <Icon name="pencil" size={15} /> Editar / eliminar
      </button>
    );
  }

  return (
    <div className="apanel" style={{ padding: 20, marginTop: 16 }}>
      <h3 style={{ fontFamily: "var(--display)", textTransform: "uppercase", marginBottom: 14 }}>
        Editar vehículo
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="afield">
          <label className="afield-label">Patente</label>
          <input value={licensePlate} onChange={(e) => setPlate(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="afield" style={{ flex: 1, minWidth: 140 }}>
            <label className="afield-label">Marca</label>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="afield" style={{ flex: 1, minWidth: 140 }}>
            <label className="afield-label">Modelo</label>
            <input value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="afield" style={{ flex: 1, minWidth: 120 }}>
            <label className="afield-label">Año</label>
            <input value={year} onChange={(e) => setYear(e.target.value)} type="number" />
          </div>
          <div className="afield" style={{ flex: 1, minWidth: 120 }}>
            <label className="afield-label">Color</label>
            <input value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>
        <div className="afield">
          <label className="afield-label">VIN</label>
          <input value={vin} onChange={(e) => setVin(e.target.value)} />
        </div>
        <div className="afield">
          <label className="afield-label">Notas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        {error && <p style={{ color: "var(--primary)", fontSize: 13 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="abtn abtn-primary" type="button" onClick={save} disabled={pending}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </button>
            <button className="abtn abtn-ghost" type="button" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </button>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            style={{
              fontFamily: "var(--display)",
              textTransform: "uppercase",
              fontSize: 13,
              padding: "8px 14px",
              borderRadius: "var(--r-sm)",
              border: "1px solid rgba(220,38,38,.4)",
              background: "transparent",
              color: "#ef4444",
              cursor: "pointer",
            }}
          >
            <Icon name="trash" size={14} /> Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

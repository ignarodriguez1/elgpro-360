"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/shared/Icon";
import { UploadZone } from "@/components/shared/UploadZone";
import { createOrderAction, getTimelinePreview } from "@/app/admin/ordenes/nueva/actions";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  year: number | null;
  color: string | null;
}
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  vehicles: Vehicle[];
}
interface Service {
  id: string;
  name: string;
  description: string | null;
}
interface TimelineStep {
  title: string;
  stage: string;
  visibleToCustomer: boolean;
}

const STEPS = ["Cliente", "Vehículo", "Trabajo", "Fotos", "Revisión"];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function Wizard({ clients, services }: { clients: Client[]; services: Service[] }) {
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);

  const [clientId, setClientId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [eta, setEta] = useState("");
  const [photoUrls, setPhotoUrls] = useState<{ url: string; publicId: string }[]>([]);
  const [preview, setPreview] = useState<TimelineStep[]>([]);
  const [error, setError] = useState("");

  const client = clients.find((c) => c.id === clientId) ?? null;
  const vehicle = client?.vehicles.find((v) => v.id === vehicleId) ?? null;

  function toggleService(id: string) {
    const next = serviceIds.includes(id)
      ? serviceIds.filter((s) => s !== id)
      : [...serviceIds, id];
    setServiceIds(next);
    startTransition(async () => {
      const tl = await getTimelinePreview(next);
      setPreview(tl as TimelineStep[]);
    });
  }

  const canNext =
    (step === 0 && clientId) ||
    (step === 1 && vehicleId) ||
    (step === 2 && title.trim() && serviceIds.length > 0) ||
    step === 3 ||
    step === 4;

  function submit() {
    if (!vehicleId) return;
    setError("");
    startTransition(async () => {
      const res = await createOrderAction({
        vehicleId: vehicleId!,
        title,
        description: description || undefined,
        serviceIds,
        estimatedDeliveryDate: eta || undefined,
        photos: photoUrls.length ? photoUrls : undefined,
      });
      if (res && "error" in res) setError(res.error);
    });
  }

  return (
    <div className="wiz">
      <div className="wiz-steps">
        {STEPS.map((s, i) => (
          <span key={s} style={{ display: "contents" }}>
            {i > 0 && <div className={"wiz-sline" + (i <= step ? " done" : "")} />}
            <div className={"wiz-step" + (i < step ? " done" : "") + (i === step ? " active" : "")}>
              <span className="wiz-snum">
                {i < step ? <Icon name="check" size={15} /> : i + 1}
              </span>
              <span className="wiz-slbl">{s}</span>
            </div>
          </span>
        ))}
      </div>

      <div className="wiz-panel">
        {step === 0 && (
          <>
            <h3>Seleccionar cliente</h3>
            <p className="sub">Elegí un cliente existente.</p>
            <div className="wiz-pick">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className={"wiz-opt" + (clientId === c.id ? " sel" : "")}
                  onClick={() => { setClientId(c.id); setVehicleId(null); }}
                >
                  <span className="wiz-opt-av">{initials(c.name)}</span>
                  <div className="wiz-opt-main">
                    <div className="wiz-opt-name">{c.name}</div>
                    <div className="wiz-opt-sub">{c.phone ?? c.email} · {c.vehicles.length} vehículo(s)</div>
                  </div>
                  <span className="wiz-opt-check"><Icon name="check" size={14} /></span>
                </div>
              ))}
              {clients.length === 0 && <p style={{ color: "var(--muted)" }}>No hay clientes. Creá uno primero.</p>}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3>Seleccionar vehículo</h3>
            <p className="sub">Vehículos de {client?.name ?? "el cliente"}.</p>
            <div className="wiz-pick">
              {client?.vehicles.map((v) => (
                <div
                  key={v.id}
                  className={"wiz-opt" + (vehicleId === v.id ? " sel" : "")}
                  onClick={() => setVehicleId(v.id)}
                >
                  <span className="wiz-opt-av"><Icon name="car" size={18} /></span>
                  <div className="wiz-opt-main">
                    <div className="wiz-opt-name">{v.brand} {v.model}</div>
                    <div className="wiz-opt-sub">{v.licensePlate} · {v.color ?? ""} {v.year ?? ""}</div>
                  </div>
                  <span className="wiz-opt-check"><Icon name="check" size={14} /></span>
                </div>
              ))}
              {client && client.vehicles.length === 0 && (
                <p style={{ color: "var(--muted)" }}>Este cliente no tiene vehículos.</p>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3>Detalle del trabajo</h3>
            <p className="sub">Definí servicios, fecha y notas.</p>
            <div className="afield">
              <label className="afield-label">Título del trabajo</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Pintura completa + ceramic" />
            </div>
            <div className="afield">
              <label className="afield-label">Descripción (opcional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="afield">
              <label className="afield-label">Servicios solicitados</label>
              <div className="wiz-srv-grid">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className={"wiz-opt" + (serviceIds.includes(s.id) ? " sel" : "")}
                    style={{ padding: "12px 14px" }}
                    onClick={() => toggleService(s.id)}
                  >
                    <div className="wiz-opt-main">
                      <div className="wiz-opt-name" style={{ fontSize: 13 }}>{s.name}</div>
                    </div>
                    <span className="wiz-opt-check" style={{ width: 20, height: 20 }}><Icon name="check" size={12} /></span>
                  </div>
                ))}
              </div>
            </div>
            {preview.length > 0 && (
              <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: 14 }}>
                <div className="afield-label" style={{ marginBottom: 8 }}>Timeline a precargar ({preview.length} pasos)</div>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
                  {preview.map((p, i) => <li key={i}>{p.title}{!p.visibleToCustomer && " · interno"}</li>)}
                </ol>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <h3>Fotos iniciales</h3>
            <p className="sub">Documentá el estado de ingreso del vehículo (opcional — también podés cargarlas luego).</p>
            <UploadZone
              onUpload={(files) =>
                setPhotoUrls((prev) => [...prev, ...files.map((f) => ({ url: f.url, publicId: f.publicId }))])
              }
            />
            {photoUrls.length > 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 12 }}>
                <Icon name="check" size={14} /> {photoUrls.length} foto
                {photoUrls.length !== 1 ? "s" : ""} cargada
                {photoUrls.length !== 1 ? "s" : ""} · se asociará
                {photoUrls.length !== 1 ? "n" : ""} al ingreso de la orden
              </p>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <h3>Revisión</h3>
            <p className="sub">Confirmá los datos antes de crear la orden.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
              <Row label="Cliente" value={client?.name} />
              <Row label="Vehículo" value={vehicle ? `${vehicle.brand} ${vehicle.model} · ${vehicle.licensePlate}` : ""} />
              <Row label="Trabajo" value={title} />
              <Row label="Servicios" value={services.filter((s) => serviceIds.includes(s.id)).map((s) => s.name).join(", ")} />
              <Row label="Fotos de ingreso" value={photoUrls.length ? `${photoUrls.length} foto${photoUrls.length !== 1 ? "s" : ""}` : "Sin fotos"} />
              <div className="afield">
                <label className="afield-label">Entrega estimada (opcional)</label>
                <input type="date" value={eta} onChange={(e) => setEta(e.target.value)} />
              </div>
              {error && <p style={{ color: "var(--primary)" }}>{error}</p>}
            </div>
          </>
        )}
      </div>

      <div className="wiz-foot">
        <button className="abtn abtn-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || pending}>Atrás</button>
        {step < 4 ? (
          <button className="abtn abtn-primary" onClick={() => setStep((s) => s + 1)} disabled={!canNext || pending}>
            Siguiente <Icon name="arrow" size={16} />
          </button>
        ) : (
          <button className="abtn abtn-primary" onClick={submit} disabled={pending}>
            {pending ? "Creando..." : <><Icon name="check" size={17} /> Crear orden</>}
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
      <span style={{ color: "var(--muted-dim)", textTransform: "uppercase", fontSize: 11, fontFamily: "var(--display)" }}>{label}</span>
      <span style={{ textAlign: "right" }}>{value}</span>
    </div>
  );
}

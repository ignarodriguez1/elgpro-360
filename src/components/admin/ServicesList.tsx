"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/shared/Icon";
import { Photo } from "@/components/shared/Photo";
import { reorderServicesAction, createServiceAction, toggleServiceVisibleAction } from "@/app/admin/servicios/actions";
import { usePointerReorder } from "@/components/admin/usePointerReorder";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";

interface Svc {
  id: string;
  name: string;
  visible: boolean;
  steps: number;
  visibleSteps: number;
  cover: string | null;
  photos: number;
  hasDescription: boolean;
}

export function ServicesList({ services }: { services: Svc[] }) {
  const router = useRouter();
  const { toast, promptText } = useAdminFeedback();
  const [items, setItems] = useState(services);
  const [, start] = useTransition();

  // Reorden por Pointer Events (mouse + touch).
  const { dragId, registerRow, handleProps } = usePointerReorder(
    items,
    setItems,
    (ids) =>
      start(async () => {
        try {
          await reorderServicesAction(ids);
        } catch {
          toast("error", "No se pudo guardar el orden. Recargá e intentá de nuevo.");
        }
      })
  );

  async function nuevo() {
    const name = await promptText({
      title: "Nuevo servicio",
      message: "Después vas a poder cargarle descripción, fotos y el flujo de trabajo.",
      placeholder: "Ej: Polarizado de vidrios",
      confirmLabel: "Crear servicio",
    });
    if (!name) return;
    start(async () => {
      try {
        const id = await createServiceAction(name);
        toast("success", `Servicio "${name}" creado.`);
        router.push(`/admin/servicios/${id}`);
      } catch (e) {
        toast("error", e instanceof Error ? e.message : "No se pudo crear el servicio.");
      }
    });
  }

  return (
    <>
      <div className="ahead" data-section="header">
        <div className="ahead-l">
          <h2>Servicios</h2>
          <div className="ahead-sub">Arrastrá para ordenar cómo se muestran en la web</div>
        </div>
        <button className="abtn abtn-primary" onClick={nuevo}><Icon name="plus" size={17} /> Nuevo servicio</button>
      </div>

      <div className="flow-list" data-section="services-list">
        {items.map((s) => (
          <div
            key={s.id}
            ref={registerRow(s.id)}
            className={"flow-step" + (dragId === s.id ? " dragging" : "")}
          >
            <span className="flow-grip" {...handleProps(s.id)}><Icon name="grip" size={18} /></span>
            <span className="svc-row-thumb">
              {s.cover ? <Photo src={s.cover} /> : <Icon name="spray" size={16} />}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--display)", textTransform: "uppercase" }}>{s.name}</div>
              <div className="mono" style={{ fontSize: 12, color: "var(--muted-dim)" }}>
                {s.steps} estados · {s.photos} {s.photos === 1 ? "foto" : "fotos"}
                {!s.hasDescription && " · sin descripción"}
              </div>
            </div>
            <button
              className={"atoggle" + (s.visible ? " on" : "")}
              title={s.visible ? "Visible en la web" : "Oculto"}
              onClick={() => {
                const next = !s.visible;
                setItems((prev) => prev.map((x) => x.id === s.id ? { ...x, visible: next } : x));
                start(async () => {
                  try {
                    await toggleServiceVisibleAction(s.id, next);
                  } catch {
                    // Revertir el optimista y avisar: un toggle fallido en silencio es mentirle al dueño.
                    setItems((prev) => prev.map((x) => x.id === s.id ? { ...x, visible: !next } : x));
                    toast("error", "No se pudo cambiar la visibilidad.");
                  }
                });
              }}
            ><span /></button>
            <Link href={`/admin/servicios/${s.id}`} className="abtn abtn-ghost abtn-sm"><Icon name="pencil" size={15} /> Editar</Link>
          </div>
        ))}
      </div>
    </>
  );
}

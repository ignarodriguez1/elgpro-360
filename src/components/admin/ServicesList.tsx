"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/shared/Icon";
import { Photo } from "@/components/shared/Photo";
import { reorderServicesAction, createServiceAction, toggleServiceVisibleAction } from "@/app/admin/servicios/actions";
import { usePointerReorder } from "@/components/admin/usePointerReorder";

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
  const [items, setItems] = useState(services);
  const [, start] = useTransition();

  // Reorden por Pointer Events (mouse + touch).
  const { dragId, registerRow, handleProps } = usePointerReorder(
    items,
    setItems,
    (ids) => start(() => reorderServicesAction(ids))
  );

  function nuevo() {
    const name = window.prompt("Nombre del nuevo servicio:");
    if (!name) return;
    start(async () => {
      const id = await createServiceAction(name);
      router.push(`/admin/servicios/${id}`);
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
              onClick={() => {
                setItems((prev) => prev.map((x) => x.id === s.id ? { ...x, visible: !x.visible } : x));
                start(() => toggleServiceVisibleAction(s.id, !s.visible));
              }}
            ><span /></button>
            <Link href={`/admin/servicios/${s.id}`} className="abtn abtn-ghost abtn-sm"><Icon name="pencil" size={15} /> Editar</Link>
          </div>
        ))}
      </div>
    </>
  );
}

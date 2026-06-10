"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/shared/Icon";
import { reorderServicesAction, createServiceAction, toggleServiceVisibleAction } from "@/app/admin/servicios/actions";

interface Svc {
  id: string;
  name: string;
  visible: boolean;
  steps: number;
  visibleSteps: number;
}

export function ServicesList({ services }: { services: Svc[] }) {
  const router = useRouter();
  const [items, setItems] = useState(services);
  const [drag, setDrag] = useState<number | null>(null);
  const [, start] = useTransition();

  function onDrop(target: number) {
    if (drag === null || drag === target) return;
    const next = [...items];
    const [moved] = next.splice(drag, 1);
    next.splice(target, 0, moved);
    setItems(next);
    setDrag(null);
    start(() => reorderServicesAction(next.map((s) => s.id)));
  }

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
      <div className="ahead">
        <div className="ahead-l">
          <h2>Servicios</h2>
          <div className="ahead-sub">Arrastrá para ordenar cómo se muestran en la web</div>
        </div>
        <button className="abtn abtn-primary" onClick={nuevo}><Icon name="plus" size={17} /> Nuevo servicio</button>
      </div>

      <div className="flow-list">
        {items.map((s, i) => (
          <div
            key={s.id}
            className="flow-step"
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
          >
            <span className="flow-grip"><Icon name="grip" size={18} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--display)", textTransform: "uppercase" }}>{s.name}</div>
              <div className="mono" style={{ fontSize: 12, color: "var(--muted-dim)" }}>
                {s.steps} estados · {s.visibleSteps} visibles al cliente
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

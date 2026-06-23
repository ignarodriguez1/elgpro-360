"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Reordenamiento por Pointer Events (mouse + touch), reemplazo del HTML5
 * drag&drop que NO dispara `dragstart` en pantallas táctiles.
 *
 * Hook CONTROLADO: el componente sigue siendo dueño de su lista (`items` +
 * `setItems`), así puede seguir editando/agregando/borrando ítems. El hook
 * sólo maneja el arrastre: reordena en vivo y persiste al soltar.
 *
 * Uso:
 *   const { dragId, registerRow, handleProps } =
 *     usePointerReorder(items, setItems, (ids) => start(() => reorderAction(ids)));
 *   <div ref={registerRow(item.id)} >
 *     <span className="grip" {...handleProps(item.id)} />
 *   </div>
 *
 * `touchAction: none` en el grip evita el scroll del navegador al arrastrar.
 */
export function usePointerReorder<T extends { id: string }>(
  items: T[],
  setItems: (next: T[]) => void,
  onCommit: (orderedIds: string[]) => void
) {
  const [dragId, setDragId] = useState<string | null>(null);
  const draggingRef = useRef(false);
  const dragIdRef = useRef<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map());
  const itemsRef = useRef<T[]>(items);
  itemsRef.current = items;

  const registerRow = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) rowRefs.current.set(id, el);
      else rowRefs.current.delete(id);
    },
    []
  );

  const handleProps = useCallback(
    (id: string) => ({
      style: { touchAction: "none" as const, cursor: "grab" },
      onPointerDown: (e: React.PointerEvent) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        draggingRef.current = true;
        dragIdRef.current = id;
        setDragId(id);
        try {
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        } catch {
          /* pointerId no activo (algunos entornos) — el drag sigue por eventos */
        }
      },
      onPointerMove: (e: React.PointerEvent) => {
        if (!draggingRef.current || dragIdRef.current == null) return;
        const y = e.clientY;
        const ordered = itemsRef.current;
        // primer ítem cuyo punto medio queda por debajo del puntero = destino
        let target = ordered.findIndex((it) => {
          const el = rowRefs.current.get(it.id);
          if (!el) return false;
          const r = el.getBoundingClientRect();
          return y < r.top + r.height / 2;
        });
        if (target === -1) target = ordered.length - 1;
        const from = ordered.findIndex((it) => it.id === dragIdRef.current);
        if (from === -1 || from === target) return;
        const next = [...ordered];
        const [moved] = next.splice(from, 1);
        next.splice(target, 0, moved);
        setItems(next);
      },
      onPointerUp: (e: React.PointerEvent) => {
        if (!draggingRef.current) return;
        draggingRef.current = false;
        dragIdRef.current = null;
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
        } catch {
          /* idem */
        }
        setDragId(null);
        onCommit(itemsRef.current.map((it) => it.id));
      },
      onPointerCancel: () => {
        draggingRef.current = false;
        dragIdRef.current = null;
        setDragId(null);
      },
    }),
    [setItems, onCommit]
  );

  return { dragId, registerRow, handleProps };
}

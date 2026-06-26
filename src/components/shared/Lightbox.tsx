"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { Photo } from "./Photo";

export interface LightboxPhoto {
  src?: string;
  caption?: string | null;
  sub?: string | null;
  tint?: string;
}

interface LightboxProps {
  photos: LightboxPhoto[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const CLOSE_DRAG = 120; // px de swipe-abajo para cerrar
const SWIPE_NAV = 60; // px de swipe horizontal para cambiar de foto

type Pt = { x: number; y: number };
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Visor de fotos full-screen con gestos nativos (porteado a <body>):
 *  - pinch-zoom + doble-tap para acercar/alejar, pan cuando está zoomeado;
 *  - swipe-abajo para cerrar; swipe horizontal para cambiar de foto (si hay varias).
 * Portal a body para escapar contenedores con transform/scroll (PullToRefresh,
 * -webkit-overflow-scrolling de iOS) que atrapaban el `position:fixed`.
 */
export function Lightbox({ photos, index, onClose, onIndexChange }: LightboxProps) {
  const open = index >= 0 && !!photos[index];

  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [dragY, setDragY] = useState(0); // swipe-abajo para cerrar (solo sin zoom)
  const [gesturing, setGesturing] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const g = useRef({
    pointers: new Map<number, Pt>(),
    startDist: 0,
    startScale: 1,
    startTx: 0,
    startTy: 0,
    startX: 0,
    startY: 0,
    lastTap: 0,
    mode: "" as "" | "pan" | "pinch" | "swipe",
  });

  const reset = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
    setDragY(0);
    setGesturing(false);
    g.current.mode = "";
    g.current.pointers.clear();
  }, []);

  // Reset al cambiar de foto (o al abrir/cerrar).
  useEffect(() => {
    reset();
  }, [index, reset]);

  // Scroll-lock del fondo + cerrar con Escape mientras está abierto.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  const p = photos[index];
  const multi = photos.length > 1;

  // Limita el pan al borde de la imagen escalada dentro del stage.
  const clampPan = (x: number, y: number, s: number): Pt => {
    const el = stageRef.current;
    if (!el) return { x, y };
    const maxX = Math.max(0, (el.clientWidth * (s - 1)) / 2);
    const maxY = Math.max(0, (el.clientHeight * (s - 1)) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  };

  const go = (dir: 1 | -1) =>
    onIndexChange((index + dir + photos.length) % photos.length);

  const onPointerDown = (e: ReactPointerEvent) => {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const pts = g.current.pointers;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setGesturing(true);

    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      g.current.mode = "pinch";
      g.current.startDist = dist(a, b);
      g.current.startScale = scale;
      g.current.startTx = tx;
      g.current.startTy = ty;
      return;
    }

    g.current.startX = e.clientX;
    g.current.startY = e.clientY;
    g.current.startTx = tx;
    g.current.startTy = ty;
    g.current.mode = scale > 1 ? "pan" : "";

    // doble-tap → toggle zoom
    if (e.timeStamp - g.current.lastTap < 300) {
      if (scale > 1) reset();
      else setScale(DOUBLE_TAP_SCALE);
      g.current.lastTap = 0;
    } else {
      g.current.lastTap = e.timeStamp;
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const pts = g.current.pointers;
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (g.current.mode === "pinch" && pts.size >= 2) {
      const [a, b] = [...pts.values()];
      const s = Math.max(1, Math.min(MAX_SCALE, g.current.startScale * (dist(a, b) / (g.current.startDist || 1))));
      const c = clampPan(g.current.startTx, g.current.startTy, s);
      setScale(s);
      setTx(c.x);
      setTy(c.y);
      return;
    }

    if (pts.size !== 1) return;
    const dx = e.clientX - g.current.startX;
    const dy = e.clientY - g.current.startY;

    if (g.current.mode === "pan" && scale > 1) {
      const c = clampPan(g.current.startTx + dx, g.current.startTy + dy, scale);
      setTx(c.x);
      setTy(c.y);
      return;
    }

    if (scale === 1) {
      // Decide eje al superar el umbral: vertical-abajo = cerrar; horizontal = navegar.
      if (g.current.mode === "" && Math.hypot(dx, dy) > 10) {
        g.current.mode = Math.abs(dy) > Math.abs(dx) ? "swipe" : "pan";
      }
      if (g.current.mode === "swipe" && dy > 0) {
        setDragY(dy);
      }
    }
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    const pts = g.current.pointers;
    const last = pts.get(e.pointerId) ?? null;
    pts.delete(e.pointerId);

    const dx = last ? last.x - g.current.startX : 0;
    const dy = last ? last.y - g.current.startY : 0;

    if (g.current.mode === "swipe") {
      if (dragY > CLOSE_DRAG) {
        onClose();
        return;
      }
      setDragY(0);
    } else if (g.current.mode === "pan" && scale === 1 && multi) {
      // pan horizontal sin zoom = navegar
      if (Math.abs(dx) > SWIPE_NAV && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    } else if (g.current.mode === "pinch" && scale < 1.05) {
      reset();
    }

    if (pts.size === 0) {
      g.current.mode = "";
      setGesturing(false);
    }
  };

  const zoomed = scale > 1;
  const dragFade = dragY > 0 ? Math.max(0.25, 1 - dragY / 500) : 1;

  return createPortal(
    <div
      className="p-lb"
      onClick={onClose}
      style={
        dragY > 0
          ? { transform: `translateY(${dragY}px)`, opacity: dragFade, transition: gesturing ? "none" : "transform .25s ease, opacity .25s ease" }
          : undefined
      }
    >
      <div className="p-lb-top">
        <span className="p-lb-count">
          {index + 1} / {photos.length}
        </span>
        <button className="p-lb-close" onClick={onClose} aria-label="Cerrar">
          <Icon name="close" size={20} />
        </button>
      </div>

      <div
        className="p-lb-stage"
        ref={stageRef}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Photo
          src={p.src}
          tint={p.tint}
          className="p-lb-photo"
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transition: gesturing ? "none" : "transform .25s ease",
            cursor: zoomed ? "grab" : "auto",
          }}
        />
        {multi && !zoomed && (
          <>
            <button
              className="p-lb-nav p-lb-prev"
              onClick={() => go(-1)}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Anterior"
            >
              <Icon name="chevR" size={20} style={{ transform: "scaleX(-1)" }} />
            </button>
            <button
              className="p-lb-nav p-lb-next"
              onClick={() => go(1)}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Siguiente"
            >
              <Icon name="chevR" size={20} />
            </button>
          </>
        )}
      </div>

      {(p.caption || p.sub) && (
        <div className="p-lb-cap">
          {p.caption && <div className="p-lb-cap-t">{p.caption}</div>}
          {p.sub && <div className="p-lb-cap-d">{p.sub}</div>}
        </div>
      )}
    </div>,
    document.body
  );
}

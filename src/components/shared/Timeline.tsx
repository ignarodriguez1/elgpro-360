"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { Photo } from "./Photo";
import { Lightbox, type LightboxPhoto } from "./Lightbox";
import { fmtDayMonth as fmtDate, fmtTime } from "@/lib/format";
import type { OrderStage, WorkOrderStatus } from "@/generated/prisma/client";

export interface TimelineUpdate {
  id: string;
  title: string;
  description?: string | null;
  internalDescription?: string | null;
  stage?: OrderStage | null;
  visibleToCustomer: boolean;
  notifyCustomer?: boolean;
  notifiedAt?: Date | string | null;
  isCurrent: boolean;
  /** true = el taller ya alcanzó este paso; false = pendiente del plan. */
  confirmed?: boolean;
  createdAt: Date | string;
  createdBy?: { name: string } | null;
  photos?: {
    id: string;
    imageUrl: string;
    thumbnailUrl?: string | null;
    caption?: string | null;
  }[];
}

/**
 * Variante visual del modo cliente:
 * - `feed`  → línea de tiempo compacta (mobile del portal, clases .tl-*).
 * - `panel` → tarjeta con encabezado para la columna desktop del portal (.pwtl-*).
 * Ambas comparten TODA la lógica (lightbox, filtrado, formato). Antes `panel`
 * vivía duplicado en DesktopTimeline.tsx.
 */
export type TimelineVariant = "feed" | "panel";

interface TimelineProps {
  updates: TimelineUpdate[];
  mode: "customer" | "admin";
  /** Estado de la orden — habilita el badge "Listo" en el paso actual (modo cliente). */
  orderStatus?: WorkOrderStatus;
  /** Solo modo cliente. Default `feed`. */
  variant?: TimelineVariant;
  /** Slot opcional para el header del `panel` (cliente): reemplaza el punto
   *  decorativo por el indicador de conexión honesto. Admin no lo usa. */
  liveSlot?: ReactNode;
  /** IDs de hitos recién llegados por el seam (solo cliente): activan la
   *  presencia de evento (Fase 4). Vacío/ausente = sin presencia (carga inicial). */
  arrivedIds?: string[];
}

/** Mapa de clases por variante del modo cliente (misma estructura, distinto estilo). */
const CLASSES = {
  feed: {
    list: "tl",
    row: "tl-row",
    rail: "tl-rail",
    dot: "tl-dot",
    line: "tl-line",
    body: "tl-card",
    top: "tl-card-top",
    title: "tl-title",
    badge: "tl-now-badge",
    date: "tl-date",
    desc: "tl-desc",
    photos: "tl-photos",
    photo: "tl-photo",
    maxPhotos: 3,
  },
  panel: {
    list: "pwtl",
    row: "pwtl-row",
    rail: "pwtl-rail",
    dot: "pwtl-dot",
    line: "pwtl-line",
    body: "pwtl-body",
    top: "pwtl-top",
    title: "pwtl-title",
    badge: "pwtl-now",
    date: "pwtl-date",
    desc: "pwtl-desc",
    photos: "pwtl-photos",
    photo: "pwtl-photo",
    maxPhotos: Infinity,
  },
} as const;

export function Timeline({ updates, mode, orderStatus, variant = "feed", liveSlot, arrivedIds }: TimelineProps) {
  const [lb, setLb] = useState<{ photos: LightboxPhoto[]; index: number }>({
    photos: [],
    index: -1,
  });

  const openPhotos = (u: TimelineUpdate, pi: number) => {
    if (!u.photos?.length) return;
    setLb({
      photos: u.photos.map((p) => ({
        src: p.imageUrl,
        caption: u.title,
        sub: `${fmtDate(u.createdAt)} · ${fmtTime(u.createdAt)}`,
      })),
      index: pi,
    });
  };

  const lightbox = (
    <Lightbox
      photos={lb.photos}
      index={lb.index}
      onClose={() => setLb({ photos: [], index: -1 })}
      onIndexChange={(i) => setLb((s) => ({ ...s, index: i }))}
    />
  );

  if (mode === "customer") {
    const isReady = orderStatus === "LISTO";
    const delivered = orderStatus === "ENTREGADO";
    const visible = updates.filter((u) => u.visibleToCustomer);
    const c = CLASSES[variant];

    const list =
      visible.length === 0 ? (
        <p className={c.desc} style={{ padding: "8px 0" }} data-section="timeline-empty">
          Todavía no hay novedades.
        </p>
      ) : (
        <div className={c.list}>
          {visible.map((u, i) => {
            const ready = isReady && u.isCurrent;
            const arrived = arrivedIds?.includes(u.id);
            // `live`: el paso actual de una orden EN PROCESO late (no en LISTO/ENTREGADO).
            const live = u.isCurrent && orderStatus === "PROCESO";
            return (
              <div
                key={u.id}
                className={c.row + (u.isCurrent ? " current" : "") + (ready ? " ready" : "") + (arrived ? " arrived" : "") + (live ? " live" : "")}
              >
                <div className={c.rail}>
                  <div className={c.dot}><i /></div>
                  <div className={c.line} />
                </div>
                <div className={c.body}>
                  <div className={c.top}>
                    <div className={c.title}>
                      {u.title}
                      {u.isCurrent && (
                        <span
                          className={c.badge}
                          style={
                            ready
                              ? { background: "var(--success)", color: "#06270f" }
                              : delivered
                              ? { background: "var(--surface-2)", color: "var(--muted)" }
                              : undefined
                          }
                        >
                          {ready ? "Listo" : delivered ? "Entregado" : "Ahora"}
                        </span>
                      )}
                    </div>
                    {/* Honestidad de fechas (TI2): única fecha real = ingreso (índice 0,
                        comparten createdAt de creación de la OT). Resto: "Pendiente" si no
                        se alcanzó, nada si se alcanzó sin marca temporal real. Provisorio
                        hasta que exista reachedAt (S3). */}
                    {i === 0 ? (
                      <span className={c.date}>{fmtDate(u.createdAt)} · {fmtTime(u.createdAt)}</span>
                    ) : u.confirmed === false ? (
                      <span className={c.date}>Pendiente</span>
                    ) : null}
                  </div>
                  {u.description && <p className={c.desc}>{u.description}</p>}
                  {u.photos && u.photos.length > 0 && (
                    <div className={c.photos}>
                      {u.photos.slice(0, c.maxPhotos).map((ph, pi) => (
                        <Photo
                          key={ph.id}
                          src={ph.thumbnailUrl || ph.imageUrl}
                          className={c.photo}
                          onClick={() => openPhotos(u, pi)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );

    // panel: tarjeta con encabezado (portado de DesktopTimeline)
    if (variant === "panel") {
      return (
        <>
          <div className="pwtl-card" data-section="timeline">
            <div className="pwtl-head">
              {liveSlot ?? (
                <span className="live" style={{ background: isReady ? "var(--success)" : undefined }} />
              )}
              <h3>Seguimiento del trabajo</h3>
            </div>
            {list}
          </div>
          {lightbox}
        </>
      );
    }

    // feed: sin tarjeta (el encabezado lo pone la página mobile)
    return (
      <>
        {list}
        {lightbox}
      </>
    );
  }

  // modo admin: todos los estados, con visibilidad / notas internas
  return (
    <div className="atl">
      {updates.map((u, i) => {
        const internal = !u.visibleToCustomer;
        return (
          <div
            key={u.id}
            className={"atl-row" + (u.isCurrent ? " current" : "") + (internal ? " internal" : "")}
          >
            <div className="atl-rail">
              <div className="atl-dot"><i /></div>
              <div className="atl-line" />
            </div>
            <div className="atl-body">
              <div className="atl-body-box">
                <div className="atl-top">
                  <div className="atl-title">{u.title}</div>
                  {/* Honestidad de fechas (TI2): solo el ingreso (índice 0) lleva fecha real.
                      Resto: "Pendiente" si no se alcanzó, nada si se alcanzó sin marca real. */}
                  {i === 0 ? (
                    <span className="atl-date">{fmtDate(u.createdAt)} · {fmtTime(u.createdAt)}</span>
                  ) : u.confirmed === false ? (
                    <span className="atl-date">Pendiente</span>
                  ) : null}
                </div>
                <div className="atl-tags">
                  {u.visibleToCustomer ? (
                    <span className="vtag visible"><Icon name="sun" size={11} /> Visible al cliente</span>
                  ) : (
                    <span className="vtag hidden"><Icon name="shield" size={11} /> Solo interno</span>
                  )}
                  {u.notifiedAt && (
                    <span className="vtag notified"><Icon name="bell" size={11} /> Notificado</span>
                  )}
                  {/* A1: atribución visible solo en admin. Ausente → no se renderiza. */}
                  {u.createdBy?.name && (
                    <span className="atl-by"><Icon name="user" size={11} /> {u.createdBy.name}</span>
                  )}
                </div>
                {u.description && <p className="atl-desc">{u.description}</p>}
                {u.internalDescription && (
                  <div className="atl-note">
                    <Icon name="shield" size={15} />
                    <div className="atl-note-txt">
                      <b>Nota interna · solo taller</b>
                      {u.internalDescription}
                    </div>
                  </div>
                )}
                {u.photos && u.photos.length > 0 && (
                  <div className="atl-photos">
                    {u.photos.map((ph, pi) => (
                      <Photo
                        key={ph.id}
                        src={ph.thumbnailUrl || ph.imageUrl}
                        className="atl-photo"
                        onClick={() => openPhotos(u, pi)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {lightbox}
    </div>
  );
}

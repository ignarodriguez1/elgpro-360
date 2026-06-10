"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Photo } from "./Photo";
import { Lightbox, type LightboxPhoto } from "./Lightbox";
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
  createdAt: Date | string;
  createdBy?: { name: string } | null;
  photos?: {
    id: string;
    imageUrl: string;
    thumbnailUrl?: string | null;
    caption?: string | null;
  }[];
}

interface TimelineProps {
  updates: TimelineUpdate[];
  mode: "customer" | "admin";
  /** Estado de la orden — habilita el badge "Listo" en el paso actual (modo cliente). */
  orderStatus?: WorkOrderStatus;
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}
function fmtTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function Timeline({ updates, mode, orderStatus }: TimelineProps) {
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
    const visible = updates.filter((u) => u.visibleToCustomer);
    if (visible.length === 0) {
      return <p className="tl-desc" style={{ padding: "8px 0" }}>Todavía no hay novedades.</p>;
    }
    return (
      <div className="tl">
        {visible.map((u) => {
          const ready = orderStatus === "LISTO" && u.isCurrent;
          return (
            <div
              key={u.id}
              className={"tl-row" + (u.isCurrent ? " current" : "") + (ready ? " ready" : "")}
            >
              <div className="tl-rail">
                <div className="tl-dot"><i /></div>
                <div className="tl-line" />
              </div>
              <div className="tl-card">
                <div className="tl-card-top">
                  <div className="tl-title">
                    {u.title}
                    {u.isCurrent && (
                      <span
                        className="tl-now-badge"
                        style={ready ? { background: "var(--success)", color: "#06270f" } : undefined}
                      >
                        {ready ? "Listo" : "Ahora"}
                      </span>
                    )}
                  </div>
                  <span className="tl-date">{fmtDate(u.createdAt)} · {fmtTime(u.createdAt)}</span>
                </div>
                {u.description && <p className="tl-desc">{u.description}</p>}
                {u.photos && u.photos.length > 0 && (
                  <div className="tl-photos">
                    {u.photos.slice(0, 3).map((ph, pi) => (
                      <Photo
                        key={ph.id}
                        src={ph.thumbnailUrl || ph.imageUrl}
                        className="tl-photo"
                        onClick={() => openPhotos(u, pi)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {lightbox}
      </div>
    );
  }

  // modo admin: todos los estados, con visibilidad / notas internas
  return (
    <div className="atl">
      {updates.map((u) => {
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
                  <span className="atl-date">{fmtDate(u.createdAt)} · {fmtTime(u.createdAt)}</span>
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

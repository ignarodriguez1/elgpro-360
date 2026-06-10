"use client";

import { useState } from "react";
import { Photo } from "@/components/shared/Photo";
import { Lightbox, type LightboxPhoto } from "@/components/shared/Lightbox";
import type { WorkOrderStatus } from "@/generated/prisma/client";

interface PhotoItem {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
}

interface TimelineEntry {
  id: string;
  title: string;
  description?: string | null;
  isCurrent: boolean;
  visibleToCustomer: boolean;
  createdAt: Date | string;
  photos?: PhotoItem[];
}

interface DesktopTimelineProps {
  updates: TimelineEntry[];
  isReady: boolean;
  orderStatus: WorkOrderStatus;
}

function fmtD(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}
function fmtT(d: Date | string) {
  return new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function DesktopTimeline({ updates, isReady, orderStatus }: DesktopTimelineProps) {
  const [lb, setLb] = useState<{ photos: LightboxPhoto[]; index: number }>({
    photos: [],
    index: -1,
  });

  const openPhotos = (entry: TimelineEntry, pi: number) => {
    if (!entry.photos?.length) return;
    setLb({
      photos: entry.photos.map((p) => ({
        src: p.imageUrl,
        caption: entry.title,
        sub: `${fmtD(entry.createdAt)} · ${fmtT(entry.createdAt)}`,
      })),
      index: pi,
    });
  };

  const visible = updates.filter((u) => u.visibleToCustomer);

  return (
    <>
      <div className="pwtl-card" data-section="timeline">
        <div className="pwtl-head">
          <span className="live" style={{ background: isReady ? "var(--success)" : undefined }} />
          <h3>Seguimiento del trabajo</h3>
        </div>
        {visible.length === 0 ? (
          <p className="pwtl-desc" style={{ padding: "8px 0" }} data-section="timeline-empty">Todavía no hay novedades.</p>
        ) : (
        <div className="pwtl">
          {visible.map((e) => {
            const ready = isReady && e.isCurrent;
            return (
              <div
                className={"pwtl-row" + (e.isCurrent ? " current" : "") + (ready ? " ready" : "")}
                key={e.id}
              >
                <div className="pwtl-rail">
                  <div className="pwtl-dot"><i /></div>
                  <div className="pwtl-line" />
                </div>
                <div className="pwtl-body">
                  <div className="pwtl-top">
                    <div className="pwtl-title">
                      {e.title}
                      {e.isCurrent && (
                        <span
                          className="pwtl-now"
                          style={ready ? { background: "var(--success)", color: "#06270f" } : undefined}
                        >
                          {ready ? "Listo" : "Ahora"}
                        </span>
                      )}
                    </div>
                    <span className="pwtl-date">{fmtD(e.createdAt)} · {fmtT(e.createdAt)}</span>
                  </div>
                  {e.description && <p className="pwtl-desc">{e.description}</p>}
                  {e.photos && e.photos.length > 0 && (
                    <div className="pwtl-photos">
                      {e.photos.map((p, pi) => (
                        <Photo
                          key={p.id}
                          src={p.thumbnailUrl || p.imageUrl}
                          className="pwtl-photo"
                          onClick={() => openPhotos(e, pi)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
      <Lightbox
        photos={lb.photos}
        index={lb.index}
        onClose={() => setLb({ photos: [], index: -1 })}
        onIndexChange={(i) => setLb((s) => ({ ...s, index: i }))}
      />
    </>
  );
}

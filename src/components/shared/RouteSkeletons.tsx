import React from "react";

/**
 * Skeletons de ruta para los boundaries `loading.tsx`.
 *
 * Reflejan la FORMA REAL del contenido que viene (no spinners): header, stats,
 * tabla, hero de OT, barra de etapas, timeline, cards de vehículo. Así, al tocar
 * el menú, aparece de inmediato la silueta de lo que se está cargando.
 *
 * Tree-agnósticos a propósito: el admin/portal renderizan árboles duales
 * (.only-desktop/.only-mobile), pero el skeleton va por fuera para verse en los
 * dos. Usan la clase `.sk` (shimmer) de shared.css; respetan prefers-reduced-motion.
 */

function Bar({
  h = 12,
  w = "100%",
  r = 8,
  mb = 0,
}: {
  h?: number;
  w?: number | string;
  r?: number;
  mb?: number;
}) {
  return <div className="sk" style={{ height: h, width: w, borderRadius: r, marginBottom: mb }} />;
}

/** Barra de etapas: nodos + conectores (espejo de la track real de la OT). */
function StageBar() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <React.Fragment key={i}>
          <div className="sk" style={{ width: 26, height: 26, borderRadius: 999, flexShrink: 0 }} />
          {i < 5 && <div className="sk" style={{ flex: 1, height: 3, borderRadius: 999 }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

/** Filas de timeline: nodo + líneas de texto. */
function TimelineRows({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 14 }}>
          <div className="sk" style={{ width: 16, height: 16, borderRadius: 999, flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <Bar h={13} w="42%" mb={8} />
            <Bar h={10} w="88%" mb={6} />
            <Bar h={10} w="64%" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Panel lateral (cliente / vehículo / presupuesto). */
function Panel({ lines = 3 }: { lines?: number }) {
  return (
    <div className="sk-card" style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <Bar h={12} w="40%" mb={4} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <Bar h={11} w="32%" />
          <Bar h={11} w="38%" />
        </div>
      ))}
    </div>
  );
}

const WRAP: React.CSSProperties = {
  maxWidth: 1160,
  margin: "0 auto",
  padding: "clamp(16px, 3vw, 28px)",
};
const HEAD: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 24,
};

/** Dashboard admin (y fallback general del admin): header + stats + tabla. */
export function AdminPageSkeleton() {
  return (
    <div style={WRAP} aria-busy="true" aria-label="Cargando">
      <div style={HEAD}>
        <div style={{ flex: 1 }}>
          <Bar h={26} w={200} mb={10} />
          <Bar h={12} w={130} />
        </div>
        <div className="sk" style={{ height: 40, width: 140, borderRadius: 10 }} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="sk-card" style={{ height: 100 }}>
            <div className="sk" style={{ width: 36, height: 36, borderRadius: 10, marginBottom: 14 }} />
            <Bar h={20} w="40%" mb={8} />
            <Bar h={10} w="70%" />
          </div>
        ))}
      </div>
      <div className="sk-card">
        <Bar h={14} w="25%" mb={16} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Bar key={i} h={44} r={12} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Lista admin (órdenes, clientes, vehículos…): header + chips + filas. */
export function AdminListSkeleton() {
  return (
    <div style={WRAP} aria-busy="true" aria-label="Cargando">
      <div style={HEAD}>
        <div style={{ flex: 1 }}>
          <Bar h={26} w={160} mb={10} />
          <Bar h={12} w={90} />
        </div>
        <div className="sk" style={{ height: 40, width: 140, borderRadius: 10 }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="sk" style={{ height: 30, width: 84, borderRadius: 999 }} />
        ))}
      </div>
      <div className="sk-card">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Bar key={i} h={48} r={12} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Detalle de OT: header + (hero + barra de etapas + timeline) + sidebar. */
export function OrderDetailSkeleton() {
  return (
    <div style={WRAP} aria-busy="true" aria-label="Cargando orden">
      <div style={HEAD}>
        <div style={{ flex: 1 }}>
          <Bar h={12} w={90} mb={12} />
          <Bar h={24} w={240} mb={8} />
          <Bar h={12} w={110} />
        </div>
        <div className="sk" style={{ height: 28, width: 96, borderRadius: 999 }} />
      </div>
      <div className="sk-two-col">
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <div className="sk" style={{ height: 200, borderRadius: 16 }} />
          <div className="sk-card">
            <StageBar />
          </div>
          <div className="sk-card">
            <Bar h={14} w="30%" mb={18} />
            <TimelineRows rows={4} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div className="sk" style={{ height: 52, borderRadius: 12 }} />
          <Panel lines={2} />
          <Panel lines={3} />
        </div>
      </div>
    </div>
  );
}

/** Dashboard del cliente: saludo + grilla de cards de vehículo. */
export function CustomerDashboardSkeleton() {
  return (
    <div style={{ ...WRAP, maxWidth: 980 }} aria-busy="true" aria-label="Cargando">
      <div style={{ marginBottom: 22 }}>
        <Bar h={14} w={60} mb={10} />
        <Bar h={28} w={180} mb={10} />
        <Bar h={12} w={220} />
      </div>
      <Bar h={16} w={140} mb={16} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="sk-card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="sk" style={{ height: 150, borderRadius: 0 }} />
            <div style={{ padding: 16 }}>
              <Bar h={12} w="55%" mb={12} />
              <Bar h={8} r={999} mb={12} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Bar h={10} w="30%" />
                <Bar h={10} w="38%" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Seguimiento del cliente (vehículo / OT): hero + barra de etapas + timeline. */
export function CustomerTrackingSkeleton() {
  return (
    <div style={{ ...WRAP, maxWidth: 980 }} aria-busy="true" aria-label="Cargando">
      <Bar h={12} w={80} mb={16} />
      <div className="sk" style={{ height: 200, borderRadius: 16, marginBottom: 18 }} />
      <div className="sk-card" style={{ marginBottom: 18 }}>
        <StageBar />
      </div>
      <div className="sk-card">
        <Bar h={14} w="35%" mb={18} />
        <TimelineRows rows={4} />
      </div>
    </div>
  );
}

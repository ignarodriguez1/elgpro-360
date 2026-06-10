import Link from "next/link";
import { requireCustomer } from "@/lib/session";
import { listVehiclesByCustomer } from "@/services/vehicle.service";
import { VehicleCard } from "@/components/shared/VehicleCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Photo } from "@/components/shared/Photo";
import { Icon } from "@/components/shared/Icon";
import { STAGE_ORDER, STAGE_LABELS, stageIndex } from "@/lib/stages";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { WorkOrderStatus } from "@/generated/prisma/client";

function fmtEta(d: Date | string | null | undefined) {
  return d ? new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(new Date(d)) : null;
}

/** Color real del auto a partir del nombre (el modelo no guarda hex). Fallback neutro. */
const COLOR_HEX: Record<string, string> = {
  negro: "#1a1a1a", blanco: "#e8e8e8", gris: "#9ca3af", plata: "#c7ccd1", plateado: "#c7ccd1",
  rojo: "#c0392b", azul: "#2563eb", celeste: "#38bdf8", verde: "#16a34a", amarillo: "#eab308",
  naranja: "#ea580c", marron: "#78421f", beige: "#d8c3a5", dorado: "#caa64b", bordo: "#7a1f2b", violeta: "#7c3aed",
};
function colorDot(name?: string | null): string {
  if (!name) return "var(--muted-dim)";
  const key = name.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return COLOR_HEX[key] ?? "var(--muted-dim)";
}

export default async function ClienteDashboardPage() {
  const user = await requireCustomer();
  const vehicles = await listVehiclesByCustomer(user.id, user.id, user.role);
  const activeCount = vehicles.filter((v) => v.workOrders.length > 0).length;
  const first = user.name.split(" ")[0];

  return (
    <>
      {/* MOBILE */}
      <div className="only-mobile p-scroll">
        <div className="p-greet">
          <div className="p-greet-hi">Hola,</div>
          <div className="p-greet-name">{first}</div>
          <div className="p-greet-sub">
            {activeCount > 0
              ? `Tenés ${activeCount} ${activeCount === 1 ? "trabajo" : "trabajos"} en seguimiento.`
              : "No tenés trabajos activos en este momento."}
          </div>
        </div>
        <div className="p-sec-label">
          <h3>Mis vehículos</h3>
          <span className="p-sec-count">{vehicles.length} {vehicles.length === 1 ? "auto" : "autos"}</span>
        </div>
        <div className="p-pad">
          {vehicles.length === 0 ? (
            <EmptyState icon="car" title="Sin vehículos" description="Aún no tenés vehículos registrados en tu cuenta." />
          ) : (
            vehicles.map((v) => {
              const order = v.workOrders[0] ?? null;
              return (
                <VehicleCard
                  key={v.id}
                  href={`/clientes/vehiculos/${v.id}`}
                  patente={v.licensePlate}
                  marca={v.brand}
                  modelo={v.model}
                  color={v.color}
                  anio={v.year}
                  order={order ? { status: order.status, stage: order.stage, eta: fmtEta(order.estimatedDeliveryDate) } : null}
                />
              );
            })
          )}
        </div>
      </div>

      {/* DESKTOP */}
      <div className="only-desktop">
        <div className="pw-wrap">
          <div className="pw-greet pw-rise">
            <div className="pw-greet-hi">Hola,</div>
            <div className="pw-greet-name">{first}</div>
            <div className="pw-greet-sub">
              {activeCount > 0
                ? `Tenés ${activeCount} ${activeCount === 1 ? "trabajo" : "trabajos"} en seguimiento.`
                : "No tenés trabajos activos en este momento."}
            </div>
          </div>
          <div className="pw-sec"><h3>Mis vehículos</h3><span className="pwv-foot-l">{vehicles.length} autos</span></div>
          {vehicles.length === 0 ? (
            <EmptyState icon="car" title="Sin vehículos" description="Aún no tenés vehículos registrados." />
          ) : (
            <div className="pw-veh-grid">
              {vehicles.map((v) => {
                const order = v.workOrders[0] ?? null;
                const listo = order?.status === "LISTO";
                const idx = order ? (listo ? STAGE_ORDER.length : stageIndex(order.stage)) : 0;
                const inner = (
                  <>
                    <div className="pwv-photo-wrap">
                      <Photo className="pwv-photo" tint="rgba(196,30,42,.16)" />
                      <div className="pwv-grad" />
                      <span className="pwv-plate">{v.licensePlate}</span>
                      {order && (
                        <span className="pwv-status">
                          <StatusBadge status={order.status as WorkOrderStatus} />
                        </span>
                      )}
                      <div className="pwv-head">
                        <div className="pwv-name">{v.brand} {v.model}</div>
                        <div className="pwv-meta">
                          {v.color && <span className="pwv-dot" style={{ background: colorDot(v.color) }} />}
                          <span className="pwv-meta-t">{[v.color, v.year].filter(Boolean).join(" · ")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pwv-body">
                      {order ? (
                        <>
                          <div className="pwv-prog-top">
                            <span className={"pwv-stage" + (listo ? " listo" : "")}>
                              <Icon name={listo ? "check" : "spray"} size={16} />
                              {listo ? "Trabajo finalizado" : STAGE_LABELS[order.stage]}
                            </span>
                            <span className="pwv-eta">{fmtEta(order.estimatedDeliveryDate)}</span>
                          </div>
                          <div className="pwv-bar">
                            {STAGE_ORDER.map((s, si) => (
                              <span key={s} className={"pwv-seg" + (si < idx ? " done" : "") + (si === idx && !listo ? " cur" : "")} />
                            ))}
                          </div>
                          <div className="pwv-foot">
                            <span className="pwv-foot-l">Etapa {Math.min(stageIndex(order.stage) + 1, STAGE_ORDER.length)} de {STAGE_ORDER.length}</span>
                            <span className="pw-btn pw-btn-ghost pw-btn-sm">Ver seguimiento <Icon name="arrow" size={15} /></span>
                          </div>
                        </>
                      ) : (
                        <div className="pwv-idle">
                          <span className="pwv-idle-ic"><Icon name="check" size={20} /></span>
                          <div><div className="pwv-idle-t">Sin trabajos en curso</div><div className="pwv-idle-d">Mirá su historial de trabajos anteriores.</div></div>
                        </div>
                      )}
                    </div>
                  </>
                );
                return order ? (
                  <Link key={v.id} href={`/clientes/vehiculos/${v.id}`} className="pwv active" style={{ display: "block" }}>{inner}</Link>
                ) : (
                  <div key={v.id} className="pwv">{inner}</div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getWorkOrderById } from "@/services/work-order.service";
import { projectUpdateForCustomer } from "@/lib/order-live";

/**
 * Snapshot proyectado de una OT para reconciliar tras una reconexión WS.
 * Misma forma que la semilla SSR: orden + updates SIN createdBy ni internos.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "sin sesión" }, { status: 401 });

  const { orderId } = await params;

  let order;
  try {
    order = await getWorkOrderById(orderId, user.id, user.role);
  } catch {
    return NextResponse.json({ error: "sin acceso" }, { status: 403 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      stage: order.stage,
      title: order.title,
    },
    updates: order.statusUpdates.map(projectUpdateForCustomer),
  });
}

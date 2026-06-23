import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getCurrentUser } from "@/lib/session";
import { getWorkOrderById } from "@/services/work-order.service";

/**
 * Emite un ticket de corta vida (60s) para conectar al servidor WS.
 * Valida que haya sesión y que el cliente sea DUEÑO de la OT
 * (`getWorkOrderById` tira si no le pertenece).
 *
 * Formato del ticket:  base64url(`{orderId}.{userId}.{exp}`).hmacSha256
 * El servidor WS (proceso aparte) lo verifica con el mismo AUTH_SECRET,
 * chequea `exp`, y que `orderId` coincida con el canal pedido.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "sin sesión" }, { status: 401 });

  const orderId = req.nextUrl.searchParams.get("order");
  if (!orderId) {
    return NextResponse.json({ error: "order requerido" }, { status: 400 });
  }

  try {
    await getWorkOrderById(orderId, user.id, user.role); // valida propiedad
  } catch {
    return NextResponse.json({ error: "sin acceso a esta orden" }, { status: 403 });
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "AUTH_SECRET no configurado" }, { status: 500 });
  }

  const exp = Date.now() + 60_000;
  const payload = `${orderId}.${user.id}.${exp}`;
  const body = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");

  return NextResponse.json({ ticket: `${body}.${sig}`, exp });
}

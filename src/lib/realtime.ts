import Redis from "ioredis";
import { prisma } from "@/lib/prisma";
import { projectUpdateForCustomer } from "@/lib/order-live";

/* ============================================================
   Publicación de eventos del portal vivo a Redis.

   La app Next (Vercel) publica; el servidor WS aparte se suscribe
   a `order:{id}` y reenvía a los browsers. Ver docs/portal-live-seam.md.

   Estrategia: publicar un SNAPSHOT proyectado tras cada mutación
   relevante. Simple y a prueba de balas — el cliente siempre recibe
   la verdad completa (idempotente; la presencia de Fase 4 se dispara
   sola al detectar el hito nuevo en el snapshot).

   DORMIDO sin `REDIS_URL` (no-op). Best-effort: publicar NUNCA debe
   romper la mutación del usuario.
   ============================================================ */

let client: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
    });
    client.on("error", (e) => console.error("[realtime] redis error:", e.message));
  }
  return client;
}

/** Publica el snapshot proyectado (sin createdBy/internos) de una OT. */
export async function publishOrderSnapshot(orderId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return; // sin REDIS_URL → no-op (dev/local sin transporte)

  try {
    const order = await prisma.workOrder.findUnique({
      where: { id: orderId },
      include: {
        statusUpdates: {
          orderBy: { sortOrder: "asc" },
          include: { photos: true },
        },
      },
    });
    if (!order) return;

    const event = {
      type: "snapshot" as const,
      order: {
        id: order.id,
        status: order.status,
        stage: order.stage,
        title: order.title,
      },
      updates: order.statusUpdates
        .filter((u) => u.visibleToCustomer)
        .map(projectUpdateForCustomer),
    };

    await redis.publish(`order:${orderId}`, JSON.stringify(event));
  } catch (e) {
    // Best-effort: la mutación ya sucedió; publicar no la puede tumbar.
    console.error("[realtime] publishOrderSnapshot falló:", e);
  }
}

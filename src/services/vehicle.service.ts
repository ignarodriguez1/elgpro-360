import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/client";
import { logAudit, type AuditActor } from "./audit.service";

function isKnownError(e: unknown, code: string): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === code;
}

export async function createVehicle(
  data: {
    customerId: string;
    licensePlate: string;
    brand: string;
    model: string;
    year?: number;
    color?: string;
    vin?: string;
    notes?: string;
  },
  actor?: AuditActor
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.create({
        data,
        include: { customer: { include: { user: true } } },
      });
      if (actor) {
        await logAudit(
          {
            actor,
            action: "VEHICLE_CREATED",
            entity: "Vehicle",
            entityId: vehicle.id,
            summary: `Vehículo creado: ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
          },
          tx
        );
      }
      return vehicle;
    });
  } catch (e) {
    // P2002 = violación de unique ([customerId, licensePlate]).
    if (isKnownError(e, "P2002")) {
      throw new Error("Ya existe un vehículo con esa patente para este cliente.");
    }
    throw e;
  }
}

export async function getVehicleById(
  vehicleId: string,
  requestingUserId: string,
  requestingRole: Role
) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      customer: { include: { user: true } },
      workOrders: {
        orderBy: { createdAt: "desc" },
        include: {
          statusUpdates: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!vehicle) throw new Error("Vehículo no encontrado");

  if (
    requestingRole === "CUSTOMER" &&
    vehicle.customer.userId !== requestingUserId
  ) {
    throw new Error("Sin permisos para ver este vehículo");
  }

  return vehicle;
}

export async function listVehiclesByCustomer(
  customerUserId: string,
  requestingUserId: string,
  requestingRole: Role
) {
  if (requestingRole === "CUSTOMER" && requestingUserId !== customerUserId) {
    throw new Error("Sin permisos");
  }

  return prisma.vehicle.findMany({
    where: {
      customer: { userId: customerUserId },
    },
    include: {
      workOrders: {
        where: { status: { in: ["PROCESO", "LISTO"] } },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateVehicle(
  vehicleId: string,
  data: {
    licensePlate?: string;
    brand?: string;
    model?: string;
    year?: number;
    color?: string;
    vin?: string;
    notes?: string;
  },
  actor?: AuditActor
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.update({
        where: { id: vehicleId },
        data,
        include: { customer: { include: { user: true } } },
      });
      if (actor) {
        await logAudit(
          {
            actor,
            action: "VEHICLE_UPDATED",
            entity: "Vehicle",
            entityId: vehicleId,
            summary: `Vehículo actualizado: ${vehicle.licensePlate}`,
            diff: { after: data },
          },
          tx
        );
      }
      return vehicle;
    });
  } catch (e) {
    if (isKnownError(e, "P2002")) {
      throw new Error("Ya existe un vehículo con esa patente para este cliente.");
    }
    throw e;
  }
}

export async function deleteVehicle(vehicleId: string, actor?: AuditActor) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { workOrders: { select: { id: true, status: true } } },
  });

  if (!vehicle) throw new Error("Vehículo no encontrado");

  // No se borra un vehículo con CUALQUIER orden (activa o histórica): el FK es
  // RESTRICT y, además, la "historia clínica" del auto debe preservarse.
  if (vehicle.workOrders.length > 0) {
    const activas = vehicle.workOrders.filter(
      (o) => o.status === "PROCESO" || o.status === "LISTO"
    ).length;
    throw new Error(
      activas > 0
        ? "No se puede eliminar un vehículo con órdenes activas."
        : "No se puede eliminar un vehículo con historial de órdenes (se preserva la historia del auto)."
    );
  }

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const d = await tx.vehicle.delete({ where: { id: vehicleId } });
      if (actor) {
        await logAudit(
          {
            actor,
            action: "VEHICLE_DELETED",
            entity: "Vehicle",
            entityId: vehicleId,
            summary: `Vehículo eliminado: ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
          },
          tx
        );
      }
      return d;
    });
    return deleted;
  } catch (e) {
    // P2003 = violación de FK (RESTRICT). Defensa por si quedó alguna referencia.
    if (isKnownError(e, "P2003")) {
      throw new Error("No se puede eliminar el vehículo: tiene registros asociados.");
    }
    throw e;
  }
}

export async function listAllVehicles(search?: string) {
  return prisma.vehicle.findMany({
    where: search
      ? {
          OR: [
            { licensePlate: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
            { model: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      customer: { include: { user: true } },
      workOrders: { where: { status: { in: ["PROCESO", "LISTO"] } }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
}

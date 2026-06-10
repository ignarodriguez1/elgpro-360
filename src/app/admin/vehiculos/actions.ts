"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/services/vehicle.service";
import { vehicleSchema, updateVehicleSchema } from "@/lib/validations";
import { type ActionResult, toActionError } from "@/lib/action-result";
import type { AuditActor } from "@/services/audit.service";

async function getActor(): Promise<AuditActor | null> {
  const session = await auth();
  const user = session?.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) return null;
  return { id: user.id, email: user.email };
}

export async function createVehicleAction(
  customerProfileId: string,
  data: {
    licensePlate: string;
    brand: string;
    model: string;
    year?: number;
    color?: string;
    vin?: string;
    notes?: string;
  }
): Promise<ActionResult<{ id: string }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sin permisos" };

  const parsed = vehicleSchema.omit({ customerId: true }).safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    const vehicle = await createVehicle(
      { customerId: customerProfileId, ...parsed.data },
      actor
    );
    revalidatePath(`/admin/clientes`);
    return { ok: true, data: { id: vehicle.id } };
  } catch (err) {
    return toActionError(err, "No se pudo crear el vehículo");
  }
}

export async function updateVehicleAction(
  vehicleId: string,
  data: {
    licensePlate?: string;
    brand?: string;
    model?: string;
    year?: number;
    color?: string;
    vin?: string;
    notes?: string;
  }
): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sin permisos" };

  const parsed = updateVehicleSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await updateVehicle(vehicleId, parsed.data, actor);
    revalidatePath(`/admin/vehiculos/${vehicleId}`);
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo actualizar el vehículo");
  }
}

export async function deleteVehicleAction(vehicleId: string): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sin permisos" };

  try {
    await deleteVehicle(vehicleId, actor);
    revalidatePath(`/admin/vehiculos`);
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo eliminar el vehículo");
  }
}

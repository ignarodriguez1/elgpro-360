"use server";

import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { createCustomer, updateCustomer } from "@/services/customer.service";
import { createCustomerSchema, updateCustomerSchema } from "@/lib/validations";
import { type ActionResult, toActionError } from "@/lib/action-result";
import type { AuditActor } from "@/services/audit.service";

async function getActor(): Promise<AuditActor | null> {
  // getCurrentUser revalida `active`: un usuario desactivado no opera, aunque su
  // JWT siga vigente.
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) return null;
  return { id: user.id, email: user.email };
}

export async function createCustomerAction(data: {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sin permisos" };

  const parsed = createCustomerSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    // Passwordless: se crea el cliente sin credencial. Entra al portal pidiendo
    // un código con su email — no hay invite ni link de activación que enviar.
    await createCustomer(parsed.data, actor);
    revalidatePath("/admin/clientes");
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo crear el cliente");
  }
}

export async function updateCustomerAction(
  customerId: string,
  data: { name?: string; phone?: string; notes?: string }
): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sin permisos" };

  const parsed = updateCustomerSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await updateCustomer(customerId, parsed.data, actor);
    revalidatePath(`/admin/clientes/${customerId}`);
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo actualizar el cliente");
  }
}

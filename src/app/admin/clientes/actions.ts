"use server";

import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { createCustomer, updateCustomer } from "@/services/customer.service";
import { sendAccountWelcomeEmail } from "@/lib/email";
import { currentOrigin } from "@/lib/origin";
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
}): Promise<ActionResult<{ emailSent: boolean }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sin permisos" };

  const parsed = createCustomerSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    // Passwordless: se crea el cliente sin credencial. Entra al portal pidiendo
    // un código con su email — no hay invite ni set-password.
    const user = await createCustomer(parsed.data, actor);

    // Email de bienvenida/activación: best-effort y honesto (igual que en equipo).
    let emailSent = false;
    try {
      await sendAccountWelcomeEmail({
        to: user.email,
        name: user.name,
        intro:
          "Te damos acceso al portal de clientes de ELG Pro 360, donde vas a poder seguir el estado de tu vehículo en tiempo real.",
        loginUrl: `${await currentOrigin()}/clientes/login`,
      });
      emailSent = true;
    } catch (err) {
      console.error(
        "[clientes] email de bienvenida falló:",
        err instanceof Error ? err.message : err
      );
    }

    revalidatePath("/admin/clientes");
    return { ok: true, data: { emailSent } };
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

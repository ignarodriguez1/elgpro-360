"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createCustomer, updateCustomer } from "@/services/customer.service";
import { sendInviteEmail } from "@/lib/email";
import { createCustomerSchema, updateCustomerSchema } from "@/lib/validations";
import { type ActionResult, toActionError } from "@/lib/action-result";
import type { AuditActor } from "@/services/audit.service";

async function getActor(): Promise<AuditActor | null> {
  const session = await auth();
  const user = session?.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) return null;
  return { id: user.id, email: user.email };
}

/** Construye el origin actual a partir de los headers de la request. */
async function currentOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function createCustomerAction(data: {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}): Promise<ActionResult<{ inviteUrl: string; emailSent: boolean }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sin permisos" };

  const parsed = createCustomerSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    const { user, inviteToken } = await createCustomer(parsed.data, actor);
    const inviteUrl = `${await currentOrigin()}/clientes/activar?token=${inviteToken}`;

    // Envío del invite: best-effort. Si Resend no está configurado, el admin
    // comparte el inviteUrl manualmente (se devuelve en data).
    let emailSent = false;
    try {
      await sendInviteEmail({ to: user.email, customerName: user.name, inviteUrl });
      emailSent = true;
    } catch {
      // Email no crítico: el inviteUrl sirve como fallback.
    }

    revalidatePath("/admin/clientes");
    return { ok: true, data: { inviteUrl, emailSent } };
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

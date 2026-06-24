"use server";

import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { createTeamUser, setUserActive } from "@/services/user.service";
import { createTeamUserSchema } from "@/lib/validations";
import { type ActionResult, toActionError } from "@/lib/action-result";
import type { AuditActor } from "@/services/audit.service";

/**
 * Gate de permisos: solo el ADMIN (dueño) da de alta/edita usuarios del equipo.
 * Un STAFF haciéndolo sería escalada de privilegios. La protección de la página
 * la hace requireOwner(); acá se re-verifica a nivel action (defensa en
 * profundidad). getCurrentUser revalida `active`: un admin desactivado no opera.
 */
async function getOwnerActor(): Promise<AuditActor | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return { id: user.id, email: user.email };
}

export async function createTeamUserAction(data: {
  name: string;
  email: string;
  role: "STAFF" | "ADMIN";
}): Promise<ActionResult> {
  const actor = await getOwnerActor();
  if (!actor) return { ok: false, error: "Sin permisos" };

  const parsed = createTeamUserSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    // Passwordless: el usuario entra al panel pidiendo un código con su email.
    await createTeamUser(parsed.data, actor);
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo crear el usuario");
  }
}

/**
 * Activa/desactiva una cuenta (equipo o cliente). Solo ADMIN. Guarda
 * anti-autobloqueo: nadie puede desactivar su propia cuenta — así el admin que
 * actúa siempre queda activo y no hay forma de dejar el sistema sin admins.
 */
export async function setUserActiveAction(
  userId: string,
  active: boolean
): Promise<ActionResult> {
  const actor = await getOwnerActor();
  if (!actor) return { ok: false, error: "Sin permisos" };
  if (userId === actor.id && !active) {
    return { ok: false, error: "No podés desactivar tu propia cuenta." };
  }

  try {
    await setUserActive(userId, active, actor);
    revalidatePath("/admin/usuarios");
    revalidatePath("/admin/clientes");
    revalidatePath(`/admin/clientes/${userId}`);
    return { ok: true };
  } catch (err) {
    return toActionError(err, "No se pudo cambiar el estado de la cuenta");
  }
}

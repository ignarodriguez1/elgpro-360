import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/types";

export async function getCurrentUser() {
  const session = await auth();
  const user = session?.user;
  if (!user) return null;
  // Revalidación de estado contra la DB: un usuario desactivado pierde acceso
  // aunque su JWT siga vigente (la sesión dura 60 días). Lookup por PK indexada
  // → costo despreciable. Esto es lo que le da a "desactivar" efecto REAL sobre
  // las sesiones activas, no solo sobre los logins nuevos.
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { active: true },
  });
  if (!fresh || !fresh.active) return null;
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/clientes/login");
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    if (roles.includes("ADMIN") || roles.includes("STAFF")) {
      redirect("/admin/login");
    }
    redirect("/clientes/login");
  }
  return user;
}

export async function requireAdmin() {
  return requireRole("ADMIN", "STAFF");
}

/**
 * Solo el dueño (ADMIN). Un operario (STAFF) autenticado que intente entrar a
 * una pantalla restringida (Auditoría, Servicios, Tutoriales) se redirige al
 * panel — no a login (evita loop y mensaje confuso).
 */
export async function requireOwner() {
  const user = await requireAdmin();
  if (user.role !== "ADMIN") redirect("/admin");
  return user;
}

export async function requireCustomer() {
  return requireRole("CUSTOMER", "ADMIN");
}

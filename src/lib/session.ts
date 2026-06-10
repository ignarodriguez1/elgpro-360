import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/types";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
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

export async function requireCustomer() {
  return requireRole("CUSTOMER", "ADMIN");
}

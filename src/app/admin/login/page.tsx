import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminLoginForm } from "./AdminLoginForm";

export default async function AdminLoginPage() {
  const session = await auth();

  // Ya logueado como admin/staff → al panel directo (no tiene sentido ver el login).
  // Redirect terminal a una ruta que este rol SÍ puede ver → no hay loop 307.
  if (session?.user && (session.user.role === "ADMIN" || session.user.role === "STAFF")) {
    redirect("/admin");
  }

  // Un CUSTOMER logueado lo intercepta el admin/layout con el SessionNotice (Regla 2).
  // Sin sesión → formulario de ingreso.
  return <AdminLoginForm />;
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ClienteLoginForm } from "./ClienteLoginForm";

export default async function ClienteLoginPage() {
  const session = await auth();

  // Cliente ya logueado → a su portal directo (no tiene sentido ver el login).
  // Redirect terminal a una ruta que este rol SÍ puede ver → no hay loop 307.
  if (session?.user?.role === "CUSTOMER") {
    redirect("/clientes/dashboard");
  }

  // Un admin/staff logueado lo intercepta el clientes/layout con el SessionNotice (Regla 1).
  // Sin sesión → formulario de ingreso.
  return <ClienteLoginForm />;
}

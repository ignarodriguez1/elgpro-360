import { auth } from "@/lib/auth";
import { BottomNav } from "@/components/customer/BottomNav";
import { PwNav } from "@/components/customer/PwNav";
import { SessionNotice } from "@/components/shared/SessionNotice";
import "./portal.css";
import "./portal-web.css";

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Sin sesión (login / activar): la pantalla maneja su propio dual full-screen.
  // No llamamos requireX aquí a propósito → evita el loop de redirect 307.
  if (!session?.user) {
    return <>{children}</>;
  }

  const { name, email, role } = session.user;

  // Regla 1: admin/staff cayendo en la zona de clientes (vista o login).
  // Nunca un estado mudo: mostramos el aviso con salidas claras.
  if (role !== "CUSTOMER") {
    return (
      <SessionNotice
        variant="admin-on-customer"
        name={name}
        email={email}
        role={role}
      />
    );
  }

  // Cliente: portal normal. Dual navbar desktop (pw-nav) + bottom nav mobile.
  return (
    <>
      <div className="only-desktop">
        <PwNav name={name ?? "Cliente"} email={email} />
      </div>
      {children}
      <div className="only-mobile">
        <BottomNav />
      </div>
    </>
  );
}

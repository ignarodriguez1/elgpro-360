import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { SessionNotice } from "@/components/shared/SessionNotice";
import "./admin.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Sin sesión admin → el login maneja su propio UI. No llamamos requireX aquí
  // a propósito → evita el loop de redirect 307. La protección real la hace
  // requireAdmin() en cada page.tsx.
  if (!session?.user) {
    return <>{children}</>;
  }

  const { name, email, role } = session.user;

  // Regla 2: cliente cayendo en la zona/login de admin → aviso, nunca mudo.
  if (role !== "ADMIN" && role !== "STAFF") {
    return (
      <SessionNotice
        variant="customer-on-admin"
        name={name}
        email={email}
        role={role}
      />
    );
  }

  return (
    <AdminShell
      user={{
        name: name ?? null,
        email: email ?? null,
        role,
      }}
    >
      {children}
    </AdminShell>
  );
}

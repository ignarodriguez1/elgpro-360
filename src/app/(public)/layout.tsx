import { auth } from "@/lib/auth";
import { PublicChrome } from "@/components/public/PublicChrome";
import { MobileChrome } from "@/components/public/MobileChrome";
import { Footer } from "@/components/public/Footer";
import { MobileFooter } from "@/components/public/MobileFooter";
import "./public.css";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // El sitio público es accesible para todos. Si hay sesión, el chrome muestra
  // quién está conectado y permite volver a su área (Regla 3). No bloquea nada.
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        role: session.user.role,
      }
    : null;

  return (
    <div className="dweb">
      <div className="only-desktop"><PublicChrome user={user} /></div>
      <div className="only-mobile"><MobileChrome user={user} /></div>
      <main>{children}</main>
      <div className="only-desktop"><Footer /></div>
      <div className="only-mobile"><MobileFooter /></div>
    </div>
  );
}

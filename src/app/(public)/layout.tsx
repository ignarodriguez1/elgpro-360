import { auth } from "@/lib/auth";
import { PublicChrome } from "@/components/public/PublicChrome";
import { MobileChrome } from "@/components/public/MobileChrome";
import { Footer } from "@/components/public/Footer";
import { MobileFooter } from "@/components/public/MobileFooter";
import { RevealRoot } from "@/components/public/RevealRoot";
import { INTRO_PRE_SCRIPT } from "@/components/public/intro-preload";
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
      {/* Pre-script bloqueante de la intro: corre en el parse (antes de hidratar y
          de pintar el overlay) para decidir si saltearla sin flash. Va en este
          Server Component a propósito — un <script> renderizado dentro del client
          <Intro> no lo ejecuta React. Contrato en intro-preload.ts. */}
      <script dangerouslySetInnerHTML={{ __html: INTRO_PRE_SCRIPT }} />
      {/* El chrome NO va envuelto en .only-*: un wrapper con la altura exacta del
          header confina el `position:sticky` y le deja travel CERO — el header se
          iba con el scroll y no volvía nunca. Cada chrome se gatea por media query
          sobre .dnav/.navbar (ver public.css), así el containing block es .dweb. */}
      <PublicChrome user={user} />
      <MobileChrome user={user} />
      <RevealRoot>
        <main>{children}</main>
        <div className="only-desktop"><Footer /></div>
        <div className="only-mobile"><MobileFooter /></div>
      </RevealRoot>
    </div>
  );
}

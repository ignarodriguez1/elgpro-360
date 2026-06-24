import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import authConfig from "@/lib/auth.config";
import { verifyLoginCode } from "@/services/login-code.service";

// ~60 días (decisión cerrada): el uso frecuente casi no re-autentica.
const SESSION_MAX_AGE = 60 * 24 * 60 * 60;

/**
 * Errores de login con `code` propagable al cliente. `signIn` (react) con
 * `redirect:false` devuelve `{ error, code }`, leído del query de la URL — así la
 * UI puede mostrar estados honestos (expirado / bloqueado / intentos restantes)
 * sin filtrar nada sensible.
 */
class InvalidCodeError extends CredentialsSignin {
  code = "invalid";
}
class ExpiredCodeError extends CredentialsSignin {
  code = "expired";
}
class LockedCodeError extends CredentialsSignin {
  code = "locked";
}
class InactiveError extends CredentialsSignin {
  code = "inactive";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  jwt: { maxAge: SESSION_MAX_AGE },
  providers: [
    Credentials({
      // Passwordless: el "credential" es el código OTP, no una contraseña.
      name: "otp",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Código", type: "text" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const code = (credentials?.code as string | undefined)?.trim();
        if (!email || !code) throw new InvalidCodeError();

        const result = await verifyLoginCode(email, code);
        if (!result.ok) {
          if (result.reason === "expired") throw new ExpiredCodeError();
          if (result.reason === "too_many_attempts") throw new LockedCodeError();
          // mismatch / no_code → genérico; adjuntamos intentos restantes si hay.
          const err = new InvalidCodeError();
          if (typeof result.remainingAttempts === "number") {
            err.code = `invalid:${result.remainingAttempts}`;
          }
          throw err;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        // Código válido pero sin cuenta: no debería pasar (solo se emiten códigos
        // a usuarios existentes), pero nunca creamos sesión sin User.
        if (!user) throw new InvalidCodeError();

        // req. 7: cuenta desactivada → no se permite el login (también se bloquea
        // en el pedido del código). Quien llega acá ya probó posesión del email.
        if (!user.active) throw new InactiveError();

        // Passwordless: verificar el código ES verificar el email.
        if (!user.emailVerified) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        }

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});

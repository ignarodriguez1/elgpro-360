import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/types";

/**
 * Config edge-safe de Auth.js: NO importa Prisma ni bcrypt, asi puede correr
 * en el Edge Runtime (lo usa el proxy/middleware para leer el JWT). El provider
 * Credentials con el authorize que toca la DB vive en auth.ts (Node runtime).
 */
export default {
  pages: {
    signIn: "/clientes/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

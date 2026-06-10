import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/lib/auth.config";

// Instancia edge-safe: solo lee/verifica el JWT, no toca la DB.
const { auth } = NextAuth(authConfig);

const publicPaths = [
  "/",
  "/servicios",
  "/trabajos",
  "/tutoriales",
  "/contacto",
  "/clientes/login",
  "/clientes/activar",
  "/admin/login",
  "/api/auth",
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (
    isPublicPath(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const user = req.auth?.user;

  if (pathname.startsWith("/admin")) {
    if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  if (pathname.startsWith("/clientes")) {
    if (!user) {
      return NextResponse.redirect(new URL("/clientes/login", req.url));
    }
    if (user.role !== "CUSTOMER" && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/clientes/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

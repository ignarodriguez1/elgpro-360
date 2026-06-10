import type { Metadata } from "next";
import { Oswald, DM_Sans, DM_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import "@/components/shared/shared.css";
import "@/components/shared/session.css";

// Cuerpo de texto
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Títulos, etiquetas, botones (condensada, mayúsculas)
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// Patentes, fechas, códigos de orden, datos técnicos
const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "ELG Pro 360 — Paint & Detail",
  description:
    "La historia clínica de tu auto + seguimiento en tiempo real del trabajo en taller.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${dmSans.variable} ${oswald.variable} ${dmMono.variable} dark`}
      // Herramientas de acceso remoto / extensiones inyectan atributos en <html>
      // (p. ej. __gcrremoteframetoken) antes de la hidratación. Esto silencia ese
      // mismatch SOLO en este nodo; no oculta mismatches reales en los hijos.
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}

import type { NextConfig } from "next";

// Headers de seguridad para todas las rutas. Valores según la guía oficial de
// Next 16 (node_modules/next/dist/docs/.../next-config-js/headers.md).
const securityHeaders = [
  // Forzar HTTPS por 2 años. El navegador lo ignora en http://localhost (dev).
  // "preload" queda opt-in (semi-irreversible): agregalo cuando confirmes que
  // todo el dominio + subdominios van por HTTPS de forma permanente.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  // No adivinar el Content-Type (anti MIME-sniffing).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Cuánto referrer se filtra al navegar a otro origen.
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  // Anti-clickjacking: no permitir embeber el sitio en un iframe ajeno.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Apagar APIs del browser que la app NO usa. OJO: camera NO se apaga — el
  // UploadZone usa <input capture="environment"> para sacar fotos en el taller.
  { key: "Permissions-Policy", value: "microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Permite acceder al dev server desde otros dispositivos de la red local
  // (teléfono, otra compu) sin que Next bloquee los recursos /_next/* por
  // cross-origin. SOLO afecta a `next dev`; en producción no aplica.
  // Si tu IP de red cambia (DHCP), actualizá este valor.
  allowedDevOrigins: ["192.168.100.39"],

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

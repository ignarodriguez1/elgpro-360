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
  //
  // "*.*.*.*" = cualquier IPv4, así el DHCP no vuelve a romper esto.
  // OJO: un "*" pelado NO funciona. Next rechaza a propósito los patrones de un
  // solo segmento (matchWildcardDomain, en next/dist/server/app-render/
  // csrf-protection.js). El match es por segmentos separados por "."; una IP
  // tiene cuatro, de ahí los cuatro comodines.
  allowedDevOrigins: ["*.*.*.*"],

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

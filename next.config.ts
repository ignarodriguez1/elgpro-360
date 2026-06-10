import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite acceder al dev server desde otros dispositivos de la red local
  // (teléfono, otra compu) sin que Next bloquee los recursos /_next/* por
  // cross-origin. SOLO afecta a `next dev`; en producción no aplica.
  // Si tu IP de red cambia (DHCP), actualizá este valor.
  allowedDevOrigins: ["192.168.100.39"],
};

export default nextConfig;

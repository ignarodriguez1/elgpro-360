// Contenido estático de la web pública (marketing), portado del prototipo (data.jsx).
import type { IconName } from "@/components/shared/Icon";

const U = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const HERO_IMG = U("1605559424843-9e4c228bf1c2", 1200);

export interface ServiceItem {
  icon: IconName;
  name: string;
  desc: string;
  tint: string;
  img: string;
}

export const SERVICES: ServiceItem[] = [
  { icon: "spray", name: "Pintura completa", desc: "Repintado integral en cabina presurizada con color exacto y acabado de fábrica.", tint: "rgba(196,30,42,.20)", img: U("1486006920555-c77dcf18193c") },
  { icon: "droplet", name: "Pintura parcial", desc: "Paneles, retoques y empalmes invisibles. Igualación de color computarizada.", tint: "rgba(196,30,42,.16)", img: U("1487754180451-c456f719a1fc") },
  { icon: "wrench", name: "Chapería", desc: "Enderezado, reparación de abolladuras y reconstrucción estructural.", tint: "rgba(245,158,11,.16)", img: U("1632823471565-1ecdf5c6da77") },
  { icon: "sparkle", name: "Pulido y corrección", desc: "Corrección de pintura multietapa para remover rayones y devolver el brillo.", tint: "rgba(255,255,255,.10)", img: U("1607603750909-408e193868c7") },
  { icon: "shield", name: "Ceramic Coating", desc: "Recubrimiento cerámico de larga duración. Hidrofobia y protección UV.", tint: "rgba(34,197,94,.14)", img: U("1619642751034-765dfdf7c58e") },
  { icon: "film", name: "PPF · Paint Protection", desc: "Film de protección transparente contra piedras, rayones y agresiones.", tint: "rgba(80,140,255,.14)", img: U("1542362567-b07e54358753") },
  { icon: "seat", name: "Detail interior", desc: "Limpieza profunda, hidratación de cuero y descontaminación de tapizados.", tint: "rgba(196,30,42,.14)", img: U("1503376780353-7e6692767b70") },
  { icon: "sun", name: "Detail exterior", desc: "Descontaminación, sellado y acabado espejo en cada superficie.", tint: "rgba(245,158,11,.14)", img: U("1552519507-da3b142c6e3d") },
  { icon: "layers", name: "Restauración", desc: "Recuperación de clásicos y vehículos de colección, fiel al original.", tint: "rgba(255,255,255,.10)", img: U("1492144534655-ae79c964c9d7") },
  { icon: "star2", name: "Trabajos personalizados", desc: "Wraps, llantas, detalles a medida y proyectos únicos.", tint: "rgba(196,30,42,.18)", img: U("1494976388531-d1058494cdd8") },
];

export const FEATURED: ServiceItem[] = [SERVICES[0], SERVICES[4], SERVICES[5], SERVICES[7]];

export interface ProcessStep { n: string; icon: IconName; title: string; desc: string; }
export const PROCESS: ProcessStep[] = [
  { n: "01", icon: "arrow", title: "Ingreso", desc: "Recibimos tu auto, documentamos su estado con fotos y armamos su historia clínica." },
  { n: "02", icon: "spray", title: "Proceso", desc: "Cada etapa del trabajo queda registrada con fotos y notas del taller." },
  { n: "03", icon: "check", title: "Entrega", desc: "Control de calidad final y entrega con el resultado documentado." },
  { n: "04", icon: "clock", title: "Seguimiento", desc: "Seguís el avance en tiempo real desde tu celular, cuando quieras." },
];

export const WORK_CATS = ["Todos", "Pintura", "Detail", "Restauración", "Personalizado"] as const;
export interface WorkItem { cat: string; title: string; tint: string; img: string; tall?: boolean; }
export const WORKS: WorkItem[] = [
  { cat: "Pintura", title: "Audi A3 — Repintado integral", tint: "rgba(196,30,42,.22)", img: U("1486006920555-c77dcf18193c"), tall: true },
  { cat: "Detail", title: "BMW Serie 3 — Ceramic + corrección", tint: "rgba(34,197,94,.16)", img: U("1552519507-da3b142c6e3d") },
  { cat: "Restauración", title: "Ford Mustang 68 — Restauración", tint: "rgba(245,158,11,.18)", img: U("1494976388531-d1058494cdd8") },
  { cat: "Personalizado", title: "VW Golf GTI — Wrap mate", tint: "rgba(80,140,255,.16)", img: U("1503376780353-7e6692767b70"), tall: true },
  { cat: "Detail", title: "Mercedes C200 — Detail full", tint: "rgba(196,30,42,.14)", img: U("1542362567-b07e54358753") },
  { cat: "Pintura", title: "Toyota Hilux — Pintura parcial", tint: "rgba(196,30,42,.20)", img: U("1487754180451-c456f719a1fc") },
  { cat: "Restauración", title: "Fiat 600 — Recuperación clásica", tint: "rgba(245,158,11,.16)", img: U("1492144534655-ae79c964c9d7"), tall: true },
  { cat: "Personalizado", title: "Llantas — Negro satinado", tint: "rgba(255,255,255,.10)", img: U("1619642751034-765dfdf7c58e") },
];

export const TESTIMONIAL = {
  quote: "Dejé la camioneta para repintado y por primera vez pude seguir cada paso desde el celular. Llegué a buscarla y ya sabía exactamente cómo había quedado.",
  name: "Martín Ferreyra",
  car: "Toyota Hilux SRX",
};

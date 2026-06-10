import type { CSSProperties } from "react";

// Set de iconos line-style portado del prototipo (elg-pro-prototipo/src/icons.jsx).
// Se porta tal cual para fidelidad visual exacta (no se usa lucide para estos).

export type IconName =
  | "menu" | "close" | "arrow" | "arrowUR" | "chevR" | "chevD" | "check"
  | "play" | "phone" | "mail" | "pin" | "clock" | "instagram" | "whatsapp"
  | "spray" | "layers" | "sparkle" | "shield" | "film" | "seat" | "wrench"
  | "star2" | "droplet" | "sun" | "quote" | "user" | "grid" | "swap" | "car"
  | "home" | "bell" | "calendar" | "logout" | "gauge" | "camera"
  | "plus" | "search" | "trash" | "pencil" | "users" | "clipboard" | "grip" | "eye";

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  style?: CSSProperties;
  className?: string;
}

export function Icon({ name, size = 22, stroke = 2, style, className }: IconProps) {
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<IconName, React.ReactNode> = {
    menu: <g {...p}><path d="M3 6h18M3 12h18M3 18h18" /></g>,
    close: <g {...p}><path d="M6 6l12 12M18 6L6 18" /></g>,
    arrow: <g {...p}><path d="M5 12h14M13 6l6 6-6 6" /></g>,
    arrowUR: <g {...p}><path d="M7 17L17 7M7 7h10v10" /></g>,
    chevR: <g {...p}><path d="M9 6l6 6-6 6" /></g>,
    chevD: <g {...p}><path d="M6 9l6 6 6-6" /></g>,
    check: <g {...p}><path d="M20 6L9 17l-5-5" /></g>,
    play: <g {...p}><path d="M7 5l12 7-12 7V5z" fill="currentColor" /></g>,
    phone: <g {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" /></g>,
    mail: <g {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></g>,
    pin: <g {...p}><path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></g>,
    clock: <g {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></g>,
    instagram: <g {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></g>,
    whatsapp: <g {...p}><path d="M3 21l1.8-5A8 8 0 1112 20a8 8 0 01-4-1L3 21z" /><path d="M9 9c0 4 2.5 6 6 6" /></g>,
    spray: <g {...p}><rect x="7" y="9" width="7" height="11" rx="1.5" /><path d="M7 9V6h7v3M14 7h3M14 4h3M19 5.5h2" /></g>,
    layers: <g {...p}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></g>,
    sparkle: <g {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></g>,
    shield: <g {...p}><path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></g>,
    film: <g {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M8 5v14M16 5v14" /></g>,
    seat: <g {...p}><path d="M6 18v-6a3 3 0 013-3h2a3 3 0 013 3M6 18h12M6 18l-1 3M18 18l1 3M14 12h4a2 2 0 012 2v2" /></g>,
    wrench: <g {...p}><path d="M15 7a4 4 0 01-5 5L5 17l2 2 5-5a4 4 0 005-5l-2 2-2-2 2-2z" /></g>,
    star2: <g {...p}><path d="M12 4l2.3 5.2L20 10l-4 3.6L17 19l-5-3-5 3 1-5.4L4 10l5.7-.8L12 4z" /></g>,
    droplet: <g {...p}><path d="M12 3s6 5.5 6 10a6 6 0 11-12 0c0-4.5 6-10 6-10z" /></g>,
    sun: <g {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></g>,
    quote: <g {...p}><path d="M9 8c-3 1-4 3-4 6h3v4H4v-4M19 8c-3 1-4 3-4 6h3v4h-4v-4" fill="currentColor" stroke="none" /></g>,
    user: <g {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></g>,
    grid: <g {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></g>,
    swap: <g {...p}><path d="M7 7h11l-3-3M17 17H6l3 3" /></g>,
    car: <g {...p}><path d="M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11M5 11h14v5H5v-5zM5 16v2M19 16v2" /><circle cx="8" cy="13.5" r="1" fill="currentColor" stroke="none" /><circle cx="16" cy="13.5" r="1" fill="currentColor" stroke="none" /></g>,
    home: <g {...p}><path d="M4 11l8-7 8 7M6 10v9h12v-9" /></g>,
    bell: <g {...p}><path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 004 0" /></g>,
    calendar: <g {...p}><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 9h16M8 3v4M16 3v4" /></g>,
    logout: <g {...p}><path d="M9 5H6a2 2 0 00-2 2v10a2 2 0 002 2h3M16 17l5-5-5-5M21 12H9" /></g>,
    gauge: <g {...p}><path d="M5 18a8 8 0 1114 0M12 14l4-4" /><circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none" /></g>,
    camera: <g {...p}><path d="M3 8a2 2 0 012-2h2l1.5-2h7L17 6h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /><circle cx="12" cy="13" r="3.5" /></g>,
    plus: <g {...p}><path d="M12 5v14M5 12h14" /></g>,
    search: <g {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></g>,
    trash: <g {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></g>,
    pencil: <g {...p}><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" /></g>,
    users: <g {...p}><circle cx="9" cy="8" r="3.5" /><path d="M3 21a6 6 0 0112 0M16 5a3.5 3.5 0 010 7M21 21a6 6 0 00-5-5.9" /></g>,
    clipboard: <g {...p}><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4h6v3H9zM9 11h6M9 15h6" /></g>,
    grip: <g {...p}><circle cx="9" cy="6" r="1.2" fill="currentColor" stroke="none" /><circle cx="15" cy="6" r="1.2" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="9" cy="18" r="1.2" fill="currentColor" stroke="none" /><circle cx="15" cy="18" r="1.2" fill="currentColor" stroke="none" /></g>,
    eye: <g {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} className={className} aria-hidden="true">
      {paths[name] ?? null}
    </svg>
  );
}

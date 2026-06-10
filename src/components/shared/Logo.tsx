import type { CSSProperties } from "react";

interface LogoProps {
  /** Tamaño del wordmark en px (escala todo proporcionalmente). */
  size?: number;
  /** Muestra el tagline "Paint & Detail". */
  tagline?: boolean;
  /** Muestra la línea de ubicación "Rosario · Santa Fe". */
  location?: boolean;
  /** Centra el lockup (y muestra las reglas del tagline). */
  center?: boolean;
  className?: string;
}

/**
 * Lockup de marca ELG/PRO portado del prototipo (logo.jsx + logo.css).
 * Variantes: navbar `<Logo size={18} />`, menú `<Logo size={18} tagline />`,
 * footer `<Logo size={30} tagline location />`, login `<Logo size={30} tagline center />`.
 */
export function Logo({
  size = 22,
  tagline = false,
  location = false,
  center = false,
  className = "",
}: LogoProps) {
  const style = { "--s": size + "px" } as CSSProperties;
  return (
    <div
      className={"elg-logo" + (center ? " center" : "") + (className ? " " + className : "")}
      style={style}
    >
      <div className="elg-logo-mark">
        <span className="elg">ELG</span>
        <span className="pro">PRO</span>
      </div>
      {tagline && (
        <div className="elg-logo-tag">
          <span className="rule l" />
          Paint &amp; Detail
          <span className="rule r" />
        </div>
      )}
      {location && <div className="elg-logo-loc">Rosario · Santa Fe</div>}
    </div>
  );
}

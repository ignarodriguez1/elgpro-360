interface PageHeadProps {
  eyebrow: string;
  title: string;
  sub?: string;
}

/** Cabecera de página interna (.dpagehead), portada del prototipo desktop. */
export function PageHead({ eyebrow, title, sub }: PageHeadProps) {
  return (
    <header className="dpagehead">
      <div className="dpagehead-glow" />
      <div className="wrap">
        <div className="deyebrow drise">{eyebrow}</div>
        <h1 className="dpagehead-title drise" style={{ transitionDelay: "60ms" }}>
          {title}
        </h1>
        {sub && (
          <p className="dpagehead-sub drise" style={{ transitionDelay: "120ms" }}>
            {sub}
          </p>
        )}
      </div>
    </header>
  );
}

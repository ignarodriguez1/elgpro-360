import { Reveal } from "./Reveal";

interface SectionHeadProps {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}

export function SectionHead({ eyebrow, title, children }: SectionHeadProps) {
  return (
    <Reveal className="section-head">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2>{title}</h2>
      {children && <p className="kicker" style={{ maxWidth: 320 }}>{children}</p>}
    </Reveal>
  );
}

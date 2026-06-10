"use client";

import { useRef, useEffect } from "react";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/** Anima el contenido on-scroll (IntersectionObserver). Portado del prototipo. */
export function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("in");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.08 }
    );
    io.observe(el);
    const t = setTimeout(() => el.classList.add("in"), 1400);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);

  return (
    <div ref={ref} className={"rise " + className} style={{ transitionDelay: delay + "ms" }}>
      {children}
    </div>
  );
}

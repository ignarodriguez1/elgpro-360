"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorViewProps {
  error: Error & { digest?: string };
  reset?: () => void;
  /** Identifica el segmento para el log (admin, clientes, public, root). */
  scope?: string;
  /** A dónde vuelve el botón secundario. */
  homeHref?: string;
  homeLabel?: string;
}

/**
 * Vista de error branded reutilizable por los error.tsx de cada segmento.
 * Es client component (los error boundaries de Next lo exigen).
 * No depende de clases CSS de un segmento puntual: usa los tokens globales
 * (var(--bg), var(--surface)...) definidos en :root, así se ve igual en
 * /admin, /clientes y la web pública.
 */
export function ErrorView({
  error,
  reset,
  scope = "app",
  homeHref = "/",
  homeLabel = "Volver al inicio",
}: ErrorViewProps) {
  useEffect(() => {
    // Diagnóstico. En producción esto iría a un servicio de observabilidad.
    console.error(`[error:${scope}]`, error);
  }, [error, scope]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 16,
        padding: "48px 24px",
      }}
    >
      <div
        aria-hidden
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          background: "rgba(196,30,42,.12)",
          border: "1px solid rgba(196,30,42,.35)",
          color: "var(--primary)",
          fontSize: 26,
          fontWeight: 700,
        }}
      >
        !
      </div>
      <h2
        style={{
          fontFamily: "var(--display)",
          textTransform: "uppercase",
          fontSize: 24,
          letterSpacing: ".02em",
          margin: 0,
        }}
      >
        Algo salió mal
      </h2>
      <p style={{ color: "var(--muted)", maxWidth: 440, fontSize: 14, margin: 0 }}>
        Ocurrió un error inesperado. Podés reintentar la acción o volver atrás. El
        problema quedó registrado.
      </p>
      {error?.digest && (
        <code
          style={{
            fontFamily: "var(--mono)",
            fontSize: 12,
            color: "var(--muted-dim)",
          }}
        >
          ref: {error.digest}
        </code>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
        {reset && (
          <button
            type="button"
            onClick={reset}
            style={{
              fontFamily: "var(--display)",
              textTransform: "uppercase",
              fontSize: 13,
              letterSpacing: ".03em",
              padding: "10px 18px",
              borderRadius: "var(--r-sm)",
              border: "none",
              background: "var(--primary)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        )}
        <Link
          href={homeHref}
          style={{
            fontFamily: "var(--display)",
            textTransform: "uppercase",
            fontSize: 13,
            letterSpacing: ".03em",
            padding: "10px 18px",
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            textDecoration: "none",
          }}
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}

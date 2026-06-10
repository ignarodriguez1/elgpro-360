"use client";

import { useEffect } from "react";

/**
 * global-error reemplaza el ROOT layout cuando este falla, así que debe traer
 * su propio <html>/<body> y NO puede depender de que globals.css haya cargado.
 * Por eso los estilos van inline con valores literales (paleta ELG Pro).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error:global]", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0f0f0f",
          color: "#f5f5f5",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
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
            color: "#c41e2a",
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          !
        </div>
        <h2 style={{ fontSize: 24, textTransform: "uppercase", margin: 0 }}>
          Error inesperado
        </h2>
        <p style={{ color: "#9ca3af", maxWidth: 440, fontSize: 14, margin: 0 }}>
          La aplicación encontró un problema y no pudo continuar. Reintentá; si
          persiste, recargá la página.
        </p>
        {error?.digest && (
          <code style={{ fontSize: 12, color: "#6b7280" }}>ref: {error.digest}</code>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 4,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: ".03em",
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            background: "#c41e2a",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}

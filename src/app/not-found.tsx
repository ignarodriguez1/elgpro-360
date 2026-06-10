import Link from "next/link";

/** 404 branded global. Se muestra ante notFound() o rutas inexistentes. */
export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 14,
        padding: "48px 24px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--display)",
          fontSize: 72,
          lineHeight: 1,
          color: "var(--primary)",
          letterSpacing: ".02em",
        }}
      >
        404
      </div>
      <h2
        style={{
          fontFamily: "var(--display)",
          textTransform: "uppercase",
          fontSize: 22,
          margin: 0,
        }}
      >
        No encontramos esta página
      </h2>
      <p style={{ color: "var(--muted)", maxWidth: 420, fontSize: 14, margin: 0 }}>
        El recurso que buscás no existe o fue movido. Verificá el enlace o volvé al
        inicio.
      </p>
      <Link
        href="/"
        style={{
          marginTop: 4,
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
        Volver al inicio
      </Link>
    </div>
  );
}

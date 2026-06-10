"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { Icon } from "@/components/shared/Icon";
import "../admin.css";

export function AdminLoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    if (result?.error) {
      setError("Credenciales incorrectas");
      setLoading(false);
      return;
    }

    // Navegación DURA (no router.push): fuerza a re-ejecutar el layout del
    // admin con la sesión recién creada, así aparece el AdminShell/sidebar.
    window.location.href = "/admin";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        fontFamily: "var(--body)",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: "calc(100% - 32px)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          padding: "40px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Logo size={24} tagline center />
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: ".14em",
              color: "var(--muted-dim)",
              fontFamily: "var(--display)",
            }}
          >
            Panel de administración
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="afield">
            <label className="afield-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="admin@elgpro.com"
              autoComplete="username"
            />
          </div>

          <div className="afield">
            <label className="afield-label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="form-error">
              <Icon name="close" size={15} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="abtn abtn-primary"
            style={{ width: "100%", marginTop: 4 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Icon name="clock" size={16} />
                Ingresando…
              </>
            ) : (
              <>
                <Icon name="arrow" size={16} />
                Ingresar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

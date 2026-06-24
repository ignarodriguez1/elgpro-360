"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { Icon } from "@/components/shared/Icon";
import { requestLoginCodeAction, type RequestCodeResult } from "@/lib/login-actions";
import { safeInternalPath } from "@/lib/redirect";
import "../admin.css";

function destination(): string {
  const cb = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("callbackUrl")
    : null;
  return safeInternalPath(cb, "/admin");
}

function messageForCode(code: string | undefined): string {
  if (!code) return "No pudimos validar el código. Probá de nuevo.";
  if (code === "expired") return "El código expiró. Pedí uno nuevo.";
  if (code === "locked") return "Demasiados intentos. Pedí un código nuevo.";
  if (code === "inactive") return "Tu cuenta está desactivada. Contactá al taller.";
  if (code.startsWith("invalid:")) {
    const n = code.split(":")[1];
    return `Código incorrecto. Te ${n === "1" ? "queda 1 intento" : `quedan ${n} intentos`}.`;
  }
  return "Código incorrecto. Revisá los dígitos.";
}

export function AdminLoginForm() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    let res: RequestCodeResult;
    try {
      res = await requestLoginCodeAction(email);
    } catch {
      setLoading(false);
      setError("No pudimos procesar el pedido. Probá de nuevo en un momento.");
      return;
    }
    setLoading(false);
    if (!res.ok) {
      setError(
        res.error === "rate_limited"
          ? "Demasiados pedidos. Esperá unos minutos e intentá de nuevo."
          : "Ingresá un email válido."
      );
      return;
    }
    setStep("code");
    setInfo("Si tu email está registrado, te enviamos un código de 6 dígitos.");
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, code, redirect: false });
    if (res?.ok) {
      // Navegación DURA: re-ejecuta el layout admin con la sesión nueva.
      window.location.href = destination();
      return;
    }
    setLoading(false);
    setError(messageForCode(res?.code));
  }

  function resetToEmail() {
    setStep("email");
    setCode("");
    setError("");
    setInfo("");
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
        <form onSubmit={step === "email" ? handleRequest : handleVerify} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {step === "email" ? (
            <div className="afield">
              <label className="afield-label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="admin@elgpro.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          ) : (
            <div className="afield">
              <label className="afield-label" htmlFor="code">Código de 6 dígitos</label>
              <input
                id="code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
            </div>
          )}

          {info && (
            <div style={{ fontSize: 13, color: "var(--muted-light)" }}>{info}</div>
          )}
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
              <><Icon name="clock" size={16} />{step === "email" ? "Enviando…" : "Ingresando…"}</>
            ) : (
              <><Icon name="arrow" size={16} />{step === "email" ? "Enviar código" : "Ingresar"}</>
            )}
          </button>

          {step === "code" && (
            <button
              type="button"
              className="abtn abtn-ghost"
              style={{ width: "100%" }}
              onClick={resetToEmail}
              disabled={loading}
            >
              Cambiar email / reenviar código
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

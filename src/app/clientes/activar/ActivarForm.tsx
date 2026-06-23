"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Photo } from "@/components/shared/Photo";
import { HERO_IMG } from "@/lib/public-data";

/** Fondo hero compartido por los 3 estados, en ambos árboles (paridad con login). */
function HeroBg({ variant }: { variant: "mobile" | "desktop" }) {
  return (
    <div data-section="hero-bg">
      <Photo src={HERO_IMG} className={variant === "mobile" ? "p-login-bg" : "pw-login-bg"} tint="rgba(196,30,42,.22)" />
      <div className={variant === "mobile" ? "p-login-veil" : "pw-login-veil"} />
    </div>
  );
}

export function ActivarForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al activar la cuenta");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <>
        {/* MOBILE */}
        <div className="only-mobile p-login">
          <HeroBg variant="mobile" />
          <div className="p-login-inner">
            <div className="p-login-card" style={{ textAlign: "center" }}>
              <h1 className="p-login-title" style={{ color: "var(--primary)" }}>Token inválido</h1>
              <p className="p-login-sub">El enlace de activación no es válido o expiró.</p>
            </div>
          </div>
        </div>
        {/* DESKTOP */}
        <div className="only-desktop pw-login" style={{ position: "relative", minHeight: "100svh", background: "var(--bg)" }}>
          <HeroBg variant="desktop" />
          <div className="pw-login-card" style={{ textAlign: "center" }}>
            <h2 className="pw-login-title" style={{ color: "var(--primary)" }}>Token inválido</h2>
            <p className="pw-login-sub">El enlace de activación no es válido o expiró.</p>
          </div>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        {/* MOBILE */}
        <div className="only-mobile p-login">
          <HeroBg variant="mobile" />
          <div className="p-login-inner">
            <div className="p-login-card" style={{ textAlign: "center" }}>
              <h1 className="p-login-title" style={{ color: "var(--success)" }}>Cuenta activada</h1>
              <p className="p-login-sub">Ya podés ingresar con tu email y contraseña.</p>
              <Link href="/clientes/login" className="btn btn-primary btn-block" style={{ marginTop: 20 }}>
                Ir al login
              </Link>
            </div>
          </div>
        </div>
        {/* DESKTOP */}
        <div className="only-desktop pw-login" style={{ position: "relative", minHeight: "100svh", background: "var(--bg)" }}>
          <HeroBg variant="desktop" />
          <div className="pw-login-card" style={{ textAlign: "center" }}>
            <h2 className="pw-login-title" style={{ color: "var(--success)" }}>Cuenta activada</h2>
            <p className="pw-login-sub">Ya podés ingresar con tu email y contraseña.</p>
            <Link href="/clientes/login" className="pw-btn pw-btn-primary" style={{ width: "100%", marginTop: 4 }}>
              Ir al login
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* MOBILE */}
      <div className="only-mobile p-login">
        <HeroBg variant="mobile" />
        <div className="p-login-inner">
          <div className="p-login-card">
            <h1 className="p-login-title">Activar cuenta</h1>
            <p className="p-login-sub">Configurá tu contraseña para acceder al portal</p>
            <form onSubmit={handleSubmit}>
              <div className="p-field">
                <label>Contraseña</label>
                <input name="password" type="password" required placeholder="Mínimo 8 caracteres" />
              </div>
              <div className="p-field">
                <label>Confirmar contraseña</label>
                <input name="confirmPassword" type="password" required placeholder="Repetí tu contraseña" />
              </div>
              {error && <div className="p-login-error">{error}</div>}
              <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop: 6 }}>
                {loading ? "Activando..." : "Activar cuenta"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="only-desktop pw-login" style={{ position: "relative", minHeight: "100svh", background: "var(--bg)" }}>
        <HeroBg variant="desktop" />
        <div className="pw-login-card">
          <h2 className="pw-login-title">Activar cuenta</h2>
          <p className="pw-login-sub">Configurá tu contraseña para acceder al portal</p>
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <div className="pw-field">
              <label>Contraseña</label>
              <input name="password" type="password" required placeholder="Mínimo 8 caracteres" />
            </div>
            <div className="pw-field">
              <label>Confirmar contraseña</label>
              <input name="confirmPassword" type="password" required placeholder="Repetí tu contraseña" />
            </div>
            {error && <p style={{ color: "#ff5d68", fontSize: 13, margin: "0 0 10px" }}>{error}</p>}
            <button className="pw-btn pw-btn-primary" type="submit" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Activando..." : "Activar cuenta"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { Icon } from "@/components/shared/Icon";
import { Photo } from "@/components/shared/Photo";
import { HERO_IMG } from "@/lib/public-data";

export function ClienteLoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: fd.get("email") as string,
      password: fd.get("password") as string,
      redirect: false,
    });
    if (result?.error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }
    // Navegación DURA (no router.push): re-ejecuta el layout del portal con la
    // sesión nueva, así aparece la navegación del cliente (bottom nav / PwNav).
    window.location.href = "/clientes/dashboard";
  }

  return (
    <>
      {/* MOBILE */}
      <div className="only-mobile p-login">
        <Photo src={HERO_IMG} className="p-login-bg" tint="rgba(196,30,42,.25)" />
        <div className="p-login-veil" />
        <div className="p-login-inner">
          <div className="p-login-logo"><Logo size={30} tagline center /></div>
          <div className="p-login-card">
            <h1 className="p-login-title">Portal de clientes</h1>
            <p className="p-login-sub">Ingresá para seguir el trabajo de tu vehículo en tiempo real.</p>
            <form onSubmit={handleSubmit}>
              <div className="p-field"><label>Email</label><input name="email" type="email" required placeholder="tu@email.com" /></div>
              <div className="p-field"><label>Contraseña</label><input name="password" type="password" required placeholder="••••••••" /></div>
              {error && <div className="p-login-error">{error}</div>}
              <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop: 6 }}>
                {loading ? "Ingresando…" : <>Ingresar <Icon name="arrow" size={18} /></>}
              </button>
            </form>
            <div className="p-login-links"><a href="/clientes/activar">¿Primera vez? Activá tu cuenta</a><a href="#">Olvidé mi contraseña</a></div>
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="only-desktop pw-login">
        <Photo src={HERO_IMG} className="pw-login-bg" tint="rgba(196,30,42,.22)" />
        <div className="pw-login-veil" />
        <div className="pw-login-card">
          <Logo size={26} tagline />
          <h2 className="pw-login-title">Portal de clientes</h2>
          <p className="pw-login-sub">Seguí el trabajo de tu vehículo en tiempo real.</p>
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <div className="pw-field"><label>Email</label><input name="email" type="email" required placeholder="tu@email.com" /></div>
            <div className="pw-field"><label>Contraseña</label><input name="password" type="password" required placeholder="••••••••" /></div>
            {error && <p style={{ color: "#ff5d68", fontSize: 13, margin: "0 0 10px" }}>{error}</p>}
            <button className="pw-btn pw-btn-primary" type="submit" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Ingresando…" : <>Ingresar <Icon name="arrow" size={18} /></>}
            </button>
          </form>
          <div className="pw-login-links"><a href="/clientes/activar">¿Primera vez? Activá tu cuenta</a><a href="#">Olvidé mi contraseña</a></div>
        </div>
      </div>
    </>
  );
}

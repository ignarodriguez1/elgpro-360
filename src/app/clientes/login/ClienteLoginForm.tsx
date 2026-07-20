"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { Icon } from "@/components/shared/Icon";
import { Photo } from "@/components/shared/Photo";
import { HERO_IMG } from "@/lib/public-data";
import { requestLoginCodeAction, type RequestCodeResult } from "@/lib/login-actions";
import { safeInternalPath } from "@/lib/redirect";

/** Destino post-login: callbackUrl validado contra open redirect (req. 8). */
function destination(): string {
  const cb = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("callbackUrl")
    : null;
  return safeInternalPath(cb, "/clientes/dashboard");
}

/** Traduce el `code` de error de signIn a un mensaje honesto. */
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

/**
 * Campos del paso actual, compartidos por el árbol mobile y el desktop.
 * DEFINIDO A NIVEL DE MÓDULO a propósito: si viviera dentro de ClienteLoginForm,
 * cada tecla recrearía la función, React lo trataría como un componente nuevo y
 * remontaría el <input> en cada pulsación — perdiendo el foco. La `key` por campo
 * hace que solo se remonte al cambiar de paso (email → código), preservando el
 * autoFocus del código sin volver a romper el foco al tipear.
 */
type StepFieldsProps = {
  step: "email" | "code";
  fieldClass: "p-field" | "pw-field";
  email: string;
  code: string;
  onEmail: (value: string) => void;
  onCode: (value: string) => void;
};

function StepFields({ step, fieldClass, email, code, onEmail, onCode }: StepFieldsProps) {
  if (step === "email") {
    return (
      <div className={fieldClass}>
        <label>Email</label>
        <input
          key="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => onEmail(e.target.value)}
        />
      </div>
    );
  }
  return (
    <div className={fieldClass}>
      <label>Código de 6 dígitos</label>
      <input
        key="code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        placeholder="••••••"
        value={code}
        onChange={(e) => onCode(e.target.value.replace(/\D/g, ""))}
        autoFocus
      />
    </div>
  );
}

export function ClienteLoginForm() {
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
    // No-enumeración: mismo mensaje exista o no el email.
    setStep("code");
    setInfo("Si tu email está registrado, te enviamos un código de 6 dígitos.");
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, code, redirect: false });
    if (res?.ok) {
      // Navegación DURA (no router.push): re-ejecuta el layout del portal con la
      // sesión nueva, así aparece la navegación del cliente.
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
    <>
      {/* MOBILE */}
      <div className="only-mobile p-login">
        <Photo src={HERO_IMG} className="p-login-bg" tint="rgba(196,30,42,.25)" />
        <div className="p-login-veil" />
        <div className="p-login-inner">
          <div className="p-login-logo"><Logo size={30} tagline center /></div>
          <div className="p-login-card">
            <h1 className="p-login-title">Portal de clientes</h1>
            <p className="p-login-sub">
              {step === "email"
                ? "Ingresá con tu email — te mandamos un código, sin contraseñas."
                : "Ingresá el código que te enviamos por email."}
            </p>
            <form onSubmit={step === "email" ? handleRequest : handleVerify}>
              <StepFields step={step} fieldClass="p-field" email={email} code={code} onEmail={setEmail} onCode={setCode} />
              {info && <div className="p-login-sub" style={{ marginTop: 4 }}>{info}</div>}
              {error && <div className="p-login-error">{error}</div>}
              <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop: 6 }}>
                {loading
                  ? (step === "email" ? "Enviando…" : "Ingresando…")
                  : step === "email"
                    ? <>Enviar código <Icon name="arrow" size={18} /></>
                    : <>Ingresar <Icon name="arrow" size={18} /></>}
              </button>
            </form>
            {step === "code" && (
              <div className="p-login-links">
                <a role="button" tabIndex={0} onClick={resetToEmail}>Cambiar email / reenviar código</a>
              </div>
            )}
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
          <p className="pw-login-sub">
            {step === "email"
              ? "Ingresá con tu email — te mandamos un código, sin contraseñas."
              : "Ingresá el código que te enviamos por email."}
          </p>
          <form onSubmit={step === "email" ? handleRequest : handleVerify} style={{ width: "100%" }}>
            <StepFields step={step} fieldClass="pw-field" email={email} code={code} onEmail={setEmail} onCode={setCode} />
            {info && <p className="pw-login-sub" style={{ marginTop: 4 }}>{info}</p>}
            {error && <p style={{ color: "#ff5d68", fontSize: 13, margin: "0 0 10px" }}>{error}</p>}
            <button className="pw-btn pw-btn-primary" type="submit" style={{ width: "100%" }} disabled={loading}>
              {loading
                ? (step === "email" ? "Enviando…" : "Ingresando…")
                : step === "email"
                  ? <>Enviar código <Icon name="arrow" size={18} /></>
                  : <>Ingresar <Icon name="arrow" size={18} /></>}
            </button>
          </form>
          {step === "code" && (
            <div className="pw-login-links">
              <a role="button" tabIndex={0} onClick={resetToEmail}>Cambiar email / reenviar código</a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

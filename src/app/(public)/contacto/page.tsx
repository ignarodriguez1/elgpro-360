"use client";

import { useState } from "react";
import { PageHead } from "@/components/public/PageHead";
import { Photo } from "@/components/shared/Photo";
import { Icon } from "@/components/shared/Icon";
import { SERVICES } from "@/lib/public-data";

const EMPTY = { nombre: "", email: "", tel: "", servicio: "", msg: "" };

function Field({
  base,
  label,
  req,
  invalid,
  children,
}: {
  base: string;
  label: string;
  req?: boolean;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={base + (invalid ? " invalid" : "")}>
      <span className={base + "-label"}>{label}{req && <i>*</i>}</span>
      {children}
      {invalid && <span className={base + "-err"}>Campo requerido</span>}
    </label>
  );
}

export default function ContactoPage() {
  const [form, setForm] = useState(EMPTY);
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState(false);

  const set =
    (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid = form.nombre.trim() !== "" && /\S+@\S+\.\S+/.test(form.email) && form.servicio !== "";
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (valid) setSent(true); // TODO: endpoint real
  };
  const reset = () => { setSent(false); setForm(EMPTY); setTouched(false); };

  return (
    <>
      {/* DESKTOP */}
      <div className="only-desktop">
        <div className="dpage">
          <PageHead eyebrow="Contacto" title="Hablemos de tu auto" sub="Contanos qué necesitás y coordinamos una cotización a tu medida." />
          <section className="dsection-sm" style={{ paddingTop: 56 }}>
            <div className="wrap">
              <div className="dcontact-grid">
                <div>
                  {sent ? (
                    <div className="dform-sent">
                      <span className="dform-sent-ic"><Icon name="check" size={34} /></span>
                      <h3>¡Mensaje enviado!</h3>
                      <p style={{ color: "var(--muted)", fontSize: 16, margin: 0, lineHeight: 1.6, maxWidth: 360 }}>Gracias {form.nombre.split(" ")[0]}. Te vamos a responder dentro de las próximas horas hábiles.</p>
                      <button className="dbtn dbtn-ghost" style={{ marginTop: 8 }} onClick={reset}>Enviar otra consulta</button>
                    </div>
                  ) : (
                    <form className="dform" onSubmit={submit} noValidate>
                      <div className="dform-row">
                        <Field base="dfield" label="Nombre y apellido" req invalid={touched && !form.nombre.trim()}><input value={form.nombre} onChange={set("nombre")} placeholder="Tu nombre" /></Field>
                        <Field base="dfield" label="Teléfono"><input value={form.tel} onChange={set("tel")} placeholder="+54 341 ..." /></Field>
                      </div>
                      <Field base="dfield" label="Email" req invalid={touched && !/\S+@\S+\.\S+/.test(form.email)}><input type="email" value={form.email} onChange={set("email")} placeholder="tucorreo@email.com" /></Field>
                      <Field base="dfield" label="Tipo de servicio" req invalid={touched && !form.servicio}>
                        <div className="dselect-wrap">
                          <select value={form.servicio} onChange={set("servicio")}><option value="">Elegí un servicio</option>{SERVICES.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}</select>
                          <Icon name="chevD" size={18} className="dselect-caret" />
                        </div>
                      </Field>
                      <Field base="dfield" label="Mensaje"><textarea rows={5} value={form.msg} onChange={set("msg")} placeholder="Contanos sobre tu vehículo y lo que necesitás" /></Field>
                      <button className="dbtn dbtn-primary" type="submit" style={{ alignSelf: "flex-start" }}>Enviar consulta <Icon name="arrow" size={18} /></button>
                    </form>
                  )}
                </div>
                <div className="dcontact-side">
                  <div className="dmap"><Photo className="dmap-img" tint="rgba(196,30,42,.12)" label="Mapa · Bv. Oroño 1234, Rosario" /><span className="dmap-pin"><Icon name="pin" size={30} /></span></div>
                  <div className="dcontact-cards">
                    <a className="dcontact-card" href="#"><span><Icon name="whatsapp" size={20} /></span><div><div className="dcc-h">WhatsApp</div><div className="dcc-v">+54 341 555-0142</div></div></a>
                    <a className="dcontact-card" href="#"><span><Icon name="mail" size={20} /></span><div><div className="dcc-h">Email</div><div className="dcc-v">hola@elgpro.com.ar</div></div></a>
                    <a className="dcontact-card" href="#"><span><Icon name="instagram" size={20} /></span><div><div className="dcc-h">Instagram</div><div className="dcc-v">@elgpro.detail</div></div></a>
                    <a className="dcontact-card" href="#"><span><Icon name="clock" size={20} /></span><div><div className="dcc-h">Horarios</div><div className="dcc-v">Lun–Vie · 8:30–18</div></div></a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* MOBILE */}
      <div className="only-mobile">
        <div className="page">
          <header className="page-header">
            <div className="page-header-glow" />
            <div className="eyebrow rise in">Contacto</div>
            <h1 className="page-header-title display rise in" style={{ transitionDelay: "50ms" }}>Hablemos de tu auto</h1>
            <p className="page-header-sub rise in" style={{ transitionDelay: "110ms" }}>Contanos qué necesitás y coordinamos una cotización.</p>
          </header>
          <section className="section-tight" style={{ paddingTop: 8 }}>
            {sent ? (
              <div className="form-sent">
                <span className="form-sent-ic"><Icon name="check" size={30} /></span>
                <h3 className="display">¡Mensaje enviado!</h3>
                <p className="kicker">Gracias {form.nombre.split(" ")[0]}. Te vamos a responder dentro de las próximas horas hábiles.</p>
                <button className="btn btn-ghost btn-block" onClick={reset}>Enviar otra consulta</button>
              </div>
            ) : (
              <form className="form" onSubmit={submit} noValidate>
                <Field base="field" label="Nombre y apellido" req invalid={touched && !form.nombre.trim()}><input value={form.nombre} onChange={set("nombre")} placeholder="Tu nombre" /></Field>
                <Field base="field" label="Email" req invalid={touched && !/\S+@\S+\.\S+/.test(form.email)}><input type="email" value={form.email} onChange={set("email")} placeholder="tucorreo@email.com" /></Field>
                <Field base="field" label="Teléfono"><input value={form.tel} onChange={set("tel")} placeholder="+54 341 ..." /></Field>
                <Field base="field" label="Tipo de servicio" req invalid={touched && !form.servicio}>
                  <div className="select-wrap">
                    <select value={form.servicio} onChange={set("servicio")}><option value="">Elegí un servicio</option>{SERVICES.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}</select>
                    <Icon name="chevD" size={18} className="select-caret" />
                  </div>
                </Field>
                <Field base="field" label="Mensaje"><textarea rows={4} value={form.msg} onChange={set("msg")} placeholder="Contanos sobre tu vehículo y lo que necesitás" /></Field>
                <button className="btn btn-primary btn-block" type="submit">Enviar consulta <Icon name="arrow" size={18} /></button>
              </form>
            )}
            <div className="map-wrap"><Photo className="map-img" tint="rgba(196,30,42,.12)" label="Mapa · Bv. Oroño 1234, Rosario" /><span className="map-pin"><Icon name="pin" size={26} /></span></div>
            <div className="contact-cards">
              <a className="contact-card" href="#"><span><Icon name="whatsapp" size={20} /></span><div><div className="cc-h">WhatsApp</div><div className="cc-v mono">+54 341 555-0142</div></div></a>
              <a className="contact-card" href="#"><span><Icon name="mail" size={20} /></span><div><div className="cc-h">Email</div><div className="cc-v mono">hola@elgpro.com.ar</div></div></a>
              <a className="contact-card" href="#"><span><Icon name="instagram" size={20} /></span><div><div className="cc-h">Instagram</div><div className="cc-v mono">@elgpro.detail</div></div></a>
              <a className="contact-card" href="#"><span><Icon name="clock" size={20} /></span><div><div className="cc-h">Horarios</div><div className="cc-v mono">Lun–Vie · 8:30–18</div></div></a>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

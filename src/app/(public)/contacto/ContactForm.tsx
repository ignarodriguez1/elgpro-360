"use client";

import { useState } from "react";
import { PageHead } from "@/components/public/PageHead";
import { Photo } from "@/components/shared/Photo";
import { Icon } from "@/components/shared/Icon";
import { CONTACT, whatsappUrl } from "@/lib/contact";

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

/** Servicios DB-driven: el dropdown solo lista los servicios visibles del admin. */
export function ContactForm({ services }: { services: string[] }) {
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState(false);

  const set =
    (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid = form.nombre.trim() !== "" && /\S+@\S+\.\S+/.test(form.email) && form.servicio !== "";

  // Acción HONESTA: no simula un POST inexistente. Abre WhatsApp con la consulta
  // prellenada — un canal real que el dueño efectivamente lee.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    const msg = [
      `Hola ELG Pro! Soy ${form.nombre.trim()}.`,
      form.servicio ? `Me interesa: ${form.servicio}.` : "",
      form.msg.trim(),
      form.tel.trim() ? `Tel: ${form.tel.trim()}.` : "",
      `Email: ${form.email.trim()}`,
    ]
      .filter(Boolean)
      .join(" ");
    window.open(whatsappUrl(msg), "_blank", "noopener,noreferrer");
  };

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
                  <form className="dform" onSubmit={submit} noValidate>
                    <div className="dform-row">
                      <Field base="dfield" label="Nombre y apellido" req invalid={touched && !form.nombre.trim()}><input value={form.nombre} onChange={set("nombre")} placeholder="Tu nombre" /></Field>
                      <Field base="dfield" label="Teléfono"><input value={form.tel} onChange={set("tel")} placeholder="+54 341 ..." /></Field>
                    </div>
                    <Field base="dfield" label="Email" req invalid={touched && !/\S+@\S+\.\S+/.test(form.email)}><input type="email" value={form.email} onChange={set("email")} placeholder="tucorreo@email.com" /></Field>
                    <Field base="dfield" label="Tipo de servicio" req invalid={touched && !form.servicio}>
                      <div className="dselect-wrap">
                        <select value={form.servicio} onChange={set("servicio")}><option value="">Elegí un servicio</option>{services.map((name) => <option key={name} value={name}>{name}</option>)}</select>
                        <Icon name="chevD" size={18} className="dselect-caret" />
                      </div>
                    </Field>
                    <Field base="dfield" label="Mensaje"><textarea rows={5} value={form.msg} onChange={set("msg")} placeholder="Contanos sobre tu vehículo y lo que necesitás" /></Field>
                    <button className="dbtn dbtn-primary" type="submit" style={{ alignSelf: "flex-start" }}>Enviar por WhatsApp <Icon name="whatsapp" size={18} /></button>
                  </form>
                </div>
                <div className="dcontact-side">
                  <div className="dmap"><Photo className="dmap-img" tint="rgba(196,30,42,.12)" label="Mapa · Rosario, Santa Fe" /><span className="dmap-pin"><Icon name="pin" size={30} /></span></div>
                  <div className="dcontact-cards">
                    <a className="dcontact-card" href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer"><span><Icon name="whatsapp" size={20} /></span><div><div className="dcc-h">WhatsApp</div><div className="dcc-v">{CONTACT.whatsappDisplay}</div></div></a>
                    <a className="dcontact-card" href={`mailto:${CONTACT.email}`}><span><Icon name="mail" size={20} /></span><div><div className="dcc-h">Email</div><div className="dcc-v">{CONTACT.email}</div></div></a>
                    <a className="dcontact-card" href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer"><span><Icon name="instagram" size={20} /></span><div><div className="dcc-h">Instagram</div><div className="dcc-v">{CONTACT.instagramDisplay}</div></div></a>
                    <div className="dcontact-card"><span><Icon name="clock" size={20} /></span><div><div className="dcc-h">Horarios</div><div className="dcc-v">Lun–Vie · 8:30–18</div></div></div>
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
            <div className="eyebrow rise">Contacto</div>
            <h1 className="page-header-title display rise" style={{ transitionDelay: "50ms" }}>Hablemos de tu auto</h1>
            <p className="page-header-sub rise" style={{ transitionDelay: "110ms" }}>Contanos qué necesitás y coordinamos una cotización.</p>
          </header>
          <section className="section-tight" style={{ paddingTop: 8 }}>
            <form className="form" onSubmit={submit} noValidate>
              <Field base="field" label="Nombre y apellido" req invalid={touched && !form.nombre.trim()}><input value={form.nombre} onChange={set("nombre")} placeholder="Tu nombre" /></Field>
              <Field base="field" label="Email" req invalid={touched && !/\S+@\S+\.\S+/.test(form.email)}><input type="email" value={form.email} onChange={set("email")} placeholder="tucorreo@email.com" /></Field>
              <Field base="field" label="Teléfono"><input value={form.tel} onChange={set("tel")} placeholder="+54 341 ..." /></Field>
              <Field base="field" label="Tipo de servicio" req invalid={touched && !form.servicio}>
                <div className="select-wrap">
                  <select value={form.servicio} onChange={set("servicio")}><option value="">Elegí un servicio</option>{services.map((name) => <option key={name} value={name}>{name}</option>)}</select>
                  <Icon name="chevD" size={18} className="select-caret" />
                </div>
              </Field>
              <Field base="field" label="Mensaje"><textarea rows={4} value={form.msg} onChange={set("msg")} placeholder="Contanos sobre tu vehículo y lo que necesitás" /></Field>
              <button className="btn btn-primary btn-block" type="submit">Enviar por WhatsApp <Icon name="whatsapp" size={18} /></button>
            </form>
            <div className="map-wrap"><Photo className="map-img" tint="rgba(196,30,42,.12)" label="Mapa · Rosario, Santa Fe" /><span className="map-pin"><Icon name="pin" size={26} /></span></div>
            <div className="contact-cards">
              <a className="contact-card" href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer"><span><Icon name="whatsapp" size={20} /></span><div><div className="cc-h">WhatsApp</div><div className="cc-v mono">{CONTACT.whatsappDisplay}</div></div></a>
              <a className="contact-card" href={`mailto:${CONTACT.email}`}><span><Icon name="mail" size={20} /></span><div><div className="cc-h">Email</div><div className="cc-v mono">{CONTACT.email}</div></div></a>
              <a className="contact-card" href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer"><span><Icon name="instagram" size={20} /></span><div><div className="cc-h">Instagram</div><div className="cc-v mono">{CONTACT.instagramDisplay}</div></div></a>
              <div className="contact-card"><span><Icon name="clock" size={20} /></span><div><div className="cc-h">Horarios</div><div className="cc-v mono">Lun–Vie · 8:30–18</div></div></div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

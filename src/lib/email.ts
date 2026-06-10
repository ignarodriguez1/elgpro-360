import { Resend } from "resend";
import { InviteEmail } from "@/../emails/InviteEmail";
import { StatusUpdateEmail } from "@/../emails/StatusUpdateEmail";
import { ReadyForPickupEmail } from "@/../emails/ReadyForPickupEmail";

// Lazy init: NO instanciar en module scope. Resend() lanza si falta la API key,
// y eso rompería el build (Next recolecta config importando esta cadena).
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "Resend no está configurado: falta RESEND_API_KEY en el entorno. El envío de email se omite."
    );
  }
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const from = process.env.EMAIL_FROM || "ELG Pro <noreply@elgpro.com>";

export async function sendInviteEmail(data: {
  to: string;
  customerName: string;
  inviteUrl: string;
}) {
  return getResend().emails.send({
    from,
    to: data.to,
    subject: "Bienvenido a ELG Pro 360 — Activá tu cuenta",
    react: InviteEmail({
      customerName: data.customerName,
      inviteUrl: data.inviteUrl,
    }),
  });
}

export async function sendStatusUpdateEmail(data: {
  to: string;
  customerName: string;
  vehicleName: string;
  updateTitle: string;
  updateDescription?: string | null;
  orderTitle: string;
}) {
  return getResend().emails.send({
    from,
    to: data.to,
    subject: `Actualización: ${data.orderTitle}`,
    react: StatusUpdateEmail({
      customerName: data.customerName,
      vehicleName: data.vehicleName,
      updateTitle: data.updateTitle,
      updateDescription: data.updateDescription,
      orderTitle: data.orderTitle,
    }),
  });
}

export async function sendReadyForPickupEmail(data: {
  to: string;
  customerName: string;
  vehicleName: string;
  orderTitle: string;
}) {
  return getResend().emails.send({
    from,
    to: data.to,
    subject: `Tu ${data.vehicleName} está listo para retirar`,
    react: ReadyForPickupEmail({
      customerName: data.customerName,
      vehicleName: data.vehicleName,
      orderTitle: data.orderTitle,
    }),
  });
}

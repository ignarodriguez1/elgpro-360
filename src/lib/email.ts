import { Resend } from "resend";
import { LoginCodeEmail } from "@/../emails/LoginCodeEmail";
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

/**
 * El SDK de Resend NO lanza ante errores de la API (key inválida, dominio sin
 * verificar, 4xx/5xx): resuelve con `{ data: null, error }`. Si se ignora ese
 * `error`, un envío rechazado se confunde con uno exitoso ("parece que funciona,
 * no funciona"). Este wrapper traduce ese `error` en una excepción real, para
 * que los callers —que ya envuelven el envío en try/catch best-effort— puedan
 * reflejar el fallo de verdad (emailSent=false, "notificado" no marcado, etc.).
 */
async function sendOrThrow(
  pending: Promise<{ data: unknown; error: { message?: string; name?: string } | null }>
) {
  const { data, error } = await pending;
  if (error) {
    throw new Error(
      `Resend no pudo enviar el email: ${error.message ?? error.name ?? "error desconocido"}`
    );
  }
  return data;
}

export async function sendLoginCodeEmail(data: { to: string; code: string }) {
  return sendOrThrow(
    getResend().emails.send({
      from,
      to: data.to,
      subject: `Tu código de acceso a ELG Pro: ${data.code}`,
      react: LoginCodeEmail({ code: data.code }),
    })
  );
}

export async function sendStatusUpdateEmail(data: {
  to: string;
  customerName: string;
  vehicleName: string;
  updateTitle: string;
  updateDescription?: string | null;
  orderTitle: string;
}) {
  return sendOrThrow(
    getResend().emails.send({
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
    })
  );
}

export async function sendReadyForPickupEmail(data: {
  to: string;
  customerName: string;
  vehicleName: string;
  orderTitle: string;
}) {
  return sendOrThrow(
    getResend().emails.send({
      from,
      to: data.to,
      subject: `Tu ${data.vehicleName} está listo para retirar`,
      react: ReadyForPickupEmail({
        customerName: data.customerName,
        vehicleName: data.vehicleName,
        orderTitle: data.orderTitle,
      }),
    })
  );
}

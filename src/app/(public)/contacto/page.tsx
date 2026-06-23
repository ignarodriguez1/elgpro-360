import { ContactForm } from "./ContactForm";
import { listServices } from "@/services/service.service";

export const dynamic = "force-dynamic";

export default async function ContactoPage() {
  // DB-driven: el dropdown solo ofrece servicios visibles (toggle del admin).
  const services = (await listServices(true)).map((s) => s.name);
  return <ContactForm services={services} />;
}

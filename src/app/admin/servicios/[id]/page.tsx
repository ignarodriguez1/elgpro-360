import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getServiceWithFlow } from "@/services/service.service";
import { FlowEditor } from "@/components/admin/FlowEditor";

export default async function AdminServicioEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  let service;
  try {
    service = await getServiceWithFlow(id);
  } catch {
    notFound();
  }

  const steps = service.flow.map((f) => ({
    id: f.id,
    title: f.title,
    description: f.description,
    stage: f.stage,
    visible: f.visible,
  }));

  return <FlowEditor serviceId={service.id} serviceName={service.name} steps={steps} />;
}

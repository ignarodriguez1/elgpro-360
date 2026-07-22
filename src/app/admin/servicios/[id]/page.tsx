import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/session";
import { getServiceWithFlow, MAX_SERVICE_IMAGES } from "@/services/service.service";
import { FlowEditor } from "@/components/admin/FlowEditor";
import { ServiceGalleryEditor } from "@/components/admin/ServiceGalleryEditor";

export default async function AdminServicioEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOwner();
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

  const images = service.images.map((img) => ({
    id: img.id,
    url: img.url,
    alt: img.alt,
    isCover: img.isCover,
  }));

  return (
    <FlowEditor serviceId={service.id} serviceName={service.name} steps={steps}>
      <ServiceGalleryEditor
        serviceId={service.id}
        description={service.description}
        images={images}
        maxImages={MAX_SERVICE_IMAGES}
      />
    </FlowEditor>
  );
}

import { prisma } from "@/lib/prisma";
import { uploadImage, generateThumbnailUrl } from "@/lib/cloudinary";
import { publishOrderSnapshot } from "@/lib/realtime";

export async function createWorkOrderPhoto(data: {
  workOrderId: string;
  statusUpdateId?: string;
  imageUrl: string;
  publicId?: string;
  caption?: string;
  visibleToCustomer?: boolean;
}) {
  const thumbnailUrl = generateThumbnailUrl(data.imageUrl);

  const photo = await prisma.workOrderPhoto.create({
    data: {
      workOrderId: data.workOrderId,
      statusUpdateId: data.statusUpdateId,
      imageUrl: data.imageUrl,
      thumbnailUrl,
      publicId: data.publicId,
      caption: data.caption,
      visibleToCustomer: data.visibleToCustomer ?? true,
    },
  });

  // Solo si la foto cuelga de un hito existente (snapshot completo). Cuando se
  // sube antes de crear el estado, publica createStatusUpdate al asociarla.
  if (data.statusUpdateId) await publishOrderSnapshot(data.workOrderId);
  return photo;
}

export async function uploadAndSavePhoto(data: {
  file: Buffer;
  workOrderId: string;
  statusUpdateId?: string;
  caption?: string;
  visibleToCustomer?: boolean;
}) {
  const result = await uploadImage(data.file);

  return createWorkOrderPhoto({
    workOrderId: data.workOrderId,
    statusUpdateId: data.statusUpdateId,
    imageUrl: result.secure_url,
    publicId: result.public_id,
    caption: data.caption,
    visibleToCustomer: data.visibleToCustomer,
  });
}

export async function listPhotosByWorkOrder(
  workOrderId: string,
  visibleOnly: boolean = false
) {
  return prisma.workOrderPhoto.findMany({
    where: {
      workOrderId,
      ...(visibleOnly && { visibleToCustomer: true }),
    },
    orderBy: { createdAt: "desc" },
  });
}

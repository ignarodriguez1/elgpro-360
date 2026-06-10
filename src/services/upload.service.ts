import { prisma } from "@/lib/prisma";
import { uploadImage, generateThumbnailUrl } from "@/lib/cloudinary";

export async function createWorkOrderPhoto(data: {
  workOrderId: string;
  statusUpdateId?: string;
  imageUrl: string;
  caption?: string;
  visibleToCustomer?: boolean;
}) {
  const thumbnailUrl = generateThumbnailUrl(data.imageUrl);

  return prisma.workOrderPhoto.create({
    data: {
      workOrderId: data.workOrderId,
      statusUpdateId: data.statusUpdateId,
      imageUrl: data.imageUrl,
      thumbnailUrl,
      caption: data.caption,
      visibleToCustomer: data.visibleToCustomer ?? true,
    },
  });
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

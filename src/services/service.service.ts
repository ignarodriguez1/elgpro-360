import { prisma } from "@/lib/prisma";
import type { OrderStage } from "@/generated/prisma/client";

/**
 * Servicio del catálogo + editor de flujo (FlowStep).
 * Cada Service tiene una secuencia ordenada de pasos plantilla que, al crear una
 * orden, se concatenan para generar el timeline inicial (ver work-order.service).
 */

/**
 * Tope de la galería por servicio. Es una galería de MARKETING, no un archivo:
 * 8 alcanza para mostrar variedad real (proceso + resultados) sin volverse un
 * dump de fotos — y es el mismo tope que ya usa el portfolio del home (máx 8
 * obras en WorkStack). Se valida server-side; la UI solo acomoda el picker.
 */
export const MAX_SERVICE_IMAGES = 8;

export async function listServices(includeHidden = false) {
  return prisma.service.findMany({
    where: includeHidden ? undefined : { visible: true },
    include: {
      flow: { orderBy: { sortOrder: "asc" } },
      // Solo la portada: es lo único que necesitan las cards (pública y admin).
      images: { where: { isCover: true }, take: 1 },
      _count: { select: { images: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getServiceWithFlow(serviceId: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      flow: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!service) throw new Error("Servicio no encontrado");
  return service;
}

/** Servicio por slug para la página pública de detalle. null si no existe. */
export async function getServiceBySlug(slug: string) {
  return prisma.service.findUnique({
    where: { slug },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
}

/**
 * Alta de servicio. Arranca SIEMPRE con un paso inicial "Vehículo ingresado"
 * (etapa INGRESO) — es el paso que luego se deduplica al concatenar flujos.
 */
export async function createService(data: {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  visible?: boolean;
}) {
  const last = await prisma.service.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (last?.sortOrder ?? -1) + 1;

  return prisma.service.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      imageUrl: data.imageUrl,
      visible: data.visible ?? true,
      sortOrder,
      flow: {
        create: {
          title: "Vehículo ingresado",
          description: "El vehículo ingresó al taller.",
          stage: "INGRESO",
          visible: true,
          custom: false,
          sortOrder: 0,
        },
      },
    },
    include: { flow: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function updateService(
  serviceId: string,
  data: {
    name?: string;
    description?: string;
    imageUrl?: string;
    visible?: boolean;
  }
) {
  return prisma.service.update({
    where: { id: serviceId },
    data,
    include: { flow: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function deleteService(serviceId: string) {
  // onDelete: Cascade en FlowStep elimina los pasos asociados.
  return prisma.service.delete({ where: { id: serviceId } });
}

/** Reordena servicios (drag & drop de la web pública). */
export async function reorderServices(orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.service.update({ where: { id }, data: { sortOrder: index } })
    )
  );
  return listServices(true);
}

/** Reordena los pasos del flujo de un servicio. */
export async function reorderFlowSteps(
  serviceId: string,
  orderedStepIds: string[]
) {
  await prisma.$transaction(
    orderedStepIds.map((id, index) =>
      prisma.flowStep.update({ where: { id }, data: { sortOrder: index } })
    )
  );
  return getServiceWithFlow(serviceId);
}

/** Agrega un paso al flujo. Por defecto custom=true (intercalado a mano). */
export async function addFlowStep(
  serviceId: string,
  data: {
    title: string;
    description?: string;
    stage: OrderStage;
    visible?: boolean;
    custom?: boolean;
  }
) {
  const last = await prisma.flowStep.findFirst({
    where: { serviceId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (last?.sortOrder ?? -1) + 1;

  return prisma.flowStep.create({
    data: {
      serviceId,
      title: data.title,
      description: data.description,
      stage: data.stage,
      visible: data.visible ?? true,
      custom: data.custom ?? true,
      sortOrder,
    },
  });
}

/** Edita título/descripción/etapa/visibilidad de un paso (inline). */
export async function updateFlowStep(
  stepId: string,
  data: {
    title?: string;
    description?: string;
    stage?: OrderStage;
    visible?: boolean;
  }
) {
  return prisma.flowStep.update({ where: { id: stepId }, data });
}

export async function deleteFlowStep(stepId: string) {
  return prisma.flowStep.delete({ where: { id: stepId } });
}

// ============ Galería de imágenes del servicio (ServiceImage) ============

/**
 * Agrega N imágenes al final de la galería. Valida el tope server-side (no
 * confiar en la UI) y garantiza la invariante de portada: si el servicio no
 * tenía ninguna, la primera que entra queda como portada — todo en transacción.
 */
export async function addServiceImages(
  serviceId: string,
  images: { url: string; ref: string; alt?: string }[]
) {
  return prisma.$transaction(async (tx) => {
    const count = await tx.serviceImage.count({ where: { serviceId } });
    if (count + images.length > MAX_SERVICE_IMAGES) {
      throw new Error(
        `Máximo ${MAX_SERVICE_IMAGES} imágenes por servicio (hay ${count} y estás subiendo ${images.length}).`
      );
    }
    const hasCover =
      (await tx.serviceImage.count({ where: { serviceId, isCover: true } })) > 0;
    const last = await tx.serviceImage.findFirst({
      where: { serviceId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    let sortOrder = (last?.sortOrder ?? -1) + 1;

    const created = [];
    for (const [i, img] of images.entries()) {
      created.push(
        await tx.serviceImage.create({
          data: {
            serviceId,
            url: img.url,
            ref: img.ref,
            alt: img.alt ?? null,
            sortOrder: sortOrder++,
            isCover: !hasCover && i === 0,
          },
        })
      );
    }
    return created;
  });
}

/** Reordena la galería (drag del admin). Mismo patrón que reorderFlowSteps. */
export async function reorderServiceImages(serviceId: string, orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.serviceImage.update({
        // `serviceId` en el where: un id ajeno no puede reordenar otra galería.
        where: { id, serviceId },
        data: { sortOrder: index },
      })
    )
  );
}

/**
 * Invariante "a lo sumo UNA portada por servicio", garantizada acá (no en la
 * UI): transacción unset-all → set-one. El set valida pertenencia al servicio.
 */
export async function setServiceImageCover(serviceId: string, imageId: string) {
  await prisma.$transaction(async (tx) => {
    const image = await tx.serviceImage.findUnique({ where: { id: imageId } });
    if (!image || image.serviceId !== serviceId) {
      throw new Error("La imagen no pertenece a este servicio.");
    }
    await tx.serviceImage.updateMany({
      where: { serviceId },
      data: { isCover: false },
    });
    await tx.serviceImage.update({ where: { id: imageId }, data: { isCover: true } });
  });
}

/** Alt editable inline. El where compuesto hace de chequeo de pertenencia. */
export async function updateServiceImageAlt(
  serviceId: string,
  imageId: string,
  alt: string | null
) {
  const res = await prisma.serviceImage.updateMany({
    where: { id: imageId, serviceId },
    data: { alt },
  });
  if (res.count === 0) throw new Error("La imagen no pertenece a este servicio.");
}

/**
 * Borra la fila y devuelve la `ref` para que el action borre el asset DESPUÉS
 * (patrón asset-cleanup: DB primero, bucket después). Si la borrada era la
 * portada, promueve determinísticamente la de menor sortOrder restante — la
 * invariante nunca queda en "galería con imágenes y sin portada".
 */
export async function deleteServiceImage(serviceId: string, imageId: string) {
  return prisma.$transaction(async (tx) => {
    const image = await tx.serviceImage.findUnique({ where: { id: imageId } });
    if (!image || image.serviceId !== serviceId) {
      throw new Error("La imagen no pertenece a este servicio.");
    }
    await tx.serviceImage.delete({ where: { id: imageId } });
    if (image.isCover) {
      const next = await tx.serviceImage.findFirst({
        where: { serviceId },
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      });
      if (next) {
        await tx.serviceImage.update({ where: { id: next.id }, data: { isCover: true } });
      }
    }
    return { ref: image.ref };
  });
}

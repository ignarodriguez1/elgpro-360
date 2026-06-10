import { prisma } from "@/lib/prisma";
import type { OrderStage } from "@/generated/prisma/client";

/**
 * Servicio del catálogo + editor de flujo (FlowStep).
 * Cada Service tiene una secuencia ordenada de pasos plantilla que, al crear una
 * orden, se concatenan para generar el timeline inicial (ver work-order.service).
 */

export async function listServices(includeHidden = false) {
  return prisma.service.findMany({
    where: includeHidden ? undefined : { visible: true },
    include: { flow: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getServiceWithFlow(serviceId: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { flow: { orderBy: { sortOrder: "asc" } } },
  });
  if (!service) throw new Error("Servicio no encontrado");
  return service;
}

/**
 * Alta de servicio. Arranca SIEMPRE con un paso inicial "Vehículo ingresado"
 * (etapa INGRESO) — es el paso que luego se deduplica al concatenar flujos.
 */
export async function createService(data: {
  name: string;
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

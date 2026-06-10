import { sendStatusUpdateEmail, sendReadyForPickupEmail } from "@/lib/email";
import { markNotified } from "./status-update.service";
import { prisma } from "@/lib/prisma";

export async function notifyCustomerStatusUpdate(statusUpdateId: string) {
  const update = await prisma.workOrderStatusUpdate.findUnique({
    where: { id: statusUpdateId },
    include: {
      workOrder: {
        include: {
          vehicle: {
            include: {
              customer: { include: { user: true } },
            },
          },
        },
      },
    },
  });

  if (!update) throw new Error("Actualización no encontrada");
  if (!update.visibleToCustomer || !update.notifyCustomer) return;

  const customer = update.workOrder.vehicle.customer.user;
  const vehicle = update.workOrder.vehicle;

  await sendStatusUpdateEmail({
    to: customer.email,
    customerName: customer.name,
    vehicleName: `${vehicle.brand} ${vehicle.model}`,
    updateTitle: update.title,
    updateDescription: update.description,
    orderTitle: update.workOrder.title,
  });

  await markNotified(statusUpdateId);
}

export async function notifyReadyForPickup(workOrderId: string) {
  const order = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      vehicle: {
        include: {
          customer: { include: { user: true } },
        },
      },
    },
  });

  if (!order) throw new Error("Orden no encontrada");

  const customer = order.vehicle.customer.user;
  const vehicle = order.vehicle;

  await sendReadyForPickupEmail({
    to: customer.email,
    customerName: customer.name,
    vehicleName: `${vehicle.brand} ${vehicle.model}`,
    orderTitle: order.title,
  });
}

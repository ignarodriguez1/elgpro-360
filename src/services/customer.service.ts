import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { logAudit, type AuditActor } from "./audit.service";

function isKnownError(e: unknown, code: string): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === code;
}

export async function createCustomer(
  data: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
  },
  actor?: AuditActor
) {
  // Passwordless: el cliente se crea SIN credencial. La primera vez que quiera
  // entrar al portal, pide un código por email igual que cualquier login — no hay
  // invite ni set-password inicial.
  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: data.name,
          // Email normalizado a minúsculas: es la clave de login (OTP) y debe
          // matchear sin importar cómo se tipeó (iOS autocapitaliza la 1ra letra).
          email: data.email.trim().toLowerCase(),
          role: "CUSTOMER",
          customerProfile: {
            create: {
              phone: data.phone,
              notes: data.notes,
            },
          },
        },
        include: { customerProfile: true },
      });
      if (actor) {
        await logAudit(
          {
            actor,
            action: "CUSTOMER_CREATED",
            entity: "Customer",
            entityId: created.id,
            summary: `Cliente creado: ${data.name} (${data.email})`,
          },
          tx
        );
      }
      return created;
    });

    return user;
  } catch (e) {
    if (isKnownError(e, "P2002")) {
      throw new Error("Ya existe un usuario con ese email.");
    }
    throw e;
  }
}

export async function listCustomers(search?: string) {
  return prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      customerProfile: {
        include: {
          vehicles: {
            include: {
              workOrders: { where: { status: { in: ["PROCESO", "LISTO"] } }, take: 1 },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerById(
  customerId: string,
  requestingUserId: string,
  requestingRole: import("@/generated/prisma/client").Role
) {
  const user = await prisma.user.findUnique({
    where: { id: customerId },
    include: {
      customerProfile: {
        include: {
          vehicles: {
            include: {
              workOrders: {
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      },
    },
  });

  if (!user) throw new Error("Cliente no encontrado");

  if (requestingRole === "CUSTOMER" && requestingUserId !== customerId) {
    throw new Error("Sin permisos para ver este cliente");
  }

  return user;
}

export async function updateCustomer(
  customerId: string,
  data: { name?: string; phone?: string; notes?: string },
  actor?: AuditActor
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: customerId },
      include: { customerProfile: true },
    });

    if (!user || !user.customerProfile) {
      throw new Error("Cliente no encontrado");
    }

    if (data.name) {
      await tx.user.update({
        where: { id: customerId },
        data: { name: data.name },
      });
    }

    const profile = await tx.customerProfile.update({
      where: { id: user.customerProfile.id },
      data: {
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: { user: true },
    });

    if (actor) {
      await logAudit(
        {
          actor,
          action: "CUSTOMER_UPDATED",
          entity: "Customer",
          entityId: customerId,
          summary: `Cliente actualizado: ${profile.user.name}`,
          diff: { after: data },
        },
        tx
      );
    }

    return profile;
  });
}

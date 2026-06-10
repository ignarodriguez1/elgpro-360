import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
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
  const inviteToken = randomBytes(32).toString("hex");
  const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          role: "CUSTOMER",
          inviteToken,
          inviteExpiresAt,
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

    return { user, inviteToken };
  } catch (e) {
    if (isKnownError(e, "P2002")) {
      throw new Error("Ya existe un usuario con ese email.");
    }
    throw e;
  }
}

export async function activateCustomer(token: string, password: string) {
  const passwordHash = await hash(password, 12);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { inviteToken: token } });

    if (!user) throw new Error("Token inválido");
    if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
      throw new Error("Token expirado");
    }

    const updated = await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: new Date(),
        inviteToken: null,
        inviteExpiresAt: null,
      },
    });

    await logAudit(
      {
        actor: { id: user.id, email: user.email },
        action: "CUSTOMER_UPDATED",
        entity: "Customer",
        entityId: user.id,
        summary: "Cuenta de cliente activada",
      },
      tx
    );

    return updated;
  });
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

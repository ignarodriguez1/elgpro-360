/**
 * Crea (o actualiza) un usuario STAFF para probar el gating de roles.
 *   Correr:  npx tsx --env-file=.env prisma/make-staff.ts
 *   Login:   staff@elgpro.com / staff1234
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { buildDatabaseUrl } from "../src/lib/db-url";

const adapter = new PrismaPg(buildDatabaseUrl());
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await hash("staff1234", 12);
  const u = await prisma.user.upsert({
    where: { email: "staff@elgpro.com" },
    update: { role: "STAFF", passwordHash, name: "Operario Taller", emailVerified: new Date() },
    create: {
      email: "staff@elgpro.com",
      name: "Operario Taller",
      role: "STAFF",
      passwordHash,
      emailVerified: new Date(),
    },
  });
  console.log("STAFF listo:", u.email, u.role);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

// Runner one-off: siembra SOLO el portfolio en la DB actual (idempotente), sin
// re-ejecutar el seed completo (que fallaría por usuarios/únicos ya existentes).
//   npx tsx prisma/seed-portfolio.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedPortfolio } from "./portfolio-data";
import { buildDatabaseUrl } from "../src/lib/db-url";

const adapter = new PrismaPg(buildDatabaseUrl());
const prisma = new PrismaClient({ adapter });

seedPortfolio(prisma)
  .then((r) => console.log("🌱 Portfolio seed:", r))
  .catch((e) => {
    console.error("❌ Portfolio seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

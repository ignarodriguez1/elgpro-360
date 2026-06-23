import "dotenv/config";
import { defineConfig } from "prisma/config";
import { buildDatabaseUrl } from "./src/lib/db-url";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Migraciones: usar la conexión DIRECTA si está definida; si no, la de siempre.
    // Un pooler (pgbouncer) adelante no banca los locks de Prisma Migrate.
    url: process.env.DIRECT_URL || buildDatabaseUrl(),
  },
});

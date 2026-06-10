import "dotenv/config";
import { defineConfig } from "prisma/config";

function buildDatabaseUrl(): string {
  // Si hay un DATABASE_URL explícito, usarlo (ej. Neon/Supabase).
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  // Sino, armarlo a partir de las partes.
  const user = process.env.DB_USER || "elgpro";
  const password = process.env.DB_PASSWORD || "elgpro360";
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const name = process.env.DB_NAME || "elgpro360";

  return `postgresql://${user}:${password}@${host}:${port}/${name}?schema=public`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: buildDatabaseUrl(),
  },
});

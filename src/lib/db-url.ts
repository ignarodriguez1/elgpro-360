/**
 * Connection string de Postgres armada desde el entorno. Fuente ÚNICA para el
 * runtime (lib/prisma.ts), las migraciones (prisma.config.ts) y los scripts
 * (seeds). Sin credenciales por defecto en el código: vienen del entorno.
 */
export function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  // Sin DATABASE_URL, armar desde las partes (dev local). host/port tienen
  // defaults de convención; usuario / clave / DB NO — deben venir del entorno.
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const { DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
    throw new Error(
      "Falta DATABASE_URL, o las partes DB_USER / DB_PASSWORD / DB_NAME en el entorno."
    );
  }
  return `postgresql://${DB_USER}:${DB_PASSWORD}@${host}:${port}/${DB_NAME}?schema=public`;
}

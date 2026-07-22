/**
 * Backfill de slugs para los servicios existentes (Fase 2 del prompt de galería).
 *
 * Uso:
 *   node scripts/backfill-service-slugs.js            → SOLO LISTA el mapeo nombre → slug
 *   node scripts/backfill-service-slugs.js --confirm  → escribe los slugs listados
 *
 * Reglas:
 *  - slugify idéntico al de Tutorial (src/app/admin/tutoriales/actions.ts:19-27):
 *    minúsculas, NFD sin acentos, no-alfanumérico → "-", sin guiones en puntas,
 *    tope 80 chars, fallback "servicio".
 *  - Orden DETERMINISTA: sortOrder asc, createdAt asc, id asc. Ante dos nombres
 *    que colisionan ("Detail exterior" vs "Detail Exterior…"), el que va primero
 *    en ese orden se queda con el slug limpio y el siguiente recibe -2, -3…
 *    Correr el script dos veces da el mismo resultado.
 *  - Idempotente: servicios que YA tienen slug se saltean (no se pisan nunca).
 */
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const CONFIRM = process.argv.includes("--confirm");

// Espejo exacto de tutoriales/actions.ts:19-27.
function slugify(input) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const { DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
    throw new Error("Falta DATABASE_URL o las partes DB_* en el entorno.");
  }
  return `postgresql://${DB_USER}:${DB_PASSWORD}@${host}:${port}/${DB_NAME}?schema=public`;
}

async function main() {
  const db = new Client({ connectionString: buildDatabaseUrl() });
  await db.connect();

  const { rows: services } = await db.query(
    `SELECT id, name, slug FROM "Service" ORDER BY "sortOrder" ASC, "createdAt" ASC, id ASC`
  );

  const taken = new Set(services.map((s) => s.slug).filter(Boolean));
  const plan = [];
  for (const s of services) {
    if (s.slug) {
      plan.push({ nombre: s.name, slug: s.slug, estado: "ya tenía (no se toca)" });
      continue;
    }
    const root = slugify(s.name) || "servicio";
    let candidate = root;
    let n = 1;
    while (taken.has(candidate)) {
      n += 1;
      candidate = `${root}-${n}`;
    }
    taken.add(candidate);
    plan.push({ nombre: s.name, slug: candidate, estado: "NUEVO", id: s.id });
  }

  console.log(`Servicios: ${services.length} · a backfillear: ${plan.filter((p) => p.estado === "NUEVO").length}\n`);
  console.table(plan.map(({ nombre, slug, estado }) => ({ nombre, slug, estado })));

  const pending = plan.filter((p) => p.estado === "NUEVO");
  if (pending.length === 0) {
    console.log("\nNada para escribir: todos los servicios ya tienen slug.");
  } else if (!CONFIRM) {
    console.log("\nModo LISTADO (no se escribió nada). Para aplicar este mapeo:");
    console.log("  node scripts/backfill-service-slugs.js --confirm");
  } else {
    console.log("\n--confirm recibido: escribiendo…");
    for (const p of pending) {
      await db.query(`UPDATE "Service" SET slug = $1 WHERE id = $2 AND slug IS NULL`, [p.slug, p.id]);
      console.log(`  ✓ ${p.nombre} → ${p.slug}`);
    }
    console.log(`\nListo: ${pending.length} slugs escritos.`);
  }
  await db.end();
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});

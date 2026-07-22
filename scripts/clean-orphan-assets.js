/**
 * Limpieza de assets huérfanos del bucket GCS.
 *
 * Uso:
 *   node scripts/clean-orphan-assets.js            → SOLO LISTA los candidatos (default)
 *   node scripts/clean-orphan-assets.js --confirm  → borra los candidatos listados
 *
 * Cruce: objetos del bucket (prefijo elg-pro/) contra TODO lo referenciado en la
 * base — refs exactas (WorkOrderPhoto.publicId, PortfolioWork.beforeImageRef/
 * afterImageRef) + object names derivados de las URLs persistidas (imageUrl,
 * thumbnailUrl, beforeImageUrl, afterImageUrl, Service.imageUrl,
 * ProductRecommendation.imageUrl). Un objeto se considera huérfano solo si NO
 * aparece por NINGUNA de las dos vías.
 *
 * Seguridad:
 *  - El bucket a limpiar se valida contra el que usan las URLs de la base. Si el
 *    GCS_BUCKET_NAME del .env no coincide (drift conocido del entorno local),
 *    el script ABORTA en vez de listar/borrar en el bucket equivocado.
 *  - Sin --confirm no se borra nada, nunca.
 */
const path = require("path");
const { Client } = require("pg");
const { Storage } = require("@google-cloud/storage");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const CONFIRM = process.argv.includes("--confirm");
const PREFIX = "elg-pro/";

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

// Espeja la resolución de credenciales de src/lib/gcs.ts (script standalone).
function gcsCredentials() {
  const json = process.env.GCS_CREDENTIALS_JSON;
  if (json) {
    const parsed = JSON.parse(json);
    return { client_email: parsed.client_email, private_key: parsed.private_key };
  }
  const clientEmail = process.env.GCS_CLIENT_EMAIL;
  const privateKey = process.env.GCS_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    throw new Error("Faltan credenciales GCS (GCS_CREDENTIALS_JSON o GCS_CLIENT_EMAIL + GCS_PRIVATE_KEY).");
  }
  return { client_email: clientEmail, private_key: privateKey.replace(/\\n/g, "\n") };
}

/** https://storage.googleapis.com/<bucket>/<objectName> → { bucket, objectName } */
function parseGcsUrl(url) {
  const m = /^https:\/\/storage\.googleapis\.com\/([^/]+)\/(.+)$/.exec(url ?? "");
  return m ? { bucket: m[1], objectName: decodeURIComponent(m[2]) } : null;
}

async function main() {
  // 1) Todo lo referenciado en la base: refs exactas + URLs.
  const db = new Client({ connectionString: buildDatabaseUrl() });
  await db.connect();
  const { rows } = await db.query(`
    SELECT "publicId" AS ref, "imageUrl" AS url FROM "WorkOrderPhoto"
    UNION ALL SELECT NULL, "thumbnailUrl" FROM "WorkOrderPhoto" WHERE "thumbnailUrl" IS NOT NULL
    UNION ALL SELECT "beforeImageRef", "beforeImageUrl" FROM "PortfolioWork"
    UNION ALL SELECT "afterImageRef", "afterImageUrl" FROM "PortfolioWork"
    UNION ALL SELECT NULL, "imageUrl" FROM "Service" WHERE "imageUrl" IS NOT NULL
    UNION ALL SELECT NULL, "imageUrl" FROM "ProductRecommendation" WHERE "imageUrl" IS NOT NULL
  `);
  await db.end();

  const referenced = new Set();
  const urlBuckets = new Set();
  for (const r of rows) {
    if (r.ref) referenced.add(r.ref);
    const parsed = parseGcsUrl(r.url);
    if (parsed) {
      referenced.add(parsed.objectName);
      urlBuckets.add(parsed.bucket);
    }
  }

  // 2) Validar que el bucket del entorno es el que usan los datos reales.
  const envBucket = process.env.GCS_BUCKET_NAME;
  if (!envBucket) throw new Error("Falta GCS_BUCKET_NAME en el entorno.");
  if (urlBuckets.size > 0 && !urlBuckets.has(envBucket)) {
    console.error(
      `ABORTADO: GCS_BUCKET_NAME del entorno ("${envBucket}") no coincide con el bucket ` +
        `que referencian las URLs de la base (${[...urlBuckets].map((b) => `"${b}"`).join(", ")}). ` +
        `Corregí el .env antes de limpiar — este es el drift señalado en el informe (§A.2).`
    );
    process.exit(1);
  }

  // 3) Listar el bucket y cruzar.
  const storage = new Storage({ credentials: gcsCredentials() });
  const [files] = await storage.bucket(envBucket).getFiles({ prefix: PREFIX });

  const orphans = files.filter((f) => !referenced.has(f.name));
  const fmt = (f) => ({
    objeto: f.name,
    kb: Math.round(Number(f.metadata.size || 0) / 1024),
    tipo: f.metadata.contentType || "?",
    creado: String(f.metadata.timeCreated || "").slice(0, 10),
  });

  console.log(`Bucket: ${envBucket} · objetos bajo ${PREFIX}: ${files.length}`);
  console.log(`Referenciados en la base (refs + URLs): ${referenced.size}`);
  console.log(`Candidatos a huérfano: ${orphans.length}\n`);
  console.table(orphans.map(fmt));

  if (!CONFIRM) {
    console.log("\nModo LISTADO (no se borró nada). Para borrar estos objetos:");
    console.log("  node scripts/clean-orphan-assets.js --confirm");
    return;
  }

  console.log("\n--confirm recibido: borrando…");
  let ok = 0;
  for (const f of orphans) {
    try {
      await f.delete();
      ok++;
      console.log(`  ✓ borrado: ${f.name}`);
    } catch (e) {
      console.error(`  ✗ falló: ${f.name} — ${e.message}`);
    }
  }
  console.log(`\nBorrados ${ok}/${orphans.length}.`);
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});

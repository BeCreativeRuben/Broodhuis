/**
 * Zet retailproducten met een prijs van Marie's prijslijst actief.
 * Alleen UPDATE op bestaande slugs. Geen INSERT, geen migratie.
 *
 *   STORAGE_DATABASE_URL=... node scripts/activate-priced-retail.mjs
 */
import { createRequire } from "node:module";
import { existsSync } from "node:fs";

import { PRICE_NOTE, catalog } from "./retail-assortment.mjs";

const require = createRequire(import.meta.url);
const pg = existsSync("/tmp/pgclient/node_modules/pg/package.json")
  ? require("/tmp/pgclient/node_modules/pg")
  : require("pg");

/** slug → prijs in centen. Alleen deze rijen worden aangepast. */
const ACTIVATIONS = new Map([
  ["coca-cola-original", 250],
  ["inex-halfvolle-melk", 165],
  ["inex-volle-melk", 220],
  ["missault-beker-chocoladesaus", 295],
  ["missault-beker-karamel", 295],
  ["missault-ijsjes", 1680],
  ["missault-ijstaart-framboos-meringue", 2995],
  ["missault-ijstaart-rood-fruit", 3000],
  ["missault-ijstaart-passie", 2600],
  ["missault-portie-chocolade", 415],
  ["missault-portie-wit", 415],
  ["missault-portie-noten", 415],
]);

const RETAIL = ["thee", "dranken", "zuivel", "confituur", "snoepgoed", "ijs", "koffie"];

const updates = [];
for (const [slug, priceCents] of ACTIVATIONS) {
  const product = catalog.find((row) => row.slug === slug);
  if (!product) throw new Error(`Slug ontbreekt in het assortiment: ${slug}`);
  if (!product.active) throw new Error(`${slug} staat in de catalogus nog op inactief.`);
  if (product.priceCents !== priceCents) {
    throw new Error(`${slug} heeft ${product.priceCents} cent, verwacht ${priceCents}.`);
  }
  if (String(product.description).includes(PRICE_NOTE)) {
    throw new Error(`${slug} houdt de placeholder "${PRICE_NOTE}".`);
  }
  updates.push(product);
}

if (!process.env.STORAGE_DATABASE_URL) {
  throw new Error("STORAGE_DATABASE_URL ontbreekt.");
}

const client = new pg.Client({
  connectionString: process.env.STORAGE_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

await client.query("BEGIN");
try {
  const activated = [];
  for (const product of updates) {
    const result = await client.query(
      `UPDATE "Product"
          SET name = $2,
              description = $3,
              allergens = $4,
              "priceCents" = $5,
              unit = $6,
              "isActive" = true,
              "updatedAt" = NOW()
        WHERE slug = $1
        RETURNING slug, name, "priceCents", unit, "isActive"`,
      [
        product.slug,
        product.name,
        product.description,
        product.allergens,
        product.priceCents,
        product.unit,
      ],
    );
    if (result.rowCount !== 1) {
      throw new Error(`${product.slug}: ${result.rowCount} rijen bijgewerkt, verwacht 1.`);
    }
    activated.push(result.rows[0]);
  }

  const still = await client.query(
    `SELECT p.slug, p.name, p."priceCents", p."isActive"
       FROM "Product" p
       JOIN "Category" c ON c.id = p."categoryId"
      WHERE c.slug = ANY($1::text[])
        AND p."isActive" = false
      ORDER BY c."sortOrder", p.slug`,
    [RETAIL],
  );

  const activatedSlugs = new Set(activated.map((row) => row.slug));
  const leaked = still.rows.filter((row) => activatedSlugs.has(row.slug));
  if (leaked.length > 0) {
    throw new Error(`Nog inactief na update: ${leaked.map((row) => row.slug).join(", ")}`);
  }

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        activated,
        stillInactive: still.rows,
      },
      null,
      2,
    ),
  );
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
}

await client.end();

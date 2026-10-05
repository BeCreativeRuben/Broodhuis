/**
 * Prijzen die Marie doorgaf: BARÚ, Rabeko en OR TEA? Playful Pear.
 * Bestaande slugs worden geüpdatet. BARÚ-testzakjes worden toegevoegd
 * als ze nog geen rij hebben. Geen migratie.
 *
 *   STORAGE_DATABASE_URL=... BLOB_READ_WRITE_TOKEN=... node scripts/activate-marie-prices.mjs
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { PRICE_NOTE, catalog } from "./retail-assortment.mjs";

const require = createRequire("/tmp/pgclient/package.json");
const pg = require("/tmp/pgclient/node_modules/pg");
const { put } = require("/tmp/blobclient/node_modules/@vercel/blob");

/** slug → prijs in centen. Alleen deze rijen worden actief gezet. */
const ACTIVATIONS = new Map([
  ["or-tea-playful-pear-doosje", 499],
  ["rabeko-light-aardbei", 385],
  ["rabeko-light-zwarte-kers", 385],
  ["rabeko-light-pruim", 385],
  ["rabeko-light-abrikoos", 385],
  ["rabeko-light-framboos", 450],
  ["rabeko-light-bosvruchten", 385],
  ["baru-spiced-chai-latte", 795],
  ["baru-spiced-chai-latte-testzakje", 150],
  ["baru-vanilla-chai-latte", 795],
  ["baru-vanilla-chai-latte-testzakje", 150],
  ["baru-matcha-latte", 795],
  ["baru-matcha-latte-testzakje", 150],
  ["baru-pure-chocolade", 795],
  ["baru-pure-chocolade-testzakje", 150],
  ["baru-swirly-chocolade", 795],
  ["baru-swirly-chocolade-testzakje", 150],
  ["baru-pumpkin-spice-latte", 795],
  ["baru-pumpkin-spice-latte-testzakje", 150],
]);

const STAY_INACTIVE = [
  "torrefactory-moka",
  "torrefactory-espresso-bio",
  "chocoladetabletten",
  "fruitgelei",
  "missault-portie-framboos",
];

const photoDir = process.env.MARIE_PHOTO_DIR || "/tmp/marie2";

function newId() {
  return `c${Date.now().toString(36)}${randomBytes(8).toString("hex")}`;
}

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

if (!process.env.STORAGE_DATABASE_URL) throw new Error("STORAGE_DATABASE_URL ontbreekt.");

const client = new pg.Client({
  connectionString: process.env.STORAGE_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const slugs = updates.map((product) => product.slug);
const existing = await client.query(
  `SELECT slug, "sortOrder", "categoryId" FROM "Product" WHERE slug = ANY($1::text[])`,
  [slugs],
);
const existingBySlug = new Map(existing.rows.map((row) => [row.slug, row]));
const missing = updates.filter((product) => !existingBySlug.has(product.slug));
const unexpectedMissing = missing.filter((product) => !product.slug.endsWith("-testzakje"));
if (unexpectedMissing.length > 0) {
  throw new Error(
    `Deze producten staan niet in de database: ${unexpectedMissing.map((product) => product.slug).join(", ")}`,
  );
}

const otherBaru = await client.query(
  `SELECT slug FROM "Product"
    WHERE (slug ILIKE 'baru-%' OR name ILIKE '%barú%' OR name ILIKE '%baru%')
      AND NOT (slug = ANY($1::text[]))`,
  [slugs],
);
if (otherBaru.rows.length > 0) {
  throw new Error(
    `Onbekende BARÚ-producten: ${otherBaru.rows.map((row) => row.slug).join(", ")}`,
  );
}

const urls = new Map();
if (missing.length > 0) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN ontbreekt.");
  for (const product of missing) {
    const body = readFileSync(path.join(photoDir, `${product.photo}.webp`));
    const blob = await put(`products/marie/${product.photo}.webp`, body, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: "image/webp",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    urls.set(product.photo, blob.url);
  }
}

await client.query("BEGIN");
try {
  const activated = [];
  for (const product of updates) {
    if (!existingBySlug.has(product.slug)) continue;
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

  const category = await client.query(`SELECT id FROM "Category" WHERE slug = 'koffie'`);
  const categoryId = category.rows[0]?.id;
  if (missing.length > 0 && !categoryId) throw new Error("Categorie koffie ontbreekt.");

  for (const product of missing) {
    const siblingSlug = product.slug.replace(/-testzakje$/, "");
    const sibling = existingBySlug.get(siblingSlug);
    const sortOrder = sibling ? sibling.sortOrder + 5 : 200;
    const result = await client.query(
      `INSERT INTO "Product" (
        id, slug, name, description, ingredients, allergens, "priceCents", unit, "imageUrl",
        "categoryId", "trackStock", stock, "leadTimeDays", "isActive", "isFeatured", "sortOrder",
        "createdAt", "updatedAt", "fulfillmentModes", "allowInscription"
      ) VALUES (
        $1, $2, $3, $4, NULL, $5, $6, $7, $8,
        $9, false, 0, 0, true, false, $10,
        NOW(), NOW(), 'pickup,delivery', false
      )
      RETURNING slug, name, "priceCents", unit, "isActive"`,
      [
        newId(),
        product.slug,
        product.name,
        product.description,
        product.allergens,
        product.priceCents,
        product.unit,
        urls.get(product.photo),
        categoryId,
        sortOrder,
      ],
    );
    activated.push(result.rows[0]);
  }

  const stayed = await client.query(
    `SELECT slug, "isActive", "priceCents", description
       FROM "Product"
      WHERE slug = ANY($1::text[])
      ORDER BY slug`,
    [STAY_INACTIVE],
  );
  if (stayed.rows.length !== STAY_INACTIVE.length) {
    throw new Error("Niet alle producten die inactief moeten blijven zijn gevonden.");
  }
  for (const row of stayed.rows) {
    if (row.isActive) throw new Error(`${row.slug} is actief geworden.`);
    if (!String(row.description).includes(PRICE_NOTE)) {
      throw new Error(`${row.slug} heeft de placeholder niet meer.`);
    }
  }

  const coffee = await client.query(
    `SELECT slug, "isActive" FROM "Product"
      WHERE slug IN ('torrefactory-moka', 'torrefactory-espresso-bio')`,
  );
  if (coffee.rows.some((row) => row.isActive)) {
    throw new Error("Torrefactory is actief.");
  }

  await client.query("COMMIT");
  activated.sort((a, b) => a.slug.localeCompare(b.slug, "nl"));
  console.log(
    JSON.stringify(
      {
        activated,
        stillInactive: stayed.rows.map((row) => ({
          slug: row.slug,
          priceCents: row.priceCents,
          isActive: row.isActive,
        })),
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

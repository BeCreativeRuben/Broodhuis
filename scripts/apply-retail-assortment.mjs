/**
 * Zet het winkelassortiment in Neon en upload de packshots naar Vercel Blob.
 * Geen migratie: alleen INSERT in de bestaande Category- en Product-tabellen.
 *
 *   STORAGE_DATABASE_URL=... BLOB_READ_WRITE_TOKEN=... node scripts/apply-retail-assortment.mjs
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { catalog, categories } from "./retail-assortment.mjs";

const require = createRequire(import.meta.url);
const { put } = require("@vercel/blob");
const pg = require("pg");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const photoDir = process.env.MARIE_PHOTO_DIR || "/tmp/marie2";

function newId() {
  return `c${Date.now().toString(36)}${randomBytes(8).toString("hex")}`;
}

const slugs = catalog.map((product) => product.slug);
if (new Set(slugs).size !== slugs.length) {
  throw new Error("Dubbele slug in het retailassortiment.");
}

const photos = [...new Set(catalog.map((product) => product.photo))];

const client = new pg.Client({
  connectionString: process.env.STORAGE_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const urls = new Map();
for (const photo of photos) {
  const body = readFileSync(path.join(photoDir, `${photo}.webp`));
  const blob = await put(`products/marie/${photo}.webp`, body, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: "image/webp",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  urls.set(photo, blob.url);
}

const existing = await client.query(
  `SELECT slug FROM "Product" WHERE slug = ANY($1::text[])`,
  [slugs],
);
if (existing.rows.length > 0) {
  throw new Error(
    `Deze slugs bestaan al: ${existing.rows.map((row) => row.slug).join(", ")}`,
  );
}

await client.query("BEGIN");
try {
  const categoryIds = new Map();
  for (const category of categories) {
    const found = await client.query(`SELECT id FROM "Category" WHERE slug = $1`, [
      category.slug,
    ]);
    if (found.rows[0]) {
      categoryIds.set(category.slug, found.rows[0].id);
      continue;
    }
    const id = newId();
    await client.query(
      `INSERT INTO "Category"
        (id, slug, name, description, icon, "sortOrder", "isActive", "parentId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, true, NULL, NOW(), NOW())`,
      [id, category.slug, category.name, category.description, category.icon, category.sortOrder],
    );
    categoryIds.set(category.slug, id);
  }

  const sortByCategory = new Map();
  for (const product of catalog) {
    const sortOrder = sortByCategory.get(product.category) ?? 10;
    sortByCategory.set(product.category, sortOrder + 10);
    const id = newId();
    await client.query(
      `INSERT INTO "Product" (
        id, slug, name, description, ingredients, allergens, "priceCents", unit, "imageUrl",
        "categoryId", "trackStock", stock, "leadTimeDays", "isActive", "isFeatured", "sortOrder",
        "createdAt", "updatedAt", "fulfillmentModes", "allowInscription"
      ) VALUES (
        $1, $2, $3, $4, NULL, $5, $6, $7, $8,
        $9, false, 0, 0, $10, false, $11,
        NOW(), NOW(), 'pickup,delivery', false
      )`,
      [
        id,
        product.slug,
        product.name,
        product.description,
        product.allergens,
        product.priceCents,
        product.unit,
        urls.get(product.photo),
        categoryIds.get(product.category),
        product.active,
        sortOrder,
      ],
    );
  }
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
}

const active = catalog.filter((product) => product.active).length;
console.log(
  JSON.stringify(
    {
      categories: categories.length,
      products: catalog.length,
      active,
      inactive: catalog.length - active,
      photos: photos.length,
      blobPattern: "products/marie/{n}.webp",
    },
    null,
    2,
  ),
);

await client.end();

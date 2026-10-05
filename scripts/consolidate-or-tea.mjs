/**
 * Maakt van de losse OR TEA?-smaken twee producten (doosje en blik) met
 * een smaakkeuze, hetzelfde model als de taarten (ProductVariant).
 * Geen migratie: de tabel bestaat al.
 *
 *   STORAGE_DATABASE_URL=... node scripts/consolidate-or-tea.mjs
 */
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";

import { teaPacks } from "./retail-assortment.mjs";

const require = createRequire("/tmp/pgclient/package.json");
const pg = require("/tmp/pgclient/node_modules/pg");

function newId() {
  return `c${Date.now().toString(36)}${randomBytes(8).toString("hex")}`;
}

if (!process.env.STORAGE_DATABASE_URL) {
  throw new Error("STORAGE_DATABASE_URL ontbreekt.");
}

const client = new pg.Client({
  connectionString: process.env.STORAGE_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const category = await client.query(`SELECT id FROM "Category" WHERE slug = 'thee'`);
const categoryId = category.rows[0]?.id;
if (!categoryId) throw new Error("Categorie thee ontbreekt.");

await client.query("BEGIN");
try {
  const report = [];

  for (const pack of teaPacks) {
    const flavorSlugs = pack.flavors.map(([slug]) => slug);
    const flavors = await client.query(
      `SELECT slug, name, description, "imageUrl", "priceCents", unit, "isActive"
         FROM "Product"
        WHERE slug = ANY($1::text[])`,
      [flavorSlugs],
    );
    const bySlug = new Map(flavors.rows.map((row) => [row.slug, row]));
    const missing = flavorSlugs.filter((slug) => !bySlug.has(slug));
    if (missing.length > 0) {
      throw new Error(`${pack.slug}: smaken ontbreken: ${missing.join(", ")}`);
    }

    for (const [slug] of pack.flavors) {
      const row = bySlug.get(slug);
      if (row.priceCents !== pack.priceCents) {
        throw new Error(
          `${slug} kost ${row.priceCents} cent, het ${pack.unit} is ${pack.priceCents}.`,
        );
      }
    }

    const first = bySlug.get(pack.flavors[0][0]);
    const existing = await client.query(`SELECT id FROM "Product" WHERE slug = $1`, [
      pack.slug,
    ]);
    let productId = existing.rows[0]?.id;
    if (!productId) {
      productId = newId();
      await client.query(
        `INSERT INTO "Product" (
          id, slug, name, description, ingredients, allergens, "priceCents", unit, "imageUrl",
          "categoryId", "trackStock", stock, "leadTimeDays", "isActive", "isFeatured", "sortOrder",
          "createdAt", "updatedAt", "fulfillmentModes", "allowInscription"
        ) VALUES (
          $1, $2, $3, $4, NULL, '', $5, $6, $7,
          $8, false, 0, 0, true, false, $9,
          NOW(), NOW(), 'pickup,delivery', false
        )`,
        [
          productId,
          pack.slug,
          pack.name,
          pack.description,
          pack.priceCents,
          pack.unit,
          first.imageUrl,
          categoryId,
          pack.slug.endsWith("blik") ? 20 : 10,
        ],
      );
    } else {
      await client.query(
        `UPDATE "Product"
            SET name = $2,
                description = $3,
                "priceCents" = $4,
                unit = $5,
                "imageUrl" = $6,
                "isActive" = true,
                "updatedAt" = NOW()
          WHERE id = $1`,
        [
          productId,
          pack.name,
          pack.description,
          pack.priceCents,
          pack.unit,
          first.imageUrl,
        ],
      );
    }

    let sortOrder = 10;
    for (const [slug, label] of pack.flavors) {
      const optionsJson = JSON.stringify({ smaak: label });
      const current = await client.query(
        `SELECT id FROM "ProductVariant" WHERE "sourceSlug" = $1`,
        [slug],
      );
      if (current.rows[0]) {
        await client.query(
          `UPDATE "ProductVariant"
              SET "productId" = $2,
                  label = $3,
                  "optionsJson" = $4,
                  "priceCents" = $5,
                  unit = $6,
                  "sortOrder" = $7,
                  "isActive" = true
            WHERE id = $1`,
          [
            current.rows[0].id,
            productId,
            label,
            optionsJson,
            pack.priceCents,
            pack.unit,
            sortOrder,
          ],
        );
      } else {
        await client.query(
          `INSERT INTO "ProductVariant" (
            id, "productId", sku, "sourceSlug", label, "optionsJson",
            "priceCents", unit, "sortOrder", "isActive"
          ) VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, true)`,
          [
            newId(),
            productId,
            slug,
            label,
            optionsJson,
            pack.priceCents,
            pack.unit,
            sortOrder,
          ],
        );
      }
      sortOrder += 10;
    }

    await client.query(
      `UPDATE "Product"
          SET "isActive" = false, "updatedAt" = NOW()
        WHERE slug = ANY($1::text[])`,
      [flavorSlugs],
    );

    report.push({
      slug: pack.slug,
      name: pack.name,
      priceCents: pack.priceCents,
      unit: pack.unit,
      flavors: pack.flavors.map(([, label]) => label),
    });
  }

  const stillActive = await client.query(
    `SELECT slug FROM "Product"
      WHERE slug LIKE 'or-tea-%'
        AND slug NOT IN ('or-tea-doosje', 'or-tea-blik')
        AND "isActive" = true`,
  );
  if (stillActive.rows.length > 0) {
    throw new Error(
      `Nog actieve losse thee: ${stillActive.rows.map((row) => row.slug).join(", ")}`,
    );
  }

  await client.query("COMMIT");
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
}

await client.end();

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  GENERATED_PRODUCT_PHOTO_BY_SLUG,
  generatedProductPhoto,
  resolveProductPhoto,
  resolveVariantPhoto,
} from "../src/lib/generated-product-photos";

const REPLACEMENTS = [
  "croissant",
  "eclair",
  "lang-wit",
  "lange-rozijnenkoek",
  "ronde-rozijnenkoek",
  "mini-chocoladebroodje",
  "rijsttaart",
  "pistolet-grof",
  "pistolet-grof-maanzaad",
  "pistolet-grof-sesamzaad",
  "pistolet-kaiser",
  "pistolet-tijger",
  "pistolet-vita-plus",
  "pistolet-vloer",
  "pistolet-wit",
  "pistolet-wit-maanzaad",
  "pistolet-wit-sesamzaad",
];

const UNTOUCHED = [
  "sandwich",
  "zweeds-multigranen",
  "lang-wit-zoutarm",
  "print-voor-fototaart",
  "appelaere-33cl",
  "appelaere-75cl",
  "sinaasappelaere-33cl",
  "rabeko-confituur",
];

test("elke gegenereerde foto hoort bij één slug en bestaat op schijf", () => {
  const entries = Object.entries(GENERATED_PRODUCT_PHOTO_BY_SLUG);
  assert.equal(entries.length, 188);
  for (const [slug, url] of entries) {
    assert.equal(url, `/images/products/generated/${slug}.webp`);
    assert.equal(
      existsSync(path.join(process.cwd(), "public", url)),
      true,
      slug,
    );
  }
});

test("een gegenereerde foto wint van een gedeelde stand-in en vult een lege foto", () => {
  assert.equal(
    resolveProductPhoto("pistolet-wit", "/images/products/pistolets.jpg"),
    "/images/products/generated/pistolet-wit.webp",
  );
  assert.equal(
    resolveProductPhoto("lange-rozijnenkoek", "/images/products/rozijnenkoek.jpg"),
    "/images/products/generated/lange-rozijnenkoek.webp",
  );
  assert.equal(
    resolveProductPhoto("ronde-rozijnenkoek", "/images/products/rozijnenkoek.jpg"),
    "/images/products/generated/ronde-rozijnenkoek.webp",
  );
  assert.notEqual(
    resolveProductPhoto("lange-rozijnenkoek", null),
    resolveProductPhoto("ronde-rozijnenkoek", null),
  );
  assert.equal(
    resolveProductPhoto("aardbeientaart", null),
    "/images/products/generated/aardbeientaart.webp",
  );
  assert.equal(REPLACEMENTS.length, 17);
  for (const slug of REPLACEMENTS) {
    assert.equal(generatedProductPhoto(slug)?.endsWith(`/${slug}.webp`), true);
  }
});

test("een mini-variant toont niet langer de gedeelde stand-in", () => {
  assert.equal(
    resolveVariantPhoto(
      "pistolet-wit",
      "/images/products/pistolets.jpg",
      "pistolet-mini-wit",
      "/images/products/pistolets.jpg",
    ),
    "/images/products/generated/pistolet-wit.webp",
  );
  assert.equal(
    resolveVariantPhoto(
      "ronde-rozijnenkoek",
      "/images/products/rozijnenkoek.jpg",
      "mini-ronde-rozijnenkoek",
      "/images/products/rozijnenkoek.jpg",
    ),
    "/images/products/generated/ronde-rozijnenkoek.webp",
  );
  const brand = "https://pdkjehbfhzkvtawd.public.blob.vercel-storage.com/products/marie/62.webp";
  assert.equal(
    resolveVariantPhoto("appelaere-33cl", brand, "appelaere-75cl", brand),
    brand,
  );
});

test("merkfoto's en Marie's foto's blijven de databasefoto", () => {
  const brand = "https://pdkjehbfhzkvtawd.public.blob.vercel-storage.com/products/marie/62.webp";
  assert.equal(resolveProductPhoto("appelaere-33cl", brand), brand);
  assert.equal(
    resolveProductPhoto(
      "sandwich",
      "https://pdkjehbfhzkvtawd.public.blob.vercel-storage.com/products/marie/79.webp",
    ),
    "https://pdkjehbfhzkvtawd.public.blob.vercel-storage.com/products/marie/79.webp",
  );
  for (const slug of UNTOUCHED) {
    assert.equal(generatedProductPhoto(slug), null);
  }
  assert.equal(generatedProductPhoto("print-voor-fototaart"), null);
});

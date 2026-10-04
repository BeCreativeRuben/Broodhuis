/**
 * Loopt mee vóór `npm run dev` en tijdens `npm run build`.
 *
 * De productiecatalogus staat al in Neon. Dit script migreert die database
 * niet en seedt niet opnieuw zolang er producten zijn — anders zou het
 * startassortiment de echte producten overschrijven.
 *
 * De enige schema-aanpassing is een ontbrekende `Category.icon`-kolom. De
 * webshop leest die, de live database had ze laten vallen. De kolom is
 * nullable, dus bestaande categorieën blijven staan.
 */
import "dotenv/config";

import { execFileSync } from "node:child_process";

import {
  firstPostgresUrl,
  MIGRATION_DATABASE_ENV_KEYS,
  RUNTIME_DATABASE_ENV_KEYS,
} from "../src/lib/database-url";

function databaseUrl(): string | null {
  return (
    firstPostgresUrl(MIGRATION_DATABASE_ENV_KEYS) ??
    firstPostgresUrl(RUNTIME_DATABASE_ENV_KEYS)
  );
}

async function main() {
  const url = databaseUrl();
  if (!url) {
    console.warn(
      "[broodhuis] Geen Postgres-URL. Zet DATABASE_URL (postgresql://…) of koppel Neon (STORAGE_DATABASE_URL).",
    );
    if (process.env.npm_lifecycle_event === "predev") {
      process.exitCode = 1;
    }
    return;
  }

  const { createPrismaClient } = await import("../src/lib/prisma-client");
  const prisma = createPrismaClient(url);
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "icon" TEXT`,
    );
    const productCount = await prisma.product.count();
    console.log(
      `[broodhuis] Database bereikbaar, ${productCount} producten.`,
    );
    if (productCount === 0) {
      console.log("[broodhuis] Lege database, startassortiment laden…");
      execFileSync("npx", ["tsx", "prisma/seed.ts"], {
        stdio: "inherit",
        env: process.env,
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    "\n[broodhuis] De database is niet bereikbaar. Controleer STORAGE_DATABASE_URL of DATABASE_URL.\n",
  );
  console.error(error);
  process.exitCode = 1;
});

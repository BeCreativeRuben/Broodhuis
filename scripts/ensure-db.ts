/**
 * Loopt automatisch mee vóór `npm run dev` (npm-script "predev").
 *
 * Zorgt ervoor dat de database bestaat, de migraties toegepast zijn en er een
 * assortiment in staat. Zo werkt `npm install && npm run dev` meteen, zonder
 * dat je eerst handmatig moet migreren en seeden. Idempotent: bij een gevulde
 * database doet dit script niets.
 */
import "dotenv/config";

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

import { resolveDatabaseUrl, sqliteFilePath } from "../src/lib/database-url";

const databaseUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;

const filePath = sqliteFilePath(databaseUrl);
const isFreshSqlite = filePath !== null && !existsSync(filePath);

function run(command: string, args: string[]) {
  execFileSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });
}

function migrate() {
  try {
    run("npx", ["prisma", "migrate", "deploy"]);
  } catch {
    console.warn(
      "\n[broodhuis] `prisma migrate deploy` lukte niet, ik val terug op `prisma db push`.",
    );
    run("npx", ["prisma", "db", "push", "--skip-generate"]);
  }
}

async function countProducts(): Promise<number> {
  const { PrismaBetterSqlite3 } = await import(
    "@prisma/adapter-better-sqlite3"
  );
  const { PrismaClient } = await import("../src/generated/prisma/client");
  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
  });
  try {
    return await prisma.product.count();
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (isFreshSqlite) {
    console.log("[broodhuis] Nieuwe database, migraties toepassen…");
  }
  migrate();

  let productCount = 0;
  try {
    productCount = await countProducts();
  } catch (error) {
    console.warn(
      "[broodhuis] Kon het assortiment niet nakijken, ik probeer te seeden.",
      error instanceof Error ? error.message : error,
    );
  }

  if (productCount === 0) {
    console.log("[broodhuis] Leeg assortiment, seed uitvoeren…");
    run("npx", ["tsx", "prisma/seed.ts"]);
  }
}

main().catch((error) => {
  console.error(
    "\n[broodhuis] De database kon niet klaargezet worden. Probeer handmatig:\n" +
      "  npx prisma migrate deploy && npm run seed\n",
  );
  console.error(error);
  process.exitCode = 1;
});

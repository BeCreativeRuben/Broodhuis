import "server-only";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";
import { resolveDatabaseUrl } from "@/lib/database-url";

// Om later naar Postgres te gaan: vervang de adapter hieronder door
//   import { PrismaPg } from "@prisma/adapter-pg";
//   const adapter = new PrismaPg({ connectionString: databaseUrl });
// en zet `provider = "postgresql"` in prisma/schema.prisma.
//
// resolveDatabaseUrl() maakt van een relatief pad één absoluut pad, zodat de
// webshop, de migraties en de seed gegarandeerd hetzelfde bestand openen.
const databaseUrl = resolveDatabaseUrl();

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

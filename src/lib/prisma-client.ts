import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { resolveRuntimeDatabaseUrl } from "@/lib/database-url";

/**
 * Neon levert `sslmode=require`. `pg` behandelt dat vandaag als verify-full en
 * waarschuwt bij elke verbinding. We zetten SSL zelf aan en halen die
 * parameters uit de URL, zodat de logs niet vol waarschuwingen lopen.
 */
function poolConfig(connectionString: string) {
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true },
    max: 1,
    connectionTimeoutMillis: 10_000,
  };
}

/**
 * Eén verbinding per serverinstantie. Op Vercel is de schijf alleen-lezen;
 * Postgres (Neon) is de duurzame database. `max: 1` houdt het aantal
 * verbindingen per instantie klein.
 */
export function createPrismaClient(
  connectionString = resolveRuntimeDatabaseUrl(),
) {
  const adapter = new PrismaPg(poolConfig(connectionString));

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

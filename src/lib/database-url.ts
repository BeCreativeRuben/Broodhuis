import path from "node:path";

/**
 * Standaard: een SQLite-bestand in de prisma-map.
 * Zet DATABASE_URL in .env om een andere database te gebruiken.
 */
export const DEFAULT_DATABASE_URL = "file:./prisma/dev.db";

/**
 * De Prisma CLI, de seed en de Next.js-server starten allemaal vanuit de root
 * van het project, maar lossen relatieve paden niet noodzakelijk op dezelfde
 * manier op. Door hier één absoluut pad te maken, wijzen ze gegarandeerd naar
 * hetzelfde databasebestand.
 */
export function resolveDatabaseUrl(
  raw: string | undefined = process.env.DATABASE_URL,
): string {
  const url = raw && raw.trim() !== "" ? raw.trim() : DEFAULT_DATABASE_URL;
  if (!url.startsWith("file:")) return url;

  const filePath = url.slice("file:".length);
  if (filePath.startsWith("/")) return url;

  return `file:${path.resolve(process.cwd(), filePath)}`;
}

/** Absoluut pad naar het SQLite-bestand, of null bij een andere database. */
export function sqliteFilePath(url = resolveDatabaseUrl()): string | null {
  if (!url.startsWith("file:")) return null;
  return url.slice("file:".length);
}

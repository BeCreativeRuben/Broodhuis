/**
 * De webshop draait op Postgres. Op Vercel is dat de Neon-database die al aan
 * het project hangt (`neon-broodhuis`). Die koppeling zet de connection strings
 * met het voorvoegsel STORAGE_. Een `file:`-URL (het oude SQLite-bestand) wordt
 * genegeerd: op de serverless schijf bestaat die map niet, en een bestand daar
 * zou bestellingen ook niet bewaren.
 */

const POSTGRES_SCHEMES = ["postgres://", "postgresql://"] as const;

/** Gepoolde URL voor pagina's en server actions. */
export const RUNTIME_DATABASE_ENV_KEYS = [
  "STORAGE_DATABASE_URL",
  "STORAGE_POSTGRES_URL",
  "POSTGRES_URL",
  "DATABASE_URL",
] as const;

/**
 * Directe URL voor DDL. De pooler van Neon is niet de juiste verbinding voor
 * migraties. Ontbreekt die, dan gebruiken we dezelfde URL als de app.
 */
export const MIGRATION_DATABASE_ENV_KEYS = [
  "STORAGE_POSTGRES_URL_NON_POOLING",
  "STORAGE_DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL_UNPOOLED",
  "DIRECT_URL",
] as const;

/** Alleen zodat `prisma generate` zonder omgeving kan draaien. */
const GENERATE_PLACEHOLDER = "postgresql://127.0.0.1:5432/broodhuis";

export function isPostgresUrl(value: string | undefined | null): value is string {
  if (!value) return false;
  const trimmed = value.trim().toLowerCase();
  return POSTGRES_SCHEMES.some((scheme) => trimmed.startsWith(scheme));
}

export function firstPostgresUrl(
  keys: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  for (const key of keys) {
    const value = env[key];
    if (isPostgresUrl(value)) return value.trim();
  }
  return null;
}

export function resolveRuntimeDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const url = firstPostgresUrl(RUNTIME_DATABASE_ENV_KEYS, env);
  if (!url) {
    throw new Error(
      "Geen Postgres-verbinding. Op Vercel zet de Neon-koppeling STORAGE_DATABASE_URL. Lokaal zet je DATABASE_URL naar een postgresql://-URL.",
    );
  }
  return url;
}

export function resolveMigrationDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return (
    firstPostgresUrl(MIGRATION_DATABASE_ENV_KEYS, env) ??
    firstPostgresUrl(RUNTIME_DATABASE_ENV_KEYS, env) ??
    GENERATE_PLACEHOLDER
  );
}

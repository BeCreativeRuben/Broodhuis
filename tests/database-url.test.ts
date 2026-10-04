import assert from "node:assert/strict";
import test from "node:test";

import {
  firstPostgresUrl,
  isPostgresUrl,
  MIGRATION_DATABASE_ENV_KEYS,
  resolveMigrationDatabaseUrl,
  resolveRuntimeDatabaseUrl,
  RUNTIME_DATABASE_ENV_KEYS,
} from "../src/lib/database-url";

const neon = "postgresql://user:secret@ep.example/neondb?sslmode=require";
const other = "postgresql://user:secret@other.example/db";

test("een sqlite-pad is geen Postgres-URL", () => {
  assert.equal(isPostgresUrl("file:./prisma/dev.db"), false);
  assert.equal(isPostgresUrl("file:/tmp/broodhuis.db"), false);
  assert.equal(isPostgresUrl(""), false);
  assert.equal(isPostgresUrl(undefined), false);
  assert.equal(isPostgresUrl(neon), true);
  assert.equal(isPostgresUrl("postgres://localhost/broodhuis"), true);
});

test("de Neon-koppeling wint van een sqlite DATABASE_URL", () => {
  const env = {
    DATABASE_URL: "file:./prisma/dev.db",
    STORAGE_DATABASE_URL: neon,
  } as unknown as NodeJS.ProcessEnv;

  assert.equal(firstPostgresUrl(RUNTIME_DATABASE_ENV_KEYS, env), neon);
  assert.equal(resolveRuntimeDatabaseUrl(env), neon);
});

test("een postgres DATABASE_URL wordt gebruikt als Neon niet gekoppeld is", () => {
  const env = { DATABASE_URL: other } as unknown as NodeJS.ProcessEnv;
  assert.equal(resolveRuntimeDatabaseUrl(env), other);
});

test("zonder postgres-URL faalt de app duidelijk", () => {
  assert.throws(
    () => resolveRuntimeDatabaseUrl({} as NodeJS.ProcessEnv),
    /STORAGE_DATABASE_URL/,
  );
});

test("migraties verkiezen de directe Neon-URL", () => {
  const direct = "postgresql://user:secret@ep-direct.example/neondb";
  const env = {
    STORAGE_DATABASE_URL: neon,
    STORAGE_POSTGRES_URL_NON_POOLING: direct,
    DATABASE_URL: "file:./prisma/dev.db",
  } as unknown as NodeJS.ProcessEnv;

  assert.equal(firstPostgresUrl(MIGRATION_DATABASE_ENV_KEYS, env), direct);
  assert.equal(resolveMigrationDatabaseUrl(env), direct);
});

test("prisma generate heeft een placeholder zonder omgeving", () => {
  assert.equal(
    resolveMigrationDatabaseUrl({} as NodeJS.ProcessEnv),
    "postgresql://127.0.0.1:5432/broodhuis",
  );
});

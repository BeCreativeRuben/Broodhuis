import "dotenv/config";
import { defineConfig } from "prisma/config";

import { resolveMigrationDatabaseUrl } from "./src/lib/database-url";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Directe Neon-URL als die er is, anders de gepoolde URL.
    // Zonder omgeving blijft dit een lokale placeholder zodat `prisma generate`
    // (postinstall, CI) niet naar een database hoeft te verbinden.
    url: resolveMigrationDatabaseUrl(),
  },
});

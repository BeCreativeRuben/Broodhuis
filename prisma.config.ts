import "dotenv/config";
import { defineConfig } from "prisma/config";

import { resolveDatabaseUrl } from "./src/lib/database-url";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Zonder .env valt de webshop terug op prisma/dev.db, zodat
    // `npm install && npm run dev` meteen werkt.
    url: resolveDatabaseUrl(),
  },
});

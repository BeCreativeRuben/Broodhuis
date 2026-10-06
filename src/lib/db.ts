import "server-only";

import { createPrismaClient } from "@/lib/prisma-client";

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

function getClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * De client wordt pas geopend bij het eerste gebruik. Zo slaagt `next build`
 * op een machine zonder Postgres-URL (CI, verse clone): pagina's zijn
 * force-dynamic en raken de database pas bij een echte request.
 */
export const prisma: ReturnType<typeof createPrismaClient> = new Proxy(
  {} as ReturnType<typeof createPrismaClient>,
  {
    get(_target, prop) {
      const client = getClient();
      const value = Reflect.get(client, prop, client);
      return typeof value === "function" ? value.bind(client) : value;
    },
  },
);

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getDatabaseUrl() {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    const isSupabaseTransactionPooler =
      url.hostname.endsWith(".pooler.supabase.com") && url.port === "6543";

    if (isSupabaseTransactionPooler) {
      // Supavisor transaction mode does not support prepared statements.
      // Prisma disables them when pgbouncer=true is present.
      url.searchParams.set("pgbouncer", "true");

      // Keep each serverless instance conservative with DB connections.
      if (!url.searchParams.has("connection_limit")) {
        url.searchParams.set("connection_limit", "1");
      }
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

export function getDb() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return null;

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      },
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
    });
  }

  return globalForPrisma.prisma;
}

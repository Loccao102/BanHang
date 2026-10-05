import { PrismaClient } from "@prisma/client";
import { runLocalBin } from "./run-bin.mjs";

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://lsoul:lsoul_dev@localhost:5432/lsoul?schema=public"
};

runLocalBin("prisma", ["generate"], env);

const prisma = new PrismaClient({
  datasources: { db: { url: env.DATABASE_URL } }
});

try {
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector');
} finally {
  await prisma.$disconnect();
}

runLocalBin("prisma", ["db", "push"], env);
runLocalBin("tsx", ["prisma/seed.ts"], env);

console.log("\nPostgreSQL is ready with the full LSOUL dataset.");

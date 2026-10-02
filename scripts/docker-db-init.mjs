import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://lsoul:lsoul_dev@localhost:5432/lsoul?schema=public"
};

function run(args) {
  const result = spawnSync(npx, args, { stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(["prisma", "generate"]);
run(["prisma", "db", "push"]);

const prisma = new PrismaClient({
  datasources: { db: { url: env.DATABASE_URL } }
});

try {
  const [productCount, userCount] = await Promise.all([
    prisma.product.count(),
    prisma.user.count()
  ]);

  if (productCount === 0 && userCount === 0) {
    console.log("\nDatabase is empty. Seeding the LSOUL demo dataset...");
    await prisma.$disconnect();
    run(["tsx", "prisma/seed.ts"]);
  } else {
    console.log(`\nDatabase already contains data (products=${productCount}, users=${userCount}). Seed skipped.`);
    console.log("Schema is up to date and existing application data was preserved.");
  }
} finally {
  await prisma.$disconnect().catch(() => undefined);
}

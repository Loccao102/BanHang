import { PrismaClient } from "@prisma/client";
import { runLocalBin, runLocalBinSteps } from "./run-bin.mjs";

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://lsoul:lsoul_dev@localhost:5432/lsoul?schema=public"
};

async function waitForDatabase(databaseUrl, maxRetries = 30, delayMs = 1500) {
  let host = "postgres";
  let port = 5432;
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.hostname) host = parsed.hostname;
    if (parsed.port) port = Number(parsed.port);
  } catch {
    // Keep fallback defaults
  }

  const net = await import("node:net");
  for (let i = 1; i <= maxRetries; i++) {
    const reachable = await new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("error", () => {
        socket.destroy();
        resolve(false);
      });
      socket.once("timeout", () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, host);
    });

    if (reachable) {
      console.log(`Database server is reachable at ${host}:${port}.`);
      return;
    }

    console.log(`Waiting for database server at ${host}:${port}... (attempt ${i}/${maxRetries})`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(`Could not connect to database server at ${host}:${port} after ${maxRetries} attempts.`);
}

await waitForDatabase(env.DATABASE_URL);

runLocalBinSteps([
  ["prisma", ["generate"]],
  ["prisma", ["db", "push"]]
], env);

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
    runLocalBin("tsx", ["prisma/seed.ts"], env);
  } else {
    console.log(`\nDatabase already contains data (products=${productCount}, users=${userCount}). Seed skipped.`);
    console.log("Schema is up to date and existing application data was preserved.");
  }
} finally {
  await prisma.$disconnect().catch(() => undefined);
}

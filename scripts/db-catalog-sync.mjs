import { runLocalBinSteps } from "./run-bin.mjs";

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://lsoul:lsoul_dev@localhost:5432/lsoul?schema=public"
};

runLocalBinSteps([
  ["prisma", ["generate"]],
  ["prisma", ["db", "push"]],
  ["tsx", ["prisma/seed-catalog.ts"]]
], env);

console.log("\nSchema + catalog synchronized without resetting users, orders or behavior history.");

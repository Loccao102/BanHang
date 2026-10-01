import { spawnSync } from "node:child_process";

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://elane:elane_dev@localhost:5432/elane?schema=public"
};

for (const args of [
  ["prisma", "generate"],
  ["prisma", "db", "push", "--accept-data-loss"],
  ["tsx", "prisma/seed.ts"]
]) {
  const result = spawnSync(npx, args, { stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("\nPostgreSQL is ready with the full ÉLANE dataset.");

import { spawnSync } from "node:child_process";

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db" };
const result = spawnSync(npx, ["tsx", "prisma/seed.ts"], { stdio: "inherit", env });
if (result.status !== 0) process.exit(result.status ?? 1);

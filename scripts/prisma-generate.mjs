import { runLocalBin } from "./run-bin.mjs";

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://lsoul:lsoul_dev@localhost:5432/lsoul?schema=public"
};

const status = runLocalBin("prisma", ["generate"], env);
if (status !== 0) process.exit(status);

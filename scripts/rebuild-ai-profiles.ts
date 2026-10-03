import { PrismaClient } from "@prisma/client";
import { rebuildUserStyleProfile } from "../src/lib/server/style-learning";

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({ where: { role: "customer" }, select: { id: true, email: true } });
    for (const user of users) {
      const profile = await rebuildUserStyleProfile(prisma, user.id);
      console.log(`${user.email}: ${profile.eventCount} signals, confidence=${profile.confidence.toFixed(2)}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


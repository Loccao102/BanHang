import { PrismaClient } from "@prisma/client";
import { products } from "../src/lib/products";
import { toProductRow } from "../src/lib/server/product-db";

const prisma = new PrismaClient();

async function main() {
  for (const product of products) {
    const row = toProductRow(product);
    const { id, ...update } = row;

    await prisma.product.upsert({
      where: { id },
      create: row,
      update
    });

    const variants = product.variants ?? [];
    await prisma.productVariant.deleteMany({
      where: {
        productId: id,
        size: { notIn: variants.map((variant) => variant.size) }
      }
    });

    for (const variant of variants) {
      await prisma.productVariant.upsert({
        where: { productId_size: { productId: id, size: variant.size } },
        create: {
          productId: id,
          sku: variant.sku,
          size: variant.size,
          stock: variant.stock,
          active: variant.active
        },
        update: {
          sku: variant.sku,
          stock: variant.stock,
          active: variant.active
        }
      });
    }
  }

  const [all, ready, references] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { analyzerReady: true, active: true } }),
    prisma.product.count({ where: { sourceType: "vto-reference" } })
  ]);

  console.log(`Catalog synchronized: ${all} products / ${ready} analyzer-ready / ${references} VTO references.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

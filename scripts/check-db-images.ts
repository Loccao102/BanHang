import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();

async function main() {
  const prods = await prisma.product.findMany();
  console.log("Total products in DB:", prods.length);

  const missingImage: any[] = [];
  const fileNotFound: any[] = [];
  const missingImagesArray: any[] = [];

  for (const p of prods) {
    if (!p.image || p.image.trim() === "") {
      missingImage.push({ id: p.id, sku: p.sku, name: p.name });
    } else {
      const local = "public" + p.image;
      if (!fs.existsSync(local)) {
        fileNotFound.push({ id: p.id, sku: p.sku, name: p.name, image: p.image });
      }
    }

    const imagesArr = Array.isArray(p.images) ? (p.images as string[]) : [];
    if (imagesArr.length === 0) {
      missingImagesArray.push({ id: p.id, sku: p.sku });
    } else {
      for (const img of imagesArr) {
        if (!fs.existsSync("public" + img)) {
          fileNotFound.push({ id: p.id, sku: p.sku, field: "images[]", image: img });
        }
      }
    }
  }

  console.log("Missing image field count:", missingImage.length);
  if (missingImage.length > 0) {
    console.log("Missing image samples:", missingImage.slice(0, 10));
  }

  console.log("File not found on disk count:", fileNotFound.length);
  if (fileNotFound.length > 0) {
    console.log("File not found samples:", fileNotFound.slice(0, 10));
  }

  console.log("Missing images array count:", missingImagesArray.length);
}

main().finally(async () => {
  await prisma.$disconnect();
});

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UPDATES = [
  {
    skus: ["TP-LUXE-POPLIN-BLK"],
    url: "https://res.cloudinary.com/dbk2ncqss/image/upload/v1791366016/lsoul/products/shirt-poplin-luxe-black.jpg"
  },
  {
    skus: ["TP-LUXE-POPLIN-BLU"],
    url: "https://res.cloudinary.com/dbk2ncqss/image/upload/v1791366018/lsoul/products/shirt-poplin-luxe-blue.jpg"
  },
  {
    skus: ["TP-LUXE-POPLIN-WHT"],
    url: "https://res.cloudinary.com/dbk2ncqss/image/upload/v1791366020/lsoul/products/shirt-poplin-luxe-white.jpg"
  },
  {
    skus: ["PT-WIDE-PLEAT-BEI"],
    url: "https://res.cloudinary.com/dbk2ncqss/image/upload/v1791366021/lsoul/products/pants-wide-pleat-beige.jpg"
  },
  {
    skus: ["PT-WIDE-PLEAT-BLK"],
    url: "https://res.cloudinary.com/dbk2ncqss/image/upload/v1791366023/lsoul/products/pants-wide-pleat-black.jpg"
  },
  {
    skus: ["PT-WIDE-PLEAT-BRN"],
    url: "https://res.cloudinary.com/dbk2ncqss/image/upload/v1791366024/lsoul/products/pants-wide-pleat-brown.jpg"
  },
  {
    skus: ["PT-FLARE-DENIM-BLK"],
    url: "https://res.cloudinary.com/dbk2ncqss/image/upload/v1791366025/lsoul/products/pants-flare-midrise-black.jpg"
  },
  {
    skus: ["PT-FLARE-DENIM-BLU"],
    url: "https://res.cloudinary.com/dbk2ncqss/image/upload/v1791366026/lsoul/products/pants-flare-midrise-blue.jpg"
  },
  {
    skus: ["SK-TENNIS-PLEAT-BLK"],
    url: "https://res.cloudinary.com/dbk2ncqss/image/upload/v1791366027/lsoul/products/skirt-tennis-pleat-black.jpg"
  },
  {
    skus: ["SK-TENNIS-PLEAT-WHT"],
    url: "https://res.cloudinary.com/dbk2ncqss/image/upload/v1791366027/lsoul/products/skirt-tennis-pleat-white.jpg"
  },
  {
    skus: ["SK-TENNIS-PLEAT-GRY"],
    url: "https://res.cloudinary.com/dbk2ncqss/image/upload/v1791366028/lsoul/products/skirt-tennis-pleat-grey.jpg"
  },
  {
    skus: ["SK-SATIN-SLIT-BEI"],
    url: "https://res.cloudinary.com/dbk2ncqss/image/upload/v1791366029/lsoul/products/skirt-satin-slit-beige.jpg"
  },
  {
    skus: ["SK-SATIN-SLIT-BLK"],
    url: "https://res.cloudinary.com/dbk2ncqss/image/upload/v1791366029/lsoul/products/skirt-satin-slit-black.jpg"
  },
  {
    skus: ["DR-NOIR-SLIP-RED"],
    url: "https://res.cloudinary.com/dbk2ncqss/image/upload/v1791366031/lsoul/products/dress-noir-slip-red.jpg"
  }
];

async function main() {
  console.log("=== CẬP NHẬT DATABASE VỚI URL CLOUDINARY ===");
  for (const item of UPDATES) {
    const res = await prisma.product.updateMany({
      where: { sku: { in: item.skus } },
      data: {
        image: item.url,
        hoverImage: item.url,
        tryOnImage: item.url,
        images: [item.url]
      }
    });
    console.log(`[DB OK] ${item.skus.join(", ")} -> ${item.url} (${res.count} sản phẩm)`);
  }
}

main()
  .catch((e) => {
    console.error("Lỗi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

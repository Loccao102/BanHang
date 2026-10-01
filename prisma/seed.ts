import { PrismaClient } from "@prisma/client";
import { products } from "../src/lib/products";

const prisma = new PrismaClient();

const names = ["Minh Anh","Thu Hà","Ngọc Linh","Hoàng Nam","Quang Huy","Mai Chi","Hải Đăng","Khánh Vy","Đức Anh","Phương Thảo"];
const cities = ["Hà Nội","TP. Hồ Chí Minh","Hải Phòng","Đà Nẵng","Ninh Bình","Bắc Ninh"];
const statuses = ["processing","confirmed","shipping","completed","completed","completed"] as const;

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.storeSetting.deleteMany();

  await prisma.product.createMany({
    data: products.map((product) => ({
      id: product.id,
      sku: product.sku ?? product.id,
      name: product.name,
      subtitle: product.subtitle,
      category: product.category,
      type: product.type,
      gender: product.gender,
      price: product.price,
      oldPrice: product.oldPrice ?? null,
      color: product.color,
      colorFamily: product.colorFamily,
      sizes: JSON.stringify(product.sizes),
      stock: product.stock,
      image: product.image,
      images: JSON.stringify(product.images),
      style: JSON.stringify(product.style),
      occasion: JSON.stringify(product.occasion),
      material: product.material,
      fit: product.fit,
      featured: Boolean(product.featured),
      isNew: Boolean(product.isNew),
      active: product.active !== false
    }))
  });

  await prisma.storeSetting.create({
    data: { key: "promoText", value: "FALL / WINTER 2026 · FREESHIP ĐƠN TỪ 699K · ĐỔI SIZE TRONG 7 NGÀY" }
  });

  for (let i = 0; i < 24; i += 1) {
    const itemCount = 1 + (i % 4);
    const selected = Array.from({ length: itemCount }, (_, j) => products[(i * 13 + j * 17) % products.length]);
    const items = selected.map((product, j) => ({
      product,
      quantity: 1 + ((i + j) % 2),
      size: product.sizes[(i + j) % product.sizes.length]
    }));
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const shipping = subtotal >= 699000 ? 0 : 30000;
    const discount = i % 7 === 0 ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal + shipping - discount;

    await prisma.order.create({
      data: {
        id: `EL26${String(1001 + i)}`,
        createdAt: new Date(Date.now() - i * 7_200_000),
        subtotal,
        shipping,
        discount,
        total,
        payment: i % 2 === 0 ? "qr" : "cod",
        status: statuses[i % statuses.length],
        customerName: names[i % names.length],
        phone: `09${String(10000000 + i * 7919).slice(-8)}`,
        address: `${12 + i} Phố Trung Tâm`,
        city: cities[i % cities.length],
        items: {
          create: items.map(({ product, quantity, size }) => ({
            productId: product.id,
            productName: product.name,
            productImage: product.image,
            productColor: product.color,
            productPrice: product.price,
            size,
            quantity
          }))
        }
      }
    });
  }

  console.log(`Seeded ${products.length} clothing products and 24 orders.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

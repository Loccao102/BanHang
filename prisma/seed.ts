import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { products } from "../src/lib/products";
import { hashPassword } from "../src/lib/server/password";

const prisma = new PrismaClient();

const customers = [
  { id: "usr-linh", email: "linh@elane.local", name: "Nguyễn Ngọc Linh", phone: "0912345678", city: "Hà Nội" },
  { id: "usr-nam", email: "nam@elane.local", name: "Trần Hoàng Nam", phone: "0987654321", city: "Hải Phòng" },
  { id: "usr-mai", email: "mai@elane.local", name: "Lê Mai Anh", phone: "0905123456", city: "Đà Nẵng" }
];

const names = ["Minh Anh","Thu Hà","Ngọc Linh","Hoàng Nam","Quang Huy","Mai Chi","Hải Đăng","Khánh Vy","Đức Anh","Phương Thảo"];
const cities = ["Hà Nội","TP. Hồ Chí Minh","Hải Phòng","Đà Nẵng","Ninh Bình","Bắc Ninh"];
const statuses = ["processing","confirmed","shipping","completed","completed","completed"] as const;

async function main() {
  await prisma.session.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.address.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
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

  const adminPassword = hashPassword("Admin@123456");
  const customerPassword = hashPassword("Elane@123456");

  await prisma.user.create({
    data: {
      id: "usr-admin",
      email: "admin@elane.local",
      passwordHash: adminPassword,
      name: "ÉLANE Admin",
      phone: "0900000000",
      role: "admin"
    }
  });

  for (const customer of customers) {
    await prisma.user.create({
      data: {
        id: customer.id,
        email: customer.email,
        passwordHash: customerPassword,
        name: customer.name,
        phone: customer.phone,
        role: "customer",
        addresses: {
          create: [
            {
              id: randomUUID(),
              label: "Nhà",
              recipientName: customer.name,
              phone: customer.phone,
              address: "28 Phố Trung Tâm",
              city: customer.city,
              isDefault: true
            },
            {
              id: randomUUID(),
              label: "Công ty",
              recipientName: customer.name,
              phone: customer.phone,
              address: "88 Đường Văn Phòng",
              city: customer.city,
              isDefault: false
            }
          ]
        }
      }
    });
  }

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
    const owner = i < 18 ? customers[i % customers.length] : null;

    await prisma.order.create({
      data: {
        id: `EL26${String(1001 + i)}`,
        userId: owner?.id ?? null,
        createdAt: new Date(Date.now() - i * 7_200_000),
        subtotal,
        shipping,
        discount,
        total,
        payment: i % 2 === 0 ? "qr" : "cod",
        status: statuses[i % statuses.length],
        customerName: owner?.name ?? names[i % names.length],
        phone: owner?.phone ?? `09${String(10000000 + i * 7919).slice(-8)}`,
        address: `${12 + i} Phố Trung Tâm`,
        city: owner?.city ?? cities[i % cities.length],
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

  for (let i = 0; i < customers.length; i += 1) {
    const user = customers[i];
    const wishlistProducts = products.slice(i * 5, i * 5 + 7);
    await prisma.wishlistItem.createMany({
      data: wishlistProducts.map((product) => ({ userId: user.id, productId: product.id }))
    });

    const cartProducts = products.slice(20 + i * 3, 23 + i * 3);
    await prisma.cartItem.createMany({
      data: cartProducts.map((product, j) => ({
        userId: user.id,
        productId: product.id,
        size: product.sizes[j % product.sizes.length] ?? "",
        quantity: 1
      }))
    });
  }

  console.log(`Seeded ${products.length} clothing products, 4 users, 6 addresses and 24 orders.`);
  console.log("Admin: admin@elane.local / Admin@123456");
  console.log("Customer: linh@elane.local / Elane@123456");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

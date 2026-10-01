import { PrismaClient } from "@prisma/client";
import { products } from "../src/lib/products";
import { hashPassword } from "../src/lib/server/password";

const prisma = new PrismaClient();

const customers = [
  { id: "usr-linh", email: "linh@lsoul.local", name: "Nguyễn Ngọc Linh", phone: "0912345678", city: "Hà Nội" },
  { id: "usr-nam", email: "nam@lsoul.local", name: "Trần Hoàng Nam", phone: "0987654321", city: "Hải Phòng" },
  { id: "usr-mai", email: "mai@lsoul.local", name: "Lê Mai Anh", phone: "0905123456", city: "Đà Nẵng" }
];

const guestNames = ["Minh Anh","Thu Hà","Ngọc Linh","Hoàng Nam","Quang Huy","Mai Chi","Hải Đăng","Khánh Vy","Đức Anh","Phương Thảo"];
const cities = ["Hà Nội","TP. Hồ Chí Minh","Hải Phòng","Đà Nẵng","Ninh Bình","Bắc Ninh"];
const statuses = ["processing","confirmed","shipping","completed","completed","completed"] as const;

async function reset() {
  await prisma.socialEvent.deleteMany();
  await prisma.socialPostProduct.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.review.deleteMany();
  await prisma.session.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.address.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.user.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.storeSetting.deleteMany();
}

async function main() {
  await reset();

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
      sizes: product.sizes,
      stock: product.stock,
      image: product.image,
      images: product.images,
      style: product.style,
      occasion: product.occasion,
      material: product.material,
      fit: product.fit,
      featured: Boolean(product.featured),
      isNew: Boolean(product.isNew),
      active: product.active !== false
    }))
  });

  await prisma.productVariant.createMany({
    data: products.flatMap((product) =>
      (product.variants ?? []).map((variant) => ({
        productId: product.id,
        sku: variant.sku,
        size: variant.size,
        stock: variant.stock,
        active: variant.active
      }))
    )
  });

  await prisma.coupon.createMany({
    data: [
      { code: "LSOUL10", type: "percentage", value: 10, minOrder: 700000, maxDiscount: 250000, active: true },
      { code: "WELCOME15", type: "percentage", value: 15, minOrder: 1000000, maxDiscount: 350000, usageLimit: 1000, active: true },
      { code: "SOCIAL20", type: "percentage", value: 20, minOrder: 1500000, maxDiscount: 500000, usageLimit: 500, active: true },
      { code: "STYLE200", type: "fixed", value: 200000, minOrder: 1800000, usageLimit: 300, active: true }
    ]
  });

  const adminPassword = hashPassword("Admin@123456");
  const customerPassword = hashPassword("Lsoul@123456");

  await prisma.user.create({
    data: {
      id: "usr-admin",
      email: "admin@lsoul.local",
      passwordHash: adminPassword,
      name: "LSOUL Admin",
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
              label: "Nhà",
              recipientName: customer.name,
              phone: customer.phone,
              address: "28 Phố Trung Tâm",
              city: customer.city,
              isDefault: true
            },
            {
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
    data: { key: "promoText", value: "NEW DROP · FREESHIP ĐƠN TỪ 699K · ĐỔI SIZE TRONG 7 NGÀY" }
  });

  const variants = await prisma.productVariant.findMany();
  const variantMap = new Map(variants.map((variant) => [`${variant.productId}::${variant.size}`, variant]));

  for (let i = 0; i < 24; i += 1) {
    const itemCount = 1 + (i % 4);
    const selected = Array.from({ length: itemCount }, (_, j) => products[(i * 13 + j * 17) % products.length]);
    const items = selected.map((product, j) => {
      const size = product.sizes[(i + j) % product.sizes.length];
      return { product, quantity: 1 + ((i + j) % 2), size, variant: variantMap.get(`${product.id}::${size}`) };
    });
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const couponCode = i % 8 === 0 ? "LSOUL10" : null;
    const discount = couponCode ? Math.min(Math.round(subtotal * 0.1), 250000) : 0;
    const shipping = subtotal >= 699000 ? 0 : 30000;
    const total = subtotal + shipping - discount;
    const owner = i < 18 ? customers[i % customers.length] : null;
    const status = statuses[i % statuses.length];

    await prisma.order.create({
      data: {
        id: `LS26${String(1001 + i)}`,
        userId: owner?.id ?? null,
        couponCode,
        createdAt: new Date(Date.now() - i * 7_200_000),
        subtotal,
        shipping,
        discount,
        total,
        payment: i % 2 === 0 ? "qr" : "cod",
        paymentStatus: i % 2 === 0 ? (status === "completed" ? "paid" : "pending") : "cod_pending",
        status,
        customerName: owner?.name ?? guestNames[i % guestNames.length],
        phone: owner?.phone ?? `09${String(10000000 + i * 7919).slice(-8)}`,
        address: `${12 + i} Phố Trung Tâm`,
        city: owner?.city ?? cities[i % cities.length],
        shippingCarrier: status === "shipping" || status === "completed" ? (i % 2 === 0 ? "GHN" : "GHTK") : null,
        trackingCode: status === "shipping" || status === "completed" ? `LSOUL${String(780001 + i)}` : null,
        items: {
          create: items.map(({ product, quantity, size, variant }) => ({
            productId: product.id,
            variantId: variant?.id ?? null,
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

  const reviewCandidates = await prisma.orderItem.findMany({
    where: { order: { status: "completed", userId: { not: null } } },
    include: { order: true },
    take: 60
  });
  const reviewed = new Set<string>();
  let reviewIndex = 0;
  for (const item of reviewCandidates) {
    if (!item.order.userId) continue;
    const key = `${item.order.userId}::${item.productId}`;
    if (reviewed.has(key)) continue;
    reviewed.add(key);
    const rating = [5, 5, 4, 5, 4][reviewIndex % 5];
    await prisma.review.create({
      data: {
        userId: item.order.userId,
        productId: item.productId,
        orderItemId: item.id,
        rating,
        title: rating === 5 ? "Lên dáng rất đẹp" : "Phom đẹp, nên chọn đúng size",
        content: rating === 5
          ? "Thiết kế tôn dáng, chất liệu ổn và lên hình rất đẹp. Mình sẽ mặc lại nhiều lần."
          : "Form ôm khá chuẩn. Mình khuyên xem kỹ bảng size nếu thích mặc thoải mái hơn.",
        images: [],
        verified: true,
        approved: true
      }
    });
    reviewIndex += 1;
    if (reviewIndex >= 24) break;
  }

  const socialSeeds = [
    { slug:"night-out-corset", platform:"instagram", authorName:"LSOUL", authorHandle:"@lsoul.officiel", caption:"Night-out silhouette: sculpted corset, low-rise denim and a sharp cropped layer.", image:products[0].image, likes:4820, comments:61, saves:1380, productIndexes:[0, 85, 65] },
    { slug:"soft-power-tailoring", platform:"instagram", authorName:"LSOUL", authorHandle:"@lsoul.officiel", caption:"Soft power tailoring — a cinched waist changes the entire proportion.", image:products[60].image, likes:3950, comments:48, saves:920, productIndexes:[60, 95] },
    { slug:"after-dark-mini", platform:"tiktok", authorName:"LSOUL", authorHandle:"@lsoul.officiel", caption:"After dark: mini lengths, clean lines, one statement silhouette.", image:products[120].image, likes:8910, comments:132, saves:2240, productIndexes:[120, 125] },
    { slug:"denim-date-look", platform:"instagram", authorName:"Mai Chi", authorHandle:"@maichi.style", caption:"Denim but make it date-night. The corset does all the work.", image:products[15].image, likes:940, comments:26, saves:188, productIndexes:[15, 90] },
    { slug:"wine-red-edit", platform:"instagram", authorName:"Khánh Vy", authorHandle:"@vywears", caption:"Wine red + a sculpted mini is my easiest dinner formula.", image:products[124].image, likes:1210, comments:31, saves:264, productIndexes:[124] },
    { slug:"office-to-dinner", platform:"tiktok", authorName:"LSOUL", authorHandle:"@lsoul.officiel", caption:"Office to dinner: tailored vest set, no outfit change required.", image:products[165].image, likes:6420, comments:87, saves:1710, productIndexes:[165] },
    { slug:"corset-layering", platform:"instagram", authorName:"Ngọc Linh", authorHandle:"@linhngoc", caption:"Layering a corset over a clean shirt gives the look more shape without feeling overdone.", image:products[5].image, likes:730, comments:18, saves:160, productIndexes:[5, 55] },
    { slug:"weekend-knit-set", platform:"instagram", authorName:"LSOUL", authorHandle:"@lsoul.officiel", caption:"A fitted knit set for slower weekends and last-minute plans.", image:products[155].image, likes:2840, comments:39, saves:680, productIndexes:[155] },
    { slug:"black-mini-uniform", platform:"tiktok", authorName:"Thu Hà", authorHandle:"@hathuwears", caption:"Black mini + blazer = repeat outfit I never get tired of.", image:products[121].image, likes:1660, comments:44, saves:350, productIndexes:[121, 61] },
    { slug:"flare-proportion", platform:"instagram", authorName:"LSOUL", authorHandle:"@lsoul.officiel", caption:"Fitted through the hip, long through the leg. Flare proportions for a sharper silhouette.", image:products[100].image, likes:3440, comments:42, saves:804, productIndexes:[100, 20] },
    { slug:"pink-corset-set", platform:"instagram", authorName:"Phương Thảo", authorHandle:"@thaophuong", caption:"The pink corset set is unapologetically feminine and that is exactly the point.", image:products[145].image, likes:1180, comments:29, saves:242, productIndexes:[145] },
    { slug:"city-night-edit", platform:"tiktok", authorName:"LSOUL", authorHandle:"@lsoul.officiel", caption:"City night edit: bodycon, leather and the confidence to wear both.", image:products[75].image, likes:10200, comments:166, saves:3060, productIndexes:[75, 125] }
  ];

  for (let i = 0; i < socialSeeds.length; i += 1) {
    const seed = socialSeeds[i];
    const userId = i === 3 ? "usr-mai" : i === 6 ? "usr-linh" : null;
    await prisma.socialPost.create({
      data: {
        slug: seed.slug,
        userId,
        platform: seed.platform,
        authorName: seed.authorName,
        authorHandle: seed.authorHandle,
        caption: seed.caption,
        image: seed.image,
        status: "approved",
        likes: seed.likes,
        comments: seed.comments,
        saves: seed.saves,
        publishedAt: new Date(Date.now() - i * 86_400_000),
        products: {
          create: seed.productIndexes.map((productIndex, sortOrder) => ({
            productId: products[productIndex].id,
            sortOrder
          }))
        }
      }
    });
  }

  console.log(`Seeded ${products.length} LSOUL clothing products with size variants.`);
  console.log("Seeded 4 users, coupons, reviews, social posts and 24 orders.");
  console.log("Admin: admin@lsoul.local / Admin@123456");
  console.log("Customer: linh@lsoul.local / Lsoul@123456");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

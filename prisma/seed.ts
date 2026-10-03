import { PrismaClient, type BehaviorEventType } from "@prisma/client";
import { products } from "../src/lib/products";
import { hashPassword } from "../src/lib/server/password";
import { recordBehaviorEvent, rebuildUserStyleProfile } from "../src/lib/server/style-learning";

const prisma = new PrismaClient();

const customers = [
  { id: "usr-linh", email: "linh@lsoul.local", name: "Nguyễn Ngọc Linh", phone: "0912345678", city: "Hà Nội" },
  { id: "usr-nam", email: "nam@lsoul.local", name: "Trần Hoàng Nam", phone: "0987654321", city: "Hải Phòng" },
  { id: "usr-mai", email: "mai@lsoul.local", name: "Lê Mai Anh", phone: "0905123456", city: "Đà Nẵng" }
];

const realProducts = products.filter((product) => product.analyzerReady !== false && product.sourceType !== "vto-reference");
const bySku = new Map(products.map((product) => [product.sku!, product]));

async function reset() {
  await prisma.paymentTransaction.deleteMany();
  await prisma.aIRecommendation.deleteMany();
  await prisma.outfitAssessment.deleteMany();
  await prisma.tryOnSession.deleteMany();
  await prisma.productAffinity.deleteMany();
  await prisma.userBehaviorEvent.deleteMany();
  await prisma.userStyleProfile.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatConversation.deleteMany();
  await prisma.socialEvent.deleteMany();
  await prisma.socialPostProduct.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.session.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.address.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.storeSetting.deleteMany();
}

async function seedProducts() {
  await prisma.product.createMany({
    data: products.map((product) => ({
      id: product.id,
      sku: product.sku ?? product.id,
      groupCode: product.groupCode ?? null,
      name: product.name,
      subtitle: product.subtitle,
      category: product.category,
      type: product.type,
      gender: product.gender,
      price: product.price,
      oldPrice: product.oldPrice ?? null,
      color: product.color,
      colorFamily: product.colorFamily,
      colorHex: product.colorHex ?? null,
      sizes: product.sizes,
      stock: product.stock,
      stockTracked: product.stockTracked !== false,
      image: product.image,
      images: product.images,
      style: product.style,
      occasion: product.occasion,
      material: product.material,
      fit: product.fit,
      featured: Boolean(product.featured),
      isNew: Boolean(product.isNew),
      active: product.active !== false,
      sourceUrl: product.sourceUrl ?? null,
      sourceUpdatedAt: product.sourceUpdatedAt ? new Date(product.sourceUpdatedAt) : null,
      sourceType: product.sourceType ?? "demo",
      tryOnCategory: product.tryOnCategory ?? null,
      tryOnPhotoType: product.tryOnPhotoType ?? null,
      tryOnImage: product.tryOnImage ?? null,
      silhouette: product.silhouette ?? null,
      lengthClass: product.lengthClass ?? null,
      neckline: product.neckline ?? null,
      sleeveLength: product.sleeveLength ?? null,
      pattern: product.pattern ?? null,
      season: product.season ?? [],
      formality: product.formality ?? 2,
      warmth: product.warmth ?? 2,
      stretch: product.stretch ?? 2,
      coverage: product.coverage ?? 2,
      colorTemperature: product.colorTemperature ?? null,
      hoverImage: product.hoverImage ?? product.images?.[1] ?? product.image,
      waistRise: product.waistRise ?? (/low-rise|cạp thấp/i.test(product.fit) ? "low" : null),
      recommendedUndertones: product.recommendedUndertones ?? (
        product.colorTemperature === "warm" ? ["warm", "neutral"] :
        product.colorTemperature === "cool" ? ["cool", "neutral"] :
        ["warm", "cool", "neutral"]
      ),
      bodyShapeCompatibility: product.bodyShapeCompatibility ?? [],
      pairingTags: product.pairingTags ?? product.styleKeywords ?? product.style,
      avoidPairingTags: product.avoidPairingTags ?? [],
      visualWeight: product.visualWeight ?? Math.max(1, Math.min(5, product.formality ?? 3)),
      volume: product.volume ?? (/wide|flare|tiered|babydoll|ruffle|xòe/i.test([product.fit, product.silhouette].filter(Boolean).join(" ")) ? "voluminous" : /slim|bodycon|corset|fitted|ôm/i.test([product.fit, product.silhouette].filter(Boolean).join(" ")) ? "fitted" : "balanced"),
      styleKeywords: product.styleKeywords ?? product.style,
      aiSearchText: product.aiSearchText ?? "",
      analyzerReady: product.analyzerReady ?? false
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
}

async function seedAccounts() {
  const adminPassword = hashPassword("Admin@123456");
  const customerPassword = hashPassword("Lsoul@123456");

  await prisma.user.create({
    data: { id: "usr-admin", email: "admin@lsoul.local", passwordHash: adminPassword, name: "LSOUL Admin", phone: "0900000000", role: "admin" }
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
            { label: "Nhà", recipientName: customer.name, phone: customer.phone, address: "28 Phố Trung Tâm", city: customer.city, isDefault: true },
            { label: "Công ty", recipientName: customer.name, phone: customer.phone, address: "88 Đường Văn Phòng", city: customer.city, isDefault: false }
          ]
        }
      }
    });
  }
}

async function seedCommerce() {
  await prisma.coupon.createMany({
    data: [
      { code: "LSOUL10", type: "percentage", value: 10, minOrder: 700000, maxDiscount: 250000, active: true },
      { code: "WELCOME15", type: "percentage", value: 15, minOrder: 1000000, maxDiscount: 350000, usageLimit: 1000, active: true },
      { code: "STYLE20", type: "percentage", value: 20, minOrder: 1800000, maxDiscount: 500000, usageLimit: 500, active: true },
      { code: "AI200", type: "fixed", value: 200000, minOrder: 1800000, usageLimit: 300, active: true }
    ]
  });

  await prisma.storeSetting.createMany({
    data: [
      { key: "promoText", value: "HÀNG MỚI · MIỄN PHÍ GIAO HÀNG TỪ 699K · ĐỔI CỠ TRONG 7 NGÀY" },
      { key: "catalogMode", value: "sourced-demo-2026-10" },
      { key: "aiLearningMode", value: "behavior-profile-v1" }
    ]
  });

  const dbVariants = await prisma.productVariant.findMany();
  const variantMap = new Map(dbVariants.map((variant) => [`${variant.productId}::${variant.size}`, variant]));
  const statuses = ["completed", "completed", "shipping", "confirmed", "processing"] as const;

  for (let i = 0; i < 18; i += 1) {
    const owner = customers[i % customers.length];
    const itemCount = i % 4 === 0 ? 2 : 1;
    const selected = Array.from({ length: itemCount }, (_, j) => realProducts[(i + j * 2) % realProducts.length]);
    const items = selected.map((product, j) => {
      const size = product.sizes[(i + j) % product.sizes.length] ?? "M";
      return { product, size, variant: variantMap.get(`${product.id}::${size}`) };
    });
    const subtotal = items.reduce((sum, item) => sum + item.product.price, 0);
    const shipping = subtotal >= 699000 ? 0 : 30000;
    const status = statuses[i % statuses.length];
    const payment = i % 2 === 0 ? "qr" : "cod";
    const paymentStatus = status === "completed" && payment === "qr" ? "paid" : payment === "cod" ? "cod_pending" : "pending";

    await prisma.order.create({
      data: {
        id: `LS26DEMO${String(i + 1).padStart(3, "0")}`,
        userId: owner.id,
        createdAt: new Date(Date.now() - i * 36 * 60 * 60 * 1000),
        subtotal,
        shipping,
        discount: 0,
        total: subtotal + shipping,
        payment,
        paymentStatus,
        status,
        customerName: owner.name,
        phone: owner.phone,
        address: `${20 + i} Phố Trung Tâm`,
        city: owner.city,
        shippingCarrier: status === "shipping" || status === "completed" ? (i % 2 === 0 ? "GHN" : "GHTK") : null,
        trackingCode: status === "shipping" || status === "completed" ? `LSOULDEMO${1000 + i}` : null,
        paidAt: paymentStatus === "paid" ? new Date(Date.now() - i * 32 * 60 * 60 * 1000) : null,
        items: {
          create: items.map(({ product, size, variant }) => ({
            productId: product.id,
            variantId: variant?.id ?? null,
            productName: product.name,
            productImage: product.image,
            productColor: product.color,
            productPrice: product.price,
            size,
            quantity: 1
          }))
        }
      }
    });
  }

  const wishlistByUser: Record<string, string[]> = {
    "usr-linh": ["DR-AURA-MAXI-BLK", "DR-AURA-MAXI-RED", "DR-NOIR-SLIP-BLK"],
    "usr-nam": ["PT-ATELIER-WIDE-BLK", "BZ-MINIMAL-SUIT-BLK", "TP-VESPER-CORSET-BLK"],
    "usr-mai": ["TP-VESPER-CORSET-BLK", "SK-TENNIS-PLEAT-BLK", "SK-TENNIS-PLEAT-WHT"]
  };

  for (const customer of customers) {
    const selected = (wishlistByUser[customer.id] ?? [])
      .map((sku) => bySku.get(sku))
      .filter((product): product is (typeof products)[number] => Boolean(product));

    await prisma.wishlistItem.createMany({
      data: selected.map((product) => ({ userId: customer.id, productId: product.id }))
    });

    await prisma.cartItem.createMany({
      data: selected.slice(0, 2).map((product, index) => ({
        userId: customer.id,
        productId: product.id,
        size: product.sizes[index % product.sizes.length] ?? "M",
        quantity: 1
      }))
    });
  }
}


type PersonaEvent = { type: BehaviorEventType; sku: string; repeat?: number; weight?: number };

const personas: Record<string, PersonaEvent[]> = {
  "usr-linh": [
    { type: "product_view", sku: "DR-AURA-MAXI-BLK", repeat: 4 },
    { type: "wishlist_add", sku: "DR-AURA-MAXI-BLK" },
    { type: "tryon_success", sku: "DR-AURA-MAXI-BLK" },
    { type: "recommendation_accept", sku: "DR-AURA-MAXI-BLK" },
    { type: "product_view", sku: "DR-NOIR-SLIP-BLK", repeat: 3 },
    { type: "wishlist_add", sku: "DR-NOIR-SLIP-BLK" },
    { type: "cart_add", sku: "DR-NOIR-SLIP-BLK" },
    { type: "product_view", sku: "DR-AURA-MAXI-RED", repeat: 2 },
    { type: "wishlist_add", sku: "DR-AURA-MAXI-RED" },
    { type: "recommendation_reject", sku: "PT-ATELIER-WIDE-BLK" }
  ],
  "usr-nam": [
    { type: "product_view", sku: "PT-ATELIER-WIDE-BLK", repeat: 5 },
    { type: "wishlist_add", sku: "PT-ATELIER-WIDE-BLK" },
    { type: "tryon_success", sku: "PT-ATELIER-WIDE-BLK" },
    { type: "cart_add", sku: "PT-ATELIER-WIDE-BLK" },
    { type: "product_view", sku: "BZ-MINIMAL-SUIT-BLK", repeat: 4 },
    { type: "wishlist_add", sku: "BZ-MINIMAL-SUIT-BLK" },
    { type: "recommendation_accept", sku: "BZ-MINIMAL-SUIT-BLK" },
    { type: "product_view", sku: "TP-VESPER-CORSET-BLK", repeat: 3 },
    { type: "wishlist_add", sku: "TP-VESPER-CORSET-BLK" },
    { type: "recommendation_reject", sku: "DR-AURA-MAXI-RED" }
  ],
  "usr-mai": [
    { type: "product_view", sku: "TP-VESPER-CORSET-BLK", repeat: 4 },
    { type: "wishlist_add", sku: "TP-VESPER-CORSET-BLK" },
    { type: "tryon_success", sku: "TP-VESPER-CORSET-BLK" },
    { type: "cart_add", sku: "TP-VESPER-CORSET-BLK" },
    { type: "product_view", sku: "SK-TENNIS-PLEAT-BLK", repeat: 4 },
    { type: "wishlist_add", sku: "SK-TENNIS-PLEAT-BLK" },
    { type: "tryon_success", sku: "SK-TENNIS-PLEAT-BLK" },
    { type: "recommendation_accept", sku: "SK-TENNIS-PLEAT-BLK" },
    { type: "product_view", sku: "SK-TENNIS-PLEAT-WHT", repeat: 2 },
    { type: "wishlist_add", sku: "SK-TENNIS-PLEAT-WHT" }
  ]
};

async function seedLearning() {
  for (const [userId, events] of Object.entries(personas)) {
    for (const event of events) {
      const product = bySku.get(event.sku);
      if (!product) continue;
      for (let i = 0; i < (event.repeat ?? 1); i += 1) {
        await recordBehaviorEvent({
          db: prisma,
          userId,
          productId: product.id,
          type: event.type,
          source: "seed-demo",
          weight: event.weight,
          metadata: { personaSeed: true, repetition: i + 1 }
        });
      }
    }
    await rebuildUserStyleProfile(prisma, userId);
  }

  await prisma.tryOnSession.createMany({
    data: [
      {
        userId: "usr-linh",
        personImageHash: "demo-person-hash-linh",
        productIds: [bySku.get("DR-AURA-MAXI-BLK")!.id],
        categorySequence: ["one-pieces"],
        status: "completed",
        accepted: true,
        rating: 5
      },
      {
        userId: "usr-mai",
        personImageHash: "demo-person-hash-mai",
        productIds: [bySku.get("TP-VESPER-CORSET-BLK")!.id, bySku.get("SK-TENNIS-PLEAT-BLK")!.id],
        categorySequence: ["tops", "bottoms"],
        status: "completed",
        accepted: true,
        rating: 4
      }
    ]
  });
}

async function main() {
  await reset();
  await seedProducts();
  await seedAccounts();
  await seedCommerce();
  await seedLearning();

  console.log("\nLSOUL demo dataset seeded successfully.");
  console.log(`Products: ${products.length} total / ${realProducts.length} analyzer-ready / ${products.length - realProducts.length} VTO reference`);
  console.log("AI profiles: 3 seeded personas with behavior history.");
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

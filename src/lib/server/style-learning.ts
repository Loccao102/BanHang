import type { BehaviorEventType, Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export const behaviorWeights: Record<BehaviorEventType, number> = {
  product_view: 0.25,
  search: 0.1,
  wishlist_add: 2.5,
  wishlist_remove: -2,
  cart_add: 3,
  cart_remove: -1.5,
  tryon_start: 1,
  tryon_success: 3,
  tryon_retry: 0.5,
  tryon_reject: -2,
  recommendation_shown: 0.05,
  recommendation_click: 1.5,
  recommendation_accept: 4,
  recommendation_reject: -3,
  order_created: 3,
  purchase: 5,
  review: 2
};

export async function recordBehaviorEvent(args: {
  db: Db;
  type: BehaviorEventType;
  userId?: string | null;
  guestKey?: string | null;
  productId?: string | null;
  source?: string;
  query?: string | null;
  metadata?: Prisma.InputJsonValue;
  weight?: number;
}) {
  const weight = args.weight ?? behaviorWeights[args.type];
  const event = await args.db.userBehaviorEvent.create({
    data: {
      type: args.type,
      userId: args.userId ?? null,
      guestKey: args.guestKey ?? null,
      productId: args.productId ?? null,
      source: args.source ?? "storefront",
      query: args.query ?? null,
      metadata: args.metadata ?? {},
      weight
    }
  });

  if (args.userId && args.productId) {
    await args.db.productAffinity.upsert({
      where: { userId_productId: { userId: args.userId, productId: args.productId } },
      create: {
        userId: args.userId,
        productId: args.productId,
        score: weight,
        signals: { [args.type]: 1 }
      },
      update: {
        score: { increment: weight },
        signals: {}
      }
    });
  }

  return event;
}

function addScore(target: Record<string, number>, key: string | null | undefined, value: number) {
  if (!key) return;
  target[key] = Number(((target[key] ?? 0) + value).toFixed(3));
}

function addMany(target: Record<string, number>, values: string[], weight: number) {
  for (const value of values) addScore(target, value, weight);
}

function normalize(scores: Record<string, number>) {
  const positives = Object.entries(scores).filter(([, value]) => value > 0);
  const max = Math.max(1, ...positives.map(([, value]) => value));
  return Object.fromEntries(
    Object.entries(scores)
      .filter(([, value]) => Math.abs(value) >= 0.05)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => [key, Number((value / max).toFixed(3))])
  );
}

export async function rebuildUserStyleProfile(db: Db, userId: string) {
  const events = await db.userBehaviorEvent.findMany({
    where: { userId, productId: { not: null } },
    orderBy: { createdAt: "asc" },
    include: {
      product: {
        select: {
          id: true,
          category: true,
          type: true,
          colorFamily: true,
          style: true,
          occasion: true,
          fit: true,
          price: true,
          analyzerReady: true
        }
      }
    }
  });

  const categories: Record<string, number> = {};
  const types: Record<string, number> = {};
  const colors: Record<string, number> = {};
  const styles: Record<string, number> = {};
  const occasions: Record<string, number> = {};
  const fits: Record<string, number> = {};
  const avoid = new Map<string, number>();
  const positivePrices: Array<{ price: number; weight: number }> = [];

  for (const event of events) {
    const product = event.product;
    if (!product?.analyzerReady) continue;
    const weight = event.weight;

    addScore(categories, product.category, weight);
    addScore(types, product.type, weight);
    addScore(colors, product.colorFamily, weight);
    addMany(styles, Array.isArray(product.style) ? product.style.map(String) : [], weight);
    addMany(occasions, Array.isArray(product.occasion) ? product.occasion.map(String) : [], weight);
    addScore(fits, product.fit, weight);

    if (weight > 0) positivePrices.push({ price: product.price, weight });
    if (weight < 0) {
      for (const token of [
        product.category,
        product.type,
        product.colorFamily,
        ...(Array.isArray(product.style) ? product.style.map(String) : [])
      ]) {
        avoid.set(token, (avoid.get(token) ?? 0) + Math.abs(weight));
      }
    }
  }

  const weightedPrices = positivePrices.flatMap(({ price, weight }) =>
    Array.from({ length: Math.max(1, Math.min(10, Math.round(weight * 2))) }, () => price)
  ).sort((a, b) => a - b);

  const priceMin = weightedPrices.length ? weightedPrices[Math.floor(weightedPrices.length * 0.1)] : 0;
  const priceMax = weightedPrices.length ? weightedPrices[Math.min(weightedPrices.length - 1, Math.floor(weightedPrices.length * 0.9))] : 5000000;
  const relevantCount = events.filter((event) => event.product?.analyzerReady).length;
  const avoidAttributes = [...avoid.entries()]
    .filter(([, score]) => score >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([key]) => key);

  return db.userStyleProfile.upsert({
    where: { userId },
    create: {
      userId,
      preferredCategories: normalize(categories),
      preferredTypes: normalize(types),
      preferredColors: normalize(colors),
      preferredStyles: normalize(styles),
      preferredOccasions: normalize(occasions),
      preferredFits: normalize(fits),
      priceMin,
      priceMax,
      avoidAttributes,
      confidence: Math.min(0.95, relevantCount / 40),
      eventCount: relevantCount,
      lastLearnedAt: new Date()
    },
    update: {
      preferredCategories: normalize(categories),
      preferredTypes: normalize(types),
      preferredColors: normalize(colors),
      preferredStyles: normalize(styles),
      preferredOccasions: normalize(occasions),
      preferredFits: normalize(fits),
      priceMin,
      priceMax,
      avoidAttributes,
      confidence: Math.min(0.95, relevantCount / 40),
      eventCount: relevantCount,
      lastLearnedAt: new Date()
    }
  });
}

export async function styleProfileSummary(db: Db, userId: string) {
  const profile = await db.userStyleProfile.findUnique({ where: { userId } });
  if (!profile) return "";

  const top = (value: Prisma.JsonValue, limit = 4) => {
    if (!value || Array.isArray(value) || typeof value !== "object") return [];
    return Object.entries(value as Record<string, unknown>)
      .filter(([, score]) => typeof score === "number" && score > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, limit)
      .map(([key]) => key);
  };

  return [
    `Gu đã học (confidence ${Math.round(profile.confidence * 100)}%, ${profile.eventCount} tín hiệu):`,
    `- nhóm đồ: ${top(profile.preferredCategories).join(", ") || "chưa đủ dữ liệu"}`,
    `- kiểu: ${top(profile.preferredTypes).join(", ") || "chưa đủ dữ liệu"}`,
    `- màu: ${top(profile.preferredColors).join(", ") || "chưa đủ dữ liệu"}`,
    `- phong cách: ${top(profile.preferredStyles, 6).join(", ") || "chưa đủ dữ liệu"}`,
    `- dịp mặc: ${top(profile.preferredOccasions).join(", ") || "chưa đủ dữ liệu"}`,
    `- khoảng giá thường quan tâm: ${profile.priceMin.toLocaleString("vi-VN")}–${profile.priceMax.toLocaleString("vi-VN")}đ`,
    `- tránh ưu tiên: ${Array.isArray(profile.avoidAttributes) ? profile.avoidAttributes.map(String).join(", ") : "không có"}`
  ].join("\n");
}

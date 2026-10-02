import type { Prisma } from "@prisma/client";
import type { Product, ProductVariant } from "@/lib/products";

type VariantRow = {
  id: string;
  sku: string;
  size: string;
  stock: number;
  active: boolean;
};

type ProductRow = {
  id: string; sku: string; groupCode: string | null; name: string; subtitle: string;
  category: string; type: string; gender: string; price: number; oldPrice: number | null;
  color: string; colorFamily: string; colorHex: string | null; sizes: Prisma.JsonValue;
  stock: number; stockTracked: boolean; image: string; images: Prisma.JsonValue;
  style: Prisma.JsonValue; occasion: Prisma.JsonValue; material: string; fit: string;
  featured: boolean; isNew: boolean; active: boolean; sourceUrl: string | null;
  sourceUpdatedAt: Date | null; sourceType: string; tryOnCategory: string | null;
  tryOnPhotoType: string | null; tryOnImage: string | null; silhouette: string | null;
  lengthClass: string | null; neckline: string | null; sleeveLength: string | null;
  pattern: string | null; season: Prisma.JsonValue; formality: number; warmth: number;
  stretch: number; coverage: number; colorTemperature: string | null;
  hoverImage: string | null; waistRise: string | null; recommendedUndertones: Prisma.JsonValue;
  bodyShapeCompatibility: Prisma.JsonValue; pairingTags: Prisma.JsonValue; avoidPairingTags: Prisma.JsonValue;
  visualWeight: number; volume: string | null;
  styleKeywords: Prisma.JsonValue; aiSearchText: string; analyzerReady: boolean;
  variants?: VariantRow[];
};

function jsonStrings(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export function fromProductRow(row: ProductRow): Product {
  return {
    id: row.id, sku: row.sku, groupCode: row.groupCode ?? undefined, name: row.name,
    subtitle: row.subtitle, category: row.category as Product["category"], type: row.type as Product["type"],
    gender: "women", price: row.price, oldPrice: row.oldPrice ?? undefined, color: row.color,
    colorFamily: row.colorFamily as Product["colorFamily"], colorHex: row.colorHex ?? undefined,
    sizes: jsonStrings(row.sizes), stock: row.stock, stockTracked: row.stockTracked,
    variants: row.variants?.map((variant): ProductVariant => ({ id: variant.id, sku: variant.sku, size: variant.size, stock: variant.stock, active: variant.active })),
    image: row.image, images: jsonStrings(row.images), style: jsonStrings(row.style),
    occasion: jsonStrings(row.occasion), material: row.material, fit: row.fit, featured: row.featured,
    isNew: row.isNew, active: row.active, sourceUrl: row.sourceUrl ?? undefined,
    sourceUpdatedAt: row.sourceUpdatedAt?.toISOString(), sourceType: row.sourceType as Product["sourceType"],
    tryOnCategory: row.tryOnCategory as Product["tryOnCategory"], tryOnPhotoType: row.tryOnPhotoType as Product["tryOnPhotoType"],
    tryOnImage: row.tryOnImage ?? undefined, silhouette: row.silhouette ?? undefined,
    lengthClass: row.lengthClass ?? undefined, neckline: row.neckline ?? undefined,
    sleeveLength: row.sleeveLength ?? undefined, pattern: row.pattern ?? undefined,
    season: jsonStrings(row.season), formality: row.formality, warmth: row.warmth, stretch: row.stretch,
    coverage: row.coverage, colorTemperature: row.colorTemperature as Product["colorTemperature"],
    hoverImage: row.hoverImage ?? undefined, waistRise: row.waistRise as Product["waistRise"],
    recommendedUndertones: jsonStrings(row.recommendedUndertones) as Product["recommendedUndertones"],
    bodyShapeCompatibility: jsonStrings(row.bodyShapeCompatibility), pairingTags: jsonStrings(row.pairingTags),
    avoidPairingTags: jsonStrings(row.avoidPairingTags), visualWeight: row.visualWeight,
    volume: row.volume as Product["volume"],
    styleKeywords: jsonStrings(row.styleKeywords), aiSearchText: row.aiSearchText, analyzerReady: row.analyzerReady
  };
}

export function toProductRow(product: Product) {
  return {
    id: product.id, sku: product.sku ?? product.id, groupCode: product.groupCode ?? null,
    name: product.name, subtitle: product.subtitle, category: product.category, type: product.type,
    gender: "women", price: product.price, oldPrice: product.oldPrice ?? null, color: product.color,
    colorFamily: product.colorFamily, colorHex: product.colorHex ?? null, sizes: product.sizes,
    stock: product.stock, stockTracked: product.stockTracked !== false, image: product.image, images: product.images,
    style: product.style, occasion: product.occasion, material: product.material, fit: product.fit,
    featured: Boolean(product.featured), isNew: Boolean(product.isNew), active: product.active !== false,
    sourceUrl: product.sourceUrl ?? null, sourceUpdatedAt: product.sourceUpdatedAt ? new Date(product.sourceUpdatedAt) : null,
    sourceType: product.sourceType ?? "demo", tryOnCategory: product.tryOnCategory ?? null,
    tryOnPhotoType: product.tryOnPhotoType ?? null, tryOnImage: product.tryOnImage ?? null,
    silhouette: product.silhouette ?? null, lengthClass: product.lengthClass ?? null,
    neckline: product.neckline ?? null, sleeveLength: product.sleeveLength ?? null, pattern: product.pattern ?? null,
    season: product.season ?? [], formality: product.formality ?? 2, warmth: product.warmth ?? 2,
    stretch: product.stretch ?? 2, coverage: product.coverage ?? 2, colorTemperature: product.colorTemperature ?? null,
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
    aiSearchText: product.aiSearchText ?? [product.name, product.subtitle, product.category, product.type, product.color, ...product.style, ...product.occasion].join(" "),
    analyzerReady: product.analyzerReady ?? false
  };
}

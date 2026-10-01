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
  id: string;
  sku: string;
  name: string;
  subtitle: string;
  category: string;
  type: string;
  gender: string;
  price: number;
  oldPrice: number | null;
  color: string;
  colorFamily: string;
  sizes: Prisma.JsonValue;
  stock: number;
  image: string;
  images: Prisma.JsonValue;
  style: Prisma.JsonValue;
  occasion: Prisma.JsonValue;
  material: string;
  fit: string;
  featured: boolean;
  isNew: boolean;
  active: boolean;
  variants?: VariantRow[];
  reviews?: { rating: number }[];
};

function jsonStrings(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

export function fromProductRow(row: ProductRow): Product {
  const reviewCount = row.reviews?.length ?? 0;
  const rating = reviewCount
    ? row.reviews!.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : undefined;

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    subtitle: row.subtitle,
    category: row.category as Product["category"],
    type: row.type as Product["type"],
    gender: "women",
    price: row.price,
    oldPrice: row.oldPrice ?? undefined,
    color: row.color,
    colorFamily: row.colorFamily as Product["colorFamily"],
    sizes: jsonStrings(row.sizes),
    stock: row.stock,
    variants: row.variants?.map((variant): ProductVariant => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      stock: variant.stock,
      active: variant.active
    })),
    rating,
    reviewCount,
    image: row.image,
    images: jsonStrings(row.images),
    style: jsonStrings(row.style),
    occasion: jsonStrings(row.occasion),
    material: row.material,
    fit: row.fit,
    featured: row.featured,
    isNew: row.isNew,
    active: row.active
  };
}

export function toProductRow(product: Product) {
  return {
    id: product.id,
    sku: product.sku ?? product.id,
    name: product.name,
    subtitle: product.subtitle,
    category: product.category,
    type: product.type,
    gender: "women",
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
  };
}

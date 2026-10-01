import type { Product } from "@/lib/products";

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
  sizes: string;
  stock: number;
  image: string;
  images: string;
  style: string;
  occasion: string;
  material: string;
  fit: string;
  featured: boolean;
  isNew: boolean;
  active: boolean;
};

export function fromProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    subtitle: row.subtitle,
    category: row.category as Product["category"],
    type: row.type as Product["type"],
    gender: row.gender as Product["gender"],
    price: row.price,
    oldPrice: row.oldPrice ?? undefined,
    color: row.color,
    colorFamily: row.colorFamily as Product["colorFamily"],
    sizes: JSON.parse(row.sizes) as string[],
    stock: row.stock,
    image: row.image,
    images: JSON.parse(row.images) as string[],
    style: JSON.parse(row.style) as string[],
    occasion: JSON.parse(row.occasion) as string[],
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
  };
}

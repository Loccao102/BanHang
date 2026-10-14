import { extendedProducts } from "./extended-products";
import { flatlayProducts } from "./flatlay-products";

export type ProductCategory = "tops" | "bottoms" | "outerwear" | "dress" | "set";

export type ClothingType =
  | "corset" | "crop-top" | "bodysuit" | "blouse" | "shirt" | "knit-top"
  | "blazer" | "jacket" | "cardigan"
  | "jeans" | "trousers" | "flare-pants" | "shorts" | "skirt"
  | "mini-dress" | "midi-dress" | "maxi-dress" | "bodycon-dress"
  | "set";

export type ColorFamily =
  | "black" | "white" | "navy" | "beige" | "blue"
  | "brown" | "red" | "green" | "gray" | "pink";

export type TryOnCategory = "tops" | "bottoms" | "one-pieces";
export type TryOnPhotoType = "model" | "flat-lay";

export type ProductVariant = {
  id?: string;
  sku: string;
  size: string;
  stock: number;
  active: boolean;
};

export type Product = {
  id: string;
  sku?: string;
  groupCode?: string;
  name: string;
  subtitle: string;
  category: ProductCategory;
  type: ClothingType;
  gender: "women";
  price: number;
  oldPrice?: number;
  color: string;
  colorFamily: ColorFamily;
  colorHex?: string;
  sizes: string[];
  stock: number;
  stockTracked?: boolean;
  variants?: ProductVariant[];
  image: string;
  images: string[];
  style: string[];
  occasion: string[];
  material: string;
  fit: string;
  featured?: boolean;
  isNew?: boolean;
  active?: boolean;
  sourceUrl?: string;
  sourceUpdatedAt?: string;
  sourceType?: "official-marketplace" | "retailer-corroborated" | "vto-reference" | "demo";
  tryOnCategory?: TryOnCategory;
  tryOnPhotoType?: TryOnPhotoType;
  tryOnImage?: string;
  silhouette?: string;
  lengthClass?: string;
  neckline?: string;
  sleeveLength?: string;
  pattern?: string;
  season?: string[];
  formality?: number;
  warmth?: number;
  stretch?: number;
  coverage?: number;
  colorTemperature?: "warm" | "cool" | "neutral";
  hoverImage?: string;
  waistRise?: "low" | "mid" | "high" | "not-applicable";
  recommendedUndertones?: Array<"warm" | "cool" | "neutral">;
  bodyShapeCompatibility?: string[];
  pairingTags?: string[];
  avoidPairingTags?: string[];
  visualWeight?: number;
  volume?: "fitted" | "balanced" | "voluminous";
  styleKeywords?: string[];
  aiSearchText?: string;
  analyzerReady?: boolean;
};

const standardSizes = ["S", "M", "L", "XL"];
const HF_EXAMPLES = "https://huggingface.co/spaces/fashn-ai/fashn-vton-1.5/resolve/main/assets/examples";

function variants(baseSku: string, values = standardSizes): ProductVariant[] {
  return values.map((size) => ({ sku: `${baseSku}-${size}`, size, stock: 12, active: true }));
}

const common = {
  gender: "women" as const,
  sizes: standardSizes,
  stock: 48,
  stockTracked: false,
  active: true
};

const coreProducts: Product[] = [];

export const products: Product[] = [...coreProducts, ...flatlayProducts, ...extendedProducts];

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

export const getProduct = (id: string) => products.find((item) => item.id === id);

export const categoryLabels: Record<ProductCategory, string> = {
  tops: "Áo",
  bottoms: "Quần & chân váy",
  outerwear: "Áo khoác",
  dress: "Đầm",
  set: "Set đồ"
};

export const typeLabels: Record<ClothingType, string> = {
  corset: "Corset",
  "crop-top": "Áo croptop",
  bodysuit: "Bodysuit",
  blouse: "Áo kiểu",
  shirt: "Sơ mi",
  "knit-top": "Áo len",
  blazer: "Blazer",
  jacket: "Áo khoác",
  cardigan: "Cardigan",
  jeans: "Quần jeans",
  trousers: "Quần dài",
  "flare-pants": "Quần loe",
  shorts: "Quần short",
  skirt: "Chân váy",
  "mini-dress": "Đầm ngắn",
  "midi-dress": "Đầm midi",
  "maxi-dress": "Đầm maxi",
  "bodycon-dress": "Đầm ôm",
  set: "Set đồ"
};

/**
 * Display taxonomy shared by storefront, admin and AI tools.
 * Database records intentionally retain the legacy `bottoms` category so no
 * product migration is required; the garment type distinguishes pants/skirts.
 */
export type StorefrontCategory = Exclude<ProductCategory, "bottoms"> | "pants" | "skirts";

export const storefrontCategoryLabels: Record<StorefrontCategory, string> = {
  tops: "Áo",
  pants: "Quần",
  skirts: "Chân váy",
  outerwear: "Áo khoác",
  dress: "Đầm",
  set: "Set đồ"
};

export const pantsTypes: ClothingType[] = ["jeans", "trousers", "flare-pants", "shorts"];

export function storefrontCategory(product: Pick<Product, "category" | "type">): StorefrontCategory {
  if (product.category === "bottoms") return product.type === "skirt" ? "skirts" : "pants";
  return product.category;
}

export function typesForStorefrontCategory(category: StorefrontCategory): ClothingType[] {
  switch (category) {
    case "pants": return pantsTypes;
    case "skirts": return ["skirt"];
    case "tops": return ["corset", "crop-top", "bodysuit", "blouse", "shirt", "knit-top"];
    case "outerwear": return ["blazer", "jacket", "cardigan"];
    case "dress": return ["mini-dress", "midi-dress", "maxi-dress", "bodycon-dress"];
    case "set": return ["set"];
  }
}

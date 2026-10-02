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
  rating?: number;
  reviewCount?: number;
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
};

const standardSizes = ["S", "M", "L", "XL"];

function availabilityVariants(baseSku: string, values: string[]): ProductVariant[] {
  // Public storefront sources expose size availability, not authoritative warehouse quantity.
  // Quantity is only an internal demo ceiling for checkout transactions; storefront never presents it as exact stock.
  return values.map((size) => ({
    sku: `${baseSku}-${size}`,
    size,
    stock: 12,
    active: true
  }));
}

export const products: Product[] = [
  {
    id: "lsoul-dydy-dress-v25021658",
    sku: "V25021658",
    groupCode: "V25021658",
    name: "Dydy Dress",
    subtitle: "Váy cổ yếm đan dây corset lấp lánh ánh nâu đỏ",
    category: "dress",
    type: "midi-dress",
    gender: "women",
    price: 2930000,
    oldPrice: 3080000,
    color: "Nâu đỏ",
    colorFamily: "red",
    colorHex: "#6F2633",
    sizes: standardSizes,
    stock: 48,
    stockTracked: false,
    variants: availabilityVariants("V25021658", standardSizes),
    image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m6nne8nuelvcba",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m6nne8nuelvcba",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m6nne8nud7aw8b",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m6nne8nubsrcb1",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m6nne8nud7bsb9"
    ],
    style: ["glam", "feminine", "statement"],
    occasion: ["party", "date"],
    material: "Lưới cao cấp đính kim sa, lót khaki",
    fit: "Corset fit & flare",
    featured: true,
    isNew: true,
    active: true,
    sourceUrl: "https://shopee.vn/-T%E1%BA%B7ng-h%E1%BB%99p-LSOUL-V%C3%A1y-C%E1%BB%95-Y%E1%BA%BFm-%C4%90an-D%C3%A2y-Corset-L%E1%BA%A5p-L%C3%A1nh-%C3%81nh-N%C3%A2u-%C4%90%E1%BB%8F-Dydy-Dress-V25021658-i.269491027.29127387970",
    sourceUpdatedAt: "2026-10-01"
  },
  {
    id: "lsoul-level-dress-v24101636",
    sku: "V24101636",
    groupCode: "V24101636",
    name: "Level Dress",
    subtitle: "Đầm xòe cổ yếm hở lưng đan dây corset caro",
    category: "dress",
    type: "mini-dress",
    gender: "women",
    price: 1191999,
    oldPrice: 1760000,
    color: "Tím than",
    colorFamily: "navy",
    colorHex: "#302A48",
    sizes: standardSizes,
    stock: 48,
    stockTracked: false,
    variants: availabilityVariants("V24101636", standardSizes),
    image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m1f1r7brp00o0c",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m1f1r7brp00o0c",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m3786z31jdnw66",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m37874ddsu7g5a",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m3786z3ly0oca5"
    ],
    style: ["feminine", "statement"],
    occasion: ["party", "date"],
    material: "Nỉ mềm",
    fit: "Fit & flare, corset lace-up back",
    featured: true,
    active: true,
    sourceUrl: "https://shopee.vn/LSOUL-%C4%90%E1%BA%A7m-X%C3%B2e-C%E1%BB%95-Y%E1%BA%BFm-H%E1%BB%9F-L%C6%B0ng-%C4%90an-D%C3%A2y-Corset-Caro-%C4%90i-Ti%E1%BB%87c-Level-Dress-V24101636-i.269491027.27364132353",
    sourceUpdatedAt: "2026-10-01"
  },
  {
    id: "lsoul-lotis-set-v24031601-a24032744",
    sku: "V24031601-A24032744",
    groupCode: "LOTIS-V24031601-A24032744",
    name: "Lotis Set",
    subtitle: "Đầm cúp ngực trễ vai tùng bèo tua rua kèm đai corset tôn eo",
    category: "set",
    type: "set",
    gender: "women",
    price: 795000,
    oldPrice: 825000,
    color: "Xanh ngọc",
    colorFamily: "green",
    colorHex: "#8FBDB2",
    sizes: standardSizes,
    stock: 48,
    stockTracked: false,
    variants: availabilityVariants("LOTIS", standardSizes),
    image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-md43u55pmwf045",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-md43u55pmwf045",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-md43r12tnezxd6",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-md43v0t9bb8cc9",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-md43uqfshtmn32"
    ],
    style: ["feminine", "romantic", "statement"],
    occasion: ["party", "date"],
    material: "95% cotton, 5% spandex (phần dress)",
    fit: "Off-shoulder fit & flare",
    featured: true,
    active: true,
    sourceUrl: "https://shopee.vn/LSOUL-%C4%90%E1%BA%A7m-C%C3%BAp-Ng%E1%BB%B1c-Tr%E1%BB%85-Vai-T%C3%B9ng-B%C3%A8o-Tua-Rua-%C4%90ai-Corset-Lotis-Sang-Tr%E1%BB%8Dng-Set-V24031601-A24032744-i.269491027.25670821740",
    sourceUpdatedAt: "2026-10-01"
  },
  {
    id: "lsoul-vesper-blazer-a2501001",
    sku: "A2501001",
    groupCode: "VESPER-A2501001",
    name: "Vesper Blazer",
    subtitle: "Áo blazer chiết eo cấu trúc corset tôn dáng đính khuy kim loại",
    category: "outerwear",
    type: "blazer",
    gender: "women",
    price: 2450000,
    oldPrice: 2800000,
    color: "Đen",
    colorFamily: "black",
    colorHex: "#1A1A1A",
    sizes: standardSizes,
    stock: 48,
    stockTracked: false,
    variants: availabilityVariants("VESPER", standardSizes),
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=90",
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=90"
    ],
    style: ["tailored", "statement", "chic"],
    occasion: ["party", "date", "formal"],
    material: "Vải dạ texturized cao cấp lót lụa",
    fit: "Cinched-waist corset blazer",
    featured: true,
    isNew: true,
    active: true,
    sourceUpdatedAt: "2026-10-01"
  },
  {
    id: "lsoul-aurelia-corset-top-a2501002",
    sku: "A2501002",
    groupCode: "AURELIA-A2501002",
    name: "Aurelia Corset Top",
    subtitle: "Áo cúp ngực corset đan dây ren hoa tạo phom tôn eo",
    category: "tops",
    type: "corset",
    gender: "women",
    price: 1450000,
    oldPrice: 1650000,
    color: "Trắng",
    colorFamily: "white",
    colorHex: "#F7F5F0",
    sizes: standardSizes,
    stock: 48,
    stockTracked: false,
    variants: availabilityVariants("AURELIA", standardSizes),
    image: "https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=1200&q=90",
    images: [
      "https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=90"
    ],
    style: ["corset", "romantic", "feminine"],
    occasion: ["party", "date"],
    material: "Ren hoa dệt kim sa, gọng định hình",
    fit: "Lace-up corset fit",
    featured: true,
    isNew: true,
    active: true,
    sourceUpdatedAt: "2026-10-01"
  }
];

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
  "crop-top": "Crop top",
  bodysuit: "Bodysuit",
  blouse: "Blouse",
  shirt: "Sơ mi",
  "knit-top": "Knit top",
  blazer: "Blazer",
  jacket: "Jacket",
  cardigan: "Cardigan",
  jeans: "Jeans",
  trousers: "Quần tây",
  "flare-pants": "Quần loe",
  shorts: "Quần short",
  skirt: "Chân váy",
  "mini-dress": "Mini dress",
  "midi-dress": "Midi dress",
  "maxi-dress": "Maxi dress",
  "bodycon-dress": "Bodycon dress",
  set: "Set đồ"
};

import type { Product } from "./products";

const sizes = ["S", "M", "L", "XL"];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type Seed = {
  sku: string;
  groupCode: string;
  name: string;
  subtitle: string;
  category: Product["category"];
  type: Product["type"];
  price: number;
  color: string;
  colorFamily: Product["colorFamily"];
  colorHex: string;
  image: string;
  style: string[];
  occasion: string[];
  material: string;
  fit: string;
  silhouette: string;
  lengthClass: string;
  neckline?: string;
  sleeveLength?: string;
  waistRise?: Product["waistRise"];
  colorTemperature?: Product["colorTemperature"];
};

function makeProduct(item: Seed): Product {
  const id = `lsoul-${slug(item.name)}-${item.sku.toLowerCase()}`;
  const styleKeywords = Array.from(new Set([
    ...item.style,
    item.category,
    item.type,
    item.fit,
    item.silhouette,
    item.lengthClass,
    item.color
  ].filter(Boolean)));

  return {
    id,
    sku: item.sku,
    groupCode: item.groupCode,
    name: item.name,
    subtitle: item.subtitle,
    category: item.category,
    type: item.type,
    gender: "women",
    price: item.price,
    color: item.color,
    colorFamily: item.colorFamily,
    colorHex: item.colorHex,
    sizes,
    stock: 48,
    stockTracked: false,
    variants: sizes.map((size) => ({
      sku: `${item.sku}-${size}`,
      size,
      stock: 12,
      active: true
    })),
    image: item.image,
    hoverImage: item.image,
    images: [item.image],
    style: item.style,
    occasion: item.occasion,
    material: item.material,
    fit: item.fit,
    featured: false,
    isNew: true,
    active: true,
    sourceType: "retailer-corroborated",
    sourceUpdatedAt: "2026-10-03",
    tryOnCategory:
      item.category === "bottoms" ? "bottoms" :
      item.category === "dress" ? "one-pieces" :
      "tops",
    tryOnPhotoType: "flat-lay",
    tryOnImage: item.image,
    silhouette: item.silhouette,
    lengthClass: item.lengthClass,
    neckline: item.neckline,
    sleeveLength: item.sleeveLength,
    pattern: "solid",
    season: ["spring", "summer", "autumn", "winter"],
    formality: item.occasion.some((value) => /tiệc|sự kiện|event|gala/i.test(value)) ? 5 : 3,
    warmth: item.category === "outerwear" ? 5 : 2,
    stretch: /co giãn|knit|len|thun/i.test(`${item.material} ${item.fit}`) ? 4 : 2,
    coverage: item.lengthClass === "maxi" ? 5 : item.lengthClass === "midi" ? 4 : 2,
    colorTemperature: item.colorTemperature ?? "neutral",
    waistRise: item.waistRise ?? (item.category === "bottoms" ? "high" : "not-applicable"),
    recommendedUndertones:
      item.colorTemperature === "warm" ? ["warm", "neutral"] :
      item.colorTemperature === "cool" ? ["cool", "neutral"] :
      ["warm", "cool", "neutral"],
    bodyShapeCompatibility: [],
    pairingTags: styleKeywords,
    avoidPairingTags: [],
    visualWeight: item.category === "outerwear" ? 5 : 3,
    volume: "balanced",
    styleKeywords,
    aiSearchText: [
      item.name,
      item.subtitle,
      item.category,
      item.type,
      item.color,
      item.fit,
      item.silhouette,
      ...item.style,
      ...item.occasion
    ].join(" "),
    analyzerReady: true
  };
}

const data: Seed[] = [
  {
    "sku": "DR-NOIR-SLIP-BLK",
    "groupCode": "DR-NOIR-SLIP",
    "name": "Noir Silk Slip Midi Dress",
    "subtitle": "Đầm lụa hai dây cổ đổ dáng midi thướt tha quyến rũ (Đen)",
    "category": "dress",
    "type": "midi-dress",
    "price": 2150000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/dress-satin-slip-black.jpg",
    "style": [
      "minimal",
      "sexy",
      "glam"
    ],
    "occasion": [
      "hẹn hò",
      "đi tiệc",
      "sự kiện buổi tối"
    ],
    "material": "Lụa satin cao cấp dệt chéo",
    "fit": "Bias-cut cowl neck",
    "silhouette": "sheath",
    "lengthClass": "midi",
    "neckline": "cowl",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "DR-NOIR-SLIP-RED",
    "groupCode": "DR-NOIR-SLIP",
    "name": "Noir Silk Slip Midi Dress",
    "subtitle": "Đầm lụa hai dây cổ đổ dáng midi quyến rũ quý phái (Đỏ rượu)",
    "category": "dress",
    "type": "midi-dress",
    "price": 2150000,
    "color": "Đỏ rượu",
    "colorFamily": "red",
    "colorHex": "#7A1C2E",
    "image": "/products/dress-bodycon-maxi-red.jpg",
    "style": [
      "glam",
      "sexy",
      "statement"
    ],
    "occasion": [
      "hẹn hò",
      "đi tiệc",
      "sự kiện buổi tối"
    ],
    "material": "Lụa satin cao cấp dệt chéo",
    "fit": "Bias-cut cowl neck",
    "silhouette": "sheath",
    "lengthClass": "midi",
    "neckline": "cowl",
    "sleeveLength": "sleeveless",
    "colorTemperature": "warm"
  },
  {
    "sku": "DR-NOIR-SLIP-WHT",
    "groupCode": "DR-NOIR-SLIP",
    "name": "Noir Silk Slip Midi Dress",
    "subtitle": "Đầm lụa hai dây cổ đổ dáng midi thanh khiết trang nhã (Trắng ngà)",
    "category": "dress",
    "type": "midi-dress",
    "price": 2150000,
    "color": "Trắng ngà",
    "colorFamily": "white",
    "colorHex": "#F5F4EE",
    "image": "/products/dress-bodycon-maxi-white.jpg",
    "style": [
      "minimal",
      "elegant",
      "nữ tính"
    ],
    "occasion": [
      "hẹn hò",
      "đi tiệc",
      "sự kiện"
    ],
    "material": "Lụa satin cao cấp dệt chéo",
    "fit": "Bias-cut cowl neck",
    "silhouette": "sheath",
    "lengthClass": "midi",
    "neckline": "cowl",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "DR-SIREN-MINI-BLK",
    "groupCode": "DR-SIREN-MINI",
    "name": "Siren Bandeau Cut-Out Mini Dress",
    "subtitle": "Đầm cúp ngực bandeau ôm body cut-out eo táo bạo (Đen)",
    "category": "dress",
    "type": "mini-dress",
    "price": 1850000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/dress-slip-mini-black.webp",
    "style": [
      "sexy",
      "Y2K",
      "statement"
    ],
    "occasion": [
      "đi tiệc",
      "clubbing",
      "concert"
    ],
    "material": "Thun poly dày dặn co giãn 4 chiều",
    "fit": "Bandeau bodycon cut-out",
    "silhouette": "bodycon",
    "lengthClass": "mini",
    "neckline": "strapless",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "DR-SIREN-MINI-RED",
    "groupCode": "DR-SIREN-MINI",
    "name": "Siren Bandeau Cut-Out Mini Dress",
    "subtitle": "Đầm cúp ngực bandeau ôm body cut-out eo gợi cảm (Đỏ mận)",
    "category": "dress",
    "type": "mini-dress",
    "price": 1850000,
    "color": "Đỏ mận",
    "colorFamily": "red",
    "colorHex": "#8B1E3F",
    "image": "/products/dress-bodycon-maxi-red.jpg",
    "style": [
      "sexy",
      "glam",
      "statement"
    ],
    "occasion": [
      "đi tiệc",
      "clubbing",
      "hẹn hò"
    ],
    "material": "Thun poly dày dặn co giãn 4 chiều",
    "fit": "Bandeau bodycon cut-out",
    "silhouette": "bodycon",
    "lengthClass": "mini",
    "neckline": "strapless",
    "sleeveLength": "sleeveless",
    "colorTemperature": "warm"
  },
  {
    "sku": "DR-SIREN-MINI-WHT",
    "groupCode": "DR-SIREN-MINI",
    "name": "Siren Bandeau Cut-Out Mini Dress",
    "subtitle": "Đầm cúp ngực bandeau ôm body cut-out eo trẻ trung (Trắng)",
    "category": "dress",
    "type": "mini-dress",
    "price": 1850000,
    "color": "Trắng",
    "colorFamily": "white",
    "colorHex": "#FFFFFF",
    "image": "/products/dress-bodycon-maxi-white.jpg",
    "style": [
      "sexy",
      "minimal",
      "Y2K"
    ],
    "occasion": [
      "đi tiệc",
      "dạo phố",
      "cafe"
    ],
    "material": "Thun poly dày dặn co giãn 4 chiều",
    "fit": "Bandeau bodycon cut-out",
    "silhouette": "bodycon",
    "lengthClass": "mini",
    "neckline": "strapless",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "DR-CELESTE-MAXI-BLK",
    "groupCode": "DR-CELESTE-MAXI",
    "name": "Celeste Draped Column Maxi Dress",
    "subtitle": "Đầm dạ hội xếp nếp draped dáng suông dài quyền quý (Đen)",
    "category": "dress",
    "type": "maxi-dress",
    "price": 2450000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#141414",
    "image": "/products/dress-bodycon-maxi-black.jpg",
    "style": [
      "glam",
      "elegant",
      "statement"
    ],
    "occasion": [
      "sự kiện buổi tối",
      "đi tiệc",
      "gala"
    ],
    "material": "Chiffon lụa rủ cao cấp 2 lớp",
    "fit": "Draped column fit",
    "silhouette": "column",
    "lengthClass": "maxi",
    "neckline": "asymmetric",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "DR-CELESTE-MAXI-RED",
    "groupCode": "DR-CELESTE-MAXI",
    "name": "Celeste Draped Column Maxi Dress",
    "subtitle": "Đầm dạ hội xếp nếp draped dáng suông dài kiêu sa (Đỏ rượu)",
    "category": "dress",
    "type": "maxi-dress",
    "price": 2450000,
    "color": "Đỏ rượu",
    "colorFamily": "red",
    "colorHex": "#6B1D2F",
    "image": "/products/dress-bodycon-maxi-red.jpg",
    "style": [
      "glam",
      "elegant",
      "statement"
    ],
    "occasion": [
      "sự kiện buổi tối",
      "đi tiệc",
      "gala"
    ],
    "material": "Chiffon lụa rủ cao cấp 2 lớp",
    "fit": "Draped column fit",
    "silhouette": "column",
    "lengthClass": "maxi",
    "neckline": "asymmetric",
    "sleeveLength": "sleeveless",
    "colorTemperature": "warm"
  },
  {
    "sku": "DR-CELESTE-MAXI-WHT",
    "groupCode": "DR-CELESTE-MAXI",
    "name": "Celeste Draped Column Maxi Dress",
    "subtitle": "Đầm dạ hội xếp nếp draped dáng suông dài tinh khôi (Trắng kem)",
    "category": "dress",
    "type": "maxi-dress",
    "price": 2450000,
    "color": "Trắng kem",
    "colorFamily": "white",
    "colorHex": "#F8F7F3",
    "image": "/products/dress-bodycon-maxi-white.jpg",
    "style": [
      "elegant",
      "nữ tính",
      "minimal"
    ],
    "occasion": [
      "sự kiện buổi tối",
      "tiệc cưới",
      "gala"
    ],
    "material": "Chiffon lụa rủ cao cấp 2 lớp",
    "fit": "Draped column fit",
    "silhouette": "column",
    "lengthClass": "maxi",
    "neckline": "asymmetric",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "DR-LUNA-HALTER-BLK",
    "groupCode": "DR-LUNA-HALTER",
    "name": "Luna Backless Halter Midi Dress",
    "subtitle": "Đầm cổ yếm hở lưng thắt nơ lụa satin dáng xòe nhẹ (Đen)",
    "category": "dress",
    "type": "midi-dress",
    "price": 2290000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#0D0D0D",
    "image": "/products/dress-silk-black.jpg",
    "style": [
      "romantic",
      "sexy",
      "nữ tính"
    ],
    "occasion": [
      "hẹn hò",
      "đi tiệc",
      "du lịch"
    ],
    "material": "Lụa tơ tằm dệt mềm mịn",
    "fit": "Halter backless A-line",
    "silhouette": "a-line",
    "lengthClass": "midi",
    "neckline": "halter",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "DR-LUNA-HALTER-RED",
    "groupCode": "DR-LUNA-HALTER",
    "name": "Luna Backless Halter Midi Dress",
    "subtitle": "Đầm cổ yếm hở lưng thắt nơ lụa satin dáng xòe nhẹ (Đỏ ruby)",
    "category": "dress",
    "type": "midi-dress",
    "price": 2290000,
    "color": "Đỏ ruby",
    "colorFamily": "red",
    "colorHex": "#991B1B",
    "image": "/products/dress-bodycon-maxi-red.jpg",
    "style": [
      "romantic",
      "sexy",
      "statement"
    ],
    "occasion": [
      "hẹn hò",
      "đi tiệc",
      "sự kiện"
    ],
    "material": "Lụa tơ tằm dệt mềm mịn",
    "fit": "Halter backless A-line",
    "silhouette": "a-line",
    "lengthClass": "midi",
    "neckline": "halter",
    "sleeveLength": "sleeveless",
    "colorTemperature": "warm"
  },
  {
    "sku": "DR-LUNA-HALTER-WHT",
    "groupCode": "DR-LUNA-HALTER",
    "name": "Luna Backless Halter Midi Dress",
    "subtitle": "Đầm cổ yếm hở lưng thắt nơ lụa satin thanh thoát (Trắng tuyết)",
    "category": "dress",
    "type": "midi-dress",
    "price": 2290000,
    "color": "Trắng tuyết",
    "colorFamily": "white",
    "colorHex": "#FAFAFA",
    "image": "/products/dress-bodycon-maxi-white.jpg",
    "style": [
      "romantic",
      "nữ tính",
      "minimal"
    ],
    "occasion": [
      "hẹn hò",
      "đi tiệc",
      "du lịch"
    ],
    "material": "Lụa tơ tằm dệt mềm mịn",
    "fit": "Halter backless A-line",
    "silhouette": "a-line",
    "lengthClass": "midi",
    "neckline": "halter",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "DR-VELVET-BODY-BLK",
    "groupCode": "DR-VELVET-BODY",
    "name": "Velvet Corset Silhouette Bodycon Dress",
    "subtitle": "Đầm nhung cúp ngực gọng corset ôm sát đường cong (Đen tuyền)",
    "category": "dress",
    "type": "bodycon-dress",
    "price": 2650000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/dress-bodycon-maxi-black.jpg",
    "style": [
      "corset",
      "glam",
      "sexy"
    ],
    "occasion": [
      "đi tiệc",
      "sự kiện buổi tối",
      "hẹn hò"
    ],
    "material": "Nhung tuyết co giãn cao cấp lót lụa",
    "fit": "Fitted corset bodycon",
    "silhouette": "bodycon",
    "lengthClass": "mini",
    "neckline": "sweetheart",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "DR-VELVET-BODY-RED",
    "groupCode": "DR-VELVET-BODY",
    "name": "Velvet Corset Silhouette Bodycon Dress",
    "subtitle": "Đầm nhung cúp ngực gọng corset sang chảnh quý phái (Đỏ đô)",
    "category": "dress",
    "type": "bodycon-dress",
    "price": 2650000,
    "color": "Đỏ",
    "colorFamily": "red",
    "colorHex": "#7F1D1D",
    "image": "/products/dress-bodycon-maxi-red.jpg",
    "style": [
      "corset",
      "glam",
      "sexy",
      "statement"
    ],
    "occasion": [
      "đi tiệc",
      "sự kiện buổi tối",
      "gala"
    ],
    "material": "Nhung tuyết co giãn cao cấp lót lụa",
    "fit": "Fitted corset bodycon",
    "silhouette": "bodycon",
    "lengthClass": "mini",
    "neckline": "sweetheart",
    "sleeveLength": "sleeveless",
    "colorTemperature": "warm"
  },
  {
    "sku": "DR-VELVET-BODY-WHT",
    "groupCode": "DR-VELVET-BODY",
    "name": "Velvet Corset Silhouette Bodycon Dress",
    "subtitle": "Đầm nhung cúp ngực gọng corset kiêu sa tôn dáng (Trắng ngọc)",
    "category": "dress",
    "type": "bodycon-dress",
    "price": 2650000,
    "color": "Trắng",
    "colorFamily": "white",
    "colorHex": "#F9F9F8",
    "image": "/products/dress-bodycon-maxi-white.jpg",
    "style": [
      "corset",
      "glam",
      "nữ tính"
    ],
    "occasion": [
      "đi tiệc",
      "sự kiện buổi tối",
      "hẹn hò"
    ],
    "material": "Nhung tuyết co giãn cao cấp lót lụa",
    "fit": "Fitted corset bodycon",
    "silhouette": "bodycon",
    "lengthClass": "mini",
    "neckline": "sweetheart",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "TP-GOTHIC-LACE-BLK",
    "groupCode": "TP-GOTHIC-LACE",
    "name": "Gothic Lace-Up Boned Corset",
    "subtitle": "Áo corset ren hoa thêu gọng định hình thắt dây lưng (Đen)",
    "category": "tops",
    "type": "corset",
    "price": 1450000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/top-corset-lace-black.jpg",
    "style": [
      "corset",
      "sexy",
      "gothic",
      "statement"
    ],
    "occasion": [
      "đi tiệc",
      "hẹn hò",
      "concert"
    ],
    "material": "Ren hoa cao cấp phối satin gọng kim loại mềm",
    "fit": "Structured lace-up corset",
    "silhouette": "fitted",
    "lengthClass": "cropped",
    "neckline": "sweetheart",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "TP-GOTHIC-LACE-WHT",
    "groupCode": "TP-GOTHIC-LACE",
    "name": "Gothic Lace-Up Boned Corset",
    "subtitle": "Áo corset ren hoa thêu gọng định hình thắt dây lưng (Trắng kem)",
    "category": "tops",
    "type": "corset",
    "price": 1450000,
    "color": "Trắng",
    "colorFamily": "white",
    "colorHex": "#FAF8F5",
    "image": "/products/top-corset-satin-white.jpg",
    "style": [
      "corset",
      "romantic",
      "nữ tính"
    ],
    "occasion": [
      "đi tiệc",
      "hẹn hò",
      "chụp ảnh"
    ],
    "material": "Ren hoa cao cấp phối satin gọng kim loại mềm",
    "fit": "Structured lace-up corset",
    "silhouette": "fitted",
    "lengthClass": "cropped",
    "neckline": "sweetheart",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "TP-GOTHIC-LACE-RED",
    "groupCode": "TP-GOTHIC-LACE",
    "name": "Gothic Lace-Up Boned Corset",
    "subtitle": "Áo corset ren hoa thêu gọng định hình thắt dây lưng (Đỏ rượu)",
    "category": "tops",
    "type": "corset",
    "price": 1450000,
    "color": "Đỏ",
    "colorFamily": "red",
    "colorHex": "#881337",
    "image": "/products/top-corset-satin-red.jpg",
    "style": [
      "corset",
      "sexy",
      "statement"
    ],
    "occasion": [
      "đi tiệc",
      "hẹn hò",
      "sự kiện"
    ],
    "material": "Ren hoa cao cấp phối satin gọng kim loại mềm",
    "fit": "Structured lace-up corset",
    "silhouette": "fitted",
    "lengthClass": "cropped",
    "neckline": "sweetheart",
    "sleeveLength": "sleeveless",
    "colorTemperature": "warm"
  },
  {
    "sku": "TP-ATHENA-TUBE-BLK",
    "groupCode": "TP-ATHENA-TUBE",
    "name": "Athena Sweetheart Satin Tube Top",
    "subtitle": "Áo quây cúp ngực lụa satin viền silicon chống tuột (Đen)",
    "category": "tops",
    "type": "crop-top",
    "price": 1150000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#151515",
    "image": "/products/top-corset-satin-black.jpg",
    "style": [
      "minimal",
      "sexy",
      "Y2K"
    ],
    "occasion": [
      "đi chơi",
      "hẹn hò",
      "đi tiệc"
    ],
    "material": "Satin lụa dày dặn lót đúp",
    "fit": "Fitted strapless tube",
    "silhouette": "fitted",
    "lengthClass": "cropped",
    "neckline": "sweetheart",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "TP-ATHENA-TUBE-WHT",
    "groupCode": "TP-ATHENA-TUBE",
    "name": "Athena Sweetheart Satin Tube Top",
    "subtitle": "Áo quây cúp ngực lụa satin viền silicon chống tuột (Trắng tinh)",
    "category": "tops",
    "type": "crop-top",
    "price": 1150000,
    "color": "Trắng",
    "colorFamily": "white",
    "colorHex": "#FFFFFF",
    "image": "/products/top-corset-satin-white.jpg",
    "style": [
      "minimal",
      "nữ tính",
      "Y2K"
    ],
    "occasion": [
      "đi chơi",
      "hẹn hò",
      "cafe"
    ],
    "material": "Satin lụa dày dặn lót đúp",
    "fit": "Fitted strapless tube",
    "silhouette": "fitted",
    "lengthClass": "cropped",
    "neckline": "sweetheart",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "TP-ATHENA-TUBE-RED",
    "groupCode": "TP-ATHENA-TUBE",
    "name": "Athena Sweetheart Satin Tube Top",
    "subtitle": "Áo quây cúp ngực lụa satin nổi bật gợi cảm (Đỏ scarlet)",
    "category": "tops",
    "type": "crop-top",
    "price": 1150000,
    "color": "Đỏ",
    "colorFamily": "red",
    "colorHex": "#B91C1C",
    "image": "/products/top-corset-satin-red.jpg",
    "style": [
      "statement",
      "sexy",
      "glam"
    ],
    "occasion": [
      "đi tiệc",
      "hẹn hò",
      "bar"
    ],
    "material": "Satin lụa dày dặn lót đúp",
    "fit": "Fitted strapless tube",
    "silhouette": "fitted",
    "lengthClass": "cropped",
    "neckline": "sweetheart",
    "sleeveLength": "sleeveless",
    "colorTemperature": "warm"
  },
  {
    "sku": "TP-HALO-KNIT-GRY",
    "groupCode": "TP-HALO-KNIT",
    "name": "Halo High-Neck Knit Tank",
    "subtitle": "Áo len dệt kim cổ cao sát nách phom ôm tôn dáng (Xám khói)",
    "category": "tops",
    "type": "knit-top",
    "price": 890000,
    "color": "Xám",
    "colorFamily": "gray",
    "colorHex": "#6B7280",
    "image": "/products/top-knit-tank-grey.jpeg",
    "style": [
      "minimal",
      "công sở",
      "chic"
    ],
    "occasion": [
      "đi làm",
      "cafe",
      "đi chơi"
    ],
    "material": "Len dệt kim mỏng nhẹ co giãn",
    "fit": "Fitted high-neck",
    "silhouette": "fitted",
    "lengthClass": "regular",
    "neckline": "high",
    "sleeveLength": "sleeveless",
    "colorTemperature": "cool"
  },
  {
    "sku": "TP-HALO-KNIT-BLK",
    "groupCode": "TP-HALO-KNIT",
    "name": "Halo High-Neck Knit Tank",
    "subtitle": "Áo len dệt kim cổ cao sát nách phom ôm tối giản (Đen)",
    "category": "tops",
    "type": "knit-top",
    "price": 890000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/top-basic-black.jpg",
    "style": [
      "minimal",
      "chic"
    ],
    "occasion": [
      "đi làm",
      "cafe",
      "hẹn hò"
    ],
    "material": "Len dệt kim mỏng nhẹ co giãn",
    "fit": "Fitted high-neck",
    "silhouette": "fitted",
    "lengthClass": "regular",
    "neckline": "high",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "TP-HALO-KNIT-WHT",
    "groupCode": "TP-HALO-KNIT",
    "name": "Halo High-Neck Knit Tank",
    "subtitle": "Áo len dệt kim cổ cao sát nách phom ôm thanh lịch (Trắng)",
    "category": "tops",
    "type": "knit-top",
    "price": 890000,
    "color": "Trắng",
    "colorFamily": "white",
    "colorHex": "#F9FAFB",
    "image": "/products/top-crop-tank-white.png",
    "style": [
      "minimal",
      "chic",
      "nữ tính"
    ],
    "occasion": [
      "đi làm",
      "cafe",
      "dạo phố"
    ],
    "material": "Len dệt kim mỏng nhẹ co giãn",
    "fit": "Fitted high-neck",
    "silhouette": "fitted",
    "lengthClass": "regular",
    "neckline": "high",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "TP-BABY-TEE-WHT",
    "groupCode": "TP-BABY-TEE",
    "name": "Signature Cotton Baby Tee",
    "subtitle": "Áo thun baby tee cotton 100% cổ tròn ôm dáng chuẩn Y2K (Trắng)",
    "category": "tops",
    "type": "crop-top",
    "price": 650000,
    "color": "Trắng",
    "colorFamily": "white",
    "colorHex": "#FFFFFF",
    "image": "/products/top-basic-white.jpg",
    "style": [
      "Y2K",
      "casual",
      "streetwear"
    ],
    "occasion": [
      "đi chơi",
      "cafe",
      "dạo phố"
    ],
    "material": "100% Cotton Compact 2 chiều",
    "fit": "Baby tee fitted crop",
    "silhouette": "fitted",
    "lengthClass": "cropped",
    "neckline": "round",
    "sleeveLength": "short",
    "colorTemperature": "neutral"
  },
  {
    "sku": "TP-BABY-TEE-BLK",
    "groupCode": "TP-BABY-TEE",
    "name": "Signature Cotton Baby Tee",
    "subtitle": "Áo thun baby tee cotton 100% cổ tròn ôm dáng chuẩn Y2K (Đen)",
    "category": "tops",
    "type": "crop-top",
    "price": 650000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/top-basic-black.jpg",
    "style": [
      "Y2K",
      "casual",
      "streetwear"
    ],
    "occasion": [
      "đi chơi",
      "cafe",
      "dạo phố"
    ],
    "material": "100% Cotton Compact 2 chiều",
    "fit": "Baby tee fitted crop",
    "silhouette": "fitted",
    "lengthClass": "cropped",
    "neckline": "round",
    "sleeveLength": "short",
    "colorTemperature": "neutral"
  },
  {
    "sku": "TP-MINIMAL-TANK-WHT",
    "groupCode": "TP-MINIMAL-TANK",
    "name": "Minimalist Seamless Ribbed Tank",
    "subtitle": "Áo tank top gân tăm co giãn dáng ôm sát nách (Trắng)",
    "category": "tops",
    "type": "crop-top",
    "price": 620000,
    "color": "Trắng",
    "colorFamily": "white",
    "colorHex": "#F9FAFB",
    "image": "/products/top-crop-tank-white.png",
    "style": [
      "minimal",
      "casual"
    ],
    "occasion": [
      "đi chơi",
      "cafe",
      "ở nhà"
    ],
    "material": "Cotton tăm co giãn 4 chiều",
    "fit": "Seamless fitted tank",
    "silhouette": "fitted",
    "lengthClass": "cropped",
    "neckline": "scoop",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "TP-MINIMAL-TANK-BLK",
    "groupCode": "TP-MINIMAL-TANK",
    "name": "Minimalist Seamless Ribbed Tank",
    "subtitle": "Áo tank top gân tăm co giãn dáng ôm sát nách (Đen)",
    "category": "tops",
    "type": "crop-top",
    "price": 620000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/top-ribbed-crop-black.jpg",
    "style": [
      "minimal",
      "casual",
      "Y2K"
    ],
    "occasion": [
      "đi chơi",
      "cafe",
      "ở nhà"
    ],
    "material": "Cotton tăm co giãn 4 chiều",
    "fit": "Seamless fitted tank",
    "silhouette": "fitted",
    "lengthClass": "cropped",
    "neckline": "scoop",
    "sleeveLength": "sleeveless",
    "colorTemperature": "neutral"
  },
  {
    "sku": "TP-LUXE-POPLIN-WHT",
    "groupCode": "TP-LUXE-POPLIN",
    "name": "Luxe Oversized Crisp Poplin Shirt",
    "subtitle": "Áo sơ mi poplin phom rộng tay dài vạt bầu thanh lịch (Trắng)",
    "category": "tops",
    "type": "shirt",
    "price": 1250000,
    "color": "Trắng",
    "colorFamily": "white",
    "colorHex": "#FFFFFF",
    "image": "/products/shirt-poplin-white.jpg",
    "style": [
      "công sở",
      "minimal",
      "chic"
    ],
    "occasion": [
      "đi làm",
      "cafe",
      "hẹn hò"
    ],
    "material": "100% Poplin Cotton Nhật",
    "fit": "Oversized boyfriend fit",
    "silhouette": "loose",
    "lengthClass": "regular",
    "neckline": "collared",
    "sleeveLength": "long",
    "colorTemperature": "neutral"
  },
  {
    "sku": "TP-LUXE-POPLIN-BLU",
    "groupCode": "TP-LUXE-POPLIN",
    "name": "Luxe Oversized Crisp Poplin Shirt",
    "subtitle": "Áo sơ mi poplin phom rộng tay dài phong cách Hàn Quốc (Xanh baby blue)",
    "category": "tops",
    "type": "shirt",
    "price": 1250000,
    "color": "Xanh pastel",
    "colorFamily": "blue",
    "colorHex": "#BFDBFE",
    "image": "/products/shirt-poplin-blue.jpg",
    "style": [
      "công sở",
      "minimal",
      "chic"
    ],
    "occasion": [
      "đi làm",
      "cafe",
      "dạo phố"
    ],
    "material": "100% Poplin Cotton Nhật",
    "fit": "Oversized boyfriend fit",
    "silhouette": "loose",
    "lengthClass": "regular",
    "neckline": "collared",
    "sleeveLength": "long",
    "colorTemperature": "cool"
  },
  {
    "sku": "TP-LUXE-POPLIN-BLK",
    "groupCode": "TP-LUXE-POPLIN",
    "name": "Luxe Oversized Crisp Poplin Shirt",
    "subtitle": "Áo sơ mi poplin phom rộng cá tính thời thượng (Đen tuyền)",
    "category": "tops",
    "type": "shirt",
    "price": 1250000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/shirt-poplin-black.jpg",
    "style": [
      "chic",
      "minimal",
      "statement"
    ],
    "occasion": [
      "đi làm",
      "đi chơi",
      "hẹn hò"
    ],
    "material": "100% Poplin Cotton Nhật",
    "fit": "Oversized boyfriend fit",
    "silhouette": "loose",
    "lengthClass": "regular",
    "neckline": "collared",
    "sleeveLength": "long",
    "colorTemperature": "neutral"
  },
  {
    "sku": "TP-STRIPED-OXF-BLU",
    "groupCode": "TP-STRIPED-OXF",
    "name": "Classic Striped Oxford Shirt",
    "subtitle": "Áo sơ mi oxford kẻ sọc dọc phom suông cổ điển (Kẻ sọc xanh)",
    "category": "tops",
    "type": "shirt",
    "price": 1320000,
    "color": "Xanh",
    "colorFamily": "blue",
    "colorHex": "#93C5FD",
    "image": "/products/shirt-oxford-striped.jpeg",
    "style": [
      "preppy",
      "công sở",
      "chic"
    ],
    "occasion": [
      "đi làm",
      "đi học",
      "cafe"
    ],
    "material": "Oxford Cotton dệt sọc",
    "fit": "Relaxed tailored fit",
    "silhouette": "relaxed",
    "lengthClass": "regular",
    "neckline": "collared",
    "sleeveLength": "long",
    "colorTemperature": "cool"
  },
  {
    "sku": "TP-STRIPED-OXF-WHT",
    "groupCode": "TP-STRIPED-OXF",
    "name": "Classic Striped Oxford Shirt",
    "subtitle": "Áo sơ mi oxford kẻ sọc xám thanh tao hiện đại (Trắng sọc xám)",
    "category": "tops",
    "type": "shirt",
    "price": 1320000,
    "color": "Trắng",
    "colorFamily": "white",
    "colorHex": "#E5E7EB",
    "image": "/products/shirt-poplin-white.jpg",
    "style": [
      "preppy",
      "công sở",
      "minimal"
    ],
    "occasion": [
      "đi làm",
      "đi học",
      "cafe"
    ],
    "material": "Oxford Cotton dệt sọc",
    "fit": "Relaxed tailored fit",
    "silhouette": "relaxed",
    "lengthClass": "regular",
    "neckline": "collared",
    "sleeveLength": "long",
    "colorTemperature": "neutral"
  },
  {
    "sku": "SK-SATIN-SLIT-BLK",
    "groupCode": "SK-SATIN-SLIT",
    "name": "Satin Bias-Cut Slit Midi Skirt",
    "subtitle": "Chân váy lụa satin xẻ tà tà lệch dáng midi tôn dáng (Đen bóng)",
    "category": "bottoms",
    "type": "skirt",
    "price": 1350000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/skirt-slit-midi-black.jpg",
    "style": [
      "sexy",
      "elegant",
      "minimal"
    ],
    "occasion": [
      "hẹn hò",
      "đi tiệc",
      "cafe"
    ],
    "material": "Lụa satin dày mịn cắt xéo sợi (bias cut)",
    "fit": "Bias-cut fluid drape with slit",
    "silhouette": "a-line",
    "lengthClass": "midi",
    "waistRise": "high",
    "colorTemperature": "neutral"
  },
  {
    "sku": "SK-SATIN-SLIT-BEI",
    "groupCode": "SK-SATIN-SLIT",
    "name": "Satin Bias-Cut Slit Midi Skirt",
    "subtitle": "Chân váy lụa satin xẻ tà tà lệch dáng midi tao nhã (Be champagne)",
    "category": "bottoms",
    "type": "skirt",
    "price": 1350000,
    "color": "Be",
    "colorFamily": "beige",
    "colorHex": "#F3ECE2",
    "image": "/products/skirt-pleated-mini-white.jpg",
    "style": [
      "elegant",
      "nữ tính",
      "chic"
    ],
    "occasion": [
      "hẹn hò",
      "đi tiệc",
      "cafe"
    ],
    "material": "Lụa satin dày mịn cắt xéo sợi (bias cut)",
    "fit": "Bias-cut fluid drape with slit",
    "silhouette": "a-line",
    "lengthClass": "midi",
    "waistRise": "high",
    "colorTemperature": "warm"
  },
  {
    "sku": "SK-SATIN-SLIT-RED",
    "groupCode": "SK-SATIN-SLIT",
    "name": "Satin Bias-Cut Slit Midi Skirt",
    "subtitle": "Chân váy lụa satin xẻ tà tà lệch dáng midi kiêu sa (Đỏ mận)",
    "category": "bottoms",
    "type": "skirt",
    "price": 1350000,
    "color": "Đỏ",
    "colorFamily": "red",
    "colorHex": "#881337",
    "image": "/products/skirt-pleated-mini-black.jpg",
    "style": [
      "sexy",
      "glam",
      "statement"
    ],
    "occasion": [
      "hẹn hò",
      "đi tiệc",
      "sự kiện"
    ],
    "material": "Lụa satin dày mịn cắt xéo sợi (bias cut)",
    "fit": "Bias-cut fluid drape with slit",
    "silhouette": "a-line",
    "lengthClass": "midi",
    "waistRise": "high",
    "colorTemperature": "warm"
  },
  {
    "sku": "SK-VINTAGE-DENIM-BLU",
    "groupCode": "SK-VINTAGE-DENIM",
    "name": "Vintage Washed Denim Mini Skirt",
    "subtitle": "Chân váy bò denim ngắn cạp cao rách gấu vintage (Xanh denim)",
    "category": "bottoms",
    "type": "skirt",
    "price": 950000,
    "color": "Xanh",
    "colorFamily": "blue",
    "colorHex": "#3B82F6",
    "image": "/products/skirt-denim-mini-blue.jpg",
    "style": [
      "Y2K",
      "casual",
      "streetwear"
    ],
    "occasion": [
      "đi chơi",
      "cafe",
      "dạo phố"
    ],
    "material": "Denim 100% Cotton wash mài",
    "fit": "A-line raw hem mini",
    "silhouette": "a-line",
    "lengthClass": "mini",
    "waistRise": "high",
    "colorTemperature": "cool"
  },
  {
    "sku": "SK-VINTAGE-DENIM-BLK",
    "groupCode": "SK-VINTAGE-DENIM",
    "name": "Vintage Washed Denim Mini Skirt",
    "subtitle": "Chân váy bò denim ngắn cạp cao rách gấu cá tính (Đen washed)",
    "category": "bottoms",
    "type": "skirt",
    "price": 950000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#262626",
    "image": "/products/skirt-pleated-mini-black.jpg",
    "style": [
      "Y2K",
      "streetwear",
      "statement"
    ],
    "occasion": [
      "đi chơi",
      "concert",
      "cafe"
    ],
    "material": "Denim 100% Cotton wash mài",
    "fit": "A-line raw hem mini",
    "silhouette": "a-line",
    "lengthClass": "mini",
    "waistRise": "high",
    "colorTemperature": "neutral"
  },
  {
    "sku": "SK-PLEAT-KILT-BLK",
    "groupCode": "SK-PLEAT-KILT",
    "name": "Pleated High-Waist Schoolgirl Skirt",
    "subtitle": "Chân váy xếp ly cạp cao kèm đai da kim loại phong cách nữ sinh (Đen)",
    "category": "bottoms",
    "type": "skirt",
    "price": 920000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/skirt-pleated-mini-black.jpg",
    "style": [
      "preppy",
      "Y2K",
      "nữ tính"
    ],
    "occasion": [
      "đi học",
      "đi chơi",
      "cafe"
    ],
    "material": "Vải tuyết mưa đứng phom có quần lót trong",
    "fit": "High-waist pleated kilt",
    "silhouette": "a-line",
    "lengthClass": "mini",
    "waistRise": "high",
    "colorTemperature": "neutral"
  },
  {
    "sku": "SK-PLEAT-KILT-WHT",
    "groupCode": "SK-PLEAT-KILT",
    "name": "Pleated High-Waist Schoolgirl Skirt",
    "subtitle": "Chân váy xếp ly cạp cao năng động tươi tắn (Trắng tuyết)",
    "category": "bottoms",
    "type": "skirt",
    "price": 920000,
    "color": "Trắng",
    "colorFamily": "white",
    "colorHex": "#FFFFFF",
    "image": "/products/skirt-pleated-mini-white.jpg",
    "style": [
      "preppy",
      "nữ tính"
    ],
    "occasion": [
      "đi học",
      "đi chơi",
      "cafe"
    ],
    "material": "Vải tuyết mưa đứng phom có quần lót trong",
    "fit": "High-waist pleated kilt",
    "silhouette": "a-line",
    "lengthClass": "mini",
    "waistRise": "high",
    "colorTemperature": "neutral"
  },
  {
    "sku": "SK-PLEAT-KILT-GRY",
    "groupCode": "SK-PLEAT-KILT",
    "name": "Pleated High-Waist Schoolgirl Skirt",
    "subtitle": "Chân váy xếp ly cạp cao chuẩn phong cách học đường (Xám heather)",
    "category": "bottoms",
    "type": "skirt",
    "price": 920000,
    "color": "Xám",
    "colorFamily": "gray",
    "colorHex": "#6B7280",
    "image": "/products/skirt-pleated-grey.jpg",
    "style": [
      "preppy",
      "Y2K"
    ],
    "occasion": [
      "đi học",
      "đi chơi",
      "cafe"
    ],
    "material": "Vải tuyết mưa đứng phom có quần lót trong",
    "fit": "High-waist pleated kilt",
    "silhouette": "a-line",
    "lengthClass": "mini",
    "waistRise": "high",
    "colorTemperature": "cool"
  },
  {
    "sku": "PT-TAILORED-BERM-BLK",
    "groupCode": "PT-TAILORED-BERM",
    "name": "Tailored Pleated Bermuda Suit Shorts",
    "subtitle": "Quần short lửng xếp ly bermuda may đo âu phục sang trọng (Đen)",
    "category": "bottoms",
    "type": "shorts",
    "price": 980000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/pants-tailored-wide-black.jpg",
    "style": [
      "công sở",
      "chic",
      "minimal"
    ],
    "occasion": [
      "đi làm",
      "cafe",
      "hẹn hò"
    ],
    "material": "Vải cashmere pha đứng phom",
    "fit": "High-waist tailored bermuda",
    "silhouette": "straight",
    "lengthClass": "knee-length",
    "waistRise": "high",
    "colorTemperature": "neutral"
  },
  {
    "sku": "PT-TAILORED-BERM-BEI",
    "groupCode": "PT-TAILORED-BERM",
    "name": "Tailored Pleated Bermuda Suit Shorts",
    "subtitle": "Quần short lửng xếp ly bermuda may đo âu phục thanh lịch (Be cát)",
    "category": "bottoms",
    "type": "shorts",
    "price": 980000,
    "color": "Be",
    "colorFamily": "beige",
    "colorHex": "#E7E0D3",
    "image": "/products/pants-chinos-beige.webp",
    "style": [
      "công sở",
      "chic",
      "minimal"
    ],
    "occasion": [
      "đi làm",
      "cafe",
      "hẹn hò"
    ],
    "material": "Vải cashmere pha đứng phom",
    "fit": "High-waist tailored bermuda",
    "silhouette": "straight",
    "lengthClass": "knee-length",
    "waistRise": "high",
    "colorTemperature": "warm"
  },
  {
    "sku": "PT-TAILORED-BERM-GRY",
    "groupCode": "PT-TAILORED-BERM",
    "name": "Tailored Pleated Bermuda Suit Shorts",
    "subtitle": "Quần short lửng xếp ly bermuda may đo chuẩn form (Xám ghi)",
    "category": "bottoms",
    "type": "shorts",
    "price": 980000,
    "color": "Xám",
    "colorFamily": "gray",
    "colorHex": "#4B5563",
    "image": "/products/skirt-pleated-grey.jpg",
    "style": [
      "công sở",
      "chic"
    ],
    "occasion": [
      "đi làm",
      "cafe",
      "dạo phố"
    ],
    "material": "Vải cashmere pha đứng phom",
    "fit": "High-waist tailored bermuda",
    "silhouette": "straight",
    "lengthClass": "knee-length",
    "waistRise": "high",
    "colorTemperature": "cool"
  },
  {
    "sku": "SK-TWEED-MINI-WHT",
    "groupCode": "SK-TWEED-MINI",
    "name": "Tweed A-Line Mini Skirt with Gold Buttons",
    "subtitle": "Chân váy chữ A vải dạ tweed đính cúc vàng quý tộc (Trắng kem)",
    "category": "bottoms",
    "type": "skirt",
    "price": 1150000,
    "color": "Trắng",
    "colorFamily": "white",
    "colorHex": "#FAF8F5",
    "image": "/products/skirt-pleated-mini-white.jpg",
    "style": [
      "glam",
      "nữ tính",
      "preppy"
    ],
    "occasion": [
      "đi tiệc",
      "hẹn hò",
      "cafe"
    ],
    "material": "Dạ tweed dệt kim tuyến cao cấp có lót lụa",
    "fit": "A-line high-rise mini",
    "silhouette": "a-line",
    "lengthClass": "mini",
    "waistRise": "high",
    "colorTemperature": "neutral"
  },
  {
    "sku": "SK-TWEED-MINI-BLK",
    "groupCode": "SK-TWEED-MINI",
    "name": "Tweed A-Line Mini Skirt with Gold Buttons",
    "subtitle": "Chân váy chữ A vải dạ tweed đính cúc vàng tiểu thư (Đen tuyền)",
    "category": "bottoms",
    "type": "skirt",
    "price": 1150000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#151515",
    "image": "/products/skirt-pleated-mini-black.jpg",
    "style": [
      "glam",
      "chic",
      "statement"
    ],
    "occasion": [
      "đi tiệc",
      "hẹn hò",
      "sự kiện"
    ],
    "material": "Dạ tweed dệt kim tuyến cao cấp có lót lụa",
    "fit": "A-line high-rise mini",
    "silhouette": "a-line",
    "lengthClass": "mini",
    "waistRise": "high",
    "colorTemperature": "neutral"
  },
  {
    "sku": "PT-FLARE-DENIM-BLU",
    "groupCode": "PT-FLARE-DENIM",
    "name": "Y2K Mid-Rise Bell-Bottom Flare Jeans",
    "subtitle": "Quần jeans ống loe cạp vừa tôn chân dài miên man (Xanh denim)",
    "category": "bottoms",
    "type": "flare-pants",
    "price": 1550000,
    "color": "Xanh",
    "colorFamily": "blue",
    "colorHex": "#1E40AF",
    "image": "/products/pants-flare-denim-blue.jpg",
    "style": [
      "Y2K",
      "casual",
      "chic"
    ],
    "occasion": [
      "đi chơi",
      "cafe",
      "hẹn hò"
    ],
    "material": "Denim co giãn nhẹ 98% cotton 2% spandex",
    "fit": "Mid-rise bell-bottom flare",
    "silhouette": "flare",
    "lengthClass": "floor-length",
    "waistRise": "mid",
    "colorTemperature": "cool"
  },
  {
    "sku": "PT-FLARE-DENIM-BLK",
    "groupCode": "PT-FLARE-DENIM",
    "name": "Y2K Mid-Rise Bell-Bottom Flare Jeans",
    "subtitle": "Quần jeans ống loe cạp vừa hack dáng cực đỉnh (Đen wash)",
    "category": "bottoms",
    "type": "flare-pants",
    "price": 1550000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#1F2937",
    "image": "/products/pants-tailored-wide-black.jpg",
    "style": [
      "Y2K",
      "statement",
      "chic"
    ],
    "occasion": [
      "đi chơi",
      "concert",
      "cafe"
    ],
    "material": "Denim co giãn nhẹ 98% cotton 2% spandex",
    "fit": "Mid-rise bell-bottom flare",
    "silhouette": "flare",
    "lengthClass": "floor-length",
    "waistRise": "mid",
    "colorTemperature": "neutral"
  },
  {
    "sku": "PT-WIDE-PLEAT-BLK",
    "groupCode": "PT-WIDE-PLEAT",
    "name": "High-Waist Deep-Pleat Wide Slacks",
    "subtitle": "Quần tây ống rộng xếp ly sâu tôn eo thon kéo dài chân (Đen công sở)",
    "category": "bottoms",
    "type": "trousers",
    "price": 1480000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/pants-tailored-wide-black.jpg",
    "style": [
      "công sở",
      "minimal",
      "chic"
    ],
    "occasion": [
      "đi làm",
      "sự kiện",
      "cafe"
    ],
    "material": "Vải đũi tuyết cao cấp rủ mềm",
    "fit": "High-waist wide leg",
    "silhouette": "wide-leg",
    "lengthClass": "floor-length",
    "waistRise": "high",
    "colorTemperature": "neutral"
  },
  {
    "sku": "PT-WIDE-PLEAT-BEI",
    "groupCode": "PT-WIDE-PLEAT",
    "name": "High-Waist Deep-Pleat Wide Slacks",
    "subtitle": "Quần tây ống rộng xếp ly sâu tôn eo thon kéo dài chân (Be kem)",
    "category": "bottoms",
    "type": "trousers",
    "price": 1480000,
    "color": "Be",
    "colorFamily": "beige",
    "colorHex": "#EFECE6",
    "image": "/products/pants-tailored-wide-beige.jpg",
    "style": [
      "công sở",
      "minimal",
      "chic"
    ],
    "occasion": [
      "đi làm",
      "sự kiện",
      "cafe"
    ],
    "material": "Vải đũi tuyết cao cấp rủ mềm",
    "fit": "High-waist wide leg",
    "silhouette": "wide-leg",
    "lengthClass": "floor-length",
    "waistRise": "high",
    "colorTemperature": "warm"
  },
  {
    "sku": "PT-WIDE-PLEAT-BRN",
    "groupCode": "PT-WIDE-PLEAT",
    "name": "High-Waist Deep-Pleat Wide Slacks",
    "subtitle": "Quần tây ống rộng xếp ly sâu tông màu trầm ấm (Nâu mocha)",
    "category": "bottoms",
    "type": "trousers",
    "price": 1480000,
    "color": "Nâu",
    "colorFamily": "brown",
    "colorHex": "#58311E",
    "image": "/products/pants-trousers-brown.jpg",
    "style": [
      "chic",
      "vintage",
      "công sở"
    ],
    "occasion": [
      "đi làm",
      "cafe",
      "hẹn hò"
    ],
    "material": "Vải đũi tuyết cao cấp rủ mềm",
    "fit": "High-waist wide leg",
    "silhouette": "wide-leg",
    "lengthClass": "floor-length",
    "waistRise": "high",
    "colorTemperature": "warm"
  },
  {
    "sku": "PT-CHINOS-CASUAL-BEI",
    "groupCode": "PT-CHINOS-CASUAL",
    "name": "Tailored Pleated City Chinos",
    "subtitle": "Quần dài chinos xếp ly phom đứng phong cách Parisian (Be nhạt)",
    "category": "bottoms",
    "type": "trousers",
    "price": 1280000,
    "color": "Be",
    "colorFamily": "beige",
    "colorHex": "#F5F1E8",
    "image": "/products/pants-chinos-beige.webp",
    "style": [
      "minimal",
      "công sở",
      "casual"
    ],
    "occasion": [
      "đi làm",
      "dạo phố",
      "cafe"
    ],
    "material": "Kaki cotton dệt twill cao cấp",
    "fit": "Pleated straight fit",
    "silhouette": "straight",
    "lengthClass": "ankle-length",
    "waistRise": "mid",
    "colorTemperature": "warm"
  },
  {
    "sku": "PT-CHINOS-CASUAL-BLK",
    "groupCode": "PT-CHINOS-CASUAL",
    "name": "Tailored Pleated City Chinos",
    "subtitle": "Quần dài chinos xếp ly phom đứng phong cách Parisian (Đen)",
    "category": "bottoms",
    "type": "trousers",
    "price": 1280000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/pants-tailored-wide-black.jpg",
    "style": [
      "minimal",
      "công sở",
      "casual"
    ],
    "occasion": [
      "đi làm",
      "dạo phố",
      "cafe"
    ],
    "material": "Kaki cotton dệt twill cao cấp",
    "fit": "Pleated straight fit",
    "silhouette": "straight",
    "lengthClass": "ankle-length",
    "waistRise": "mid",
    "colorTemperature": "neutral"
  },
  {
    "sku": "PT-SLIM-SLIT-BLK",
    "groupCode": "PT-SLIM-SLIT",
    "name": "Front-Slit Slim Flared Trousers",
    "subtitle": "Quần tây ôm xẻ tà trước ống loe nhẹ hack chiều cao (Đen)",
    "category": "bottoms",
    "type": "flare-pants",
    "price": 1390000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/pants-tailored-wide-black.jpg",
    "style": [
      "chic",
      "sexy",
      "công sở"
    ],
    "occasion": [
      "đi làm",
      "hẹn hò",
      "đi tiệc"
    ],
    "material": "Vải trượt hàn co giãn nhẹ",
    "fit": "Slim flare with front slit",
    "silhouette": "flare",
    "lengthClass": "floor-length",
    "waistRise": "high",
    "colorTemperature": "neutral"
  },
  {
    "sku": "JK-TWEED-CROP-WHT",
    "groupCode": "JK-TWEED-CROP",
    "name": "Luxury Cropped Tweed Jacket",
    "subtitle": "Áo khoác dạ tweed dáng lửng đính cúc kim loại vàng sang trọng (Trắng ngà)",
    "category": "outerwear",
    "type": "jacket",
    "price": 2450000,
    "color": "Trắng",
    "colorFamily": "white",
    "colorHex": "#F8F7F3",
    "image": "/products/jacket-tweed-crop-white.jpg",
    "style": [
      "glam",
      "nữ tính",
      "chic"
    ],
    "occasion": [
      "đi tiệc",
      "hẹn hò",
      "công sở"
    ],
    "material": "Dạ tweed dệt hạt nổi cao cấp có lót lụa",
    "fit": "Cropped boxy tailored fit",
    "silhouette": "boxy",
    "lengthClass": "cropped",
    "neckline": "round",
    "sleeveLength": "long",
    "colorTemperature": "neutral"
  },
  {
    "sku": "JK-TWEED-CROP-BLK",
    "groupCode": "JK-TWEED-CROP",
    "name": "Luxury Cropped Tweed Jacket",
    "subtitle": "Áo khoác dạ tweed dáng lửng đính cúc kim loại vàng quý phái (Đen tuyền)",
    "category": "outerwear",
    "type": "jacket",
    "price": 2450000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/blazer-tailored-black.jpg",
    "style": [
      "glam",
      "chic",
      "statement"
    ],
    "occasion": [
      "đi tiệc",
      "hẹn hò",
      "công sở"
    ],
    "material": "Dạ tweed dệt hạt nổi cao cấp có lót lụa",
    "fit": "Cropped boxy tailored fit",
    "silhouette": "boxy",
    "lengthClass": "cropped",
    "neckline": "round",
    "sleeveLength": "long",
    "colorTemperature": "neutral"
  },
  {
    "sku": "JK-UTILITY-CROP-OLV",
    "groupCode": "JK-UTILITY-CROP",
    "name": "Cropped Utility Cargo Jacket",
    "subtitle": "Áo khoác kaki túi hộp dáng lửng năng động cá tính (Xanh rêu olive)",
    "category": "outerwear",
    "type": "jacket",
    "price": 1680000,
    "color": "Xanh lá",
    "colorFamily": "green",
    "colorHex": "#4D5638",
    "image": "/products/jacket-utility-olive.jpeg",
    "style": [
      "streetwear",
      "Y2K",
      "casual"
    ],
    "occasion": [
      "đi chơi",
      "dạo phố",
      "du lịch"
    ],
    "material": "Kaki thô wash mềm có túi hộp",
    "fit": "Relaxed cropped utility",
    "silhouette": "relaxed",
    "lengthClass": "cropped",
    "neckline": "collared",
    "sleeveLength": "long",
    "colorTemperature": "warm"
  },
  {
    "sku": "BZ-HOURGLASS-BLK",
    "groupCode": "BZ-HOURGLASS",
    "name": "Hourglass Cinched-Waist Structured Blazer",
    "subtitle": "Áo blazer độn vai chiết eo đồng hồ cát tôn dáng quyền lực (Đen)",
    "category": "outerwear",
    "type": "blazer",
    "price": 2750000,
    "color": "Đen",
    "colorFamily": "black",
    "colorHex": "#111111",
    "image": "/products/blazer-tailored-black.jpg",
    "style": [
      "statement",
      "công sở",
      "chic"
    ],
    "occasion": [
      "sự kiện",
      "đi làm",
      "đi tiệc"
    ],
    "material": "Vải may đo âu phục nhập khẩu có đệm vai",
    "fit": "Hourglass cinched waist",
    "silhouette": "hourglass",
    "lengthClass": "hip-length",
    "neckline": "lapel",
    "sleeveLength": "long",
    "colorTemperature": "neutral"
  },
  {
    "sku": "BZ-HOURGLASS-BEI",
    "groupCode": "BZ-HOURGLASS",
    "name": "Hourglass Cinched-Waist Structured Blazer",
    "subtitle": "Áo blazer độn vai chiết eo đồng hồ cát thanh lịch đẳng cấp (Be kem)",
    "category": "outerwear",
    "type": "blazer",
    "price": 2750000,
    "color": "Be",
    "colorFamily": "beige",
    "colorHex": "#EFEAE1",
    "image": "/products/blazer-tailored-beige.jpg",
    "style": [
      "chic",
      "công sở",
      "minimal"
    ],
    "occasion": [
      "sự kiện",
      "đi làm",
      "hẹn hò"
    ],
    "material": "Vải may đo âu phục nhập khẩu có đệm vai",
    "fit": "Hourglass cinched waist",
    "silhouette": "hourglass",
    "lengthClass": "hip-length",
    "neckline": "lapel",
    "sleeveLength": "long",
    "colorTemperature": "warm"
  },
  {
    "sku": "CT-DUSTER-TRENCH-BEI",
    "groupCode": "CT-DUSTER-TRENCH",
    "name": "Belted Flowy Duster Trench Coat",
    "subtitle": "Áo măng tô trench coat dáng dài có đai thắt lưng phong cách Thu Đông (Be camel)",
    "category": "outerwear",
    "type": "jacket",
    "price": 2950000,
    "color": "Be",
    "colorFamily": "beige",
    "colorHex": "#C8A882",
    "image": "/products/coat-trench-beige.jpg",
    "style": [
      "chic",
      "elegant",
      "công sở"
    ],
    "occasion": [
      "du lịch",
      "đi làm",
      "dạo phố"
    ],
    "material": "Vải gabardine dệt mật độ cao chống gió",
    "fit": "Oversized belted trench",
    "silhouette": "relaxed",
    "lengthClass": "maxi",
    "neckline": "lapel",
    "sleeveLength": "long",
    "colorTemperature": "warm"
  }
];

export const extendedProducts: Product[] = data.map(makeProduct);

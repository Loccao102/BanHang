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

export const products: Product[] = [
  {
    ...common,
    id: "lsoul-dydy-dress-v25021658",
    sku: "V25021658",
    groupCode: "V25021658",
    name: "Dydy Dress",
    subtitle: "Đầm cổ yếm đan dây corset lấp lánh ánh nâu đỏ",
    category: "dress",
    type: "midi-dress",
    price: 2930000,
    oldPrice: 3080000,
    color: "Nâu đỏ",
    colorFamily: "red",
    colorHex: "#6F2633",
    variants: variants("V25021658"),
    image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m6nne8nuelvcba",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m6nne8nuelvcba",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m6nne8nud7aw8b",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m6nne8nubsrcb1",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m6nne8nud7bsb9"
    ],
    style: ["nữ tính", "glam", "statement", "corset"],
    occasion: ["đi tiệc", "hẹn hò", "sự kiện buổi tối"],
    material: "Lưới cao cấp đính kim sa, lót khaki",
    fit: "Corset fit & flare",
    featured: true,
    isNew: true,
    sourceUrl: "https://shopee.vn/-T%E1%BA%B7ng-h%E1%BB%99p-LSOUL-V%C3%A1y-C%E1%BB%95-Y%E1%BA%BFm-%C4%90an-D%C3%A2y-Corset-L%E1%BA%A5p-L%C3%A1nh-%C3%81nh-N%C3%A2u-%C4%90%E1%BB%8F-Dydy-Dress-V25021658-i.269491027.29127387970",
    sourceUpdatedAt: "2026-10-01",
    sourceType: "official-marketplace",
    tryOnCategory: "one-pieces",
    tryOnPhotoType: "model",
    tryOnImage: "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m6nne8nuelvcba",
    silhouette: "fit-and-flare",
    lengthClass: "midi",
    neckline: "halter",
    sleeveLength: "sleeveless",
    pattern: "sparkle",
    season: ["spring", "summer", "autumn"],
    formality: 5,
    warmth: 2,
    stretch: 2,
    coverage: 3,
    colorTemperature: "warm",
    styleKeywords: ["corset", "lấp lánh", "tôn eo", "đi tiệc", "nữ tính", "nổi bật"],
    aiSearchText: "đầm corset nâu đỏ cổ yếm lấp lánh đi tiệc hẹn hò tôn eo nữ tính statement",
    analyzerReady: true
  },
  {
    ...common,
    id: "lsoul-level-dress-v24101636",
    sku: "V24101636",
    groupCode: "V24101636",
    name: "Level Dress",
    subtitle: "Đầm xòe cổ yếm hở lưng đan dây corset caro",
    category: "dress",
    type: "mini-dress",
    price: 1231999,
    oldPrice: 1760000,
    color: "Tím than",
    colorFamily: "navy",
    colorHex: "#302A48",
    variants: variants("V24101636"),
    image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m1f1r7brp00o0c",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m1f1r7brp00o0c",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m3786z31jdnw66",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m37874ddsu7g5a",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m3786z3ly0oca5"
    ],
    style: ["nữ tính", "preppy", "statement", "corset"],
    occasion: ["đi tiệc", "hẹn hò", "đi chơi"],
    material: "Nỉ mềm",
    fit: "Fit & flare, corset lace-up back",
    featured: true,
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dam-xoe-co-yem-ho-lung-dan-day-corset-caro-di-tiec-level-dress-v24101636-269491027.27364132353/",
    sourceUpdatedAt: "2026-09-15",
    sourceType: "retailer-corroborated",
    tryOnCategory: "one-pieces",
    tryOnPhotoType: "model",
    tryOnImage: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m1f1r7brp00o0c",
    silhouette: "fit-and-flare",
    lengthClass: "mini",
    neckline: "halter",
    sleeveLength: "sleeveless",
    pattern: "plaid",
    season: ["spring", "autumn"],
    formality: 4,
    warmth: 3,
    stretch: 2,
    coverage: 2,
    colorTemperature: "cool",
    styleKeywords: ["caro", "corset", "hở lưng", "mini dress", "preppy", "đi tiệc"],
    aiSearchText: "đầm tím than caro cổ yếm corset hở lưng mini đi tiệc hẹn hò preppy",
    analyzerReady: true
  },
  {
    ...common,
    id: "lsoul-wink-dress-v24111637",
    sku: "V24111637",
    groupCode: "V24111637",
    name: "Wink Dress",
    subtitle: "Đầm hai dây dáng xòe họa tiết rằn ri cá tính",
    category: "dress",
    type: "mini-dress",
    price: 1694000,
    oldPrice: 2420000,
    color: "Xám rằn ri",
    colorFamily: "gray",
    colorHex: "#767776",
    variants: variants("V24111637"),
    image: "https://chuuicollection.com/cdn/shop/files/18e299ff8694ecfd74157404e11bca4.jpg?v=1736924625",
    images: ["https://chuuicollection.com/cdn/shop/files/18e299ff8694ecfd74157404e11bca4.jpg?v=1736924625"],
    style: ["Y2K", "cá tính", "streetwear", "statement"],
    occasion: ["đi chơi", "concert", "sự kiện", "hẹn hò"],
    material: "Chất liệu tổng hợp theo listing thương hiệu",
    fit: "Structured fit & flare",
    featured: true,
    sourceUrl: "https://dosi-in.com/thuong-hieu/lsoul/trang-2/",
    sourceUpdatedAt: "2026-10-02",
    sourceType: "retailer-corroborated",
    tryOnCategory: "one-pieces",
    tryOnPhotoType: "model",
    tryOnImage: "https://chuuicollection.com/cdn/shop/files/18e299ff8694ecfd74157404e11bca4.jpg?v=1736924625",
    silhouette: "structured-flare",
    lengthClass: "mini",
    neckline: "square",
    sleeveLength: "sleeveless",
    pattern: "camo",
    season: ["spring", "summer", "autumn"],
    formality: 3,
    warmth: 2,
    stretch: 1,
    coverage: 2,
    colorTemperature: "neutral",
    styleKeywords: ["camo", "Y2K", "streetwear", "dáng xòe", "cá tính"],
    aiSearchText: "đầm mini camo xám rằn ri Y2K streetwear cá tính concert đi chơi",
    analyzerReady: true
  },
  {
    ...common,
    id: "lsoul-lind-dress-v24101633",
    sku: "V24101633",
    groupCode: "V24101633",
    name: "Lind Dress",
    subtitle: "Váy hai dây ôm thân phối tầng bèo trắng",
    category: "dress",
    type: "mini-dress",
    price: 971000,
    oldPrice: 1430000,
    color: "Trắng",
    colorFamily: "white",
    colorHex: "#F5F3EE",
    variants: variants("V24101633"),
    image: "https://www.lawdivineus.com/cdn/shop/files/LIND-DRESS-3.webp?v=1756937320",
    images: ["https://www.lawdivineus.com/cdn/shop/files/LIND-DRESS-3.webp?v=1756937320"],
    style: ["nữ tính", "romantic", "western", "statement"],
    occasion: ["đi chơi", "hẹn hò", "sự kiện"],
    material: "Viscose, spandex và cotton theo retailer listing",
    fit: "Slim upper body with tiered ruffle skirt",
    featured: true,
    sourceUrl: "https://www.lawdivineus.com/products/l-soul-lind-dress",
    sourceUpdatedAt: "2026-10-02",
    sourceType: "retailer-corroborated",
    tryOnCategory: "one-pieces",
    tryOnPhotoType: "model",
    tryOnImage: "https://www.lawdivineus.com/cdn/shop/files/LIND-DRESS-3.webp?v=1756937320",
    silhouette: "slim-ruffle",
    lengthClass: "mini",
    neckline: "scoop",
    sleeveLength: "sleeveless",
    pattern: "solid",
    season: ["spring", "summer"],
    formality: 3,
    warmth: 1,
    stretch: 4,
    coverage: 2,
    colorTemperature: "neutral",
    styleKeywords: ["trắng", "bèo tầng", "nữ tính", "romantic", "mini dress"],
    aiSearchText: "váy trắng mini hai dây ôm thân bèo tầng nữ tính romantic hẹn hò",
    analyzerReady: true
  },
  {
    ...common,
    id: "lsoul-magna-dress-v23121589",
    sku: "V23121589",
    groupCode: "V23121589",
    name: "Magna Dress",
    subtitle: "Đầm đỏ cúp ngực body phối nơ và tầng bèo",
    category: "dress",
    type: "bodycon-dress",
    price: 1290000,
    oldPrice: 1320000,
    color: "Đỏ",
    colorFamily: "red",
    colorHex: "#8E1F2D",
    sizes: ["S", "M", "L"],
    stock: 36,
    variants: variants("V23121589", ["S", "M", "L"]),
    image: "https://chuuicollection.com/cdn/shop/files/6546fd9ab813e3ffa459800db6da0bb.jpg?v=1728702697&width=1500",
    images: ["https://chuuicollection.com/cdn/shop/files/6546fd9ab813e3ffa459800db6da0bb.jpg?v=1728702697&width=1500"],
    style: ["glam", "nữ tính", "sexy", "statement"],
    occasion: ["đi tiệc", "concert", "sự kiện buổi tối"],
    material: "Voan phối chất liệu co giãn theo retailer listing",
    fit: "Bodycon with layered ruffle skirt",
    featured: true,
    sourceUrl: "https://chuuicollection.com/products/lseoul-magna-dress",
    sourceUpdatedAt: "2026-10-02",
    sourceType: "retailer-corroborated",
    tryOnCategory: "one-pieces",
    tryOnPhotoType: "model",
    tryOnImage: "https://chuuicollection.com/cdn/shop/files/6546fd9ab813e3ffa459800db6da0bb.jpg?v=1728702697&width=1500",
    silhouette: "bodycon-ruffle",
    lengthClass: "mini",
    neckline: "strapless",
    sleeveLength: "sleeveless",
    pattern: "solid",
    season: ["spring", "summer", "autumn"],
    formality: 5,
    warmth: 2,
    stretch: 3,
    coverage: 2,
    colorTemperature: "warm",
    styleKeywords: ["đỏ", "cúp ngực", "bodycon", "bèo", "đi tiệc", "sexy"],
    aiSearchText: "đầm đỏ bodycon cúp ngực tầng bèo đi tiệc concert sự kiện sexy",
    analyzerReady: true
  },
  {
    ...common,
    id: "lsoul-uzi-top-a25072829",
    sku: "A25072829",
    groupCode: "A25072829",
    name: "Uzi Top",
    subtitle: "Áo corset cổ yếm caro đỏ linen",
    category: "tops",
    type: "corset",
    price: 2420000,
    color: "Đỏ caro",
    colorFamily: "red",
    colorHex: "#C83B42",
    variants: variants("A25072829"),
    image: "https://undergroundbyisy.com/cdn/shop/files/Lsoul_Uzi_Top.jpg?v=1773225628&width=3840",
    images: ["https://undergroundbyisy.com/cdn/shop/files/Lsoul_Uzi_Top.jpg?v=1773225628&width=3840"],
    style: ["corset", "retro", "Y2K", "nữ tính"],
    occasion: ["đi chơi", "hẹn hò", "concert"],
    material: "Linen",
    fit: "Corset slim fit",
    featured: true,
    isNew: true,
    sourceUrl: "https://dosi-in.com/thuong-hieu/lsoul/trang-3/",
    sourceUpdatedAt: "2026-10-02",
    sourceType: "retailer-corroborated",
    tryOnCategory: "tops",
    tryOnPhotoType: "model",
    tryOnImage: "https://undergroundbyisy.com/cdn/shop/files/Lsoul_Uzi_Top.jpg?v=1773225628&width=3840",
    silhouette: "corset",
    lengthClass: "cropped",
    neckline: "halter",
    sleeveLength: "sleeveless",
    pattern: "gingham",
    season: ["spring", "summer"],
    formality: 3,
    warmth: 1,
    stretch: 1,
    coverage: 2,
    colorTemperature: "warm",
    styleKeywords: ["caro đỏ", "corset", "retro", "Y2K", "tôn eo"],
    aiSearchText: "áo corset caro đỏ cổ yếm linen retro Y2K đi chơi hẹn hò tôn eo",
    analyzerReady: true
  },
  {
    ...common,
    id: "lsoul-birdy-skirt-cv23120671",
    sku: "CV23120671",
    groupCode: "CV23120671",
    name: "Birdy Skirt",
    subtitle: "Chân váy đen tơ voan xếp tầng",
    category: "bottoms",
    type: "skirt",
    price: 1210000,
    color: "Đen",
    colorFamily: "black",
    colorHex: "#171717",
    variants: variants("CV23120671"),
    image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mcfweda66dlvc6",
    images: ["https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mcfweda66dlvc6"],
    style: ["romantic", "Y2K", "gothic", "statement"],
    occasion: ["đi chơi", "hẹn hò", "concert", "đi tiệc"],
    material: "95% cotton, 5% spandex; lót polyester theo dữ liệu công khai",
    fit: "Low-rise tiered mini skirt",
    featured: true,
    sourceUrl: "https://dosi-in.com/thuong-hieu/lsoul/trang-2/",
    sourceUpdatedAt: "2026-10-02",
    sourceType: "retailer-corroborated",
    tryOnCategory: "bottoms",
    tryOnPhotoType: "model",
    tryOnImage: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mcfweda66dlvc6",
    silhouette: "tiered",
    lengthClass: "mini",
    pattern: "solid",
    season: ["spring", "summer", "autumn"],
    formality: 3,
    warmth: 1,
    stretch: 3,
    coverage: 2,
    colorTemperature: "neutral",
    styleKeywords: ["chân váy", "đen", "voan", "xếp tầng", "Y2K", "gothic"],
    aiSearchText: "chân váy đen mini voan xếp tầng Y2K gothic concert hẹn hò",
    analyzerReady: true
  },
  {
    ...common,
    id: "lsoul-ers-pants-j26040831",
    sku: "J26040831",
    groupCode: "J26040831",
    name: "Ers Pants",
    subtitle: "Quần jeans nữ ống suông rộng cạp thấp",
    category: "bottoms",
    type: "jeans",
    price: 3342350,
    color: "Xanh denim",
    colorFamily: "blue",
    colorHex: "#526A7D",
    variants: variants("J26040831"),
    image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mchbbxyih0rmab",
    images: ["https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mchbbxyih0rmab"],
    style: ["Y2K", "streetwear", "casual", "denim"],
    occasion: ["đi chơi", "đi học", "đi cafe", "concert"],
    material: "Denim",
    fit: "Low-rise wide-leg",
    featured: true,
    isNew: true,
    sourceUrl: "https://dosi-in.com/nu/quan/trang-20/",
    sourceUpdatedAt: "2026-10-02",
    sourceType: "retailer-corroborated",
    tryOnCategory: "bottoms",
    tryOnPhotoType: "model",
    tryOnImage: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mchbbxyih0rmab",
    silhouette: "wide-leg",
    lengthClass: "full",
    pattern: "washed-denim",
    season: ["spring", "autumn", "winter"],
    formality: 2,
    warmth: 3,
    stretch: 1,
    coverage: 5,
    colorTemperature: "cool",
    styleKeywords: ["jeans", "ống rộng", "cạp thấp", "denim", "Y2K", "streetwear"],
    aiSearchText: "quần jeans nữ ống suông rộng cạp thấp denim Y2K streetwear đi chơi",
    analyzerReady: true
  },
  {
    ...common,
    id: "vto-studio-top-flat-01",
    sku: "VTO-TOP-01",
    groupCode: "VTO-TOP-01",
    name: "Áo Studio thử đồ AI",
    subtitle: "Garment flat-lay chuẩn dùng để kiểm thử phòng thử đồ",
    category: "tops",
    type: "crop-top",
    price: 690000,
    color: "Theo ảnh tham chiếu",
    colorFamily: "gray",
    colorHex: "#8A8A8A",
    variants: variants("VTO-TOP-01"),
    image: `${HF_EXAMPLES}/garment3.jpeg`,
    images: [`${HF_EXAMPLES}/garment3.jpeg`],
    style: ["studio", "basic"],
    occasion: ["hằng ngày"],
    material: "Không công bố trong nguồn tham chiếu",
    fit: "Reference garment",
    active: false,
    sourceUrl: "https://huggingface.co/spaces/fashn-ai/fashn-vton-1.5/tree/main/assets/examples",
    sourceUpdatedAt: "2026-10-02",
    sourceType: "vto-reference",
    tryOnCategory: "tops",
    tryOnPhotoType: "flat-lay",
    tryOnImage: `${HF_EXAMPLES}/garment3.jpeg`,
    silhouette: "reference",
    lengthClass: "regular",
    pattern: "reference",
    season: ["all-season"],
    formality: 2,
    warmth: 2,
    stretch: 2,
    coverage: 3,
    colorTemperature: "neutral",
    styleKeywords: ["VTO", "flat-lay", "reference"],
    aiSearchText: "mẫu tham chiếu thử đồ AI top flat lay",
    analyzerReady: false
  },
  {
    ...common,
    id: "vto-studio-bottom-flat-01",
    sku: "VTO-BOTTOM-01",
    groupCode: "VTO-BOTTOM-01",
    name: "Bottom Studio thử đồ AI",
    subtitle: "Garment lower-body flat-lay chuẩn dùng để kiểm thử phòng thử đồ",
    category: "bottoms",
    type: "trousers",
    price: 790000,
    color: "Theo ảnh tham chiếu",
    colorFamily: "gray",
    colorHex: "#888888",
    variants: variants("VTO-BOTTOM-01"),
    image: `${HF_EXAMPLES}/garment5.jpeg`,
    images: [`${HF_EXAMPLES}/garment5.jpeg`],
    style: ["studio", "basic"],
    occasion: ["hằng ngày"],
    material: "Không công bố trong nguồn tham chiếu",
    fit: "Reference garment",
    active: false,
    sourceUrl: "https://huggingface.co/spaces/fashn-ai/fashn-vton-1.5/tree/main/assets/examples",
    sourceUpdatedAt: "2026-10-02",
    sourceType: "vto-reference",
    tryOnCategory: "bottoms",
    tryOnPhotoType: "flat-lay",
    tryOnImage: `${HF_EXAMPLES}/garment5.jpeg`,
    silhouette: "reference",
    lengthClass: "regular",
    pattern: "reference",
    season: ["all-season"],
    formality: 2,
    warmth: 2,
    stretch: 2,
    coverage: 4,
    colorTemperature: "neutral",
    styleKeywords: ["VTO", "flat-lay", "reference"],
    aiSearchText: "mẫu tham chiếu thử đồ AI bottom flat lay",
    analyzerReady: false
  },
  {
    ...common,
    id: "vto-studio-dress-model-01",
    sku: "VTO-DRESS-01",
    groupCode: "VTO-DRESS-01",
    name: "Đầm Studio thử đồ AI",
    subtitle: "Garment one-piece on-model chuẩn dùng để kiểm thử phòng thử đồ",
    category: "dress",
    type: "mini-dress",
    price: 990000,
    color: "Theo ảnh tham chiếu",
    colorFamily: "gray",
    colorHex: "#888888",
    variants: variants("VTO-DRESS-01"),
    image: `${HF_EXAMPLES}/garment6.webp`,
    images: [`${HF_EXAMPLES}/garment6.webp`],
    style: ["studio", "reference"],
    occasion: ["đi chơi"],
    material: "Không công bố trong nguồn tham chiếu",
    fit: "Reference garment",
    active: false,
    sourceUrl: "https://huggingface.co/spaces/fashn-ai/fashn-vton-1.5/tree/main/assets/examples",
    sourceUpdatedAt: "2026-10-02",
    sourceType: "vto-reference",
    tryOnCategory: "one-pieces",
    tryOnPhotoType: "model",
    tryOnImage: `${HF_EXAMPLES}/garment6.webp`,
    silhouette: "reference",
    lengthClass: "reference",
    pattern: "reference",
    season: ["all-season"],
    formality: 3,
    warmth: 2,
    stretch: 2,
    coverage: 3,
    colorTemperature: "neutral",
    styleKeywords: ["VTO", "one-piece", "reference"],
    aiSearchText: "mẫu tham chiếu thử đồ AI one piece dress",
    analyzerReady: false
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

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
  name: string;
  subtitle: string;
  category: ProductCategory;
  type: ClothingType;
  gender: "women";
  price: number;
  oldPrice?: number;
  color: string;
  colorFamily: ColorFamily;
  sizes: string[];
  stock: number;
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
};

type Template = {
  code: string;
  name: string;
  subtitle: string;
  category: ProductCategory;
  type: ClothingType;
  price: number;
  material: string;
  fit: string;
  sizes: string[];
  style: string[];
  occasion: string[];
  imagePool: keyof typeof imagePools;
};

const colors: { name: string; family: ColorFamily }[] = [
  { name: "Black", family: "black" },
  { name: "Ivory", family: "white" },
  { name: "Chocolate", family: "brown" },
  { name: "Wine Red", family: "red" },
  { name: "Dusty Pink", family: "pink" },
  { name: "Stone", family: "beige" },
  { name: "Denim Blue", family: "blue" },
  { name: "Charcoal", family: "gray" },
  { name: "Olive", family: "green" },
  { name: "Midnight", family: "navy" }
];

const imagePools = {
  tops: [
    "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1000&q=86",
    "https://images.unsplash.com/photo-1566206091558-7f218b696731?auto=format&fit=crop&w=1000&q=86",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=86",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=86",
    "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1000&q=86"
  ],
  bottoms: [
    "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1000&q=86",
    "https://images.unsplash.com/photo-1583496661160-fb5886a13d74?auto=format&fit=crop&w=1000&q=86",
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=86",
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=86"
  ],
  outerwear: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=86",
    "https://images.unsplash.com/photo-1520013633827-6724d7d3e5a5?auto=format&fit=crop&w=1000&q=86",
    "https://images.unsplash.com/photo-1548624149-f6e89cc37a76?auto=format&fit=crop&w=1000&q=86"
  ],
  dress: [
    "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=86",
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=86",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=86",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=86"
  ],
  set: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=86",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=86",
    "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1000&q=86"
  ]
} as const;

const sizes = ["XS", "S", "M", "L", "XL"];
const denimSizes = ["24", "25", "26", "27", "28", "29", "30"];

const templates: Template[] = [
  { code:"CRS", name:"Sculpted Corset Top", subtitle:"Corset dựng phom ôm eo, đường cắt sắc nét", category:"tops", type:"corset", price:759000, material:"Structured satin blend", fit:"Sculpted fit", sizes, style:["feminine","statement"], occasion:["date","party"], imagePool:"tops" },
  { code:"LCR", name:"Lace-Up Corset", subtitle:"Corset dây rút lưng, tôn đường cong", category:"tops", type:"corset", price:829000, material:"Cotton satin", fit:"Cinched fit", sizes, style:["glam","statement"], occasion:["party","date"], imagePool:"tops" },
  { code:"MCR", name:"Mesh Panel Corset", subtitle:"Corset phối mesh tạo cấu trúc nhẹ", category:"tops", type:"corset", price:899000, material:"Mesh & satin", fit:"Body fit", sizes, style:["bold","feminine"], occasion:["party"], imagePool:"tops" },

  { code:"CTP", name:"Asymmetric Crop Top", subtitle:"Crop top lệch vai, phom ôm gọn", category:"tops", type:"crop-top", price:529000, material:"Stretch jersey", fit:"Slim fit", sizes, style:["feminine","modern"], occasion:["date","casual"], imagePool:"tops" },
  { code:"DTP", name:"Drape Neck Crop Top", subtitle:"Cổ đổ mềm, chiều dài trên eo", category:"tops", type:"crop-top", price:559000, material:"Viscose blend", fit:"Slim drape", sizes, style:["soft","feminine"], occasion:["date","party"], imagePool:"tops" },
  { code:"RTP", name:"Rib Cut-Out Top", subtitle:"Áo rib cut-out nhấn eo", category:"tops", type:"crop-top", price:489000, material:"Rib stretch", fit:"Body fit", sizes, style:["casual","bold"], occasion:["casual","date"], imagePool:"tops" },
  { code:"BDY", name:"Contour Bodysuit", subtitle:"Bodysuit ôm dáng, đường cổ vuông", category:"tops", type:"bodysuit", price:629000, material:"Double knit stretch", fit:"Second-skin fit", sizes, style:["minimal","feminine"], occasion:["date","party","casual"], imagePool:"tops" },
  { code:"OBD", name:"Off-Shoulder Bodysuit", subtitle:"Bodysuit trễ vai, đường nét sạch", category:"tops", type:"bodysuit", price:679000, material:"Viscose stretch", fit:"Body fit", sizes, style:["feminine","glam"], occasion:["date","party"], imagePool:"tops" },

  { code:"SBL", name:"Sheer Sleeve Blouse", subtitle:"Blouse tay xuyên thấu, cổ mở mềm", category:"tops", type:"blouse", price:699000, material:"Chiffon blend", fit:"Regular fit", sizes, style:["romantic","feminine"], occasion:["date","work"], imagePool:"tops" },
  { code:"TBL", name:"Twist Front Blouse", subtitle:"Blouse xoắn thân trước tạo eo", category:"tops", type:"blouse", price:729000, material:"Satin viscose", fit:"Waist-defined", sizes, style:["feminine","elegant"], occasion:["work","date"], imagePool:"tops" },
  { code:"SHR", name:"Cropped Poplin Shirt", subtitle:"Sơ mi poplin lửng, vai có cấu trúc", category:"tops", type:"shirt", price:699000, material:"Cotton poplin", fit:"Cropped regular", sizes, style:["modern","clean"], occasion:["work","casual"], imagePool:"tops" },
  { code:"KNT", name:"Sculpt Knit Top", subtitle:"Áo knit ôm eo với bề mặt dệt nổi", category:"tops", type:"knit-top", price:679000, material:"Viscose knit", fit:"Slim fit", sizes, style:["feminine","minimal"], occasion:["work","date"], imagePool:"tops" },

  { code:"BLZ", name:"Hourglass Blazer", subtitle:"Blazer chiết eo, vai dựng nhẹ", category:"outerwear", type:"blazer", price:1499000, material:"Wool blend", fit:"Hourglass tailored", sizes, style:["power","feminine"], occasion:["work","party"], imagePool:"outerwear" },
  { code:"CBL", name:"Cropped Tailored Blazer", subtitle:"Blazer lửng nhấn tỷ lệ cơ thể", category:"outerwear", type:"blazer", price:1299000, material:"Suiting blend", fit:"Cropped tailored", sizes, style:["modern","statement"], occasion:["work","date"], imagePool:"outerwear" },
  { code:"LJK", name:"Faux Leather Jacket", subtitle:"Jacket da dáng gọn, cổ tối giản", category:"outerwear", type:"jacket", price:1699000, material:"Premium faux leather", fit:"Regular cropped", sizes, style:["bold","street"], occasion:["date","party","casual"], imagePool:"outerwear" },
  { code:"CDG", name:"Fitted Knit Cardigan", subtitle:"Cardigan knit ôm dáng, hàng nút nhỏ", category:"outerwear", type:"cardigan", price:799000, material:"Fine knit", fit:"Slim fit", sizes, style:["soft","feminine"], occasion:["work","date","casual"], imagePool:"outerwear" },

  { code:"JNS", name:"Low Rise Straight Jeans", subtitle:"Jeans cạp thấp ống thẳng, wash sạch", category:"bottoms", type:"jeans", price:999000, material:"Cotton denim", fit:"Low-rise straight", sizes:denimSizes, style:["y2k","casual"], occasion:["casual","date"], imagePool:"bottoms" },
  { code:"WJG", name:"Wide Leg Jeans", subtitle:"Jeans ống rộng kéo dài tỷ lệ chân", category:"bottoms", type:"jeans", price:1049000, material:"Rigid denim", fit:"High-rise wide leg", sizes:denimSizes, style:["modern","casual"], occasion:["casual","date"], imagePool:"bottoms" },
  { code:"TRS", name:"Waist Sculpt Trousers", subtitle:"Quần tây cạp cao, đường eo gọn", category:"bottoms", type:"trousers", price:929000, material:"Suiting blend", fit:"Straight tailored", sizes, style:["power","minimal"], occasion:["work","date"], imagePool:"bottoms" },
  { code:"FLR", name:"Contour Flare Pants", subtitle:"Quần loe ôm hông, ống dài", category:"bottoms", type:"flare-pants", price:899000, material:"Stretch suiting", fit:"Slim flare", sizes, style:["glam","feminine"], occasion:["date","party"], imagePool:"bottoms" },
  { code:"SHT", name:"Tailored Mini Shorts", subtitle:"Quần short tây cạp cao, ly gọn", category:"bottoms", type:"shorts", price:729000, material:"Suiting blend", fit:"High-rise tailored", sizes, style:["clean","feminine"], occasion:["date","casual"], imagePool:"bottoms" },
  { code:"MSK", name:"Sculpted Mini Skirt", subtitle:"Chân váy mini ôm phom, cạp định hình", category:"bottoms", type:"skirt", price:729000, material:"Structured stretch", fit:"Body fit", sizes, style:["feminine","statement"], occasion:["date","party"], imagePool:"bottoms" },
  { code:"PSK", name:"Pleated Micro Skirt", subtitle:"Mini skirt xếp ly, cảm hứng Y2K", category:"bottoms", type:"skirt", price:759000, material:"Suiting twill", fit:"A-line mini", sizes, style:["y2k","playful"], occasion:["casual","date"], imagePool:"bottoms" },

  { code:"MND", name:"Corset Mini Dress", subtitle:"Mini dress thân corset, váy xòe nhẹ", category:"dress", type:"mini-dress", price:1499000, material:"Satin blend", fit:"Corset fit & flare", sizes, style:["glam","feminine"], occasion:["party","date"], imagePool:"dress" },
  { code:"BND", name:"Bodycon Mini Dress", subtitle:"Mini dress ôm dáng, đường cắt contour", category:"dress", type:"bodycon-dress", price:1399000, material:"Double knit stretch", fit:"Bodycon fit", sizes, style:["bold","feminine"], occasion:["party","date"], imagePool:"dress" },
  { code:"DRP", name:"Draped Mini Dress", subtitle:"Đầm mini drape mềm, nhấn hông", category:"dress", type:"mini-dress", price:1349000, material:"Viscose satin", fit:"Draped slim", sizes, style:["soft","glam"], occasion:["date","party"], imagePool:"dress" },
  { code:"MID", name:"Sculpt Midi Dress", subtitle:"Midi dress ôm eo, xẻ tà sau", category:"dress", type:"midi-dress", price:1599000, material:"Stretch crepe", fit:"Sculpted midi", sizes, style:["elegant","feminine"], occasion:["party","date"], imagePool:"dress" },
  { code:"SLP", name:"Satin Slip Midi", subtitle:"Slip dress satin rủ, dây mảnh", category:"dress", type:"midi-dress", price:1499000, material:"Satin", fit:"Bias cut", sizes, style:["minimal","sensual"], occasion:["date","party"], imagePool:"dress" },
  { code:"MAX", name:"Open Back Maxi Dress", subtitle:"Maxi dress hở lưng, thân váy rủ dài", category:"dress", type:"maxi-dress", price:1899000, material:"Satin crepe", fit:"Fluid fit", sizes, style:["glam","statement"], occasion:["party"], imagePool:"dress" },

  { code:"SET", name:"Corset & Mini Skirt Set", subtitle:"Set corset và chân váy đồng bộ", category:"set", type:"set", price:1799000, material:"Structured satin blend", fit:"Sculpted set", sizes, style:["feminine","statement"], occasion:["party","date"], imagePool:"set" },
  { code:"PST", name:"Blazer & Mini Skirt Set", subtitle:"Set blazer lửng và chân váy mini", category:"set", type:"set", price:2199000, material:"Suiting blend", fit:"Tailored set", sizes, style:["power","feminine"], occasion:["work","party"], imagePool:"set" },
  { code:"KST", name:"Knit Top & Skirt Set", subtitle:"Set knit ôm dáng, dễ tách phối", category:"set", type:"set", price:1499000, material:"Viscose knit", fit:"Slim set", sizes, style:["soft","feminine"], occasion:["date","casual"], imagePool:"set" },
  { code:"DST", name:"Denim Corset Set", subtitle:"Set corset denim và chân váy mini", category:"set", type:"set", price:1899000, material:"Cotton denim", fit:"Structured set", sizes, style:["y2k","bold"], occasion:["date","party"], imagePool:"set" },
  { code:"TST", name:"Tailored Vest Set", subtitle:"Set vest chiết eo và quần cạp cao", category:"set", type:"set", price:2099000, material:"Premium suiting", fit:"Waist-defined set", sizes, style:["power","modern"], occasion:["work","party"], imagePool:"set" }
];

function slugify(input: string) {
  return input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function roundPrice(value: number) {
  return Math.round(value / 10000) * 10000 - 1000;
}

function distributeStock(total: number, productSizes: string[], baseSku: string): ProductVariant[] {
  return productSizes.map((size, index) => {
    const base = total === 0 ? 0 : Math.floor(total / productSizes.length);
    const stock = total === 0 ? 0 : base + (index < total % productSizes.length ? 1 : 0);
    return { sku: `${baseSku}-${size}`, size, stock, active: stock > 0 };
  });
}

export const products: Product[] = templates.flatMap((template, templateIndex) => {
  const selectedColors = Array.from({ length: 5 }, (_, offset) => colors[(templateIndex * 2 + offset * 3) % colors.length]);

  return selectedColors.map((color, colorIndex) => {
    const index = templateIndex * 5 + colorIndex;
    const imageSet = imagePools[template.imagePool];
    const primaryImage = imageSet[(templateIndex + colorIndex) % imageSet.length];
    const secondaryImage = imageSet[(templateIndex + colorIndex + 1) % imageSet.length];
    const price = roundPrice(template.price + (colorIndex % 3) * 30000);
    const sale = index % 7 === 0;
    const stock = index % 23 === 0 ? 0 : 6 + ((index * 11) % 39);
    const sku = `LSO-${template.code}-${String(index + 1).padStart(3, "0")}`;

    return {
      id: `${slugify(template.name)}-${color.family}-${String(index + 1).padStart(3, "0")}`,
      sku,
      name: `${template.name} · ${color.name}`,
      subtitle: template.subtitle,
      category: template.category,
      type: template.type,
      gender: "women",
      price,
      oldPrice: sale ? roundPrice(price * 1.2) : undefined,
      color: color.name,
      colorFamily: color.family,
      sizes: template.sizes,
      stock,
      variants: distributeStock(stock, template.sizes, sku),
      image: primaryImage,
      images: [primaryImage, secondaryImage],
      style: template.style,
      occasion: template.occasion,
      material: template.material,
      fit: template.fit,
      featured: index % 10 === 0,
      isNew: index % 4 === 0,
      active: true
    } satisfies Product;
  });
});

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

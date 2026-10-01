export type ProductCategory = "tops" | "bottoms" | "outerwear" | "dress";

export type ClothingType =
  | "tshirt" | "shirt" | "polo" | "tank"
  | "hoodie" | "sweatshirt" | "sweater" | "cardigan"
  | "blazer" | "jacket" | "coat"
  | "jeans" | "trousers" | "chinos" | "shorts" | "skirt"
  | "dress";

export type ColorFamily =
  | "black" | "white" | "navy" | "beige" | "blue"
  | "brown" | "red" | "green" | "gray" | "pink";

export type Product = {
  id: string;
  sku?: string;
  name: string;
  subtitle: string;
  category: ProductCategory;
  type: ClothingType;
  gender: "women" | "men" | "unisex";
  price: number;
  oldPrice?: number;
  color: string;
  colorFamily: ColorFamily;
  sizes: string[];
  stock: number;
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
  gender: Product["gender"];
  price: number;
  material: string;
  fit: string;
  sizes: string[];
  style: string[];
  occasion: string[];
  imagePool: keyof typeof imagePools;
};

const colors: { name: string; family: ColorFamily }[] = [
  { name: "Đen", family: "black" },
  { name: "Trắng ngà", family: "white" },
  { name: "Xanh navy", family: "navy" },
  { name: "Be đá", family: "beige" },
  { name: "Xanh denim", family: "blue" },
  { name: "Nâu cacao", family: "brown" },
  { name: "Đỏ burgundy", family: "red" },
  { name: "Xanh olive", family: "green" },
  { name: "Xám tro", family: "gray" },
  { name: "Hồng dusty", family: "pink" }
];

const imagePools = {
  tops: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=85"
  ],
  bottoms: [
    "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1000&q=85"
  ],
  outerwear: [
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1598808503746-f34cfb6c2524?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1000&q=85"
  ],
  dress: [
    "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=85"
  ]
} as const;

const alphaSizes = ["XS", "S", "M", "L", "XL"];
const menSizes = ["S", "M", "L", "XL", "2XL"];
const denimSizes = ["26", "28", "30", "32", "34", "36"];
const womenBottomSizes = ["XS", "S", "M", "L", "XL"];

const templates: Template[] = [
  { code:"HT", name:"Essential Heavy Tee", subtitle:"T-shirt cotton dày, bề mặt mịn", category:"tops", type:"tshirt", gender:"unisex", price:329000, material:"Heavy cotton 250gsm", fit:"Regular fit", sizes:alphaSizes, style:["minimal","casual"], occasion:["casual","date"], imagePool:"tops" },
  { code:"CT", name:"Compact Cotton Tee", subtitle:"T-shirt nữ dáng gọn, cổ tròn", category:"tops", type:"tshirt", gender:"women", price:299000, material:"Compact cotton", fit:"Slim regular", sizes:alphaSizes, style:["minimal","feminine"], occasion:["casual","date"], imagePool:"tops" },
  { code:"RT", name:"Relaxed Cotton Tee", subtitle:"T-shirt nam vai rơi nhẹ", category:"tops", type:"tshirt", gender:"men", price:349000, material:"Cotton jersey", fit:"Relaxed fit", sizes:menSizes, style:["minimal","street"], occasion:["casual"], imagePool:"tops" },
  { code:"ST", name:"Ribbed Slim Tee", subtitle:"T-shirt rib co giãn ôm vừa", category:"tops", type:"tshirt", gender:"women", price:319000, material:"Rib cotton stretch", fit:"Slim fit", sizes:alphaSizes, style:["minimal","feminine"], occasion:["casual","date"], imagePool:"tops" },

  { code:"OX", name:"Oxford City Shirt", subtitle:"Sơ mi Oxford đứng phom", category:"tops", type:"shirt", gender:"men", price:529000, material:"Oxford cotton", fit:"Regular fit", sizes:menSizes, style:["smart-casual","classic"], occasion:["work","date"], imagePool:"tops" },
  { code:"AS", name:"Airy Relaxed Shirt", subtitle:"Sơ mi nữ mềm nhẹ, dáng thoáng", category:"tops", type:"shirt", gender:"women", price:489000, material:"Cotton rayon", fit:"Relaxed fit", sizes:alphaSizes, style:["minimal","feminine"], occasion:["work","date","casual"], imagePool:"tops" },
  { code:"CB", name:"Cuban Collar Shirt", subtitle:"Sơ mi cổ Cuba cho ngày hè", category:"tops", type:"shirt", gender:"men", price:459000, material:"Cotton linen blend", fit:"Relaxed fit", sizes:menSizes, style:["casual","resort"], occasion:["casual","date"], imagePool:"tops" },
  { code:"OP", name:"Oversized Poplin Shirt", subtitle:"Sơ mi poplin oversize sạch nét", category:"tops", type:"shirt", gender:"unisex", price:519000, material:"Cotton poplin", fit:"Oversized fit", sizes:alphaSizes, style:["minimal","street"], occasion:["work","casual"], imagePool:"tops" },

  { code:"PP", name:"Pique Essential Polo", subtitle:"Polo pique cổ đứng, dễ phối", category:"tops", type:"polo", gender:"men", price:429000, material:"Cotton pique", fit:"Regular fit", sizes:menSizes, style:["smart-casual","minimal"], occasion:["work","date","casual"], imagePool:"tops" },
  { code:"KP", name:"Fine Knit Polo", subtitle:"Polo dệt kim mỏng thanh lịch", category:"tops", type:"polo", gender:"women", price:549000, material:"Viscose knit", fit:"Slim regular", sizes:alphaSizes, style:["classic","feminine"], occasion:["work","date"], imagePool:"tops" },
  { code:"RTK", name:"Ribbed Tank Top", subtitle:"Áo tank rib mặc riêng hoặc layer", category:"tops", type:"tank", gender:"women", price:259000, material:"Rib cotton", fit:"Slim fit", sizes:alphaSizes, style:["minimal","feminine"], occasion:["casual"], imagePool:"tops" },
  { code:"LTK", name:"Layering Tank", subtitle:"Tank top nền tảng cho layering", category:"tops", type:"tank", gender:"unisex", price:239000, material:"Cotton stretch", fit:"Regular fit", sizes:alphaSizes, style:["minimal","street"], occasion:["casual"], imagePool:"tops" },

  { code:"HD", name:"Everyday Hoodie", subtitle:"Hoodie nỉ mềm, mũ hai lớp", category:"tops", type:"hoodie", gender:"unisex", price:649000, material:"French terry cotton", fit:"Relaxed fit", sizes:alphaSizes, style:["casual","street"], occasion:["casual"], imagePool:"tops" },
  { code:"ZH", name:"City Zip Hoodie", subtitle:"Hoodie khóa kéo tối giản", category:"tops", type:"hoodie", gender:"men", price:699000, material:"Cotton fleece", fit:"Regular fit", sizes:menSizes, style:["minimal","street"], occasion:["casual"], imagePool:"tops" },
  { code:"SW", name:"Clean Sweatshirt", subtitle:"Sweatshirt cổ tròn bề mặt sạch", category:"tops", type:"sweatshirt", gender:"unisex", price:559000, material:"French terry", fit:"Regular fit", sizes:alphaSizes, style:["minimal","casual"], occasion:["casual","work"], imagePool:"tops" },
  { code:"CSW", name:"Cropped Sweatshirt", subtitle:"Sweatshirt nữ dáng lửng cân đối", category:"tops", type:"sweatshirt", gender:"women", price:529000, material:"Cotton fleece", fit:"Cropped relaxed", sizes:alphaSizes, style:["casual","feminine"], occasion:["casual"], imagePool:"tops" },

  { code:"MS", name:"Merino Crew Sweater", subtitle:"Áo len cổ tròn mềm, gọn phom", category:"tops", type:"sweater", gender:"men", price:799000, material:"Merino wool blend", fit:"Regular fit", sizes:menSizes, style:["classic","minimal"], occasion:["work","date"], imagePool:"tops" },
  { code:"SK", name:"Soft Knit Sweater", subtitle:"Áo len nữ mềm nhẹ, rủ tự nhiên", category:"tops", type:"sweater", gender:"women", price:729000, material:"Viscose wool blend", fit:"Relaxed fit", sizes:alphaSizes, style:["minimal","feminine"], occasion:["work","date","casual"], imagePool:"tops" },
  { code:"FC", name:"Fine Cardigan", subtitle:"Cardigan mỏng cho layering", category:"tops", type:"cardigan", gender:"women", price:649000, material:"Fine gauge knit", fit:"Regular fit", sizes:alphaSizes, style:["classic","feminine"], occasion:["work","date"], imagePool:"tops" },
  { code:"CC", name:"Chunky Cardigan", subtitle:"Cardigan dệt dày, phom rộng", category:"tops", type:"cardigan", gender:"unisex", price:829000, material:"Wool acrylic blend", fit:"Oversized fit", sizes:alphaSizes, style:["casual","minimal"], occasion:["casual","date"], imagePool:"tops" },

  { code:"SB", name:"Soft Tailored Blazer", subtitle:"Blazer mềm vai, đường nét gọn", category:"outerwear", type:"blazer", gender:"men", price:1099000, material:"Poly-viscose", fit:"Tailored regular", sizes:menSizes, style:["classic","smart-casual"], occasion:["work","date","party"], imagePool:"outerwear" },
  { code:"RB", name:"Relaxed Blazer", subtitle:"Blazer nữ dáng rộng hiện đại", category:"outerwear", type:"blazer", gender:"women", price:999000, material:"Viscose blend", fit:"Relaxed tailored", sizes:alphaSizes, style:["minimal","feminine"], occasion:["work","date"], imagePool:"outerwear" },
  { code:"HJ", name:"Harrington Jacket", subtitle:"Jacket cổ dựng, gọn và linh hoạt", category:"outerwear", type:"jacket", gender:"men", price:949000, material:"Cotton nylon", fit:"Regular fit", sizes:menSizes, style:["classic","casual"], occasion:["work","casual","date"], imagePool:"outerwear" },
  { code:"CJ", name:"Cropped City Jacket", subtitle:"Jacket nữ dáng lửng, vai gọn", category:"outerwear", type:"jacket", gender:"women", price:899000, material:"Cotton twill", fit:"Cropped regular", sizes:alphaSizes, style:["minimal","feminine"], occasion:["work","date","casual"], imagePool:"outerwear" },
  { code:"WC", name:"Wool Blend Coat", subtitle:"Áo khoác dài pha len giữ phom", category:"outerwear", type:"coat", gender:"unisex", price:1499000, material:"Wool blend", fit:"Relaxed longline", sizes:alphaSizes, style:["classic","minimal"], occasion:["work","date"], imagePool:"outerwear" },

  { code:"SD", name:"Straight Denim", subtitle:"Jeans ống thẳng wash nhẹ", category:"bottoms", type:"jeans", gender:"unisex", price:649000, material:"Cotton denim", fit:"Straight fit", sizes:denimSizes, style:["casual","minimal"], occasion:["casual","date"], imagePool:"bottoms" },
  { code:"WD", name:"Wide Leg Denim", subtitle:"Jeans nữ ống rộng cạp cao", category:"bottoms", type:"jeans", gender:"women", price:679000, material:"Cotton denim", fit:"Wide leg", sizes:womenBottomSizes, style:["casual","feminine"], occasion:["casual","date"], imagePool:"bottoms" },
  { code:"TR", name:"Tailored Trousers", subtitle:"Quần tây ly nhẹ, ống thẳng", category:"bottoms", type:"trousers", gender:"unisex", price:629000, material:"Poly-viscose", fit:"Straight tailored", sizes:denimSizes, style:["smart-casual","classic"], occasion:["work","date"], imagePool:"bottoms" },
  { code:"PT", name:"Pleated Trousers", subtitle:"Quần nữ hai ly, cạp cao", category:"bottoms", type:"trousers", gender:"women", price:599000, material:"Viscose blend", fit:"Wide straight", sizes:womenBottomSizes, style:["minimal","feminine"], occasion:["work","date"], imagePool:"bottoms" },
  { code:"CH", name:"City Chinos", subtitle:"Chino cotton twill mặc hàng ngày", category:"bottoms", type:"chinos", gender:"men", price:559000, material:"Cotton twill", fit:"Straight fit", sizes:denimSizes, style:["smart-casual","minimal"], occasion:["work","casual","date"], imagePool:"bottoms" },
  { code:"SH", name:"Utility Shorts", subtitle:"Quần short phom sạch, túi gọn", category:"bottoms", type:"shorts", gender:"unisex", price:429000, material:"Cotton twill", fit:"Regular fit", sizes:alphaSizes, style:["casual","minimal"], occasion:["casual"], imagePool:"bottoms" },
  { code:"SKT", name:"A-Line Midi Skirt", subtitle:"Chân váy chữ A dài qua gối", category:"bottoms", type:"skirt", gender:"women", price:549000, material:"Cotton blend", fit:"A-line", sizes:womenBottomSizes, style:["feminine","minimal"], occasion:["work","date"], imagePool:"dress" },

  { code:"MD", name:"Satin Midi Dress", subtitle:"Váy midi rủ nhẹ, cổ thanh thoát", category:"dress", type:"dress", gender:"women", price:829000, material:"Satin blend", fit:"Fluid fit", sizes:alphaSizes, style:["feminine","classic"], occasion:["date","party"], imagePool:"dress" },
  { code:"DR", name:"Structured Shirt Dress", subtitle:"Váy sơ mi có đai, phom gọn", category:"dress", type:"dress", gender:"women", price:899000, material:"Cotton poplin", fit:"Regular belted", sizes:alphaSizes, style:["minimal","classic"], occasion:["work","date"], imagePool:"dress" }
];

function slugify(input: string) {
  return input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function roundPrice(value: number) {
  return Math.round(value / 10000) * 10000 - 1000;
}

export const products: Product[] = templates.flatMap((template, templateIndex) => {
  const selectedColors = Array.from({ length: 5 }, (_, offset) => colors[(templateIndex * 3 + offset * 2) % colors.length]);

  return selectedColors.map((color, colorIndex) => {
    const index = templateIndex * 5 + colorIndex;
    const imageSet = imagePools[template.imagePool];
    const primaryImage = imageSet[(templateIndex + colorIndex) % imageSet.length];
    const secondaryImage = imageSet[(templateIndex + colorIndex + 1) % imageSet.length];
    const price = roundPrice(template.price + (colorIndex % 3) * 20000);
    const sale = index % 6 === 0;
    const stock = index % 19 === 0 ? 0 : 4 + ((index * 7) % 33);

    return {
      id: `${slugify(template.name)}-${color.family}-${String(index + 1).padStart(3, "0")}`,
      sku: `ELA-${template.code}-${String(index + 1).padStart(3, "0")}`,
      name: `${template.name} · ${color.name}`,
      subtitle: template.subtitle,
      category: template.category,
      type: template.type,
      gender: template.gender,
      price,
      oldPrice: sale ? roundPrice(price * 1.18) : undefined,
      color: color.name,
      colorFamily: color.family,
      sizes: template.sizes,
      stock,
      image: primaryImage,
      images: [primaryImage, secondaryImage],
      style: template.style,
      occasion: template.occasion,
      material: template.material,
      fit: template.fit,
      featured: index % 11 === 0,
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
  dress: "Váy liền"
};

export const typeLabels: Record<ClothingType, string> = {
  tshirt: "T-shirt",
  shirt: "Sơ mi",
  polo: "Polo",
  tank: "Tank top",
  hoodie: "Hoodie",
  sweatshirt: "Sweatshirt",
  sweater: "Áo len",
  cardigan: "Cardigan",
  blazer: "Blazer",
  jacket: "Jacket",
  coat: "Áo khoác dài",
  jeans: "Jeans",
  trousers: "Quần tây",
  chinos: "Chinos",
  shorts: "Quần short",
  skirt: "Chân váy",
  dress: "Váy liền"
};

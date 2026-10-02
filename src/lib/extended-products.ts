import type { Product } from "./products";

type Seed = {
  sku: string;
  name: string;
  subtitle: string;
  category: Product["category"];
  type: Product["type"];
  price: number;
  color: string;
  colorFamily: Product["colorFamily"];
  image: string;
  sourceUrl: string;
  style: string[];
  occasion: string[];
  material: string;
  fit: string;
  silhouette: string;
  lengthClass: string;
  neckline?: string;
  sleeveLength?: string;
  pattern?: string;
  colorTemperature?: Product["colorTemperature"];
  waistRise?: Product["waistRise"];
  volume?: Product["volume"];
  tryOn?: boolean;
};

const sizes = ["S", "M", "L", "XL"];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

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
    groupCode: item.sku,
    name: item.name,
    subtitle: item.subtitle,
    category: item.category,
    type: item.type,
    gender: "women",
    price: item.price,
    color: item.color,
    colorFamily: item.colorFamily,
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
    sourceUrl: item.sourceUrl,
    sourceUpdatedAt: "2026-10-02",
    sourceType: "retailer-corroborated",
    tryOnCategory:
      item.category === "bottoms" ? "bottoms" :
      item.category === "dress" ? "one-pieces" :
      "tops",
    tryOnPhotoType: item.tryOn ? "model" : undefined,
    tryOnImage: item.tryOn ? item.image : undefined,
    silhouette: item.silhouette,
    lengthClass: item.lengthClass,
    neckline: item.neckline,
    sleeveLength: item.sleeveLength,
    pattern: item.pattern ?? "solid",
    season: ["spring", "summer", "autumn"],
    formality: item.occasion.some((value) => /tiệc|sự kiện|event/i.test(value)) ? 5 : 3,
    warmth: item.category === "outerwear" ? 5 : 2,
    stretch: /co giãn|knit|len|thun/i.test(`${item.material} ${item.fit}`) ? 4 : 2,
    coverage: item.lengthClass === "maxi" ? 5 : item.lengthClass === "midi" ? 4 : 2,
    colorTemperature: item.colorTemperature ?? "neutral",
    waistRise: item.waistRise ?? (item.category === "bottoms" ? "low" : "not-applicable"),
    recommendedUndertones:
      item.colorTemperature === "warm" ? ["warm", "neutral"] :
      item.colorTemperature === "cool" ? ["cool", "neutral"] :
      ["warm", "cool", "neutral"],
    bodyShapeCompatibility: [],
    pairingTags: styleKeywords,
    avoidPairingTags: [],
    visualWeight: item.category === "outerwear" ? 5 : item.volume === "voluminous" ? 4 : 3,
    volume: item.volume ?? "balanced",
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
    sku: "V26011699", name: "Aller Dress", subtitle: "Đầm corset cổ yếm hai dây thắt nơ dáng chữ A xếp ly",
    category: "dress", type: "mini-dress", price: 3122074, color: "Trắng kem", colorFamily: "white",
    image: "https://dosi-in.com/img/600/vn-11134207-820l4-mj6r6kq66tc2b4.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dam-corset-co-yem-hai-day-that-no-dang-chu-a-xep-ly-quyen-ru-aller-dress-v26011699-269491027.49804304151/",
    style: ["corset", "nữ tính", "romantic"], occasion: ["hẹn hò", "đi tiệc"], material: "Vải dệt tổng hợp",
    fit: "Corset fit & flare", silhouette: "a-line", lengthClass: "mini", neckline: "halter", sleeveLength: "sleeveless", tryOn: true
  },
  {
    sku: "V26041711", name: "Fette Dress", subtitle: "Đầm mini lệch vai ôm body co giãn tối giản",
    category: "dress", type: "bodycon-dress", price: 3080000, color: "Lilac / đỏ", colorFamily: "pink",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mso7i4683c3ud0.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dam-mini-lech-vai-om-body-co-gian-ton-dang-phong-cach-toi-gian-quyen-ru-fette-dress-v26041711-269491027.56910010459/",
    style: ["minimal", "sexy", "statement"], occasion: ["hẹn hò", "đi tiệc"], material: "100% Polyester",
    fit: "Body-hugging draped", silhouette: "bodycon", lengthClass: "mini", neckline: "asymmetric", sleeveLength: "sleeveless", colorTemperature: "cool", tryOn: true
  },
  {
    sku: "V26041707", name: "Jelly Dress", subtitle: "Đầm ngắn lệch vai ôm body rút dây",
    category: "dress", type: "bodycon-dress", price: 2860000, color: "Lilac / xanh nhạt", colorFamily: "green",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mso7i1gu62h09e.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dam-ngan-lech-vai-co-gian-om-body-tao-form-eo-hong-rut-day-quyen-ru-jelly-dress-v26041707-269491027.55810010231/",
    style: ["minimal", "sexy"], occasion: ["hẹn hò", "đi tiệc"], material: "Vải co giãn",
    fit: "Ruched bodycon", silhouette: "bodycon", lengthClass: "mini", neckline: "asymmetric", sleeveLength: "sleeveless", colorTemperature: "cool", tryOn: true
  },
  {
    sku: "V26011701", name: "Vivier Dress", subtitle: "Đầm lụa dự tiệc cổ yếm dáng dài hở lưng",
    category: "dress", type: "maxi-dress", price: 3740000, color: "Đỏ rượu", colorFamily: "red",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mso7i8cmvklg58.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dam-lua-du-tiec-co-yem-cach-dieu-dang-dai-thiet-ke-ho-lung-vivier-dress-v26011701-269491027.44604604190/",
    style: ["elegant", "glam", "nữ tính"], occasion: ["đi tiệc", "sự kiện buổi tối"], material: "Lụa",
    fit: "Draped slim fit", silhouette: "column", lengthClass: "maxi", neckline: "halter", sleeveLength: "sleeveless", colorTemperature: "warm", tryOn: true
  },
  {
    sku: "V24121641", name: "Lory Dress", subtitle: "Đầm ôm body cổ yếm đổ phối dây da",
    category: "dress", type: "mini-dress", price: 2090000, color: "Vàng ánh kim", colorFamily: "brown",
    image: "https://dosi-in.com/img/600/vn-11134207-7ras8-m5b6vfkjdfmf75.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dam-thiet-ke-om-body-co-yem-do-khoet-nguc-ho-lung-dinh-kem-day-da-bo-lory-dress-v24121641-269491027.28174209301/",
    style: ["Y2K", "glam", "statement"], occasion: ["đi tiệc", "concert"], material: "Vải ánh kim phối dây da",
    fit: "Slim halter fit", silhouette: "bodycon", lengthClass: "mini", neckline: "halter", sleeveLength: "sleeveless", colorTemperature: "warm", tryOn: true
  },
  {
    sku: "V25121692", name: "Fem Dress", subtitle: "Đầm satin hai dây chữ A cut-out layer nơ",
    category: "dress", type: "mini-dress", price: 2860000, color: "Đen / đỏ / xám", colorFamily: "black",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mso8adqy7xmo98.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dam-satin-hai-day-dang-chu-a-cut-out-suon-lung-layer-no-xep-tang-fem-dress-v25121692-269491027.52103972342/",
    style: ["nữ tính", "party", "statement"], occasion: ["hẹn hò", "đi tiệc"], material: "Satin",
    fit: "A-line fitted waist", silhouette: "a-line", lengthClass: "mini", neckline: "square", sleeveLength: "sleeveless", tryOn: true
  },
  {
    sku: "V25071678", name: "Zarae Dress", subtitle: "Đầm mini phối nón hoodie khóa kéo năng động",
    category: "dress", type: "mini-dress", price: 2915000, color: "Xám", colorFamily: "gray",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mso54zh4snwo50.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dam-mini-phoi-non-hoodie-khoa-keo-vai-cotton-co-gian-nang-dong-zarae-dress-v25071678-269491027.51701641266/",
    style: ["sporty", "streetwear", "Y2K"], occasion: ["đi chơi", "đi cafe"], material: "Cotton co giãn",
    fit: "Fitted hoodie dress", silhouette: "fit-and-flare", lengthClass: "mini", neckline: "hooded", sleeveLength: "sleeveless", colorTemperature: "cool", tryOn: true
  },
  {
    sku: "V24121649", name: "Rue Dress", subtitle: "Đầm yếm cổ đổ chấm bi phối dây da",
    category: "dress", type: "mini-dress", price: 1386000, color: "Trắng chấm bi", colorFamily: "white",
    image: "https://dosi-in.com/img/600/vn-11134207-7ras8-m47bd2x7pg2o75.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dam-yem-co-do-cham-bi-phoi-day-da-ca-tinh-rue-dress-v24121649-269491027.29371719280/",
    style: ["retro", "Y2K", "statement"], occasion: ["đi chơi", "hẹn hò"], material: "Vải dệt phối dây da",
    fit: "Halter mini fit", silhouette: "bodycon", lengthClass: "mini", neckline: "cowl-halter", sleeveLength: "sleeveless", pattern: "polka-dot", tryOn: true
  },
  {
    sku: "V25051666", name: "Soren Dress", subtitle: "Đầm body cổ sơ mi phối sequin sọc dọc",
    category: "dress", type: "mini-dress", price: 3520000, color: "Xám xanh", colorFamily: "gray",
    image: "https://dosi-in.com/img/600/vn-11134207-820l4-mhcx0umkok5kbb.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-soren-dress-dam-body-co-so-mi-thanh-lich-phoi-sequin-soc-doc-vai-thun-gan-co-gian-v25051666-269491027.50051927854/",
    style: ["preppy", "glam", "nữ tính"], occasion: ["đi tiệc", "hẹn hò"], material: "Thun gân co giãn phối sequin",
    fit: "Fitted shirt dress", silhouette: "bodycon", lengthClass: "mini", neckline: "shirt-collar", sleeveLength: "short", colorTemperature: "cool", tryOn: true
  },
  {
    sku: "V25121690", name: "Winly Dress", subtitle: "Đầm len hở vai cao cổ phối khóa da",
    category: "dress", type: "mini-dress", price: 3080000, color: "Kem", colorFamily: "beige",
    image: "https://dosi-in.com/img/600/vn-11134207-820l4-mi47y66j1vcze8.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dam-len-ho-vai-cao-co-phoi-khoa-da-bo-gan-sang-trong-winly-dress-v25121690-269491027.51902931460/",
    style: ["cozy", "statement", "nữ tính"], occasion: ["đi chơi", "hẹn hò"], material: "Len bo gân phối da",
    fit: "Relaxed upper / fitted hem", silhouette: "cocoon", lengthClass: "mini", neckline: "high-neck", sleeveLength: "long", colorTemperature: "warm", volume: "voluminous", tryOn: true
  },
  {
    sku: "V24121654", name: "Vamp Dress", subtitle: "Đầm cổ yếm hở lưng phối dây da cá tính",
    category: "dress", type: "mini-dress", price: 1782000, color: "Đỏ đen", colorFamily: "red",
    image: "https://dosi-in.com/img/600/vn-11134207-7ras8-m479uaotpp5sed.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dam-co-yem-ho-lung-phoi-day-da-ca-tinh-vamp-dress-v24121654-269491027.24189831302/",
    style: ["gothic", "Y2K", "statement"], occasion: ["concert", "đi tiệc"], material: "Vải co giãn phối dây da",
    fit: "Halter bodycon", silhouette: "bodycon", lengthClass: "mini", neckline: "halter", sleeveLength: "sleeveless", colorTemperature: "warm", tryOn: true
  },
  {
    sku: "V24051608", name: "Aubé Dress", subtitle: "Đầm ngắn cổ yếm chân váy bí phồng phối thắt lưng",
    category: "dress", type: "mini-dress", price: 4620000, color: "Đỏ", colorFamily: "red",
    image: "https://dosi-in.com/img/600/vn-11134207-7r98o-lv2ott428m490e.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dam-ngan-co-yem-xe-nguc-ho-lung-chan-vay-bi-phong-phoi-that-lung-aube-dress-v24051608-269491027.25629354943/",
    style: ["statement", "romantic", "glam"], occasion: ["đi tiệc", "sự kiện"], material: "Vải dệt phối thắt lưng",
    fit: "Fitted top / bubble skirt", silhouette: "bubble", lengthClass: "mini", neckline: "halter", sleeveLength: "sleeveless", colorTemperature: "warm", volume: "voluminous", tryOn: true
  },
  {
    sku: "V25011656", name: "Dusk Dress", subtitle: "Váy xếp tầng bồng bềnh phối dây da đinh tán",
    category: "dress", type: "mini-dress", price: 4125000, color: "Trắng", colorFamily: "white",
    image: "https://dosi-in.com/img/600/vn-11134207-820l4-mhd4kquw2uq274.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dusk-dress-vay-xep-tang-bong-benh-mix-day-that-da-dinh-tan-ca-tinh-v25011656-women-269491027.45801960343/",
    style: ["romantic", "Y2K", "statement"], occasion: ["đi tiệc", "concert"], material: "Vải sheer xếp tầng phối da",
    fit: "Voluminous tiered", silhouette: "tiered", lengthClass: "mini", neckline: "strapless", sleeveLength: "sleeveless", volume: "voluminous", tryOn: true
  },
  {
    sku: "V24031604", name: "Éthérée Dress", subtitle: "Đầm xuyên thấu chân váy ngắn xếp tầng",
    category: "dress", type: "mini-dress", price: 1424500, color: "Trắng", colorFamily: "white",
    image: "https://dosi-in.com/img/600/vn-11134207-7r98o-lu027j96q0whe7.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dam-om-body-sexy-xuyen-thau-chan-vay-ngan-xep-tang-etheree-dess-v24031604-269491027.24823714126/",
    style: ["sheer", "romantic", "statement"], occasion: ["đi tiệc", "sự kiện"], material: "Lưới sheer phối tầng",
    fit: "Sheer fitted bodice", silhouette: "tiered", lengthClass: "mini", neckline: "high-neck", sleeveLength: "long", volume: "balanced", tryOn: true
  },
  {
    sku: "V26061719", name: "Desii Dress", subtitle: "Đầm mini lệch vai ôm dáng xếp ly phối nơ",
    category: "dress", type: "bodycon-dress", price: 2832500, color: "Đen / đỏ", colorFamily: "black",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mq8xn5fc9khtac.webp",
    sourceUrl: "https://dosi-in.com/san-pham/mo-ban-lsoul-dam-mini-lech-vai-om-dang-xep-ly-phoi-no-quyen-ru-ca-tinh-desii-dress-v26061719-v26061720-269491027.51062203450/",
    style: ["minimal", "sexy", "nữ tính"], occasion: ["hẹn hò", "đi tiệc"], material: "Vải co giãn xếp ly",
    fit: "Asymmetric bodycon", silhouette: "bodycon", lengthClass: "mini", neckline: "one-shoulder", sleeveLength: "sleeveless", tryOn: true
  },
  {
    sku: "V26061715", name: "Liery Dress", subtitle: "Đầm maxi cổ yếm dáng ôm xếp ly đính nơ hông",
    category: "dress", type: "maxi-dress", price: 3616000, color: "Xanh pastel", colorFamily: "blue",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mq2ux3d4nhfm69.webp",
    sourceUrl: "https://dosi-in.com/san-pham/mo-ban-lsoul-dam-maxi-co-yem-dang-om-xep-ly-dinh-no-hong-quyen-ru-liery-dress-v26061715-269491027.54312650410/",
    style: ["elegant", "romantic", "nữ tính"], occasion: ["đi tiệc", "sự kiện"], material: "Vải mềm xếp ly",
    fit: "Slim maxi", silhouette: "column", lengthClass: "maxi", neckline: "halter", sleeveLength: "sleeveless", colorTemperature: "cool", tryOn: true
  },
  {
    sku: "V24121644", name: "Lessa Dress", subtitle: "Đầm maxi cut-out cổ V phối lông",
    category: "dress", type: "maxi-dress", price: 3520000, color: "Đen", colorFamily: "black",
    image: "https://dosi-in.com/img/600/vn-11134207-7ras8-m45sx1ftrvgn9a.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dam-dai-maxi-thiet-ke-cut-out-co-v-phoi-long-quyen-ru-lessa-dress-v24121644-269491027.28171616518/",
    style: ["gothic", "glam", "statement"], occasion: ["đi tiệc", "sự kiện buổi tối"], material: "Vải dệt phối lông",
    fit: "Cut-out maxi fit", silhouette: "column", lengthClass: "maxi", neckline: "deep-v", sleeveLength: "sleeveless", tryOn: true
  },
  {
    sku: "V26061717", name: "Jone Dress", subtitle: "Đầm midi hai dây cổ vuông ôm dáng phối nơ vai",
    category: "dress", type: "midi-dress", price: 2832500, color: "Trắng", colorFamily: "white",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mso63w0riollcb.webp",
    sourceUrl: "https://dosi-in.com/san-pham/mo-ban-lsoul-dam-midi-hai-day-co-vuong-om-dang-phoi-no-vai-quyen-ru-sang-trong-jone-dress-v26061717-269491027.54112124462/",
    style: ["minimal", "elegant", "nữ tính"], occasion: ["hẹn hò", "đi tiệc"], material: "Vải co giãn",
    fit: "Slim midi", silhouette: "column", lengthClass: "midi", neckline: "square", sleeveLength: "sleeveless", tryOn: true
  },
  {
    sku: "V26041713", name: "Tya Dress", subtitle: "Đầm maxi cổ thuyền ôm dáng xếp ly vai",
    category: "dress", type: "maxi-dress", price: 4950000, color: "Xanh sage", colorFamily: "green",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-msp4dsvkx3ih3b.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-dam-maxi-co-thuyen-om-dang-xep-ly-vai-thanh-lich-sang-trong-di-tiec-tya-dress-v26041713-269491027.49760176441/",
    style: ["elegant", "minimal", "formal"], occasion: ["đi tiệc", "sự kiện"], material: "Satin mềm",
    fit: "Draped slim maxi", silhouette: "column", lengthClass: "maxi", neckline: "boat", sleeveLength: "sleeveless", colorTemperature: "cool", tryOn: true
  },

  {
    sku: "CV24120705", name: "Laby Skirt", subtitle: "Chân váy lông cạp trễ ôm body",
    category: "bottoms", type: "skirt", price: 1540000, color: "Trắng", colorFamily: "white",
    image: "https://dosi-in.com/img/600/vn-11134207-7ras8-m47cn2ym7snj1b.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-chan-vay-long-cap-tre-ca-tinh-star-om-body-laby-skirt-cv24120705-cv24120706-269491027.26771728750/",
    style: ["Y2K", "gothic", "statement"], occasion: ["đi chơi", "concert"], material: "Vải lông / sequin",
    fit: "Low-rise mini fitted", silhouette: "mini-straight", lengthClass: "mini", waistRise: "low", tryOn: true
  },
  {
    sku: "CV26010749", name: "Rene Skirt", subtitle: "Chân váy vàng pastel cạp trễ viền ren nơ satin",
    category: "bottoms", type: "skirt", price: 1595000, color: "Vàng pastel", colorFamily: "beige",
    image: "https://dosi-in.com/img/600/vn-11134207-820l4-mj6uq2qmnpqe47.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-chan-vay-vang-pastel-cap-tre-phoi-vien-ren-dinh-no-satin-rene-skirt-cv26010749-269491027.46954604091/",
    style: ["romantic", "Y2K", "nữ tính"], occasion: ["hẹn hò", "đi chơi"], material: "Vải mềm phối ren",
    fit: "Low-rise micro mini", silhouette: "mini-straight", lengthClass: "mini", waistRise: "low", colorTemperature: "warm", tryOn: true
  },
  {
    sku: "CV25110739", name: "Salyn Skirt", subtitle: "Chân váy lụa mini phối nơ cạp trễ",
    category: "bottoms", type: "skirt", price: 1540000, color: "Đen / xám / xanh", colorFamily: "black",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mso87pbsiayq63.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-chan-vay-lua-miniskirt-phoi-no-form-vay-cap-tre-sexy-ca-tinh-salyn-skirt-cv25110739-269491027.46611171760/",
    style: ["romantic", "Y2K", "glam"], occasion: ["hẹn hò", "đi tiệc"], material: "Lụa bóng",
    fit: "Low-rise slim mini", silhouette: "mini-straight", lengthClass: "mini", waistRise: "low"
  },
  {
    sku: "J26030828", name: "Nie Pants", subtitle: "Quần jeans nữ ống suông basic phong cách streetwear Y2K",
    category: "bottoms", type: "jeans", price: 3190000, color: "Đen denim", colorFamily: "black",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mop39g5zygp940.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-quan-jeans-nu-ong-suong-basic-phong-cach-streetwear-y2k-nie-pants-j26030828-269491027.52511142682/",
    style: ["streetwear", "Y2K", "denim"], occasion: ["đi chơi", "đi cafe"], material: "100% Cotton denim",
    fit: "Wide straight-leg", silhouette: "wide-leg", lengthClass: "full", waistRise: "mid", tryOn: true
  },
  {
    sku: "CV26060760", name: "Haley Skirt", subtitle: "Chân váy chữ A dáng ngắn phối viền ren",
    category: "bottoms", type: "skirt", price: 2605900, color: "Trắng / hồng / đen", colorFamily: "white",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mso8afk3kvlx38.webp",
    sourceUrl: "https://dosi-in.com/san-pham/mo-ban-lsoul-chan-vay-chu-a-dang-ngan-phoi-vien-ren-gau-sang-trong-quyen-ru-di-tiec-haley-skirt-cv26060760-269491027.57412702002/",
    style: ["romantic", "elegant"], occasion: ["hẹn hò", "đi tiệc"], material: "Vải dệt phối ren",
    fit: "A-line mini", silhouette: "a-line", lengthClass: "mini", waistRise: "mid"
  },
  {
    sku: "CV25110741", name: "Lincoln Skirt", subtitle: "Chân váy dạ tweed cạp trễ phối nơ",
    category: "bottoms", type: "skirt", price: 1540000, color: "Kem", colorFamily: "beige",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mop5nesqs9ak58.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-chan-vay-da-tweed-cap-tre-phoi-no-style-thanh-lich-nu-tinh-lincoln-skirt-cv25110741-269491027.53211155325/",
    style: ["preppy", "nữ tính", "elegant"], occasion: ["đi chơi", "hẹn hò"], material: "Dạ tweed",
    fit: "Low-rise mini", silhouette: "mini-straight", lengthClass: "mini", waistRise: "low", colorTemperature: "warm", tryOn: true
  },
  {
    sku: "CV24110703", name: "Polina Skirt", subtitle: "Chân váy nỉ xòe phối ren",
    category: "bottoms", type: "skirt", price: 1078000, color: "Xám", colorFamily: "gray",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-moowyglit43k75.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-chan-vay-ni-phoi-ren-phong-cach-ca-tinh-polina-skirt-cv24110703-269491027.51911133844/",
    style: ["preppy", "Y2K", "casual"], occasion: ["đi chơi", "đi cafe"], material: "Nỉ phối ren",
    fit: "Flared mini", silhouette: "flare", lengthClass: "mini", waistRise: "mid", tryOn: true
  },
  {
    sku: "M25110602", name: "Echo Short", subtitle: "Quần short len cạp cao bo gân ôm body",
    category: "bottoms", type: "shorts", price: 1430000, color: "Kem", colorFamily: "beige",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mop53mw4upduef.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-quan-short-len-cap-cao-bo-gan-om-body-sexy-chic-phong-cach-y2k-echo-short-m25110602-269491027.57761143883/",
    style: ["Y2K", "cozy", "casual"], occasion: ["đi chơi", "đi cafe"], material: "Len dệt kim",
    fit: "High-rise fitted short", silhouette: "fitted-short", lengthClass: "short", waistRise: "high", colorTemperature: "warm", tryOn: true
  },
  {
    sku: "J25110824", name: "Dirr Pants", subtitle: "Quần jeans ống rộng wash loang vintage",
    category: "bottoms", type: "jeans", price: 3190000, color: "Xanh denim wash", colorFamily: "blue",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mop9z2ybsowf8f.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-quan-jeans-nu-ong-rong-wash-loang-vintage-dirr-pants-j25110824-269491027.51161166366/",
    style: ["streetwear", "vintage", "Y2K"], occasion: ["đi chơi", "concert"], material: "Denim",
    fit: "Wide-leg", silhouette: "wide-leg", lengthClass: "full", waistRise: "mid", colorTemperature: "cool", tryOn: true
  },
  {
    sku: "CV26060757", name: "Choo Skirt", subtitle: "Chân váy ngắn cạp trễ dáng ôm thắt nơ to bản",
    category: "bottoms", type: "skirt", price: 2039400, color: "Đen", colorFamily: "black",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mso63s2t48aw9b.webp",
    sourceUrl: "https://dosi-in.com/san-pham/mo-ban-lsoul-chan-vay-ngan-cap-tre-dang-om-that-no-to-ban-ca-tinh-quyen-ru-choo-skirt-cv26060757-269491027.43431947749/",
    style: ["Y2K", "sexy", "statement"], occasion: ["hẹn hò", "đi tiệc"], material: "Da tổng hợp",
    fit: "Low-rise fitted mini", silhouette: "mini-straight", lengthClass: "mini", waistRise: "low"
  },
  {
    sku: "J2604083", name: "Fora Jeans", subtitle: "Quần jean dài ống suông cạp trễ wash streetwear",
    category: "bottoms", type: "jeans", price: 3285700, color: "Đen denim", colorFamily: "black",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mqbj8pcducjx85.webp",
    sourceUrl: "https://dosi-in.com/san-pham/mo-ban-lsoul-quan-jean-dai-ong-suong-cap-tre-wash-phui-bui-ca-tinh-thoi-thuong-streetwear-fora-jeans-j2604083-269491027.55963463048/",
    style: ["streetwear", "Y2K", "denim"], occasion: ["đi chơi", "concert"], material: "Denim",
    fit: "Low-rise straight-leg", silhouette: "straight-leg", lengthClass: "full", waistRise: "low", tryOn: true
  },
  {
    sku: "CV24120707", name: "Meli Skirt", subtitle: "Chân váy cạp trễ ánh kim lấp lánh vảy cá",
    category: "bottoms", type: "skirt", price: 1650000, color: "Trắng ánh kim", colorFamily: "white",
    image: "https://dosi-in.com/img/600/vn-11134207-7ras8-m44cmy9r9bev7b.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-chan-vay-cap-tre-anh-kim-lap-lanh-vay-ca-ca-tinh-meli-skirt-cv24120707-269491027.26921418007/",
    style: ["glam", "Y2K", "statement"], occasion: ["đi tiệc", "concert"], material: "Vải sequin/vảy ánh kim",
    fit: "Low-rise fitted mini", silhouette: "mini-straight", lengthClass: "mini", waistRise: "low", tryOn: true
  },
  {
    sku: "CV26040753", name: "Suzan Skirt", subtitle: "Chân váy mini ren hồng pastel phong cách Y2K",
    category: "bottoms", type: "skirt", price: 2090000, color: "Hồng pastel", colorFamily: "pink",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mnwm7ng6axvq12.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-chan-vay-mini-ren-hong-pastel-style-y2k-nu-tinh-quyen-ru-suzan-skirt-cv26040753-269491027.42631179226/",
    style: ["romantic", "Y2K", "nữ tính"], occasion: ["hẹn hò", "đi chơi"], material: "Ren",
    fit: "Low-rise mini", silhouette: "mini-straight", lengthClass: "mini", waistRise: "low", colorTemperature: "cool", tryOn: true
  },
  {
    sku: "CV25120746", name: "Noah Skirt", subtitle: "Chân váy da mini ôm dáng phong cách Y2K",
    category: "bottoms", type: "skirt", price: 1969000, color: "Đen", colorFamily: "black",
    image: "https://dosi-in.com/img/600/vn-11134207-820l4-mifnox8zgmbs59.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-chan-vay-da-mini-om-dang-ca-tinh-y2k-noah-skirt-cv25120746-269491027.56853335160/",
    style: ["Y2K", "gothic", "streetwear"], occasion: ["đi chơi", "concert"], material: "Da tổng hợp",
    fit: "Low-rise fitted mini", silhouette: "mini-straight", lengthClass: "mini", waistRise: "low", tryOn: true
  },
  {
    sku: "M25120603", name: "Sie Short", subtitle: "Quần short da bóng cạp trễ phong cách Y2K",
    category: "bottoms", type: "shorts", price: 1759800, color: "Đen", colorFamily: "black",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mop6lw69r18h32.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-quan-short-da-bong-cap-tre-y2k-sie-short-m25120603-269491027.44381189577/",
    style: ["Y2K", "streetwear", "sexy"], occasion: ["đi chơi", "concert"], material: "Da bóng",
    fit: "Low-rise fitted short", silhouette: "fitted-short", lengthClass: "short", waistRise: "low", tryOn: true
  },

  {
    sku: "K25100258-1", name: "Tiam Jacket", subtitle: "Áo khoác lông croptop ngắn cá tính",
    category: "outerwear", type: "jacket", price: 2860000, color: "Vàng kem / xám", colorFamily: "beige",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mso8aer7cjd11a.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-ao-khoac-long-croptop-ngan-ca-tinh-thoi-trang-nu-tiam-jacket-k25100258-1-269491027.41926687504/",
    style: ["Y2K", "statement", "luxury"], occasion: ["đi chơi", "đi tiệc"], material: "Lông nhân tạo",
    fit: "Cropped fur jacket", silhouette: "cropped", lengthClass: "cropped", neckline: "high-neck", sleeveLength: "short", colorTemperature: "warm"
  },
  {
    sku: "A26052906", name: "Agne Cardigan", subtitle: "Cardigan dệt kim tay dài form croptop",
    category: "outerwear", type: "cardigan", price: 3342350, color: "Hồng pastel", colorFamily: "pink",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mqbrhjc64cul42.webp",
    sourceUrl: "https://dosi-in.com/san-pham/mo-ban-lsoul-ao-cardigan-det-kim-tay-dai-form-croptop-mem-mai-agne-cardigan-a26052906-269491027.53112655089/",
    style: ["romantic", "casual", "nữ tính"], occasion: ["đi chơi", "đi cafe"], material: "Dệt kim",
    fit: "Cropped cardigan", silhouette: "cropped", lengthClass: "cropped", neckline: "v-neck", sleeveLength: "long", colorTemperature: "cool"
  },
  {
    sku: "A26042903", name: "Medy Cardigan", subtitle: "Áo khoác len cúc bọc dáng croptop tay dài",
    category: "outerwear", type: "cardigan", price: 3172400, color: "Xanh / đỏ / kem", colorFamily: "green",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mso8ahbo385h5d.webp",
    sourceUrl: "https://dosi-in.com/san-pham/mo-ban-lsoul-ao-khoac-len-cuc-boc-dang-croptop-tay-dai-diu-dang-nu-tinh-medy-cardigan-a26042903-269491027.51712713431/",
    style: ["preppy", "casual", "nữ tính"], occasion: ["đi chơi", "đi cafe"], material: "Len dệt kim",
    fit: "Cropped fitted cardigan", silhouette: "cropped", lengthClass: "cropped", neckline: "v-neck", sleeveLength: "long", colorTemperature: "warm"
  },
  {
    sku: "K25100256-1", name: "Leyla Jacket", subtitle: "Áo khoác lông croptop tay dài đính đinh tán",
    category: "outerwear", type: "jacket", price: 5280000, color: "Hồng / lilac / nâu", colorFamily: "pink",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mso8aeqnby11dc.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-ao-khoac-long-croptop-tay-dai-co-day-da-dinh-dinh-tan-ca-tinh-leyla-jacket-k25100256-1-269491027.48251960938/",
    style: ["Y2K", "statement", "gothic"], occasion: ["đi chơi", "concert"], material: "Lông nhân tạo phối dây da",
    fit: "Cropped fur jacket", silhouette: "cropped", lengthClass: "cropped", neckline: "high-neck", sleeveLength: "long"
  },
  {
    sku: "K25100264", name: "Kourney Jacket", subtitle: "Áo khoác cổ cao phối thắt lưng bản",
    category: "outerwear", type: "jacket", price: 6820000, color: "Nâu burgundy", colorFamily: "brown",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mso8aeqa6kna51.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-ao-khoac-mango-co-ao-tuy-chinh-phoi-that-lung-ban-kourney-kouna-jacket-k25100264-269491027.53901025263/",
    style: ["luxury", "statement", "structured"], occasion: ["đi chơi", "sự kiện"], material: "Vải phủ bề mặt",
    fit: "Belted structured jacket", silhouette: "structured", lengthClass: "regular", neckline: "high-neck", sleeveLength: "long", colorTemperature: "warm"
  },
  {
    sku: "K25110271", name: "Merlot Jacket", subtitle: "Áo khoác da lót lông cổ ấm phối thắt lưng",
    category: "outerwear", type: "jacket", price: 7590000, color: "Nâu", colorFamily: "brown",
    image: "https://dosi-in.com/img/600/vn-11134207-820l4-mhn5jzdt4wskfb.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-ao-khoac-da-lot-long-co-am-phoi-that-lung-merlot-jacket-k25110271-269491027.45002338522/",
    style: ["luxury", "vintage", "statement"], occasion: ["đi chơi", "sự kiện"], material: "Da phối lông",
    fit: "Relaxed belted jacket", silhouette: "structured", lengthClass: "regular", neckline: "high-neck", sleeveLength: "long", colorTemperature: "warm"
  },

  {
    sku: "A25122871", name: "Kai Top", subtitle: "Áo croptop hai dây mảnh basic ôm dáng co giãn",
    category: "tops", type: "crop-top", price: 934906, color: "Hồng / trắng / đen", colorFamily: "pink",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-msc8efkg3rwo6d.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-ao-thun-croptop-hai-day-manh-basic-om-dang-chat-thun-co-gian-kai-top-a25122871-269491027.41927221179/",
    style: ["basic", "Y2K", "casual"], occasion: ["đi chơi", "đi cafe"], material: "Thun co giãn",
    fit: "Slim cropped tank", silhouette: "fitted", lengthClass: "cropped", neckline: "scoop", sleeveLength: "sleeveless", colorTemperature: "cool", tryOn: true
  },
  {
    sku: "A24122794", name: "Cinza Top", subtitle: "Áo corset đan dây thiết kế lông mềm",
    category: "tops", type: "corset", price: 1320000, color: "Đỏ rượu", colorFamily: "red",
    image: "https://dosi-in.com/img/600/vn-11134207-820l4-mhd0v9t2172k36.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-cinza-top-ao-corset-dan-day-thiet-ke-long-mem-quyen-ru-a24122794-a24122793-women-269491027.41626678412/",
    style: ["corset", "gothic", "Y2K"], occasion: ["hẹn hò", "concert"], material: "Vải lông mềm",
    fit: "Lace-up corset", silhouette: "corset", lengthClass: "cropped", neckline: "halter", sleeveLength: "sleeveless", colorTemperature: "warm"
  },
  {
    sku: "A26052909", name: "Joye Bodysuit", subtitle: "Bodysuit cổ V khoét sâu phối nơ maxi",
    category: "tops", type: "bodysuit", price: 2096050, color: "Trắng", colorFamily: "white",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mso6hquc1wqq23.webp",
    sourceUrl: "https://dosi-in.com/san-pham/mo-ban-lsoul-ao-bodysuit-co-v-khoet-sau-phoi-no-maxi-ca-tinh-joye-bodysuit-a26052909-269491027.54262644337/",
    style: ["minimal", "statement", "nữ tính"], occasion: ["hẹn hò", "đi tiệc"], material: "Vải co giãn",
    fit: "Deep-v fitted bodysuit", silhouette: "fitted", lengthClass: "regular", neckline: "deep-v", sleeveLength: "sleeveless"
  },
  {
    sku: "A24122790", name: "Trap Top", subtitle: "Áo hai dây loang màu phối dây da bò đinh tán",
    category: "tops", type: "crop-top", price: 762300, color: "Nâu ánh kim", colorFamily: "brown",
    image: "https://dosi-in.com/img/600/vn-11134207-7ras8-m5cdiah8i8sj6c.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-ao-hai-day-loang-mau-phoi-day-da-bo-dinh-tan-cao-cap-trap-top-a24122790-269491027.26774330517/",
    style: ["Y2K", "gothic", "statement"], occasion: ["đi chơi", "concert"], material: "Vải loang phối dây da",
    fit: "Slim strappy crop", silhouette: "fitted", lengthClass: "cropped", neckline: "square", sleeveLength: "sleeveless", colorTemperature: "warm", tryOn: true
  },
  {
    sku: "A25102840", name: "Jio Bodysuit", subtitle: "Bodysuit cotton co giãn phong cách Y2K",
    category: "tops", type: "bodysuit", price: 979000, color: "Đen / trắng / xám / hồng", colorFamily: "black",
    image: "https://dosi-in.com/img/600/vn-11134207-820l4-mhaa4n099p1paa.webp",
    sourceUrl: "https://dosi-in.com/san-pham/lsoul-bodysuit-cotton-co-gian-goi-cam-phong-cach-y2k-jio-bodysuit-a25102840-269491027.49901802775/",
    style: ["Y2K", "basic", "sexy"], occasion: ["đi chơi", "hẹn hò"], material: "Cotton",
    fit: "Fitted bodysuit", silhouette: "fitted", lengthClass: "regular", neckline: "scoop", sleeveLength: "sleeveless", tryOn: true
  },
  {
    sku: "A26072917", name: "Risse Top", subtitle: "Áo corset cúp ngực dáng ôm định hình đính nơ",
    category: "tops", type: "corset", price: 4068000, color: "Tím lilac", colorFamily: "pink",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-msb0nwru4dmqf8.webp",
    sourceUrl: "https://dosi-in.com/san-pham/mo-ban-lsoul-ao-kieu-corset-cup-nguc-dang-om-dinh-hinh-dinh-no-nguc-quyen-ru-ca-tinh-risse-top-a26072917-269491027.54862695886/",
    style: ["corset", "romantic", "statement"], occasion: ["hẹn hò", "đi tiệc"], material: "Vải corset định hình",
    fit: "Structured corset", silhouette: "corset", lengthClass: "regular", neckline: "strapless", sleeveLength: "sleeveless", colorTemperature: "cool", tryOn: true
  },
  {
    sku: "A26062912", name: "Therric Top", subtitle: "Áo corset cúp ngực ôm định hình đính nơ",
    category: "tops", type: "corset", price: 3682250, color: "Nâu caramel", colorFamily: "brown",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-mq8n27eslsle50.webp",
    sourceUrl: "https://dosi-in.com/san-pham/mo-ban-lsoul-ao-kieu-corset-cup-nguc-om-dinh-hinh-dinh-no-nguc-quyen-ru-ca-tinh-therric-top-a26062912-269491027.44612715204/",
    style: ["corset", "elegant", "statement"], occasion: ["hẹn hò", "đi tiệc"], material: "Vải corset định hình",
    fit: "Structured corset", silhouette: "corset", lengthClass: "regular", neckline: "sweetheart", sleeveLength: "sleeveless", colorTemperature: "warm", tryOn: true
  },
  {
    sku: "A26062913", name: "Kat Top", subtitle: "Áo corset cúp ngực dáng ôm đính nơ",
    category: "tops", type: "corset", price: 3850000, color: "Hồng lilac", colorFamily: "pink",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-msjfu5rue4g739.webp",
    sourceUrl: "https://dosi-in.com/san-pham/deal-mo-ban-lsoul-ao-kieu-corset-cup-nguc-dang-om-dinh-hinh-dinh-no-nguc-quyen-ru-ca-tinh-kat-top-a26062913-269491027.56667286928/",
    style: ["corset", "romantic", "nữ tính"], occasion: ["hẹn hò", "đi tiệc"], material: "Vải corset định hình",
    fit: "Structured corset", silhouette: "corset", lengthClass: "regular", neckline: "sweetheart", sleeveLength: "sleeveless", colorTemperature: "cool", tryOn: true
  },
  {
    sku: "V2609031", name: "Liu Top", subtitle: "Áo bustier crop cổ tim xếp nhún tay bồng",
    category: "tops", type: "crop-top", price: 4068000, color: "Trắng kem", colorFamily: "white",
    image: "https://dosi-in.com/img/600/vn-11134207-81ztc-msnxcfimdnuub4.webp",
    sourceUrl: "https://dosi-in.com/san-pham/mo-ban-lsoul-ao-bustier-crop-co-tim-xep-nhun-tay-bong-om-sat-ton-dang-liu-top-v2609031-269491027.46867306231/",
    style: ["romantic", "elegant", "nữ tính"], occasion: ["hẹn hò", "đi tiệc"], material: "Vải co giãn xếp nhún",
    fit: "Fitted bustier crop", silhouette: "fitted", lengthClass: "cropped", neckline: "sweetheart", sleeveLength: "short", tryOn: true
  }
];

export const extendedProducts: Product[] = data.map(makeProduct);

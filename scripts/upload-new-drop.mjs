import fs from "node:fs";
import path from "node:path";

// 1. Đọc cấu hình Cloudinary từ .env
const envFile = fs.readFileSync(".env", "utf8");
function getEnv(key, def = "") {
  const m = envFile.match(new RegExp(`^${key}=([^\\r\\n]+)`, "m"));
  return m ? m[1].replace(/^["']|["']$/g, "").trim() : def;
}

const cloudName = getEnv("CLOUDINARY_CLOUD_NAME", "dbk2ncqss");
const apiKey = getEnv("CLOUDINARY_API_KEY", "557958621491988");
const apiSecret = getEnv("CLOUDINARY_API_SECRET", "lYCCdUr-hV29Jd24OG5nSDR0mvc");
const folder = getEnv("CLOUDINARY_FOLDER", "lsoul/products");

export const NEW_PRODUCTS = [
  // --- OUTERWEAR ---
  {
    id: "lsoul-vintage-washed-moto-jacket-black",
    sku: "JK-VINTAGE-MOTO-BLK",
    groupCode: "JK-VINTAGE-MOTO",
    name: "Vintage Cropped Moto Leather Jacket",
    subtitle: "Áo khoác biker da lửng khóa kéo kim loại cá tính và nổi loạn (Đen)",
    category: "outerwear",
    type: "jacket",
    gender: "women",
    price: 2650000,
    color: "Đen",
    colorFamily: "black",
    colorHex: "#161616",
    material: "Da nhân tạo PU phủ sáp cao cấp lót satin lụa",
    fit: "Cropped boxy fit",
    silhouette: "structured",
    lengthClass: "cropped",
    neckline: "lapel",
    sleeveLength: "long",
    pattern: "solid",
    season: ["autumn", "winter", "spring"],
    formality: 4, warmth: 4, stretch: 1, coverage: 5,
    colorTemperature: "neutral",
    style: ["edgy", "chic", "statement"],
    occasion: ["dạo phố", "hẹn hò", "đi tiệc"],
    styleKeywords: ["áo da lửng", "jacket da", "moto jacket", "biker jacket", "edgy", "cá tính"],
    sourceImage: "https://huggingface.co/spaces/yisol/IDM-VTON/resolve/main/example/cloth/04469_00.jpg",
    filename: "jacket-biker-leather-black.jpg"
  },
  {
    id: "lsoul-tailored-bolero-blazer-grey",
    sku: "BZ-TAILORED-BOLERO-GRY",
    groupCode: "BZ-TAILORED-BOLERO",
    name: "Structured Cropped Bolero Blazer",
    subtitle: "Áo blazer lửng độn vai phom may đo sắc sảo quyền lực (Xám khói)",
    category: "outerwear",
    type: "blazer",
    gender: "women",
    price: 2450000,
    color: "Xám khói",
    colorFamily: "gray",
    colorHex: "#6E7278",
    material: "Vải âu phục dạ len pha đệm vai ép form chuẩn",
    fit: "Cropped tailored fit",
    silhouette: "structured",
    lengthClass: "cropped",
    neckline: "lapel",
    sleeveLength: "long",
    pattern: "solid",
    season: ["spring", "autumn", "winter"],
    formality: 5, warmth: 3, stretch: 1, coverage: 4,
    colorTemperature: "cool",
    style: ["chic", "công sở", "minimal"],
    occasion: ["đi làm", "sự kiện", "hẹn hò"],
    styleKeywords: ["blazer lửng", "blazer xám", "áo khoác vest lửng", "công sở", "sang trọng"],
    sourceImage: "https://huggingface.co/spaces/yisol/IDM-VTON/resolve/main/example/cloth/04743_00.jpg",
    filename: "blazer-bolero-cropped-grey.jpg"
  },
  {
    id: "lsoul-boucle-tweed-jacket-pink",
    sku: "JK-TWEED-BOUCLE-PNK",
    groupCode: "JK-TWEED-BOUCLE",
    name: "Bouclé Tweed Cropped Gold-Button Jacket",
    subtitle: "Áo khoác dạ tweed sợi ánh nhũ đính cúc vàng sang trọng tiểu thư (Hồng phấn)",
    category: "outerwear",
    type: "jacket",
    gender: "women",
    price: 2550000,
    color: "Hồng phấn",
    colorFamily: "pink",
    colorHex: "#F2D0D9",
    material: "Vải dạ Bouclé dệt sợi kim tuyến lót lụa habutai",
    fit: "Cropped structured fit",
    silhouette: "structured",
    lengthClass: "cropped",
    neckline: "round",
    sleeveLength: "long",
    pattern: "solid",
    season: ["autumn", "winter", "spring"],
    formality: 4, warmth: 4, stretch: 1, coverage: 4,
    colorTemperature: "warm",
    style: ["chic", "romantic", "công sở"],
    occasion: ["đi làm", "hẹn hò", "đi cafe"],
    styleKeywords: ["áo khoác tweed", "tweed hồng", "áo dạ tiểu thư", "boucle jacket"],
    sourceImage: "https://huggingface.co/spaces/yisol/IDM-VTON/resolve/main/example/cloth/09133_00.jpg",
    filename: "jacket-boucle-tweed-pink.jpg"
  },
  {
    id: "lsoul-y2k-denim-jacket-blue",
    sku: "JK-Y2K-DENIM-CROP-BLU",
    groupCode: "JK-Y2K-DENIM-CROP",
    name: "Y2K Distressed Washed Denim Jacket",
    subtitle: "Áo khoác denim wash bạc rách gấu phong cách đường phố (Xanh denim)",
    category: "outerwear",
    type: "jacket",
    gender: "women",
    price: 2150000,
    color: "Xanh denim",
    colorFamily: "blue",
    colorHex: "#5B7C99",
    material: "Denim cotton 100% định lượng cao xử lý enzyme wash",
    fit: "Relaxed cropped fit",
    silhouette: "relaxed",
    lengthClass: "cropped",
    neckline: "collar",
    sleeveLength: "long",
    pattern: "solid",
    season: ["spring", "summer", "autumn", "winter"],
    formality: 2, warmth: 3, stretch: 1, coverage: 4,
    colorTemperature: "cool",
    style: ["edgy", "trendy", "chic"],
    occasion: ["dạo phố", "du lịch", "đi cafe"],
    styleKeywords: ["áo khoác bò", "denim jacket", "áo bò lửng", "y2k", "cá tính"],
    sourceImage: "https://huggingface.co/spaces/yisol/IDM-VTON/resolve/main/example/cloth/09163_00.jpg",
    filename: "jacket-denim-cropped-blue.jpg"
  },

  // --- TOPS ---
  {
    id: "lsoul-sheer-organza-peplum-blouse-black",
    sku: "TP-ORGANZA-PEPLUM-BLK",
    groupCode: "TP-ORGANZA-PEPLUM",
    name: "Sheer Floral Organza Peplum Blouse",
    subtitle: "Áo blouse tơ organza xuyên thấu hoa nhí chiết eo peplum kiêu kỳ (Đen)",
    category: "tops",
    type: "blouse",
    gender: "women",
    price: 1690000,
    color: "Đen",
    colorFamily: "black",
    colorHex: "#121212",
    material: "Tơ organza dệt hoa dập nổi cao cấp",
    fit: "Peplum cinched waist",
    silhouette: "fitted",
    lengthClass: "hip-length",
    neckline: "round",
    sleeveLength: "long",
    pattern: "floral",
    season: ["spring", "summer", "autumn"],
    formality: 4, warmth: 1, stretch: 1, coverage: 3,
    colorTemperature: "neutral",
    style: ["romantic", "sexy", "chic"],
    occasion: ["đi tiệc", "hẹn hò", "sự kiện"],
    styleKeywords: ["áo peplum", "áo tơ hoa", "organza blouse", "áo tay bồng", "quyến rũ"],
    sourceImage: "https://huggingface.co/spaces/levihsu/OOTDiffusion/resolve/main/run/examples/garment/049965_1.jpg",
    filename: "blouse-organza-peplum-black.jpg"
  },
  {
    id: "lsoul-tiered-ruffle-blouse-pink",
    sku: "TP-TIERED-RUFFLE-PNK",
    groupCode: "TP-TIERED-RUFFLE",
    name: "Striped Romantic Tiered Ruffle Blouse",
    subtitle: "Áo kiểu tay bèo nhún xếp tầng kẻ sọc tiểu thư Pháp (Hồng phấn)",
    category: "tops",
    type: "blouse",
    gender: "women",
    price: 1590000,
    color: "Hồng phấn",
    colorFamily: "pink",
    colorHex: "#F5D4DE",
    material: "Voan tơ chiffon dệt kẻ sọc chìm mềm rủ",
    fit: "Tiered relaxed fit",
    silhouette: "relaxed",
    lengthClass: "hip-length",
    neckline: "v-neck",
    sleeveLength: "long",
    pattern: "striped",
    season: ["spring", "summer", "autumn"],
    formality: 3, warmth: 2, stretch: 1, coverage: 3,
    colorTemperature: "warm",
    style: ["romantic", "chic", "nữ tính"],
    occasion: ["hẹn hò", "đi làm", "đi cafe"],
    styleKeywords: ["áo bèo nhún", "áo blouse hồng", "tiểu thư", "romantic blouse"],
    sourceImage: "https://huggingface.co/spaces/levihsu/OOTDiffusion/resolve/main/run/examples/garment/049920_1.jpg",
    filename: "blouse-tiered-ruffle-pink.jpg"
  },
  {
    id: "lsoul-floral-offshoulder-crop-red",
    sku: "TP-OFFSHOULDER-SMOCK-RED",
    groupCode: "TP-OFFSHOULDER-SMOCK",
    name: "Floral Smocked Off-Shoulder Sweetheart Crop Top",
    subtitle: "Áo croptop trễ vai nhún chun ngực hoa đỏ quyến rũ tôn xương quai xanh (Đỏ hoa)",
    category: "tops",
    type: "crop-top",
    gender: "women",
    price: 1450000,
    color: "Đỏ hoa",
    colorFamily: "red",
    colorHex: "#A82030",
    material: "Lụa satin dệt in họa tiết hoa nhí",
    fit: "Fitted smocked sweetheart",
    silhouette: "fitted",
    lengthClass: "cropped",
    neckline: "sweetheart",
    sleeveLength: "short",
    pattern: "floral",
    season: ["spring", "summer"],
    formality: 3, warmth: 1, stretch: 4, coverage: 2,
    colorTemperature: "warm",
    style: ["sexy", "romantic", "trendy"],
    occasion: ["hẹn hò", "du lịch", "dạo phố"],
    styleKeywords: ["croptop trễ vai", "áo hoa đỏ", "off shoulder", "sexy crop top"],
    sourceImage: "https://huggingface.co/spaces/levihsu/OOTDiffusion/resolve/main/run/examples/garment/02305_00.jpg",
    filename: "top-offshoulder-smocked-red.jpg"
  },
  {
    id: "lsoul-striped-ribbed-knit-top-navy",
    sku: "TP-STRIPED-KNIT-NVY",
    groupCode: "TP-STRIPED-KNIT",
    name: "Sailor Striped Ribbed Long Sleeve Knit Top",
    subtitle: "Áo len tăm dệt kim cổ tròn kẻ ngang phong cách Parisian Chic thanh lịch (Xanh navy kẻ)",
    category: "tops",
    type: "knit-top",
    gender: "women",
    price: 1390000,
    color: "Xanh navy",
    colorFamily: "navy",
    colorHex: "#1B2A4A",
    material: "Len cotton dệt kim sợi mảnh co giãn cao cấp",
    fit: "Slim fitted silhouette",
    silhouette: "fitted",
    lengthClass: "hip-length",
    neckline: "round",
    sleeveLength: "long",
    pattern: "striped",
    season: ["spring", "autumn", "winter"],
    formality: 3, warmth: 3, stretch: 4, coverage: 4,
    colorTemperature: "cool",
    style: ["chic", "minimal", "công sở"],
    occasion: ["đi làm", "đi cafe", "dạo phố"],
    styleKeywords: ["áo len kẻ", "áo len tăm", "parisian chic", "striped knit"],
    sourceImage: "https://huggingface.co/spaces/levihsu/OOTDiffusion/resolve/main/run/examples/garment/00151_00.jpg",
    filename: "top-striped-knit-navy.jpg"
  },
  {
    id: "lsoul-floral-ruffle-mesh-top-black",
    sku: "TP-FLORAL-HIGHNECK-BLK",
    groupCode: "TP-FLORAL-HIGHNECK",
    name: "Victorian Floral Ruffle High-Neck Top",
    subtitle: "Áo cổ bèo nhún xếp nếp họa tiết hoa nghệ thuật cổ điển quý phái (Đen hoa)",
    category: "tops",
    type: "knit-top",
    gender: "women",
    price: 1490000,
    color: "Đen",
    colorFamily: "black",
    colorHex: "#1A1A1A",
    material: "Lưới thun mesh dập hoa nhung cao cấp",
    fit: "Slim mock neck fit",
    silhouette: "fitted",
    lengthClass: "hip-length",
    neckline: "round",
    sleeveLength: "long",
    pattern: "floral",
    season: ["spring", "autumn", "winter"],
    formality: 4, warmth: 2, stretch: 3, coverage: 4,
    colorTemperature: "neutral",
    style: ["edgy", "chic", "statement"],
    occasion: ["đi tiệc", "hẹn hò", "sự kiện"],
    styleKeywords: ["áo cổ lọ hoa", "áo mesh", "victorian top", "áo họa tiết cổ bèo"],
    sourceImage: "https://huggingface.co/spaces/levihsu/OOTDiffusion/resolve/main/run/examples/garment/00470_00.jpg",
    filename: "top-floral-highneck-black.jpg"
  },
  {
    id: "lsoul-ribbed-button-camisole-yellow",
    sku: "TP-CAMI-BUTTON-YEL",
    groupCode: "TP-CAMI-BUTTON",
    name: "Ribbed Button-Front Sweetheart Camisole Top",
    subtitle: "Áo hai dây thun tăm cúp ngực ngọt ngào đính cúc bấm sành điệu (Vàng pastel)",
    category: "tops",
    type: "crop-top",
    gender: "women",
    price: 1190000,
    color: "Vàng pastel",
    colorFamily: "beige",
    colorHex: "#F2E49B",
    material: "Thun len gân modal co giãn 4 chiều mịn mát",
    fit: "Fitted camisole",
    silhouette: "fitted",
    lengthClass: "cropped",
    neckline: "sweetheart",
    sleeveLength: "sleeveless",
    pattern: "solid",
    season: ["spring", "summer"],
    formality: 2, warmth: 1, stretch: 4, coverage: 2,
    colorTemperature: "warm",
    style: ["trendy", "chic", "sexy"],
    occasion: ["dạo phố", "đi cafe", "du lịch"],
    styleKeywords: ["áo hai dây", "camisole", "áo thun gân", "croptop vàng"],
    sourceImage: "https://huggingface.co/spaces/levihsu/OOTDiffusion/resolve/main/run/examples/garment/02015_00.jpg",
    filename: "top-cami-button-yellow.jpg"
  },

  // --- BOTTOMS ---
  {
    id: "lsoul-paisley-wide-leg-trousers-red",
    sku: "PT-PAISLEY-WIDE-RED",
    groupCode: "PT-PAISLEY-WIDE",
    name: "Bohemian Paisley Silk Wide-Leg Palazzo Pants",
    subtitle: "Quần lụa cạp cao ống suông họa tiết paisley thời thượng nổi bật (Đỏ họa tiết)",
    category: "bottoms",
    type: "trousers",
    gender: "women",
    price: 1950000,
    color: "Đỏ",
    colorFamily: "red",
    colorHex: "#9B2C3B",
    material: "Lụa gấm cát dệt rủ cao cấp chống nhăn",
    fit: "High-waist wide-leg palazzo",
    silhouette: "relaxed",
    lengthClass: "maxi",
    pattern: "paisley",
    waistRise: "high",
    season: ["spring", "summer", "autumn"],
    formality: 4, warmth: 2, stretch: 1, coverage: 5,
    colorTemperature: "warm",
    style: ["statement", "chic", "glam"],
    occasion: ["đi tiệc", "sự kiện", "du lịch"],
    styleKeywords: ["quần ống rộng", "quần lụa hoa", "palazzo", "paisley pants", "sang chảnh"],
    sourceImage: "https://huggingface.co/spaces/levihsu/OOTDiffusion/resolve/main/run/examples/garment/051473_1.jpg",
    filename: "pants-paisley-wide-red.jpg"
  },
  {
    id: "lsoul-floral-bell-bottom-trousers-white",
    sku: "PT-FLORAL-BELL-WHT",
    groupCode: "PT-FLORAL-BELL",
    name: "Monochrome Floral Mid-Rise Flare Bell Trousers",
    subtitle: "Quần loe cạp vừa họa tiết hoa đơn sắc tôn trọn đường cong đôi chân (Trắng hoa)",
    category: "bottoms",
    type: "flare-pants",
    gender: "women",
    price: 1890000,
    color: "Trắng",
    colorFamily: "white",
    colorHex: "#F5F5F5",
    material: "Vải thun dệt tuyết mưa co giãn tôn dáng ôm đùi loe gấu",
    fit: "Mid-rise bell bottom flare",
    silhouette: "fitted",
    lengthClass: "maxi",
    pattern: "floral",
    waistRise: "mid",
    season: ["spring", "summer", "autumn"],
    formality: 3, warmth: 2, stretch: 4, coverage: 5,
    colorTemperature: "neutral",
    style: ["trendy", "chic", "sexy"],
    occasion: ["dạo phố", "đi tiệc", "hẹn hò"],
    styleKeywords: ["quần loe hoa", "flare pants", "quần ống loe trắng", "tôn dáng"],
    sourceImage: "https://huggingface.co/spaces/levihsu/OOTDiffusion/resolve/main/run/examples/garment/051517_1.jpg",
    filename: "pants-floral-bell-white.jpg"
  },
  {
    id: "lsoul-patchwork-denim-jeans-blue",
    sku: "PT-PATCH-DENIM-BLU",
    groupCode: "PT-PATCH-DENIM",
    name: "Y2K Distressed Patchwork Wide-Leg Denim Jeans",
    subtitle: "Quần jeans ống rộng chắp vá mảng màu wash bạc phong cách street style (Xanh denim)",
    category: "bottoms",
    type: "jeans",
    gender: "women",
    price: 1990000,
    color: "Xanh denim",
    colorFamily: "blue",
    colorHex: "#5D7B93",
    material: "Denim cotton 100% xử lý stonewash và wash rách thủ công",
    fit: "Low-rise wide baggy jeans",
    silhouette: "relaxed",
    lengthClass: "maxi",
    pattern: "solid",
    waistRise: "low",
    season: ["spring", "summer", "autumn", "winter"],
    formality: 2, warmth: 3, stretch: 1, coverage: 5,
    colorTemperature: "cool",
    style: ["edgy", "trendy", "chic"],
    occasion: ["dạo phố", "đi cafe", "du lịch"],
    styleKeywords: ["quần bò chắp vá", "jeans ống rộng", "patchwork denim", "y2k jeans"],
    sourceImage: "https://huggingface.co/spaces/levihsu/OOTDiffusion/resolve/main/run/examples/garment/051827_1.jpg",
    filename: "pants-patchwork-denim-blue.jpg"
  },

  // --- DRESSES ---
  {
    id: "lsoul-emerald-silk-slip-dress-green",
    sku: "DR-EMERALD-SLIP-GRN",
    groupCode: "DR-EMERALD-SLIP",
    name: "Emerald Silk Cowl-Neck Bias-Cut Midi Dress",
    subtitle: "Đầm lụa hai dây cổ đổ dáng midi xẻ tà quyến rũ màu ngọc lục bảo (Xanh ngọc)",
    category: "dress",
    type: "midi-dress",
    gender: "women",
    price: 2350000,
    color: "Xanh ngọc",
    colorFamily: "green",
    colorHex: "#238971",
    material: "Lụa satin tơ tằm dệt bóng mượt cắt xéo thớ bias-cut",
    fit: "Bias-cut cowl neck drape",
    silhouette: "column",
    lengthClass: "midi",
    neckline: "round",
    sleeveLength: "sleeveless",
    pattern: "solid",
    season: ["spring", "summer", "autumn"],
    formality: 5, warmth: 2, stretch: 2, coverage: 3,
    colorTemperature: "cool",
    style: ["glam", "sexy", "chic"],
    occasion: ["đi tiệc", "hẹn hò", "sự kiện"],
    styleKeywords: ["đầm lụa cổ đổ", "váy lụa xanh", "slip dress", "đầm dạ hội", "quyến rũ"],
    sourceImage: "https://huggingface.co/spaces/levihsu/OOTDiffusion/resolve/main/run/examples/garment/053744_1.jpg",
    filename: "dress-emerald-slip-green.jpg"
  },
  {
    id: "lsoul-noir-column-evening-dress-black",
    sku: "DR-NOIR-COLUMN-BLK",
    groupCode: "DR-NOIR-COLUMN",
    name: "Noir Column Cutout Backless Evening Dress",
    subtitle: "Đầm dạ hội suông dài cổ yếm hở lưng tôn trọn đường cong nữ thần (Đen tuyền)",
    category: "dress",
    type: "maxi-dress",
    gender: "women",
    price: 2650000,
    color: "Đen",
    colorFamily: "black",
    colorHex: "#101010",
    material: "Vải crepe lụa cao cấp 2 lớp chống nhăn",
    fit: "Backless column silhouette",
    silhouette: "column",
    lengthClass: "maxi",
    neckline: "halter",
    sleeveLength: "sleeveless",
    pattern: "solid",
    season: ["spring", "summer", "autumn", "winter"],
    formality: 5, warmth: 2, stretch: 2, coverage: 4,
    colorTemperature: "neutral",
    style: ["glam", "statement", "chic"],
    occasion: ["sự kiện", "đi tiệc", "hẹn hò"],
    styleKeywords: ["đầm dạ hội đen", "váy đen dài", "maxi dress", "đầm hở lưng", "sang trọng"],
    sourceImage: "https://huggingface.co/spaces/levihsu/OOTDiffusion/resolve/main/run/examples/garment/053790_1.jpg",
    filename: "dress-noir-column-black.jpg"
  },
  {
    id: "lsoul-rose-draped-halter-dress-pink",
    sku: "DR-ROSE-DRAPED-PNK",
    groupCode: "DR-ROSE-DRAPED",
    name: "Dusty Rose Draped Halter Cocktail Dress",
    subtitle: "Đầm cocktail cổ yếm xếp nếp nhún eo thanh lịch kiêu kỳ (Hồng đất)",
    category: "dress",
    type: "midi-dress",
    gender: "women",
    price: 2450000,
    color: "Hồng đất",
    colorFamily: "pink",
    colorHex: "#B88E8D",
    material: "Chiffon tơ lụa mềm xếp lớp draped thủ công",
    fit: "Draped halter silhouette",
    silhouette: "a-line",
    lengthClass: "midi",
    neckline: "halter",
    sleeveLength: "sleeveless",
    pattern: "solid",
    season: ["spring", "summer", "autumn"],
    formality: 5, warmth: 2, stretch: 2, coverage: 4,
    colorTemperature: "warm",
    style: ["romantic", "chic", "elegant"],
    occasion: ["đi tiệc", "hẹn hò", "tiệc cưới"],
    styleKeywords: ["đầm hồng đất", "váy xếp nếp", "halter dress", "đầm tiệc cưới", "tiểu thư"],
    sourceImage: "https://huggingface.co/spaces/levihsu/OOTDiffusion/resolve/main/run/examples/garment/053742_1.jpg",
    filename: "dress-rose-draped-pink.jpg"
  }
];

// Hàm upload 1 ảnh lên Cloudinary từ remote URL
async function uploadToCloudinary(sourceUrl, filename) {
  const baseName = filename.replace(/\.[^/.]+$/, "");
  const publicId = `${folder}/${baseName}`;

  const formData = new FormData();
  formData.append("file", sourceUrl);
  formData.append("public_id", publicId);
  formData.append("overwrite", "true");

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}` },
    body: formData
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url) {
    throw new Error(`Upload lỗi HTTP ${res.status}: ${data.error?.message || res.statusText}`);
  }
  return data.secure_url;
}

// Lưu file ảnh về thư mục public/products để chạy local offline
async function downloadToLocal(sourceUrl, filename) {
  const destPath = path.join(process.cwd(), "public", "products", filename);
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Download HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  return destPath;
}

async function main() {
  console.log(`=== BẮT ĐẦU UPLOAD & SEED ${NEW_PRODUCTS.length} SẢN PHẨM MỚI LÊN CLOUDINARY & LSOULT.VERCEL.APP ===\n`);

  // Bước 1: Upload toàn bộ ảnh lên Cloudinary và lưu local
  const uploadedMap = new Map();
  for (let i = 0; i < NEW_PRODUCTS.length; i++) {
    const p = NEW_PRODUCTS[i];
    console.log(`[${i+1}/${NEW_PRODUCTS.length}] Uploading ${p.filename} to Cloudinary...`);
    try {
      // 1. Cloudinary
      const cloudUrl = await uploadToCloudinary(p.sourceImage, p.filename);
      uploadedMap.set(p.id, cloudUrl);
      console.log(`   -> Cloudinary OK: ${cloudUrl}`);

      // 2. Local public/products
      await downloadToLocal(p.sourceImage, p.filename);
      console.log(`   -> Saved to public/products/${p.filename}`);
    } catch (err) {
      console.error(`   -> FAILED: ${err.message}`);
    }
  }

  // Bước 2: Đăng nhập admin trên https://lsoult.vercel.app
  console.log("\n=== ĐĂNG NHẬP ADMIN TRÊN HTTPS://LSOULT.VERCEL.APP ===");
  const loginRes = await fetch("https://lsoult.vercel.app/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@lsoul.local", password: "Admin@123456" })
  });

  if (!loginRes.ok) {
    throw new Error(`Đăng nhập thất bại: HTTP ${loginRes.status}`);
  }
  const cookie = loginRes.headers.get("set-cookie");
  console.log("Đăng nhập admin thành công! Đã lấy được session cookie.");

  // Bước 3: Tạo từng sản phẩm trên live site https://lsoult.vercel.app
  console.log("\n=== SEED SẢN PHẨM MỚI VÀO DATABASE LIVE QUA API ===");
  let seededCount = 0;
  for (let i = 0; i < NEW_PRODUCTS.length; i++) {
    const raw = NEW_PRODUCTS[i];
    const cloudUrl = uploadedMap.get(raw.id) || `https://res.cloudinary.com/${cloudName}/image/upload/${folder}/${raw.filename}`;

    const tryOnCat = raw.category === "dress" ? "one-pieces" : raw.category === "bottoms" ? "bottoms" : "tops";

    const productPayload = {
      id: raw.id,
      sku: raw.sku,
      groupCode: raw.groupCode,
      name: raw.name,
      subtitle: raw.subtitle,
      category: raw.category,
      type: raw.type,
      gender: raw.gender,
      price: raw.price,
      color: raw.color,
      colorFamily: raw.colorFamily,
      colorHex: raw.colorHex,
      sizes: ["S", "M", "L", "XL"],
      stock: 48,
      stockTracked: false,
      image: cloudUrl,
      hoverImage: cloudUrl,
      tryOnImage: cloudUrl,
      images: [cloudUrl],
      material: raw.material,
      fit: raw.fit,
      silhouette: raw.silhouette,
      lengthClass: raw.lengthClass,
      neckline: raw.neckline,
      sleeveLength: raw.sleeveLength,
      pattern: raw.pattern,
      season: raw.season,
      formality: raw.formality,
      warmth: raw.warmth,
      stretch: raw.stretch,
      coverage: raw.coverage,
      colorTemperature: raw.colorTemperature,
      waistRise: raw.waistRise || (raw.category === "bottoms" ? "high" : "not-applicable"),
      tryOnCategory: tryOnCat,
      tryOnPhotoType: "flat-lay",
      style: raw.style,
      occasion: raw.occasion,
      styleKeywords: raw.styleKeywords,
      pairingTags: [...raw.style, raw.category, raw.type, raw.color],
      avoidPairingTags: [],
      visualWeight: raw.formality,
      volume: raw.silhouette === "relaxed" ? "voluminous" : raw.silhouette === "fitted" ? "fitted" : "balanced",
      featured: i < 4,
      isNew: true,
      active: true,
      analyzerReady: true,
      sourceType: "retailer-corroborated"
    };

    try {
      const createRes = await fetch("https://lsoult.vercel.app/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie
        },
        body: JSON.stringify(productPayload)
      });

      const resData = await createRes.json().catch(() => ({}));
      if (createRes.ok && resData.saved) {
        seededCount++;
        console.log(`[${i+1}/${NEW_PRODUCTS.length}] SEED LIVE OK: ${raw.sku} - ${raw.name}`);
      } else {
        console.error(`[${i+1}/${NEW_PRODUCTS.length}] SEED LIVE FAIL: ${raw.sku} (${createRes.status}):`, resData.error || resData);
      }
    } catch (err) {
      console.error(`[${i+1}/${NEW_PRODUCTS.length}] SEED LIVE ERROR: ${raw.sku}:`, err.message);
    }
  }

  console.log(`\n=== ĐÃ SEED THÀNH CÔNG ${seededCount}/${NEW_PRODUCTS.length} SẢN PHẨM LÊN HTTPS://LSOULT.VERCEL.APP! ===`);

  // Bước 4: Kiểm tra lại tổng số sản phẩm trên live storefront
  const verifyRes = await fetch("https://lsoult.vercel.app/api/store/bootstrap");
  const verifyData = await verifyRes.json();
  console.log(`Storefront hiện có: ${verifyData.products?.length} sản phẩm hoạt động!`);
}

if (process.argv[1] && (process.argv[1].endsWith("upload-new-drop.mjs") || process.argv[1].includes("upload-new-drop"))) {
  main().catch(console.error);
}

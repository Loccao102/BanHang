import { Product, storefrontCategory, products as seedProducts } from "./products";
import { semanticTextScore } from "./server/product-semantic-profile";

export type OutfitSetType = "top_bottom" | "top_pants" | "top_skirt" | "dress_layer" | "coord_set" | "all";

export type OutfitItemRole = "top" | "bottom" | "dress" | "outerwear" | "set";

export type CoordinatedOutfit = {
  id: string;
  title: string;
  setType: "top_bottom" | "dress_layer" | "coord_set";
  setTypeName: string;
  score: number;
  matchBadge: string;
  reason: string;
  stylingTip: string;
  items: Array<{
    product: Product;
    role: OutfitItemRole;
    roleName: string;
    selectedSize: string;
    availableSizes: string[];
  }>;
  totalPrice: number;
  originalPrice?: number;
  savings?: number;
};

// The same core outfit should not be suggested again until fresh options run out.
// Ignore optional outerwear so an old top + bottom pair does not appear "new" with a jacket.
export function outfitSelectionKey(
  items: ReadonlyArray<{ product: Pick<Product, "id">; role: OutfitItemRole }>
): string {
  return items
    .filter((item) => item.role !== "outerwear")
    .map((item) => `${item.role}:${item.product.id}`)
    .sort()
    .join("|");
}

// Color Harmony Pairings
const harmoniousColorMap: Record<string, string[]> = {
  black: ["black", "white", "beige", "blue", "gray", "red", "brown"],
  white: ["black", "white", "navy", "blue", "beige", "pink", "gray", "green"],
  beige: ["black", "white", "beige", "brown", "navy", "blue"],
  navy: ["white", "beige", "gray", "blue", "black"],
  blue: ["black", "white", "beige", "gray", "blue"],
  brown: ["black", "white", "beige", "brown"],
  red: ["black", "white", "beige"],
  gray: ["black", "white", "navy", "blue", "pink"],
  pink: ["white", "black", "gray", "beige"],
  green: ["white", "black", "beige"]
};

function evaluateColorScore(a: Product, b: Product): number {
  if (a.colorFamily === b.colorFamily) {
    // Monochromatic / Tone-sur-tone
    if (a.colorFamily === "black") return 32; // Signature LSOUL dark chic
    if (a.colorFamily === "white") return 30;
    if (a.colorFamily === "beige") return 28;
    return 26;
  }

  const allowed = harmoniousColorMap[a.colorFamily] || [];
  if (allowed.includes(b.colorFamily)) {
    // Premium contrasting pairs
    const pair = `${a.colorFamily}:${b.colorFamily}`;
    if (pair === "black:white" || pair === "white:black") return 32;
    if (pair === "black:beige" || pair === "beige:black") return 30;
    if (pair === "white:navy" || pair === "navy:white") return 30;
    if (pair === "black:blue" || pair === "blue:black") return 28;
    if (pair === "beige:brown" || pair === "brown:beige") return 29;
    return 25;
  }

  // Clashing penalty
  return 10;
}

function evaluateSilhouette(top: Product, bottom: Product): number {
  const topFitted = ["corset", "crop-top", "bodysuit"].includes(top.type) || top.volume === "fitted";
  const bottomFlaredOrLoose = ["skirt", "flare-pants", "trousers"].includes(bottom.type) || bottom.volume === "voluminous" || bottom.volume === "balanced";

  // Golden ratio: Fitted top + Flared/A-line bottom
  if (topFitted && bottomFlaredOrLoose) return 28;

  const topOversized = ["blazer", "shirt", "jacket"].includes(top.type);
  const bottomShort = ["shorts", "skirt"].includes(bottom.type) || bottom.lengthClass === "mini";

  // Modern chic: Structured / Oversized top + Mini bottom
  if (topOversized && bottomShort) return 26;

  // Balanced
  return 20;
}

function evaluateFormality(a: Product, b: Product): number {
  const formA = a.formality ?? 2;
  const formB = b.formality ?? 2;
  const diff = Math.abs(formA - formB);

  if (diff === 0) return 25;
  if (diff === 1) return 20;
  if (diff === 2) return 8;
  return -20; // Penalty for clashing formality
}

function evaluateSharedTags(a: Product, b: Product): number {
  let score = 0;
  // Shared styles
  const commonStyles = (a.style || []).filter((s) => (b.style || []).includes(s));
  score += commonStyles.length * 10;

  // Shared occasions
  const commonOccasions = (a.occasion || []).filter((o) => (b.occasion || []).includes(o));
  score += commonOccasions.length * 8;

  // Specific pairing tags check
  if (a.pairingTags?.includes(b.type) || b.pairingTags?.includes(a.type)) {
    score += 15;
  }
  if (a.avoidPairingTags?.includes(b.type) || b.avoidPairingTags?.includes(a.type)) {
    score -= 40;
  }

  return score;
}

function getFirstAvailableSize(product: Product): string {
  const inStockVariant = product.variants?.find((v) => v.stock > 0);
  if (inStockVariant) return inStockVariant.size;
  if (Array.isArray(product.sizes) && product.sizes.length > 0) return product.sizes[0];
  return "S";
}

function getAvailableSizes(product: Product): string[] {
  if (product.variants && product.variants.length > 0) {
    const valid = product.variants.filter((v) => v.stock > 0).map((v) => v.size);
    if (valid.length > 0) return valid;
  }
  return Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : ["S", "M", "L"];
}

function normalizeSearchValue(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function matchesOccasion(product: Product, requested: string) {
  if (requested === "all") return true;
  const values = (product.occasion || []).map(normalizeSearchValue);

  if (requested === "party") {
    return values.some((value) => /(tiec|su kien|party|bar|club|clubbing|da hoi|gala|event)/.test(value));
  }
  if (requested === "date") {
    return values.some((value) => /(hen ho|date)/.test(value));
  }
  if (requested === "work") {
    return values.some((value) => /(di lam|cong so|work|office)/.test(value));
  }
  if (requested === "casual") {
    return values.some((value) => /(di choi|cafe|casual|dao pho)/.test(value));
  }
  return values.some((value) => value.includes(normalizeSearchValue(requested)));
}

function matchesStyle(product: Product, requested: string) {
  if (requested === "all") return true;
  const target = normalizeSearchValue(requested);
  if ((product.style || []).some((value) => normalizeSearchValue(value).includes(target))) return true;
  if ((product.styleKeywords || []).some((value) => normalizeSearchValue(value).includes(target))) return true;
  return semanticTextScore(product, requested) > 0;
}

function evaluateOccasionPreference(product: Product, requested: string) {
  if (requested === "all") return 0;
  if (!matchesOccasion(product, requested)) return -24;

  const formality = product.formality ?? 3;
  const visualWeight = product.visualWeight ?? 3;
  const coverage = product.coverage ?? 3;

  if (requested === "party") {
    // Evening / gala refinements should favor dressier, higher-impact pieces.
    return 8 + formality * 3 + visualWeight;
  }
  if (requested === "date") {
    return 10 + Math.max(0, 8 - Math.abs(formality - 4) * 2);
  }
  if (requested === "work") {
    return 10 + Math.max(0, 8 - Math.abs(formality - 4) * 3) + Math.max(0, coverage - 2);
  }
  if (requested === "casual") {
    return 10 + Math.max(0, 7 - formality);
  }
  if (requested === "concert") {
    return 9 + visualWeight * 2;
  }
  return 8;
}

function isCorsetOrBodysuitOrCutout(product: Product): boolean {
  if (product.type === "corset" || product.type === "bodysuit") return true;
  const searchable = `${product.name} ${product.subtitle} ${product.fit || ""} ${product.neckline || ""} ${(product.styleKeywords || []).join(" ")}`.toLowerCase();
  return /corset|bodysuit|cut-?out|khoét|cắt xẻ|siết eo|gọng định hình|lace-?up|hở lưng|hở eo|xẻ tà|cutout/.test(searchable);
}

function isTubeTop(product: Product): boolean {
  if (product.type === "corset" || product.type === "bodysuit") return false;
  const searchable = `${product.name} ${product.subtitle} ${product.fit || ""}`.toLowerCase();
  return /tube|áo quây|quây ngực|strapless tube/.test(searchable);
}

function evaluateStylePreference(product: Product, requested: string) {
  if (requested === "all") return 0;
  const target = normalizeSearchValue(requested);
  let score = 0;
  if ((product.style || []).some((value) => normalizeSearchValue(value).includes(target))) score += 10;
  if ((product.styleKeywords || []).some((value) => normalizeSearchValue(value).includes(target))) score += 6;
  score += Math.min(12, semanticTextScore(product, requested) * 2);

  const isSexyStyle = /(?:sexy|goi cam|quyen ru|boc lua|nong bong)/.test(target);
  if (isSexyStyle) {
    if (isCorsetOrBodysuitOrCutout(product)) {
      score += 24; // Ưu tiên mạnh các thiết kế corset/bodysuit/cut-out khi khách yêu cầu sexy
    } else if (isTubeTop(product)) {
      score -= 8; // Giảm ưu tiên tube top cơ bản khi có lựa chọn sexy sắc sảo hơn
    }
  }

  return score;
}

// Keep stylist comments grounded in the actual garments rather than a universal
// "tôn dáng / quyến rũ" sales pitch. This is lightweight, deterministic copy;
 // no LLM call (and no additional latency) is needed for the styling room.
function topDescription(top: Product): string {
  switch (top.type) {
    case "corset":
      return "thiết kế corset tạo điểm nhấn có cấu trúc cho phần thân trên";
    case "crop-top":
      return "áo crop-top mang lại tỷ lệ trẻ trung, gọn gàng";
    case "bodysuit":
      return "bodysuit giữ đường nét phần áo gọn gàng";
    case "shirt":
      return top.volume === "voluminous"
        ? "sơ mi dáng rộng tạo cảm giác thoải mái, phóng khoáng"
        : "sơ mi mang đến đường nét chỉn chu";
    case "blouse":
      return "áo blouse đem lại cảm giác nhẹ nhàng";
    case "knit-top":
      return "áo dệt kim làm tổng thể mềm mại hơn";
    default:
      return "thiết kế phần áo tạo điểm nhấn cho tổng thể";
  }
}

function bottomDescription(bottom: Product): string {
  switch (bottom.type) {
    case "skirt":
      if (bottom.lengthClass === "mini") return "chân váy ngắn giữ vẻ trẻ trung, năng động";
      if (bottom.lengthClass === "midi") return "chân váy midi tạo nét thanh lịch";
      if (bottom.lengthClass === "maxi") return "chân váy dài tạo cảm giác mềm mại, thướt tha";
      return "chân váy tạo điểm nhấn riêng cho phần dưới";
    case "trousers":
      return "quần âu giữ tổng thể gọn và chỉn chu";
    case "flare-pants":
      return "quần ống loe tạo đường nét nổi bật ở phần dưới";
    case "jeans":
      return "quần jeans mang lại sắc thái gần gũi, linh hoạt";
    case "shorts":
      return "quần short làm set đồ gọn nhẹ, năng động";
    default:
      return "phần dưới cân bằng tổng thể trang phục";
  }
}

function pairingColorDescription(a: Product, b: Product): string {
  const colors = new Set([a.colorFamily, b.colorFamily]);
  if (colors.size === 1) {
    return "Hai món cùng nhóm màu nên tổng thể có sự đồng điệu.";
  }
  if (colors.has("black") && colors.has("white")) {
    return "Cặp màu đen – trắng tạo tương phản rõ ràng và dễ ứng dụng.";
  }
  if ((harmoniousColorMap[a.colorFamily] || []).includes(b.colorFamily)) {
    return `Màu ${a.color} đi cùng ${b.color} tạo sự hài hòa, không quá nhiều chi tiết.`;
  }
  return `Hai sắc ${a.color} và ${b.color} tạo tương phản nổi bật.`;
}

function accessoryAdvice(occasion: string, style: string, bottomType?: Product["type"]): string {
  if (occasion === "work") {
    return "Đi làm có thể phối cùng loafer hoặc giày bệt và túi dáng đứng.";
  }
  if (occasion === "casual") {
    return "Dạo phố có thể thêm sneaker hoặc sandal và một chiếc túi đeo chéo.";
  }
  if (occasion === "party") {
    return "Đi tiệc, thử giày có chi tiết ánh kim và một món trang sức làm điểm nhấn.";
  }
  if (occasion === "date") {
    return "Đi hẹn hò, chọn túi nhỏ và đôi giày thoải mái để tổng thể không quá cầu kỳ.";
  }
  if (style === "minimal") {
    return "Ưu tiên giày và túi màu trung tính để giữ bảng màu gọn gàng.";
  }
  if (style === "y2k" || style === "bold") {
    return "Thử túi đeo vai nhỏ và phụ kiện kim loại nếu muốn thêm nét cá tính.";
  }
  if (style === "glam") {
    return "Một đôi giày có điểm nhấn và túi nhỏ sẽ hợp với tinh thần glam.";
  }
  return bottomType === "skirt"
    ? "Có thể thử loafer cho vẻ preppy hoặc boots để set cá tính hơn."
    : "Thử sneaker cho ngày thường hoặc loafer để set trông chỉn chu hơn.";
}

// Generate a concise Vietnamese explanation from actual product metadata.
function generateStylistReview(
  setType: "top_bottom" | "dress_layer" | "coord_set",
  items: Product[],
  occasion: string,
  style: string
): { title: string; reason: string; stylingTip: string } {
  if (setType === "top_bottom") {
    const top = items.find((item) => item.category === "tops") || items[0];
    const bottom = items.find((item) => item.category === "bottoms") || items[1];
    const outer = items.find((item) => item.category === "outerwear");
    const isSkirt = bottom.type === "skirt";

    const title = outer
      ? `Phối Layer: Áo + ${isSkirt ? "Chân Váy" : "Quần"} + Áo Khoác`
      : top.type === "corset"
      ? `Corset + ${isSkirt ? "Chân Váy" : "Quần"}`
      : top.type === "shirt"
      ? `Sơ Mi + ${isSkirt ? "Chân Váy" : "Quần"}`
      : `Gợi Ý Phối Áo + ${isSkirt ? "Chân Váy" : "Quần"}`;

    const silhouetteDetail = (top.volume === "voluminous" && bottom.volume === "fitted")
      ? "Dáng áo rộng và phần dưới gọn tạo sự cân bằng về phom."
      : (top.volume === "fitted" && bottom.volume === "voluminous")
      ? "Phần áo gọn kết hợp với phần dưới rộng tạo tương phản về phom."
      : "";
    const reason = [
      `${top.name} có ${topDescription(top)}, kết hợp với ${bottom.name} – ${bottomDescription(bottom)}.`,
      pairingColorDescription(top, bottom),
      silhouetteDetail,
      outer ? `Thêm ${outer.name} như một lớp khoác ngoài khi cần.` : ""
    ].filter(Boolean).join(" ");

    return { title, reason, stylingTip: accessoryAdvice(occasion, style, bottom.type) };
  }

  if (setType === "dress_layer") {
    const dress = items.find((item) => item.category === "dress") || items[0];
    const outer = items.find((item) => item.category === "outerwear");
    const length = dress.type === "mini-dress" ? "ngắn"
      : dress.type === "midi-dress" ? "midi"
      : dress.type === "maxi-dress" ? "dài"
      : dress.type === "bodycon-dress" ? "ôm"
      : "";
    const shapePhrase = length ? ` dáng ${length}` : "";
    const reason = [
      `${dress.name} là mẫu đầm${shapePhrase} màu ${dress.color}, có thể mặc như một bộ trang phục hoàn chỉnh.`,
      outer
        ? `Kết hợp với ${outer.name} để thêm một lớp khoác. ${pairingColorDescription(dress, outer)}`
        : "Không cần thêm nhiều lớp áo để hoàn thiện set này."
    ].join(" ");
    return {
      title: outer ? "Đầm Liền + Áo Khoác" : "Gợi Ý Đầm Liền",
      reason,
      stylingTip: accessoryAdvice(occasion, style)
    };
  }

  const set = items.find((item) => item.category === "set") || items[0];
  const outer = items.find((item) => item.category === "outerwear");
  const reason = [
    `${set.name} là set đồng bộ màu ${set.color}, giúp phối nhanh mà không cần chọn áo và phần dưới riêng lẻ.`,
    outer ? `Khoác thêm ${outer.name} nếu muốn có thêm một lớp áo.` : ""
  ].filter(Boolean).join(" ");
  return {
    title: outer ? "Set Đồng Bộ + Áo Khoác" : "Set Trang Phục Đồng Bộ",
    reason,
    stylingTip: accessoryAdvice(occasion, style)
  };
}

export type GenerateOutfitOptions = {
  catalog?: Product[];
  setType?: OutfitSetType;
  occasion?: string;
  style?: string;
  budget?: number;
  preferredTopColor?: Product["colorFamily"];
  preferredBottomColor?: Product["colorFamily"];
  preferredDressColor?: Product["colorFamily"];
  preferredTopTypes?: Product["type"][];
  preferredBottomTypes?: Product["type"][];
  preferredDressTypes?: Product["type"][];
  preferredTopLength?: string;
  preferredBottomLength?: string;
  preferredDressLength?: string;
  minTopCoverage?: number;
  minBottomCoverage?: number;
  minDressCoverage?: number;
  minSetCoverage?: number;
  fixedTopProductId?: string;
  fixedBottomProductId?: string;
  fixedDressProductId?: string;
  fixedOuterwearProductId?: string;
  fixedSetProductId?: string;
  requiredProductId?: string;
  excludeIds?: string[];
  excludeOutfitKeys?: string[];
  variantSalt?: number;
  /**
   * Chỉ thêm lớp áo khoác ngoài khi người dùng YÊU CẦU rõ ràng.
   * Mặc định false: khách chọn "áo + quần" thì set chỉ gồm đúng 2 món.
   */
  includeOuterwear?: boolean;
};

export function coordinateSmartOutfit(options?: GenerateOutfitOptions): CoordinatedOutfit {
  const pool = (options?.catalog && options.catalog.length > 0) ? options.catalog : seedProducts;
  const activePool = pool.filter((p) => p.active !== false && p.stock > 0);

  const setTypeChoice: OutfitSetType = options?.setType || "all";
  const occasionChoice = options?.occasion || "all";
  const styleChoice = options?.style || "all";
  const excludeSet = new Set(options?.excludeIds || []);
  const seenOutfits = new Set(options?.excludeOutfitKeys || []);
  const salt = (options?.variantSalt ?? 0) % 9973;

  // Filter candidate pools
  const tops = activePool.filter((p) => p.category === "tops" && !excludeSet.has(p.id));
  const requestedBottomKind = setTypeChoice === "top_pants"
    ? "pants"
    : setTypeChoice === "top_skirt"
    ? "skirts"
    : undefined;
  const bottoms = activePool.filter((p) =>
    p.category === "bottoms" &&
    !excludeSet.has(p.id) &&
    (!requestedBottomKind || storefrontCategory(p) === requestedBottomKind)
  );
  const dresses = activePool.filter((p) => p.category === "dress" && !excludeSet.has(p.id));
  const sets = activePool.filter((p) => p.category === "set" && !excludeSet.has(p.id));
  const outerwears = activePool.filter((p) => p.category === "outerwear" && !excludeSet.has(p.id));

  // Determine actual set architecture to generate
  let chosenType: "top_bottom" | "dress_layer" | "coord_set" = "top_bottom";
  if (setTypeChoice === "top_bottom" || setTypeChoice === "top_pants" || setTypeChoice === "top_skirt") {
    chosenType = "top_bottom";
  } else if (setTypeChoice === "dress_layer") {
    chosenType = "dress_layer";
  } else if (setTypeChoice === "coord_set") {
    chosenType = "coord_set";
  } else {
    // "all": Rotate smartly among types based on salt and availability
    const availableTypes: ("top_bottom" | "dress_layer" | "coord_set")[] = [];
    if (tops.length > 0 && bottoms.length > 0) availableTypes.push("top_bottom");
    if (dresses.length > 0) availableTypes.push("dress_layer");
    if (sets.length > 0) availableTypes.push("coord_set");
    chosenType = availableTypes[salt % (availableTypes.length || 1)] || "top_bottom";
  }

  // Explicit/fixed product handling. Fixed role IDs are used when refining a previous outfit.
  if (options?.fixedTopProductId || options?.fixedBottomProductId) {
    chosenType = "top_bottom";
  } else if (options?.fixedDressProductId) {
    chosenType = "dress_layer";
  } else if (options?.fixedSetProductId) {
    chosenType = "coord_set";
  } else if (options?.requiredProductId) {
    const req = activePool.find((p) => p.id === options.requiredProductId);
    if (req) {
      if (req.category === "tops" || req.category === "bottoms") chosenType = "top_bottom";
      else if (req.category === "dress") chosenType = "dress_layer";
      else if (req.category === "set") chosenType = "coord_set";
    }
  }

  let finalItems: { product: Product; role: OutfitItemRole; roleName: string }[] = [];
  let finalScore = 95;

  if (chosenType === "top_bottom") {
    const requiredProduct = options?.requiredProductId
      ? activePool.find((p) => p.id === options.requiredProductId)
      : undefined;

    let targetTop: Product | undefined = options?.fixedTopProductId
      ? activePool.find((p) => p.id === options.fixedTopProductId && p.category === "tops")
      : undefined;
    let targetBottom: Product | undefined = options?.fixedBottomProductId
      ? activePool.find((p) => p.id === options.fixedBottomProductId && p.category === "bottoms")
      : undefined;

    if (!targetTop && requiredProduct?.category === "tops") targetTop = requiredProduct;
    if (!targetBottom && requiredProduct?.category === "bottoms") targetBottom = requiredProduct;

    // Explicit color/type/length constraints are hard. Occasion/style are soft ranking preferences.
    const filterFn = (p: Product) => matchesOccasion(p, occasionChoice) && matchesStyle(p, styleChoice);

    const topsByType = options?.preferredTopTypes?.length
      ? tops.filter((p) => options.preferredTopTypes!.includes(p.type))
      : tops;
    const topsByColor = options?.preferredTopColor
      ? topsByType.filter((p) => p.colorFamily === options.preferredTopColor)
      : topsByType;
    const topsByLength = options?.preferredTopLength
      ? topsByColor.filter((p) => p.lengthClass === options.preferredTopLength)
      : topsByColor;
    const topHardPool = options?.minTopCoverage
      ? topsByLength.filter((p) => (p.coverage ?? 0) >= options.minTopCoverage!)
      : topsByLength;

    const bottomsByType = options?.preferredBottomTypes?.length
      ? bottoms.filter((p) => options.preferredBottomTypes!.includes(p.type))
      : bottoms;
    const bottomsByColor = options?.preferredBottomColor
      ? bottomsByType.filter((p) => p.colorFamily === options.preferredBottomColor)
      : bottomsByType;
    const bottomsByLength = options?.preferredBottomLength
      ? bottomsByColor.filter((p) => p.lengthClass === options.preferredBottomLength)
      : bottomsByColor;
    const bottomHardPool = options?.minBottomCoverage
      ? bottomsByLength.filter((p) => (p.coverage ?? 0) >= options.minBottomCoverage!)
      : bottomsByLength;

    const preferredTops = topHardPool.filter(filterFn);
    const candidateTops = preferredTops.length > 0 ? preferredTops : topHardPool;

    const preferredBottoms = bottomHardPool.filter(filterFn);
    const candidateBottoms = preferredBottoms.length > 0 ? preferredBottoms : bottomHardPool;

    // Rank all pairs and score them
    const scoredPairs: { top: Product; bottom: Product; score: number; rankScore: number }[] = [];

    const topList = targetTop ? [targetTop] : candidateTops;
    const bottomList = targetBottom ? [targetBottom] : candidateBottoms;

    for (const t of topList) {
      for (const b of bottomList) {
        if (t.id === b.id) continue;
        // An explicitly requested garment mode must also hold for locked products.
        if (requestedBottomKind && storefrontCategory(b) !== requestedBottomKind) continue;
        if (options?.minTopCoverage && (t.coverage ?? 0) < options.minTopCoverage) continue;
        if (options?.minBottomCoverage && (b.coverage ?? 0) < options.minBottomCoverage) continue;
        if (options?.budget && t.price + b.price > options.budget) continue;
        const colorPts = evaluateColorScore(t, b);
        const silPts = evaluateSilhouette(t, b);
        const formPts = evaluateFormality(t, b);
        const tagPts = evaluateSharedTags(t, b);
        const occasionPts =
          evaluateOccasionPreference(t, occasionChoice) +
          evaluateOccasionPreference(b, occasionChoice);
        const stylePts =
          evaluateStylePreference(t, styleChoice) +
          evaluateStylePreference(b, styleChoice);

        // Keep an unclamped rankScore so several strong pairs do not collapse into the
        // same displayed 99 score. The public score remains compact and user-friendly.
        const rankScore = colorPts + silPts + formPts + tagPts + occasionPts + stylePts;
        const displayScore = Math.min(99, Math.max(70, 72 + Math.round(rankScore / 5)));
        scoredPairs.push({ top: t, bottom: b, score: displayScore, rankScore });
      }
    }

    scoredPairs.sort((a, b) => b.rankScore - a.rankScore || b.score - a.score);

    // Widen the pool from 8 to up to 100 genuinely compatible pairs.
    // A relative score floor keeps variety high without pairing arbitrary clothes.
    const bestRankScore = scoredPairs[0]?.rankScore ?? 0;
    const qualityPool = scoredPairs
      .filter((pair) => pair.rankScore >= bestRankScore - 60)
      .slice(0, 100);

    const pairKey = (pair: { top: Product; bottom: Product }) =>
      outfitSelectionKey([
        { product: pair.top, role: "top" },
        { product: pair.bottom, role: "bottom" }
      ]);
    const unseenPairs = qualityPool.filter((pair) => !seenOutfits.has(pairKey(pair)));

    // When possible, also change both individual garments from recent suggestions.
    const recentProducts = new Set(
      (options?.excludeOutfitKeys || []).slice(-4).flatMap((key) =>
        key.split("|").map((part) => part.slice(part.indexOf(":") + 1))
      )
    );
    const variedPairs = unseenPairs.filter((pair) =>
      !recentProducts.has(pair.top.id) && !recentProducts.has(pair.bottom.id)
    );
    const selectionPool = variedPairs.length > 0
      ? variedPairs
      : unseenPairs.length > 0
      ? unseenPairs
      : qualityPool;
    // Only allow repeats after the eligible pool is exhausted.
    const selectedPair = selectionPool[salt % (selectionPool.length || 1)];

    if (selectedPair) {
      finalScore = selectedPair.score;
      finalItems = [
        { product: selectedPair.top, role: "top", roleName: "Áo / Corset" },
        { product: selectedPair.bottom, role: "bottom", roleName: storefrontCategory(selectedPair.bottom) === "skirts" ? "Chân váy" : "Quần" }
      ];

      // Chỉ thêm áo khoác ngoài khi khách yêu cầu hoặc đang giữ áo khoác của outfit trước.
      if (options?.includeOuterwear && outerwears.length > 0) {
        const fixedOuter = options.fixedOuterwearProductId
          ? outerwears.find((o) => o.id === options.fixedOuterwearProductId)
          : undefined;
        const bestOuter = fixedOuter || outerwears.find((o) =>
          evaluateColorScore(selectedPair.top, o) >= 25 &&
          evaluateFormality(selectedPair.top, o) >= 15
        );
        const fitsBudget = !options.budget || !bestOuter ||
          selectedPair.top.price + selectedPair.bottom.price + bestOuter.price <= options.budget;
        if (bestOuter && fitsBudget && !finalItems.some((i) => i.product.id === bestOuter.id)) {
          finalItems.push({ product: bestOuter, role: "outerwear", roleName: "Áo khoác ngoài (tùy chọn)" });
          finalScore = Math.min(99, finalScore + 2);
        }
      }
    }
  } else if (chosenType === "dress_layer") {
    const requiredProduct = options?.fixedDressProductId
      ? activePool.find((p) => p.id === options.fixedDressProductId && p.category === "dress")
      : options?.requiredProductId
      ? activePool.find((p) => p.id === options.requiredProductId && p.category === "dress")
      : undefined;

    const dressesByType = options?.preferredDressTypes?.length
      ? dresses.filter((p) => options.preferredDressTypes!.includes(p.type))
      : dresses;
    const dressesByColor = options?.preferredDressColor
      ? dressesByType.filter((p) => p.colorFamily === options.preferredDressColor)
      : dressesByType;
    const dressesByLength = options?.preferredDressLength
      ? dressesByColor.filter((p) => p.lengthClass === options.preferredDressLength)
      : dressesByColor;
    const dressHardPool = options?.minDressCoverage
      ? dressesByLength.filter((p) => (p.coverage ?? 0) >= options.minDressCoverage!)
      : dressesByLength;
    const withinBudget = options?.budget
      ? dressHardPool.filter((p) => p.price <= options.budget!)
      : dressHardPool;
    const occasionDresses = withinBudget.filter((p) => matchesOccasion(p, occasionChoice) && matchesStyle(p, styleChoice));
    const candidateDresses = requiredProduct
      ? (!options?.budget || requiredProduct.price <= options.budget ? [requiredProduct] : [])
      : occasionDresses.length > 0
      ? occasionDresses
      : withinBudget;
    const rankedDresses = [...candidateDresses].sort((a, b) => {
      const aScore = evaluateOccasionPreference(a, occasionChoice) + evaluateStylePreference(a, styleChoice);
      const bScore = evaluateOccasionPreference(b, occasionChoice) + evaluateStylePreference(b, styleChoice);
      return bScore - aScore || (b.formality ?? 3) - (a.formality ?? 3);
    });
    const unseenDresses = rankedDresses.filter((p) => !seenOutfits.has(`dress:${p.id}`));
    const dressPool = unseenDresses.length > 0 ? unseenDresses : rankedDresses;
    const dress = dressPool[salt % (dressPool.length || 1)];

    if (dress) {
      finalItems = [{ product: dress, role: "dress", roleName: "Đầm thiết kế" }];
      finalScore = 93;

      // Áo khoác chỉ được thêm khi khách yêu cầu hoặc đang giữ áo khoác của outfit trước.
      if (options?.includeOuterwear && outerwears.length > 0) {
        const fixedOuter = options.fixedOuterwearProductId
          ? outerwears.find((o) => o.id === options.fixedOuterwearProductId)
          : undefined;
        const scoredOuters = outerwears.map((o) => ({
          outer: o,
          score: evaluateColorScore(dress, o) + evaluateFormality(dress, o) + evaluateSharedTags(dress, o)
        })).sort((a, b) => b.score - a.score);

        const bestOuter = fixedOuter
          ? { outer: fixedOuter, score: 99 }
          : scoredOuters[0];
        const fitsBudget = !options.budget || !bestOuter || dress.price + bestOuter.outer.price <= options.budget;
        if (bestOuter && bestOuter.score >= 45 && fitsBudget) {
          finalItems.push({ product: bestOuter.outer, role: "outerwear", roleName: "Áo khoác blazer / Cardigan (tùy chọn)" });
          finalScore = Math.min(99, 90 + Math.round(bestOuter.score / 6));
        }
      }
    }
  } else {
    // coord_set
    const fixedSet = options?.fixedSetProductId
      ? sets.find((p) => p.id === options.fixedSetProductId)
      : undefined;
    const candidateSets = (sets.length > 0 ? sets : activePool.filter((p) => p.category === "set"))
      .filter((p) => !options?.minSetCoverage || (p.coverage ?? 0) >= options.minSetCoverage)
      .filter((p) => !options?.budget || p.price <= options.budget);
    const unseenSets = candidateSets.filter((p) => !seenOutfits.has(`set:${p.id}`));
    const setPool = unseenSets.length > 0 ? unseenSets : candidateSets;
    const setItem = fixedSet || setPool[salt % (setPool.length || 1)] || setPool[0];

    if (setItem && (!options?.budget || setItem.price <= options.budget)) {
      finalItems = [{ product: setItem, role: "set", roleName: "Set trang phục đồng bộ" }];
      finalScore = 96;

      if (options?.includeOuterwear && outerwears.length > 0) {
        const fixedOuter = options.fixedOuterwearProductId
          ? outerwears.find((o) => o.id === options.fixedOuterwearProductId)
          : undefined;
        const outer = fixedOuter || outerwears[salt % outerwears.length];
        const fitsBudget = !options.budget || setItem.price + outer.price <= options.budget;
        if (fitsBudget && evaluateColorScore(setItem, outer) >= 24) {
          finalItems.push({ product: outer, role: "outerwear", roleName: "Áo khoác ngoài (tùy chọn)" });
        }
      }
    }
  }

  // Resolve sizes & prices
  const itemsWithSizes = finalItems.map((item) => ({
    product: item.product,
    role: item.role,
    roleName: item.roleName,
    selectedSize: getFirstAvailableSize(item.product),
    availableSizes: getAvailableSizes(item.product)
  }));

  const totalPrice = itemsWithSizes.reduce((sum, i) => sum + i.product.price, 0);
  const originalPrice = itemsWithSizes.reduce((sum, i) => sum + (i.product.oldPrice || i.product.price), 0);
  const savings = originalPrice > totalPrice ? originalPrice - totalPrice : undefined;

  const review = itemsWithSizes.length
    ? generateStylistReview(chosenType, itemsWithSizes.map((i) => i.product), occasionChoice, styleChoice)
    : {
        title: "Chưa có set khớp đủ yêu cầu",
        reason: "Catalog hiện không có đủ sản phẩm đáp ứng đồng thời màu sắc và loại trang phục đã chọn.",
        stylingTip: "Hãy đổi một ràng buộc màu hoặc loại trang phục để LSOUL phối lại."
      };

  let matchBadge = "Tôn dáng xuất sắc";
  if (finalScore >= 96) matchBadge = "Tuyệt đối hợp gu";
  else if (finalScore >= 92) matchBadge = "Phối màu đỉnh cao";
  else if (finalScore >= 88) matchBadge = "Thời thượng & Thanh lịch";

  const selectedBottom = finalItems.find((item) => item.role === "bottom")?.product;
  const setTypeName =
    chosenType === "top_bottom"
      ? selectedBottom
        ? storefrontCategory(selectedBottom) === "skirts" ? "Áo + Chân váy" : "Áo + Quần"
        : requestedBottomKind === "skirts" ? "Áo + Chân váy" : "Áo + Quần"
      : chosenType === "dress_layer"
      ? "Đầm liền & Áo khoác"
      : "Set đồ đồng bộ (Co-ord)";

  return {
    id: `outfit-${itemsWithSizes.map((i) => i.product.id).join("-")}-${salt}`,
    title: review.title,
    setType: chosenType,
    setTypeName,
    score: finalScore,
    matchBadge,
    reason: review.reason,
    stylingTip: review.stylingTip,
    items: itemsWithSizes,
    totalPrice,
    originalPrice: savings ? originalPrice : undefined,
    savings
  };
}

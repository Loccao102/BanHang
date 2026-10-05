import { Product, products as seedProducts } from "./products";

export type OutfitSetType = "top_bottom" | "dress_layer" | "coord_set" | "all";

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
  return (product.style || []).some((value) => normalizeSearchValue(value).includes(target));
}

// Generate human-like natural Vietnamese stylist commentary
function generateStylistReview(
  setType: "top_bottom" | "dress_layer" | "coord_set",
  items: Product[],
  occasion: string,
  style: string
): { title: string; reason: string; stylingTip: string } {
  const names = items.map((i) => i.name).join(" và ");
  const colors = Array.from(new Set(items.map((i) => i.color))).join(" phối ");

  if (setType === "top_bottom") {
    const top = items.find((i) => i.category === "tops") || items[0];
    const bottom = items.find((i) => i.category === "bottoms") || items[1];
    const outer = items.find((i) => i.category === "outerwear");

    const isCorset = top.type === "corset" || top.name.toLowerCase().includes("corset");
    const isSkirt = bottom.type === "skirt" || bottom.name.toLowerCase().includes("váy");
    const isTrousers = bottom.type === "trousers" || bottom.type === "flare-pants" || bottom.type === "jeans";

    let title = "Chic & Sắc Sảo: Corset Tôn Dáng Phối Chân Váy";
    let reason = `Set đồ kết hợp chuẩn tỷ lệ hình thể với ${top.name} ôm trọn vòng eo quyến rũ, đi cùng ${bottom.name} tạo hiệu ứng kéo dài đôi chân. Gam màu ${colors} mang đậm tinh thần thời trang đương đại LSOUL.`;
    let stylingTip = "Phối cùng boots da cổ cao hoặc giày cao gót quai mảnh, kết hợp túi kẹp nách nhỏ để hoàn thiện diện mạo ấn tượng.";

    if (isCorset && isTrousers) {
      title = "Edgy Elegance: Corset Quyến Rũ & Quần Suông Tôn Chiều Cao";
      reason = `Sự kết hợp đối lập hoàn hảo giữa phần trên ôm sát đan dây của ${top.name} và phom quần suông dài của ${bottom.name}, đem lại vẻ ngoài quyền lực, sang chảnh tuyệt đối.`;
      stylingTip = "Mang kèm giày cao gót mũi nhọn cùng thắt lưng kim loại bản nhỏ để nhân đôi sự thu hút.";
    } else if (outer) {
      title = "Layering Thời Thượng: Áo Khoác Cùng Bộ Đôi Tôn Dáng";
      reason = `Bộ ba trang phục được cân bằng khéo léo giữa ${top.name}, ${bottom.name} và lớp áo khoác ${outer.name} khoác ngoài, giữ ấm nhẹ nhưng vẫn khoe trọn đường cong.`;
      stylingTip = "Bạn có thể khoác hờ áo blazer qua vai khi chụp hình để tạo dáng streetstyle tự nhiên.";
    }

    return { title, reason, stylingTip };
  }

  if (setType === "dress_layer") {
    const dress = items.find((i) => i.category === "dress") || items[0];
    const outer = items.find((i) => i.category === "outerwear");

    const title = outer ? "Đầm Dạ Tiệc & Áo Khoác Blazer Sang Trọng" : "Váy Đầm Thiết Kế LSOUL Signature";
    const reason = outer
      ? `Chiếc đầm ${dress.name} quyến rũ được tôn bật khi khoác cùng ${outer.name}, tạo sự cân bằng tinh tế giữa vẻ gợi cảm nữ tính và phong thái thanh lịch đẳng cấp.`
      : `Thiết kế ${dress.name} sở hữu phom dáng cắt xẻ sắc sảo, tôn vinh trọn vẹn đường cong của người phụ nữ hiện đại với gam màu ${dress.color} cuốn hút.`;
    const stylingTip = "Nên kết hợp trang sức ánh bạc hoặc ngọc trai tối giản, giày cao gót mũi nhọn và kiểu tóc búi cao quý phái.";

    return { title, reason, stylingTip };
  }

  // coord_set
  const title = "Co-ord Set: Đồng Bộ Chuẩn Phong Cách LSOUL";
  const reason = `Set trang phục ${names} đồng nhất về chất liệu và phong cách, giúp bạn tỏa sáng tức thì mà không mất thời gian suy nghĩ cách phối. Từng chi tiết cắt may đều được cân chỉnh để tôn dáng người mặc.`;
  const stylingTip = "Hoàn hảo cho cả những buổi cafe cuối tuần lẫn tiệc tối năng động. Chỉ cần thêm một đôi sandal quai mảnh là bạn đã sẵn sàng bước ra phố.";

  return { title, reason, stylingTip };
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
  fixedTopProductId?: string;
  fixedBottomProductId?: string;
  fixedDressProductId?: string;
  fixedOuterwearProductId?: string;
  fixedSetProductId?: string;
  requiredProductId?: string;
  excludeIds?: string[];
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
  const salt = (options?.variantSalt ?? 0) % 9973;

  // Filter candidate pools
  const tops = activePool.filter((p) => p.category === "tops" && !excludeSet.has(p.id));
  const bottoms = activePool.filter((p) => p.category === "bottoms" && !excludeSet.has(p.id));
  const dresses = activePool.filter((p) => p.category === "dress" && !excludeSet.has(p.id));
  const sets = activePool.filter((p) => p.category === "set" && !excludeSet.has(p.id));
  const outerwears = activePool.filter((p) => p.category === "outerwear" && !excludeSet.has(p.id));

  // Determine actual set architecture to generate
  let chosenType: "top_bottom" | "dress_layer" | "coord_set" = "top_bottom";
  if (setTypeChoice === "top_bottom") {
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
    const topHardPool = options?.preferredTopLength
      ? topsByColor.filter((p) => p.lengthClass === options.preferredTopLength)
      : topsByColor;

    const bottomsByType = options?.preferredBottomTypes?.length
      ? bottoms.filter((p) => options.preferredBottomTypes!.includes(p.type))
      : bottoms;
    const bottomsByColor = options?.preferredBottomColor
      ? bottomsByType.filter((p) => p.colorFamily === options.preferredBottomColor)
      : bottomsByType;
    const bottomHardPool = options?.preferredBottomLength
      ? bottomsByColor.filter((p) => p.lengthClass === options.preferredBottomLength)
      : bottomsByColor;

    const preferredTops = topHardPool.filter(filterFn);
    const candidateTops = preferredTops.length > 0 ? preferredTops : topHardPool;

    const preferredBottoms = bottomHardPool.filter(filterFn);
    const candidateBottoms = preferredBottoms.length > 0 ? preferredBottoms : bottomHardPool;

    // Rank all pairs and score them
    const scoredPairs: { top: Product; bottom: Product; score: number }[] = [];

    const topList = targetTop ? [targetTop] : candidateTops;
    const bottomList = targetBottom ? [targetBottom] : candidateBottoms;

    for (const t of topList) {
      for (const b of bottomList) {
        if (t.id === b.id) continue;
        if (options?.budget && t.price + b.price > options.budget) continue;
        const colorPts = evaluateColorScore(t, b);
        const silPts = evaluateSilhouette(t, b);
        const formPts = evaluateFormality(t, b);
        const tagPts = evaluateSharedTags(t, b);
        const total = Math.min(99, Math.max(70, 30 + colorPts + silPts + formPts + tagPts));
        scoredPairs.push({ top: t, bottom: b, score: total });
      }
    }

    scoredPairs.sort((a, b) => b.score - a.score);

    // Pick from top tier with salt variation
    const topTier = scoredPairs.slice(0, Math.min(8, scoredPairs.length));
    const selectedPair = topTier[salt % (topTier.length || 1)] || scoredPairs[0];

    if (selectedPair) {
      finalScore = selectedPair.score;
      finalItems = [
        { product: selectedPair.top, role: "top", roleName: "Áo / Corset" },
        { product: selectedPair.bottom, role: "bottom", roleName: "Quần / Chân váy" }
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
    const dressHardPool = options?.preferredDressLength
      ? dressesByColor.filter((p) => p.lengthClass === options.preferredDressLength)
      : dressesByColor;
    const withinBudget = options?.budget
      ? dressHardPool.filter((p) => p.price <= options.budget!)
      : dressHardPool;
    const occasionDresses = withinBudget.filter((p) => matchesOccasion(p, occasionChoice) && matchesStyle(p, styleChoice));
    const candidateDresses = requiredProduct
      ? (!options?.budget || requiredProduct.price <= options.budget ? [requiredProduct] : [])
      : occasionDresses.length > 0
      ? occasionDresses
      : withinBudget;
    const dress = candidateDresses[salt % (candidateDresses.length || 1)];

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
      .filter((p) => !options?.budget || p.price <= options.budget);
    const setItem = fixedSet || candidateSets[salt % (candidateSets.length || 1)] || candidateSets[0];

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

  const setTypeName =
    chosenType === "top_bottom"
      ? "Quần / Chân váy + Áo"
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

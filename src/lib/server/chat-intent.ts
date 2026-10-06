import type {
  ClothingType,
  ColorFamily,
  Product,
  ProductCategory
} from "@/lib/products";
import type { ShoppingState } from "@/lib/server/chat-state";
import { semanticTextScore } from "@/lib/server/product-semantic-profile";

export type ShoppingIntentName =
  | "search_products"
  | "recommend_outfit"
  | "modify_outfit"
  | "add_to_cart"
  | "add_outfit_to_cart"
  | "try_on"
  | "open_product"
  | "coupon"
  | "order"
  | "checkout"
  | "size_advice"
  | "policy"
  | "general";

export type OutfitRole = "top" | "bottom" | "dress" | "outerwear" | "set" | "any";

export type IntentItemConstraint = {
  role: OutfitRole;
  category?: ProductCategory;
  types?: ClothingType[];
  colorFamily?: ColorFamily;
  lengthClass?: "mini" | "midi" | "maxi";
  keepPrevious?: boolean;
};

export type ShoppingIntent = {
  intent: ShoppingIntentName;
  confidence: number;
  inheritPrevious: boolean;
  targetScope: "single" | "outfit" | "previous";
  referenceIndex?: number;
  requestedSize?: string;
  budgetMax?: number;
  occasion?: "party" | "date" | "work" | "casual" | "concert" | "all";
  style?: string;
  includeOuterwear: boolean;
  items: IntentItemConstraint[];
  couponCode?: string;
  orderId?: string;
};

type HistoryItem = { role: "user" | "assistant"; text: string };

const intentNames = new Set<ShoppingIntentName>([
  "search_products",
  "recommend_outfit",
  "modify_outfit",
  "add_to_cart",
  "add_outfit_to_cart",
  "try_on",
  "open_product",
  "coupon",
  "order",
  "checkout",
  "size_advice",
  "policy",
  "general"
]);

const roles = new Set<OutfitRole>(["top", "bottom", "dress", "outerwear", "set", "any"]);
const categories = new Set<ProductCategory>(["tops", "bottoms", "outerwear", "dress", "set"]);
const types = new Set<ClothingType>([
  "corset", "crop-top", "bodysuit", "blouse", "shirt", "knit-top",
  "blazer", "jacket", "cardigan",
  "jeans", "trousers", "flare-pants", "shorts", "skirt",
  "mini-dress", "midi-dress", "maxi-dress", "bodycon-dress",
  "set"
]);
const colors = new Set<ColorFamily>([
  "black", "white", "navy", "beige", "blue", "brown", "red", "green", "gray", "pink"
]);
const occasions = new Set<NonNullable<ShoppingIntent["occasion"]>>([
  "party", "date", "work", "casual", "concert", "all"
]);

function clampConfidence(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.5;
  return Math.max(0, Math.min(1, number));
}

function cleanString(value: unknown, max = 80) {
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  return clean ? clean.slice(0, max) : undefined;
}

function validateItem(value: unknown): IntentItemConstraint | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const role = roles.has(raw.role as OutfitRole) ? raw.role as OutfitRole : "any";
  const category = categories.has(raw.category as ProductCategory)
    ? raw.category as ProductCategory
    : undefined;
  const requestedTypes = Array.isArray(raw.types)
    ? raw.types.filter((item): item is ClothingType => types.has(item as ClothingType)).slice(0, 5)
    : [];
  const colorFamily = colors.has(raw.colorFamily as ColorFamily)
    ? raw.colorFamily as ColorFamily
    : undefined;
  const lengthClass = ["mini", "midi", "maxi"].includes(String(raw.lengthClass))
    ? raw.lengthClass as "mini" | "midi" | "maxi"
    : undefined;

  return {
    role,
    ...(category ? { category } : {}),
    ...(requestedTypes.length ? { types: requestedTypes } : {}),
    ...(colorFamily ? { colorFamily } : {}),
    ...(lengthClass ? { lengthClass } : {}),
    ...(raw.keepPrevious === true ? { keepPrevious: true } : {})
  };
}

function validateIntent(value: unknown): ShoppingIntent | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  if (!intentNames.has(raw.intent as ShoppingIntentName)) return null;
  const targetScope = ["single", "outfit", "previous"].includes(String(raw.targetScope))
    ? raw.targetScope as ShoppingIntent["targetScope"]
    : "single";

  const parsedItems = Array.isArray(raw.items)
    ? raw.items.map(validateItem).filter((item): item is IntentItemConstraint => Boolean(item)).slice(0, 5)
    : [];

  const reference = Number(raw.referenceIndex);
  const budget = Number(raw.budgetMax);
  const requestedSize = cleanString(raw.requestedSize, 8)?.toUpperCase();
  const occasion = occasions.has(raw.occasion as NonNullable<ShoppingIntent["occasion"]>)
    ? raw.occasion as NonNullable<ShoppingIntent["occasion"]>
    : undefined;

  return {
    intent: raw.intent as ShoppingIntentName,
    confidence: clampConfidence(raw.confidence),
    inheritPrevious: raw.inheritPrevious === true,
    targetScope,
    ...(Number.isInteger(reference) && reference >= 0 && reference <= 9 ? { referenceIndex: reference } : {}),
    ...(requestedSize ? { requestedSize } : {}),
    ...(Number.isFinite(budget) && budget > 0 ? { budgetMax: Math.round(budget) } : {}),
    ...(occasion ? { occasion } : {}),
    ...(cleanString(raw.style, 40) ? { style: cleanString(raw.style, 40) } : {}),
    includeOuterwear: raw.includeOuterwear === true,
    items: parsedItems,
    ...(cleanString(raw.couponCode, 32) ? { couponCode: cleanString(raw.couponCode, 32)?.toUpperCase() } : {}),
    ...(cleanString(raw.orderId, 64) ? { orderId: cleanString(raw.orderId, 64) } : {})
  };
}

function contextSummary(products: Product[]) {
  if (!products.length) return "(không có sản phẩm ở lượt trước)";
  return products.map((product, index) =>
    `${index}: ${product.name} | id=${product.id} | category=${product.category} | type=${product.type} | color=${product.colorFamily} | length=${product.lengthClass ?? "-"}`
  ).join("\n");
}

function roleFromProduct(product: Product): Exclude<OutfitRole, "any"> {
  if (product.category === "tops") return "top";
  if (product.category === "bottoms") return "bottom";
  if (product.category === "dress") return "dress";
  if (product.category === "outerwear") return "outerwear";
  return "set";
}

function contextualizeIntent(
  intent: ShoppingIntent,
  contextProducts: Product[],
  hasPersistentState = false
): ShoppingIntent {
  const parsedRoles = new Set(intent.items.map(inferConstraintRole));
  const structurallyRequestsOutfit =
    (parsedRoles.has("top") && parsedRoles.has("bottom")) ||
    (parsedRoles.has("dress") && parsedRoles.has("outerwear"));

  let normalizedIntent = intent;
  if (
    structurallyRequestsOutfit &&
    ["search_products", "general"].includes(intent.intent)
  ) {
    normalizedIntent = {
      ...intent,
      intent: "recommend_outfit",
      targetScope: "outfit"
    };
  }

  if (!contextProducts.length && !hasPersistentState) return normalizedIntent;

  intent = normalizedIntent;

  const contextRoles = new Set(contextProducts.map(roleFromProduct));
  const isOutfitContext =
    hasPersistentState ||
    contextRoles.has("dress") ||
    contextRoles.has("set") ||
    (contextRoles.has("top") && contextRoles.has("bottom"));

  const hasSoftRefinement = Boolean(
    (intent.occasion && intent.occasion !== "all") ||
    intent.style ||
    intent.budgetMax
  );

  let resolved = intent;

  // Semantic guardrail, not phrase matching: if the model sees a current outfit and
  // emits only a new vibe/occasion/budget, treat it as a refinement of that outfit
  // rather than a brand-new catalog search.
  if (
    isOutfitContext &&
    hasSoftRefinement &&
    intent.items.length === 0 &&
    ["search_products", "recommend_outfit", "general"].includes(intent.intent)
  ) {
    resolved = {
      ...intent,
      intent: "modify_outfit",
      inheritPrevious: true,
      targetScope: "outfit"
    };
  }

  if (resolved.intent !== "modify_outfit") return resolved;

  // When a ShoppingState snapshot exists, do not reconstruct hard constraints from the
  // last selected SKUs. The state contains the user's actual constraints and will be
  // merged after parsing. This avoids accidentally freezing inferred product types.
  if (hasPersistentState) {
    return {
      ...resolved,
      inheritPrevious: true,
      targetScope: "outfit"
    };
  }

  const explicitRoles = new Set(
    resolved.items
      .map((item) => {
        if (item.role !== "any") return item.role;
        if (item.category === "tops") return "top";
        if (item.category === "bottoms") return "bottom";
        if (item.category === "dress") return "dress";
        if (item.category === "outerwear") return "outerwear";
        if (item.category === "set") return "set";
        return undefined;
      })
      .filter((role): role is Exclude<OutfitRole, "any"> => Boolean(role))
  );

  // Missing roles inherit the previous outfit's structural hard constraints. We do
  // not freeze exact SKUs here; the outfit engine can choose a more suitable design.
  const inherited: IntentItemConstraint[] = [];
  for (const product of contextProducts) {
    const role = roleFromProduct(product);
    if (explicitRoles.has(role) || inherited.some((item) => item.role === role)) continue;
    inherited.push({
      role,
      category: product.category,
      types: [product.type],
      colorFamily: product.colorFamily
    });
  }

  return {
    ...resolved,
    inheritPrevious: true,
    targetScope: "outfit",
    items: [...resolved.items, ...inherited]
  };
}


const fallbackColorPatterns: Array<[RegExp, ColorFamily]> = [
  [/\b(?:den|black)\b/, "black"],
  [/\b(?:trang|white|ivory)\b/, "white"],
  [/\b(?:do|red|wine|burgundy)\b/, "red"],
  [/\b(?:be|beige|kem|stone)\b/, "beige"],
  [/\b(?:navy|xanh dam)\b/, "navy"],
  [/\b(?:xanh la|green|olive)\b/, "green"],
  [/\b(?:xanh|blue|denim)\b/, "blue"],
  [/\b(?:nau|brown)\b/, "brown"],
  [/\b(?:xam|gray|grey|charcoal)\b/, "gray"],
  [/\b(?:hong|pink)\b/, "pink"]
];

function fallbackColor(segment: string) {
  let nearest: { index: number; color: ColorFamily } | undefined;
  for (const [pattern, color] of fallbackColorPatterns) {
    const match = segment.match(pattern);
    if (match?.index === undefined) continue;
    if (!nearest || match.index < nearest.index) nearest = { index: match.index, color };
  }
  return nearest?.color;
}

function fallbackBudget(text: string) {
  const million = text.match(/(?:duoi|toi da|toi|tam|khoang|budget|ngan sach)?\s*(\d+(?:[.,]\d+)?)\s*(?:tr|trieu)\b/);
  if (million) return Math.round(Number(million[1].replace(",", ".")) * 1_000_000);
  const thousand = text.match(/(?:duoi|toi da|toi|tam|khoang|budget|ngan sach)?\s*(\d+)\s*k\b/);
  if (thousand) return Number(thousand[1]) * 1000;
  return undefined;
}

function fallbackLength(text: string) {
  const candidates: Array<{ index: number; value: "mini" | "midi" | "maxi" }> = [];
  const patterns: Array<[RegExp, "mini" | "midi" | "maxi"]> = [
    [/\bmidi\b/g, "midi"],
    [/\bmaxi\b/g, "maxi"],
    [/\bmini\b/g, "mini"],
    [/\bdai\b/g, "maxi"],
    [/\bngan\b/g, "mini"]
  ];
  for (const [pattern, value] of patterns) {
    for (const match of text.matchAll(pattern)) {
      if (match.index !== undefined) candidates.push({ index: match.index, value });
    }
  }
  candidates.sort((a, b) => b.index - a.index);
  return candidates[0]?.value;
}

function fallbackItemConstraints(text: string) {
  const items: IntentItemConstraint[] = [];
  const topMatch = text.match(/\b(?:ao|corset|top|bodysuit|croptop|crop top|so mi|shirt|blouse)\b[^,.!?;]{0,55}/);
  const bottomMatch = text.match(/\b(?:chan vay|skirt|quan|pants|trousers|jeans|shorts|vay)\b[^,.!?;]{0,55}/);
  const dressMatch = text.match(/\b(?:dam|dress|vay lien)\b[^,.!?;]{0,55}/);
  const outerMatch = text.match(/\b(?:blazer|jacket|cardigan|ao khoac)\b[^,.!?;]{0,55}/);

  if (topMatch) {
    const seg = topMatch[0];
    const types: ClothingType[] = [];
    if (/\bcorset\b/.test(seg)) types.push("corset");
    else if (/\b(?:croptop|crop top)\b/.test(seg)) types.push("crop-top");
    else if (/\bbodysuit\b/.test(seg)) types.push("bodysuit");
    else if (/\b(?:so mi|shirt)\b/.test(seg)) types.push("shirt");
    else if (/\bblouse\b/.test(seg)) types.push("blouse");
    const color = fallbackColor(seg);
    items.push({
      role: "top",
      category: "tops",
      ...(types.length ? { types } : {}),
      ...(color ? { colorFamily: color } : {}),
      ...(/\bgiu(?: nguyen)? (?:ao|top|corset)\b/.test(text) ? { keepPrevious: true } : {})
    });
  }

  if (bottomMatch && !dressMatch) {
    const seg = bottomMatch[0];
    const types: ClothingType[] = [];
    if (/\b(?:chan vay|skirt|vay)\b/.test(seg)) types.push("skirt");
    else if (/\bjeans?\b/.test(seg)) types.push("jeans");
    else if (/\bshorts?\b/.test(seg)) types.push("shorts");
    else if (/\b(?:quan|pants|trousers)\b/.test(seg)) types.push("trousers");
    const lengthClass = fallbackLength(text);
    const color = fallbackColor(seg);
    items.push({
      role: "bottom",
      category: "bottoms",
      ...(types.length ? { types } : {}),
      ...(color ? { colorFamily: color } : {}),
      ...(lengthClass ? { lengthClass } : {}),
      ...(/\bgiu(?: nguyen)? (?:chan vay|vay|quan|bottom)\b/.test(text) ? { keepPrevious: true } : {})
    });
  }

  if (dressMatch) {
    const seg = dressMatch[0];
    const types: ClothingType[] = [];
    if (/\bbodycon\b/.test(seg)) types.push("bodycon-dress");
    else if (/\bmidi\b/.test(seg)) types.push("midi-dress");
    else if (/\bmaxi\b/.test(seg)) types.push("maxi-dress");
    else if (/\bmini\b/.test(seg)) types.push("mini-dress");
    const color = fallbackColor(seg);
    items.push({
      role: "dress",
      category: "dress",
      ...(types.length ? { types } : {}),
      ...(color ? { colorFamily: color } : {}),
      ...(/\bgiu(?: nguyen)? (?:dam|dress|vay)\b/.test(text) ? { keepPrevious: true } : {})
    });
  }

  if (outerMatch) {
    const seg = outerMatch[0];
    const types: ClothingType[] = [];
    if (/\bblazer\b/.test(seg)) types.push("blazer");
    else if (/\bcardigan\b/.test(seg)) types.push("cardigan");
    else if (/\b(?:jacket|ao khoac)\b/.test(seg)) types.push("jacket");
    const color = fallbackColor(seg);
    items.push({
      role: "outerwear",
      category: "outerwear",
      ...(types.length ? { types } : {}),
      ...(color ? { colorFamily: color } : {}),
      ...(/\bgiu(?: nguyen)? (?:blazer|jacket|cardigan|ao khoac)\b/.test(text) ? { keepPrevious: true } : {})
    });
  }

  if (/\bgiu(?: nguyen)? (?:ao|top)\b/.test(text) && !items.some((item) => item.role === "top")) {
    items.push({ role: "top", keepPrevious: true });
  }
  if (/\bgiu(?: nguyen)? (?:chan vay|vay|bottom)\b/.test(text) && !items.some((item) => item.role === "bottom")) {
    items.push({ role: "bottom", keepPrevious: true });
  }

  return items;
}

export function inferFallbackShoppingIntent(args: {
  message: string;
  contextProducts?: Product[];
  shoppingState?: ShoppingState | null;
}): ShoppingIntent {
  const text = normalized(args.message);
  const hasOutfitState = Boolean(args.shoppingState?.outfit);
  const items = fallbackItemConstraints(text);
  const budgetMax = fallbackBudget(text);
  const requestedSize = text.match(/\bsize\s*(xs|s|m|l|xl|xxl)\b/i)?.[1]?.toUpperCase();

  const occasion: ShoppingIntent["occasion"] | undefined =
    /\b(?:tiec|party|gala|da hoi|su kien|event|club)\b/.test(text) ? "party" :
    /\b(?:hen ho|date)\b/.test(text) ? "date" :
    /\b(?:di lam|cong so|office|work)\b/.test(text) ? "work" :
    /\b(?:cafe|di choi|dao pho|casual)\b/.test(text) ? "casual" :
    /\bconcert\b/.test(text) ? "concert" : undefined;

  const style =
    /\by2k\b/.test(text) ? "y2k" :
    /\b(?:toi gian|minimal)\b/.test(text) ? "minimal" :
    /\b(?:ca tinh|bold|edgy)\b/.test(text) ? "bold" :
    /\b(?:nu tinh|feminine|romantic)\b/.test(text) ? "feminine" :
    /\b(?:sang|glam|luxury|thanh lich|elegant)\b/.test(text) ? "elegant" :
    undefined;

  const asksCoupon = /\b(?:coupon|voucher|ma giam|giam gia|uu dai|khuyen mai|ap ma)\b/.test(text);
  const asksOrder = /\b(?:don hang|order|tracking|van don|dang giao)\b/.test(text);
  const asksCheckout = /\b(?:thanh toan|checkout|chot don)\b/.test(text);
  const asksTryOn = /\b(?:thu do|thu set|thu outfit|phong thu|thu ca set)\b/.test(text);
  const asksBundleAdd = /(?:them|add|bo|cho).*(?:ca|nguyen|toan).*(?:set|outfit|bo).*(?:gio|cart)/.test(text)
    || /(?:them|add).*(?:set|outfit).*(?:gio|cart)/.test(text);
  const asksAdd = /(?:them|add|bo|cho).*(?:gio|cart)/.test(text);
  const asksSize = /\b(?:size|kich co|co nao|mac vua|vong eo|vong nguc|can nang|cao \d|con size)\b/.test(text);
  const asksPolicy = /\b(?:doi tra|doi size|bao hanh|freeship|ship|giao hang|chinh sach)\b/.test(text);

  const hasTop = items.some((item) => item.role === "top");
  const hasBottom = items.some((item) => item.role === "bottom");
  const hasDress = items.some((item) => item.role === "dress");
  const explicitOutfit = /\b(?:set|outfit|full look|phoi do)\b/.test(text) || (hasTop && hasBottom);
  const isRefinement = hasOutfitState && Boolean(
    budgetMax || occasion || style || items.length ||
    /\b(?:doi|thay|giu|hon|bot|them|bo|van|luc dau|ban dau|dang chon)\b/.test(text)
  );

  let intent: ShoppingIntentName = "general";
  let targetScope: ShoppingIntent["targetScope"] = "single";
  let inheritPrevious = false;

  if (asksCoupon) intent = "coupon";
  else if (asksOrder) intent = "order";
  else if (asksCheckout) intent = "checkout";
  else if (asksTryOn) {
    intent = "try_on";
    targetScope = /\b(?:ca set|set|outfit|bo)\b/.test(text) || hasOutfitState ? "outfit" : "single";
    inheritPrevious = hasOutfitState;
  } else if (asksBundleAdd) {
    intent = "add_outfit_to_cart";
    targetScope = "outfit";
    inheritPrevious = hasOutfitState;
  } else if (asksAdd) {
    intent = hasOutfitState && /\b(?:set|outfit|bo)\b/.test(text) ? "add_outfit_to_cart" : "add_to_cart";
    targetScope = intent === "add_outfit_to_cart" ? "outfit" : "single";
    inheritPrevious = hasOutfitState;
  } else if (asksSize) {
    intent = "size_advice";
    targetScope = hasOutfitState ? "previous" : "single";
    inheritPrevious = hasOutfitState;
  } else if (asksPolicy) intent = "policy";
  else if (isRefinement) {
    intent = "modify_outfit";
    targetScope = "outfit";
    inheritPrevious = true;
  } else if (explicitOutfit || hasDress) {
    intent = "recommend_outfit";
    targetScope = "outfit";
  } else if (items.length) {
    intent = "search_products";
  }

  return contextualizeIntent({
    intent,
    confidence: 0.72,
    inheritPrevious,
    targetScope,
    ...(requestedSize ? { requestedSize } : {}),
    ...(budgetMax ? { budgetMax } : {}),
    ...(occasion ? { occasion } : {}),
    ...(style ? { style } : {}),
    includeOuterwear: items.some((item) => item.role === "outerwear"),
    items
  }, args.contextProducts ?? [], hasOutfitState);
}

export async function analyzeShoppingIntent(args: {
  message: string;
  history: HistoryItem[];
  contextProducts: Product[];
  shoppingState?: ShoppingState | null;
}): Promise<ShoppingIntent | null> {
  const rawKey = process.env.GEMINI_API_KEY ?? "";
  const key = rawKey.replace(/^["']|["']$/g, "").trim();
  if (!key) return inferFallbackShoppingIntent(args);

  const history = args.history.slice(-8)
    .map((item) => `${item.role === "user" ? "Khách" : "LSOUL"}: ${item.text.slice(0, 700)}`)
    .join("\n");

  const prompt = `Bạn là bộ phân tích ý định mua sắm cho chatbot thời trang LSOUL.
Nhiệm vụ của bạn CHỈ là hiểu ngôn ngữ tự nhiên + context hội thoại và trả về JSON có cấu trúc. Không tư vấn, không chọn product ID mới, không viết câu trả lời cho khách.

Các intent hợp lệ:
- search_products: tìm/gợi ý một hoặc nhiều sản phẩm, chưa phải phối outfit nhiều role.
- recommend_outfit: muốn phối/tạo outfit mới.
- modify_outfit: chỉnh outfit ở lượt trước ("đổi áo", "giữ váy", "cái kia màu trắng"...).
- add_to_cart: thêm một sản phẩm.
- add_outfit_to_cart: thêm cả outfit/set.
- try_on: thử đồ; targetScope cho biết single hay outfit.
- open_product: mở/xem một sản phẩm cụ thể.
- coupon: hỏi/áp mã giảm giá.
- order: hỏi/mở đơn hàng.
- checkout: đi thanh toán.
- size_advice: tư vấn size.
- policy: chính sách.
- general: các câu khác.

QUY TẮC HIỂU NGÔN NGỮ:
1. Tự hiểu tiếng Việt tự nhiên, tiếng Anh, từ đồng nghĩa và ngữ cảnh; KHÔNG dựa vào exact keyword.
2. "áo đỏ + váy đen" nghĩa là role top màu red + role bottom type skirt màu black. Khi có một chiếc áo riêng đi cùng "váy", hiểu "váy" là chân váy/bottom trừ khi ngữ cảnh nói rõ đầm liền.
3. "đầm/váy liền/dress" là role dress.
4. "dạ hội", "gala", "tiệc tối", "party", "event sang" map occasion=party.
5. Chỉ đưa constraint vào items khi khách NÓI RÕ constraint đó hoặc đang giữ lại constraint từ context. Không tự biến suy luận stylist (ví dụ đi tiệc => corset) thành hard constraint.
6. BẤT KỲ follow-up nào đang chỉnh "set/look/cái đó/nó" ở lượt trước bằng tính chất tương đối hoặc phong cách/dịp mới — ví dụ "sang hơn", "dạ tiệc hơn", "casual hơn", "sexy hơn", "formal hơn", "đỡ sporty hơn", "hợp wedding hơn" — PHẢI dùng intent=modify_outfit, inheritPrevious=true, targetScope="outfit". Không được biến thành search mới nếu context hiện tại là một outfit.
7. Khi intent=modify_outfit, hãy trả về FULL EFFECTIVE CONSTRAINTS của outfit sau khi áp dụng thay đổi, không chỉ delta. Nghĩa là phải kế thừa các ràng buộc người dùng đã nói rõ ở các lượt trước (màu, role, loại món, budget nếu còn áp dụng) rồi cộng thay đổi mới. Ví dụ trước đó khách yêu cầu "áo đỏ + váy trắng", sau đó nói "dạ tiệc hơn" thì items vẫn phải chứa top màu red và bottom type skirt màu white; chỉ occasion/style thay đổi.
8. keepPrevious=true chỉ dùng khi khách muốn GIỮ NGUYÊN CHÍNH XÁC món sản phẩm ở lượt trước ("giữ nguyên cái váy này", "áo vẫn món cũ"). Nếu khách chỉ muốn giữ màu/loại món nhưng cho phép đổi thiết kế phù hợp hơn, hãy kế thừa constraint và KHÔNG đặt keepPrevious=true.
9. Nếu context là outfit nhiều món và người dùng chỉ nêu soft preference mới (occasion/style/formality/vibe) mà không yêu cầu đổi cấu trúc outfit, phải giữ nguyên role structure của outfit trước. Không được tự chuyển từ top+bottom thành dress, hoặc từ dress thành top+bottom.
10. referenceIndex là index 0-based của sản phẩm trong danh sách context bên dưới khi khách nói "món 1/2/3", "cái thứ hai", v.v.
11. Màu chuẩn chỉ dùng: black, white, navy, beige, blue, brown, red, green, gray, pink.
12. Type chuẩn chỉ dùng: corset, crop-top, bodysuit, blouse, shirt, knit-top, blazer, jacket, cardigan, jeans, trousers, flare-pants, shorts, skirt, mini-dress, midi-dress, maxi-dress, bodycon-dress, set.
13. Category chuẩn: tops, bottoms, outerwear, dress, set.
14. lengthClass chỉ mini, midi, maxi.
15. occasion chỉ party, date, work, casual, concert, all.
16. includeOuterwear=true CHỈ khi khách chủ động muốn blazer/áo khoác/layer.
17. budgetMax là số VND nguyên nếu khách nêu ngân sách tối đa/khoảng ngân sách.
18. targetScope="outfit" khi hành động áp dụng cả set; "single" khi một món; "previous" khi khách chỉ nói mơ hồ "cái/set lúc nãy" và context quyết định.
19. Nếu khách nói "đỏ rượu/burgundy/đỏ đô" thì colorFamily=red; các sắc thái vẫn map về family gần nhất.

TRẠNG THÁI MUA SẮM ĐANG ĐƯỢC BACKEND GIỮ:
${args.shoppingState?.outfit ? JSON.stringify(args.shoppingState.outfit) : "(chưa có state)"}

LƯU Ý VỀ STATE:
- State là nguồn chính xác hơn việc đoán lại từ product card. Nếu đang refine outfit, hãy dựa trên state để hiểu các ràng buộc trước đó.
- Khi khách chỉ thay đổi vibe/dịp/mức formal, không được xóa các hard constraint đang có trong state.
- Không cần lặp lại constraint cũ chỉ để "nhắc lại"; backend sẽ merge state. Chỉ output constraint nào khách thực sự thay đổi hoặc muốn giữ nguyên chính xác bằng keepPrevious=true.

CONTEXT SẢN PHẨM Ở LƯỢT TRƯỚC:
${contextSummary(args.contextProducts)}

LỊCH SỬ GẦN ĐÂY:
${history || "(bắt đầu cuộc trò chuyện)"}

TIN NHẮN HIỆN TẠI:
${args.message}

Trả về đúng JSON shape:
{
  "intent": "...",
  "confidence": 0.0,
  "inheritPrevious": false,
  "targetScope": "single",
  "referenceIndex": 0,
  "requestedSize": "M",
  "budgetMax": 3000000,
  "occasion": "party",
  "style": "glam",
  "includeOuterwear": false,
  "items": [
    {
      "role": "top",
      "category": "tops",
      "types": ["corset"],
      "colorFamily": "red",
      "lengthClass": "mini",
      "keepPrevious": false
    }
  ],
  "couponCode": "CODE",
  "orderId": "..."
}
Các field không có thông tin thì bỏ hẳn, riêng items luôn là array và includeOuterwear luôn là boolean.`;

  const primaryModel = process.env.GEMINI_INTENT_MODEL?.trim()
    || process.env.GEMINI_MODEL?.trim()
    || "gemini-flash-lite-latest";
  const configs = [
    { model: primaryModel, thinkingBudget: 0 },
    { model: "gemini-flash-latest", thinkingBudget: 0 },
    { model: "gemini-2.5-flash", thinkingBudget: undefined }
  ];

  for (const config of configs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const generationConfig: Record<string, unknown> = {
        temperature: 0.1,
        maxOutputTokens: 900,
        responseMimeType: "application/json"
      };
      if (config.thinkingBudget !== undefined) {
        generationConfig.thinkingConfig = { thinkingBudget: config.thinkingBudget };
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig
          }),
          signal: controller.signal
        }
      );

      if (!response.ok) continue;
      const data = await response.json();
      const output = data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("")
        .trim();
      if (!output) continue;

      const parsed = validateIntent(JSON.parse(output));
      if (parsed) {
        return contextualizeIntent(parsed, args.contextProducts, Boolean(args.shoppingState?.outfit));
      }
    } catch {
      // Intent parsing is an enhancement. The caller keeps a deterministic fallback.
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return inferFallbackShoppingIntent(args);
}

function normalized(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function matchesOccasion(product: Product, occasion?: ShoppingIntent["occasion"]) {
  if (!occasion || occasion === "all") return true;
  const values = (product.occasion || []).map(normalized);
  if (occasion === "party") return values.some((value) => /(tiec|su kien|party|bar|club|da hoi|gala|event)/.test(value));
  if (occasion === "date") return values.some((value) => /(hen ho|date)/.test(value));
  if (occasion === "work") return values.some((value) => /(di lam|cong so|work|office)/.test(value));
  if (occasion === "casual") return values.some((value) => /(di choi|cafe|casual|dao pho)/.test(value));
  if (occasion === "concert") return values.some((value) => /concert/.test(value));
  return true;
}

function inferConstraintRole(item: IntentItemConstraint): OutfitRole {
  if (item.role !== "any") return item.role;
  if (item.category === "tops") return "top";
  if (item.category === "bottoms") return "bottom";
  if (item.category === "dress") return "dress";
  if (item.category === "outerwear") return "outerwear";
  if (item.category === "set") return "set";

  const firstType = item.types?.[0];
  if (firstType && ["corset", "crop-top", "bodysuit", "blouse", "shirt", "knit-top"].includes(firstType)) return "top";
  if (firstType && ["jeans", "trousers", "flare-pants", "shorts", "skirt"].includes(firstType)) return "bottom";
  if (firstType && ["mini-dress", "midi-dress", "maxi-dress", "bodycon-dress"].includes(firstType)) return "dress";
  if (firstType && ["blazer", "jacket", "cardigan"].includes(firstType)) return "outerwear";
  if (firstType === "set") return "set";
  return "any";
}

function productMatchesConstraint(product: Product, item: IntentItemConstraint) {
  const role = inferConstraintRole(item);
  if (role === "top" && product.category !== "tops") return false;
  if (role === "bottom" && product.category !== "bottoms") return false;
  if (role === "dress" && product.category !== "dress") return false;
  if (role === "outerwear" && product.category !== "outerwear") return false;
  if (role === "set" && product.category !== "set") return false;

  if (item.category && product.category !== item.category) return false;
  if (item.types?.length && !item.types.includes(product.type)) return false;
  if (item.colorFamily && product.colorFamily !== item.colorFamily) return false;
  if (item.lengthClass && product.lengthClass !== item.lengthClass) return false;
  return true;
}

export function retrieveProductsFromIntent(
  intent: ShoppingIntent,
  catalog: Product[],
  limit = 5,
  contextProducts: Product[] = [],
  affinityScores: Map<string, number> = new Map()
) {
  if (
    contextProducts.length &&
    (
      ["add_to_cart", "add_outfit_to_cart", "try_on", "open_product", "modify_outfit"].includes(intent.intent) ||
      (intent.intent === "size_advice" && intent.items.length === 0)
    )
  ) {
    return contextProducts.slice(0, limit);
  }

  const constraints = intent.items.filter((item) => !item.keepPrevious);
  let candidates = catalog.filter((product) => product.active !== false && product.stock > 0);

  if (constraints.length) {
    candidates = candidates.filter((product) =>
      constraints.some((constraint) => productMatchesConstraint(product, constraint))
    );
  }

  if (intent.budgetMax) {
    candidates = candidates.filter((product) => product.price <= intent.budgetMax!);
  }

  const ranked = candidates.map((product) => {
    let score = 0;
    const matchedConstraints = constraints.filter((item) => productMatchesConstraint(product, item)).length;
    score += matchedConstraints * 40;
    if (matchesOccasion(product, intent.occasion)) score += 12;

    if (intent.style && intent.style !== "all") {
      const target = normalized(intent.style);
      if ((product.style || []).some((value) => normalized(value).includes(target))) score += 10;
      if ((product.styleKeywords || []).some((value) => normalized(value).includes(target))) score += 6;
    }

    const semanticQuery = [intent.style, intent.occasion && intent.occasion !== "all" ? intent.occasion : undefined]
      .filter(Boolean)
      .join(" ");
    if (semanticQuery) {
      score += Math.min(12, semanticTextScore(product, semanticQuery) * 2);
    }

    score += Math.max(-4, Math.min(8, affinityScores.get(product.id) ?? 0));
    if (product.featured) score += 2;
    if (product.isNew) score += 1;
    return { product, score };
  }).sort((a, b) => b.score - a.score || a.product.price - b.product.price);

  const result: Product[] = [];
  const seenGroups = new Set<string>();
  for (const { product } of ranked) {
    const group = product.groupCode?.trim() || product.id;
    if (seenGroups.has(group)) continue;
    seenGroups.add(group);
    result.push(product);
    if (result.length >= limit) break;
  }

  return result;
}

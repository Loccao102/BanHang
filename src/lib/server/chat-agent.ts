import { randomUUID } from "node:crypto";
import type { Coupon, Order } from "@prisma/client";
import type { ChatAgentAction } from "@/lib/chat";
import type { Product } from "@/lib/products";
import type { IntentItemConstraint, OutfitRole, ShoppingIntent } from "@/lib/server/chat-intent";
import { parseBudget, retrieveProducts } from "@/lib/server/chat-assistant";

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

const outfitColorPatterns: Array<[RegExp, Product["colorFamily"]]> = [
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

function colorFromSegment(segment: string) {
  let nearest: { index: number; color: Product["colorFamily"] } | undefined;
  for (const [pattern, color] of outfitColorPatterns) {
    const match = segment.match(pattern);
    if (match?.index === undefined) continue;
    if (!nearest || match.index < nearest.index) nearest = { index: match.index, color };
  }
  return nearest?.color;
}

function extractOutfitColorPreferences(message: string) {
  const text = normalize(message);
  const hasTop = /\b(?:ao|corset|top|bodysuit|croptop|so mi|shirt)\b/.test(text);
  const topMatch = text.match(/\b(?:ao|corset|top|bodysuit|croptop|so mi|shirt)\b[^,.!?;]{0,40}/);
  const bottomMatch = text.match(
    hasTop
      ? /(?:\bchan vay\b|\bvay\b|\bskirt\b|\bquan\b|\bpants\b|\btrousers\b|\bjeans\b|\bshorts\b)[^,.!?;]{0,40}/
      : /(?:\bchan vay\b|\bskirt\b|\bquan\b|\bpants\b|\btrousers\b|\bjeans\b|\bshorts\b)[^,.!?;]{0,40}/
  );
  const dressMatch = text.match(
    hasTop
      ? /\b(?:dam|dress)\b[^,.!?;]{0,40}/
      : /\b(?:dam|dress|vay)\b[^,.!?;]{0,40}/
  );

  return {
    top: topMatch ? colorFromSegment(topMatch[0]) : undefined,
    bottom: bottomMatch ? colorFromSegment(bottomMatch[0]) : undefined,
    dress: dressMatch ? colorFromSegment(dressMatch[0]) : undefined
  };
}

export function extractSize(message: string) {
  const match = normalize(message).match(/(?:size|co|cỡ)\s*(xs|s|m|l|xl|2xl|24|25|26|27|28|29|30)\b/i);
  return match?.[1]?.toUpperCase();
}

function ordinalIndex(message: string) {
  const text = normalize(message);
  const wordMap: Array<[RegExp, number]> = [
    [/(?:thu|so|mau|cai)\s*(?:1|mot)\b/, 0],
    [/(?:thu|so|mau|cai)\s*(?:2|hai)\b/, 1],
    [/(?:thu|so|mau|cai)\s*(?:3|ba)\b/, 2],
    [/(?:thu|so|mau|cai)\s*(?:4|bon|tu)\b/, 3],
    [/(?:thu|so|mau|cai)\s*(?:5|nam)\b/, 4]
  ];
  return wordMap.find(([pattern]) => pattern.test(text))?.[1];
}

import { coordinateSmartOutfit, OutfitSetType } from "@/lib/stylist-outfit-engine";

function inStockSize(product: Product, requested?: string) {
  if (requested) {
    const variant = product.variants?.find((item) => item.size.toUpperCase() === requested.toUpperCase());
    return variant && variant.stock > 0 ? variant.size : null;
  }
  const available = product.variants?.filter((item) => item.active && item.stock > 0) ?? [];
  return available.length === 1 ? available[0].size : null;
}

function productRole(product: Product): Exclude<OutfitRole, "any"> {
  if (product.category === "tops") return "top";
  if (product.category === "bottoms") return "bottom";
  if (product.category === "dress") return "dress";
  if (product.category === "outerwear") return "outerwear";
  return "set";
}

function constraintRole(item: IntentItemConstraint): Exclude<OutfitRole, "any"> | undefined {
  if (item.role !== "any") return item.role;
  if (item.category === "tops") return "top";
  if (item.category === "bottoms") return "bottom";
  if (item.category === "dress") return "dress";
  if (item.category === "outerwear") return "outerwear";
  if (item.category === "set") return "set";

  const type = item.types?.[0];
  if (type && ["corset", "crop-top", "bodysuit", "blouse", "shirt", "knit-top"].includes(type)) return "top";
  if (type && ["jeans", "trousers", "flare-pants", "shorts", "skirt"].includes(type)) return "bottom";
  if (type && ["mini-dress", "midi-dress", "maxi-dress", "bodycon-dress"].includes(type)) return "dress";
  if (type && ["blazer", "jacket", "cardigan"].includes(type)) return "outerwear";
  if (type === "set") return "set";
  return undefined;
}

type RoleState = {
  fixedProductId?: string;
  constraint?: IntentItemConstraint;
};

function buildOutfitFromIntent(intent: ShoppingIntent, catalog: Product[], contextProducts: Product[]) {
  const roles: Partial<Record<Exclude<OutfitRole, "any">, RoleState>> = {};

  if (intent.inheritPrevious) {
    for (const product of contextProducts) {
      const role = productRole(product);
      if (!roles[role]) roles[role] = { fixedProductId: product.id };
    }
  }

  for (const item of intent.items) {
    const role = constraintRole(item);
    if (!role) continue;

    if (item.keepPrevious) {
      // Keep the concrete product already stored for this role. If there is no previous
      // item for that role, keep the constraint as a best-effort preference.
      if (!roles[role]?.fixedProductId) {
        roles[role] = { constraint: item };
      }
      continue;
    }

    // An explicit change releases the previous product for this role and applies the
    // newly parsed hard constraints instead.
    roles[role] = { constraint: item };
  }

  let setType: OutfitSetType = "all";
  if (roles.dress) setType = "dress_layer";
  else if (roles.set) setType = "coord_set";
  else if (roles.top || roles.bottom) setType = "top_bottom";

  const top = roles.top?.constraint;
  const bottom = roles.bottom?.constraint;
  const dress = roles.dress?.constraint;
  const hasFixedOuterwear = Boolean(roles.outerwear?.fixedProductId);

  const coordinated = coordinateSmartOutfit({
    catalog,
    setType,
    occasion: intent.occasion || "all",
    style: intent.style || "all",
    budget: intent.budgetMax,
    preferredTopColor: top?.colorFamily,
    preferredBottomColor: bottom?.colorFamily,
    preferredDressColor: dress?.colorFamily,
    preferredTopTypes: top?.types,
    preferredBottomTypes: bottom?.types,
    preferredDressTypes: dress?.types,
    preferredTopLength: top?.lengthClass,
    preferredBottomLength: bottom?.lengthClass,
    preferredDressLength: dress?.lengthClass,
    fixedTopProductId: roles.top?.fixedProductId,
    fixedBottomProductId: roles.bottom?.fixedProductId,
    fixedDressProductId: roles.dress?.fixedProductId,
    fixedOuterwearProductId: roles.outerwear?.fixedProductId,
    fixedSetProductId: roles.set?.fixedProductId,
    includeOuterwear: intent.includeOuterwear || hasFixedOuterwear
  });

  return {
    products: coordinated.items.map((item) => item.product),
    size: intent.requestedSize,
    outfit: coordinated
  };
}

export function buildOutfit(message: string, catalog: Product[]) {
  const budget = parseBudget(message) ?? Number.POSITIVE_INFINITY;
  const size = extractSize(message);
  const text = normalize(message);

  const mentionsTop = /\b(?:ao|corset|top|bodysuit|croptop|so mi|shirt)\b/.test(text);
  const wantsSkirt =
    /\bchan vay\b|\bskirt\b/.test(text) ||
    (mentionsTop && /\bvay\b/.test(text));
  const wantsPants = /\b(?:quan|pants|trousers|jeans|shorts)\b/.test(text);
  const wantsStandaloneDress =
    /\b(?:dam|dress)\b/.test(text) ||
    (!mentionsTop && !wantsPants && /\bvay\b/.test(text));

  let setType: OutfitSetType = "all";
  if (wantsStandaloneDress) {
    setType = "dress_layer";
  } else if (mentionsTop || wantsSkirt || wantsPants) {
    setType = "top_bottom";
  } else if (text.includes("set") || text.includes("dong bo")) {
    setType = "coord_set";
  }

  let occasion = "all";
  if (text.includes("hen ho") || text.includes("date")) occasion = "date";
  else if (
    text.includes("tiec") ||
    text.includes("party") ||
    text.includes("da hoi") ||
    text.includes("gala") ||
    text.includes("su kien") ||
    text.includes("event")
  ) occasion = "party";
  else if (text.includes("di lam") || text.includes("cong so") || text.includes("work")) occasion = "work";
  else if (text.includes("di choi") || text.includes("cafe") || text.includes("casual")) occasion = "casual";

  let style = "all";
  if (text.includes("y2k")) style = "y2k";
  else if (text.includes("minimal") || text.includes("toi gian")) style = "minimal";
  else if (text.includes("bold") || text.includes("ca tinh")) style = "bold";
  else if (text.includes("nu tinh") || text.includes("feminine")) style = "feminine";

  const colorPreferences = extractOutfitColorPreferences(message);

  const coordinated = coordinateSmartOutfit({
    catalog,
    setType,
    occasion,
    style,
    budget: Number.isFinite(budget) ? budget : undefined,
    preferredTopColor: colorPreferences.top,
    preferredBottomColor: colorPreferences.bottom,
    preferredDressColor: colorPreferences.dress,
    preferredBottomTypes: wantsSkirt
      ? ["skirt"]
      : wantsPants
      ? ["trousers", "jeans", "flare-pants", "shorts"]
      : undefined,
    // Chỉ thêm áo khoác ngoài khi khách yêu cầu rõ ràng.
    includeOuterwear: /(khoac|blazer|jacket|cardigan|layer|layering|ao ngoai|giu am|mua dong|thu dong|lanh)/.test(text)
  });

  const products = coordinated.items.map((i) => i.product);
  return { products, size, outfit: coordinated };
}

type AgentPlanArgs = {
  message: string;
  found: Product[];
  contextProducts: Product[];
  catalog: Product[];
  orders: Pick<Order, "id" | "status" | "createdAt">[];
  coupons: Coupon[];
  loggedIn: boolean;
  intent?: ShoppingIntent | null;
};

export function buildAgentPlan(args: AgentPlanArgs) {
  const text = normalize(args.message);
  const actions: ChatAgentAction[] = [];
  const notes: string[] = [];
  let products = args.found;

  // Structured AI intent is the primary planner input. Regexes below are only the
  // deterministic fallback path when the intent model is unavailable or uncertain.
  const structured = args.intent && args.intent.confidence >= 0.35 ? args.intent : null;

  const legacyExplicitAdd = /(them|add|bo|cho).*(gio|cart)/.test(text) || /(mua).*(cai|mau|mon)/.test(text);
  const legacyExplicitBundle = /(them|add|bo|cho).*(ca|nguyen|toan).*(set|outfit|bo).*(gio|cart)/.test(text);
  const legacyMentionsTop = /\b(ao|corset|top|bodysuit|croptop)\b/.test(text);
  const legacyMentionsBottom =
    /(?:\bchan vay\b|\bskirt\b|\bquan\b|\bpants\b|\btrousers\b|\bjeans\b|\bshorts\b)/.test(text) ||
    (legacyMentionsTop && /\bvay\b/.test(text));
  const legacyContextLooksLikeOutfit = new Set(args.contextProducts.map((item) => item.category)).size >= 2;
  const legacyRefinement = legacyContextLooksLikeOutfit && /(doi|khac|mau|sang|giu|thay)/.test(text);

  const explicitBundle = structured
    ? structured.intent === "add_outfit_to_cart"
    : legacyExplicitBundle;
  const explicitAdd = structured
    ? structured.intent === "add_to_cart" || structured.intent === "add_outfit_to_cart"
    : legacyExplicitAdd;
  const wantsOutfit = structured
    ? ["recommend_outfit", "modify_outfit", "add_outfit_to_cart"].includes(structured.intent)
    : /(phoi|outfit|nguyen set|ca set|full look)/.test(text) || (legacyMentionsTop && legacyMentionsBottom) || legacyRefinement;
  const wantsOpen = structured
    ? structured.intent === "open_product"
    : /(mo|xem).*(cai|mau|san pham|mon)/.test(text);
  const wantsTryOn = structured
    ? structured.intent === "try_on"
    : /(thu|phong thu).*(do|set|outfit|bo|mon|cai)|(?:thu do|thu bo|thu set|vao phong thu|phong thu do|thu len dang)\b/.test(text);
  const requestedSize = structured?.requestedSize || extractSize(args.message);

  if (structured) {
    notes.push(
      "Intent AI đã phân tích: " + structured.intent +
      (structured.occasion && structured.occasion !== "all" ? ", dịp=" + structured.occasion : "") +
      (structured.style ? ", style=" + structured.style : "") +
      (structured.budgetMax ? ", budget tối đa=" + structured.budgetMax.toLocaleString("vi-VN") + " VND" : "") +
      ". Các thuộc tính item trong intent là ràng buộc cứng do khách nêu; không được tự đổi."
    );
  }

  const referencePool = args.contextProducts.length ? args.contextProducts : args.found;
  const index = structured?.referenceIndex ?? ordinalIndex(args.message) ?? 0;
  const referenced = referencePool[index] ?? args.found[0];

  if (wantsOutfit) {
    const outfit = structured
      ? buildOutfitFromIntent(structured, args.catalog, args.contextProducts)
      : buildOutfit(args.message, args.catalog);
    products = outfit.products;
    if (outfit.products.length) {
      const total = outfit.products.reduce((sum, item) => sum + item.price, 0);
      const itemList = outfit.products.map((item) => `${item.name} (${item.color})`).join(" + ");
      const hasOuterwear = outfit.products.some((item) => item.category === "outerwear");
      const mainCount = outfit.products.filter((item) => item.category !== "outerwear").length;
      notes.push(
        "Outfit được chọn gồm đúng " + outfit.products.length + " món: " + itemList +
        ", tổng " + total.toLocaleString("vi-VN") + " VND. " +
        "Khi trả lời PHẢI liệt kê ĐÚNG và ĐỦ các món này (không thêm, không bớt) và dùng đúng tổng tiền trên." +
        (hasOuterwear
          ? " Lưu ý: set gồm " + mainCount + " món chính và 1 lớp ÁO KHOÁC NGOÀI là tùy chọn — hãy nói rõ khách có thể bỏ áo khoác nếu chỉ muốn " + mainCount + " món."
          : "")
      );

      if (explicitBundle || explicitAdd) {
        if (!requestedSize) {
          notes.push("Khách muốn thêm cả outfit vào giỏ nhưng chưa nói size. Hãy hỏi size trước khi thực thi.");
        } else {
          const items = outfit.products.flatMap((product) => {
            const size = inStockSize(product, requestedSize);
            return size ? [{ productId: product.id, size, quantity: 1 }] : [];
          });
          if (items.length === outfit.products.length) {
            actions.push({
              id: randomUUID(),
              type: "add_bundle",
              label: "Thêm cả outfit size " + requestedSize,
              items,
              autoExecute: true
            });
          } else {
            notes.push("Không phải tất cả món trong outfit đều còn size " + requestedSize + "; không được tự thêm vào giỏ.");
          }
        }
      } else {
        const bundleItems = outfit.products.map((product) => {
          const itemSize = inStockSize(product, requestedSize) || product.variants?.find((v) => v.stock > 0)?.size || (Array.isArray(product.sizes) ? product.sizes[0] : "S");
          return { productId: product.id, size: itemSize, quantity: 1 };
        });
        actions.push({
          id: randomUUID(),
          type: "add_bundle",
          label: hasOuterwear
            ? `🛒 Thêm ${mainCount} món chính + áo khoác tùy chọn (${outfit.products.length} món)`
            : `🛒 Thêm cả set vào giỏ (${outfit.products.length} món)`,
          items: bundleItems,
          autoExecute: false
        });
      }

      // Allow trying on the coordinated outfit in the AI virtual fitting room
      actions.push({
        id: randomUUID(),
        type: "open_try_on",
        label: hasOuterwear
          ? `✨ Thử ${mainCount} món chính (áo khoác tùy chọn) trong phòng thử AI`
          : `✨ Thử cả set trong phòng thử AI (${outfit.products.length} món)`,
        productIds: outfit.products.map((item) => item.id),
        autoExecute: false
      });
      notes.push("Đã tạo sẵn nút cho phép khách đưa cả set phối vào phòng thử đồ AI để xem đồ lên dáng người.");
    } else {
      notes.push("Không tìm thấy outfit nào khớp đầy đủ các ràng buộc khách vừa yêu cầu. Không được tự thay màu hoặc đổi loại trang phục; hãy báo rõ món nào chưa có và mời khách đổi đúng ràng buộc đó.");
    }
  } else if (wantsTryOn) {
    const structuredNeedsFreshOutfit = Boolean(
      structured &&
      structured.targetScope === "outfit" &&
      structured.items.length > 0 &&
      args.contextProducts.length === 0
    );
    const freshlyCoordinated = structuredNeedsFreshOutfit && structured
      ? buildOutfitFromIntent(structured, args.catalog, []).products
      : [];
    const isFullSet = structured
      ? structured.targetScope === "outfit" || (structured.targetScope === "previous" && referencePool.length > 1)
      : /(ca|nguyen|toan|bo|set|outfit)/.test(text);
    const targetProducts = (freshlyCoordinated.length
      ? freshlyCoordinated
      : isFullSet && referencePool.length > 1
      ? referencePool.slice(0, 3)
      : [referenced ?? args.found[0]]).filter(Boolean);

    if (targetProducts.length) {
      products = targetProducts;
      actions.push({
        id: randomUUID(),
        type: "open_try_on",
        label: targetProducts.length > 1
          ? "✨ Thử cả set trong phòng thử AI (" + targetProducts.length + " món)"
          : "✨ Thử " + targetProducts[0].name + " trong phòng thử AI",
        productIds: targetProducts.map((item) => item.id),
        autoExecute: true
      });
      notes.push(
        targetProducts.length > 1
          ? "Khách muốn thử cả set đồ trong phòng thử đồ AI. Hệ thống sẽ mở phòng thử với " + targetProducts.length + " món này."
          : 'Khách muốn thử món "' + targetProducts[0].name + '" trong phòng thử đồ AI. Hệ thống sẽ mở phòng thử ngay.'
      );
    }
  } else if (explicitAdd && referenced) {
    const size = inStockSize(referenced, requestedSize);
    products = [referenced, ...args.found.filter((item) => item.id !== referenced.id)].slice(0, 5);
    if (!requestedSize && !size) {
      const available = referenced.variants?.filter((item) => item.stock > 0).map((item) => item.size).join(", ") || referenced.sizes.join(", ");
      notes.push('Khách muốn thêm "' + referenced.name + '" vào giỏ nhưng chưa chọn size. Hãy hỏi khách chọn một trong các size còn hàng: ' + available + ".");
    } else if (!size) {
      notes.push('Size ' + requestedSize + ' của "' + referenced.name + '" đang hết. Không được tạo action add-to-cart.');
    } else {
      actions.push({
        id: randomUUID(),
        type: "add_to_cart",
        label: "Thêm " + referenced.name + " · size " + size,
        productId: referenced.id,
        size,
        quantity: 1,
        autoExecute: true
      });
    }
  } else if (wantsOpen && referenced) {
    products = [referenced, ...args.found.filter((item) => item.id !== referenced.id)].slice(0, 5);
    actions.push({
      id: randomUUID(),
      type: "open_product",
      label: "Mở " + referenced.name,
      productId: referenced.id,
      autoExecute: true
    });
  }

  const couponTokens: string[] = args.message.toUpperCase().match(/\b[A-Z][A-Z0-9_-]{2,23}\b/g) ?? [];
  const coupon = args.coupons.find((item) => couponTokens.includes(item.code));
  if (coupon && /(ap|apply|dung|nhap|coupon|ma)/.test(text)) {
    if (coupon.active) {
      actions.push({
        id: randomUUID(),
        type: "apply_coupon",
        label: "Áp mã " + coupon.code,
        code: coupon.code,
        autoExecute: true
      });
      notes.push("Coupon " + coupon.code + " tồn tại và đang bật; client vẫn phải validate điều kiện theo giá trị giỏ hàng.");
    }
  } else if (!coupon && /(ma giam|giam gia|voucher|coupon|uu dai|khuyen mai|khuyen mai)/.test(text)) {
    // Khách hỏi xin mã giảm giá (không gõ sẵn mã cụ thể) -> liệt kê mã đang bật + nút áp nhanh.
    // Ưu tiên mã dễ dùng nhất (đơn tối thiểu thấp trước).
    const usableCoupons = args.coupons
      .filter((item) => item.active)
      .sort((a, b) => a.minOrder - b.minOrder)
      .slice(0, 3);
    if (usableCoupons.length) {
      const described = usableCoupons.map((item) => {
        const value = item.type === "percentage"
          ? "giảm " + item.value + "%"
          : "giảm " + item.value.toLocaleString("vi-VN") + "đ";
        const condition = item.minOrder > 0 ? ", đơn từ " + item.minOrder.toLocaleString("vi-VN") + "đ" : "";
        const cap = item.maxDiscount ? ", tối đa " + item.maxDiscount.toLocaleString("vi-VN") + "đ" : "";
        return item.code + " (" + value + condition + cap + ")";
      });
      for (const item of usableCoupons) {
        actions.push({
          id: randomUUID(),
          type: "apply_coupon",
          label: "Áp mã " + item.code,
          code: item.code,
          autoExecute: false
        });
      }
      notes.push(
        "Dạ LSOUL gửi bạn các mã ưu đãi đang hiệu lực: " + described.join("; ") +
        ". Bạn bấm nút bên dưới để áp mã, hệ thống sẽ kiểm tra điều kiện theo giá trị giỏ hàng hiện tại nhé!"
      );
    } else {
      notes.push("Hiện chưa có mã ưu đãi nào đang bật. Hãy thông báo khách quay lại sau hoặc theo dõi kênh chính thức của LSOUL.");
    }
  }

  const asksOrder = /(mo|xem|dua toi|cho toi xem).*(don|order)|don.*(gan nhat|dang giao|moi nhat)/.test(text);
  if (asksOrder) {
    if (!args.loggedIn) {
      notes.push("Khách muốn mở đơn hàng nhưng chưa đăng nhập. Hãy yêu cầu đăng nhập.");
    } else {
      let order = args.orders[0];
      if (text.includes("dang giao")) order = args.orders.find((item) => item.status === "shipping") ?? order;
      const explicitId = args.message.toUpperCase().match(/LS\d{6}[A-F0-9]{6}/)?.[0];
      if (explicitId) order = args.orders.find((item) => item.id === explicitId) ?? order;
      if (order) {
        actions.push({
          id: randomUUID(),
          type: "open_order",
          label: "Mở đơn #" + order.id,
          orderId: order.id,
          autoExecute: true
        });
      }
    }
  }

  if (/(di|mo|tien hanh).*(checkout|thanh toan)|checkout/.test(text)) {
    actions.push({
      id: randomUUID(),
      type: "open_checkout",
      label: "Đi đến thanh toán",
      autoExecute: true
    });
  }

  return { actions, notes, products };
}

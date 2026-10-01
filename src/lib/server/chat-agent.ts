import { randomUUID } from "node:crypto";
import type { Coupon, Order } from "@prisma/client";
import type { ChatAgentAction } from "@/lib/chat";
import type { Product } from "@/lib/products";
import { parseBudget, retrieveProducts } from "@/lib/server/chat-assistant";

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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

function inStockSize(product: Product, requested?: string) {
  if (requested) {
    const variant = product.variants?.find((item) => item.size.toUpperCase() === requested.toUpperCase());
    return variant && variant.stock > 0 ? variant.size : null;
  }
  const available = product.variants?.filter((item) => item.active && item.stock > 0) ?? [];
  return available.length === 1 ? available[0].size : null;
}

export function buildOutfit(message: string, catalog: Product[]) {
  const budget = parseBudget(message) ?? Number.POSITIVE_INFINITY;
  const size = extractSize(message);
  const text = normalize(message);

  const topCandidates = retrieveProducts(message + " ao corset top", catalog, 20).filter((item) => item.category === "tops");
  const bottomCandidates = retrieveProducts(message + " quan chan vay", catalog, 20).filter((item) => item.category === "bottoms");
  const dressCandidates = retrieveProducts(message + " dam dress", catalog, 20).filter((item) => item.category === "dress");
  const outerCandidates = retrieveProducts(message + " blazer ao khoac", catalog, 10).filter((item) => item.category === "outerwear");

  if (text.includes("dam") || text.includes("vay") || text.includes("dress")) {
    for (const dress of dressCandidates) {
      if (dress.price > budget) continue;
      const items = [dress];
      const outer = outerCandidates.find((item) => dress.price + item.price <= budget);
      if (outer) items.push(outer);
      return { products: items, size };
    }
  }

  for (const top of topCandidates) {
    for (const bottom of bottomCandidates) {
      let total = top.price + bottom.price;
      if (total > budget) continue;
      const items = [top, bottom];
      const outer = outerCandidates.find((item) => total + item.price <= budget);
      if (outer && budget !== Number.POSITIVE_INFINITY) {
        items.push(outer);
        total += outer.price;
      }
      return { products: items, size };
    }
  }

  return { products: retrieveProducts(message, catalog, 3), size };
}

type AgentPlanArgs = {
  message: string;
  found: Product[];
  contextProducts: Product[];
  catalog: Product[];
  orders: Pick<Order, "id" | "status" | "createdAt">[];
  coupons: Coupon[];
  loggedIn: boolean;
};

export function buildAgentPlan(args: AgentPlanArgs) {
  const text = normalize(args.message);
  const actions: ChatAgentAction[] = [];
  const notes: string[] = [];
  let products = args.found;

  const explicitAdd = /(them|add|bo|cho).*(gio|cart)/.test(text) || /(mua).*(cai|mau|mon)/.test(text);
  const explicitBundle = /(them|add|bo|cho).*(ca|nguyen|toan).*(set|outfit|bo).*(gio|cart)/.test(text);
  const wantsOutfit = /(phoi|outfit|nguyen set|ca set|full look)/.test(text);
  const wantsOpen = /(mo|xem).*(cai|mau|san pham|mon)/.test(text);
  const requestedSize = extractSize(args.message);

  const referencePool = args.contextProducts.length ? args.contextProducts : args.found;
  const index = ordinalIndex(args.message) ?? 0;
  const referenced = referencePool[index] ?? args.found[0];

  if (wantsOutfit) {
    const outfit = buildOutfit(args.message, args.catalog);
    if (outfit.products.length) {
      products = outfit.products;
      const total = outfit.products.reduce((sum, item) => sum + item.price, 0);
      notes.push("Outfit được chọn có " + outfit.products.length + " món, tổng " + total.toLocaleString("vi-VN") + " VND.");

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
      }
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

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

import { coordinateSmartOutfit, OutfitSetType } from "@/lib/stylist-outfit-engine";

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

  let setType: OutfitSetType = "all";
  if (text.includes("dam") || text.includes("dress")) {
    setType = "dress_layer";
  } else if (text.includes("quan") || text.includes("chan vay") || text.includes("vay") || text.includes("corset") || text.includes("ao")) {
    setType = "top_bottom";
  } else if (text.includes("set") || text.includes("dong bo")) {
    setType = "coord_set";
  }

  let occasion = "all";
  if (text.includes("hen ho") || text.includes("date")) occasion = "date";
  else if (text.includes("tiec") || text.includes("party")) occasion = "party";
  else if (text.includes("di lam") || text.includes("cong so") || text.includes("work")) occasion = "work";
  else if (text.includes("di choi") || text.includes("cafe") || text.includes("casual")) occasion = "casual";

  let style = "all";
  if (text.includes("y2k")) style = "y2k";
  else if (text.includes("minimal") || text.includes("toi gian")) style = "minimal";
  else if (text.includes("bold") || text.includes("ca tinh")) style = "bold";
  else if (text.includes("nu tinh") || text.includes("feminine")) style = "feminine";

  const coordinated = coordinateSmartOutfit({
    catalog,
    setType,
    occasion,
    style,
    budget: Number.isFinite(budget) ? budget : undefined
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
      } else {
        const bundleItems = outfit.products.map((product) => {
          const itemSize = inStockSize(product, requestedSize) || product.variants?.find((v) => v.stock > 0)?.size || (Array.isArray(product.sizes) ? product.sizes[0] : "S");
          return { productId: product.id, size: itemSize, quantity: 1 };
        });
        actions.push({
          id: randomUUID(),
          type: "add_bundle",
          label: "🛒 Thêm cả set vào giỏ (" + outfit.products.length + " món)",
          items: bundleItems,
          autoExecute: false
        });
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

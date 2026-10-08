import type { Product } from "@/lib/products";
import type { ShoppingIntent } from "@/lib/server/chat-intent";

// Fast deterministic response for plain single-product catalog lookups.
// Outfit coordination, follow-up refinements, size/policy/order questions
// and image queries must still use the full conversational pipeline.
export function fastCatalogLookupReply(
  message: string,
  intent: ShoppingIntent | null,
  products: Product[],
  hasImage = false
): string | null {
  if (hasImage || !intent || intent.intent !== "search_products" ||
      intent.inheritPrevious || intent.items.length !== 1 || message.length > 160) {
    return null;
  }
  const query = message.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  if (!/\b(tim|kiem|mua|co|ban|xem|goi y|cho minh|cho toi)\b/.test(query)) return null;
  if (!products.length) {
    return "Mình chưa tìm thấy sản phẩm đang bán khớp các điều kiện bạn yêu cầu. Bạn có thể đổi màu hoặc kiểu dáng để tìm thêm.";
  }
  const items = products.slice(0, 4)
    .map((product) => `${product.name} (${product.color}) – ${product.price.toLocaleString("vi-VN")}đ`);
  return `Mình tìm được ${products.length} mẫu phù hợp trong LSOUL: ${items.join("; ")}. Bạn có thể mở thẻ sản phẩm bên dưới để xem màu, size và tình trạng còn hàng.`;
}

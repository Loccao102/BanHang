import type { CartLine } from "./cart";
import type { Product } from "./products";

/** Buy Now contains one chosen variant, independent of saved cart items. */
export function getBuyNowLine(catalog: Product[], productId: string, size: string): CartLine | null {
  if (!productId || !size) return null;
  const rawId = productId.trim();
  const rawSize = size.trim().toUpperCase();

  const product = catalog.find(
    (p) =>
      (p.id === rawId || p.sku?.toUpperCase() === rawId.toUpperCase()) &&
      p.active !== false
  );
  if (!product) return null;

  // If variants exist, match case-insensitively and check variant stock
  if (product.variants && product.variants.length > 0) {
    const variant = product.variants.find(
      (v) => v.size.toUpperCase() === rawSize && v.active !== false
    );
    if (!variant || variant.stock < 1) return null;
    return { product, size: variant.size, quantity: 1 };
  }

  // Fallback to product sizes array and overall stock
  const hasSize = (product.sizes ?? []).some((s) => s.toUpperCase() === rawSize);
  if (!hasSize || (product.stock ?? 0) < 1) return null;
  return { product, size: rawSize, quantity: 1 };
}

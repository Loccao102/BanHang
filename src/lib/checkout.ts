import type { CartLine } from "./cart";
import type { Product } from "./products";

/** Buy Now contains one chosen variant, independent of saved cart items. */
export function getBuyNowLine(catalog: Product[], productId: string, size: string): CartLine | null {
  if (!productId || !size) return null;
  const product = catalog.find((p) => p.id === productId && p.active !== false);
  const variant = product?.variants?.find((v) => v.size === size && v.active !== false);
  if (!product || !variant || variant.stock < 1) return null;
  return { product, size, quantity: 1 };
}

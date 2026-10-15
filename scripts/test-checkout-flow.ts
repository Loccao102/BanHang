import assert from "node:assert/strict";
import { extractSepayOrderCode, generateOrderCode } from "../src/lib/server/order-code";
import { getBuyNowLine } from "../src/lib/checkout";
import type { Product } from "../src/lib/products";

for (let i = 0; i < 100; i++) {
  const code = generateOrderCode();
  assert.match(code, /^LS[A-Z0-9]{3,10}$/);
  assert.equal(code.length, 12);
  assert.equal(extractSepayOrderCode({ content: `Thanh toan ${code}` }), code);
  assert.equal(extractSepayOrderCode({ code }), code);
}
assert.equal(extractSepayOrderCode({ content: "LS123" }), "LS123");
assert.equal(extractSepayOrderCode({ content: "LSABCDEFGHIJ" }), "LSABCDEFGHIJ");
assert.equal(extractSepayOrderCode({ content: "LSABCDEFGHIJK" }), null);
assert.equal(extractSepayOrderCode({ content: "LS261004ABCDEF" }), "LS261004ABCDEF");
assert.equal(extractSepayOrderCode({ content: "Bank transfer" }), null);

const product = {
  id: "buy-now", name: "Chosen", price: 200000, active: true,
  variants: [{ size: "M", active: true, stock: 2 }]
} as Product;
const saved = {
  id: "saved-cart", name: "Saved", price: 100000, active: true,
  variants: [{ size: "S", active: true, stock: 1 }]
} as Product;
const cart = [{ product: saved, size: "S", quantity: 1 }];
const direct = getBuyNowLine([product, saved], product.id, "M");
assert.equal(direct?.product.id, product.id);
assert.equal(direct?.quantity, 1);
assert.equal(cart.length, 1);
assert.equal(cart[0].product.id, saved.id);
assert.equal(getBuyNowLine([product], product.id, "L"), null);
assert.equal(getBuyNowLine([{ ...product, active: false }], product.id, "M"), null);
assert.equal(getBuyNowLine([{ ...product, variants: [{ size: "M", active: true, stock: 0 }] }], product.id, "M"), null);

// Case insensitivity test
const directLower = getBuyNowLine([product], product.id, "m");
assert.equal(directLower?.product.id, product.id);
assert.equal(directLower?.size, "M");

// Lookup by SKU test
const productWithSku = {
  id: "lsoul-celeste-draped-column-maxi-dress-dr-celeste-maxi-blk",
  sku: "DR-CELESTE-MAXI-BLK",
  name: "Celeste Draped Column Maxi Dress",
  price: 2450000,
  active: true,
  sizes: ["S", "M", "L", "XL"],
  stock: 48,
  variants: [
    { sku: "DR-CELESTE-MAXI-BLK-S", size: "S", stock: 12, active: true },
    { sku: "DR-CELESTE-MAXI-BLK-M", size: "M", stock: 12, active: true }
  ]
} as Product;

// Test lookup by exact ID and size S
const directCeleste = getBuyNowLine([productWithSku], "lsoul-celeste-draped-column-maxi-dress-dr-celeste-maxi-blk", "S");
assert.ok(directCeleste);
assert.equal(directCeleste?.product.id, productWithSku.id);
assert.equal(directCeleste?.size, "S");

// Test lookup with lowercase size 's'
const directCelesteLower = getBuyNowLine([productWithSku], "lsoul-celeste-draped-column-maxi-dress-dr-celeste-maxi-blk", "s");
assert.ok(directCelesteLower);
assert.equal(directCelesteLower?.size, "S");

// Test lookup by SKU
const directCelesteSku = getBuyNowLine([productWithSku], "DR-CELESTE-MAXI-BLK", "S");
assert.ok(directCelesteSku);
assert.equal(directCelesteSku?.product.id, productWithSku.id);

// Test fallback when variants array is empty but sizes & stock exist
const productNoVariants = {
  id: "dress-no-var",
  name: "Simple Dress",
  price: 500000,
  active: true,
  sizes: ["S", "M"],
  stock: 10
} as Product;
const directFallback = getBuyNowLine([productNoVariants], "dress-no-var", "s");
assert.ok(directFallback);
assert.equal(directFallback?.size, "S");

console.log("SePay code, Celeste dress Buy Now, and variant fallback checks passed.");


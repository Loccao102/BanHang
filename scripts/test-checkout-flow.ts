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
console.log("SePay code and Buy Now selection checks passed.");

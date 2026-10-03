import { extendedProducts } from "../src/lib/extended-products";

console.log("=== 60 EXTENDED PRODUCTS ===");
for (let i = 0; i < extendedProducts.length; i++) {
  const p = extendedProducts[i];
  console.log(`${i+1}. [${p.sku}] ${p.name} | Màu: ${p.color} (${p.colorFamily}) | Vải: ${p.material} | Ảnh: ${p.image}`);
}

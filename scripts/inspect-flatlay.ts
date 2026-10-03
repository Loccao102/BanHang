import { flatlayProducts } from "../src/lib/flatlay-products";

console.log("=== 37 FLATLAY PRODUCTS ===");
for (let i = 0; i < flatlayProducts.length; i++) {
  const p = flatlayProducts[i];
  console.log(`${i+1}. [${p.sku}] ${p.name} | Màu: ${p.color} (${p.colorFamily}) | Vải: ${p.material} | Ảnh: ${p.image}`);
}

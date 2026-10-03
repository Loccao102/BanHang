import { flatlayProducts } from "../src/lib/flatlay-products";
import { extendedProducts } from "../src/lib/extended-products";

const all = [...flatlayProducts, ...extendedProducts];

const imgMap: Record<string, any[]> = {};
for (const p of all) {
  if (!imgMap[p.image]) imgMap[p.image] = [];
  imgMap[p.image].push({ id: p.id, name: p.name, color: p.color, colorFamily: p.colorFamily, material: p.material });
}

console.log('Total products:', all.length);
console.log('Unique images:', Object.keys(imgMap).length);
console.log('\nImage reuse breakdown:');
for (const [img, prods] of Object.entries(imgMap)) {
  console.log(`\n=== Image: ${img} (${prods.length} products) ===`);
  for (const p of prods) {
    console.log(`  - [${p.id}] ${p.name} | Màu: ${p.color} (${p.colorFamily}) | Chất liệu: ${p.material}`);
  }
}

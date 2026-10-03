import { flatlayProducts } from "../src/lib/flatlay-products";
import { extendedProducts } from "../src/lib/extended-products";

const all = [...flatlayProducts, ...extendedProducts];

const groups: Record<string, any[]> = {};
for (const p of all) {
  const g = p.groupCode || p.name;
  if (!groups[g]) groups[g] = [];
  groups[g].push(p);
}

console.log(`Total design groups: ${Object.keys(groups).length}`);
for (const [groupName, prods] of Object.entries(groups)) {
  console.log(`\nGroup: ${groupName} (${prods.length} variants) | Name: ${prods[0].name} | Cat: ${prods[0].category} | Type: ${prods[0].type}`);
  for (const p of prods) {
    console.log(`  - SKU: ${p.sku} | Color: ${p.color} (${p.colorFamily}) | Material: ${p.material} | Img: ${p.image}`);
  }
}

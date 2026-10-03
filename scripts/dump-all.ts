import { flatlayProducts } from "../src/lib/flatlay-products";
import { extendedProducts } from "../src/lib/extended-products";

const all = [...flatlayProducts, ...extendedProducts];

// Find all products by SKU or groupCode
const list = all.map(p => ({
  sku: p.sku,
  name: p.name,
  groupCode: p.groupCode,
  category: p.category,
  type: p.type,
  color: p.color,
  colorFamily: p.colorFamily,
  material: p.material,
  currentImage: p.image
}));

console.log(JSON.stringify(list, null, 2));

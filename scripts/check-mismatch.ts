import { flatlayProducts } from "../src/lib/flatlay-products";
import { extendedProducts } from "../src/lib/extended-products";

const all = [...flatlayProducts, ...extendedProducts];

console.log("=== CHECKING MISMATCHES ===");
let count = 0;
for (const p of all) {
  const img = p.image.toLowerCase();
  const cFam = p.colorFamily.toLowerCase();
  const name = p.name.toLowerCase();

  // Check color mismatch
  const colorMap: Record<string, string[]> = {
    black: ["black", "blk"],
    white: ["white", "wht"],
    red: ["red"],
    beige: ["beige", "bei"],
    brown: ["brown", "brn"],
    blue: ["blue", "blu"],
    gray: ["grey", "gray", "gry"],
    green: ["olive", "olv", "green"],
    navy: ["navy"]
  };

  let hasColorKeyword = false;
  let matchesColor = false;
  for (const [canon, keywords] of Object.entries(colorMap)) {
    for (const kw of keywords) {
      if (img.includes(kw)) {
        hasColorKeyword = true;
        if (cFam === canon || (canon === "blue" && cFam === "navy")) {
          matchesColor = true;
        }
      }
    }
  }

  // Check type mismatch
  const typeMap: Record<string, string[]> = {
    dress: ["dress", "dam", "slip"],
    top: ["top", "shirt", "corset", "tank", "tee", "ao"],
    bottoms: ["pant", "pants", "skirt", "trousers", "slacks", "jeans", "shorts", "quan", "vay"],
    outerwear: ["blazer", "jacket", "coat", "trench"]
  };

  let categoryInImg = false;
  for (const kw of typeMap[p.category] || []) {
    if (img.includes(kw)) {
      categoryInImg = true;
      break;
    }
  }

  // Also check if img belongs to completely different category
  let categoryConflict = false;
  for (const [cat, kws] of Object.entries(typeMap)) {
    if (cat !== p.category) {
      for (const kw of kws) {
        if (img.includes(kw)) {
          // exception: if dress image has skirt/pant/top
          if (p.category === "dress" && (img.includes("blazer") || img.includes("jacket") || img.includes("coat") || img.includes("pant") || img.includes("trousers"))) {
            categoryConflict = true;
          }
          if (p.category === "outerwear" && (img.includes("dress") || img.includes("skirt") || img.includes("tank"))) {
            categoryConflict = true;
          }
          if (p.category === "bottoms" && (img.includes("blazer") || img.includes("jacket") || img.includes("dress") || img.includes("shirt") || img.includes("tank") || img.includes("top"))) {
            categoryConflict = true;
          }
          if (p.category === "tops" && (img.includes("dress") || img.includes("pant") || img.includes("skirt") || img.includes("trousers") || img.includes("jacket") || img.includes("coat") || img.includes("blazer"))) {
            categoryConflict = true;
          }
        }
      }
    }
  }

  if ((hasColorKeyword && !matchesColor) || categoryConflict) {
    count++;
    console.log(`[MISMATCH #${count}] id: ${p.id}`);
    console.log(`  Name: ${p.name}`);
    console.log(`  Category: ${p.category} | Color: ${p.color} (${p.colorFamily}) | Material: ${p.material}`);
    console.log(`  Image: ${p.image}`);
    console.log(`  Reason: ${hasColorKeyword && !matchesColor ? "COLOR MISMATCH" : ""} ${categoryConflict ? "CATEGORY CONFLICT" : ""}`);
  }
}

console.log(`\nTotal mismatches detected: ${count}`);

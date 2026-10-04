import { flatlayProducts } from "../src/lib/flatlay-products";
import { extendedProducts } from "../src/lib/extended-products";
import fs from "fs";
import path from "path";

const all = [...flatlayProducts, ...extendedProducts];
const publicDir = path.join(process.cwd(), "public", "products");

const missing: any[] = [];
const overlayTinted: any[] = [];
const genuine: any[] = [];

// Track distinct filenames
const fileStats = new Map<string, { size: number; mtime: Date; products: any[] }>();

for (const p of all) {
  const filename = path.basename(p.image);
  const fullPath = path.join(publicDir, filename);
  if (!fs.existsSync(fullPath)) {
    missing.push({ id: p.id, name: p.name, color: p.color, file: filename });
  } else {
    const stat = fs.statSync(fullPath);
    if (!fileStats.has(filename)) {
      fileStats.set(filename, { size: stat.size, mtime: stat.mtime, products: [] });
    }
    fileStats.get(filename)!.products.push(p);
  }
}

console.log("=== TOTAL PRODUCTS:", all.length);
console.log("=== UNIQUE REFERENCED IMAGE FILES:", fileStats.size + missing.length);
console.log("=== MISSING FILES COUNT:", missing.length);

for (const [file, info] of fileStats.entries()) {
  // If file size is suspiciously small (< 100KB or timestamp between 4:09 and 4:11 AM on 04/10/2026), it was created by the tint script
  const isOverlay = info.size < 100000 || (info.mtime.getHours() === 4 && info.mtime.getMinutes() >= 9 && info.mtime.getMinutes() <= 11);
  if (isOverlay) {
    overlayTinted.push({ file, size: Math.round(info.size / 1024), count: info.products.length, sampleProduct: info.products[0].name });
  } else {
    genuine.push({ file, size: Math.round(info.size / 1024), count: info.products.length, sampleProduct: info.products[0].name });
  }
}

console.log("\n=== GENUINE AI / REAL PHOTOS COUNT:", genuine.length);
console.log("=== OVERLAY / TINTED PHOTOS THAT NEED REPLACEMENT:", overlayTinted.length);
console.log("\n--- List of Overlay/Tinted Photos to generate genuine replacements for: ---");
overlayTinted.forEach(x => {
  console.log(`- ${x.file} (${x.size} KB, used by ${x.count} products e.g. "${x.sampleProduct}")`);
});

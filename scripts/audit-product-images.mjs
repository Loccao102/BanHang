/**
 * Audit ảnh sản phẩm: phát hiện ảnh dùng chung, sai màu, thiếu file, lệch tỷ lệ 3:4, file rác.
 * Chạy: node scripts/audit-product-images.mjs
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const prisma = new PrismaClient();
const PUBLIC = path.join(process.cwd(), "public");

const COLOR_TOKENS = {
  "Đen": ["black"],
  "Trắng": ["white"],
  "Trắng kem": ["white", "cream", "beige"],
  "Trắng ngà": ["white", "ivory", "cream"],
  "Trắng tuyết": ["white", "snow"],
  "Be": ["beige", "tan", "camel", "cream", "sand"],
  "Be kem": ["beige", "cream", "tan", "sand"],
  "Nâu": ["brown", "chocolate", "coffee", "mocha"],
  "Nâu đất": ["brown", "earth", "chocolate", "mocha"],
  "Xanh": ["blue", "denim", "jean"],
  "Xanh denim": ["blue", "denim", "jean"],
  "Xanh pastel": ["blue", "pastel", "sky"],
  "Xanh navy": ["navy", "blue"],
  "Xanh lá": ["green", "olive", "sage", "mint"],
  "Xám": ["gray", "grey", "silver"],
  "Đỏ": ["red"],
  "Đỏ mận": ["red", "plum", "burgundy", "wine"],
  "Đỏ ruby": ["red", "ruby", "burgundy", "wine"],
  "Đỏ rượu": ["red", "wine", "burgundy", "plum"]
};

const ALL_COLOR_WORDS = ["black", "white", "beige", "cream", "ivory", "brown", "chocolate", "blue", "denim", "navy", "sky", "pastel",
  "green", "olive", "sage", "mint", "gray", "grey", "silver", "red", "wine", "burgundy", "plum", "ruby", "tan", "camel", "sand", "pink", "yellow", "gold"];

const products = await prisma.product.findMany({
  orderBy: [{ name: "asc" }, { color: "asc" }],
  select: { id: true, sku: true, name: true, color: true, colorFamily: true, category: true, type: true, image: true, hoverImage: true, tryOnImage: true, active: true, analyzerReady: true }
});

function tokensOf(filePath) {
  if (!filePath) return [];
  const base = path.basename(filePath).replace(/\.[a-z0-9]+$/i, "");
  return base.split(/[-_.\s]+/).map((t) => t.toLowerCase()).filter(Boolean);
}

function localPath(filePath) {
  if (!filePath || !filePath.startsWith("/")) return null;
  return path.join(PUBLIC, filePath.replace(/^\//, ""));
}

const fileStats = new Map();
async function statOf(filePath) {
  if (fileStats.has(filePath)) return fileStats.get(filePath);
  const full = localPath(filePath);
  let info = { exists: false };
  if (full && fs.existsSync(full)) {
    const size = fs.statSync(full).size;
    let dims = null;
    try {
      const meta = await sharp(full).metadata();
      dims = `${meta.width}x${meta.height}`;
    } catch { dims = "ERR"; }
    info = { exists: true, size, dims };
  }
  fileStats.set(filePath, info);
  return info;
}

const images = [...new Set(products.flatMap((p) => [p.image, p.hoverImage, p.tryOnImage]).filter(Boolean))];

console.log("=== TỔNG QUAN ===");
console.log(`Sản phẩm: ${products.length} | ảnh riêng biệt được dùng: ${images.length}`);

let missing = 0, small = 0, wrongRatio = 0;
for (const img of images) {
  const s = await statOf(img);
  if (!s.exists) { missing++; continue; }
  if (s.size < 20000) small++;
  const [w, h] = (s.dims ?? "0x0").split("x").map(Number);
  if (w && h && Math.abs(w / h - 0.75) > 0.03) wrongRatio++;
}
console.log(`Ảnh thiếu file: ${missing} | file < 20KB (nghi placeholder): ${small} | lệch tỷ lệ 3:4: ${wrongRatio}`);

console.log("\n=== ẢNH DÙNG CHUNG CHO NHIỀU SẢN PHẨM ===");
const byImage = new Map();
for (const p of products) {
  if (!p.image) continue;
  if (!byImage.has(p.image)) byImage.set(p.image, []);
  byImage.get(p.image).push(p);
}
for (const [img, list] of [...byImage.entries()].filter(([, l]) => l.length > 1).sort((a, b) => b[1].length - a[1].length)) {
  const colors = [...new Set(list.map((p) => p.color))];
  const names = [...new Set(list.map((p) => p.name))];
  const kind = colors.length > 1 ? "KHÁC MÀU dùng chung ảnh" : (names.length > 1 ? "KHÁC MẪU dùng chung ảnh" : "trùng");
  console.log(`- ${img} [${kind}]`);
  for (const p of list) console.log(`    ${p.name} | ${p.color} | sku=${p.sku}`);
}

console.log("\n=== MÀU TRONG DB KHÔNG KHỚP TÊN FILE ẢNH (nghi ảnh sai) ===");
let colorMismatch = 0;
for (const p of products) {
  if (!p.image) continue;
  const tokens = tokensOf(p.image);
  const expected = COLOR_TOKENS[p.color] ?? [];
  const foundColorWord = ALL_COLOR_WORDS.filter((w) => tokens.includes(w));
  const ok = expected.length === 0 || expected.some((t) => tokens.includes(t));
  if (!ok && foundColorWord.length) {
    colorMismatch++;
    console.log(`- ${p.name} | DB màu="${p.color}" (${p.colorFamily}) | ảnh=${p.image} | token màu trong tên file: ${foundColorWord.join("/")}`);
  }
}
console.log(`Tổng: ${colorMismatch}`);

console.log("\n=== FILE ẢNH KHÔNG ĐƯỢC SẢN PHẨM NÀO DÙNG (orphan) ===");
const usedFiles = new Set([...byImage.keys()].map((i) => path.basename(i)));
const hoverFiles = new Set(products.map((p) => p.hoverImage).filter(Boolean).map((i) => path.basename(i)));
const tryOnFiles = new Set(products.map((p) => p.tryOnImage).filter(Boolean).map((i) => path.basename(i)));
const allFiles = fs.readdirSync(path.join(PUBLIC, "products"));
const orphans = allFiles.filter((f) => !usedFiles.has(f) && !hoverFiles.has(f) && !tryOnFiles.has(f));
console.log(orphans.join(", ") || "(không có)");

console.log("\n=== HOVER / TRY-ON TRÙNG VỚI ẢNH CHÍNH ===");
const hoverSame = products.filter((p) => p.hoverImage && p.hoverImage === p.image).length;
const tryOnSame = products.filter((p) => p.tryOnImage && p.tryOnImage === p.image).length;
console.log(`hoverImage trùng image: ${hoverSame}/${products.length} | tryOnImage trùng image: ${tryOnSame}/${products.length}`);

const report = {
  totalProducts: products.length,
  distinctImages: images.length,
  missingFiles: missing,
  wrongRatio,
  colorMismatches: colorMismatch,
  orphans,
  unusedHoverOrTryOn: { hoverSameAsImage: hoverSame, tryOnSameAsImage: tryOnSame },
  duplicatedImages: [...byImage.entries()].filter(([, l]) => l.length > 1).map(([img, l]) => ({ img, products: l.map((p) => ({ name: p.name, color: p.color, sku: p.sku })) }))
};
console.log("\n=== JSON ===");
console.log(JSON.stringify(report, null, 2));
await prisma.$disconnect();

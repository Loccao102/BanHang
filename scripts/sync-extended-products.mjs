import fs from "node:fs";
import { NEW_PRODUCTS } from "./upload-new-drop.mjs";

const envFile = fs.readFileSync(".env", "utf8");
function getEnv(key, def = "") {
  const m = envFile.match(new RegExp(`^${key}=([^\\r\\n]+)`, "m"));
  return m ? m[1].replace(/^["']|["']$/g, "").trim() : def;
}

const cloudName = getEnv("CLOUDINARY_CLOUD_NAME", "dbk2ncqss");
const folder = getEnv("CLOUDINARY_FOLDER", "lsoul/products");

const targetFile = "src/lib/extended-products.ts";
let content = fs.readFileSync(targetFile, "utf8");

// Kiểm tra xem đã có SKU nào trong NEW_PRODUCTS chưa
const toAdd = NEW_PRODUCTS.filter(p => !content.includes(`"sku": "${p.sku}"`));
if (toAdd.length === 0) {
  console.log("Tất cả SKU mới đã có trong extended-products.ts!");
  process.exit(0);
}

const seeds = toAdd.map(p => {
  const cloudUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v1791445480/${folder}/${p.filename}`;
  return {
    sku: p.sku,
    groupCode: p.groupCode,
    name: p.name,
    subtitle: p.subtitle,
    category: p.category,
    type: p.type,
    price: p.price,
    color: p.color,
    colorFamily: p.colorFamily,
    colorHex: p.colorHex,
    image: cloudUrl,
    style: p.style,
    occasion: p.occasion,
    material: p.material,
    fit: p.fit,
    silhouette: p.silhouette,
    lengthClass: p.lengthClass,
    neckline: p.neckline,
    sleeveLength: p.sleeveLength,
    waistRise: p.waistRise,
    colorTemperature: p.colorTemperature
  };
});

const formattedSeeds = seeds.map(s => "  " + JSON.stringify(s, null, 2).replace(/\n/g, "\n  ")).join(",\n");

// Match `];` followed by `export const extendedProducts`
const regex = /\];(\r?\n)+export const extendedProducts/g;
const match = regex.exec(content);
if (!match) {
  console.error("Không tìm thấy marker cuối data trong extended-products.ts");
  process.exit(1);
}

const insertPos = match.index;
const updated = content.slice(0, insertPos) + ",\n" + formattedSeeds + "\n" + content.slice(insertPos);
fs.writeFileSync(targetFile, updated, "utf8");
console.log(`Đã thêm thành công ${toAdd.length} sản phẩm mới vào ${targetFile}!`);

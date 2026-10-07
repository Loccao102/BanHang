import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// 1. Đọc cấu hình từ .env
const envFile = fs.readFileSync(".env", "utf8");
function getEnv(key, def = "") {
  const m = envFile.match(new RegExp(`^${key}=([^\\r\\n]+)`, "m"));
  return m ? m[1].replace(/^["']|["']$/g, "").trim() : def;
}

const cloudName = getEnv("CLOUDINARY_CLOUD_NAME");
const apiKey = getEnv("CLOUDINARY_API_KEY");
const apiSecret = getEnv("CLOUDINARY_API_SECRET");
const folder = getEnv("CLOUDINARY_FOLDER", "lsoul/products");

if (!cloudName || !apiKey || !apiSecret) {
  console.error("Thiếu cấu hình Cloudinary trong .env!");
  process.exit(1);
}

console.log("=== THÔNG TIN CẤU HÌNH CLOUDINARY ===");
console.log("Cloud Name:", cloudName);
console.log("API Key:", apiKey);
console.log("Folder:", folder);

// 2. Danh sách 14 task
const TASKS = [
  {
    skus: ["TP-LUXE-POPLIN-BLK"], oldImage: "shirt-poplin-black.jpg",
    targetFilename: "shirt-poplin-luxe-black.jpg", sourceFile: "extended-products.ts",
    label: "Luxe Oversized Crisp Poplin Shirt — Đen tuyền"
  },
  {
    skus: ["TP-LUXE-POPLIN-BLU"], oldImage: "shirt-poplin-blue.jpg",
    targetFilename: "shirt-poplin-luxe-blue.jpg", sourceFile: "extended-products.ts",
    label: "Luxe Oversized Crisp Poplin Shirt — Xanh baby blue"
  },
  {
    skus: ["TP-LUXE-POPLIN-WHT"], oldImage: "shirt-poplin-white.jpg",
    targetFilename: "shirt-poplin-luxe-white.jpg", sourceFile: "extended-products.ts",
    label: "Luxe Oversized Crisp Poplin Shirt — Trắng"
  },
  {
    skus: ["PT-WIDE-PLEAT-BEI"], oldImage: "pants-tailored-wide-beige.jpg",
    targetFilename: "pants-wide-pleat-beige.jpg", sourceFile: "extended-products.ts",
    label: "High-Waist Deep-Pleat Wide Slacks — Be kem"
  },
  {
    skus: ["PT-WIDE-PLEAT-BLK"], oldImage: "pants-tailored-wide-black.jpg",
    targetFilename: "pants-wide-pleat-black.jpg", sourceFile: "extended-products.ts",
    label: "High-Waist Deep-Pleat Wide Slacks — Đen công sở"
  },
  {
    skus: ["PT-WIDE-PLEAT-BRN"], oldImage: "pants-trousers-brown.jpg",
    targetFilename: "pants-wide-pleat-brown.jpg", sourceFile: "extended-products.ts",
    label: "High-Waist Deep-Pleat Wide Slacks — Nâu mocha"
  },
  {
    skus: ["PT-FLARE-DENIM-BLK"], oldImage: "pants-flare-denim-black.jpg",
    targetFilename: "pants-flare-midrise-black.jpg", sourceFile: "extended-products.ts",
    label: "Y2K Mid-Rise Bell-Bottom Flare Jeans — Đen wash"
  },
  {
    skus: ["PT-FLARE-DENIM-BLU"], oldImage: "pants-flare-denim-blue.jpg",
    targetFilename: "pants-flare-midrise-blue.jpg", sourceFile: "extended-products.ts",
    label: "Y2K Mid-Rise Bell-Bottom Flare Jeans — Xanh denim"
  },
  {
    skus: ["SK-TENNIS-PLEAT-BLK"], oldImage: "skirt-pleated-mini-black.jpg",
    targetFilename: "skirt-tennis-pleat-black.jpg", sourceFile: "flatlay-products.ts",
    label: "Tennis Pleated Mini Skirt — Đen"
  },
  {
    skus: ["SK-TENNIS-PLEAT-WHT"], oldImage: "skirt-pleated-mini-white.jpg",
    targetFilename: "skirt-tennis-pleat-white.jpg", sourceFile: "flatlay-products.ts",
    label: "Tennis Pleated Mini Skirt — Trắng"
  },
  {
    skus: ["SK-TENNIS-PLEAT-GRY"], oldImage: "skirt-pleated-grey.jpg",
    targetFilename: "skirt-tennis-pleat-grey.jpg", sourceFile: "flatlay-products.ts",
    label: "Tennis Pleated Mini Skirt — Xám heather"
  },
  {
    skus: ["SK-SATIN-SLIT-BEI"], oldImage: "skirt-slit-midi-beige.jpg",
    targetFilename: "skirt-satin-slit-beige.jpg", sourceFile: "extended-products.ts",
    label: "Satin Bias-Cut Slit Midi Skirt — Be champagne"
  },
  {
    skus: ["SK-SATIN-SLIT-BLK"], oldImage: "skirt-slit-midi-black.jpg",
    targetFilename: "skirt-satin-slit-black.jpg", sourceFile: "extended-products.ts",
    label: "Satin Bias-Cut Slit Midi Skirt — Đen bóng"
  },
  {
    skus: ["DR-NOIR-SLIP-RED"], oldImage: "dress-silk-slip-red.jpg",
    targetFilename: "dress-noir-slip-red.jpg", sourceFile: "extended-products.ts",
    label: "Noir Silk Slip Midi Dress — Đỏ rượu"
  }
];

// 3. Hàm upload lên Cloudinary
async function uploadToCloudinary(filePath, filename) {
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: "image/jpeg" });
  const baseName = filename.replace(/\.[^/.]+$/, "");
  const publicId = `${folder}/${baseName}`;

  const formData = new FormData();
  formData.append("file", blob, filename);
  formData.append("public_id", publicId);
  formData.append("overwrite", "true");

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}` },
    body: formData
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url) {
    throw new Error(`Upload lỗi HTTP ${res.status}: ${data.error?.message || res.statusText}`);
  }
  return data.secure_url;
}

// 4. Hàm patch catalog nguồn
function findEntry(source, sku) {
  const markers = [`"sku": "${sku}"`, `sku: "${sku}"`];
  let start = -1;
  for (const marker of markers) {
    const idx = source.indexOf(marker);
    if (idx !== -1) { start = idx; break; }
  }
  if (start === -1) return null;
  const nextEntry = source.indexOf("\n  {", start);
  const end = nextEntry === -1 ? source.length : nextEntry;
  return { start, end, block: source.slice(start, end) };
}

function patchSource(task) {
  const srcPath = path.join(process.cwd(), "src", "lib", task.sourceFile);
  const source = fs.readFileSync(srcPath, "utf8");
  const found = findEntry(source, task.skus[0]);
  if (!found) return { changed: false, detail: `Không tìm thấy ${task.skus[0]}` };
  const replacement = found.block.split(`/products/${task.oldImage}`).join(`/products/${task.targetFilename}`);
  if (replacement === found.block) return { changed: false, detail: `Không thấy ${task.oldImage}` };
  fs.writeFileSync(srcPath, source.slice(0, found.start) + replacement + source.slice(found.end));
  return { changed: true, detail: "OK" };
}

async function main() {
  console.log("\n=== 1. UPLOAD 14 ẢNH LÊN CLOUDINARY (LƯU CẢ LOCAL & CLOUD) ===");
  const uploadedUrls = new Map();

  for (const task of TASKS) {
    const localPath = path.join(process.cwd(), "public", "products", task.targetFilename);
    if (!fs.existsSync(localPath)) {
      console.error(`[THIẾU FILE LOCAL] ${task.targetFilename}`);
      continue;
    }
    const sizeKb = Math.round(fs.statSync(localPath).size / 1024);
    try {
      const url = await uploadToCloudinary(localPath, task.targetFilename);
      uploadedUrls.set(task.targetFilename, url);
      console.log(`[CLOUDINARY OK] ${task.targetFilename} (${sizeKb} KB)`);
      console.log(`               -> ${url}`);
    } catch (err) {
      console.error(`[CLOUDINARY FAIL] ${task.targetFilename}:`, err.message);
    }
  }

  console.log("\n=== 2. CẬP NHẬT FILE CATALOG NGUỒN (SRC/LIB) ===");
  for (const task of TASKS) {
    const res = patchSource(task);
    console.log(`[PATCH] ${task.skus[0]}: ${res.detail}`);
  }

  // Copy catalog đã patch vào Docker container
  try {
    execSync("docker cp src/lib/extended-products.ts lsoul-web:/app/src/lib/extended-products.ts", { stdio: "ignore" });
    execSync("docker cp src/lib/flatlay-products.ts lsoul-web:/app/src/lib/flatlay-products.ts", { stdio: "ignore" });
    execSync("docker cp src/lib/extended-products.ts lsoul-admin:/app/src/lib/extended-products.ts", { stdio: "ignore" });
    execSync("docker cp src/lib/flatlay-products.ts lsoul-admin:/app/src/lib/flatlay-products.ts", { stdio: "ignore" });
    console.log("[DOCKER] Đã đồng bộ catalog vào lsoul-web và lsoul-admin.");
  } catch (err) {
    console.warn("[DOCKER] Lỗi copy catalog:", err.message);
  }

  console.log("\n=== 3. CẬP NHẬT DATABASE POSTGRESQL (LSOUL-POSTGRES) ===");
  for (const task of TASKS) {
    // Ưu tiên Cloudinary URL nếu có, fallback sang local /products/...
    const cloudUrl = uploadedUrls.get(task.targetFilename);
    const finalUrl = cloudUrl || `/products/${task.targetFilename}`;

    const updateScript = `
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      async function run() {
        const r = await prisma.product.updateMany({
          where: { sku: { in: ${JSON.stringify(task.skus)} } },
          data: {
            image: ${JSON.stringify(finalUrl)},
            hoverImage: ${JSON.stringify(finalUrl)},
            tryOnImage: ${JSON.stringify(finalUrl)},
            images: [${JSON.stringify(finalUrl)}]
          }
        });
        console.log('[DB] ' + ${JSON.stringify(task.skus.join(", "))} + ' -> ' + r.count + ' sản phẩm');
      }
      run().finally(() => prisma.$disconnect());
    `.replace(/\n\s*/g, " ");

    try {
      execSync(`docker exec lsoul-web node -e "${updateScript}"`, { stdio: "inherit" });
    } catch (err) {
      console.error(`[DB FAIL] ${task.skus.join(", ")}:`, err.message);
    }
  }

  console.log("\n=== HOÀN TẤT ĐỒNG BỘ: ĐÃ LƯU LOCAL & ĐÃ ĐƯA LÊN CLOUDINARY! ===");
}

main().catch(console.error);

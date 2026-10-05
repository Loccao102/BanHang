/**
 * Sinh 14 ảnh còn thiếu cho các cặp sản phẩm đang dùng chung ảnh, sau đó tự động:
 *   1. lưu ảnh vào public/products
 *   2. cập nhật file catalog nguồn (extended-products.ts / flatlay-products.ts)
 *   3. cập nhật database (image / hoverImage / tryOnImage)
 *   4. copy ảnh vào container lsoul-web + lsoul-admin (không cần rebuild)
 *
 * Usage:
 *   npx tsx scripts/generate-missing-images.ts --list             # xem kế hoạch 14 ảnh
 *   npx tsx scripts/generate-missing-images.ts --print-patches    # xem thay đổi catalog sẽ ghi
 *   npx tsx scripts/generate-missing-images.ts --prompts          # in prompt để tự sinh ảnh (Antigravity, ...)
 *   npx tsx scripts/generate-missing-images.ts --probe            # kiểm tra model ảnh còn quota
 *   npx tsx scripts/generate-missing-images.ts                    # sinh ảnh còn thiếu + cập nhật
 *   npx tsx scripts/generate-missing-images.ts --import="<thư mục>"  # nhập ảnh đã sinh sẵn rồi cập nhật
 *   npx tsx scripts/generate-missing-images.ts --only=DR-NOIR-SLIP-RED
 *   npx tsx scripts/generate-missing-images.ts --force            # sinh lại dù file đã tồn tại
 */
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

dotenv.config();

const key = process.env.GEMINI_API_KEY?.replace(/^["']|["']$/g, "").trim();
const publicDir = path.join(process.cwd(), "public", "products");
const MODELS = [
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
  "nano-banana-pro-preview",
  "gemini-3.1-flash-image-preview",
  "gemini-2.5-flash-image"
];

type Task = {
  skus: string[];
  oldImage: string;
  targetFilename: string;
  sourceFile: "extended-products.ts" | "flatlay-products.ts";
  label: string;
  prompt: string;
};

const STYLE = "High-end e-commerce flat-lay product photograph, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only, soft natural shadow, 8k detail";

const TASKS: Task[] = [
  // --- Cặp 1: Classic Poplin Oversized Shirt (giữ ảnh cũ) ↔ Luxe Oversized Crisp Poplin Shirt (ảnh mới)
  {
    skus: ["TP-LUXE-POPLIN-BLK"], oldImage: "shirt-poplin-black.jpg",
    targetFilename: "shirt-poplin-luxe-black.jpg", sourceFile: "extended-products.ts",
    label: "Luxe Oversized Crisp Poplin Shirt — Đen tuyền",
    prompt: `${STYLE} of a luxury oversized crisp cotton poplin shirt in deep jet black, boyfriend fit with dropped shoulders, long voluminous sleeves, rounded balloon hem, sharp spread collar, matte black buttons, no wrinkles, fabric with subtle sheen`
  },
  {
    skus: ["TP-LUXE-POPLIN-BLU"], oldImage: "shirt-poplin-blue.jpg",
    targetFilename: "shirt-poplin-luxe-blue.jpg", sourceFile: "extended-products.ts",
    label: "Luxe Oversized Crisp Poplin Shirt — Xanh baby blue",
    prompt: `${STYLE} of a luxury oversized crisp cotton poplin shirt in soft baby blue, boyfriend fit with dropped shoulders, long voluminous sleeves, rounded balloon hem, sharp spread collar, pale blue buttons`
  },
  {
    skus: ["TP-LUXE-POPLIN-WHT"], oldImage: "shirt-poplin-white.jpg",
    targetFilename: "shirt-poplin-luxe-white.jpg", sourceFile: "extended-products.ts",
    label: "Luxe Oversized Crisp Poplin Shirt — Trắng",
    prompt: `${STYLE} of a luxury oversized crisp cotton poplin shirt in pure bright white, boyfriend fit with dropped shoulders, long voluminous sleeves, rounded balloon hem, sharp spread collar, mother-of-pearl buttons`
  },

  // --- Cặp 2: Atelier Wide-Leg Trousers (giữ ảnh cũ) ↔ High-Waist Deep-Pleat Wide Slacks (ảnh mới)
  {
    skus: ["PT-WIDE-PLEAT-BEI"], oldImage: "pants-tailored-wide-beige.jpg",
    targetFilename: "pants-wide-pleat-beige.jpg", sourceFile: "extended-products.ts",
    label: "High-Waist Deep-Pleat Wide Slacks — Be kem",
    prompt: `${STYLE} of luxury high-waisted wide-leg tailored slacks in warm cream beige suiting fabric, two deep sharp front pleats, pressed centre crease, hidden hook closure, clean waistband, extra wide straight leg`
  },
  {
    skus: ["PT-WIDE-PLEAT-BLK"], oldImage: "pants-tailored-wide-black.jpg",
    targetFilename: "pants-wide-pleat-black.jpg", sourceFile: "extended-products.ts",
    label: "High-Waist Deep-Pleat Wide Slacks — Đen công sở",
    prompt: `${STYLE} of luxury high-waisted wide-leg tailored office slacks in jet black wool suiting, two deep sharp front pleats, pressed centre crease, hidden hook closure, extra wide straight leg`
  },
  {
    skus: ["PT-WIDE-PLEAT-BRN"], oldImage: "pants-trousers-brown.jpg",
    targetFilename: "pants-wide-pleat-brown.jpg", sourceFile: "extended-products.ts",
    label: "High-Waist Deep-Pleat Wide Slacks — Nâu mocha",
    prompt: `${STYLE} of luxury high-waisted wide-leg tailored slacks in rich mocha brown suiting fabric, two deep sharp front pleats, pressed centre crease, hidden hook closure, extra wide straight leg`
  },

  // --- Cặp 3: Y2K Low-Rise Flare Jeans (giữ ảnh cũ) ↔ Y2K Mid-Rise Bell-Bottom Flare Jeans (ảnh mới)
  {
    skus: ["PT-FLARE-DENIM-BLK"], oldImage: "pants-flare-denim-black.jpg",
    targetFilename: "pants-flare-midrise-black.jpg", sourceFile: "extended-products.ts",
    label: "Y2K Mid-Rise Bell-Bottom Flare Jeans — Đen wash",
    prompt: `${STYLE} of Y2K mid-rise bell-bottom flare jeans in washed black denim, classic five-pocket construction, belt loops, pronounced flare from the knee, vintage fade texture, visible stitching`
  },
  {
    skus: ["PT-FLARE-DENIM-BLU"], oldImage: "pants-flare-denim-blue.jpg",
    targetFilename: "pants-flare-midrise-blue.jpg", sourceFile: "extended-products.ts",
    label: "Y2K Mid-Rise Bell-Bottom Flare Jeans — Xanh denim",
    prompt: `${STYLE} of Y2K mid-rise bell-bottom flare jeans in classic mid-blue washed denim, five-pocket construction, belt loops, pronounced flare from the knee, contrast stitching, Y2K styling`
  },

  // --- Cặp 4: Pleated High-Waist Schoolgirl Skirt (giữ ảnh cũ) ↔ Tennis Pleated Mini Skirt (ảnh mới)
  {
    skus: ["SK-TENNIS-PLEAT-BLK"], oldImage: "skirt-pleated-mini-black.jpg",
    targetFilename: "skirt-tennis-pleat-black.jpg", sourceFile: "flatlay-products.ts",
    label: "Tennis Pleated Mini Skirt — Đen",
    prompt: `${STYLE} of a preppy tennis pleated mini skirt in black, high elasticated waistband, sharp knife pleats, short A-line silhouette, sporty chic fabric, clean hem`
  },
  {
    skus: ["SK-TENNIS-PLEAT-WHT"], oldImage: "skirt-pleated-mini-white.jpg",
    targetFilename: "skirt-tennis-pleat-white.jpg", sourceFile: "flatlay-products.ts",
    label: "Tennis Pleated Mini Skirt — Trắng",
    prompt: `${STYLE} of a preppy tennis pleated mini skirt in crisp white, high elasticated waistband, sharp knife pleats, short A-line silhouette, sporty chic fabric, clean hem`
  },
  {
    skus: ["SK-TENNIS-PLEAT-GRY"], oldImage: "skirt-pleated-grey.jpg",
    targetFilename: "skirt-tennis-pleat-grey.jpg", sourceFile: "flatlay-products.ts",
    label: "Tennis Pleated Mini Skirt — Xám heather",
    prompt: `${STYLE} of a preppy tennis pleated mini skirt in heather grey, high elasticated waistband, sharp knife pleats, short A-line silhouette, sporty chic technical fabric, clean hem`
  },

  // --- Cặp 5: A-Line Slit Midi Skirt (giữ ảnh cũ) ↔ Satin Bias-Cut Slit Midi Skirt (ảnh mới)
  {
    skus: ["SK-SATIN-SLIT-BEI"], oldImage: "skirt-slit-midi-beige.jpg",
    targetFilename: "skirt-satin-slit-beige.jpg", sourceFile: "extended-products.ts",
    label: "Satin Bias-Cut Slit Midi Skirt — Be champagne",
    prompt: `${STYLE} of a luxury bias-cut satin midi skirt in champagne beige, glossy liquid drape, asymmetric side slit, fluid bias-cut panel, elegant sheen highlights`
  },
  {
    skus: ["SK-SATIN-SLIT-BLK"], oldImage: "skirt-slit-midi-black.jpg",
    targetFilename: "skirt-satin-slit-black.jpg", sourceFile: "extended-products.ts",
    label: "Satin Bias-Cut Slit Midi Skirt — Đen bóng",
    prompt: `${STYLE} of a luxury bias-cut satin midi skirt in glossy jet black, liquid drape, asymmetric side slit, fluid bias-cut panel, high-shine satin highlights`
  },

  // --- Cặp 6: Silk Slip Midi Dress (giữ ảnh cũ) ↔ Noir Silk Slip Midi Dress (ảnh mới)
  {
    skus: ["DR-NOIR-SLIP-RED"], oldImage: "dress-silk-slip-red.jpg",
    targetFilename: "dress-noir-slip-red.jpg", sourceFile: "extended-products.ts",
    label: "Noir Silk Slip Midi Dress — Đỏ rượu",
    prompt: `${STYLE} of a luxury noir silk slip midi dress in deep wine red, delicate spaghetti straps, draped cowl neckline, bias-cut fluid silk, subtle liquid sheen, elegant midi length`
  }
];

type GenResult = { ok: true; data: Buffer; mime: string } | { ok: false; status: number; message: string };

async function generate(model: string, prompt: string): Promise<GenResult> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${prompt}. Portrait 3:4 composition.` }] }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"], imageConfig: { aspectRatio: "3:4" } }
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, status: res.status, message: String(body?.error?.message ?? res.statusText).replace(/\s+/g, " ").slice(0, 300) };
  }
  const parts: any[] = body?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
  if (!img) return { ok: false, status: 200, message: `Không có ảnh trong response (finishReason=${body?.candidates?.[0]?.finishReason ?? "?"})` };
  const inline = img.inlineData ?? img.inline_data;
  return { ok: true, data: Buffer.from(inline.data, "base64"), mime: inline.mimeType ?? inline.mime_type ?? "image/png" };
}

function fileOf(task: Task) {
  return path.join(publicDir, task.targetFilename);
}

function isDone(task: Task) {
  const file = fileOf(task);
  return fs.existsSync(file) && fs.statSync(file).size > 100_000;
}

/** Tìm block object của một sku trong file catalog (hỗ trợ cả key có/không có dấu ngoặc kép). */
function findEntry(source: string, sku: string) {
  const markers = [`"sku": "${sku}"`, `sku: "${sku}"`];
  let start = -1;
  for (const marker of markers) {
    const index = source.indexOf(marker);
    if (index !== -1) { start = index; break; }
  }
  if (start === -1) return null;
  const nextEntry = source.indexOf("\n  {", start);
  const end = nextEntry === -1 ? source.length : nextEntry;
  return { start, end, block: source.slice(start, end) };
}

/** Thay đường dẫn ảnh cũ bằng ảnh mới CHỈ trong object có sku tương ứng. */
function patchSource(task: Task) {
  const sourcePath = path.join(process.cwd(), "src", "lib", task.sourceFile);
  const source = fs.readFileSync(sourcePath, "utf8");
  const found = findEntry(source, task.skus[0]);
  if (!found) return { changed: false, detail: `không tìm thấy ${task.skus[0]} trong ${task.sourceFile}` };
  const replacement = found.block.split(`/products/${task.oldImage}`).join(`/products/${task.targetFilename}`);
  if (replacement === found.block) return { changed: false, detail: `không thấy ${task.oldImage} trong block ${task.skus[0]}` };
  fs.writeFileSync(sourcePath, source.slice(0, found.start) + replacement + source.slice(found.end));
  const count = found.block.split(`/products/${task.oldImage}`).length - 1;
  return { changed: true, detail: `${task.sourceFile} · ${task.skus[0]} · ${count} trường ảnh` };
}

/** Quét đệ quy các file ảnh trong một thư mục (dùng để nhập ảnh đã sinh sẵn). */
function walkImages(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkImages(full));
    else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

/** Tên file theo quy ước Antigravity: top-halter-bodysuit-red.jpg -> top_halter_bodysuit_red */
function antigravityName(task: Task) {
  return task.targetFilename.replace(/\.[a-z0-9]+$/i, "").replace(/-/g, "_").toLowerCase();
}

/** Cập nhật catalog nguồn + database + container cho các ảnh đã sẵn sàng. */
async function applyToProject(ready: Task[], total: number) {
  console.log("\n=== Cập nhật catalog nguồn ===");
  for (const task of ready) {
    const result = patchSource(task);
    console.log(`${result.changed ? "[OK]" : "[BỎ QUA]"} ${task.skus[0]}: ${result.detail}`);
  }

  console.log("\n=== Cập nhật database ===");
  const prisma = new PrismaClient();
  for (const task of ready) {
    const url = `/products/${task.targetFilename}`;
    const res = await prisma.product.updateMany({
      where: { sku: { in: task.skus } },
      data: { image: url, hoverImage: url, tryOnImage: url, images: [url] }
    });
    console.log(`[DB] ${task.skus.join(", ")} -> ${url} (${res.count} dòng)`);
  }
  await prisma.$disconnect();

  console.log("\n=== Copy vào Docker container ===");
  for (const task of ready) {
    for (const container of ["lsoul-web", "lsoul-admin"]) {
      try {
        execSync(`docker cp "${fileOf(task)}" ${container}:/app/public/products/${task.targetFilename}`, { stdio: "ignore" });
        console.log(`[DOCKER] ${task.targetFilename} -> ${container}`);
      } catch {
        console.log(`[DOCKER] bỏ qua ${container} (container không chạy?)`);
      }
    }
  }

  console.log(`\n=== HOÀN TẤT: ${ready.length}/${total} ảnh ===`);
  console.log("Kiểm tra lại: npm run images:audit");
}

async function main() {
  const args = process.argv.slice(2);
  const has = (flag: string) => args.includes(flag);
  const onlyArg = args.find((a) => a.startsWith("--only="))?.slice("--only=".length);
  const only = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim().toUpperCase())) : null;

  const tasks = TASKS.filter((t) => !only || t.skus.some((sku) => only.has(sku)));
  const missing = tasks.filter((t) => !isDone(t));

  if (has("--list") || has("--dry-run")) {
    console.log(`Tổng ${tasks.length} ảnh cần cho ${tasks.length} sản phẩm:\n`);
    for (const task of tasks) {
      const done = isDone(task) ? "ĐÃ CÓ" : "THIẾU";
      console.log(`[${done}] ${task.targetFilename}`);
      console.log(`        ${task.label}  <-- ${task.oldImage}  (${task.skus.join(", ")})`);
    }
    console.log(`\nThiếu: ${missing.length}/${tasks.length}`);
    return;
  }

  if (has("--print-patches")) {
    for (const task of tasks) {
      const sourcePath = path.join(process.cwd(), "src", "lib", task.sourceFile);
      const source = fs.readFileSync(sourcePath, "utf8");
      const found = findEntry(source, task.skus[0]);
      if (!found) { console.log(`[MISS] ${task.skus[0]} không có trong ${task.sourceFile}`); continue; }
      const hits = found.block.split(`/products/${task.oldImage}`).length - 1;
      console.log(`${task.skus[0].padEnd(22)} ${task.sourceFile.padEnd(22)} ${task.oldImage} -> ${task.targetFilename} (${hits} trường)`);
    }
    return;
  }

  if (!key) {
    console.error("Thiếu GEMINI_API_KEY trong .env");
    process.exit(1);
  }

  if (has("--probe")) {
    for (const model of MODELS) {
      const r = await generate(model, "flat lay product photo of a black cotton shirt on white background");
      console.log(model.padEnd(32), r.ok ? `OK (${r.mime}, ${Math.round(r.data.length / 1024)} KB)` : `FAIL ${r.status}: ${r.message}`);
      if (!r.ok && /limit: 0/.test(r.message)) {
        console.log("\n=> Gói free của API key không cho phép model ảnh (limit 0). Cần bật billing cho project của key rồi chạy lại.");
        break;
      }
    }
    return;
  }

  // --- Nhập ảnh đã sinh sẵn (ví dụ từ Antigravity IDE) ---
  const importArg = args.find((a) => a.startsWith("--import="))?.slice("--import=".length);
  if (importArg) {
    const importDir = path.resolve(importArg);
    if (!fs.existsSync(importDir)) {
      console.error(`Không tìm thấy thư mục: ${importDir}`);
      process.exit(1);
    }
    const found = walkImages(importDir);
    console.log(`Quét ${found.length} file ảnh trong ${importDir}\n`);

    const ready: Task[] = [];
    for (const task of tasks) {
      const prefix = antigravityName(task);
      const matches = found
        .filter((file) => path.basename(file).toLowerCase().startsWith(prefix))
        .sort();
      if (!matches.length) {
        console.log(`[THIẾU] ${task.targetFilename}  (không thấy file bắt đầu bằng "${prefix}")`);
        continue;
      }
      const newest = matches[matches.length - 1];
      fs.copyFileSync(newest, fileOf(task));
      console.log(`[NHẬP] ${path.basename(newest)}  ->  ${task.targetFilename}`);
      ready.push(task);
    }
    if (!ready.length) { console.log("\nKhông có ảnh nào được nhập."); return; }
    await applyToProject(ready, tasks.length);
    return;
  }

  // --- In prompt để tự sinh ảnh (dùng cho Antigravity hoặc công cụ khác) ---
  if (has("--prompts")) {
    for (const task of tasks) {
      console.log(`### ${task.label}`);
      console.log(`Lưu file với tên bắt đầu bằng: ${antigravityName(task)}`);
      console.log(`${task.prompt}\n`);
    }
    return;
  }

  // --- Sinh ảnh ---
  const deadModels = new Set<string>();
  const generated: Task[] = [];
  for (const task of tasks) {
    if (!has("--force") && isDone(task)) { console.log(`[SKIP] ${task.targetFilename} (đã có)`); generated.push(task); continue; }
    let ok = false;
    for (const model of MODELS) {
      if (deadModels.has(model)) continue;
      const r = await generate(model, task.prompt);
      if (r.ok) {
        fs.writeFileSync(fileOf(task), r.data);
        console.log(`[OK] ${task.targetFilename} <- ${model} (${Math.round(r.data.length / 1024)} KB)`);
        generated.push(task);
        ok = true;
        break;
      }
      console.log(`  [${model}] ${r.status}: ${r.message}`);
      if ([403, 404, 429].includes(r.status)) {
        deadModels.add(model);
        if (/limit: 0/.test(r.message)) {
          console.log("\n=> API key chưa có quota cho model ảnh (free tier limit 0). Hãy bật billing rồi chạy lại lệnh này.");
        }
      }
    }
    if (!ok) console.log(`[FAIL] ${task.targetFilename}`);
    if (deadModels.size === MODELS.length) { console.log("\nHết model khả dụng, dừng sinh ảnh."); break; }
  }

  const ready = generated.filter((t) => isDone(t));
  if (!ready.length) { console.log("\nKhông có ảnh mới nào để cập nhật."); return; }
  await applyToProject(ready, tasks.length);
}

void main();

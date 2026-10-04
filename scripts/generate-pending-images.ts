/**
 * Sinh ảnh flat-lay thật cho các sản phẩm còn đang dùng ảnh tint/placeholder.
 * Dùng Gemini image models (generateContent + responseModalities IMAGE), tự động fallback model khi hết quota.
 *
 * Usage:
 *   npx tsx scripts/generate-pending-images.ts            # sinh toàn bộ ảnh pending
 *   npx tsx scripts/generate-pending-images.ts --probe    # chỉ kiểm tra model nào còn dùng được
 *   npx tsx scripts/generate-pending-images.ts --only=top_knit_tank_black,shirt_poplin_blue
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { generationTasks, type GenerationTask } from "./generation-queue";

dotenv.config();

const key = process.env.GEMINI_API_KEY?.replace(/^["']|["']$/g, "").trim();
if (!key) {
  console.error("Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

const MODELS = [
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
  "nano-banana-pro-preview",
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
  "gemini-3.1-flash-lite-image",
  "gemini-2.5-flash-image"
];

const publicDir = path.join(process.cwd(), "public", "products");
const args = process.argv.slice(2);
const probeOnly = args.includes("--probe");
const onlyArg = args.find((a) => a.startsWith("--only="))?.slice("--only=".length);
const only = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim())) : null;

function isPending(task: GenerationTask) {
  const filePath = path.join(publicDir, task.targetFilename);
  if (!fs.existsSync(filePath)) return true;
  const stat = fs.statSync(filePath);
  return stat.size < 100000 || (stat.mtime.getHours() === 4 && stat.mtime.getMinutes() >= 9 && stat.mtime.getMinutes() <= 11);
}

type GenResult = { ok: true; data: Buffer; mime: string } | { ok: false; status: number; message: string };

async function generate(model: string, prompt: string): Promise<GenResult> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${prompt}. Portrait 3:4 composition.` }] }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: { aspectRatio: "3:4" }
      }
    })
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, status: res.status, message: String(body?.error?.message ?? res.statusText).slice(0, 160) };
  }
  const parts: any[] = body?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
  if (!img) {
    return { ok: false, status: 200, message: `No image in response (finishReason=${body?.candidates?.[0]?.finishReason ?? "?"})` };
  }
  const inline = img.inlineData ?? img.inline_data;
  return { ok: true, data: Buffer.from(inline.data, "base64"), mime: inline.mimeType ?? inline.mime_type ?? "image/png" };
}

async function main() {
  if (probeOnly) {
    for (const model of MODELS) {
      const r = await generate(model, "A plain white cotton t-shirt laid flat on a white background, product photo");
      console.log(model.padEnd(34), r.ok ? `OK (${r.mime}, ${Math.round(r.data.length / 1024)} KB)` : `FAIL ${r.status}: ${r.message}`);
    }
    return;
  }

  const pending = generationTasks.filter((t) => (only ? only.has(t.imageName) : isPending(t)));
  console.log(`=== ${pending.length} image(s) to generate ===`);

  const deadModels = new Set<string>();
  let done = 0;
  const failed: string[] = [];

  for (const task of pending) {
    let success = false;
    for (const model of MODELS) {
      if (deadModels.has(model)) continue;
      const r = await generate(model, task.prompt);
      if (r.ok) {
        const dest = path.join(publicDir, task.targetFilename);
        fs.writeFileSync(dest, r.data);
        console.log(`[OK] ${task.targetFilename} <- ${model} (${r.mime}, ${Math.round(r.data.length / 1024)} KB)`);
        success = true;
        done++;
        break;
      }
      console.log(`  [${model}] ${r.status}: ${r.message}`);
      // Quota / not found / permission => stop using this model for the rest of the run
      if ([403, 404, 429].includes(r.status)) deadModels.add(model);
    }
    if (!success) {
      failed.push(task.targetFilename);
      if (deadModels.size === MODELS.length) {
        console.log("All models exhausted, stopping.");
        break;
      }
    }
  }

  console.log(`\n=== DONE: ${done}/${pending.length} generated ===`);
  if (failed.length) console.log("Failed:", failed.join(", "));
}

main();

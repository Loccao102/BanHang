import { Client, handle_file } from "@gradio/client";
import fs from "node:fs";
import path from "node:path";

const SPACE = "fashn-ai/fashn-vton-1.5";

export type HfFashnPhotoType = "flat-lay" | "model";
export type HfFashnCategory = "tops" | "bottoms" | "one-pieces";

export function extractUrl(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.startsWith("http") ? value : undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractUrl(item);
      if (found) return found;
    }
    return undefined;
  }

  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    for (const key of ["url", "path", "download_url", "image"]) {
      const found = extractUrl(object[key]);
      if (found) return found;
    }
  }

  return undefined;
}

export function clientOptions() {
  const token = process.env.HF_TOKEN?.trim();
  const hfToken = token && token.startsWith("hf_")
    ? (token as `hf_${string}`)
    : undefined;

  return hfToken ? { token: hfToken } : undefined;
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".avif") return "image/avif";
  return "image/jpeg";
}

export function tryReadLocalFile(filePathOrUrl: string): { bytes: Buffer; mime: string } | null {
  let pathname = filePathOrUrl;
  if (filePathOrUrl.startsWith("http://") || filePathOrUrl.startsWith("https://")) {
    try {
      pathname = new URL(filePathOrUrl).pathname;
    } catch {
      pathname = filePathOrUrl;
    }
  }

  pathname = pathname.split("?")[0].split("#")[0];

  const candidates: string[] = [];
  if (path.isAbsolute(pathname) && fs.existsSync(pathname)) {
    candidates.push(pathname);
  }

  const cleanRelative = pathname.replace(/^(\/|\\)+/, "");
  candidates.push(
    path.join(process.cwd(), "public", cleanRelative),
    path.resolve(process.cwd(), "public", cleanRelative)
  );

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const stat = fs.statSync(candidate);
        if (stat.isFile()) {
          const bytes = fs.readFileSync(candidate);
          const mime = getMimeType(candidate);
          return { bytes, mime };
        }
      } catch {
        // ignore and continue
      }
    }
  }

  return null;
}

export function imageSourceToDataUri(source: string): string | null {
  if (source.startsWith("data:image/")) return source;

  const local = tryReadLocalFile(source);
  if (local) {
    return `data:${local.mime};base64,${local.bytes.toString("base64")}`;
  }

  return null;
}

export function resolveImageSource(source: string, baseUrl?: string) {
  if (source.startsWith("data:image/") || source.startsWith("https://")) return source;

  if (tryReadLocalFile(source)) return source;

  if (source.startsWith("/") && baseUrl) {
    return new URL(source, baseUrl).toString();
  }

  return source;
}

export async function sourceToBlob(source: string, label: string): Promise<Blob> {
  if (source.startsWith("data:image/")) {
    const match = source.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) throw new Error(`${label} dạng data URI không hợp lệ.`);
    const bytes = Buffer.from(match[2], "base64");
    if (!bytes.length) throw new Error(`${label} rỗng.`);
    if (bytes.length > 15 * 1024 * 1024) throw new Error(`${label} vượt quá 15 MB.`);
    return new Blob([new Uint8Array(bytes)], { type: match[1] });
  }

  const local = tryReadLocalFile(source);
  if (local) {
    if (!local.bytes.length) throw new Error(`${label} rỗng.`);
    return new Blob([new Uint8Array(local.bytes)], { type: local.mime });
  }

  if (source.startsWith("http://") || source.startsWith("https://")) {
    try {
      const response = await fetch(source, {
        cache: "no-store",
        headers: { "User-Agent": "Mozilla/5.0 LSOUL-TryOn/1.0" }
      });
      if (!response.ok) {
        throw new Error(`Không tải được ${label} (${response.status}).`);
      }

      const blob = await response.blob();
      if (!blob.size) throw new Error(`${label} rỗng.`);
      if (blob.size > 15 * 1024 * 1024) throw new Error(`${label} vượt quá 15 MB.`);
      return blob;
    } catch (error) {
      throw new Error(`Lỗi kết nối tải ${label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`${label} phải là URL hợp lệ, đường dẫn file nội bộ hoặc data image.`);
}

export async function runHuggingFaceFashn(input: {
  modelImage: string;
  garmentImage: string;
  category: HfFashnCategory;
  photoType: HfFashnPhotoType;
  baseUrl?: string;
  segmentationFree?: boolean;
}) {
  const modelImage = resolveImageSource(input.modelImage, input.baseUrl);
  const garmentImage = resolveImageSource(input.garmentImage, input.baseUrl);

  const [person, garment] = await Promise.all([
    sourceToBlob(modelImage, "ảnh người"),
    sourceToBlob(garmentImage, "ảnh trang phục")
  ]);

  const app = await Client.connect(SPACE, clientOptions());
  const result = await app.predict("/try_on", [
    handle_file(person),
    handle_file(garment),
    input.category,
    input.photoType,
    40,
    1.5,
    42,
    input.segmentationFree ?? false
  ]);

  const data = (result as { data?: unknown[] }).data ?? [];
  const output = extractUrl(data[0]);

  if (!output) {
    throw new Error(
      "Hugging Face FASHN VTON không trả ảnh. ZeroGPU có thể đang quá tải hoặc hết quota."
    );
  }

  return output;
}

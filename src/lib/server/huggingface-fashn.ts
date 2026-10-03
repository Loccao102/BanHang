import { Client, handle_file } from "@gradio/client";

const SPACE = "fashn-ai/fashn-vton-1.5";

export type HfFashnPhotoType = "flat-lay" | "model";
export type HfFashnCategory = "tops" | "bottoms" | "one-pieces";

function extractUrl(value: unknown): string | undefined {
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

function clientOptions() {
  const token = process.env.HF_TOKEN?.trim();
  const hfToken = token && token.startsWith("hf_")
    ? (token as `hf_${string}`)
    : undefined;

  return hfToken ? { token: hfToken } : undefined;
}

function resolveImageSource(source: string, baseUrl?: string) {
  if (source.startsWith("data:image/") || source.startsWith("https://")) return source;

  // Product images in this project are commonly stored as /products/*.jpg.
  // Resolve them against the current app origin before uploading the bytes to HF.
  if (source.startsWith("/") && baseUrl) {
    return new URL(source, baseUrl).toString();
  }

  return source;
}

function isLocalHttpUrl(source: string) {
  try {
    const url = new URL(source);
    return (
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1")
    );
  } catch {
    return false;
  }
}

async function sourceToBlob(source: string, label: string) {
  if (source.startsWith("data:image/")) {
    const match = source.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) throw new Error(`${label} dạng data URI không hợp lệ.`);
    const bytes = Buffer.from(match[2], "base64");
    if (!bytes.length) throw new Error(`${label} rỗng.`);
    if (bytes.length > 10 * 1024 * 1024) throw new Error(`${label} vượt quá 10 MB.`);
    return new Blob([bytes], { type: match[1] });
  }

  if (!source.startsWith("https://") && !isLocalHttpUrl(source)) {
    throw new Error(`${label} phải là HTTPS hoặc data image.`);
  }

  const response = await fetch(source, {
    cache: "no-store",
    headers: { "User-Agent": "Mozilla/5.0 LSOUL-TryOn/1.0" }
  });
  if (!response.ok) {
    throw new Error(`Không tải được ${label} để gửi sang Hugging Face (${response.status}).`);
  }

  const blob = await response.blob();
  if (!blob.size) throw new Error(`${label} rỗng.`);
  if (blob.size > 10 * 1024 * 1024) throw new Error(`${label} vượt quá 10 MB.`);
  return blob;
}

export async function runHuggingFaceFashn(input: {
  modelImage: string;
  garmentImage: string;
  category: HfFashnCategory;
  photoType: HfFashnPhotoType;
  baseUrl?: string;
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
    true
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

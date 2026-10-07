import { Client } from "@gradio/client";

/**
 * Làm nét ảnh kết quả thử đồ bằng siêu phân giải (Real-ESRGAN trên Hugging Face Space).
 *
 * Vì sao cần: các nguồn VTON miễn phí chỉ trả ảnh ~576–768 px chiều ngang, khi hiển thị
 * ở khung lớn (hoặc màn hình retina) ảnh bị phóng to và mờ. Siêu phân giải 2× giúp ảnh
 * nét thật khi xem lớn mà không cần bật billing cho API key Gemini.
 *
 * Cấu hình:
 *   TRYON_UPSCALE=2|4|off      (mặc định 2) — hệ số phóng
 *   TRYON_UPSCALE_SPACE=<space> (mặc định Nick088/Real-ESRGAN_Pytorch)
 *
 * Mọi lỗi đều được nuốt và trả lại ảnh gốc để không làm hỏng luồng thử đồ.
 */
const DEFAULT_SPACE = "Nick088/Real-ESRGAN_Pytorch";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function hfToken() {
  return process.env.HF_TOKEN?.replace(/^["']|["']$/g, "").trim();
}

async function toBlob(source: string): Promise<Blob | null> {
  if (source.startsWith("data:image/")) {
    const comma = source.indexOf(",");
    if (comma === -1) return null;
    const mime = /data:([^;]+)/.exec(source)?.[1] ?? "image/png";
    return new Blob([Buffer.from(source.slice(comma + 1), "base64")], { type: mime });
  }
  if (/^https?:/i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) return null;
    const mime = (response.headers.get("content-type") ?? "image/png").split(";")[0];
    return new Blob([Buffer.from(await response.arrayBuffer())], { type: mime });
  }
  return null;
}

function pickImageUrl(data: unknown): string | null {
  if (!Array.isArray(data)) return null;
  for (const item of data) {
    if (typeof item === "string" && /^https?:/.test(item)) return item;
    const candidate = item as { url?: string; path?: string } | null;
    if (candidate?.url) return candidate.url;
  }
  return null;
}

export async function upscaleImage(source: string, factor: number): Promise<string> {
  const space = process.env.TRYON_UPSCALE_SPACE?.trim() || DEFAULT_SPACE;
  const token = hfToken();

  const blob = await toBlob(source);
  if (!blob) return source;

  const client = await Client.connect(space, token ? { token: token as `hf_${string}` } : undefined);
  const result = await client.predict("/predict", { img: blob, size_modifier: factor });
  const url = pickImageUrl((result as { data?: unknown }).data);
  if (!url) return source;

  const response = await fetch(url);
  if (!response.ok) return source;
  const mime = (response.headers.get("content-type") ?? "image/webp").split(";")[0];
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return source;

  return `data:${mime};base64,${buffer.toString("base64")}`;
}

/** Bọc một promise với thời hạn; hết hạn trả về null thay vì treo request. */
export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

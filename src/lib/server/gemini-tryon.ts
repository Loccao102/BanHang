import type { Product } from "@/lib/products";
import { imageSourceToDataUri, tryReadLocalFile } from "./huggingface-fashn";

type GeminiTryOnInput = {
  modelImage: string;
  products: Product[];
  apiKey?: string;
};

function extractBase64(source: string): { mimeType: string; base64: string } | null {
  if (source.startsWith("data:image/")) {
    const match = source.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (match) return { mimeType: match[1], base64: match[2] };
  }

  const local = tryReadLocalFile(source);
  if (local) {
    return { mimeType: local.mime, base64: local.bytes.toString("base64") };
  }

  return null;
}

/**
 * Đọc kích thước ảnh JPEG trực tiếp từ header (không cần thư viện giải mã ảnh)
 * để yêu cầu Gemini trả kết quả đúng tỷ lệ với ảnh người dùng.
 */
function jpegSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue; }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) return null;
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

const ASPECT_RATIOS: Array<[number, string]> = [
  [1, "1:1"], [3 / 4, "3:4"], [2 / 3, "2:3"], [9 / 16, "9:16"],
  [4 / 5, "4:5"], [4 / 3, "4:3"], [3 / 2, "3:2"], [5 / 4, "5:4"],
  [16 / 9, "16:9"], [21 / 9, "21:9"]
];

function closestAspectRatio(base64: string, mimeType: string): string {
  try {
    const buffer = Buffer.from(base64, "base64");
    const size = mimeType.includes("jpeg") || mimeType.includes("jpg") ? jpegSize(buffer) : null;
    if (!size?.width || !size?.height) return "3:4";
    const ratio = size.width / size.height;
    return ASPECT_RATIOS.reduce((best, item) =>
      Math.abs(item[0] - ratio) < Math.abs(best[0] - ratio) ? item : best
    )[1];
  } catch {
    return "3:4";
  }
}

export async function runGeminiTryOn(input: GeminiTryOnInput): Promise<string> {
  const rawKey = input.apiKey || process.env.GEMINI_API_KEY || "";
  const key = rawKey.replace(/^["']|["']$/g, "").trim();
  if (!key) throw new Error("Chưa cấu hình GEMINI_API_KEY cho hệ thống.");

  const modelData = extractBase64(input.modelImage);
  if (!modelData) throw new Error("Không thể đọc ảnh người mẫu để gửi sang Gemini.");

  // Build garment description and collect parts
  const garmentParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
  const descriptions: string[] = [];

  for (let i = 0; i < input.products.length; i++) {
    const p = input.products[i];
    const gSource = p.tryOnImage || p.image;
    const gData = extractBase64(gSource);
    if (gData) {
      garmentParts.push({ inlineData: { mimeType: gData.mimeType, data: gData.base64 } });
      const length = p.lengthClass || (
        p.type === "maxi-dress" ? "maxi" :
        p.type === "midi-dress" ? "midi" :
        p.type === "mini-dress" ? "mini" :
        "unspecified"
      );
      descriptions.push(
        `- Garment ${i + 1}: category=${p.category}, type=${p.type}, length=${length}, name="${p.name}", color=${p.color}, fabric=${p.material}, silhouette=${p.silhouette || p.fit || "tailored"}.`
      );
    }
  }

  const prompt = `You are a high-end AI Virtual Fitting Room and Fashion Stylist for luxury fashion brand LSOUL.
Task: Realistically fit and dress the person shown in the first image with the exact coordinated outfit from the provided garment reference images.

Selected Outfit items to wear:
${descriptions.join("\n")}

CRITICAL FITTING RULES:
1. PRESERVE THE PERSON: Keep the exact same person, face, facial features, hair, skin tone, body proportions, and pose from the original person photo. Do not distort the person's face or body.
2. COORDINATED OUTFIT LAYERING:
   - If an outerwear (blazer/jacket) and a top (corset/tee/shirt) are both selected: The person wears the top underneath, and the outerwear worn open or draped elegantly over the shoulders so that the inner top is naturally visible beneath.
   - If a bottom (skirt/shorts) is selected and the person is wearing long pants: Transform the lower body cleanly to wear the selected skirt/shorts, rendering natural realistic bare legs and knees if wearing a mini skirt or shorts.
   - If a dress/one-piece is selected: The person wears ONE continuous dress as a complete look from the neckline/shoulders through the torso and down to the hem. Never split a dress into a separate top + skirt.
   - MAXI DRESS LENGTH IS A HARD CONSTRAINT: when length=maxi, the hem must reach the ankles or floor exactly as indicated by the reference. Do not crop it to knee, thigh, or mini length. Do not convert it into a skirt.
   - MIDI DRESS LENGTH IS A HARD CONSTRAINT: when length=midi, the hem must stay below the knee / around mid-calf according to the reference.
   - Preserve the continuous vertical silhouette of long dresses. Do not invent a horizontal waistband, exposed midriff, separate blouse, or separate skirt unless those elements visibly exist in the garment reference.
3. PRESERVE GARMENT DETAILS: Accurately replicate the exact color, fabric sheen (satin, tweed, velvet, denim), neckline, waist construction, hem length, cuts, slits, draping, and buttons of the reference garment images. Garment LENGTH has equal priority to color and silhouette.
4. PHOTOREALISM: Ensure clean, professional studio lighting, realistic fabric folds, natural seams, and seamless shadows. No cartoon, no anime, no visual artifacts, no weird holes or cutout glitches around the collar. Output high resolution fashion editorial quality.`;

  const parts: unknown[] = [
    { text: prompt },
    { inlineData: { mimeType: modelData.mimeType, data: modelData.base64 } },
    ...garmentParts
  ];

  const aspectRatio = closestAspectRatio(modelData.base64, modelData.mimeType);

  // Ưu tiên model ảnh chất lượng cao (hỗ trợ imageSize 2K) rồi mới tới model nhanh đang dùng ổn định.
  const models = [
    "gemini-3-pro-image",
    "nano-banana-pro-preview",
    "gemini-3.1-flash-image",
    "gemini-2.5-flash-image",
    "gemini-3-pro-image-preview"
  ];

  // Mỗi model thử lần lượt: 2K -> chỉ tỷ lệ khung -> không cấu hình (giữ nguyên hành vi cũ).
  // Nhờ vậy ảnh trả về nét hơn khi model hỗ trợ, và vẫn chạy được với model không hỗ trợ imageSize.
  // Có thể chỉnh độ phân giải bằng TRYON_IMAGE_SIZE (1K / 2K / 4K) — mặc định 2K cho ảnh nét trên màn hình retina.
  const preferredSize = (process.env.TRYON_IMAGE_SIZE || "2K").trim().toUpperCase();
  const configs: Array<{ imageSize?: string; aspectRatio: string } | null> = [
    { imageSize: preferredSize, aspectRatio },
    { aspectRatio },
    null
  ];

  let lastError = "";

  for (const model of models) {
    for (const config of configs) {
      try {
        const body: Record<string, unknown> = { contents: [{ parts }] };
        if (config) {
          body.generationConfig = {
            responseModalities: ["IMAGE", "TEXT"],
            imageConfig: config
          };
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          lastError = `Gemini ${model} HTTP ${response.status}: ${errorText.slice(0, 200)}`;
          // Model không tồn tại / hết quota / không có quyền -> bỏ model này.
          if ([404, 429, 403].includes(response.status)) break;
          // 400: cấu hình (imageSize/aspectRatio) chưa được model hỗ trợ -> thử cấu hình kế tiếp.
          continue;
        }

        const data = await response.json();
        const candidateParts = data?.candidates?.[0]?.content?.parts || [];

        // Check for inline image output
        for (const part of candidateParts) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || "image/jpeg";
            return `data:${mime};base64,${part.inlineData.data}`;
          }
        }

        // If the model returned text with an image URL or description
        lastError = `Gemini ${model} không trả về dữ liệu ảnh inline.`;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }
  }

  throw new Error(`Gemini Try-On tạm thời không khả dụng: ${lastError}`);
}

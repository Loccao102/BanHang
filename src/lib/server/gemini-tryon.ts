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
      descriptions.push(
        `- Garment ${i + 1} (${p.category}): "${p.name}", color ${p.color}, fabric ${p.material}, silhouette ${p.silhouette || p.fit || "tailored"}.`
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
   - If a dress/one-piece is selected: The person wears the dress as a complete look.
3. PRESERVE GARMENT DETAILS: Accurately replicate the exact color, fabric sheen (satin, tweed, velvet, denim), cuts, and buttons of the reference garment images.
4. PHOTOREALISM: Ensure clean, professional studio lighting, realistic fabric folds, natural seams, and seamless shadows. No cartoon, no anime, no visual artifacts, no weird holes or cutout glitches around the collar. Output high resolution fashion editorial quality.`;

  const parts: unknown[] = [
    { text: prompt },
    { inlineData: { mimeType: modelData.mimeType, data: modelData.base64 } },
    ...garmentParts
  ];

  const models = [
    "gemini-2.5-flash-image",
    "gemini-3-pro-image-preview",
    "gemini-flash-latest"
  ];

  let lastError = "";

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }]
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `Gemini ${model} HTTP ${response.status}: ${errorText.slice(0, 200)}`;
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
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  throw new Error(`Gemini Try-On tạm thời không khả dụng: ${lastError}`);
}

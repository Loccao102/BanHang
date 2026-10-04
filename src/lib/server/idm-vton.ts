import { Client, handle_file } from "@gradio/client";
import { resolveImageSource, sourceToBlob, extractUrl, clientOptions } from "./huggingface-fashn";
import type { Product } from "@/lib/products";

const IDM_SPACE = "yisol/IDM-VTON";

export async function runIdmVton(input: {
  modelImage: string;
  garmentImage: string;
  product?: Product;
  garmentDescription?: string;
  baseUrl?: string;
  isOuterwearLayer?: boolean;
}): Promise<string> {
  const modelImage = resolveImageSource(input.modelImage, input.baseUrl);
  const garmentImage = resolveImageSource(input.garmentImage, input.baseUrl);

  const [person, garment] = await Promise.all([
    sourceToBlob(modelImage, "ảnh người"),
    sourceToBlob(garmentImage, "ảnh trang phục")
  ]);

  let description = input.garmentDescription || "";
  if (!description && input.product) {
    const p = input.product;
    if (p.category === "outerwear") {
      description = `${p.name}, open front ${p.color} luxury tailored blazer suit jacket outerwear`;
    } else if (p.category === "tops") {
      description = `${p.name}, ${p.color} ${p.silhouette || "fitted"} top`;
    } else {
      description = `${p.name}, ${p.color} garment`;
    }
  }
  if (!description) {
    description = "fashion garment";
  }

  const app = await Client.connect(IDM_SPACE, clientOptions());
  const result = await app.predict("/tryon", [
    {
      background: handle_file(person),
      layers: [],
      composite: null
    },
    handle_file(garment),
    description,
    true, // is_checked (auto-masking)
    false, // is_checked_crop
    30, // denoise_steps
    42 // seed
  ]);

  const data = (result as { data?: unknown[] }).data ?? [];
  const output = extractUrl(data[0]);

  if (!output) {
    throw new Error(
      "Hugging Face IDM-VTON không trả ảnh. ZeroGPU có thể đang quá tải hoặc hết quota."
    );
  }

  return output;
}

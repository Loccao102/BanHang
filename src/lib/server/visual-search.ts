import fs from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import { products as fallbackCatalog, type Product } from "@/lib/products";
import { getDb } from "@/lib/server/db";
import { fromProductRow } from "@/lib/server/product-db";
import { buildProductSemanticText } from "@/lib/server/product-semantic-profile";

export type VisualAnalysisResult = {
  category: string;
  type: string;
  color: string;
  colorFamily: string;
  silhouette: string;
  style: string;
  vibe: string;
  keyFeatures: string[];
  visualSummary: string;
  searchQuery: string;
};

export type VisualMatchItem = {
  product: Product;
  matchScore: number; // 0 - 100
  matchPercent: number;
  reasons: string[];
};

export type VisualSearchResponse = {
  success: boolean;
  analysis: VisualAnalysisResult;
  results: VisualMatchItem[];
  source: "gemini-vision" | "smart-heuristic";
};

function getGeminiApiKey(): string {
  return (process.env.GEMINI_API_KEY ?? "").replace(/^["']|["']$/g, "").trim();
}

/**
 * Trích xuất mimeType và dữ liệu base64 từ data URI, file local hoặc URL.
 */
export async function resolveImageBytes(source: string): Promise<{ mimeType: string; base64: string } | null> {
  if (!source) return null;

  // Case 1: Data URI
  if (source.startsWith("data:image/")) {
    const match = source.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], base64: match[2] };
    }
  }

  // Case 2: Đường dẫn local trong public/
  if (source.startsWith("/") || source.startsWith("products/")) {
    const cleanPath = source.replace(/^\/+/, "");
    const localFilePath = path.join(process.cwd(), "public", cleanPath);
    if (fs.existsSync(localFilePath)) {
      const ext = path.extname(localFilePath).toLowerCase();
      const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
      const buffer = fs.readFileSync(localFilePath);
      return { mimeType: mime, base64: buffer.toString("base64") };
    }
  }

  // Case 3: URL từ xa (fetch và convert)
  if (/^https?:\/\//i.test(source)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(source, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const mime = res.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await res.arrayBuffer();
      return {
        mimeType: mime.split(";")[0].trim(),
        base64: Buffer.from(arrayBuffer).toString("base64")
      };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Dùng Gemini Vision để phân tích hình ảnh trang phục.
 */
export async function analyzeImageWithGemini(
  imageData: { mimeType: string; base64: string }
): Promise<VisualAnalysisResult | null> {
  const key = getGeminiApiKey();
  if (!key) return null;

  const prompt = `Bạn là Giám đốc Sáng tạo và Chuyên gia Thị giác Thời trang của thương hiệu thiết kế LSOUL (Việt Nam).
Hãy phân tích bức ảnh thời trang này thật chi tiết để phục vụ tìm kiếm sản phẩm tương đồng trong catalog LSOUL.

Yêu cầu xuất kết quả theo định dạng JSON chuẩn (chỉ xuất JSON, không bọc markdown hay text thừa):
{
  "category": "dress | tops | bottoms | outerwear | set (chọn 1 mục phù hợp nhất)",
  "type": "loại chi tiết, ví dụ: corset, baby-tee, mini-skirt, pleated-skirt, flare-pants, bodycon-dress, maxi-dress, blazer...",
  "color": "tên màu tiếng Việt (ví dụ: Đen, Trắng, Đỏ mận, Xanh navy, Be sữa...)",
  "colorFamily": "black | white | red | pink | blue | beige | brown | green | gray",
  "silhouette": "form dáng, ví dụ: ôm sát, xòe nhẹ, suông, cạp cao, đan dây...",
  "style": "phong cách, ví dụ: Y2K quyến rũ, tiệc tùng sang chảnh, thanh lịch, cá tính đường phố",
  "vibe": "tính từ mô tả ngắn gọn thần thái trang phục",
  "keyFeatures": ["đặc điểm 1", "đặc điểm 2", "đặc điểm 3", "đặc điểm 4"],
  "visualSummary": "tóm tắt ngắn gọn 1-2 câu về trang phục bằng tiếng Việt để hiển thị cho khách hàng",
  "searchQuery": "cụm từ khóa tìm kiếm tiếng Việt tốt nhất phản ánh kiểu dáng, chất liệu, màu sắc và phong cách"
}`;

  const models = [
    process.env.GEMINI_MODEL?.trim() || "gemini-flash-lite-latest",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash",
    "gemini-1.5-flash"
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: imageData.mimeType,
                    data: imageData.base64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (rawText) {
          const parsed = JSON.parse(rawText) as VisualAnalysisResult;
          if (parsed.category && parsed.searchQuery) {
            return parsed;
          }
        }
      }
    } catch {
      // Fallback to next model
    }
  }

  return null;
}

/**
 * Fallback khi không có API key hoặc network lỗi: Phân tích heuristic dựa trên tên file hoặc pattern
 */
export function heuristicVisualAnalysis(sourcePath: string): VisualAnalysisResult {
  const lower = sourcePath.toLowerCase();

  let category = "tops";
  let type = "corset";
  let color = "Đen";
  let colorFamily = "black";
  let style = "Y2K Gợi Cảm";
  let visualSummary = "Áo corset đen gọng định hình ôm eo tôn dáng";
  let searchQuery = "áo corset đen ôm eo";
  let features = ["Gọng định hình", "Màu đen", "Cúp ngực gợi cảm", "Dây đan sau lưng"];

  if (lower.includes("dress") || lower.includes("dam") || lower.includes("vay")) {
    category = "dress";
    type = lower.includes("slip") ? "slip-dress" : lower.includes("maxi") ? "maxi-dress" : "bodycon-dress";
    visualSummary = "Đầm ôm bodycon gợi cảm, tôn đường cong quyến rũ";
    searchQuery = "đầm bodycon tôn dáng";
    features = ["Phom ôm sát", "Chất liệu co giãn", "Tôn đường cong"];
  } else if (lower.includes("skirt") || lower.includes("chan-vay")) {
    category = "bottoms";
    type = lower.includes("pleat") ? "pleated-skirt" : "mini-skirt";
    visualSummary = "Chân váy ngắn xếp ly trẻ trung phong cách Y2K";
    searchQuery = "chân váy xếp ly ngắn";
    features = ["Xếp ly", "Cạp cao", "Dáng ngắn trẻ trung"];
  } else if (lower.includes("pants") || lower.includes("quan")) {
    category = "bottoms";
    type = lower.includes("flare") ? "flare-pants" : "wide-pants";
    visualSummary = "Quần ống loe cạp cao kéo dài chân thanh lịch";
    searchQuery = "quần ống loe cạp cao";
    features = ["Ống loe", "Cạp cao", "Hack dáng"];
  } else if (lower.includes("blazer") || lower.includes("jacket") || lower.includes("coat")) {
    category = "outerwear";
    type = "blazer";
    visualSummary = "Áo khoác blazer chiết eo thời thượng phong cách quý cô";
    searchQuery = "áo blazer chiết eo";
    features = ["Chiết eo", "Phom đứng", "Thanh lịch"];
  }

  if (lower.includes("red") || lower.includes("do")) {
    color = "Đỏ";
    colorFamily = "red";
  } else if (lower.includes("white") || lower.includes("trang")) {
    color = "Trắng";
    colorFamily = "white";
  } else if (lower.includes("blue") || lower.includes("xanh")) {
    color = "Xanh";
    colorFamily = "blue";
  } else if (lower.includes("beige") || lower.includes("be")) {
    color = "Be";
    colorFamily = "beige";
  }

  return {
    category,
    type,
    color,
    colorFamily,
    silhouette: "ôm sát cơ thể",
    style,
    vibe: "Tự tin, nổi bật",
    keyFeatures: features,
    visualSummary,
    searchQuery: `${searchQuery} màu ${color.toLowerCase()}`
  };
}

/**
 * Lấy danh sách sản phẩm từ DB hoặc fallback catalog
 */
async function getCatalogProducts(db: PrismaClient | null): Promise<Product[]> {
  if (db) {
    try {
      const rows = await db.product.findMany({
        where: { active: true },
        include: { variants: true }
      });
      if (rows.length > 0) {
        return rows.map((r) => fromProductRow(r as any));
      }
    } catch {
      // Fallback
    }
  }
  return fallbackCatalog.filter((p) => p.active !== false);
}

/**
 * Tìm kiếm và chấm điểm độ tương đồng của sản phẩm dựa trên phân tích thị giác
 */
export async function matchProductsFromVisualAnalysis(
  analysis: VisualAnalysisResult
): Promise<VisualMatchItem[]> {
  const db = getDb();
  const catalog = await getCatalogProducts(db);

  const targetCategory = analysis.category.toLowerCase();
  const targetFamily = analysis.colorFamily.toLowerCase();
  const targetType = analysis.type.toLowerCase();

  const scored: VisualMatchItem[] = [];

  for (const product of catalog) {
    if (product.stock <= 0 && product.active === false) continue;

    let score = 0;
    const reasons: string[] = [];

    // 1. Phù hợp Danh mục (Category)
    const prodCategory = (product.category || "").toLowerCase();
    if (prodCategory === targetCategory) {
      score += 35;
      reasons.push(`Cùng danh mục ${targetCategory === "tops" ? "áo/corset" : targetCategory === "dress" ? "đầm" : targetCategory === "bottoms" ? "quần/chân váy" : "áo khoác"}`);
    } else if (
      (targetCategory === "tops" && prodCategory === "dress") ||
      (targetCategory === "dress" && prodCategory === "tops")
    ) {
      score += 10;
    }

    // 2. Phù hợp Kiểu dáng (Type / Silhouette)
    const prodType = (product.type || "").toLowerCase();
    const prodName = product.name.toLowerCase();
    const prodSubtitle = product.subtitle.toLowerCase();

    if (prodType === targetType || prodName.includes(targetType) || prodSubtitle.includes(targetType)) {
      score += 25;
      reasons.push(`Kiểu dáng tương đồng (${analysis.type})`);
    } else if (
      (targetType.includes("corset") && (prodName.includes("corset") || prodType.includes("corset"))) ||
      (targetType.includes("skirt") && prodCategory === "bottoms") ||
      (targetType.includes("flare") && prodName.includes("loe"))
    ) {
      score += 20;
      reasons.push("Đồng điệu về phom dáng thiết kế");
    }

    // 3. Phù hợp Tông màu (Color Family)
    const prodColorFamily = (product.colorFamily || "").toLowerCase();
    if (prodColorFamily === targetFamily) {
      score += 25;
      reasons.push(`Tông màu tương thích (${analysis.color})`);
    } else if (
      (targetFamily === "black" && prodColorFamily === "navy") ||
      (targetFamily === "white" && prodColorFamily === "beige")
    ) {
      score += 10;
      reasons.push("Tông màu cùng sắc độ hài hòa");
    }

    // 4. Phù hợp Phong cách & Chi tiết (Key features & Vibe)
    const semanticText = buildProductSemanticText(product).toLowerCase();
    let featureMatches = 0;
    for (const feat of analysis.keyFeatures) {
      const featLower = feat.toLowerCase();
      if (semanticText.includes(featLower) || prodName.includes(featLower)) {
        score += 5;
        featureMatches++;
      }
    }
    if (featureMatches > 0) {
      reasons.push(`Chi tiết thiết kế đồng điệu (${featureMatches} điểm chung)`);
    }

    // Tinh chỉnh điểm tối đa về khoảng 65 - 98%
    const normalizedScore = Math.min(98, Math.max(50, Math.round(score)));

    // Chỉ lấy các sản phẩm có độ tương đồng đủ tốt
    if (score >= 35) {
      scored.push({
        product,
        matchScore: normalizedScore,
        matchPercent: normalizedScore,
        reasons: reasons.slice(0, 3)
      });
    }
  }

  // Sắp xếp theo điểm tương đồng giảm dần
  scored.sort((a, b) => b.matchScore - a.matchScore);

  return scored.slice(0, 12);
}

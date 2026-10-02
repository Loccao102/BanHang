import type { Prisma } from "@prisma/client";
import type { Product } from "@/lib/products";
import { stylistVerdict, type StylistAssessment } from "@/lib/stylist-assessment";

type StyleProfileLike = {
  preferredCategories: Prisma.JsonValue;
  preferredTypes: Prisma.JsonValue;
  preferredColors: Prisma.JsonValue;
  preferredStyles: Prisma.JsonValue;
  preferredOccasions: Prisma.JsonValue;
  preferredFits: Prisma.JsonValue;
  confidence: number;
  eventCount: number;
};

type VisionResult = {
  colorScore?: unknown;
  proportionScore?: unknown;
  styleScore?: unknown;
  renderConfidence?: unknown;
  summary?: unknown;
  positives?: unknown;
  cautions?: unknown;
  suggestions?: unknown;
};

const neutralColors = new Set(["black", "white", "gray", "beige"]);
const goodPairs = new Set([
  "black:white", "black:red", "black:pink", "black:blue", "black:beige",
  "white:blue", "white:navy", "white:red", "white:green", "white:brown",
  "beige:brown", "beige:green", "beige:navy", "beige:red",
  "gray:pink", "gray:blue", "gray:navy", "gray:red",
  "blue:brown", "blue:white", "navy:beige", "navy:white", "pink:brown"
]);

function clampScore(value: unknown, fallback = 72) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 360) : fallback;
}

function cleanList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const result = value.map((item) => cleanText(item)).filter(Boolean).slice(0, 3);
  return result.length ? result : fallback;
}

function readScoreMap(value: Prisma.JsonValue | undefined) {
  if (!value || Array.isArray(value) || typeof value !== "object") return {} as Record<string, number>;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, score]) => typeof score === "number" && Number.isFinite(score))
      .map(([key, score]) => [key, Number(score)])
  );
}

function normalizeToken(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function styleTokens(product: Product) {
  return new Set(
    [...product.style, ...(product.styleKeywords ?? [])]
      .flatMap((value) => normalizeToken(value).split(/[^a-z0-9]+/))
      .filter((token) => token.length >= 3)
  );
}

function pairColorScore(a: Product, b: Product) {
  const first = a.colorFamily;
  const second = b.colorFamily;
  if (first === second) return 88;
  if (neutralColors.has(first) || neutralColors.has(second)) return 84;
  const key = [first, second].sort().join(":");
  return goodPairs.has(key) ? 87 : 76;
}

function metadataColorScore(products: Product[]) {
  if (products.length <= 1) return 82;
  const scores: number[] = [];
  for (let i = 0; i < products.length; i += 1) {
    for (let j = i + 1; j < products.length; j += 1) scores.push(pairColorScore(products[i], products[j]));
  }
  return clampScore(scores.reduce((sum, score) => sum + score, 0) / Math.max(1, scores.length));
}

function metadataStyleScore(products: Product[]) {
  if (products.length <= 1) return 82;
  const pairScores: number[] = [];

  for (let i = 0; i < products.length; i += 1) {
    for (let j = i + 1; j < products.length; j += 1) {
      const a = styleTokens(products[i]);
      const b = styleTokens(products[j]);
      const overlap = [...a].filter((token) => b.has(token)).length;
      const styleScore = 72 + Math.min(18, overlap * 6);

      const occasionsA = new Set(products[i].occasion.map(normalizeToken));
      const occasionOverlap = products[j].occasion.map(normalizeToken).filter((value) => occasionsA.has(value)).length;
      const occasionScore = 70 + Math.min(20, occasionOverlap * 7);

      pairScores.push(styleScore * 0.72 + occasionScore * 0.28);
    }
  }

  return clampScore(pairScores.reduce((sum, score) => sum + score, 0) / Math.max(1, pairScores.length));
}

function metadataProportionScore(products: Product[]) {
  if (products.some((product) => product.category === "dress" || product.category === "set")) return 80;
  const hasTop = products.some((product) => product.category === "tops");
  const hasBottom = products.some((product) => product.category === "bottoms");
  const hasOuterwear = products.some((product) => product.category === "outerwear");
  if (hasTop && hasBottom) return hasOuterwear ? 78 : 81;
  return 76;
}

function averageKnown(values: Array<{ value: number | undefined; weight: number }>) {
  const known = values.filter((item) => typeof item.value === "number");
  if (!known.length) return null;
  const weight = known.reduce((sum, item) => sum + item.weight, 0);
  return known.reduce((sum, item) => sum + Number(item.value) * item.weight, 0) / Math.max(0.001, weight);
}

function preferenceScore(products: Product[], profile: StyleProfileLike | null) {
  if (!profile || profile.eventCount <= 0) return { score: 70, confidence: 0 };

  const categories = readScoreMap(profile.preferredCategories);
  const types = readScoreMap(profile.preferredTypes);
  const colors = readScoreMap(profile.preferredColors);
  const styles = readScoreMap(profile.preferredStyles);
  const occasions = readScoreMap(profile.preferredOccasions);
  const fits = readScoreMap(profile.preferredFits);

  const productScores = products.map((product) => {
    const styleValues = [...product.style, ...(product.styleKeywords ?? [])].map((key) => styles[key]).filter((value) => typeof value === "number");
    const occasionValues = product.occasion.map((key) => occasions[key]).filter((value) => typeof value === "number");

    return averageKnown([
      { value: categories[product.category], weight: 0.14 },
      { value: types[product.type], weight: 0.16 },
      { value: colors[product.colorFamily], weight: 0.18 },
      { value: styleValues.length ? styleValues.reduce((a, b) => a + b, 0) / styleValues.length : undefined, weight: 0.28 },
      { value: occasionValues.length ? occasionValues.reduce((a, b) => a + b, 0) / occasionValues.length : undefined, weight: 0.14 },
      { value: fits[product.fit], weight: 0.10 }
    ]);
  }).filter((value): value is number => typeof value === "number");

  if (!productScores.length) return { score: 70, confidence: Math.max(0, Math.min(1, profile.confidence)) };

  const signal = productScores.reduce((sum, value) => sum + value, 0) / productScores.length;
  const raw = Math.max(40, Math.min(96, 70 + signal * 25));
  const confidence = Math.max(0, Math.min(1, profile.confidence));
  const blended = 70 + (raw - 70) * confidence;
  return { score: clampScore(blended), confidence };
}

async function imagePart(image: string) {
  if (image.startsWith("data:image/")) {
    const match = image.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);
    if (!match) throw new Error("Ảnh kết quả không đúng định dạng.");
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.length > 10 * 1024 * 1024) throw new Error("Ảnh kết quả quá lớn để phân tích.");
    return { inline_data: { mime_type: match[1].replace("jpg", "jpeg"), data: match[2] } };
  }

  if (!image.startsWith("https://")) throw new Error("Ảnh kết quả không hợp lệ.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(image, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error("Không tải được ảnh kết quả để phân tích.");
    const mime = (response.headers.get("content-type") ?? "image/jpeg").split(";")[0].trim();
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) throw new Error("Định dạng ảnh kết quả không được hỗ trợ.");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 10 * 1024 * 1024) throw new Error("Ảnh kết quả quá lớn để phân tích.");
    return { inline_data: { mime_type: mime, data: bytes.toString("base64") } };
  } finally {
    clearTimeout(timeout);
  }
}

async function analyzeWithGemini(image: string, products: Product[]): Promise<VisionResult | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const garmentContext = products.map((product) => ({
    name: product.name,
    category: product.category,
    type: product.type,
    color: product.color,
    colorFamily: product.colorFamily,
    fit: product.fit,
    silhouette: product.silhouette,
    lengthClass: product.lengthClass,
    style: product.style,
    occasion: product.occasion
  }));

  const prompt = `Bạn là AI stylist đánh giá một ảnh Virtual Try-On đã được render.
Chỉ đánh giá trang phục và cách outfit xuất hiện trong ảnh. Không suy đoán chủng tộc, tuổi, sức khỏe, cân nặng, số đo cơ thể, mức hấp dẫn hay giá trị ngoại hình của người trong ảnh.
Không khẳng định size/độ vừa thực tế vì ảnh là mô phỏng.

Hãy chấm 0-100:
- colorScore: độ hài hòa màu giữa outfit và tổng thể hình ảnh.
- proportionScore: tỉ lệ thị giác của chiều dài/phom trang phục trên khung người trong ảnh, chỉ dựa trên những gì nhìn thấy.
- styleScore: độ đồng nhất phong cách giữa các món và tổng thể.
- renderConfidence: mức tin cậy của chính ảnh try-on (ít méo, viền, texture bất thường thì cao).

Trả JSON thuần:
{
  "colorScore": number,
  "proportionScore": number,
  "styleScore": number,
  "renderConfidence": number,
  "summary": "1-2 câu tiếng Việt, cụ thể nhưng không phán xét cơ thể",
  "positives": ["tối đa 3 ý"],
  "cautions": ["tối đa 3 ý"],
  "suggestions": ["tối đa 3 gợi ý phối/thử biến thể"]
}

Metadata outfit:
${JSON.stringify(garmentContext)}`;

  try {
    const part = await imagePart(image);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }, part] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 700,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((item: { text?: string }) => item.text ?? "").join("").trim();
    if (!text) return null;
    return JSON.parse(text) as VisionResult;
  } catch {
    return null;
  }
}

export async function assessTryOnLook(args: {
  image: string;
  products: Product[];
  profile: StyleProfileLike | null;
}): Promise<StylistAssessment> {
  const preference = preferenceScore(args.products, args.profile);
  const fallbackColor = metadataColorScore(args.products);
  const fallbackStyle = metadataStyleScore(args.products);
  const fallbackProportion = metadataProportionScore(args.products);
  const vision = await analyzeWithGemini(args.image, args.products);

  const color = clampScore(vision?.colorScore, fallbackColor);
  const proportion = clampScore(vision?.proportionScore, fallbackProportion);
  const style = clampScore(vision?.styleScore, fallbackStyle);
  const render = clampScore(vision?.renderConfidence, 72);
  const overall = clampScore(
    color * 0.30 +
    proportion * 0.25 +
    style * 0.20 +
    preference.score * 0.15 +
    render * 0.10
  );

  const productNames = args.products.map((product) => product.name).join(" + ");
  const positives = cleanList(vision?.positives, [
    color >= 78 ? "Bảng màu của outfit tương đối hài hòa." : "Outfit có nền tảng màu đủ rõ để tiếp tục tinh chỉnh.",
    style >= 78 ? "Các món có ngôn ngữ phong cách khá đồng nhất." : "Có thể cải thiện độ đồng nhất bằng một biến thể đơn giản hơn.",
    preference.score >= 76 ? "Outfit gần với các tín hiệu gu mà hệ thống đã học." : "Điểm gu cá nhân vẫn đang được học thêm từ phản hồi của bạn."
  ]);
  const cautions = cleanList(vision?.cautions, [
    render < 70 ? "Ảnh try-on có dấu hiệu render chưa đủ ổn để kết luận mạnh." : "Ảnh try-on chỉ mô phỏng hình ảnh, không xác nhận độ vừa thực tế.",
    proportion < 68 ? "Tỉ lệ thị giác của phom/chiều dài chưa thật cân bằng trong ảnh này." : "Tỉ lệ nhìn ổn, nhưng còn phụ thuộc pose và góc chụp."
  ]);
  const suggestions = cleanList(vision?.suggestions, [
    preference.score < 72 ? "Thử một biến thể màu gần với các màu bạn thường thích hơn." : "Giữ outfit này và thử thêm một biến thể màu để so sánh.",
    "Nếu quan tâm size, hãy đối chiếu bảng số đo sản phẩm thay vì dựa vào ảnh AI."
  ]);

  return {
    overallScore: overall,
    verdict: stylistVerdict(overall),
    summary: cleanText(
      vision?.summary,
      `${productNames} đạt ${overall}/100 về độ hợp tổng thể. Điểm này kết hợp hình ảnh try-on, metadata sản phẩm và mức khớp với gu đã học.`
    ),
    scores: [
      { key: "color", label: "Màu sắc", score: color, note: "Độ hài hòa màu trong outfit và ảnh kết quả." },
      { key: "proportion", label: "Tỉ lệ", score: proportion, note: "Tỉ lệ thị giác từ ảnh render, không phải số đo thật." },
      { key: "style", label: "Phong cách", score: style, note: "Độ đồng nhất style giữa các món và tổng thể." },
      {
        key: "preference",
        label: "Hợp gu",
        score: preference.score,
        note: preference.confidence > 0
          ? `Dựa trên hồ sơ gu hiện có, độ tin cậy ${Math.round(preference.confidence * 100)}%.`
          : "Chưa đủ lịch sử cá nhân; dùng mức trung tính cho cold-start."
      },
      { key: "render", label: "Ảnh thử", score: render, note: "Mức tin cậy của chính ảnh Virtual Try-On." }
    ],
    positives,
    cautions,
    suggestions,
    mode: vision ? "vision+profile" : "metadata+profile",
    profileConfidence: Math.round(preference.confidence * 100),
    disclaimer: "AI Stylist đánh giá độ hợp về phong cách và hình ảnh mô phỏng; không xác nhận size, độ vừa hay số đo cơ thể thực tế.",
    assessedAt: new Date().toISOString()
  };
}

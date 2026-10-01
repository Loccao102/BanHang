import type { PrismaClient } from "@prisma/client";
import { products as fallbackProducts, type Product } from "@/lib/products";
import { fromProductRow } from "@/lib/server/product-db";

const colorKeywords: Record<string, Product["colorFamily"]> = {
  "đen":"black","black":"black","trắng":"white","white":"white","ivory":"white",
  "navy":"navy","xanh đậm":"navy","be":"beige","beige":"beige","stone":"beige",
  "xanh":"blue","blue":"blue","denim":"blue","nâu":"brown","brown":"brown",
  "đỏ":"red","red":"red","wine":"red","olive":"green","xanh lá":"green",
  "xám":"gray","gray":"gray","charcoal":"gray","hồng":"pink","pink":"pink"
};

const typeKeywords: Array<[string[], Product["type"]]> = [
  [["corset"],"corset"],[["crop","croptop"],"crop-top"],[["bodysuit"],"bodysuit"],
  [["blouse"],"blouse"],[["sơ mi","shirt"],"shirt"],[["knit"],"knit-top"],
  [["blazer"],"blazer"],[["jacket","áo khoác"],"jacket"],[["cardigan"],"cardigan"],
  [["jeans","quần jean"],"jeans"],[["quần tây","trousers"],"trousers"],
  [["quần loe","flare"],"flare-pants"],[["short"],"shorts"],[["chân váy","skirt"],"skirt"],
  [["bodycon"],"bodycon-dress"],[["maxi"],"maxi-dress"],[["midi"],"midi-dress"],
  [["mini dress","đầm mini","váy mini"],"mini-dress"],[["set","matching"],"set"]
];

export function parseBudget(text: string) {
  const normalized = text.toLowerCase().replace(/,/g, ".");
  const million = normalized.match(/(\d+(?:\.\d+)?)\s*(?:tr|triệu|m)(?:\b|$)/);
  if (million) return Math.round(Number(million[1]) * 1_000_000);
  const thousand = normalized.match(/(\d+)\s*k/);
  if (thousand) return Number(thousand[1]) * 1000;
  const plain = normalized.match(/(?:dưới|tầm|khoảng|budget|ngân sách)\s*(\d{6,8})/);
  return plain ? Number(plain[1]) : undefined;
}

export async function loadAvailableProducts(db: PrismaClient | null): Promise<Product[]> {
  if (!db) return fallbackProducts.filter((item) => item.active !== false && item.stock > 0);
  const rows = await db.product.findMany({
    where: { active: true, stock: { gt: 0 } },
    include: {
      variants: { where: { active: true }, orderBy: { size: "asc" } },
      reviews: { where: { approved: true }, select: { rating: true } }
    }
  });
  return rows.map(fromProductRow);
}

export function retrieveProducts(message: string, catalog: Product[], limit = 5, contextProducts: Product[] = []) {
  const text = message.toLowerCase();
  const budget = parseBudget(text);
  const colors = Object.entries(colorKeywords).filter(([word]) => text.includes(word)).map(([, value]) => value);
  const requestedTypes = typeKeywords.filter(([words]) => words.some((word) => text.includes(word))).map(([, type]) => type);

  const category: Product["category"] | undefined =
    text.includes("chân váy") || text.includes("quần") || text.includes("jeans") ? "bottoms" :
    text.includes("đầm") || text.includes("váy") || text.includes("dress") ? "dress" :
    text.includes("áo khoác") || text.includes("blazer") || text.includes("jacket") || text.includes("cardigan") ? "outerwear" :
    text.includes("set") ? "set" :
    text.includes("áo") || text.includes("corset") || text.includes("top") || text.includes("bodysuit") ? "tops" : undefined;

  const refinement = /(đổi|doi|khác|khac|màu|mau|rẻ hơn|re hon|đắt hơn|dat hon|cái khác|cai khac)/.test(text);
  const contextTypes = new Set(contextProducts.map((item) => item.type));
  const contextCategories = new Set(contextProducts.map((item) => item.category));

  const occasions = [
    text.includes("date") || text.includes("hẹn hò") ? "date" : "",
    text.includes("đi làm") || text.includes("công sở") || text.includes("office") ? "work" : "",
    text.includes("party") || text.includes("tiệc") || text.includes("bar") || text.includes("club") ? "party" : "",
    text.includes("đi chơi") || text.includes("casual") ? "casual" : ""
  ].filter(Boolean);

  return catalog
    .map((item) => {
      let score = 0;
      if (category && item.category === category) score += 8;
      if (requestedTypes.includes(item.type)) score += 12;
      if (colors.includes(item.colorFamily)) score += 7;
      if (occasions.some((occasion) => item.occasion.includes(occasion))) score += 6;
      if (budget) score += item.price <= budget ? 5 : -8;
      if (text.includes("sale") && item.oldPrice) score += 5;
      if (text.includes("mới") && item.isNew) score += 5;
      if (refinement && contextTypes.has(item.type)) score += 7;
      else if (refinement && contextCategories.has(item.category)) score += 4;
      if (item.featured) score += 1;
      if ((item.rating ?? 0) >= 4.5) score += 1;
      return { item, score };
    })
    .filter(({ item, score }) => score > 0 || (!category && !requestedTypes.length && !colors.length && !occasions.length && (!budget || item.price <= budget)))
    .sort((a, b) => b.score - a.score || (b.item.rating ?? 0) - (a.item.rating ?? 0) || a.item.price - b.item.price)
    .slice(0, limit)
    .map(({ item }) => item);
}

export function titleFromMessage(message: string) {
  const clean = message.replace(/\s+/g, " ").trim();
  return clean.length > 46 ? clean.slice(0, 43) + "..." : clean || "Cuộc trò chuyện mới";
}

type HistoryItem = { role: "user" | "assistant"; text: string };

export async function askGemini(args: {
  message: string;
  products: Product[];
  history: HistoryItem[];
  orderContext?: string;
  agentContext?: string;
}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const catalog = args.products.length
    ? args.products.map((item) => {
        const availableSizes = (item.variants ?? []).filter((variant) => variant.stock > 0).map((variant) => variant.size).join(", ");
        return `- ${item.name} | id=${item.id} | ${item.color} | ${item.price} VND | size còn: ${availableSizes || item.sizes.join(", ")} | style: ${item.style.join(", ")} | dịp: ${item.occasion.join(", ")} | fit: ${item.fit}`;
      }).join("\n")
    : "(Không có sản phẩm phù hợp trực tiếp trong lượt tìm hiện tại)";

  const history = args.history.slice(-10).map((item) => `${item.role === "user" ? "Khách" : "LSOUL Stylist"}: ${item.text}`).join("\n");

  const system = `Bạn là LSOUL Stylist AI, trợ lý mua sắm cho website thời trang nữ LSOUL.
Mục tiêu: giúp khách tìm sản phẩm, phối outfit, chọn size ở mức tư vấn chung, giải thích chất liệu/phom, chính sách giao hàng/đổi size, và tra cứu tình trạng đơn nếu context đơn hàng được cung cấp.
Quy tắc:
- Trả lời tiếng Việt tự nhiên, thân thiện, ngắn gọn nhưng đủ ý.
- Không bịa sản phẩm, giá, tồn kho, mã đơn hoặc trạng thái. Chỉ dùng dữ liệu được cung cấp.
- Nếu câu hỏi thiếu dữ kiện quan trọng (ví dụ chiều cao/cân nặng/số đo khi hỏi size), hãy hỏi lại đúng 1 câu ngắn.
- Khi đề xuất sản phẩm, ưu tiên tối đa 3 lựa chọn tốt nhất và nói lý do.
- Có thể gợi ý cách phối từ các sản phẩm trong danh sách.
- Không nói rằng bạn "không có dữ liệu thời gian thực" vì catalog bên dưới đã là dữ liệu hiện tại.
- Chính sách hiện tại: freeship từ 699K; đổi size trong 7 ngày nếu sản phẩm nguyên tag/chưa sử dụng; thanh toán COD hoặc VietQR được SePay xác minh tự động.
`;

  const prompt = `${system}
Lịch sử gần nhất:
${history || "(Cuộc trò chuyện mới)"}

Context đơn hàng của khách:
${args.orderContext || "(Không có hoặc khách chưa hỏi về đơn hàng)"}

Context hành động của shopping agent:
${args.agentContext || "(Không có action đặc biệt)"}

Các sản phẩm phù hợp được hệ thống truy xuất:
${catalog}

Tin nhắn mới của khách:
${args.message}

Hãy trả lời trực tiếp. Không dùng markdown table.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.55, maxOutputTokens: 500 }
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("").trim() || null;
  } catch {
    return null;
  }
}

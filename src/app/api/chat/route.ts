import { NextResponse } from "next/server";
import { products, type Product } from "@/lib/products";

const colorKeywords: Record<string, Product["colorFamily"]> = {
  "đen": "black", "black": "black", "trắng": "white", "white": "white", "navy": "navy", "xanh đậm": "navy",
  "be": "beige", "beige": "beige", "stone": "beige", "xanh": "blue", "blue": "blue", "nâu": "brown", "brown": "brown", "olive": "green", "xanh lá": "green"
};

function parseBudget(text: string) {
  const normalized = text.toLowerCase().replace(/,/g, ".");
  const million = normalized.match(/(\d+(?:\.\d+)?)\s*(?:tr|triệu|m)/);
  if (million) return Math.round(Number(million[1]) * 1_000_000);
  const thousand = normalized.match(/(\d+)\s*k/);
  if (thousand) return Number(thousand[1]) * 1000;
  const plain = normalized.match(/(?:dưới|tầm|khoảng)\s*(\d{6,7})/);
  return plain ? Number(plain[1]) : undefined;
}

function retrieve(message: string) {
  const text = message.toLowerCase();
  const budget = parseBudget(text);
  const requestedColors = Object.entries(colorKeywords).filter(([key]) => text.includes(key)).map(([, value]) => value);
  const category = text.includes("quần") || text.includes("chân váy") ? "bottoms" : text.includes("váy") || text.includes("đầm") ? "dress" : text.includes("áo khoác") || text.includes("blazer") || text.includes("jacket") ? "outerwear" : text.includes("áo") || text.includes("corset") || text.includes("crop") || text.includes("bodysuit") ? "tops" : text.includes("set") ? "set" : undefined;
  const occasion = text.includes("date") || text.includes("hẹn hò") ? "date" : text.includes("đi làm") || text.includes("công sở") ? "work" : text.includes("đi chơi") ? "casual" : undefined;

  const ranked = products
    .filter((item) => item.stock > 0)
    .map((item) => {
      let score = 0;
      if (category && item.category === category) score += 5;
      if (requestedColors.includes(item.colorFamily)) score += 4;
      if (occasion && item.occasion.includes(occasion)) score += 3;
      if (budget && item.price <= budget) score += 2;
      if (!category && !requestedColors.length && !occasion) score += Number(item.featured) * 2;
      return { item, score };
    })
    .filter(({ item, score }) => score > 0 || (!category && !requestedColors.length && !occasion && (!budget || item.price <= budget)))
    .toSorted((a, b) => b.score - a.score || a.item.price - b.item.price)
    .map(({ item }) => item)
    .slice(0, 3);

  if (ranked.length) return ranked;
  return products.filter((item) => !budget || item.price <= budget).slice(0, 3);
}

async function geminiMessage(userMessage: string, found: Product[]) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const catalog = found.map((item) => `${item.name} | ${item.color} | ${item.price} VND | ${item.style.join(", ")} | ${item.occasion.join(", ")}`).join("\n");
  const prompt = `Bạn là stylist bán hàng cho thương hiệu LSOUL. Chỉ được nói về đúng các sản phẩm trong danh sách bên dưới, không bịa tên, giá hoặc tồn kho. Trả lời tiếng Việt, tự nhiên, tối đa 2 câu, giải thích ngắn vì sao phù hợp.\n\nKhách: ${userMessage}\n\nSản phẩm tìm được:\n${catalog}`;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const message = String(body?.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "Thiếu nội dung chat" }, { status: 400 });

  const found = retrieve(message);
  const aiText = await geminiMessage(message, found);
  const fallback = found.length
    ? `Mình tìm được ${found.length} lựa chọn đang còn hàng khá sát yêu cầu của bạn. Bạn có thể mở từng sản phẩm hoặc vào “Phối đồ AI” để ghép thành một set hoàn chỉnh.`
    : "Hiện chưa có sản phẩm khớp hoàn toàn. Bạn thử nới màu sắc hoặc ngân sách nhé.";

  return NextResponse.json({ message: aiText ?? fallback, products: found });
}

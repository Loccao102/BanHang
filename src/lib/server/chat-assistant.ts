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
  [["jeans","quần jean","quần bò"],"jeans"],
  [["quần tây","quần âu","quần ống suông","quần suông","quần vải","trousers"],"trousers"],
  [["quần loe","flare"],"flare-pants"],
  [["quần short","quần đùi","quần cộc","short","shorts"],"shorts"],
  [["chân váy","skirt"],"skirt"],
  [["bodycon","body","váy body","đầm body","ôm body","dáng ôm","ôm sát"],"bodycon-dress"],
  [["maxi","dáng dài","váy dài","đầm dài"],"maxi-dress"],
  [["midi"],"midi-dress"],
  [["mini dress","đầm mini","váy mini","ngắn"],"mini-dress"],[["set","matching"],"set"]
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
      variants: { where: { active: true }, orderBy: { size: "asc" } }
    }
  });
  return rows.map(fromProductRow);
}

export function retrieveProducts(
  message: string,
  catalog: Product[],
  limit = 5,
  contextProducts: Product[] = [],
  affinityScores: Map<string, number> = new Map()
) {
  const text = message.toLowerCase();
  // Legacy retrieval is only a resilience fallback. It must not recommend
  // featured products merely because the customer is greeting us.
  const social = /^(?:(?:xin\s+)?chào|hi|hello|hey|alo|chao)(?:\s+(?:người anh em|anh em|shop|bạn|nha|nhé|ơi|a|em))*[!?.\s]*$/i;
  if (social.test(message.trim())) return [];

  const budget = parseBudget(text);
  const colors = Object.entries(colorKeywords).filter(([word]) => text.includes(word)).map(([, value]) => value);
  const requestedTypes = typeKeywords.filter(([words]) => words.some((word) => text.includes(word))).map(([, type]) => type);
  const wantsLong = text.includes("dài") || text.includes("maxi");
  const wantsShort = text.includes("ngắn") || text.includes("mini");

  // Specific garment intent detection
  const wantsPants = (text.includes("quần") || text.includes("jeans") || text.includes("trousers") || text.includes("pants")) && !text.includes("chân váy");
  const wantsSkirt = text.includes("chân váy") || text.includes("skirt");
  const wantsDress = (text.includes("đầm") || text.includes("dress") || (text.includes("váy") && !wantsSkirt && !wantsPants));
  const wantsTop = (text.includes("áo") || text.includes("corset") || text.includes("croptop") || text.includes("sơ mi") || text.includes("blazer") || text.includes("bodysuit")) && !wantsPants && !wantsDress && !wantsSkirt;

  const category: Product["category"] | undefined =
    wantsPants || wantsSkirt ? "bottoms" :
    wantsDress ? "dress" :
    text.includes("áo khoác") || text.includes("blazer") || text.includes("jacket") || text.includes("cardigan") ? "outerwear" :
    text.includes("set") ? "set" :
    wantsTop ? "tops" : undefined;

  const refinement = /(đổi|doi|khác|khac|màu|mau|rẻ hơn|re hon|đắt hơn|dat hon|cái khác|cai khac)/.test(text);
  const contextTypes = new Set(contextProducts.map((item) => item.type));
  const contextCategories = new Set(contextProducts.map((item) => item.category));

  const occasionGroups = [
    text.includes("date") || text.includes("hẹn hò") ? ["hẹn hò", "date"] : [],
    text.includes("đi làm") || text.includes("công sở") || text.includes("office") ? ["đi làm", "công sở", "work"] : [],
    text.includes("party") || text.includes("tiệc") || text.includes("bar") || text.includes("club") ? ["đi tiệc", "sự kiện buổi tối", "party"] : [],
    text.includes("đi chơi") || text.includes("casual") || text.includes("cafe") ? ["đi chơi", "đi cafe", "casual"] : [],
    text.includes("concert") ? ["concert"] : []
  ].filter((group) => group.length);
  const queryTokens = text
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);

  const ranked = catalog
    .map((item) => {
      let score = 0;
      if (category && item.category === category) score += 8;
      if (requestedTypes.includes(item.type)) score += 12;

      // Strict garment type exclusivity
      const isPantsItem = ["trousers", "jeans", "flare-pants", "shorts"].includes(item.type);
      const isSkirtItem = item.type === "skirt";
      const isDressItem = item.category === "dress";
      const isTopItem = item.category === "tops" || item.category === "outerwear";

      if (wantsPants) {
        if (isPantsItem) score += 18;
        if (isSkirtItem || isDressItem || isTopItem) score -= 60;
      } else if (wantsSkirt) {
        if (isSkirtItem) score += 18;
        if (isPantsItem || isDressItem || isTopItem) score -= 60;
      } else if (wantsDress) {
        if (isDressItem) score += 18;
        if (isPantsItem || isSkirtItem || isTopItem) score -= 60;
      } else if (wantsTop) {
        if (isTopItem) score += 18;
        if (isPantsItem || isSkirtItem || isDressItem) score -= 60;
      }

      if (colors.includes(item.colorFamily)) {
        score += 8;
        // Prioritize exact single-color matches over multi-color descriptions
        if (!item.color.includes("/")) score += 4;
      }
      if (wantsLong) {
        if (item.lengthClass === "maxi" || item.type === "maxi-dress" || (isPantsItem && item.type !== "shorts")) score += 10;
        else if (item.lengthClass === "midi" || item.type === "midi-dress") score += 5;
        else if (item.lengthClass === "mini" || item.type === "mini-dress" || item.type === "shorts") score -= 14;
      }
      if (wantsShort) {
        if (item.lengthClass === "mini" || item.type === "mini-dress" || item.type === "shorts") score += 10;
        else if (item.lengthClass === "maxi" || item.type === "maxi-dress" || item.type === "trousers") score -= 14;
      }
      if (occasionGroups.some((group) => group.some((occasion) => item.occasion.some((value) => value.toLowerCase().includes(occasion))))) score += 6;
      if (budget) score += item.price <= budget ? 5 : -8;
      const searchable = (item.aiSearchText || [item.name, item.subtitle, ...item.style, ...item.occasion].join(" "))
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const tokenHits = queryTokens.filter((token) => searchable.includes(token)).length;
      score += Math.min(6, tokenHits * 1.2);
      score += Math.max(-4, Math.min(8, affinityScores.get(item.id) ?? 0));
      if (text.includes("sale") && item.oldPrice) score += 5;
      if (text.includes("mới") && item.isNew) score += 5;
      if (refinement && contextTypes.has(item.type)) score += 7;
      else if (refinement && contextCategories.has(item.category)) score += 4;
      if (item.featured) score += 2;
      if (/(?:sexy|goi cam|quyen ru|boc lua|nong bong)/.test(text)) {
        const isCorsetOrBodysuitOrCutout = item.type === "corset" || item.type === "bodysuit" ||
          /corset|bodysuit|cut-?out|khoét|cắt xẻ|siết eo|gọng định hình|lace-?up|hở lưng|hở eo|xẻ tà|cutout/.test(
            `${item.name} ${item.subtitle} ${item.fit || ""} ${item.neckline || ""} ${(item.styleKeywords || []).join(" ")}`.toLowerCase()
          );
        const isTubeTop = !isCorsetOrBodysuitOrCutout &&
          /tube|áo quây|quây ngực|strapless tube/.test(`${item.name} ${item.subtitle} ${item.fit || ""}`.toLowerCase());
        if (isCorsetOrBodysuitOrCutout) score += 16;
        else if (isTubeTop) score -= 8;
      }
      return { item, score };
    })
    .filter(({ item, score }) => score > 0 || (!category && !requestedTypes.length && !colors.length && !occasionGroups.length && (!budget || item.price <= budget)))
    .sort((a, b) => b.score - a.score || Number(Boolean(b.item.featured)) - Number(Boolean(a.item.featured)) || a.item.price - b.item.price);

  // Mỗi thiết kế chỉ trả về 1 biến thể màu. groupCode liên kết các màu của cùng một mẫu.
  // Biến thể có điểm cao nhất (ví dụ đúng màu khách yêu cầu) sẽ được giữ lại.
  const scored: Product[] = [];
  const seenGroups = new Set<string>();
  for (const { item } of ranked) {
    const groupKey = item.groupCode?.trim() || item.id;
    if (seenGroups.has(groupKey)) continue;
    seenGroups.add(groupKey);
    scored.push(item);
    if (scored.length >= limit) break;
  }

  // If query yielded nothing but there are items in catalog, return top featured or in-stock items,
  // vẫn không lặp nhiều màu của cùng một thiết kế.
  if (scored.length === 0 && catalog.length > 0) {
    const fallback: Product[] = [];
    const fallbackGroups = new Set<string>();
    for (const item of catalog.filter((candidate) => candidate.featured || candidate.isNew)) {
      const groupKey = item.groupCode?.trim() || item.id;
      if (fallbackGroups.has(groupKey)) continue;
      fallbackGroups.add(groupKey);
      fallback.push(item);
      if (fallback.length >= limit) break;
    }
    return fallback;
  }
  return scored;
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
  image?: string;
}) {
  const rawKey = process.env.GEMINI_API_KEY ?? "";
  const key = rawKey.replace(/^["']|["']$/g, "").trim();
  if (!key) return null;

  const catalog = args.products.length
    ? args.products.map((item) => {
        const availableSizes = (item.variants ?? []).filter((variant) => variant.stock > 0).map((variant) => variant.size).join(", ");
        return `- ${item.name} | Mã: ${item.id} | Màu: ${item.color} | Giá: ${item.price.toLocaleString("vi-VN")} VND | Size còn: ${availableSizes || item.sizes.join(", ")} | Phom/Style: ${item.fit}, ${item.style.join(", ")} | Dịp: ${item.occasion.join(", ")}`;
      }).join("\n")
    : "(Không có sản phẩm trực tiếp trong danh sách này)";

  const system = `Bạn là LSOUL Stylist AI - Chuyên gia tư vấn thời trang cao cấp của thương hiệu thời trang thiết kế LSOUL (Việt Nam).
LSOUL nổi tiếng toàn cầu với phong cách gợi cảm, cá tính mạnh mẽ, thời thượng (empowered chic, Y2K glam, edgy elegance), được yêu thích bởi nhiều ngôi sao quốc tế như Lisa (Blackpink), Jennie, Ningning, IU, Chi Pu...

KIẾN THỨC VÀ BẢNG SIZE CHUẨN LSOUL:
- Size S: Ngực 80-84cm, Eo 60-64cm, Mông 86-90cm (Phù hợp cân nặng dưới 48kg, cao 1m50 - 1m62).
- Size M: Ngực 84-88cm, Eo 64-68cm, Mông 90-94cm (Phù hợp cân nặng 48 - 54kg, cao 1m55 - 1m65).
- Size L: Ngực 88-94cm, Eo 68-74cm, Mông 94-100cm (Phù hợp cân nặng 55 - 62kg, cao 1m58 - 1m70).
- Size XL: Ngực 94-100cm, Eo 74-80cm, Mông 100-106cm (Phù hợp cân nặng 62 - 70kg).
- LƯU Ý KHI CHỌN SIZE CORSET / ĐẦM BODYCON:
  + Các mẫu Corset LSOUL có thiết kế gọng định hình và dây đan lưng (lace-up back) linh hoạt, có thể nới hoặc siết vòng eo +/- 3-4cm.
  + Nếu khách có vòng 1 đầy đặn hoặc đang phân vân giữa 2 size, luôn khuyên chọn tăng 1 size để vừa vặn vòng 1 thoải mái, sau đó siết dây lưng để ôm sát eo thon gọn.
  + Đầm ôm chất liệu nhung/thun co giãn tốt; với chất liệu tafta hoặc dạ tweed không co giãn nên chọn đúng size số đo lớn nhất.

GỢI Ý PHỐI OUTFIT THEO DỊP:
- Đi Tiệc / Party / Clubbing: Corset phối chân váy ngắn xòe/xếp ly cạp cao hoặc quần ống loe tôn dáng; Đầm bodycon cut-out gợi cảm, sang trọng.
- Đi Hẹn Hò (Date Night): Đầm lụa midi, đầm cúp ngực phối cardigan mỏng hoặc blazer khoác hờ vai.
- Đi Cafe / Dạo Phố: Áo croptop / baby tee phối cùng chân váy xếp ly hoặc quần jeans cạp trễ Y2K năng động.
- Đi Làm / Sự Kiện: Áo blazer cách điệu tôn dáng phối quần âu suông cạp cao thanh lịch.

CHÍNH SÁCH BÁN HÀNG LSOUL:
- Miễn phí vận chuyển (Freeship) toàn quốc cho đơn hàng từ 699.000đ.
- Đổi size hoặc đổi mẫu trong vòng 7 ngày kể từ khi nhận hàng (yêu cầu sản phẩm còn nguyên tem mác, chưa qua sử dụng).
- Giao hàng hỏa tốc trong 2-4h tại nội thành Hà Nội & TP.HCM; giao tiêu chuẩn toàn quốc 2-4 ngày.
- Thanh toán tiện lợi qua COD (kiểm tra hàng khi nhận) hoặc Chuyển khoản VietQR tự động xác nhận qua SePay.

TÍNH NĂNG ĐẶC BIỆT - PHÒNG THỬ ĐỒ AI (Virtual Fitting Room):
- Khách có thể ướm thử cả set đồ hoặc từng món lên dáng người thực tế bằng ảnh toàn thân.
- Khi tư vấn phối đồ hoặc gợi ý set đồ, hãy hào hứng mời khách bấm "Thử cả set trong phòng thử AI" hoặc nút "Thử đồ" ngay trên thẻ sản phẩm để ngắm đồ lên dáng trước khi mua sắm.

QUY TẮC MẠCH TRÒ CHUYỆN LIÊN TỤC (MULTI-TURN) VÀ CHỐNG SAI CONTEXT:
1. KHÔNG CHÀO LẶP LẠI: Nếu đã có lịch sử trò chuyện phía trên, TUYỆT ĐỐI KHÔNG chào hỏi lại ("Dạ chào bạn", "LSOUL xin chào",...). Đi thẳng vào nội dung tư vấn một cách tự nhiên, duyên dáng như một stylist chuyên nghiệp đang trò chuyện trực tiếp.
2. GHI NHỚ THÔNG TIN KHÁCH ĐÃ NÊU: Giữ vững thông tin khách đã chia sẻ trong các lượt trước (chiều cao, cân nặng, số đo, màu ưa thích, ngân sách). Không bao giờ hỏi lại những gì khách vừa cung cấp.
3. NGUỒN SỰ THẬT DUY NHẤT VỀ SẢN PHẨM: Chỉ được nhắc tới đúng tên, đúng màu sắc, đúng giá của các sản phẩm có trong danh sách [SẢN PHẨM LIÊN QUAN TRONG HỆ THỐNG] ở lượt này. Tuyệt đối KHÔNG tự ý nhắc lại sản phẩm ở các lượt cũ nếu chúng không có mặt trong danh sách hiện tại.
4. TÔN TRỌNG YÊU CẦU MỚI: Nếu khách muốn chuyển sang tìm món khác hoặc đổi phong cách, hãy tập trung giải quyết mong muốn mới, không cố ép khách tiếp tục set đồ cũ.
5. ĐỊNH DẠNG: Trả lời mạch lạc, súc tích, gạch đầu dòng dễ nhìn. TUYỆT ĐỐI KHÔNG dùng bảng markdown table (vì màn hình di động hẹp). Không bịa đặt sản phẩm không có thật.
6. TƯ VẤN QUA HÌNH ẢNH (MULTIMODAL STYLIST): Nếu khách gửi kèm ảnh (ảnh outfit mẫu từ Instagram/Pinterest hoặc ảnh dáng người), hãy nhiệt tình khen ngợi, phân tích gu thời trang (màu sắc, phom dáng, phong cách như sexy, y2k, thanh lịch) và gợi ý các thiết kế LSOUL tương đồng nhất trong danh sách sản phẩm!`;

  const historyContents: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [];
  for (const item of args.history.slice(-8)) {
    historyContents.push({
      role: item.role === "user" ? "user" : "model",
      parts: [{ text: item.text.slice(0, 1000) }]
    });
  }

  const currentTurnContext = [
    args.orderContext ? `[THÔNG TIN ĐƠN HÀNG CỦA KHÁCH]:\n${args.orderContext}` : "",
    args.agentContext ? `[NGỮ CẢNH HỆ THỐNG BẮT BUỘC]:\n${args.agentContext}` : "",
    `[SẢN PHẨM LIÊN QUAN TRONG HỆ THỐNG]:\n${catalog}`,
    `[TIN NHẮN MỚI CỦA KHÁCH]:\n${args.message}`
  ].filter(Boolean).join("\n\n");

  type ContentPart = { text: string } | { inline_data: { mime_type: string; data: string } };
  const userParts: ContentPart[] = [{ text: currentTurnContext }];

  if (args.image && typeof args.image === "string") {
    const match = args.image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (match) {
      userParts.push({
        inline_data: {
          mime_type: match[1],
          data: match[2]
        }
      });
    }
  }

  const contents = [
    ...historyContents,
    { role: "user" as const, parts: userParts }
  ];

  // Thứ tự ưu tiên model: model tùy chỉnh qua GEMINI_MODEL -> gemini-flash-lite-latest (ổn định, cực nhanh <1s) -> các bản preview mới
  const primaryModel = process.env.GEMINI_MODEL?.trim() || "gemini-flash-lite-latest";
  const configs = [
    { model: primaryModel, thinkingBudget: 0 },
    { model: "gemini-flash-lite-latest", thinkingBudget: 0 },
    { model: "gemini-3.1-flash-lite-preview", thinkingBudget: 0 },
    { model: "gemini-3-flash-preview", thinkingBudget: 0 }
  ].filter((config, index, all) => all.findIndex((item) => item.model === config.model) === index);

  for (const item of configs) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      const generationConfig: Record<string, unknown> = {
        temperature: 0.6,
        maxOutputTokens: 1500
      };
      if (item.thinkingBudget !== undefined) {
        generationConfig.thinkingConfig = { thinkingBudget: item.thinkingBudget };
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${item.model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents,
          generationConfig
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("").trim();
        if (text) return text;
      }
    } catch {
      // Continue to next config
    }
  }

  return null;
}

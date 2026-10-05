import type { Product } from "@/lib/products";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const typeLanguage: Partial<Record<Product["type"], string[]>> = {
  corset: ["corset", "áo corset", "structured waist", "snatched waist"],
  "crop-top": ["crop top", "croptop", "áo ngắn", "young"],
  bodysuit: ["bodysuit", "áo liền thân", "fitted"],
  blouse: ["blouse", "áo kiểu"],
  shirt: ["shirt", "sơ mi"],
  "knit-top": ["knit top", "áo len"],
  blazer: ["blazer", "tailored jacket", "áo blazer"],
  jacket: ["jacket", "áo khoác"],
  cardigan: ["cardigan", "áo khoác len"],
  jeans: ["jeans", "denim", "quần jeans"],
  trousers: ["trousers", "tailored pants", "quần âu", "quần dài"],
  "flare-pants": ["flare pants", "quần loe", "elongating"],
  shorts: ["shorts", "quần short"],
  skirt: ["skirt", "chân váy"],
  "mini-dress": ["mini dress", "đầm ngắn"],
  "midi-dress": ["midi dress", "đầm midi"],
  "maxi-dress": ["maxi dress", "đầm dài", "gala dress"],
  "bodycon-dress": ["bodycon dress", "đầm ôm", "curve hugging"],
  set: ["matching set", "co ord", "set đồng bộ"]
};

const styleLanguage: Record<string, string[]> = {
  glam: ["glam", "glamorous", "sang trọng", "dạ tiệc", "evening", "luxury"],
  elegant: ["elegant", "thanh lịch", "sang", "refined", "polished"],
  sexy: ["sexy", "quyến rũ", "sensual", "gợi cảm", "body conscious"],
  statement: ["statement", "nổi bật", "ấn tượng", "spotlight", "bold"],
  bold: ["bold", "mạnh mẽ", "quyền lực", "cá tính"],
  edgy: ["edgy", "cá tính", "cool", "fashion forward"],
  minimal: ["minimal", "tối giản", "clean", "understated"],
  chic: ["chic", "sang", "polished", "fashionable"],
  preppy: ["preppy", "trẻ trung", "school girl", "college"],
  romantic: ["romantic", "lãng mạn", "mềm mại"],
  "nữ tính": ["feminine", "nữ tính", "soft", "graceful"],
  feminine: ["feminine", "nữ tính", "soft", "graceful"],
  casual: ["casual", "đời thường", "dạo phố", "relaxed"],
  streetwear: ["streetwear", "đường phố", "urban"],
  y2k: ["y2k", "trẻ", "trendy", "2000s"],
  "công sở": ["office", "workwear", "công sở", "professional"]
};

function expandStyle(value: string) {
  const key = normalize(value);
  const entries = Object.entries(styleLanguage);
  const exact = entries.find(([name]) => normalize(name) === key)?.[1];
  if (exact) return exact;

  const expanded = new Set<string>([value]);
  for (const [name, aliases] of entries) {
    if (key.includes(normalize(name)) || aliases.some((alias) => key.includes(normalize(alias)))) {
      aliases.forEach((alias) => expanded.add(alias));
    }
  }
  return Array.from(expanded);
}

function formalityLanguage(value = 3) {
  if (value >= 5) return ["formal", "high formality", "dạ tiệc", "gala", "evening event", "sự kiện sang trọng"];
  if (value === 4) return ["dressy", "semi formal", "đi tiệc", "hẹn hò sang", "smart evening"];
  if (value === 3) return ["smart casual", "polished casual", "đi làm", "đi cafe"];
  return ["casual", "relaxed", "everyday", "đi chơi"];
}

function coverageLanguage(value = 3) {
  if (value <= 1) return ["revealing", "very sexy", "bold skin exposure"];
  if (value === 2) return ["sexy", "open", "low coverage"];
  if (value === 3) return ["balanced coverage", "moderate"];
  if (value === 4) return ["modest", "covered", "kín đáo"];
  return ["high coverage", "very modest", "kín"];
}

function visualWeightLanguage(value = 3) {
  if (value >= 5) return ["dramatic", "statement", "high visual impact"];
  if (value === 4) return ["noticeable", "fashion forward"];
  if (value <= 2) return ["lightweight visual", "subtle", "delicate"];
  return ["balanced visual weight"];
}

function unique(values: Array<string | undefined | null>) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const clean = value?.trim();
    if (!clean) continue;
    const key = normalize(clean);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result;
}

/**
 * Deterministic bilingual semantic profile. This is intentionally model-independent:
 * it is useful for lexical ranking today and can be embedded into pgvector later
 * without rebuilding the catalog ontology.
 */
export function buildProductSemanticText(product: Product) {
  const styles = (product.style || []).flatMap(expandStyle);
  const styleKeywords = (product.styleKeywords || []).flatMap(expandStyle);
  const occasionText = (product.occasion || []).flatMap((occasion) => {
    const n = normalize(occasion);
    if (/(tiec|su kien|party|gala|bar|club)/.test(n)) {
      return [occasion, "party", "evening", "dạ tiệc", "event", "occasion wear"];
    }
    if (/(hen ho|date)/.test(n)) return [occasion, "date night", "romantic"];
    if (/(di lam|cong so|office|work)/.test(n)) return [occasion, "office", "workwear", "professional"];
    if (/(cafe|di choi|dao pho|casual)/.test(n)) return [occasion, "casual", "weekend", "daywear"];
    if (/concert/.test(n)) return [occasion, "concert", "performance", "statement"];
    return [occasion];
  });

  const silhouette = [
    product.fit,
    product.silhouette,
    product.volume,
    product.lengthClass,
    product.waistRise,
    product.neckline,
    product.sleeveLength
  ].filter(Boolean).map(String);

  const shape = [
    ...(product.bodyShapeCompatibility || []),
    ...(product.pairingTags || []),
    ...(product.avoidPairingTags || []).map((value) => `avoid ${value}`)
  ];

  return unique([
    product.name,
    product.subtitle,
    product.category,
    product.type,
    ...(typeLanguage[product.type] || []),
    product.color,
    product.colorFamily,
    product.material,
    product.pattern,
    ...silhouette,
    ...styles,
    ...styleKeywords,
    ...occasionText,
    ...formalityLanguage(product.formality),
    ...coverageLanguage(product.coverage),
    ...visualWeightLanguage(product.visualWeight),
    ...(product.season || []),
    ...shape
  ]).join(" | ");
}

export function semanticTextScore(product: Product, query: string) {
  const q = normalize(query);
  if (!q) return 0;

  const profile = normalize([product.aiSearchText, buildProductSemanticText(product)].filter(Boolean).join(" | "));
  const tokens = Array.from(new Set(q.split(" ").filter((token) => token.length >= 3)));
  if (!tokens.length) return 0;

  let score = 0;
  for (const token of tokens) {
    if (profile.includes(token)) score += 1;
  }

  // Reward multi-word phrase matches in addition to token overlap.
  if (q.length >= 5 && profile.includes(q)) score += 3;
  return score;
}

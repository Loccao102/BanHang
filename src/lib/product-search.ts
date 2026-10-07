import type { Product } from "./products";

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

const styleSynonyms: Record<string, string[]> = {
  sexy: ["sexy", "quyến rũ", "gợi cảm", "hở", "bốc lửa", "cutout", "corset", "bodysuit"],
  tiec: ["tiệc", "party", "prom", "club", "bar", "quẩy", "dạ tiệc", "gala", "glam"],
  henho: ["hẹn hò", "date", "lãng mạn", "dịu dàng", "nhẹ nhàng"],
  congso: ["công sở", "đi làm", "thanh lịch", "blazer", "sơ mi", "âu"],
  y2k: ["y2k", "cá tính", "cháy", "chất", "ngầu", "crop", "ống loe"],
  tregtrung: ["trẻ trung", "năng động", "dạo phố", "cafe"]
};

/**
 * Tính điểm tìm kiếm kết hợp (Full-Text + Ngữ Nghĩa / Phong Cách).
 */
export function calculateProductSearchScore(product: Product, query: string): number {
  const q = normalize(query);
  if (!q) return 1;

  let score = 0;
  const searchable = normalize(
    `${product.name} ${product.subtitle} ${product.color} ${product.material} ${product.sku ?? ""} ${(product.style || []).join(" ")} ${(product.occasion || []).join(" ")} ${(product.styleKeywords || []).join(" ")} ${product.type} ${product.category}`
  );

  // Exact phrase match
  if (searchable.includes(q)) {
    score += 50;
  }

  // Token matching
  const tokens = Array.from(new Set(q.split(" ").filter((t) => t.length >= 2)));
  for (const token of tokens) {
    if (searchable.includes(token)) {
      score += 15;
    }
  }

  // Synonyms and semantic intent matching
  for (const [key, synonyms] of Object.entries(styleSynonyms)) {
    const queryHasIntent = synonyms.some((syn) => q.includes(normalize(syn)));
    if (queryHasIntent) {
      const productMatchesIntent = synonyms.some((syn) => searchable.includes(normalize(syn)));
      if (productMatchesIntent) {
        score += 25;
      }
    }
  }

  return score;
}

/**
 * Gợi ý cá nhân hóa (For You) dựa trên các sản phẩm đã yêu thích trong wishlist.
 */
export function getPersonalizedRecommendations(
  catalog: Product[],
  wishlistIds: string[],
  limit = 8
): Product[] {
  const activeProducts = catalog.filter((p) => p.active !== false && p.stock > 0);
  if (!wishlistIds.length) {
    // Fallback: trả về sản phẩm featured & new
    return activeProducts.filter((p) => p.featured || p.isNew).slice(0, limit);
  }

  const wishlistProducts = catalog.filter((p) => wishlistIds.includes(p.id));
  const preferredStyles = new Set<string>();
  const preferredColors = new Set<string>();
  const preferredCategories = new Set<string>();

  for (const p of wishlistProducts) {
    (p.style || []).forEach((s) => preferredStyles.add(normalize(s)));
    if (p.colorFamily) preferredColors.add(p.colorFamily);
    if (p.category) preferredCategories.add(p.category);
  }

  const scored = activeProducts
    .filter((p) => !wishlistIds.includes(p.id))
    .map((product) => {
      let score = 0;
      if (preferredCategories.has(product.category)) score += 5;
      if (preferredColors.has(product.colorFamily)) score += 6;
      for (const s of product.style || []) {
        if (preferredStyles.has(normalize(s))) score += 10;
      }
      if (product.featured) score += 3;
      if (product.isNew) score += 2;
      return { product, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);

  return scored.slice(0, limit);
}

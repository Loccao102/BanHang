import { Product, products } from "./products";

export type Outfit = {
  id: string;
  items: Product[];
  score: number;
  reason: string;
};

const colorPairs = new Set([
  "black:white", "black:beige", "black:blue", "black:navy", "black:brown",
  "white:navy", "white:beige", "white:blue", "white:green", "white:brown",
  "beige:navy", "beige:blue", "beige:brown", "navy:brown", "navy:white",
  "green:beige", "green:black", "brown:white", "brown:beige"
]);

function pairScore(a: Product, b: Product) {
  if (a.colorFamily === b.colorFamily) return 16;
  const forward = `${a.colorFamily}:${b.colorFamily}`;
  const reverse = `${b.colorFamily}:${a.colorFamily}`;
  return colorPairs.has(forward) || colorPairs.has(reverse) ? 28 : 18;
}

function styleScore(items: Product[], style: string) {
  const matches = items.filter((item) => item.style.includes(style)).length;
  return Math.min(30, matches * 10 + 10);
}

function occasionScore(items: Product[], occasion: string) {
  const matches = items.filter((item) => item.occasion.includes(occasion)).length;
  return Math.min(25, matches * 9 + 7);
}

export function generateOutfit(options?: {
  style?: string;
  occasion?: string;
  requiredProductId?: string;
  excludeIds?: string[];
  budget?: number;
  variant?: number;
}): Outfit {
  const style = options?.style ?? "minimal";
  const occasion = options?.occasion ?? "casual";
  const exclude = new Set(options?.excludeIds ?? []);
  const required = options?.requiredProductId
    ? products.find((item) => item.id === options.requiredProductId)
    : undefined;

  const available = products.filter((item) => item.stock > 0 && !exclude.has(item.id));
  const tops = available.filter((item) => ["tops", "dress"].includes(item.category));
  const bottoms = available.filter((item) => item.category === "bottoms");
  const shoes = available.filter((item) => item.category === "shoes");
  const extras = available.filter((item) => ["outerwear", "accessory"].includes(item.category));

  const pick = (pool: Product[], salt: number) => {
    const sorted = [...pool].sort((a, b) => {
      const aFit = Number(a.style.includes(style)) * 3 + Number(a.occasion.includes(occasion)) * 2 + a.stock / 100;
      const bFit = Number(b.style.includes(style)) * 3 + Number(b.occasion.includes(occasion)) * 2 + b.stock / 100;
      return bFit - aFit;
    });
    if (!sorted.length) return undefined;
    return sorted[salt % Math.min(sorted.length, 4)];
  };

  const seed = (options?.variant ?? 0) % 997;
  const items: Product[] = required ? [required] : [];

  if (!required || !["tops", "dress"].includes(required.category)) {
    const top = pick(tops, seed);
    if (top) items.push(top);
  }
  if (!items.some((item) => item.category === "dress") && (!required || required.category !== "bottoms")) {
    const bottom = pick(bottoms, seed + 2);
    if (bottom) items.push(bottom);
  }
  if (!required || required.category !== "shoes") {
    const shoe = pick(shoes, seed + 3);
    if (shoe) items.push(shoe);
  }
  const extra = pick(extras.filter((item) => !items.some((chosen) => chosen.id === item.id)), seed + 5);
  if (extra) items.push(extra);

  const deduped = Array.from(new Map(items.map((item) => [item.id, item])).values());
  const budget = options?.budget;
  let budgetItems = deduped;
  if (budget) {
    let total = budgetItems.reduce((sum, item) => sum + item.price, 0);
    while (total > budget && budgetItems.length > 2) {
      const removableIndex = budgetItems.findIndex((item) => ["outerwear", "accessory", "shoes"].includes(item.category));
      if (removableIndex === -1) break;
      budgetItems = budgetItems.filter((_, index) => index !== removableIndex);
      total = budgetItems.reduce((sum, item) => sum + item.price, 0);
    }
  }

  const color = budgetItems.length > 1
    ? pairScore(budgetItems[0], budgetItems[1])
    : 20;
  const score = Math.min(98, 32 + color + styleScore(budgetItems, style) + occasionScore(budgetItems, occasion));

  return {
    id: `look-${budgetItems.map((item) => item.id).join("-")}`,
    items: budgetItems,
    score,
    reason: `Phối theo ${style.replace("-", " ")} · ưu tiên ${occasion} · chỉ chọn sản phẩm còn hàng.`
  };
}

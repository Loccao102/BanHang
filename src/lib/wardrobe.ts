import type { Product } from "./products";

export type WardrobeGroup = "tops" | "bottoms" | "dresses" | "outerwear" | "sets";
export type OutfitSlot = "top" | "bottom" | "outerwear" | "one-piece";

export const wardrobeGroupLabels: Record<WardrobeGroup, string> = {
  tops: "Áo / corset",
  bottoms: "Quần & chân váy",
  dresses: "Váy / đầm",
  outerwear: "Áo khoác",
  sets: "Set nguyên bộ"
};

export const wardrobeGroupDescriptions: Record<WardrobeGroup, string> = {
  tops: "Phối cùng một món quần hoặc chân váy.",
  bottoms: "Quần và chân váy dùng chung một slot phối đồ.",
  dresses: "Look liền thân, thử riêng.",
  outerwear: "Lớp ngoài tùy chọn cho outfit áo + bottom.",
  sets: "Set hoàn chỉnh, thử riêng."
};

export function wardrobeGroup(product: Product): WardrobeGroup {
  if (product.category === "tops") return "tops";
  if (product.category === "bottoms") return "bottoms";
  if (product.category === "outerwear") return "outerwear";
  if (product.category === "dress") return "dresses";
  return "sets";
}

export function outfitSlot(product: Product): OutfitSlot {
  const group = wardrobeGroup(product);
  if (group === "tops") return "top";
  if (group === "bottoms") return "bottom";
  if (group === "outerwear") return "outerwear";
  return "one-piece";
}

export function normalizeOutfitSelection(currentIds: string[], nextProduct: Product, catalog: Product[]) {
  if (currentIds.includes(nextProduct.id)) {
    return currentIds.filter((id) => id !== nextProduct.id);
  }

  const nextSlot = outfitSlot(nextProduct);
  if (nextSlot === "one-piece") return [nextProduct.id];

  const currentProducts = currentIds
    .map((id) => catalog.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product))
    .filter((product) => outfitSlot(product) !== "one-piece" && outfitSlot(product) !== nextSlot);

  const slotOrder: OutfitSlot[] = ["top", "bottom", "outerwear", "one-piece"];
  return [...currentProducts, nextProduct]
    .sort((a, b) => slotOrder.indexOf(outfitSlot(a)) - slotOrder.indexOf(outfitSlot(b)))
    .map((product) => product.id);
}

export function isValidOutfit(products: Product[]) {
  if (!products.length || products.length > 3) return false;
  const slots = products.map(outfitSlot);

  if (slots.includes("one-piece")) {
    return products.length === 1 || (products.length === 2 && slots.includes("outerwear"));
  }

  if (new Set(slots).size !== slots.length) return false;

  return slots.every((slot) => slot === "top" || slot === "bottom" || slot === "outerwear");
}

export function outfitLabel(products: Product[]) {
  if (!products.length) return "Chưa chọn đồ";
  if (products.length === 1) {
    const slot = outfitSlot(products[0]);
    if (slot === "one-piece") {
      return wardrobeGroup(products[0]) === "sets" ? "Set nguyên bộ" : "Váy / đầm";
    }
    if (slot === "top") return "Áo";
    if (slot === "bottom") return "Quần / Chân váy";
    if (slot === "outerwear") return "Áo khoác";
    return products[0].name;
  }

  const labels: string[] = [];
  if (products.some((product) => outfitSlot(product) === "top")) labels.push("áo");
  if (products.some((product) => outfitSlot(product) === "bottom")) labels.push("quần / chân váy");
  if (products.some((product) => outfitSlot(product) === "outerwear")) labels.push("áo khoác");
  return labels.join(" + ");
}

export function sortOutfitProducts(products: Product[]) {
  const slotOrder: OutfitSlot[] = ["top", "bottom", "outerwear", "one-piece"];
  return [...products].sort((a, b) => slotOrder.indexOf(outfitSlot(a)) - slotOrder.indexOf(outfitSlot(b)));
}

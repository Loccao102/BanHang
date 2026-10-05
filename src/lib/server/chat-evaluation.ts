import type { Product } from "@/lib/products";
import type { IntentItemConstraint, OutfitRole, ShoppingIntent } from "@/lib/server/chat-intent";

function roleFromConstraint(item: IntentItemConstraint): Exclude<OutfitRole, "any"> | undefined {
  if (item.role !== "any") return item.role;
  if (item.category === "tops") return "top";
  if (item.category === "bottoms") return "bottom";
  if (item.category === "dress") return "dress";
  if (item.category === "outerwear") return "outerwear";
  if (item.category === "set") return "set";

  const type = item.types?.[0];
  if (type && ["corset", "crop-top", "bodysuit", "blouse", "shirt", "knit-top"].includes(type)) return "top";
  if (type && ["jeans", "trousers", "flare-pants", "shorts", "skirt"].includes(type)) return "bottom";
  if (type && ["mini-dress", "midi-dress", "maxi-dress", "bodycon-dress"].includes(type)) return "dress";
  if (type && ["blazer", "jacket", "cardigan"].includes(type)) return "outerwear";
  if (type === "set") return "set";
  return undefined;
}

function productRole(product: Product): Exclude<OutfitRole, "any"> {
  if (product.category === "tops") return "top";
  if (product.category === "bottoms") return "bottom";
  if (product.category === "dress") return "dress";
  if (product.category === "outerwear") return "outerwear";
  return "set";
}

function matchesHardConstraint(product: Product, item: IntentItemConstraint) {
  const role = roleFromConstraint(item);
  if (role && productRole(product) !== role) return false;
  if (item.category && product.category !== item.category) return false;
  if (item.types?.length && !item.types.includes(product.type)) return false;
  if (item.colorFamily && product.colorFamily !== item.colorFamily) return false;
  if (item.lengthClass && product.lengthClass !== item.lengthClass) return false;
  return true;
}

function occasionMatch(product: Product, occasion?: ShoppingIntent["occasion"]) {
  if (!occasion || occasion === "all") return true;
  const text = (product.occasion || []).join(" ").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

  if (occasion === "party") return /(tiec|su kien|party|bar|club|gala|da hoi|event)/.test(text);
  if (occasion === "date") return /(hen ho|date)/.test(text);
  if (occasion === "work") return /(di lam|cong so|work|office)/.test(text);
  if (occasion === "casual") return /(di choi|cafe|casual|dao pho)/.test(text);
  if (occasion === "concert") return /concert/.test(text);
  return true;
}

export type ChatRecommendationEvaluation = {
  hardConstraintPass: boolean;
  hardConstraintCoverage: number;
  outfitStructurePass: boolean;
  occasionMatchRate: number;
  selectedCount: number;
  intentConfidence: number;
  violations: string[];
};

export function evaluateRecommendation(
  intent: ShoppingIntent | null,
  products: Product[]
): ChatRecommendationEvaluation {
  if (!intent) {
    return {
      hardConstraintPass: true,
      hardConstraintCoverage: 1,
      outfitStructurePass: true,
      occasionMatchRate: 1,
      selectedCount: products.length,
      intentConfidence: 0,
      violations: []
    };
  }

  const constraints = intent.items.filter((item) => !item.keepPrevious);
  const violations: string[] = [];
  let satisfied = 0;

  for (const item of constraints) {
    const role = roleFromConstraint(item);
    const roleProducts = role
      ? products.filter((product) => productRole(product) === role)
      : products;
    const matches = roleProducts.some((product) => matchesHardConstraint(product, item));

    if (matches) {
      satisfied += 1;
    } else {
      const description = [
        role || item.category || "item",
        item.types?.join("/") || "",
        item.colorFamily || "",
        item.lengthClass || ""
      ].filter(Boolean).join(":");
      violations.push("missing_or_mismatched:" + description);
    }
  }

  const requestedRoles = new Set(
    constraints.map(roleFromConstraint).filter((role): role is Exclude<OutfitRole, "any"> => Boolean(role))
  );
  const selectedRoles = new Set(products.map(productRole));
  const outfitIntent = ["recommend_outfit", "modify_outfit", "add_outfit_to_cart"].includes(intent.intent);
  const outfitStructurePass = !outfitIntent ||
    Array.from(requestedRoles).every((role) => selectedRoles.has(role));

  if (!outfitStructurePass) violations.push("outfit_structure_mismatch");

  const occasionMatches = products.length
    ? products.filter((product) => occasionMatch(product, intent.occasion)).length / products.length
    : intent.occasion && intent.occasion !== "all" ? 0 : 1;

  const hardConstraintCoverage = constraints.length ? satisfied / constraints.length : 1;

  return {
    hardConstraintPass: hardConstraintCoverage === 1 && outfitStructurePass,
    hardConstraintCoverage: Number(hardConstraintCoverage.toFixed(3)),
    outfitStructurePass,
    occasionMatchRate: Number(occasionMatches.toFixed(3)),
    selectedCount: products.length,
    intentConfidence: Number(intent.confidence.toFixed(3)),
    violations
  };
}

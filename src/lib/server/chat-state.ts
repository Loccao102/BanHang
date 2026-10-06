import type { Product } from "@/lib/products";
import type { IntentItemConstraint, OutfitRole, ShoppingIntent } from "@/lib/server/chat-intent";

export type ShoppingRoleState = {
  role: Exclude<OutfitRole, "any">;
  category?: Product["category"];
  types?: Product["type"][];
  colorFamily?: Product["colorFamily"];
  lengthClass?: "mini" | "midi" | "maxi";
  fixedProductId?: string;
};

export type ShoppingState = {
  version: 1;
  outfit?: {
    roles: Partial<Record<Exclude<OutfitRole, "any">, ShoppingRoleState>>;
    occasion?: ShoppingIntent["occasion"];
    style?: string;
    budgetMax?: number;
    includeOuterwear: boolean;
    selectedProductIds: string[];
  };
};

const validRoles = new Set(["top", "bottom", "dress", "outerwear", "set"]);
const validCategories = new Set(["tops", "bottoms", "outerwear", "dress", "set"]);
const validColors = new Set(["black", "white", "navy", "beige", "blue", "brown", "red", "green", "gray", "pink"]);
const validTypes = new Set([
  "corset", "crop-top", "bodysuit", "blouse", "shirt", "knit-top",
  "blazer", "jacket", "cardigan", "jeans", "trousers", "flare-pants",
  "shorts", "skirt", "mini-dress", "midi-dress", "maxi-dress",
  "bodycon-dress", "set"
]);

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

function roleFromProduct(product: Product): Exclude<OutfitRole, "any"> {
  if (product.category === "tops") return "top";
  if (product.category === "bottoms") return "bottom";
  if (product.category === "dress") return "dress";
  if (product.category === "outerwear") return "outerwear";
  return "set";
}

function stateItem(roleState: ShoppingRoleState): IntentItemConstraint {
  return {
    role: roleState.role,
    ...(roleState.category ? { category: roleState.category } : {}),
    ...(roleState.types?.length ? { types: roleState.types } : {}),
    ...(roleState.colorFamily ? { colorFamily: roleState.colorFamily } : {}),
    ...(roleState.lengthClass ? { lengthClass: roleState.lengthClass } : {}),
    ...(roleState.fixedProductId ? { keepPrevious: true } : {})
  };
}

export function parseShoppingState(value: unknown): ShoppingState | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1) return null;
  if (!raw.outfit || typeof raw.outfit !== "object") return { version: 1 };

  const outfit = raw.outfit as Record<string, unknown>;
  const rawRoles = outfit.roles && typeof outfit.roles === "object"
    ? outfit.roles as Record<string, unknown>
    : {};
  const roles: ShoppingState["outfit"] extends infer O
    ? O extends { roles: infer R } ? R : never
    : never = {};

  for (const [key, value] of Object.entries(rawRoles)) {
    if (!validRoles.has(key) || !value || typeof value !== "object") continue;
    const item = value as Record<string, unknown>;
    const role = key as Exclude<OutfitRole, "any">;
    const category = validCategories.has(String(item.category)) ? item.category as Product["category"] : undefined;
    const colorFamily = validColors.has(String(item.colorFamily)) ? item.colorFamily as Product["colorFamily"] : undefined;
    const types = Array.isArray(item.types)
      ? item.types.filter((type): type is Product["type"] => validTypes.has(String(type))).slice(0, 5)
      : undefined;
    const lengthClass = ["mini", "midi", "maxi"].includes(String(item.lengthClass))
      ? item.lengthClass as "mini" | "midi" | "maxi"
      : undefined;

    roles[role] = {
      role,
      ...(category ? { category } : {}),
      ...(types?.length ? { types } : {}),
      ...(colorFamily ? { colorFamily } : {}),
      ...(lengthClass ? { lengthClass } : {}),
      ...(typeof item.fixedProductId === "string" && item.fixedProductId ? { fixedProductId: item.fixedProductId } : {})
    };
  }

  return {
    version: 1,
    outfit: {
      roles,
      ...(typeof outfit.occasion === "string" ? { occasion: outfit.occasion as ShoppingIntent["occasion"] } : {}),
      ...(typeof outfit.style === "string" && outfit.style ? { style: outfit.style.slice(0, 40) } : {}),
      ...(Number.isFinite(Number(outfit.budgetMax)) && Number(outfit.budgetMax) > 0 ? { budgetMax: Math.round(Number(outfit.budgetMax)) } : {}),
      includeOuterwear: outfit.includeOuterwear === true,
      selectedProductIds: Array.isArray(outfit.selectedProductIds)
        ? outfit.selectedProductIds.filter((id): id is string => typeof id === "string").slice(0, 8)
        : []
    }
  };
}

export function applyShoppingState(intent: ShoppingIntent, previous: ShoppingState | null): ShoppingIntent {
  const previousOutfit = previous?.outfit;
  const shouldInherit = Boolean(
    previousOutfit &&
    (intent.intent === "modify_outfit" || intent.inheritPrevious)
  );

  if (!shouldInherit || !previousOutfit) return intent;

  const itemsByRole = new Map<Exclude<OutfitRole, "any">, IntentItemConstraint>();

  for (const roleState of Object.values(previousOutfit.roles)) {
    if (!roleState) continue;
    itemsByRole.set(roleState.role, stateItem(roleState));
  }

  for (const item of intent.items) {
    const role = roleFromConstraint(item);
    if (!role) continue;

    if (item.keepPrevious) {
      const previousRole = previousOutfit.roles[role];
      if (previousRole) {
        itemsByRole.set(role, {
          ...stateItem(previousRole),
          keepPrevious: true
        });
      } else {
        itemsByRole.set(role, item);
      }
      continue;
    }

    // Explicit follow-ups patch the previous role instead of replacing it wholesale.
    // Example: "váy dài hơn" must preserve an earlier white skirt constraint while only
    // changing length. An explicit field in the new intent always wins.
    const previousRole = previousOutfit.roles[role];
    const previousItem = previousRole ? stateItem(previousRole) : undefined;
    itemsByRole.set(role, {
      role,
      ...(previousItem?.category ? { category: previousItem.category } : {}),
      ...(previousItem?.types?.length ? { types: previousItem.types } : {}),
      ...(previousItem?.colorFamily ? { colorFamily: previousItem.colorFamily } : {}),
      ...(previousItem?.lengthClass ? { lengthClass: previousItem.lengthClass } : {}),
      ...(item.category ? { category: item.category } : {}),
      ...(item.types?.length ? { types: item.types } : {}),
      ...(item.colorFamily ? { colorFamily: item.colorFamily } : {}),
      ...(item.lengthClass ? { lengthClass: item.lengthClass } : {})
    });
  }

  return {
    ...intent,
    intent: intent.intent === "recommend_outfit" ? "modify_outfit" : intent.intent,
    inheritPrevious: true,
    targetScope: "outfit",
    occasion: intent.occasion ?? previousOutfit.occasion,
    style: intent.style ?? previousOutfit.style,
    budgetMax: intent.budgetMax ?? previousOutfit.budgetMax,
    includeOuterwear: intent.includeOuterwear || previousOutfit.includeOuterwear,
    items: Array.from(itemsByRole.values())
  };
}

export function buildShoppingState(
  intent: ShoppingIntent | null,
  selectedProducts: Product[],
  previous: ShoppingState | null
): ShoppingState {
  if (!intent) return previous ?? { version: 1 };

  const outfitIntent = ["recommend_outfit", "modify_outfit", "add_outfit_to_cart"].includes(intent.intent);
  if (!outfitIntent) return previous ?? { version: 1 };

  const shouldCarryPrevious = Boolean(
    previous?.outfit &&
    (intent.intent === "modify_outfit" || intent.intent === "add_outfit_to_cart" || intent.inheritPrevious)
  );
  const baseRoles: NonNullable<ShoppingState["outfit"]>["roles"] =
    shouldCarryPrevious && previous?.outfit
      ? { ...previous.outfit.roles }
      : {};

  for (const item of intent.items) {
    const role = roleFromConstraint(item);
    if (!role) continue;

    const selected = selectedProducts.find((product) => roleFromProduct(product) === role);
    const previousRole = previous?.outfit?.roles[role];

    baseRoles[role] = {
      role,
      ...(item.category ? { category: item.category } : {}),
      ...(item.types?.length ? { types: item.types } : {}),
      ...(item.colorFamily ? { colorFamily: item.colorFamily } : {}),
      ...(item.lengthClass ? { lengthClass: item.lengthClass } : {}),
      ...(item.keepPrevious && previousRole?.fixedProductId
        ? { fixedProductId: previousRole.fixedProductId }
        : item.keepPrevious && selected
        ? { fixedProductId: selected.id }
        : {})
    };
  }

  // If a role was only implicit in a valid selected outfit, keep its structure so
  // follow-up references still know this was a top+bottom/dress/set outfit.
  for (const product of selectedProducts) {
    const role = roleFromProduct(product);
    if (baseRoles[role]) continue;
    baseRoles[role] = {
      role,
      category: product.category
    };
  }

  return {
    version: 1,
    outfit: {
      roles: baseRoles,
      ...(intent.occasion || previous?.outfit?.occasion
        ? { occasion: intent.occasion ?? previous?.outfit?.occasion }
        : {}),
      ...(intent.style || previous?.outfit?.style
        ? { style: intent.style ?? previous?.outfit?.style }
        : {}),
      ...(intent.budgetMax || previous?.outfit?.budgetMax
        ? { budgetMax: intent.budgetMax ?? previous?.outfit?.budgetMax }
        : {}),
      includeOuterwear: intent.includeOuterwear || Boolean(previous?.outfit?.includeOuterwear),
      selectedProductIds: (
        selectedProducts.length
          ? selectedProducts.map((product) => product.id)
          : previous?.outfit?.selectedProductIds ?? []
      ).slice(0, 8)
    }
  };
}

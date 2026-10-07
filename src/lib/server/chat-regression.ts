import assert from "node:assert/strict";
import { products as productionCatalog, type Product } from "../products";
import type { ShoppingIntent } from "./chat-intent";
import { inferFallbackShoppingIntent, retrieveProductsFromIntent } from "./chat-intent";
import { applyShoppingState, buildShoppingState, type ShoppingState } from "./chat-state";
import { evaluateRecommendation } from "./chat-evaluation";
import { semanticTextScore } from "./product-semantic-profile";
import { coordinateSmartOutfit } from "../stylist-outfit-engine";
import { buildAgentPlan } from "./chat-agent";

function product(overrides: Partial<Product> & Pick<Product, "id" | "category" | "type" | "colorFamily">): Product {
  const colorLabels: Record<Product["colorFamily"], string> = {
    black: "Đen", white: "Trắng", navy: "Navy", beige: "Be",
    blue: "Xanh", brown: "Nâu", red: "Đỏ", green: "Xanh lá",
    gray: "Xám", pink: "Hồng"
  };

  return {
    id: overrides.id,
    sku: overrides.id.toUpperCase(),
    name: overrides.name ?? overrides.id,
    subtitle: overrides.subtitle ?? "Regression fixture",
    category: overrides.category,
    type: overrides.type,
    gender: "women",
    price: overrides.price ?? 1_000_000,
    color: overrides.color ?? colorLabels[overrides.colorFamily],
    colorFamily: overrides.colorFamily,
    sizes: overrides.sizes ?? ["S", "M", "L"],
    stock: overrides.stock ?? 10,
    stockTracked: true,
    image: overrides.image ?? "/fixture.jpg",
    images: overrides.images ?? ["/fixture.jpg"],
    style: overrides.style ?? [],
    occasion: overrides.occasion ?? [],
    material: overrides.material ?? "fixture",
    fit: overrides.fit ?? "regular",
    active: overrides.active ?? true,
    formality: overrides.formality ?? 3,
    coverage: overrides.coverage ?? 3,
    visualWeight: overrides.visualWeight ?? 3,
    volume: overrides.volume ?? "balanced",
    lengthClass: overrides.lengthClass,
    silhouette: overrides.silhouette,
    styleKeywords: overrides.styleKeywords ?? overrides.style ?? [],
    pairingTags: overrides.pairingTags ?? [],
    avoidPairingTags: overrides.avoidPairingTags ?? [],
    aiSearchText: overrides.aiSearchText,
    featured: overrides.featured ?? false,
    isNew: overrides.isNew ?? false
  };
}

const redCorset = product({
  id: "red-corset",
  name: "Red Gala Corset",
  category: "tops",
  type: "corset",
  colorFamily: "red",
  price: 1_300_000,
  style: ["glam", "sexy"],
  occasion: ["đi tiệc", "sự kiện"],
  formality: 5,
  coverage: 2,
  visualWeight: 5,
  volume: "fitted",
  pairingTags: ["skirt", "glam"]
});

const redCasualTop = product({
  id: "red-casual-top",
  name: "Red Casual Crop",
  category: "tops",
  type: "crop-top",
  colorFamily: "red",
  price: 700_000,
  style: ["casual"],
  occasion: ["đi chơi", "cafe"],
  formality: 2,
  coverage: 2,
  visualWeight: 2,
  volume: "fitted"
});

const redPartyCrop = product({
  id: "red-party-crop",
  name: "Red Party Crop",
  category: "tops",
  type: "crop-top",
  colorFamily: "red",
  price: 850_000,
  style: ["glam"],
  occasion: ["đi tiệc"],
  formality: 3,
  coverage: 2,
  visualWeight: 3,
  volume: "fitted"
});

const blackCorset = product({
  id: "black-corset",
  name: "Black Corset",
  category: "tops",
  type: "corset",
  colorFamily: "black",
  price: 1_250_000,
  style: ["glam"],
  occasion: ["đi tiệc"],
  formality: 5,
  volume: "fitted"
});

const whitePartySkirt = product({
  id: "white-party-skirt",
  name: "White Gala Midi Skirt",
  category: "bottoms",
  type: "skirt",
  colorFamily: "white",
  price: 1_100_000,
  style: ["glam", "elegant"],
  occasion: ["đi tiệc", "sự kiện"],
  formality: 5,
  lengthClass: "midi",
  volume: "balanced",
  pairingTags: ["corset", "glam"]
});

const whiteCasualSkirt = product({
  id: "white-casual-skirt",
  name: "White Tennis Mini Skirt",
  category: "bottoms",
  type: "skirt",
  colorFamily: "white",
  price: 700_000,
  style: ["casual", "preppy"],
  occasion: ["đi chơi", "cafe"],
  formality: 2,
  lengthClass: "mini",
  volume: "voluminous"
});

const whitePartyMini = product({
  id: "white-party-mini",
  name: "White Party Mini Skirt",
  category: "bottoms",
  type: "skirt",
  colorFamily: "white",
  price: 800_000,
  style: ["glam"],
  occasion: ["đi tiệc"],
  formality: 3,
  lengthClass: "mini",
  visualWeight: 3,
  volume: "voluminous"
});

const blackSkirt = product({
  id: "black-skirt",
  name: "Black Midi Skirt",
  category: "bottoms",
  type: "skirt",
  colorFamily: "black",
  price: 900_000,
  style: ["elegant"],
  occasion: ["đi tiệc"],
  formality: 4,
  lengthClass: "midi"
});

const whiteTrousers = product({
  id: "white-trousers",
  name: "White Trousers",
  category: "bottoms",
  type: "trousers",
  colorFamily: "white",
  price: 1_000_000,
  style: ["chic"],
  occasion: ["đi làm"],
  formality: 4,
  lengthClass: "maxi"
});

const redDress = product({
  id: "red-dress",
  name: "Red Evening Dress",
  category: "dress",
  type: "maxi-dress",
  colorFamily: "red",
  price: 2_400_000,
  style: ["glam", "elegant"],
  occasion: ["đi tiệc", "gala"],
  formality: 5,
  lengthClass: "maxi"
});

const catalog = [
  redCorset,
  redCasualTop,
  redPartyCrop,
  blackCorset,
  whitePartySkirt,
  whiteCasualSkirt,
  whitePartyMini,
  blackSkirt,
  whiteTrousers,
  redDress
];

function intent(overrides: Partial<ShoppingIntent>): ShoppingIntent {
  return {
    intent: "recommend_outfit",
    confidence: 0.95,
    inheritPrevious: false,
    targetScope: "outfit",
    includeOuterwear: false,
    items: [],
    ...overrides
  };
}

function initialRedWhiteIntent() {
  return intent({
    items: [
      { role: "top", category: "tops", colorFamily: "red" },
      { role: "bottom", category: "bottoms", types: ["skirt"], colorFamily: "white" }
    ]
  });
}

const tests: Array<{ name: string; run: () => void }> = [];

function test(name: string, run: () => void) {
  tests.push({ name, run });
}

test("initial outfit state stores explicit red top + white skirt", () => {
  const state = buildShoppingState(initialRedWhiteIntent(), [redCorset, whiteCasualSkirt], null);
  assert.equal(state.outfit?.roles.top?.colorFamily, "red");
  assert.equal(state.outfit?.roles.bottom?.colorFamily, "white");
  assert.deepEqual(state.outfit?.roles.bottom?.types, ["skirt"]);
});

test("soft party refinement inherits original hard constraints", () => {
  const previous = buildShoppingState(initialRedWhiteIntent(), [redCorset, whiteCasualSkirt], null);
  const merged = applyShoppingState(intent({
    intent: "modify_outfit",
    inheritPrevious: true,
    occasion: "party",
    items: []
  }), previous);

  const top = merged.items.find((item) => item.role === "top");
  const bottom = merged.items.find((item) => item.role === "bottom");
  assert.equal(top?.colorFamily, "red");
  assert.equal(bottom?.colorFamily, "white");
  assert.deepEqual(bottom?.types, ["skirt"]);
  assert.equal(merged.occasion, "party");
});

test("style-only refinement keeps outfit shape", () => {
  const previous = buildShoppingState(initialRedWhiteIntent(), [redCorset, whiteCasualSkirt], null);
  const merged = applyShoppingState(intent({
    intent: "modify_outfit",
    inheritPrevious: true,
    style: "glam",
    items: []
  }), previous);

  assert.equal(merged.items.some((item) => item.role === "top"), true);
  assert.equal(merged.items.some((item) => item.role === "bottom"), true);
  assert.equal(merged.style, "glam");
});

test("partial bottom length patch preserves white skirt constraint", () => {
  const previous = buildShoppingState(initialRedWhiteIntent(), [redCorset, whiteCasualSkirt], null);
  const merged = applyShoppingState(intent({
    intent: "modify_outfit",
    inheritPrevious: true,
    items: [{ role: "bottom", lengthClass: "midi" }]
  }), previous);

  const bottom = merged.items.find((item) => item.role === "bottom");
  assert.equal(bottom?.colorFamily, "white");
  assert.deepEqual(bottom?.types, ["skirt"]);
  assert.equal(bottom?.lengthClass, "midi");
});

test("partial top color patch keeps role while changing color", () => {
  const previous = buildShoppingState(initialRedWhiteIntent(), [redCorset, whiteCasualSkirt], null);
  const merged = applyShoppingState(intent({
    intent: "modify_outfit",
    inheritPrevious: true,
    items: [{ role: "top", colorFamily: "black" }]
  }), previous);

  const top = merged.items.find((item) => item.role === "top");
  assert.equal(top?.colorFamily, "black");
  const bottom = merged.items.find((item) => item.role === "bottom");
  assert.equal(bottom?.colorFamily, "white");
});

test("explicit bottom type + color replaces those fields only", () => {
  const previous = buildShoppingState(initialRedWhiteIntent(), [redCorset, whiteCasualSkirt], null);
  const merged = applyShoppingState(intent({
    intent: "modify_outfit",
    inheritPrevious: true,
    items: [{ role: "bottom", types: ["trousers"], colorFamily: "black" }]
  }), previous);

  const bottom = merged.items.find((item) => item.role === "bottom");
  assert.deepEqual(bottom?.types, ["trousers"]);
  assert.equal(bottom?.colorFamily, "black");
});

test("keepPrevious marks exact previous product as fixed in next state", () => {
  const previous: ShoppingState = buildShoppingState(
    initialRedWhiteIntent(),
    [redCorset, whitePartySkirt],
    null
  );
  const merged = applyShoppingState(intent({
    intent: "modify_outfit",
    inheritPrevious: true,
    items: [{ role: "bottom", keepPrevious: true }]
  }), previous);
  const next = buildShoppingState(merged, [blackCorset, whitePartySkirt], previous);
  assert.equal(next.outfit?.roles.bottom?.fixedProductId, "white-party-skirt");
});

test("budget persists across soft refinements", () => {
  const previous = buildShoppingState(intent({
    budgetMax: 2_600_000,
    items: initialRedWhiteIntent().items
  }), [redCorset, whitePartySkirt], null);
  const merged = applyShoppingState(intent({
    intent: "modify_outfit",
    inheritPrevious: true,
    occasion: "party",
    items: []
  }), previous);
  assert.equal(merged.budgetMax, 2_600_000);
});

test("outfit engine obeys red top + white skirt hard constraints", () => {
  const outfit = coordinateSmartOutfit({
    catalog,
    setType: "top_bottom",
    preferredTopColor: "red",
    preferredBottomColor: "white",
    preferredBottomTypes: ["skirt"]
  });
  const top = outfit.items.find((item) => item.role === "top")?.product;
  const bottom = outfit.items.find((item) => item.role === "bottom")?.product;
  assert.equal(top?.colorFamily, "red");
  assert.equal(bottom?.colorFamily, "white");
  assert.equal(bottom?.type, "skirt");
});

test("party refinement upgrades to party-compatible red top + white skirt", () => {
  const outfit = coordinateSmartOutfit({
    catalog,
    setType: "top_bottom",
    occasion: "party",
    preferredTopColor: "red",
    preferredBottomColor: "white",
    preferredBottomTypes: ["skirt"]
  });
  const ids = outfit.items.map((item) => item.product.id);
  assert.equal(ids.includes("red-corset"), true);
  assert.equal(ids.includes("white-party-skirt"), true);
  assert.equal(ids.includes("red-dress"), false);
});

test("party ranking prefers the more formal pair when both pairs match party", () => {
  const outfit = coordinateSmartOutfit({
    catalog: [redCorset, redPartyCrop, whitePartySkirt, whitePartyMini],
    setType: "top_bottom",
    occasion: "party",
    style: "glam",
    preferredTopColor: "red",
    preferredBottomColor: "white",
    preferredBottomTypes: ["skirt"]
  });
  const ids = outfit.items.map((item) => item.product.id);
  assert.equal(ids.includes("red-corset"), true);
  assert.equal(ids.includes("white-party-skirt"), true);
});

test("length hard constraint selects midi white skirt", () => {
  const outfit = coordinateSmartOutfit({
    catalog,
    setType: "top_bottom",
    preferredTopColor: "red",
    preferredBottomColor: "white",
    preferredBottomTypes: ["skirt"],
    preferredBottomLength: "midi"
  });
  const bottom = outfit.items.find((item) => item.role === "bottom")?.product;
  assert.equal(bottom?.id, "white-party-skirt");
});

test("engine never substitutes trousers for requested skirt", () => {
  const outfit = coordinateSmartOutfit({
    catalog: [redCorset, whiteTrousers],
    setType: "top_bottom",
    preferredTopColor: "red",
    preferredBottomColor: "white",
    preferredBottomTypes: ["skirt"]
  });
  assert.equal(outfit.items.length, 0);
});

test("engine never substitutes another color when requested color is unavailable", () => {
  const outfit = coordinateSmartOutfit({
    catalog: [redCorset, blackSkirt],
    setType: "top_bottom",
    preferredTopColor: "red",
    preferredBottomColor: "white",
    preferredBottomTypes: ["skirt"]
  });
  assert.equal(outfit.items.length, 0);
});

test("budget is a hard outfit constraint", () => {
  const outfit = coordinateSmartOutfit({
    catalog,
    setType: "top_bottom",
    preferredTopColor: "red",
    preferredBottomColor: "white",
    preferredBottomTypes: ["skirt"],
    budget: 1_000_000
  });
  assert.equal(outfit.items.length, 0);
});

test("fixed bottom SKU is preserved when explicitly kept", () => {
  const outfit = coordinateSmartOutfit({
    catalog,
    setType: "top_bottom",
    preferredTopColor: "red",
    fixedBottomProductId: "white-casual-skirt"
  });
  const bottom = outfit.items.find((item) => item.role === "bottom")?.product;
  assert.equal(bottom?.id, "white-casual-skirt");
});

test("quality evaluation passes a valid red + white-skirt outfit", () => {
  const result = evaluateRecommendation(initialRedWhiteIntent(), [redCorset, whitePartySkirt]);
  assert.equal(result.hardConstraintPass, true);
  assert.equal(result.hardConstraintCoverage, 1);
  assert.equal(result.outfitStructurePass, true);
});

test("quality evaluation catches wrong color", () => {
  const result = evaluateRecommendation(initialRedWhiteIntent(), [redCorset, blackSkirt]);
  assert.equal(result.hardConstraintPass, false);
  assert.equal(result.violations.some((value) => value.includes("bottom:skirt:white")), true);
});

test("quality evaluation catches structure collapse into a dress", () => {
  const result = evaluateRecommendation(initialRedWhiteIntent(), [redDress]);
  assert.equal(result.outfitStructurePass, false);
  assert.equal(result.hardConstraintPass, false);
});

test("occasion evaluation recognizes party products", () => {
  const result = evaluateRecommendation(intent({
    occasion: "party",
    items: initialRedWhiteIntent().items
  }), [redCorset, whitePartySkirt]);
  assert.equal(result.occasionMatchRate, 1);
});

test("semantic profile understands dạ-tiệc/glam vocabulary", () => {
  assert.equal(semanticTextScore(redCorset, "dạ tiệc sang trọng glam") > 0, true);
  assert.equal(semanticTextScore(redCasualTop, "dạ tiệc sang trọng glam") < semanticTextScore(redCorset, "dạ tiệc sang trọng glam"), true);
});

test("structured retrieval keeps explicit color/type candidates above unrelated products", () => {
  const found = retrieveProductsFromIntent(
    intent({
      intent: "search_products",
      targetScope: "single",
      items: [{ role: "bottom", category: "bottoms", types: ["skirt"], colorFamily: "white" }]
    }),
    catalog,
    5
  );
  assert.equal(found.length > 0, true);
  assert.equal(found.every((item) => item.category === "bottoms" && item.type === "skirt" && item.colorFamily === "white"), true);
});

test("fallback intent creates stateful red + white-skirt outfit", () => {
  const parsed = inferFallbackShoppingIntent({
    message: "Mình muốn một set áo đỏ và chân váy trắng để đi tiệc"
  });
  assert.equal(parsed.intent, "recommend_outfit");
  assert.equal(parsed.occasion, "party");
  assert.equal(parsed.items.some((item) => item.role === "top" && item.colorFamily === "red"), true);
  assert.equal(parsed.items.some((item) => item.role === "bottom" && item.colorFamily === "white" && item.types?.includes("skirt")), true);
});

test("fallback follow-up keeps exact top and patches white skirt to midi", () => {
  const previous = buildShoppingState(initialRedWhiteIntent(), [redCorset, whiteCasualSkirt], null);
  const parsed = inferFallbackShoppingIntent({
    message: "Váy ngắn quá, đổi sang váy midi nhưng giữ nguyên áo nhé.",
    contextProducts: [redCorset, whiteCasualSkirt],
    shoppingState: previous
  });
  const merged = applyShoppingState(parsed, previous);
  assert.equal(merged.intent, "modify_outfit");
  const top = merged.items.find((item) => item.role === "top");
  const bottom = merged.items.find((item) => item.role === "bottom");
  assert.equal(top?.keepPrevious, true);
  assert.equal(bottom?.colorFamily, "white");
  assert.deepEqual(bottom?.types, ["skirt"]);
  assert.equal(bottom?.lengthClass, "midi");
});

test("fallback budget refinement preserves prior outfit constraints", () => {
  const previous = buildShoppingState(initialRedWhiteIntent(), [redCorset, whitePartySkirt], null);
  const parsed = inferFallbackShoppingIntent({
    message: "Ngân sách cả set dưới 2 triệu được không?",
    contextProducts: [redCorset, whitePartySkirt],
    shoppingState: previous
  });
  const merged = applyShoppingState(parsed, previous);
  assert.equal(merged.intent, "modify_outfit");
  assert.equal(merged.budgetMax, 2_000_000);
  assert.equal(merged.items.find((item) => item.role === "top")?.colorFamily, "red");
  assert.equal(merged.items.find((item) => item.role === "bottom")?.colorFamily, "white");
});

test("add-outfit intent keeps previous state snapshot", () => {
  const previous = buildShoppingState(initialRedWhiteIntent(), [redCorset, whitePartySkirt], null);
  const actionIntent = inferFallbackShoppingIntent({
    message: "Thêm cả set đang chọn vào giỏ cho mình.",
    contextProducts: [redCorset, whitePartySkirt],
    shoppingState: previous
  });
  const next = buildShoppingState(actionIntent, [redCorset, whitePartySkirt], previous);
  assert.equal(actionIntent.intent, "add_outfit_to_cart");
  assert.equal(next.outfit?.roles.top?.colorFamily, "red");
  assert.equal(next.outfit?.roles.bottom?.colorFamily, "white");
  assert.equal(next.outfit?.selectedProductIds.length, 2);
});


test("failed midi refinement never resurrects the stale mini skirt", () => {
  const previous = buildShoppingState(initialRedWhiteIntent(), [redCorset, whiteCasualSkirt], null);
  const parsed = inferFallbackShoppingIntent({
    message: "Váy ngắn quá, đổi sang váy midi nhưng giữ nguyên áo nhé.",
    contextProducts: [redCorset, whiteCasualSkirt],
    shoppingState: previous
  });
  const merged = applyShoppingState(parsed, previous);
  const next = buildShoppingState(merged, [], previous);

  assert.equal(next.outfit?.roles.top?.fixedProductId, redCorset.id);
  assert.equal(next.outfit?.roles.bottom?.lengthClass, "midi");
  assert.equal(next.outfit?.roles.bottom?.fixedProductId, undefined);
  assert.equal(next.outfit?.roles.bottom?.selectedProductId, undefined);
  assert.equal(next.outfit?.selectedProductIds.includes(whiteCasualSkirt.id), false);
});

test("operational intents stay grounded in current products instead of random catalog cards", () => {
  const sizeFound = retrieveProductsFromIntent(
    intent({ intent: "size_advice", targetScope: "previous", items: [] }),
    catalog,
    5,
    []
  );
  assert.deepEqual(sizeFound, []);

  const couponFound = retrieveProductsFromIntent(
    intent({ intent: "coupon", targetScope: "previous", items: [] }),
    catalog,
    5,
    [redCorset, whitePartySkirt]
  );
  assert.deepEqual(couponFound.map((item) => item.id), [redCorset.id, whitePartySkirt.id]);
});

test("size advice persists requested size into the outfit state for later cart actions", () => {
  const previous = buildShoppingState(initialRedWhiteIntent(), [redCorset, whitePartySkirt], null);
  const sizeIntent = inferFallbackShoppingIntent({
    message: "Áo đang chọn còn size M không?",
    contextProducts: [redCorset, whitePartySkirt],
    shoppingState: previous
  });
  const sized = buildShoppingState(sizeIntent, [redCorset, whitePartySkirt], previous);
  assert.equal(sized.outfit?.requestedSize, "M");

  const addIntent = inferFallbackShoppingIntent({
    message: "Thêm cả set đang chọn vào giỏ cho mình.",
    contextProducts: [redCorset, whitePartySkirt],
    shoppingState: sized
  });
  const merged = applyShoppingState(addIntent, sized);
  assert.equal(merged.requestedSize, "M");
});

test("generic Vietnamese coupon question never turns 'đang' into coupon code ANG", () => {
  const plan = buildAgentPlan({
    message: "Có mã giảm giá nào đang áp được không?",
    found: [redCorset, whitePartySkirt],
    contextProducts: [redCorset, whitePartySkirt],
    catalog,
    orders: [],
    coupons: [{
      id: "welcome",
      code: "WELCOME15",
      type: "percentage",
      value: 15,
      minOrder: 0,
      maxDiscount: 500_000,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any],
    loggedIn: false,
    intent: intent({
      intent: "coupon",
      targetScope: "previous",
      items: [],
      couponCode: "ANG"
    })
  });

  const couponActions = plan.actions.filter((action) => action.type === "apply_coupon");
  assert.equal(couponActions.some((action) => action.code === "ANG"), false);
  assert.equal(couponActions.some((action) => action.code === "WELCOME15"), true);
});


test("modesty language becomes a hard coverage constraint on the requested outfit", () => {
  const parsed = inferFallbackShoppingIntent({
    message: "Mình muốn một set áo đỏ và chân váy trắng để đi tiệc, sang nhưng không quá hở.",
    contextProducts: []
  });

  const top = parsed.items.find((item) => item.role === "top");
  const bottom = parsed.items.find((item) => item.role === "bottom");
  assert.equal(parsed.intent, "recommend_outfit");
  assert.equal(top?.colorFamily, "red");
  assert.equal(bottom?.colorFamily, "white");
  assert.equal(top?.minCoverage, 3);
  assert.equal(bottom?.minCoverage, 3);
});

test("coverage hard constraint rejects revealing red top and selects a covered alternative", () => {
  const modestRedBlouse = product({
    id: "red-modest-blouse",
    name: "Red Covered Blouse",
    category: "tops",
    type: "blouse",
    colorFamily: "red",
    coverage: 4,
    style: ["elegant"],
    occasion: ["đi tiệc"],
    formality: 4
  });

  const outfit = coordinateSmartOutfit({
    catalog: [redCorset, modestRedBlouse, whitePartySkirt],
    setType: "top_bottom",
    occasion: "party",
    preferredTopColor: "red",
    preferredBottomColor: "white",
    preferredBottomTypes: ["skirt"],
    minTopCoverage: 3,
    minBottomCoverage: 3
  });

  const top = outfit.items.find((item) => item.role === "top")?.product;
  assert.equal(top?.id, modestRedBlouse.id);
  assert.ok(outfit.items.every((item) => (item.product.coverage ?? 0) >= 3));
});

test("relative 'kín hơn' raises coverage above the current top and persists in state", () => {
  const previous = buildShoppingState(initialRedWhiteIntent(), [redCorset, whitePartySkirt], null);
  const parsed = inferFallbackShoppingIntent({
    message: "Giữ chân váy đó, đổi áo sang corset đỏ nhưng kín hơn một chút.",
    contextProducts: [redCorset, whitePartySkirt],
    shoppingState: previous
  });

  const top = parsed.items.find((item) => item.role === "top");
  assert.equal(top?.minCoverage, 3);

  const merged = applyShoppingState(parsed, previous);
  assert.equal(merged.items.find((item) => item.role === "top")?.minCoverage, 3);

  const nextState = buildShoppingState(merged, [], previous);
  assert.equal(nextState.outfit?.roles.top?.minCoverage, 3);
});

test("production red-top + white-skirt catalog does not violate 'không quá hở'", () => {
  const parsed = inferFallbackShoppingIntent({
    message: "Mình muốn một set áo đỏ và chân váy trắng để đi tiệc, sang nhưng không quá hở.",
    contextProducts: []
  });
  const top = parsed.items.find((item) => item.role === "top");
  const bottom = parsed.items.find((item) => item.role === "bottom");

  const outfit = coordinateSmartOutfit({
    catalog: productionCatalog,
    setType: "top_bottom",
    occasion: parsed.occasion ?? "all",
    style: parsed.style ?? "all",
    preferredTopColor: top?.colorFamily,
    preferredBottomColor: bottom?.colorFamily,
    preferredTopTypes: top?.types,
    preferredBottomTypes: bottom?.types,
    minTopCoverage: top?.minCoverage,
    minBottomCoverage: bottom?.minCoverage
  });

  assert.equal(outfit.items.length, 0);
});

test("recommendation evaluation treats coverage like color/type/length hard constraints", () => {
  const scored = evaluateRecommendation(
    intent({
      intent: "recommend_outfit",
      targetScope: "outfit",
      items: [
        { role: "top", category: "tops", colorFamily: "red", minCoverage: 3 },
        { role: "bottom", category: "bottoms", types: ["skirt"], colorFamily: "white", minCoverage: 3 }
      ]
    }),
    [redCorset, whitePartySkirt]
  );

  assert.equal(scored.hardConstraintPass, false);
});

let passed = 0;
for (const item of tests) {
  try {
    item.run();
    passed += 1;
    console.log(`✓ ${item.name}`);
  } catch (error) {
    console.error(`✗ ${item.name}`);
    throw error;
  }
}

console.log(`\nChat regression: ${passed}/${tests.length} passed.`);


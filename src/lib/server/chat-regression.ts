import assert from "node:assert/strict";
import { pantsTypes, storefrontCategory, products as productionCatalog, type Product } from "../products";
import { outfitLabel, wardrobeGroup, normalizeOutfitSelection } from "../wardrobe";
import type { ShoppingIntent } from "./chat-intent";
import { inferFallbackShoppingIntent, retrieveProductsFromIntent } from "./chat-intent";
import { applyShoppingState, buildShoppingState, type ShoppingState } from "./chat-state";
import { evaluateRecommendation } from "./chat-evaluation";
import { semanticTextScore } from "./product-semantic-profile";
import { coordinateSmartOutfit, outfitSelectionKey } from "../stylist-outfit-engine";
import { buildAgentPlan } from "./chat-agent";
import { canReadPaymentStatus, canSimulatePayment, canRecordCodCollection } from "./payment-access";
import { getSearchPreviewProducts } from "../product-search";
import { fastCatalogLookupReply } from "./chat-fast-reply";
import { allowedOrderStatuses, canTransitionOrderStatus, isOrderStatus } from "../order-workflow";
import { socialChatReply } from "./chat-social";
import { retrieveProducts } from "./chat-assistant";

function product(overrides: Partial<Product> & Pick<Product, "id" | "category" | "type" | "colorFamily">): Product {
  const colorLabels: Record<Product["colorFamily"], string> = {
    black: "Đen", white: "Trắng", navy: "Navy", beige: "Be",
    blue: "Xanh", brown: "Nâu", red: "Đỏ", green: "Xanh lá",
    gray: "Xám", pink: "Hồng"
  };

  return {
    id: overrides.id,
    sku: overrides.id.toUpperCase(),
    groupCode: overrides.groupCode,
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
  assert.equal(nextState.outfit?.roles.bottom?.minCoverage, undefined);
  assert.equal(nextState.outfit?.roles.bottom?.fixedProductId, whitePartySkirt.id);
  assert.equal(nextState.outfit?.roles.bottom?.selectedProductId, whitePartySkirt.id);
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

test("terse 'sexy sexy' follow-up stays a modify-outfit refinement", () => {
  const previousTop = productionCatalog.find((item) =>
    item.id === "lsoul-athena-sweetheart-satin-tube-top-tp-athena-tube-blk"
  );
  const previousBottom = productionCatalog.find((item) =>
    item.id === "lsoul-atelier-wide-trousers-black"
  );
  assert.ok(previousTop);
  assert.ok(previousBottom);

  const previous = buildShoppingState(
    intent({
      intent: "recommend_outfit",
      targetScope: "outfit",
      budgetMax: 3_000_000,
      items: []
    }),
    [previousTop, previousBottom],
    null
  );

  const parsed = inferFallbackShoppingIntent({
    message: "tôi muốn nó sexy sexy cơ",
    contextProducts: [previousTop, previousBottom],
    shoppingState: previous
  });

  assert.equal(parsed.intent, "modify_outfit");
  assert.equal(parsed.targetScope, "outfit");
  assert.equal(parsed.inheritPrevious, true);
  assert.equal(parsed.style, "sexy");
});

test("style refinement exposes only final outfit products, not retrieval candidates", () => {
  const previousTop = productionCatalog.find((item) =>
    item.id === "lsoul-athena-sweetheart-satin-tube-top-tp-athena-tube-blk"
  );
  const previousBottom = productionCatalog.find((item) =>
    item.id === "lsoul-atelier-wide-trousers-black"
  );
  assert.ok(previousTop);
  assert.ok(previousBottom);

  const previous = buildShoppingState(
    intent({
      intent: "recommend_outfit",
      targetScope: "outfit",
      budgetMax: 3_000_000,
      items: []
    }),
    [previousTop, previousBottom],
    null
  );
  const parsed = inferFallbackShoppingIntent({
    message: "tôi muốn nó sexy sexy cơ",
    contextProducts: [previousTop, previousBottom],
    shoppingState: previous
  });
  const merged = applyShoppingState(parsed, previous);

  const candidatePool = productionCatalog.filter((item) => item.stock > 0).slice(0, 5);
  const plan = buildAgentPlan({
    message: "tôi muốn nó sexy sexy cơ",
    found: candidatePool,
    contextProducts: [previousTop, previousBottom],
    catalog: productionCatalog,
    orders: [],
    coupons: [],
    loggedIn: false,
    intent: merged
  });

  assert.equal(plan.products.length, 2);
  const bundle = plan.actions.find((action) => action.type === "add_bundle");
  const tryOn = plan.actions.find((action) => action.type === "open_try_on");
  assert.ok(bundle && bundle.type === "add_bundle");
  assert.ok(tryOn && tryOn.type === "open_try_on");

  const plannedIds = plan.products.map((item) => item.id).sort();
  assert.deepEqual(bundle.items.map((item) => item.productId).sort(), plannedIds);
  assert.deepEqual(tryOn.productIds.slice().sort(), plannedIds);
});

test("sexy style ranking prioritizes corset/bodysuit/cutout over tube top", () => {
  const previousTop = productionCatalog.find((item) =>
    item.id === "lsoul-athena-sweetheart-satin-tube-top-tp-athena-tube-blk"
  );
  const previousBottom = productionCatalog.find((item) =>
    item.id === "lsoul-atelier-wide-trousers-black"
  );
  assert.ok(previousTop);
  assert.ok(previousBottom);

  const previous = buildShoppingState(
    intent({
      intent: "recommend_outfit",
      targetScope: "outfit",
      budgetMax: 3_000_000,
      items: []
    }),
    [previousTop, previousBottom],
    null
  );

  const parsed = inferFallbackShoppingIntent({
    message: "tôi muốn nó sexy sexy cơ",
    contextProducts: [previousTop, previousBottom],
    shoppingState: previous
  });
  const merged = applyShoppingState(parsed, previous);

  const plan = buildAgentPlan({
    message: "tôi muốn nó sexy sexy cơ",
    found: productionCatalog.filter((item) => item.stock > 0).slice(0, 5),
    contextProducts: [previousTop, previousBottom],
    catalog: productionCatalog,
    orders: [],
    coupons: [],
    loggedIn: false,
    intent: merged
  });

  const selectedTop = plan.products.find((item) => item.category === "tops");
  assert.ok(selectedTop);
  // Không được giữ lại tube top khi khách yêu cầu sexy và catalog có lựa chọn corset/bodysuit/cut-out phù hợp
  assert.notEqual(selectedTop.id, "lsoul-athena-sweetheart-satin-tube-top-tp-athena-tube-blk");
  const isElevatedSexy =
    selectedTop.type === "corset" ||
    selectedTop.type === "bodysuit" ||
    /corset|bodysuit|cut-?out/.test(selectedTop.name.toLowerCase() + " " + selectedTop.subtitle.toLowerCase());
  assert.equal(isElevatedSexy, true);
});

test("explicit reset phrase clears outfit inheritance and avoids modify_outfit", () => {
  const previous = buildShoppingState(initialRedWhiteIntent(), [redCorset, whitePartySkirt], null);
  const parsed = inferFallbackShoppingIntent({
    message: "Bỏ set này đi, tìm cho mình đồ khác",
    contextProducts: [redCorset, whitePartySkirt],
    shoppingState: previous
  });

  assert.equal(parsed.inheritPrevious, false);
  assert.notEqual(parsed.intent, "modify_outfit");
});

test("last assistant product lookup in multi-turn stays grounded on most recent turn", () => {
  const dbMessagesDesc = [
    { role: "assistant", content: "Mới nhất: áo trắng", productIds: ["white-shirt"] },
    { role: "user", content: "Tìm áo trắng", productIds: [] },
    { role: "assistant", content: "Cũ hơn: đầm đỏ", productIds: ["red-dress"] },
    { role: "user", content: "Tìm đầm đỏ", productIds: [] }
  ];

  // Logic đã fix trong route.ts: lấy first assistant từ mảng desc trước khi reverse
  const lastAssistant = dbMessagesDesc.find((item) => item.role === "assistant" && item.productIds.length);
  assert.equal(lastAssistant?.productIds[0], "white-shirt");
});

test("catalog treats pants and skirts as distinct product categories", () => {
  assert.equal(storefrontCategory(whiteTrousers), "pants");
  assert.equal(storefrontCategory(whitePartySkirt), "skirts");
  assert.equal(storefrontCategory(redDress), "dress");
  assert.deepEqual(pantsTypes, ["jeans", "trousers", "flare-pants", "shorts"]);
});

test("fitting room keeps pants and skirts in separate wardrobes", () => {
  assert.equal(wardrobeGroup(whiteTrousers), "pants");
  assert.equal(wardrobeGroup(whitePartySkirt), "skirts");
  assert.equal(outfitLabel([redCorset, whiteTrousers]), "áo + quần");
  assert.equal(outfitLabel([redCorset, whitePartySkirt]), "áo + chân váy");
  const replaced = normalizeOutfitSelection([redCorset.id, whiteTrousers.id], whitePartySkirt, catalog);
  assert.deepEqual(replaced, [redCorset.id, whitePartySkirt.id]);
});

test("outfit tab Áo + Quần never contains a skirt", () => {
  const outfit = coordinateSmartOutfit({ catalog, setType: "top_pants", preferredTopColor: "red" });
  assert.equal(outfit.items.length, 2);
  assert.equal(outfit.items.find((item) => item.role === "bottom")?.product.type, "trousers");
  assert.equal(outfit.setTypeName, "Áo + Quần");
});

test("outfit tab Áo + Chân váy never contains pants", () => {
  const outfit = coordinateSmartOutfit({ catalog, setType: "top_skirt", preferredTopColor: "red" });
  assert.equal(outfit.items.length, 2);
  assert.equal(outfit.items.find((item) => item.role === "bottom")?.product.type, "skirt");
  assert.equal(outfit.setTypeName, "Áo + Chân váy");
});

test("locked skirt cannot be silently substituted into pants mode", () => {
  const outfit = coordinateSmartOutfit({
    catalog,
    setType: "top_pants",
    fixedBottomProductId: whitePartySkirt.id
  });
  assert.equal(outfit.items.length, 0);
});

test("no skirt found means Áo + Chân váy remains empty, never substitutes pants", () => {
  const outfit = coordinateSmartOutfit({ catalog: [redCorset, whiteTrousers], setType: "top_skirt" });
  assert.equal(outfit.items.length, 0);
});

test("chat fallback distinguishes áo with quần from áo with chân váy", () => {
  const pantsIntent = inferFallbackShoppingIntent({ message: "Phối áo đỏ với quần trắng", contextProducts: [] });
  const pantsConstraint = pantsIntent.items.find((item) => item.role === "bottom");
  assert.ok(pantsConstraint);
  assert.ok(pantsConstraint.types?.every((type) => pantsTypes.includes(type)));
  assert.equal(pantsConstraint.types?.includes("skirt"), false);

  const skirtIntent = inferFallbackShoppingIntent({ message: "Phối áo đỏ với chân váy trắng", contextProducts: [] });
  const skirtConstraint = skirtIntent.items.find((item) => item.role === "bottom");
  assert.deepEqual(skirtConstraint?.types, ["skirt"]);
});


test("outfit studio explores many unique pants outfits before repeating a set", () => {
  const tops = Array.from({ length: 9 }, (_, index) => product({
    id: `rotation-top-${index}`,
    category: "tops",
    type: "shirt",
    colorFamily: "white",
    formality: 3
  }));
  const pants = Array.from({ length: 9 }, (_, index) => product({
    id: `rotation-pants-${index}`,
    category: "bottoms",
    type: "trousers",
    colorFamily: "black",
    formality: 3
  }));
  const seen: string[] = [];
  const selectedTops = new Set<string>();
  const selectedPants = new Set<string>();

  for (let index = 0; index < 30; index += 1) {
    const outfit = coordinateSmartOutfit({
      catalog: [...tops, ...pants],
      setType: "top_pants",
      variantSalt: index * 7 + 11,
      excludeOutfitKeys: seen
    });
    const key = outfitSelectionKey(outfit.items);
    assert.ok(key && !seen.includes(key), `Set repeated at click ${index + 1}: ${key}`);
    seen.push(key);
    selectedTops.add(outfit.items.find((item) => item.role === "top")!.product.id);
    selectedPants.add(outfit.items.find((item) => item.role === "bottom")!.product.id);
    assert.equal(outfit.setTypeName, "Áo + Quần");
  }

  assert.equal(seen.length, 30);
  assert.ok(selectedTops.size >= 6);
  assert.ok(selectedPants.size >= 6);
});

test("outfit studio rotates unique dresses and co-ord sets", () => {
  for (const [category, type, setType] of [
    ["dress", "midi-dress", "dress_layer"],
    ["set", "set", "coord_set"]
  ] as const) {
    const choices = Array.from({ length: 6 }, (_, index) => product({
      id: `rotation-${category}-${index}`,
      category,
      type,
      colorFamily: "black"
    }));
    const seen: string[] = [];

    for (let index = 0; index < choices.length; index += 1) {
      const outfit = coordinateSmartOutfit({
        catalog: choices,
        setType,
        variantSalt: index * 3,
        excludeOutfitKeys: seen
      });
      const key = outfitSelectionKey(outfit.items);
      assert.ok(key && !seen.includes(key));
      seen.push(key);
    }

    assert.equal(new Set(seen).size, choices.length);
    const reset = coordinateSmartOutfit({
      catalog: choices,
      setType,
      excludeOutfitKeys: seen
    });
    assert.ok(outfitSelectionKey(reset.items));
  }
});

test("outfit selection preserves hard constraints and gracefully repeats if there is only one set", () => {
  const catalog = [redCorset, whiteTrousers];
  const first = coordinateSmartOutfit({ catalog, setType: "top_pants" });
  const onlyKey = outfitSelectionKey(first.items);
  const repeat = coordinateSmartOutfit({
    catalog,
    setType: "top_pants",
    excludeOutfitKeys: [onlyKey],
    variantSalt: 47
  });
  assert.equal(outfitSelectionKey(repeat.items), onlyKey);
  assert.equal(outfitSelectionKey([
    ...first.items,
    { product: blackCorset, role: "outerwear" }
  ]), onlyKey);
});

test("stylist explanations reflect garment types, not repeated body-shape sales copy", () => {
  const shirt = product({
    id: "review-shirt",
    category: "tops",
    type: "shirt",
    colorFamily: "white",
    volume: "voluminous"
  });
  const jeans = product({
    id: "review-jeans",
    category: "bottoms",
    type: "jeans",
    colorFamily: "blue",
    volume: "fitted"
  });
  const skirt = product({
    id: "review-skirt",
    category: "bottoms",
    type: "skirt",
    colorFamily: "black",
    lengthClass: "midi"
  });
  const pantsReview = coordinateSmartOutfit({ catalog: [shirt, jeans], setType: "top_pants" });
  const skirtReview = coordinateSmartOutfit({ catalog: [shirt, skirt], setType: "top_skirt" });
  assert.match(pantsReview.reason, /sơ mi dáng rộng/);
  assert.match(pantsReview.reason, /quần jeans/);
  assert.match(skirtReview.reason, /chân váy midi/);
  assert.notEqual(pantsReview.reason, skirtReview.reason);
  for (const review of [pantsReview, skirtReview]) {
    assert.doesNotMatch(review.reason, /ôm trọn vòng eo|quyến rũ|đường cong của người phụ nữ|cắt xẻ sắc sảo/i);
  }
});

test("dress and coordinated-set reviews do not invent body-hugging or cut-out details", () => {
  const casualDress = product({
    id: "review-casual-dress",
    category: "dress",
    type: "midi-dress",
    colorFamily: "beige"
  });
  const coordSet = product({
    id: "review-coord-set",
    category: "set",
    type: "set",
    colorFamily: "black"
  });
  const dressReview = coordinateSmartOutfit({ catalog: [casualDress], setType: "dress_layer" });
  const setReview = coordinateSmartOutfit({ catalog: [coordSet], setType: "coord_set" });
  assert.match(dressReview.reason, /đầm dáng midi/);
  assert.match(setReview.reason, /set đồng bộ/);
  assert.doesNotMatch(dressReview.reason, /cắt xẻ|đường cong|quyến rũ/i);
  assert.doesNotMatch(setReview.reason, /tôn dáng|cắt may/i);
});

test("stylist accessory tips follow occasion without changing products", () => {
  const day = coordinateSmartOutfit({ catalog: [redCorset, whiteTrousers], setType: "top_pants", occasion: "casual" });
  const office = coordinateSmartOutfit({ catalog: [redCorset, whiteTrousers], setType: "top_pants", occasion: "work" });
  assert.match(day.stylingTip, /sneaker/);
  assert.match(office.stylingTip, /loafer/);
  assert.notEqual(day.stylingTip, office.stylingTip);
});

test("payment data is visible only to its owner or an admin", () => {
  assert.equal(canReadPaymentStatus(null, "owner"), false);
  assert.equal(canReadPaymentStatus({ id: "stranger", role: "user" }, "owner"), false);
  assert.equal(canReadPaymentStatus({ id: "owner", role: "user" }, "owner"), true);
  assert.equal(canReadPaymentStatus({ id: "admin", role: "admin" }, "owner"), true);
  assert.equal(canReadPaymentStatus({ id: "owner", role: "user" }, null), false);
});

test("simulated QR payment is never allowed in production or for customers", () => {
  const order = { payment: "qr", paymentStatus: "pending", status: "processing" };
  const admin = { id: "admin", role: "admin" };
  assert.equal(canSimulatePayment(admin, order, "production"), false);
  assert.equal(canSimulatePayment({ id: "owner", role: "user" }, order, "development"), false);
  assert.equal(canSimulatePayment(admin, order, "development"), true);
  assert.equal(canSimulatePayment(admin, { ...order, paymentStatus: "paid" }, "development"), false);
  assert.equal(canSimulatePayment(admin, { ...order, status: "cancelled" }, "development"), false);
  assert.equal(canSimulatePayment(admin, { ...order, payment: "cod" }, "development"), false);
});


test("quick search matches accent-insensitive shop results and groups colors", () => {
  const blue = product({ id: "shirt-blue", name: "Sơ mi Oxford", category: "tops", type: "shirt", colorFamily: "blue", color: "Xanh", groupCode: "oxford" });
  const white = product({ id: "shirt-white", name: "Sơ mi Oxford", category: "tops", type: "shirt", colorFamily: "white", color: "Trắng", groupCode: "oxford" });
  const other = product({ id: "pants", name: "Quần Âu", category: "bottoms", type: "trousers", colorFamily: "black", color: "Đen" });
  const sold = product({ id: "shirt-sold", name: "Sơ mi bán hết", category: "tops", type: "shirt", colorFamily: "white", stock: 0 });
  const found = getSearchPreviewProducts([blue, other, white, sold], "so mi trang");
  assert.equal(found[0]?.id, "shirt-white");
  assert.equal(found.filter((item) => item.groupCode === "oxford").length, 1);
  assert.ok(found.every((item) => item.id !== sold.id));
  const all = getSearchPreviewProducts([blue, other, white, sold], "so mi");
  assert.equal(all.filter((item) => item.groupCode === "oxford").length, 1);
  assert.ok(all.every((item) => item.id !== sold.id));
});

test("plain product lookup replies without LLM but outfit conversations do not", () => {
  const intent = inferFallbackShoppingIntent({ message: "Tìm áo corset màu đỏ", contextProducts: [] });
  assert.equal(intent.intent, "search_products");
  const response = fastCatalogLookupReply("Tìm áo corset màu đỏ", intent, [redCorset]);
  assert.ok(response?.includes(redCorset.name));
  assert.ok(response?.includes("đ"));
  assert.equal(fastCatalogLookupReply("Tìm áo corset màu đỏ", intent, [redCorset], true), null);
  assert.equal(fastCatalogLookupReply("Tìm áo corset màu đỏ", { ...intent, inheritPrevious: true }, [redCorset]), null);
  const outfit = inferFallbackShoppingIntent({ message: "Phối áo đỏ với chân váy trắng", contextProducts: [] });
  assert.equal(fastCatalogLookupReply("Phối áo đỏ với chân váy trắng", outfit, [redCorset]), null);
});

test("admin COD collection is only valid for completed, unpaid deliveries", () => {
  const order = { payment: "cod", paymentStatus: "cod_pending", status: "processing" };
  assert.equal(canRecordCodCollection(order), false);
  assert.equal(canRecordCodCollection(order, "completed"), true);
  assert.equal(canRecordCodCollection({ ...order, status: "completed" }), true);
  assert.equal(canRecordCodCollection({ ...order, payment: "qr" }, "completed"), false);
  assert.equal(canRecordCodCollection({ ...order, status: "cancelled" }, "completed"), false);
  assert.equal(canRecordCodCollection({ ...order, paymentStatus: "paid" }, "completed"), false);
});


test("greetings and social turns never trigger product recommendations", () => {
  for (const message of [
    "chào người anh em", "Chào shop ơi!", "xin chào", "hello", "hi shop!",
    "ê shop ơi", "chào buổi sáng", "cảm ơn shop nhé", "bye"
  ]) {
    const response = socialChatReply(message);
    assert.ok(response, `Missing social response: ${message}`);
    assert.doesNotMatch(response!, /\b(?:corset|giá|mua hàng|đơn hàng|chân váy|quần|sản phẩm)\b/i);
    assert.equal(retrieveProductsFromIntent(
      inferFallbackShoppingIntent({ message, contextProducts: [] }),
      productionCatalog
    ).length, 0, `Should not retrieve products for: ${message}`);
  }
  assert.match(socialChatReply("chào người anh em")!, /người anh em/i);
  assert.equal(socialChatReply("hello", true), null);
});

test("greeting plus purchase intent still follows normal shopping recommendations", () => {
  for (const message of [
    "Chào shop, mình muốn tìm áo đỏ",
    "hi, cho mình xem chân váy trắng",
    "hello shop có áo corset không?",
    "ê shop ơi có váy không"
  ]) {
    assert.equal(socialChatReply(message), null, message);
  }
  assert.equal(socialChatReply("chào người anh em", true), null);
});

test("general intent and legacy greeting lookup cannot inject featured items", () => {
  const general = inferFallbackShoppingIntent({ message: "chào người anh em", contextProducts: [] });
  assert.equal(general.intent, "general");
  assert.equal(retrieveProductsFromIntent(general, productionCatalog).length, 0);
  assert.equal(retrieveProducts("chào người anh em", productionCatalog).length, 0);
  assert.equal(retrieveProducts("hello", productionCatalog).length, 0);
  const purchase = inferFallbackShoppingIntent({ message: "tìm áo corset đỏ", contextProducts: [] });
  assert.ok(retrieveProductsFromIntent(purchase, productionCatalog).length > 0);
});

test("admin fulfillment enforces forward-only order transitions", () => {
  assert.deepEqual(allowedOrderStatuses("processing"), ["processing", "confirmed", "cancelled"]);
  assert.deepEqual(allowedOrderStatuses("confirmed"), ["confirmed", "shipping", "cancelled"]);
  assert.deepEqual(allowedOrderStatuses("shipping"), ["shipping", "completed", "cancelled"]);
  assert.deepEqual(allowedOrderStatuses("completed"), ["completed"]);
  assert.deepEqual(allowedOrderStatuses("cancelled"), ["cancelled"]);
  assert.equal(canTransitionOrderStatus("processing", "completed"), false);
  assert.equal(canTransitionOrderStatus("shipping", "processing"), false);
  assert.equal(canTransitionOrderStatus("completed", "cancelled"), false);
  assert.equal(canTransitionOrderStatus("confirmed", "shipping"), true);
  assert.equal(isOrderStatus("unknown"), false);
  assert.equal(isOrderStatus("paid"), false);
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


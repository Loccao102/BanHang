import assert from "node:assert/strict";
import type { Product } from "../products";
import { loadGarmentReferenceImage } from "./gemini-tryon";
import { validateStockAdjustment } from "./inventory-operations";
import { coordinateSmartOutfit, reviewSelectedOutfit } from "../stylist-outfit-engine";

function garment(id: string, category: Product["category"], type: Product["type"], colorFamily: Product["colorFamily"], color: string): Product {
  return {
    id, name: id, subtitle: "Quality fixture", category, type, gender: "women",
    price: 1_000_000, color, colorFamily, sizes: ["S"], stock: 10,
    image: "/fixture.jpg", images: ["/fixture.jpg"], style: [], occasion: [],
    material: "cotton", fit: "regular", volume: "balanced"
  };
}

async function run() {
  assert.deepEqual(validateStockAdjustment(" m ", 2), { size: "M", delta: 2 });
  assert.deepEqual(validateStockAdjustment("XL", -1), { size: "XL", delta: -1 });
  for (const invalid of [0, -1001, 2.5, NaN, "3"]) assert.equal(validateStockAdjustment("S", invalid), null);
  assert.equal(validateStockAdjustment("", 1), null);
  console.log("✓ Admin inventory adjustments validate size and safe integers");

  let fetchCount = 0;
  const mockFetch: typeof fetch = async () => {
    fetchCount += 1;
    return new Response("png-content", {
      status: 200,
      headers: { "content-type": "image/png" }
    });
  };
  const cloudinary = await loadGarmentReferenceImage(
    "https://res.cloudinary.com/lsoul/image/upload/tryon.jpg",
    mockFetch
  );
  assert.equal(cloudinary?.mimeType, "image/png");
  assert.equal(cloudinary?.base64, Buffer.from("png-content").toString("base64"));
  assert.equal(fetchCount, 1);
  assert.equal(await loadGarmentReferenceImage("http://127.0.0.1/private", mockFetch), null);
  assert.equal(await loadGarmentReferenceImage("https://unknown.example.com/private", mockFetch), null);
  assert.equal(fetchCount, 1);
  const inline = await loadGarmentReferenceImage("data:image/png;base64,AA==", mockFetch);
  assert.equal(inline?.base64, "AA==");
  assert.equal(fetchCount, 1);
  console.log("✓ Remote garment images are included and unsafe sources are rejected");

  const top = garment("white-shirt", "tops", "shirt", "white", "Trắng");
  const pants = garment("black-pants", "bottoms", "trousers", "black", "Đen");
  const bluePants = garment("blue-pants", "bottoms", "trousers", "blue", "Xanh");
  const original = coordinateSmartOutfit({ catalog: [top, pants], setType: "top_pants" });
  const changed = reviewSelectedOutfit(original, [top, bluePants]);
  assert.ok(changed.reason.includes("Xanh"));
  assert.notEqual(original.reason, changed.reason);
  assert.equal(changed.setTypeName, "Áo + Quần");
  console.log("✓ Outfit explanation is regenerated when a color is changed");

  const skirt = garment("midi-skirt", "bottoms", "skirt", "beige", "Be");
  skirt.lengthClass = "midi";
  const switched = reviewSelectedOutfit(original, [top, skirt]);
  assert.equal(switched.setTypeName, "Áo + Chân váy");
  assert.match(switched.reason, /chân váy midi/);
  console.log("✓ Bottom garment type updates outfit label and commentary");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

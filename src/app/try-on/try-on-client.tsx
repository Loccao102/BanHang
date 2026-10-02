"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Check, LoaderCircle, ShoppingBag, Sparkles, Upload, WandSparkles } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { formatPrice, type Product } from "@/lib/products";
import { normalizeOutfitSelection, outfitLabel, sortOutfitProducts, wardrobeGroup, wardrobeGroupLabels, type WardrobeGroup } from "@/lib/wardrobe";
import { useStore } from "@/components/store-provider";

type ConfiguredItem = {
  productId: string;
  size: string;
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const maxDimension = 1600;
  const ratio = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Không thể tối ưu ảnh.")), "image/jpeg", 0.9);
  });

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không đọc được ảnh."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

async function validatePerson(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Chỉ nhận JPG, PNG hoặc WebP.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Ảnh gốc phải nhỏ hơn 8 MB.");

  const bitmap = await createImageBitmap(file);
  const ratio = bitmap.height / bitmap.width;
  const minSide = Math.min(bitmap.width, bitmap.height);
  bitmap.close();

  if (minSide < 480) throw new Error("Ảnh quá nhỏ. Nên dùng ảnh toàn thân rõ nét từ 480px trở lên.");
  if (ratio < 1 || ratio > 2.35) throw new Error("Nên dùng ảnh dọc/toàn thân để AI nhận diện cơ thể tốt hơn.");
}

function firstSize(product: Product) {
  return product.variants?.find((variant) => variant.active && variant.stock > 0)?.size ?? product.sizes[0] ?? "";
}

export function TryOnClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { catalog, wishlist, addBundleToCart } = useStore();

  const wishlistProducts = useMemo(
    () => catalog.filter((product) => product.active !== false && wishlist.includes(product.id)),
    [catalog, wishlist]
  );

  const initialIds = useMemo(
    () => (searchParams.get("products") ?? searchParams.get("product") ?? "").split(",").filter(Boolean).slice(0, 3),
    [searchParams]
  );

  const fallbackProducts = wishlistProducts.length ? wishlistProducts : catalog.filter((product) => product.active !== false);
  const initialProducts = useMemo(() => {
    const chosen = initialIds.flatMap((id) => {
      const product = catalog.find((item) => item.id === id && item.active !== false);
      return product ? [product] : [];
    });
    return chosen.length ? chosen : fallbackProducts.slice(0, 1);
  }, [initialIds, catalog, fallbackProducts]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [configured, setConfigured] = useState<ConfiguredItem[]>([]);
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [intermediate, setIntermediate] = useState<Array<{ productId: string; output: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Chọn 1–3 món từ wishlist, tải ảnh toàn thân và bắt đầu thử.");

  useEffect(() => {
    if (!selectedIds.length && initialProducts.length) {
      const normalized = initialProducts.reduce<string[]>(
        (current, product) => normalizeOutfitSelection(current, product, catalog),
        []
      );
      const orderedProducts = sortOutfitProducts(normalized.flatMap((id) => {
        const product = catalog.find((item) => item.id === id);
        return product ? [product] : [];
      }));
      setSelectedIds(orderedProducts.map((product) => product.id));
      setConfigured(orderedProducts.map((product) => ({ productId: product.id, size: firstSize(product) })));
    }
  }, [initialProducts, selectedIds.length]);

  const selectedProducts = selectedIds.flatMap((id) => {
    const product = catalog.find((item) => item.id === id);
    return product ? [product] : [];
  });

  const total = selectedProducts.reduce((sum, product) => sum + product.price, 0);

  function selectProduct(product: Product) {
    setSelectedIds((current) => {
      const next = normalizeOutfitSelection(current, product, catalog);
      setConfigured((configs) => next.map((productId) => {
        const existing = configs.find((item) => item.productId === productId);
        const nextProduct = catalog.find((item) => item.id === productId);
        return existing ?? { productId, size: nextProduct ? firstSize(nextProduct) : "" };
      }));
      return next;
    });
    setResultImage(null);
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await validatePerson(file);
      const encoded = await compressImage(file);
      setPersonImage(encoded);
      setResultImage(null);
      setMessage("Ảnh đạt kiểm tra. Bạn có thể bắt đầu thử đồ.");
    } catch (error) {
      setPersonImage(null);
      setMessage(error instanceof Error ? error.message : "Ảnh chưa phù hợp.");
    }
  }

  async function runTryOn() {
    if (!personImage || !selectedIds.length) return;
    setLoading(true);
    setResultImage(null);
    setIntermediate([]);
    setMessage("FASHN đang dựng các món đã chọn lên ảnh của bạn...");
    try {
      const response = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelImage: personImage, productIds: selectedIds })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Không thể tạo ảnh thử đồ.");
      setResultImage(data.output);
      setIntermediate(data.steps ?? []);
      setMessage("Hoàn tất. Bạn có thể chỉnh màu/size trước khi mua set.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Có lỗi khi thử đồ.");
    } finally {
      setLoading(false);
    }
  }

  function changeSize(productId: string, size: string) {
    setConfigured((current) => current.map((item) => item.productId === productId ? { ...item, size } : item));
  }

  function changeColor(currentProduct: Product, nextProductId: string) {
    const next = catalog.find((item) => item.id === nextProductId);
    if (!next) return;
    setSelectedIds((current) => current.map((id) => id === currentProduct.id ? next.id : id));
    setConfigured((current) => current.map((item) => item.productId === currentProduct.id ? { productId: next.id, size: firstSize(next) } : item));
    setResultImage(null);
    setMessage("Đã đổi màu/biến thể. Bấm thử lại để AI tạo ảnh theo lựa chọn mới.");
  }

  function buySet(goCheckout = false) {
    const bundle = configured.flatMap((item) => {
      const product = catalog.find((candidate) => candidate.id === item.productId);
      if (!product) return [];
      const variant = product.variants?.find((candidate) => candidate.size === item.size && candidate.stock > 0);
      return variant ? [{ product, size: item.size, quantity: 1 }] : [];
    });
    if (bundle.length !== configured.length) {
      setMessage("Một món vừa hết size đã chọn. Vui lòng chọn lại size.");
      return;
    }
    addBundleToCart(bundle);
    if (goCheckout) router.push("/checkout");
  }

  return (
    <section className="fittingRoomPage">
      <div className="fittingHero" data-reveal>
        <p className="eyebrow">LSOUL VIRTUAL FITTING ROOM</p>
        <h1>Try the look.<br />Then own it.</h1>
        <p>Chọn những món đã lưu, thử trực tiếp trên ảnh của bạn bằng FASHN, rồi tinh chỉnh màu và size trước khi mua cả set.</p>
      </div>

      <div className="fittingWorkspace">
        <aside className="fittingSidebar">
          <div className="fittingStep">
            <div className="fittingStepHead"><span>01</span><div><strong>Ảnh của bạn</strong><small>1 người · ảnh dọc · đủ sáng</small></div><Camera size={17} /></div>
            <label className="fittingUpload">
              {personImage ? <Image src={personImage} alt="Ảnh người dùng" fill unoptimized /> : <div><Upload size={26} /><strong>Tải ảnh toàn thân</strong><small>JPG / PNG / WebP · tối đa 8 MB</small></div>}
              <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} />
              {personImage ? <span>Đổi ảnh</span> : null}
            </label>
          </div>

          <div className="fittingStep">
            <div className="fittingStepHead"><span>02</span><div><strong>Tủ đồ đã lưu</strong><small>Áo + quần/chân váy (+ áo khoác), hoặc váy/set riêng</small></div><Sparkles size={17} /></div>
            <div className="fittingLookSummary"><span>LOOK</span><strong>{outfitLabel(selectedProducts)}</strong></div>
            <div className="fittingWishlist fittingWardrobeGroups">
              {(["tops", "bottoms", "dresses", "outerwear", "sets"] as WardrobeGroup[]).map((group) => {
                const grouped = fallbackProducts.filter((product) => wardrobeGroup(product) === group);
                if (!grouped.length) return null;
                return <div className="fittingWardrobeGroup" key={group}>
                  <div className="fittingWardrobeGroupTitle">{wardrobeGroupLabels[group]}</div>
                  {grouped.map((product) => (
                    <button className={selectedIds.includes(product.id) ? "active" : ""} key={product.id} onClick={() => selectProduct(product)}>
                      <div><Image src={product.image} alt={product.name} fill sizes="76px" /></div>
                      <span><strong>{product.name}</strong><small>{product.color} · {formatPrice(product.price)}</small></span>
                      <i>{selectedIds.includes(product.id) ? <Check size={12} /> : "+"}</i>
                    </button>
                  ))}
                </div>;
              })}
            </div>
          </div>

          <button className="btn block fittingRun" disabled={!personImage || !selectedIds.length || loading} onClick={runTryOn}>
            {loading ? <LoaderCircle className="spin" size={17} /> : <WandSparkles size={17} />}
            {loading ? "Đang tạo fitting..." : `Thử ${outfitLabel(selectedProducts)} bằng AI`}
          </button>
          <p className="fittingStatus">{message}</p>
        </aside>

        <div className="fittingStage">
          <div className="fittingResult">
            {resultImage ? <Image src={resultImage} alt="Kết quả thử đồ LSOUL" fill unoptimized priority /> : personImage ? <Image src={personImage} alt="Ảnh người dùng" fill unoptimized /> : <div className="fittingPlaceholder"><WandSparkles size={34} /><strong>Fitting result</strong><p>Ảnh kết quả sẽ xuất hiện tại đây.</p></div>}
            <span className="fittingStageLabel">{resultImage ? "AI RESULT" : "YOUR PHOTO"}</span>
          </div>
          {intermediate.length > 1 ? <div className="fittingPasses">{intermediate.map((step, index) => <div key={step.productId}><Image src={step.output} alt={`Try-on pass ${index + 1}`} fill unoptimized /><span>PASS {index + 1}</span></div>)}</div> : null}
        </div>
      </div>

      {selectedProducts.length ? (
        <section className="fittingBuyPanel" data-reveal>
          <div className="fittingBuyHeader"><div><p className="eyebrow">EDIT YOUR LOOK</p><h2>Hoàn thiện set trước khi mua.</h2></div><div><small>Tổng tạm tính</small><strong>{formatPrice(total)}</strong></div></div>
          <div className="fittingConfiguredList">
            {selectedProducts.map((product) => {
              const config = configured.find((item) => item.productId === product.id);
              const colorVariants = product.groupCode ? catalog.filter((item) => item.groupCode === product.groupCode && item.active !== false) : [product];
              return (
                <article key={product.id}>
                  <div className="fittingConfiguredImage"><Image src={product.image} alt={product.name} fill sizes="110px" /></div>
                  <div className="fittingConfiguredMeta"><strong>{product.name}</strong><span>{product.subtitle}</span><small>{formatPrice(product.price)}</small></div>
                  <label><span>Màu</span><select value={product.id} onChange={(event) => changeColor(product, event.target.value)}>{colorVariants.map((variant) => <option value={variant.id} key={variant.id}>{variant.color}</option>)}</select></label>
                  <label><span>Size</span><select value={config?.size ?? firstSize(product)} onChange={(event) => changeSize(product.id, event.target.value)}>{product.variants?.filter((variant) => variant.stock > 0).map((variant) => <option value={variant.size} key={variant.size}>{variant.size}</option>)}</select></label>
                </article>
              );
            })}
          </div>
          <div className="fittingBuyActions">
            <button className="btn secondary" onClick={() => buySet(false)}><ShoppingBag size={16} /> Thêm cả set vào giỏ</button>
            <button className="btn" onClick={() => buySet(true)}>Mua set này</button>
          </div>
        </section>
      ) : null}
    </section>
  );
}

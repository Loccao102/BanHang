"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { BrainCircuit, Camera, Check, Heart, LoaderCircle, ShoppingBag, Sparkles, ThumbsDown, ThumbsUp, Upload, WandSparkles } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { formatPrice, type Product } from "@/lib/products";
import type { StylistAssessment } from "@/lib/stylist-assessment";
import { isValidOutfit, normalizeOutfitSelection, outfitLabel, sortOutfitProducts, wardrobeGroup, wardrobeGroupLabels, type WardrobeGroup } from "@/lib/wardrobe";
import { useStore } from "@/components/store-provider";

type ConfiguredItem = {
  productId: string;
  size: string;
};

type FeedbackReaction = "accurate" | "love" | "inaccurate";

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
  const [message, setMessage] = useState("Chọn đồ từ mục yêu thích, tải ảnh toàn thân và bắt đầu thử.");
  const [tryOnSessionId, setTryOnSessionId] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<StylistAssessment | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState("");
  const [feedbackReaction, setFeedbackReaction] = useState<FeedbackReaction | null>(null);
  const [feedbackSaving, setFeedbackSaving] = useState(false);

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
  const outfitReady = isValidOutfit(selectedProducts);

  function clearStylistResult() {
    setTryOnSessionId(null);
    setAssessment(null);
    setAssessmentError("");
    setFeedbackReaction(null);
    setFeedbackSaving(false);
  }

  function selectProduct(product: Product) {
    clearStylistResult();
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
      clearStylistResult();
      setMessage("Ảnh đạt kiểm tra. Bạn có thể bắt đầu thử đồ.");
    } catch (error) {
      setPersonImage(null);
      setMessage(error instanceof Error ? error.message : "Ảnh chưa phù hợp.");
    }
  }

  async function assessResult(output: string, sessionId: string | null, productIds: string[]) {
    setAssessmentLoading(true);
    setAssessment(null);
    setAssessmentError("");
    setFeedbackReaction(null);

    try {
      const response = await fetch("/api/tryon/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tryOnSessionId: sessionId,
          resultImage: output,
          productIds
        })
      });
      const data = await response.json() as { assessment?: StylistAssessment; error?: string };
      if (!response.ok || !data.assessment) throw new Error(data.error ?? "AI Stylist chưa thể đánh giá outfit.");
      setAssessment(data.assessment);
    } catch (error) {
      setAssessmentError(error instanceof Error ? error.message : "AI Stylist chưa thể đánh giá outfit.");
    } finally {
      setAssessmentLoading(false);
    }
  }

  async function sendStylistFeedback(reaction: FeedbackReaction) {
    if (!tryOnSessionId || feedbackReaction || feedbackSaving) return;
    setFeedbackSaving(true);
    try {
      const response = await fetch("/api/tryon/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tryOnSessionId, reaction })
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Không lưu được phản hồi.");
      setFeedbackReaction(reaction);
    } catch (error) {
      setAssessmentError(error instanceof Error ? error.message : "Không lưu được phản hồi.");
    } finally {
      setFeedbackSaving(false);
    }
  }

  async function runTryOn() {
    if (!personImage || !outfitReady) {
      setMessage("Hãy phối đủ áo + quần/chân váy (áo khoác tùy chọn), hoặc chọn một váy/đầm hoàn chỉnh trước khi thử.");
      return;
    }
    setLoading(true);
    setResultImage(null);
    setIntermediate([]);
    clearStylistResult();
    setMessage("AI đang ghép các món đã chọn lên ảnh của bạn...");
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
      const nextSessionId = typeof data.tryOnSessionId === "string" ? data.tryOnSessionId : null;
      const resultProductIds = Array.isArray(data.productIds) ? data.productIds.map(String) : selectedIds;
      setTryOnSessionId(nextSessionId);
      setMessage("Hoàn tất. AI Stylist đang đánh giá độ hợp của outfit...");
      void assessResult(data.output, nextSessionId, resultProductIds);
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
    clearStylistResult();
    setMessage("Đã đổi màu hoặc biến thể. Bấm thử lại để AI tạo ảnh theo lựa chọn mới.");
  }

  function buySet(goCheckout = false) {
    const bundle = configured.flatMap((item) => {
      const product = catalog.find((candidate) => candidate.id === item.productId);
      if (!product) return [];
      const variant = product.variants?.find((candidate) => candidate.size === item.size && candidate.stock > 0);
      return variant ? [{ product, size: item.size, quantity: 1 }] : [];
    });
    if (bundle.length !== configured.length) {
      setMessage("Một món vừa hết cỡ đã chọn. Vui lòng chọn lại cỡ.");
      return;
    }
    addBundleToCart(bundle);
    if (goCheckout) router.push("/checkout");
  }

  return (
    <section className="fittingRoomPage">
      <div className="fittingHero" data-reveal>
        <p className="eyebrow">PHÒNG THỬ ĐỒ AI LSOUL</p>
        <h1>Thử trước.<br />Ưng thì mặc.</h1>
        <p>Chọn những món đã lưu, thử trực tiếp trên ảnh của bạn bằng AI, rồi chỉnh màu và cỡ trước khi mua cả bộ.</p>
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
            <div className="fittingStepHead"><span>02</span><div><strong>Tủ đồ đã lưu</strong><small>Áo + quần/chân váy (+ áo khoác), hoặc váy/đầm riêng</small></div><Sparkles size={17} /></div>
            <div className="fittingLookSummary"><span>BỘ ĐỒ</span><strong>{outfitLabel(selectedProducts)}</strong></div>
            <div className="fittingWishlist fittingWardrobeGroups">
              {(["tops", "bottoms", "dresses", "outerwear"] as WardrobeGroup[]).map((group) => {
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

          <button className="btn block fittingRun" disabled={!personImage || !outfitReady || loading} onClick={runTryOn}>
            {loading ? <LoaderCircle className="spin" size={17} /> : <WandSparkles size={17} />}
            {loading ? "Đang tạo fitting..." : `Thử ${outfitLabel(selectedProducts)} bằng AI`}
          </button>
          {!outfitReady && selectedProducts.length ? <p className="fittingCompositionHint">Outfit chưa hoàn chỉnh · cần áo + quần/chân váy, hoặc một váy/đầm.</p> : null}
          <p className="fittingStatus">{message}</p>
        </aside>

        <div className="fittingStage">
          <div className="fittingResult">
            {resultImage ? <Image src={resultImage} alt="Kết quả thử đồ LSOUL" fill unoptimized priority /> : personImage ? <Image src={personImage} alt="Ảnh người dùng" fill unoptimized /> : <div className="fittingPlaceholder"><WandSparkles size={34} /><strong>Ảnh thử đồ</strong><p>Ảnh kết quả sẽ xuất hiện tại đây.</p></div>}
            <span className="fittingStageLabel">{resultImage ? "KẾT QUẢ AI" : "ẢNH CỦA BẠN"}</span>
          </div>
          {intermediate.length > 1 ? <div className="fittingPasses">{intermediate.map((step, index) => <div key={step.productId}><Image src={step.output} alt={`Try-on pass ${index + 1}`} fill unoptimized /><span>PASS {index + 1}</span></div>)}</div> : null}

          {resultImage ? (
            <section className="stylistAssessment" aria-live="polite">
              <div className="stylistAssessmentHead">
                <div className="stylistIdentity">
                  <span><BrainCircuit size={16} /></span>
                  <div><small>AI STYLIST</small><strong>Outfit này có hợp với bạn không?</strong></div>
                </div>
                {assessment ? <div className="stylistOverall"><strong>{assessment.overallScore}</strong><span>/100</span></div> : null}
              </div>

              {assessmentLoading ? (
                <div className="stylistLoading"><LoaderCircle className="spin" size={18} /><div><strong>Đang đọc tổng thể outfit...</strong><span>Phân tích màu sắc, tỉ lệ thị giác, phong cách và gu đã học.</span></div></div>
              ) : assessment ? (
                <>
                  <div className="stylistVerdict">
                    <div><span>{assessment.verdict}</span><strong>{assessment.summary}</strong></div>
                    <small>{assessment.mode === "vision+profile" ? "Gemini Vision + hồ sơ gu cá nhân" : "Metadata + hồ sơ gu cá nhân"}</small>
                  </div>

                  <div className="stylistScores">
                    {assessment.scores.map((score) => (
                      <div className="stylistScore" key={score.key}>
                        <div><strong>{score.label}</strong><span>{score.score}/100</span></div>
                        <div className="stylistBar"><i style={{ width: `${score.score}%` }} /></div>
                        <small>{score.note}</small>
                      </div>
                    ))}
                  </div>

                  <div className="stylistReasons">
                    <div className="positive"><strong>Điểm hợp</strong><ul>{assessment.positives.map((item) => <li key={item}>{item}</li>)}</ul></div>
                    <div className="caution"><strong>Cần cân nhắc</strong><ul>{assessment.cautions.map((item) => <li key={item}>{item}</li>)}</ul></div>
                    <div className="suggestion"><strong>Gợi ý thử tiếp</strong><ul>{assessment.suggestions.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  </div>

                  <div className="stylistFeedback">
                    <div><strong>AI nói có đúng với bạn không?</strong><span>Phản hồi này sẽ giúp hệ thống học gu cho các lần sau.</span></div>
                    <div>
                      <button type="button" disabled={!tryOnSessionId || feedbackSaving || Boolean(feedbackReaction)} className={feedbackReaction === "accurate" ? "selected" : ""} onClick={() => sendStylistFeedback("accurate")}><ThumbsUp size={13} /> Chuẩn với mình</button>
                      <button type="button" disabled={!tryOnSessionId || feedbackSaving || Boolean(feedbackReaction)} className={feedbackReaction === "love" ? "selected" : ""} onClick={() => sendStylistFeedback("love")}><Heart size={13} /> Mình thích outfit này</button>
                      <button type="button" disabled={!tryOnSessionId || feedbackSaving || Boolean(feedbackReaction)} className={feedbackReaction === "inaccurate" ? "selected" : ""} onClick={() => sendStylistFeedback("inaccurate")}><ThumbsDown size={13} /> Chưa đúng gu</button>
                    </div>
                  </div>

                  <p className="stylistDisclaimer">{assessment.disclaimer}</p>
                </>
              ) : (
                <div className="stylistLoading error"><BrainCircuit size={18} /><div><strong>Chưa có đánh giá.</strong><span>{assessmentError || "Bạn vẫn có thể xem ảnh thử đồ và chọn sản phẩm bình thường."}</span></div></div>
              )}
            </section>
          ) : null}
        </div>
      </div>

      {selectedProducts.length ? (
        <section className="fittingBuyPanel" data-reveal>
          <div className="fittingBuyHeader"><div><p className="eyebrow">CHỈNH BỘ ĐỒ</p><h2>Hoàn thiện bộ đồ trước khi mua.</h2></div><div><small>Tổng dự kiến</small><strong>{formatPrice(total)}</strong></div></div>
          <div className="fittingConfiguredList">
            {selectedProducts.map((product) => {
              const config = configured.find((item) => item.productId === product.id);
              const colorVariants = product.groupCode ? catalog.filter((item) => item.groupCode === product.groupCode && item.active !== false) : [product];
              return (
                <article key={product.id}>
                  <div className="fittingConfiguredImage"><Image src={product.image} alt={product.name} fill sizes="110px" /></div>
                  <div className="fittingConfiguredMeta"><strong>{product.name}</strong><span>{product.subtitle}</span><small>{formatPrice(product.price)}</small></div>
                  <label><span>Màu sắc</span><select value={product.id} onChange={(event) => changeColor(product, event.target.value)}>{colorVariants.map((variant) => <option value={variant.id} key={variant.id}>{variant.color}</option>)}</select></label>
                  <label><span>Cỡ</span><select value={config?.size ?? firstSize(product)} onChange={(event) => changeSize(product.id, event.target.value)}>{product.variants?.filter((variant) => variant.stock > 0).map((variant) => <option value={variant.size} key={variant.size}>{variant.size}</option>)}</select></label>
                </article>
              );
            })}
          </div>
          <div className="fittingBuyActions">
            <button className="btn secondary" onClick={() => buySet(false)}><ShoppingBag size={16} /> Thêm cả bộ vào giỏ</button>
            <button className="btn" onClick={() => buySet(true)}>Mua bộ này</button>
          </div>
        </section>
      ) : null}
    </section>
  );
}

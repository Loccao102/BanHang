"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  Sparkles,
  UploadCloud,
  X,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  Shirt
} from "lucide-react";
import { formatPrice } from "@/lib/products";
import type { VisualAnalysisResult, VisualMatchItem, VisualSearchResponse } from "@/lib/server/visual-search";

const PRESET_SAMPLES = [
  {
    id: "preset-corset-black",
    title: "Corset ren đen Y2K",
    category: "Áo / Corset",
    image: "/products/top-corset-lace-black.jpg"
  },
  {
    id: "preset-dress-red",
    title: "Đầm nhung đỏ tiệc tùng",
    category: "Đầm dạ tiệc",
    image: "/products/dress-velvet-body-red.jpg"
  },
  {
    id: "preset-skirt-white",
    title: "Chân váy xếp ly trắng",
    category: "Chân váy",
    image: "/products/skirt-pleated-mini-white.jpg"
  },
  {
    id: "preset-blazer-beige",
    title: "Blazer chiết eo thanh lịch",
    category: "Áo khoác",
    image: "/products/blazer-hourglass-beige.jpg"
  }
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function VisualSearchModal({ open, onClose }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VisualAnalysisResult | null>(null);
  const [matches, setMatches] = useState<VisualMatchItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Support paste from clipboard
  useEffect(() => {
    if (!open) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            handleFileSelect(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [open]);

  // Animated scanning steps
  useEffect(() => {
    if (!isAnalyzing) return;
    setAnalysisStep(0);
    const interval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 2 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const runVisualSearch = useCallback(async (imageDataUrl: string) => {
    setSelectedImage(imageDataUrl);
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setMatches([]);

    try {
      const response = await fetch("/api/search/visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Không thể phân tích ảnh vào lúc này.");
      }

      const data: VisualSearchResponse = await response.json();
      setAnalysis(data.analysis);
      setMatches(data.results || []);
    } catch (err: any) {
      setError(err?.message || "Đã xảy ra lỗi khi tìm kiếm bằng ảnh.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng tải lên định dạng hình ảnh hợp lệ (JPG, PNG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        runVisualSearch(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetSearch = () => {
    setSelectedImage(null);
    setAnalysis(null);
    setMatches([]);
    setError(null);
    setIsAnalyzing(false);
  };

  if (!open) return null;

  return (
    <div className="visualSearchOverlay" role="dialog" aria-modal="true">
      <div className="visualSearchBackdrop" onClick={onClose} />

      <div className="visualSearchCard">
        {/* Header */}
        <div className="visualSearchHeader">
          <div className="visualSearchTitleWrap">
            <div className="visualSearchBadge">
              <Sparkles size={14} />
              <span>LSOUL Multimodal AI</span>
            </div>
            <h2>Tìm kiếm bằng hình ảnh</h2>
            <p>Tải ảnh bất kỳ để AI nhận diện kiểu dáng và đối chiếu sản phẩm tương đồng trong catalog.</p>
          </div>
          <button className="visualSearchCloseBtn" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="visualSearchBody">
          {/* STEP 1: Upload & Presets when no image selected */}
          {!selectedImage && (
            <div className="visualSearchUploadSection">
              <div
                className={`visualDropZone ${isDragOver ? "dragOver" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                <div className="visualDropIconWrap">
                  <UploadCloud size={32} />
                </div>
                <h3>Kéo và thả ảnh vào đây</h3>
                <p>hoặc nhấp chuột để chọn ảnh từ máy tính / dán ảnh (Ctrl + V)</p>
                <div className="visualDropMeta">
                  <span>Hỗ trợ JPG, PNG, WEBP</span>
                  <span>•</span>
                  <span>Tối đa 10MB</span>
                </div>
              </div>

              {/* Presets for quick demo */}
              <div className="visualPresetsSection">
                <div className="visualPresetsHeader">
                  <span>HOẶC THỬ NHANH VỚI ẢNH MẪU:</span>
                </div>
                <div className="visualPresetsGrid">
                  {PRESET_SAMPLES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className="visualPresetItem"
                      onClick={() => runVisualSearch(preset.image)}
                    >
                      <div className="visualPresetThumb">
                        <Image src={preset.image} alt={preset.title} fill sizes="80px" />
                      </div>
                      <div className="visualPresetInfo">
                        <strong>{preset.title}</strong>
                        <span>{preset.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Analyzing Radar Animation */}
          {selectedImage && isAnalyzing && (
            <div className="visualAnalyzingSection">
              <div className="visualScanningVisual">
                <div className="visualImageHolder">
                  <Image src={selectedImage} alt="Hình ảnh đang phân tích" fill unoptimized />
                  <div className="visualLaserBeam" />
                </div>
              </div>

              <div className="visualScanningStatus">
                <div className="visualSpinner" />
                <h3>AI đang nhận diện thuộc tính trang phục...</h3>
                <div className="visualStepList">
                  <div className={`visualStepItem ${analysisStep >= 0 ? "active" : ""}`}>
                    <CheckCircle2 size={16} />
                    <span>Trích xuất kiểu dáng & phom mẫu (Silhouette)</span>
                  </div>
                  <div className={`visualStepItem ${analysisStep >= 1 ? "active" : ""}`}>
                    <CheckCircle2 size={16} />
                    <span>Phân tích sắc độ & chi tiết điểm nhấn thời trang</span>
                  </div>
                  <div className={`visualStepItem ${analysisStep >= 2 ? "active" : ""}`}>
                    <CheckCircle2 size={16} />
                    <span>So khớp không gian Vector pgvector trong Catalog LSOUL</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !isAnalyzing && (
            <div className="visualErrorSection">
              <p>{error}</p>
              <button type="button" className="btn secondary" onClick={resetSearch}>
                <RefreshCw size={14} /> Thử lại ảnh khác
              </button>
            </div>
          )}

          {/* STEP 3: Results Display */}
          {selectedImage && !isAnalyzing && analysis && (
            <div className="visualResultsSection">
              {/* Left Column: Input Image + Detected Features */}
              <div className="visualQueryColumn">
                <div className="visualQueryImageCard">
                  <div className="visualQueryImage">
                    <Image src={selectedImage} alt="Ảnh truy vấn" fill unoptimized />
                    <span className="visualQueryTag">Ảnh tải lên</span>
                  </div>

                  <div className="visualQueryDetails">
                    <div className="visualAnalysisSummary">
                      <p>"{analysis.visualSummary}"</p>
                    </div>

                    <div className="visualTagGroup">
                      <div className="visualTagRow">
                        <span className="tagLabel">Loại đồ:</span>
                        <strong className="tagVal highlight">{analysis.category.toUpperCase()} · {analysis.type}</strong>
                      </div>
                      <div className="visualTagRow">
                        <span className="tagLabel">Tông màu:</span>
                        <strong className="tagVal">{analysis.color} ({analysis.colorFamily})</strong>
                      </div>
                      <div className="visualTagRow">
                        <span className="tagLabel">Phong cách:</span>
                        <strong className="tagVal">{analysis.style}</strong>
                      </div>
                    </div>

                    {analysis.keyFeatures?.length > 0 && (
                      <div className="visualFeaturePills">
                        {analysis.keyFeatures.map((f, i) => (
                          <span key={i} className="featurePill">#{f}</span>
                        ))}
                      </div>
                    )}

                    <button type="button" className="visualChangeImgBtn" onClick={resetSearch}>
                      <Camera size={14} />
                      <span>Chọn ảnh khác</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Matched Products */}
              <div className="visualMatchesColumn">
                <div className="visualMatchesHeader">
                  <h4>Sản phẩm tương đồng tìm thấy ({matches.length})</h4>
                  <span className="visualSortNote">Được sắp xếp theo điểm Vector Cosine & thuộc tính thị giác</span>
                </div>

                {matches.length === 0 ? (
                  <div className="visualNoMatch">
                    <Shirt size={32} />
                    <p>Chưa tìm thấy mẫu nào hoàn toàn khớp với ảnh này.</p>
                    <button type="button" className="btn secondary" onClick={resetSearch}>
                      Thử bức ảnh khác
                    </button>
                  </div>
                ) : (
                  <div className="visualProductGrid">
                    {matches.map(({ product, matchPercent, reasons }) => (
                      <div key={product.id} className="visualProductCard">
                        <Link href={`/product/${product.id}`} onClick={onClose} className="visualProductImageLink">
                          <div className="visualProductImage">
                            <Image src={product.image} alt={product.name} fill sizes="160px" />
                            <div className="visualMatchPercentBadge">
                              <Sparkles size={11} />
                              <span>{matchPercent}% Tương đồng</span>
                            </div>
                          </div>
                        </Link>

                        <div className="visualProductMeta">
                          <Link href={`/product/${product.id}`} onClick={onClose} className="visualProductTitle">
                            <strong>{product.name}</strong>
                          </Link>
                          <div className="visualProductPrice">
                            <span>{formatPrice(product.price)}</span>
                            {product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}
                          </div>

                          {/* Match reasons pills */}
                          <div className="visualMatchReasonList">
                            {reasons.slice(0, 2).map((r, idx) => (
                              <span key={idx} className="matchReasonPill">✓ {r}</span>
                            ))}
                          </div>

                          <div className="visualCardActionRow">
                            <Link
                              href={`/product/${product.id}`}
                              onClick={onClose}
                              className="visualViewBtn"
                            >
                              <span>Xem đồ</span>
                              <ArrowRight size={13} />
                            </Link>
                            <Link
                              href={`/try-on?items=${product.id}`}
                              onClick={onClose}
                              className="visualTryBtn"
                              title="Ướm thử mẫu này trong phòng thử đồ AI"
                            >
                              Thử đồ AI
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

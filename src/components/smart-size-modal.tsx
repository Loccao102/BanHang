"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  Check,
  ChevronRight,
  Info,
  Ruler,
  Sliders,
  Sparkles,
  User,
  X,
  Zap
} from "lucide-react";
import type { Product } from "@/lib/products";
import {
  analyzeBodyShape,
  evaluateProductFit,
  estimateMeasurementsFromHeightWeight,
  LSOUL_SIZE_CHART,
  type BodyMeasurements,
  type LsoulSize
} from "@/lib/body-shape";

type Props = {
  open: boolean;
  onClose: () => void;
  product: Product;
  onSelectSize: (size: string) => void;
};

const STORAGE_KEY = "lsoul_user_body_measurements";

export function SmartSizeModal({ open, onClose, product, onSelectSize }: Props) {
  const [mode, setMode] = useState<"quick" | "detailed">("quick");
  const [height, setHeight] = useState<number>(160);
  const [weight, setWeight] = useState<number>(49);
  const [bust, setBust] = useState<number>(84);
  const [waist, setWaist] = useState<number>(64);
  const [hips, setHips] = useState<number>(90);
  const [savePreference, setSavePreference] = useState(true);

  // Load saved measurements from localStorage on open
  useEffect(() => {
    if (!open) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.height) setHeight(parsed.height);
        if (parsed.weight) setWeight(parsed.weight);
        if (parsed.bust) setBust(parsed.bust);
        if (parsed.waist) setWaist(parsed.waist);
        if (parsed.hips) setHips(parsed.hips);
        if (parsed.bust && parsed.waist && parsed.hips) {
          setMode("detailed");
        }
      }
    } catch {
      // Ignore
    }
  }, [open]);

  // When in quick mode and height/weight change, auto-estimate 3 measurements
  useEffect(() => {
    if (mode === "quick") {
      const est = estimateMeasurementsFromHeightWeight(height, weight);
      setBust(est.bust);
      setWaist(est.waist);
      setHips(est.hips);
    }
  }, [height, weight, mode]);

  // Calculate live body shape & product fit
  const measurements: BodyMeasurements = useMemo(() => {
    return {
      height,
      weight,
      bust,
      waist,
      hips
    };
  }, [height, weight, bust, waist, hips]);

  const bodyAnalysis = useMemo(() => {
    return analyzeBodyShape(measurements);
  }, [measurements]);

  const fitAdvice = useMemo(() => {
    return evaluateProductFit(product, measurements);
  }, [product, measurements]);

  const handleApplySize = () => {
    if (savePreference) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(measurements));
      } catch {
        // Ignore
      }
    }
    onSelectSize(fitAdvice.recommendedSize);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="smartFitOverlay" role="dialog" aria-modal="true">
      <div className="smartFitBackdrop" onClick={onClose} />

      <div className="smartFitCard">
        {/* Header */}
        <div className="smartFitHeader">
          <div className="smartFitHeaderTitle">
            <div className="smartFitAiBadge">
              <Sparkles size={13} />
              <span>LSOUL Intelligent Fitting AI</span>
            </div>
            <h2>Tư vấn chọn size thông minh</h2>
            <p>Phân tích tỷ lệ nhân trắc học và cấu trúc thiết kế để gợi ý size vừa vặn nhất cho bạn.</p>
          </div>
          <button className="smartFitCloseBtn" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Product mini context bar */}
        <div className="smartFitProductBar">
          <div className="smartFitProductThumb">
            <Image src={product.image} alt={product.name} fill sizes="60px" />
          </div>
          <div className="smartFitProductDetails">
            <strong>{product.name}</strong>
            <div className="smartFitProductPills">
              <span>Màu: {product.color}</span>
              <span>Phom: {product.fit}</span>
              {product.stretch ? <span>Độ co giãn: {product.stretch}/5</span> : null}
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="smartFitModeTabs">
          <button
            type="button"
            className={`smartFitTab ${mode === "quick" ? "active" : ""}`}
            onClick={() => setMode("quick")}
          >
            <Zap size={14} />
            <span>Nhanh (Chiều cao & Cân nặng)</span>
          </button>
          <button
            type="button"
            className={`smartFitTab ${mode === "detailed" ? "active" : ""}`}
            onClick={() => setMode("detailed")}
          >
            <Ruler size={14} />
            <span>Chi tiết (Số đo 3 vòng)</span>
          </button>
        </div>

        {/* Body Form & Sliders */}
        <div className="smartFitBody">
          <div className="smartFitInputsCol">
            {/* Height & Weight */}
            <div className="smartFitControlGroup">
              <div className="smartFitControlLabel">
                <span>Chiều cao:</span>
                <strong>{height} cm</strong>
              </div>
              <input
                type="range"
                min={145}
                max={185}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="smartFitSlider"
              />
            </div>

            <div className="smartFitControlGroup">
              <div className="smartFitControlLabel">
                <span>Cân nặng:</span>
                <strong>{weight} kg</strong>
              </div>
              <input
                type="range"
                min={38}
                max={80}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="smartFitSlider"
              />
            </div>

            {/* 3 Measurements (Detailed Mode) */}
            {mode === "detailed" ? (
              <div className="smartFitDetailedFields">
                <div className="smartFitControlGroup">
                  <div className="smartFitControlLabel">
                    <span>Vòng 1 (Ngực):</span>
                    <strong>{bust} cm</strong>
                  </div>
                  <input
                    type="range"
                    min={70}
                    max={110}
                    value={bust}
                    onChange={(e) => setBust(Number(e.target.value))}
                    className="smartFitSlider"
                  />
                </div>

                <div className="smartFitControlGroup">
                  <div className="smartFitControlLabel">
                    <span>Vòng 2 (Eo):</span>
                    <strong>{waist} cm</strong>
                  </div>
                  <input
                    type="range"
                    min={54}
                    max={95}
                    value={waist}
                    onChange={(e) => setWaist(Number(e.target.value))}
                    className="smartFitSlider"
                  />
                </div>

                <div className="smartFitControlGroup">
                  <div className="smartFitControlLabel">
                    <span>Vòng 3 (Mông):</span>
                    <strong>{hips} cm</strong>
                  </div>
                  <input
                    type="range"
                    min={78}
                    max={118}
                    value={hips}
                    onChange={(e) => setHips(Number(e.target.value))}
                    className="smartFitSlider"
                  />
                </div>
              </div>
            ) : (
              <div className="smartFitEstimatedNote">
                <Info size={14} />
                <span>Số đo ước lượng tương ứng: <b>{bust}</b> (V1) - <b>{waist}</b> (V2) - <b>{hips}</b> (V3) cm. Chuyển sang tab "Chi tiết" để chỉnh tay nếu bạn có số đo chính xác.</span>
              </div>
            )}
          </div>

          {/* Result Advice Column */}
          <div className="smartFitAdviceCol">
            {/* Recommendation Hero Box */}
            <div className="smartFitHeroBox">
              <div className="smartFitHeroTop">
                <div className="smartFitSizeBadge">
                  <span className="sizeLabel">SIZE KHUYÊN DÙNG</span>
                  <strong className="sizeVal">{fitAdvice.recommendedSize}</strong>
                </div>
                <div className="smartFitScoreCircle">
                  <span className="scoreNum">{fitAdvice.comfortScore}%</span>
                  <span className="scoreLabel">Độ vừa vặn</span>
                </div>
              </div>

              <div className="smartFitVerdictLabel">
                <Check size={16} />
                <span>{fitAdvice.verdictLabel}</span>
              </div>

              <p className="smartFitAdviceText">"{fitAdvice.adviceText}"</p>
            </div>

            {/* Body Shape Card */}
            {bodyAnalysis && (
              <div className="smartFitShapeCard">
                <div className="smartFitShapeTitle">
                  <User size={15} />
                  <span>Dáng người: <strong>{bodyAnalysis.shapeLabel}</strong></span>
                </div>
                <p>{bodyAnalysis.shapeDescription}</p>
              </div>
            )}

            {/* Zone Comparison Details */}
            <div className="smartFitZonesList">
              {fitAdvice.zoneDetails.map((zone, idx) => (
                <div key={idx} className="smartFitZoneRow">
                  <span className="zoneName">{zone.zone}</span>
                  <span className="zoneVal">{zone.measurement} cm</span>
                  <span className={`zoneStatus ${zone.status}`}>{zone.statusText}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="smartFitFooter">
          <label className="smartFitSaveCheckbox">
            <input
              type="checkbox"
              checked={savePreference}
              onChange={(e) => setSavePreference(e.target.checked)}
            />
            <span>Lưu số đo để tự động gợi ý cho các sản phẩm khác</span>
          </label>

          <div className="smartFitButtonRow">
            <button type="button" className="btn secondary" onClick={onClose}>
              Đóng
            </button>
            <button type="button" className="btn primary smartFitApplyBtn" onClick={handleApplySize}>
              <Check size={16} />
              <span>Áp dụng Size {fitAdvice.recommendedSize} ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

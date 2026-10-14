"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Info,
  Ruler,
  Save,
  Sparkles,
  User,
  Zap
} from "lucide-react";
import {
  analyzeBodyShape,
  estimateMeasurementsFromHeightWeight,
  LSOUL_SIZE_CHART,
  type BodyMeasurements,
  type BodyShapeType,
  type LsoulSize
} from "@/lib/body-shape";

const STORAGE_KEY = "lsoul_user_body_measurements";

const SHAPE_ICONS: Record<BodyShapeType, string> = {
  hourglass: "⌛",
  pear: "🍐",
  rectangle: "📏",
  inverted_triangle: "🔻",
  apple: "🍎"
};

export function SizeGuideClient() {
  const [height, setHeight] = useState(160);
  const [weight, setWeight] = useState(49);
  const [bust, setBust] = useState(84);
  const [waist, setWaist] = useState(64);
  const [hips, setHips] = useState(90);
  const [isManualAdjust, setIsManualAdjust] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load saved measurements on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.height) setHeight(parsed.height);
        if (parsed.weight) setWeight(parsed.weight);
        if (parsed.bust) setBust(parsed.bust);
        if (parsed.waist) setWaist(parsed.waist);
        if (parsed.hips) setHips(parsed.hips);
        setIsManualAdjust(true);
      }
    } catch {
      // Ignore
    }
  }, []);

  // When height/weight change and not manually overridden, recalculate 3-measurements
  const handleHeightWeightChange = (newH: number, newW: number) => {
    setHeight(newH);
    setWeight(newW);
    if (!isManualAdjust) {
      const est = estimateMeasurementsFromHeightWeight(newH, newW);
      setBust(est.bust);
      setWaist(est.waist);
      setHips(est.hips);
    }
  };

  const measurements: BodyMeasurements = useMemo(() => {
    return { height, weight, bust, waist, hips };
  }, [height, weight, bust, waist, hips]);

  const analysis = useMemo(() => {
    return analyzeBodyShape(measurements);
  }, [measurements]);

  const handleSaveToProfile = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(measurements));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      // Ignore
    }
  };

  const handleResetToEstimated = () => {
    const est = estimateMeasurementsFromHeightWeight(height, weight);
    setBust(est.bust);
    setWaist(est.waist);
    setHips(est.hips);
    setIsManualAdjust(false);
  };

  return (
    <div className="fitStudioPage">
      {/* Studio Header */}
      <div className="fitStudioHeader">
        <div className="fitStudioBadge">
          <Sparkles size={14} />
          <span>LSOUL FIT STUDIO & SIZE LAB</span>
        </div>
        <h1>Tính Size Chuẩn & Phân Tích Dáng Người AI</h1>
        <p>
          Hệ thống phân tích nhân trắc học kết hợp số đo cơ thể để nhận diện phom dáng và đề xuất kích cỡ tối ưu cho các thiết kế LSOUL.
        </p>
      </div>

      {/* Interactive Calculator Section */}
      <div className="fitStudioCard">
        <div className="fitStudioGrid">
          {/* Controls Column */}
          <div className="fitStudioControlsCol">
            <div className="colHeader">
              <h3>1. Nhập chỉ số cơ thể của bạn</h3>
              <p>Kéo thanh trượt để cập nhật số đo thực tế</p>
            </div>

            <div className="sliderRow">
              <div className="sliderLabel">
                <span>Chiều cao:</span>
                <strong>{height} cm</strong>
              </div>
              <input
                type="range"
                min={145}
                max={185}
                value={height}
                onChange={(e) => handleHeightWeightChange(Number(e.target.value), weight)}
                className="studioSlider"
              />
            </div>

            <div className="sliderRow">
              <div className="sliderLabel">
                <span>Cân nặng:</span>
                <strong>{weight} kg</strong>
              </div>
              <input
                type="range"
                min={38}
                max={80}
                value={weight}
                onChange={(e) => handleHeightWeightChange(height, Number(e.target.value))}
                className="studioSlider"
              />
            </div>

            <div className="dividerLabel">
              <span>SỐ ĐO 3 VÒNG (CM)</span>
              {isManualAdjust && (
                <button type="button" className="textResetBtn" onClick={handleResetToEstimated}>
                  Ước lượng lại theo cân nặng
                </button>
              )}
            </div>

            <div className="sliderRow">
              <div className="sliderLabel">
                <span>Vòng 1 (Ngực):</span>
                <strong>{bust} cm</strong>
              </div>
              <input
                type="range"
                min={70}
                max={110}
                value={bust}
                onChange={(e) => {
                  setBust(Number(e.target.value));
                  setIsManualAdjust(true);
                }}
                className="studioSlider"
              />
            </div>

            <div className="sliderRow">
              <div className="sliderLabel">
                <span>Vòng 2 (Eo):</span>
                <strong>{waist} cm</strong>
              </div>
              <input
                type="range"
                min={54}
                max={95}
                value={waist}
                onChange={(e) => {
                  setWaist(Number(e.target.value));
                  setIsManualAdjust(true);
                }}
                className="studioSlider"
              />
            </div>

            <div className="sliderRow">
              <div className="sliderLabel">
                <span>Vòng 3 (Mông):</span>
                <strong>{hips} cm</strong>
              </div>
              <input
                type="range"
                min={78}
                max={118}
                value={hips}
                onChange={(e) => {
                  setHips(Number(e.target.value));
                  setIsManualAdjust(true);
                }}
                className="studioSlider"
              />
            </div>

            <button
              type="button"
              className={`studioSaveBtn ${savedSuccess ? "saved" : ""}`}
              onClick={handleSaveToProfile}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Đã lưu số đo thành công!</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Lưu số đo để tự động nhận diện trên trang sản phẩm</span>
                </>
              )}
            </button>
          </div>

          {/* Results Analysis Column */}
          <div className="fitStudioResultsCol">
            <div className="colHeader">
              <h3>2. Kết quả phân tích từ AI Stylist</h3>
              <p>Khuyến nghị dựa trên cấu trúc may mặc LSOUL</p>
            </div>

            {analysis && (
              <div className="studioResultCard">
                {/* Recommended Size Box */}
                <div className="studioSizeHero">
                  <div>
                    <span className="sizeLabel">SIZE KHUYÊN CHỌN</span>
                    <strong className="sizeBig">{analysis.recommendedSize}</strong>
                  </div>
                  <div className="studioConfidenceBadge">
                    <span className="confNum">{analysis.confidenceScore}%</span>
                    <span className="confTxt">Độ tương thích</span>
                  </div>
                </div>

                {/* Body Shape Card */}
                <div className="studioShapeBox">
                  <div className="shapeHeader">
                    <span className="shapeEmoji">{SHAPE_ICONS[analysis.shape]}</span>
                    <div>
                      <strong className="shapeTitle">{analysis.shapeLabel}</strong>
                      <span className="shapeSub">Tỷ lệ 3 vòng: {bust} - {waist} - {hips} cm</span>
                    </div>
                  </div>
                  <p className="shapeDesc">{analysis.shapeDescription}</p>
                </div>

                {/* Best Styles */}
                <div className="studioStylesBox">
                  <strong>THIẾT KẾ TÔN DÁNG NHẤT CHO BẠN:</strong>
                  <div className="stylePills">
                    {analysis.bestStyles.map((style, idx) => (
                      <span key={idx} className="stylePill">
                        ✦ {style}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Advice Notes */}
                <div className="studioNotesBox">
                  {analysis.sizeAdviceNotes.map((note, idx) => (
                    <div key={idx} className="adviceNote">
                      <Check size={14} />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>

                <Link href="/shop" className="studioShopNowBtn">
                  <span>Khám phá các thiết kế LSOUL hợp dáng bạn</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Classic Size Table Reference */}
      <div className="fitClassicSection">
        <div className="sectionHeader">
          <p className="eyebrow">BẢNG THÔNG SỐ CHUẨN</p>
          <h2>Bảng Size Thiết Kế LSOUL Toàn Diện</h2>
          <p>Áp dụng cho dòng sản phẩm đầm ôm, corset, áo cúp ngực và chân váy chính hãng.</p>
        </div>

        <div className="tableWrapper">
          <table className="sizeTableStudio">
            <thead>
              <tr>
                <th>Size</th>
                <th>Vòng 1 - Ngực (cm)</th>
                <th>Vòng 2 - Eo (cm)</th>
                <th>Vòng 3 - Mông (cm)</th>
                <th>Cân nặng khuyến nghị</th>
                <th>Chiều cao phù hợp</th>
              </tr>
            </thead>
            <tbody>
              {(["XS", "S", "M", "L", "XL"] as LsoulSize[]).map((sz) => {
                const item = LSOUL_SIZE_CHART[sz];
                const isSelected = analysis?.recommendedSize === sz;
                return (
                  <tr key={sz} className={isSelected ? "highlightRow" : ""}>
                    <td>
                      <strong>{sz}</strong>
                      {isSelected && <span className="currentBadge">Size của bạn</span>}
                    </td>
                    <td>{item.bust[0]} – {item.bust[1]}</td>
                    <td>{item.waist[0]} – {item.waist[1]}</td>
                    <td>{item.hips[0]} – {item.hips[1]}</td>
                    <td>{item.weightRange[0]} – {item.weightRange[1]} kg</td>
                    <td>{item.heightRange[0]} – {item.heightRange[1]} cm</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes & Guarantees */}
        <div className="studioGuideNotes">
          <div className="noteCard">
            <strong>Lưu ý về dòng Corset & Bodysuit</strong>
            <p>
              Các thiết kế Corset của LSOUL được may kèm gọng định hình và dây đan lưng (lace-up) linh hoạt. Dây đan có thể siết hoặc nới lỏng +/- 4cm eo, giúp bạn dễ dàng tùy biến độ ôm vừa vặn theo ý muốn.
            </p>
          </div>
          <div className="noteCard">
            <strong>Chính sách đổi size 7 ngày</strong>
            <p>
              LSOUL hỗ trợ đổi size miễn phí trong vòng 7 ngày kể từ khi nhận hàng đối với sản phẩm còn nguyên tem mác. Đội ngũ Stylist luôn sẵn sàng hỗ trợ tư vấn trực tuyến 24/7.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

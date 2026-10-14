import type { Product } from "./products";

export type BodyShapeType = "hourglass" | "pear" | "apple" | "rectangle" | "inverted_triangle";

export type LsoulSize = "XS" | "S" | "M" | "L" | "XL";

export interface BodyMeasurements {
  height?: number; // cm
  weight?: number; // kg
  bust?: number;   // cm (vòng 1)
  waist?: number;  // cm (vòng 2)
  hips?: number;   // cm (vòng 3)
}

export interface BodyShapeAnalysis {
  shape: BodyShapeType;
  shapeLabel: string;
  shapeDescription: string;
  bestStyles: string[];
  recommendedSize: LsoulSize;
  sizeAdviceNotes: string[];
  confidenceScore: number; // 0 - 100
}

export interface ZoneFitDetail {
  zone: "Ngực (V1)" | "Eo (V2)" | "Mông (V3)";
  measurement: number;
  chartRange: [number, number];
  status: "perfect" | "snug" | "loose";
  statusText: string;
}

export interface ProductFitAdvice {
  recommendedSize: LsoulSize;
  fitVerdict: "perfect" | "size_up" | "size_down" | "tight_fit";
  verdictLabel: string;
  adviceText: string;
  comfortScore: number; // 0 - 100
  zoneDetails: ZoneFitDetail[];
}

export const LSOUL_SIZE_CHART: Record<
  LsoulSize,
  {
    bust: [number, number];
    waist: [number, number];
    hips: [number, number];
    weightRange: [number, number];
    heightRange: [number, number];
  }
> = {
  XS: {
    bust: [78, 82],
    waist: [60, 64],
    hips: [84, 88],
    weightRange: [40, 45],
    heightRange: [148, 158]
  },
  S: {
    bust: [82, 86],
    waist: [64, 68],
    hips: [88, 92],
    weightRange: [45, 49],
    heightRange: [152, 163]
  },
  M: {
    bust: [86, 90],
    waist: [68, 72],
    hips: [92, 96],
    weightRange: [50, 55],
    heightRange: [155, 166]
  },
  L: {
    bust: [90, 96],
    waist: [72, 78],
    hips: [96, 102],
    weightRange: [56, 62],
    heightRange: [158, 170]
  },
  XL: {
    bust: [96, 102],
    waist: [78, 84],
    hips: [102, 108],
    weightRange: [63, 70],
    heightRange: [160, 175]
  }
};

/**
 * Ước lượng số đo 3 vòng dựa trên chiều cao và cân nặng chuẩn nhân trắc học nữ Việt Nam.
 */
export function estimateMeasurementsFromHeightWeight(
  height = 160,
  weight = 49
): { bust: number; waist: number; hips: number } {
  // Công thức ước lượng nhân trắc học cơ bản
  const bmi = weight / Math.pow(height / 100, 2);
  let bust = Math.round(height * 0.52 + (bmi - 19) * 1.5);
  let waist = Math.round(height * 0.38 + (bmi - 19) * 1.8);
  let hips = Math.round(height * 0.54 + (bmi - 19) * 1.6);

  // Kẹp vào khoảng hợp lý
  bust = Math.max(76, Math.min(105, bust));
  waist = Math.max(56, Math.min(88, waist));
  hips = Math.max(82, Math.min(112, hips));

  return { bust, waist, hips };
}

/**
 * Phân tích dáng người dựa trên các chỉ số nhân trắc học 3 vòng.
 */
export function analyzeBodyShape(measurements: BodyMeasurements): BodyShapeAnalysis | null {
  const height = measurements.height || 160;
  let weight = measurements.weight || 48;
  let bust = measurements.bust;
  let waist = measurements.waist;
  let hips = measurements.hips;

  let confidenceScore = 96;

  // Nếu thiếu số đo 3 vòng, tự động ước tính theo chiều cao cân nặng
  if (!bust || !waist || !hips) {
    if (measurements.weight) {
      const estimated = estimateMeasurementsFromHeightWeight(height, weight);
      bust = bust || estimated.bust;
      waist = waist || estimated.waist;
      hips = hips || estimated.hips;
      confidenceScore = 80; // Độ tin cậy thấp hơn một chút vì ước lượng
    } else {
      return null;
    }
  }

  const waistToBust = waist / bust;
  const waistToHips = waist / hips;
  const bustHipsDiff = bust - hips;

  let shape: BodyShapeType = "rectangle";
  let shapeLabel = "Dáng Thước Kẻ / Cân Đối";
  let shapeDescription = "Số đo 3 vòng thanh thoát, cơ thể cân đối và dễ dàng diện đa dạng phong cách.";
  let bestStyles = ["Corset gọng định hình eo", "Chân váy xòe xếp ly", "Đầm bodycon cut-out"];

  if (waistToBust <= 0.77 && waistToHips <= 0.77 && Math.abs(bustHipsDiff) <= 7) {
    shape = "hourglass";
    shapeLabel = "Dáng Đồng Hồ Cát (Hourglass)";
    shapeDescription = "Vòng 1 và vòng 3 nở nang cân xứng, vòng eo thon gọn quyến rũ. Đây là vóc dáng lý tưởng nhất cho các thiết kế LSOUL!";
    bestStyles = ["Corset siết eo lưng đan", "Đầm bodycon ôm sát", "Quần ống loe cạp cao"];
  } else if (hips - bust >= 5 && waistToHips <= 0.8) {
    shape = "pear";
    shapeLabel = "Dáng Quả Lê (Pear Shape)";
    shapeDescription = "Vòng hông và đùi nở nang hơn phần thân trên, vòng eo gọn gàng duyên dáng.";
    bestStyles = ["Áo cúp ngực / Baby tee tạo điểm nhấn thân trên", "Chân váy chữ A xòe nhẹ", "Quần ống suông cạp cao"];
  } else if (bust - hips >= 5) {
    shape = "inverted_triangle";
    shapeLabel = "Dáng Tam Giác Ngược";
    shapeDescription = "Vòng 1 đầy đặn hoặc bờ vai thon dài, hông nhỏ gọn thanh thoát.";
    bestStyles = ["Áo corset cổ tim / sweetheart", "Chân váy xếp ly bồng xòe", "Quần cargo / quần túi hộp Y2K"];
  } else if (waistToBust > 0.82 && waistToHips > 0.82) {
    shape = "apple";
    shapeLabel = "Dáng Quả Táo (Apple Shape)";
    shapeDescription = "Thân trên tròn đầy, vòng 1 nổi bật và đôi chân thon thả quyến rũ.";
    bestStyles = ["Đầm chữ A cổ chữ V khoét sâu", "Chân váy ngắn khoe chân thon", "Áo blazer chiết eo nhẹ"];
  }

  // Xác định size tối ưu theo bảng size chuẩn LSOUL
  let recommendedSize: LsoulSize = "S";
  if (bust > 95 || waist > 77 || hips > 101) recommendedSize = "XL";
  else if (bust > 89 || waist > 71 || hips > 95) recommendedSize = "L";
  else if (bust > 85 || waist > 67 || hips > 91) recommendedSize = "M";
  else if (bust < 81 && waist < 63 && hips < 87) recommendedSize = "XS";
  else recommendedSize = "S";

  const sizeAdviceNotes: string[] = [
    `Số đo của bạn (${bust} - ${waist} - ${hips}cm) tương thích tối ưu với size ${recommendedSize}.`
  ];

  if (shape === "hourglass") {
    sizeAdviceNotes.push("Vòng eo thon nhỏ giúp bạn tự tin diện form ôm; các mẫu corset đan dây sẽ tôn trọn thắt eo.");
  } else if (shape === "pear") {
    sizeAdviceNotes.push("Khi chọn chân váy hoặc quần ôm, ưu tiên chọn theo vòng 3 để cử động thoải mái.");
  } else if (shape === "inverted_triangle") {
    sizeAdviceNotes.push("Khi chọn áo corset, ưu tiên size theo vòng 1 đầy đặn, phần eo có thể siết dây đan để ôm khít.");
  }

  return {
    shape,
    shapeLabel,
    shapeDescription,
    bestStyles,
    recommendedSize,
    sizeAdviceNotes,
    confidenceScore
  };
}

/**
 * Đưa ra lời khuyên vừa vặn cho một sản phẩm cụ thể dựa trên số đo của khách.
 */
export function evaluateProductFit(product: Product, measurements: BodyMeasurements): ProductFitAdvice {
  const analysis = analyzeBodyShape(measurements);
  const baseSize: LsoulSize = analysis?.recommendedSize ?? "S";

  const height = measurements.height || 160;
  const weight = measurements.weight || 48;
  const estimated = (!measurements.bust || !measurements.waist || !measurements.hips)
    ? estimateMeasurementsFromHeightWeight(height, weight)
    : { bust: measurements.bust, waist: measurements.waist, hips: measurements.hips };

  const bust = measurements.bust || estimated.bust;
  const waist = measurements.waist || estimated.waist;
  const hips = measurements.hips || estimated.hips;

  const chart = LSOUL_SIZE_CHART[baseSize];

  // Chi tiết từng zone (Ngực, Eo, Mông)
  const zoneDetails: ZoneFitDetail[] = [
    {
      zone: "Ngực (V1)",
      measurement: bust,
      chartRange: chart.bust,
      status: bust > chart.bust[1] ? "snug" : bust < chart.bust[0] ? "loose" : "perfect",
      statusText: bust > chart.bust[1] ? "Hơi ôm sát ngực" : bust < chart.bust[0] ? "Thoải mái" : "Vừa vặn chuẩn"
    },
    {
      zone: "Eo (V2)",
      measurement: waist,
      chartRange: chart.waist,
      status: waist > chart.waist[1] ? "snug" : waist < chart.waist[0] ? "loose" : "perfect",
      statusText: waist > chart.waist[1] ? "Hơi ôm eo" : waist < chart.waist[0] ? "Thoải mái" : "Vừa vặn chuẩn"
    },
    {
      zone: "Mông (V3)",
      measurement: hips,
      chartRange: chart.hips,
      status: hips > chart.hips[1] ? "snug" : hips < chart.hips[0] ? "loose" : "perfect",
      statusText: hips > chart.hips[1] ? "Hơi ôm mông" : hips < chart.hips[0] ? "Thoải mái" : "Vừa vặn chuẩn"
    }
  ];

  const isCorset = product.type === "corset" || /corset|bodysuit/i.test(product.name);
  const isDress = product.category === "dress";
  const isBottoms = product.category === "bottoms";
  const isStretch = (product.stretch ?? 2) >= 3;

  // Xử lý riêng cho Corset LSOUL (Đặc trưng có gọng và dây đan lưng)
  if (isCorset) {
    if (bust > chart.bust[1] && baseSize !== "XL") {
      const nextSize: LsoulSize = baseSize === "XS" ? "S" : baseSize === "S" ? "M" : "L";
      return {
        recommendedSize: nextSize,
        fitVerdict: "size_up",
        verdictLabel: `Nên chọn ${nextSize} (Tăng 1 size)`,
        comfortScore: 94,
        adviceText: `Mẫu Corset LSOUL có gọng định hình. Với vòng 1 (${bust}cm), khuyên bạn chọn size ${nextSize} để phần ngực dễ thở và tự nhiên. Dây đan lưng độc quyền sẽ giúp bạn siết eo về ${waist}cm ôm khít hoàn hảo!`,
        zoneDetails
      };
    }
    return {
      recommendedSize: baseSize,
      fitVerdict: "perfect",
      verdictLabel: `Vừa vặn hoàn hảo (${baseSize})`,
      comfortScore: 97,
      adviceText: `Size ${baseSize} vừa khít với vóc dáng của bạn. Gọng định hình và dây đan lưng sau sẽ ôm sát eo chuẩn form đồng hồ cát LSOUL.`,
      zoneDetails
    };
  }

  // Xử lý riêng cho Đầm ôm (Bodycon dress)
  if (isDress && /bodycon|ôm|slip/i.test(product.name + product.type)) {
    if (hips > chart.hips[1] && !isStretch && baseSize !== "XL") {
      const nextSize: LsoulSize = baseSize === "XS" ? "S" : baseSize === "S" ? "M" : "L";
      return {
        recommendedSize: nextSize,
        fitVerdict: "size_up",
        verdictLabel: `Nên chọn ${nextSize} (Dễ cử động)`,
        comfortScore: 92,
        adviceText: `Chất liệu phom đứng không co giãn nhiều. Vòng 3 của bạn là ${hips}cm, khuyên chọn size ${nextSize} để bước đi và ngồi thoải mái mà vẫn tôn đường cong.`,
        zoneDetails
      };
    }
    return {
      recommendedSize: baseSize,
      fitVerdict: "perfect",
      verdictLabel: `Vừa vặn tôn dáng (${baseSize})`,
      comfortScore: 95,
      adviceText: `Thiết kế đầm này ôm trọn tỉ lệ 3 vòng (${bust} - ${waist} - ${hips}cm) của bạn ở size ${baseSize}.`,
      zoneDetails
    };
  }

  // Xử lý cho Quần & Chân váy (Bottoms)
  if (isBottoms) {
    if (hips > chart.hips[1] && baseSize !== "XL") {
      const nextSize: LsoulSize = baseSize === "XS" ? "S" : baseSize === "S" ? "M" : "L";
      return {
        recommendedSize: nextSize,
        fitVerdict: "size_up",
        verdictLabel: `Nên chọn ${nextSize} (Thoải mái hông/đùi)`,
        comfortScore: 90,
        adviceText: `Vòng 3 (${hips}cm) của bạn nên ưu tiên size ${nextSize} để phần đùi và hông cử động thoải mái nhất.`,
        zoneDetails
      };
    }
  }

  return {
    recommendedSize: baseSize,
    fitVerdict: "perfect",
    verdictLabel: `Vừa vặn tiêu chuẩn (${baseSize})`,
    comfortScore: 93,
    adviceText: `Size ${baseSize} chuẩn theo phom dáng thiết kế LSOUL với các thông số số đo của bạn.`,
    zoneDetails
  };
}

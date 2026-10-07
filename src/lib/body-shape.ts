import type { Product } from "./products";

export type BodyShapeType = "hourglass" | "pear" | "apple" | "rectangle" | "inverted_triangle";

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
  recommendedSize: "S" | "M" | "L" | "XL";
  sizeAdviceNotes: string[];
}

export interface ProductFitAdvice {
  recommendedSize: "S" | "M" | "L" | "XL";
  fitVerdict: "perfect" | "size_up" | "size_down" | "tight_fit";
  adviceText: string;
  comfortScore: number; // 0 - 100
}

/**
 * Phân tích dáng người dựa trên các chỉ số nhân trắc học 3 vòng.
 */
export function analyzeBodyShape(measurements: BodyMeasurements): BodyShapeAnalysis | null {
  const { bust, waist, hips, weight, height } = measurements;

  if (!bust || !waist || !hips) {
    // Nếu chỉ có chiều cao cân nặng
    if (weight) {
      let size: "S" | "M" | "L" | "XL" = "S";
      if (weight > 62) size = "XL";
      else if (weight > 54) size = "L";
      else if (weight > 47) size = "M";

      return {
        shape: "rectangle",
        shapeLabel: "Dáng cân đối cơ bản",
        shapeDescription: "Dựa trên cân nặng và chiều cao, dáng người thanh mảnh, dễ diện đa dạng kiểu dáng.",
        bestStyles: ["Corset ôm eo", "Chân váy xếp ly", "Đầm bodycon"],
        recommendedSize: size,
        sizeAdviceNotes: [
          `Cân nặng ${weight}kg: Phù hợp nhất với size ${size} của LSOUL.`,
          "Hãy nhập thêm số đo 3 vòng để AI nhận diện dáng đồng hồ cát, quả lê chính xác nhất."
        ]
      };
    }
    return null;
  }

  const waistToBust = waist / bust;
  const waistToHips = waist / hips;
  const bustHipsDiff = bust - hips;

  let shape: BodyShapeType = "rectangle";
  let shapeLabel = "Dáng Thước Kẻ / Cân Đối";
  let shapeDescription = "Số đo 3 vòng cân bằng, đường cong nhẹ nhàng thanh thoát.";
  let bestStyles = ["Corset gọng định hình eo", "Chân váy xòe xếp ly", "Đầm cut-out eo"];

  if (waistToBust <= 0.76 && waistToHips <= 0.76 && Math.abs(bustHipsDiff) <= 6) {
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
    shapeDescription = "Thân trên tròn đầy, đôi chân thon gọn nổi bật.";
    bestStyles = ["Đầm chữ A cổ chữ V khoét sâu", "Chân váy ngắn khoe chân thon", "Áo blazer chiết eo nhẹ"];
  }

  // Tính size LSOUL chuẩn:
  // Size S: Ngực 80-84, Eo 60-64, Mông 86-90 (Dưới 48kg)
  // Size M: Ngực 84-88, Eo 64-68, Mông 90-94 (48-54kg)
  // Size L: Ngực 88-94, Eo 68-74, Mông 94-100 (55-62kg)
  // Size XL: Ngực 94-100, Eo 74-80, Mông 100-106 (62-70kg)
  let recommendedSize: "S" | "M" | "L" | "XL" = "S";
  if (bust > 93 || waist > 73 || hips > 99) recommendedSize = "XL";
  else if (bust > 87 || waist > 67 || hips > 93) recommendedSize = "L";
  else if (bust > 83 || waist > 63 || hips > 89) recommendedSize = "M";
  else recommendedSize = "S";

  const sizeAdviceNotes: string[] = [
    `Số đo của bạn (${bust} - ${waist} - ${hips}cm) tương thích tối ưu với size ${recommendedSize}.`
  ];

  if (shape === "hourglass") {
    sizeAdviceNotes.push("Vòng eo nhỏ có thể tự tin chọn size ôm sát, các mẫu corset đan dây sẽ tôn trọn thắt eo của bạn.");
  } else if (shape === "pear") {
    sizeAdviceNotes.push("Khi chọn chân váy hoặc quần ôm, ưu tiên size theo vòng 3 để thoải mái khi di chuyển.");
  } else if (shape === "inverted_triangle") {
    sizeAdviceNotes.push("Khi chọn áo corset, ưu tiên size theo vòng 1 đầy đặn, phần eo có thể siết dây đan để ôm khít.");
  }

  return {
    shape,
    shapeLabel,
    shapeDescription,
    bestStyles,
    recommendedSize,
    sizeAdviceNotes
  };
}

/**
 * Đưa ra lời khuyên vừa vặn cho một sản phẩm cụ thể dựa trên số đo của khách.
 */
export function evaluateProductFit(product: Product, measurements: BodyMeasurements): ProductFitAdvice {
  const analysis = analyzeBodyShape(measurements);
  const baseSize = analysis?.recommendedSize ?? "S";

  const { waist = 64, bust = 84, hips = 90 } = measurements;
  const isCorset = product.type === "corset" || /corset|bodysuit/i.test(product.name);
  const isStretchy = product.stretch && product.stretch >= 3;

  if (isCorset) {
    if (bust > 86 && waist <= 65) {
      return {
        recommendedSize: "M",
        fitVerdict: "perfect",
        comfortScore: 95,
        adviceText: `Khuyên chọn size M để vòng 1 (${bust}cm) thoải mái không bị ép ngực. Phần eo có dây đan sau lưng giúp bạn siết chặt về mức ${waist}cm siêu tôn dáng!`
      };
    }
    return {
      recommendedSize: baseSize,
      fitVerdict: "perfect",
      comfortScore: 92,
      adviceText: `Size ${baseSize} vừa khít với vóc dáng của bạn. Gọng định hình và dây đan lưng sẽ ôm sát eo chuẩn form LSOUL.`
    };
  }

  if (product.category === "bottoms") {
    if (hips > 92 && baseSize === "S") {
      return {
        recommendedSize: "M",
        fitVerdict: "size_up",
        comfortScore: 88,
        adviceText: `Vòng 3 của bạn là ${hips}cm nên khuyên chọn size M để phần mông và đùi cử động dễ chịu, không bị kích khi ngồi.`
      };
    }
  }

  return {
    recommendedSize: baseSize,
    fitVerdict: "perfect",
    comfortScore: 90,
    adviceText: `Size ${baseSize} chuẩn theo phom dáng thiết kế LSOUL với thông số số đo của bạn.`
  };
}

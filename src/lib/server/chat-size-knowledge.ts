import type { Product } from "@/lib/products";
import { analyzeBodyShape, type BodyShapeAnalysis, type BodyShapeType } from "@/lib/body-shape";

export type BodyMeasurements = {
  height?: number; // cm
  weight?: number; // kg
  bust?: number;   // cm (vòng 1)
  waist?: number;  // cm (vòng 2)
  hips?: number;   // cm (vòng 3)
};

export type SizeEvaluationStatus =
  | "exact"
  | "estimated"
  | "insufficient_data"
  | "out_of_range"
  | "clarification_needed";

export type SizeEvaluationResult = {
  status: SizeEvaluationStatus;
  recommendedSize?: string;
  confidence: number;
  explanation: string;
  clarificationQuestion?: string;
  adjustabilityNote?: string;
  caveats: string[];
  referenceChart?: string;
  bodyShape?: BodyShapeAnalysis;
};

export { analyzeBodyShape, type BodyShapeAnalysis, type BodyShapeType };

/**
 * Phân tích số đo & chiều cao, cân nặng từ văn bản người dùng (tiếng Việt & số đo chuẩn).
 */
export function extractMeasurementsFromText(text: string): BodyMeasurements {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

  const measurements: BodyMeasurements = {};

  // Chiều cao: 1m80, 1m65, 1m7, 180cm, cao 180, cao 1m80
  const heightMatch = normalized.match(/(?:cao\s*)?(\d{1})m(\d{1,2})(?:\b|cm)?/)
    ?? normalized.match(/(?:cao\s*)(\d{3})(?:\s*cm)?\b/)
    ?? normalized.match(/(\d{3})\s*cm\b/);

  if (heightMatch) {
    if (heightMatch[2] !== undefined) {
      const meters = Number(heightMatch[1]);
      const centimeters = heightMatch[2].length === 1 ? Number(heightMatch[2]) * 10 : Number(heightMatch[2]);
      measurements.height = meters * 100 + centimeters;
    } else {
      measurements.height = Number(heightMatch[1]);
    }
  }

  // Cân nặng: 68kg, 45 ký, 52 kg, nặng 50kg
  const weightMatch = normalized.match(/(\d{2,3}(?:\.\d+)?)\s*(?:kg|ky|kilo|can)\b/)
    ?? normalized.match(/(?:nang|can nang)\s*(\d{2,3}(?:\.\d+)?)\b/);

  if (weightMatch) {
    measurements.weight = Number(weightMatch[1]);
  }

  // Vòng 1 / Ngực: v1 84, nguc 84, vong 1 84cm
  const bustMatch = normalized.match(/(?:vong 1|v1|nguc)\s*(?:la|tam|khoang|:)?\s*(\d{2,3})\b/);
  if (bustMatch) measurements.bust = Number(bustMatch[1]);

  // Vòng 2 / Eo: v2 64, eo 64, vong 2 64cm
  const waistMatch = normalized.match(/(?:vong 2|v2|eo)\s*(?:la|tam|khoang|:)?\s*(\d{2,3})\b/);
  if (waistMatch) measurements.waist = Number(waistMatch[1]);

  // Vòng 3 / Mông: v3 90, mong 90, vong 3 90cm
  const hipsMatch = normalized.match(/(?:vong 3|v3|mong)\s*(?:la|tam|khoang|:)?\s*(\d{2,3})\b/);
  if (hipsMatch) measurements.hips = Number(hipsMatch[1]);

  // Chuỗi số đo 3 vòng dạng: 84-62-90 hoặc 84 62 90
  const threeSizesMatch = normalized.match(/\b(\d{2,3})\s*[-/,\s]\s*(\d{2,3})\s*[-/,\s]\s*(\d{2,3})\b/);
  if (threeSizesMatch && !measurements.bust && !measurements.waist && !measurements.hips) {
    const v1 = Number(threeSizesMatch[1]);
    const v2 = Number(threeSizesMatch[2]);
    const v3 = Number(threeSizesMatch[3]);
    if (v1 >= 65 && v1 <= 120 && v2 >= 50 && v2 <= 110 && v3 >= 70 && v3 <= 130) {
      measurements.bust = v1;
      measurements.waist = v2;
      measurements.hips = v3;
    }
  }

  // Chuỗi số đo 2 vòng dạng ngực - eo (ví dụ: 88-62 hoặc 88/62)
  if (!measurements.bust && !measurements.waist && !threeSizesMatch) {
    const twoSizesMatch = normalized.match(/(?:so do\s*)?\b(\d{2,3})\s*[-/]\s*(\d{2,3})\b/);
    if (twoSizesMatch) {
      const n1 = Number(twoSizesMatch[1]);
      const n2 = Number(twoSizesMatch[2]);
      if (n1 >= 70 && n1 <= 120 && n2 >= 50 && n2 <= 100) {
        measurements.bust = n1;
        measurements.waist = n2;
      }
    }
  }

  return measurements;
}

/**
 * Đánh giá tư vấn size có căn cứ (Grounded Size Advice).
 * TUYỆT ĐỐI KHÔNG:
 * - Khẳng định chắc chắn size khi chỉ có chiều cao + cân nặng mà không biết sản phẩm/dòng đồ.
 * - Khuyên size XL cho người cao gầy (ví dụ 1m80 68kg hay 1m90 45kg) chỉ vì chiều cao.
 * - Bịa đặt bảng số đo chuẩn chung cho toàn bộ thương hiệu mà không nêu rõ theo dòng phom dáng.
 */
export function evaluateSizeAdvice(args: {
  measurements?: BodyMeasurements;
  targetProduct?: Product | null;
  targetCategory?: string | null;
  message?: string;
}): SizeEvaluationResult {
  const { measurements = {}, targetProduct, targetCategory } = args;
  const { height, weight, bust, waist, hips } = measurements;

  // 1. Trường hợp kích thước ngoại lệ (Out-of-standard boundary cases)
  // Ví dụ: 1m90, 45kg (cực kỳ cao và nhẹ cân) hoặc tỉ lệ không thông thường
  if (height && weight) {
    const bmi = weight / Math.pow(height / 100, 2);
    if ((height >= 185 && weight <= 55) || bmi < 15.5) {
      return {
        status: "out_of_range",
        confidence: 0.2,
        explanation: `Với chiều cao ${height}cm và cân nặng ${weight}kg, bạn có vóc dáng rất cao và mảnh mai. Phom đồ thiết kế của LSOUL thường được phát triển theo tỉ lệ nữ chuẩn (chiều cao khoảng 1m55 - 1m70). Nếu chọn theo cân nặng, bạn sẽ vừa độ ôm size S/XS, nhưng chiều dài (đầm, quần, tay áo) có thể bị ngắn. Ngược lại, nếu nâng size L/XL cho đủ chiều dài thì phần ngực và eo sẽ bị rộng đáng kể.`,
        clarificationQuestion: "Bạn đang quan tâm đến thiết kế cụ thể nào? Mình sẽ kiểm tra thông số chiều dài và độ co giãn của mẫu đó để xem có phù hợp không nhé.",
        caveats: [
          "Không tự động nâng size chỉ vì khách cao.",
          "Cần đối chiếu số đo vòng eo/ngực và chiều dài thành phẩm thực tế."
        ]
      };
    }

    if (height >= 178 && weight >= 65 && !bust && !waist && !hips && !targetProduct) {
      // Ví dụ: 1m80, 68kg
      return {
        status: "clarification_needed",
        confidence: 0.35,
        explanation: `Với chiều cao ${height}cm và cân nặng ${weight}kg, mình chưa thể chốt chính xác một size duy nhất vì LSOUL có nhiều dòng thiết kế khác nhau (áo corset ôm siết eo, đầm bodycon co giãn, chân váy ngắn hay quần âu ống suông). Chiều cao và cân nặng chưa phản ánh được tỉ lệ khung xương hay số đo 3 vòng cụ thể.`,
        clarificationQuestion: "Bạn đang muốn chọn áo, quần hay đầm? Mình sẽ đối chiếu size theo mẫu cụ thể nhé.",
        caveats: [
          "Không tự khẳng định size L hay XL chỉ từ chiều cao và cân nặng.",
          "Mỗi mẫu có cấu trúc phom dáng, độ co giãn và độ dài khác nhau."
        ]
      };
    }
  }

  // 2. Có sản phẩm cụ thể (Product Grounded Sizing)
  if (targetProduct) {
    const isCorset = targetProduct.type === "corset" || /corset/i.test(targetProduct.name);
    const isStretchy = (targetProduct.stretch ?? 2) >= 3 || /thun|nhung co gian|knit|len co gian/i.test(targetProduct.material);
    const isRigid = (targetProduct.stretch ?? 2) <= 1 || /tafta|tweed|jean khong gian|da|organza/i.test(targetProduct.material);
    const isBottom = targetProduct.category === "bottoms";
    const isDress = targetProduct.category === "dress";

    // Phân tích nếu có số đo 3 vòng
    if (bust || waist || hips) {
      let sizeCandidate: "S" | "M" | "L" | "XL" = "S";
      let adjustability = "";
      const reasons: string[] = [];

      if (isCorset) {
        // Corset chú trọng vòng 1 và vòng 2. Dây đan lưng co giãn/siết eo +/- 3-4cm.
        adjustability = "Mẫu corset này có dây đan linh hoạt phía sau lưng, có thể nới hoặc siết vòng eo khoảng 3-4cm.";
        if (bust) {
          if (bust > 92) sizeCandidate = "XL";
          else if (bust > 87) sizeCandidate = "L";
          else if (bust > 83) sizeCandidate = "M";
          else sizeCandidate = "S";
          reasons.push(`Vòng 1 (${bust}cm) là thông số quan trọng nhất cho mẫu corset này để tránh bị ép cúp ngực.`);
        } else if (waist) {
          if (waist > 73) sizeCandidate = "XL";
          else if (waist > 67) sizeCandidate = "L";
          else if (waist > 63) sizeCandidate = "M";
          else sizeCandidate = "S";
          reasons.push(`Vòng eo (${waist}cm) được căn chỉnh trực tiếp với bảng thông số.`);
        }

        if (waist && bust && waist <= 64 && bust >= 86) {
          // Eo nhỏ nhưng ngực đầy
          sizeCandidate = "M";
          reasons.push(`Khuyên chọn size M để vòng 1 (${bust}cm) thoải mái không bị ép ngực. Phần eo (${waist}cm) có dây đan phía sau giúp bạn siết chặt tôn eo.`);
        }
      } else if (isBottom) {
        // Quần/váy chú trọng vòng 2 và vòng 3
        if (hips && hips > 95) sizeCandidate = "XL";
        else if ((hips && hips > 91) || (waist && waist > 70)) sizeCandidate = "L";
        else if ((hips && hips > 87) || (waist && waist > 65)) sizeCandidate = "M";
        else sizeCandidate = "S";

        if (isRigid) reasons.push("Chất liệu không co giãn nên cần ưu tiên vừa vặn với số đo lớn nhất (eo hoặc mông).");
        else if (isStretchy) reasons.push("Chất liệu có độ co giãn tốt giúp ôm sát cơ thể thoải mái.");
      } else {
        // Đầm hoặc áo thông thường
        if ((bust && bust > 92) || (waist && waist > 74)) sizeCandidate = "XL";
        else if ((bust && bust > 87) || (waist && waist > 68)) sizeCandidate = "L";
        else if ((bust && bust > 83) || (waist && waist > 64)) sizeCandidate = "M";
        else sizeCandidate = "S";

        if (isRigid) reasons.push("Thiết kế chất liệu phom đứng, không co giãn, nên chọn đúng size theo số đo lớn nhất.");
        if (isStretchy) reasons.push("Chất liệu co giãn tốt, tôn dáng ôm sát.");
      }

      // Kiểm tra biến thể tồn kho thực tế
      const inStockVariants = (targetProduct.variants ?? [])
        .filter((v) => v.stock > 0)
        .map((v) => v.size.toUpperCase());
      const isSizeInStock = inStockVariants.includes(sizeCandidate);

      const bodyShape = (bust && waist && hips) || (height && weight)
        ? analyzeBodyShape({ height, weight, bust, waist, hips })
        : null;

      const wantsShapeInfo = /dang|body shape|ton dang/i.test(args.message || "");
      const shapeNote = bodyShape && (wantsShapeInfo || (bust && waist && hips))
        ? `\n\n✨ Nhận định vóc dáng: ${bodyShape.shapeLabel}. ${bodyShape.shapeDescription} Phong cách tôn dáng gợi ý: ${bodyShape.bestStyles.join(", ")}.`
        : "";

      return {
        status: "exact",
        recommendedSize: sizeCandidate,
        confidence: 0.9,
        explanation: `${`Đối với mẫu "${targetProduct.name}" (${targetProduct.color}), dựa trên số đo của bạn, size phù hợp nhất là ${sizeCandidate}. ${reasons.join(" ")} ${!isSizeInStock && inStockVariants.length ? `(Lưu ý: Mẫu này hiện tại size ${sizeCandidate} tạm hết, các size còn hàng: ${inStockVariants.join(", ")})` : ""}`.trim()}${shapeNote}`,
        adjustabilityNote: adjustability || undefined,
        bodyShape: bodyShape || undefined,
        caveats: [
          `Thông số đối chiếu trực tiếp với đặc tính của mẫu ${targetProduct.name}.`
        ]
      };
    }

    // Nếu chỉ có chiều cao cân nặng cho sản phẩm cụ thể
    if (weight) {
      let estimated: "S" | "M" | "L" | "XL" = "S";
      if (weight > 62) estimated = "XL";
      else if (weight > 54) estimated = "L";
      else if (weight > 47) estimated = "M";

      return {
        status: "estimated",
        recommendedSize: estimated,
        confidence: 0.65,
        explanation: `Dựa trên cân nặng khoảng ${weight}kg, mẫu "${targetProduct.name}" ước tính phù hợp với size ${estimated}. Tuy nhiên, vì mỗi người có tỉ lệ khung xương và số đo 3 vòng khác nhau${isCorset ? " (đặc biệt mẫu corset này ôm siết ngực và eo)" : ""}, nếu bạn có số đo vòng ngực hoặc eo, hãy chia sẻ để mình đối chiếu chính xác nhất nhé.`,
        clarificationQuestion: isCorset
          ? "Bạn có thể cho mình biết thêm số đo vòng ngực và eo để kiểm tra cúp ngực có vừa vặn không nhé?"
          : isBottom
          ? "Bạn cho mình xin số đo vòng eo (ngang rốn) và mông để chọn size chuẩn nhất nha."
          : "Bạn có số đo vòng 1 hoặc vòng 2 cụ thể để mình đối chiếu không?",
        caveats: [
          "Ước tính sơ bộ qua cân nặng, chưa phải số đo thành phẩm chắc chắn."
        ]
      };
    }
  }

  // 3. Khách cung cấp số đo 3 vòng đầy đủ (Full 3-ring inquiry / Body Shape consultation)
  if (bust && waist && hips) {
    const bodyShape = analyzeBodyShape({ height, weight, bust, waist, hips });
    const recommended = bodyShape?.recommendedSize ?? "S";
    return {
      status: "exact",
      recommendedSize: recommended,
      confidence: 0.85,
      explanation: `Dựa trên số đo 3 vòng của bạn (${bust} - ${waist} - ${hips}cm), size chuẩn tối ưu của bạn tại LSOUL là **size ${recommended}**. ${bodyShape ? `\n\n✨ Nhận định vóc dáng LSOUL: **${bodyShape.shapeLabel}**. ${bodyShape.shapeDescription} Phong cách tôn dáng lý tưởng nhất: ${bodyShape.bestStyles.join(", ")}.` : ""}`,
      clarificationQuestion: "Bạn đang muốn tìm mẫu áo corset, chân váy hay đầm liền để mình gợi ý các thiết kế tôn dáng nhất nhé?",
      bodyShape: bodyShape || undefined,
      caveats: [
        `Đối chiếu với bảng thông số nhân trắc học LSOUL. Mỗi sản phẩm cụ thể (độ co giãn, dáng phom) có thể chênh lệch nhẹ.`
      ]
    };
  }

  // 4. Khách chỉ cung cấp chiều cao và cân nặng chung chung (General height/weight inquiry)
  if (height && weight) {
    return {
      status: "clarification_needed",
      confidence: 0.4,
      explanation: `Với chiều cao ${height}cm và cân nặng ${weight}kg, vóc dáng của bạn có thể vừa size M hoặc L tùy vào phom dáng cụ thể của từng thiết kế (áo corset siết eo, đầm bodycon hay quần tây). LSOUL không áp dụng một bảng size cứng cho mọi thiết kế vì mỗi chất liệu (nhung thun co giãn vs tafta đứng phom) có độ ôm khác nhau.`,
      clarificationQuestion: "Bạn đang muốn chọn áo, quần hay đầm? Mình sẽ đối chiếu size theo mẫu cụ thể nhé.",
      caveats: [
        "Không suy diễn một size chuẩn tuyệt đối khi chưa có thông tin món đồ.",
        "Mời khách chọn dòng sản phẩm hoặc cung cấp số đo 3 vòng."
      ]
    };
  }

  // 5. Khách hỏi tư vấn theo tên dáng người (Named Body Shape consultation)
  const normalizedMsg = (args.message || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
  if (normalizedMsg.includes("dong ho cat") || normalizedMsg.includes("hourglass")) {
    const bodyShape: BodyShapeAnalysis = {
      shape: "hourglass",
      shapeLabel: "Dáng Đồng Hồ Cát (Hourglass)",
      shapeDescription: "Vòng 1 và vòng 3 nở nang cân xứng, vòng eo thon gọn quyến rũ. Đây là vóc dáng lý tưởng nhất cho các thiết kế LSOUL!",
      bestStyles: ["Corset siết eo lưng đan", "Đầm bodycon ôm sát", "Quần ống loe cạp cao"],
      recommendedSize: "S",
      sizeAdviceNotes: ["Vòng eo thon nhỏ giúp bạn tự tin diện form ôm; các mẫu corset đan dây sẽ tôn trọn thắt eo."],
      confidenceScore: 95
    };
    return {
      status: "exact",
      recommendedSize: "S",
      confidence: 0.9,
      explanation: `✨ **Tư vấn dáng người: ${bodyShape.shapeLabel}**\n${bodyShape.shapeDescription}\n\nPhong cách tôn dáng lý tưởng nhất: ${bodyShape.bestStyles.join(", ")}. Các thiết kế corset siết eo và đầm bodycon LSOUL sẽ khoe trọn đường cong quyến rũ của bạn!`,
      clarificationQuestion: "Bạn muốn tìm áo corset, đầm tiệc hay cả set phối sẵn để mình gợi ý nhé?",
      bodyShape,
      caveats: ["Tư vấn theo phom dáng đồng hồ cát chuẩn LSOUL."]
    };
  }
  if (normalizedMsg.includes("qua le") || normalizedMsg.includes("pear")) {
    const bodyShape: BodyShapeAnalysis = {
      shape: "pear",
      shapeLabel: "Dáng Quả Lê (Pear Shape)",
      shapeDescription: "Vòng hông và đùi nở nang hơn phần thân trên, vòng eo gọn gàng duyên dáng.",
      bestStyles: ["Áo cúp ngực / Baby tee tạo điểm nhấn thân trên", "Chân váy chữ A xòe nhẹ", "Quần ống suông cạp cao"],
      recommendedSize: "S",
      sizeAdviceNotes: ["Tập trung điểm nhấn vào phần thân trên (áo corset cúp ngực, bèo nhún) kết hợp chân váy chữ A hoặc quần suông để cân đối hông đùi."],
      confidenceScore: 95
    };
    return {
      status: "exact",
      recommendedSize: "S",
      confidence: 0.9,
      explanation: `✨ **Tư vấn dáng người: ${bodyShape.shapeLabel}**\n${bodyShape.shapeDescription}\n\nPhong cách tôn dáng lý tưởng nhất: ${bodyShape.bestStyles.join(", ")}. Nguyên tắc là tạo điểm nhấn cho phần thân trên (áo cúp ngực, corset) và phối chân váy chữ A xòe nhẹ hoặc quần suông cạp cao để vóc dáng cân đối, thanh thoát.`,
      clarificationQuestion: "Bạn có muốn xem gợi ý áo corset phối cùng chân váy chữ A tôn dáng quả lê không nè?",
      bodyShape,
      caveats: ["Tư vấn theo phom dáng quả lê chuẩn LSOUL."]
    };
  }
  if (normalizedMsg.includes("tam giac nguoc") || normalizedMsg.includes("inverted triangle")) {
    const bodyShape: BodyShapeAnalysis = {
      shape: "inverted_triangle",
      shapeLabel: "Dáng Tam Giác Ngược",
      shapeDescription: "Vòng 1 đầy đặn hoặc bờ vai thon dài, hông nhỏ gọn thanh thoát.",
      bestStyles: ["Áo corset cổ tim / sweetheart", "Chân váy xếp ly bồng xòe", "Quần cargo / quần ống rộng"],
      recommendedSize: "S",
      sizeAdviceNotes: ["Chọn áo cổ tim sâu hoặc corset thanh mảnh, kết hợp chân váy xòe bồng hoặc quần ống rộng để tạo độ phồng cho hông."],
      confidenceScore: 95
    };
    return {
      status: "exact",
      recommendedSize: "S",
      confidence: 0.9,
      explanation: `✨ **Tư vấn dáng người: ${bodyShape.shapeLabel}**\n${bodyShape.shapeDescription}\n\nPhong cách tôn dáng lý tưởng nhất: ${bodyShape.bestStyles.join(", ")}. Bạn nên chọn áo corset cổ tim thanh mảnh và kết hợp chân váy xòe hoặc quần ống rộng để tạo cảm giác hông đầy đặn hơn, giúp tổng thể cân đối hài hòa.`,
      clarificationQuestion: "Bạn có muốn mình phối thử set áo corset cổ tim và chân váy xòe bồng cho bạn không?",
      bodyShape,
      caveats: ["Tư vấn theo phom dáng tam giác ngược chuẩn LSOUL."]
    };
  }
  if (normalizedMsg.includes("qua tao") || normalizedMsg.includes("apple")) {
    const bodyShape: BodyShapeAnalysis = {
      shape: "apple",
      shapeLabel: "Dáng Quả Táo (Apple Shape)",
      shapeDescription: "Thân trên tròn đầy, vòng 1 nổi bật và đôi chân thon thả quyến rũ.",
      bestStyles: ["Đầm chữ A cổ chữ V khoét sâu", "Chân váy ngắn khoe chân thon", "Áo blazer chiết eo nhẹ"],
      recommendedSize: "M",
      sizeAdviceNotes: ["Tôn vinh vòng 1 và đôi chân đẹp, chọn phom đầm chữ A suông nhẹ hoặc blazer chiết eo."],
      confidenceScore: 95
    };
    return {
      status: "exact",
      recommendedSize: "M",
      confidence: 0.9,
      explanation: `✨ **Tư vấn dáng người: ${bodyShape.shapeLabel}**\n${bodyShape.shapeDescription}\n\nPhong cách tôn dáng lý tưởng nhất: ${bodyShape.bestStyles.join(", ")}. Ưu tiên khoe trọn đôi chân thon với chân váy ngắn hoặc đầm chữ A cổ chữ V quyến rũ, kết hợp áo khoác blazer chiết eo nhẹ nhàng.`,
      clarificationQuestion: "Bạn muốn xem các mẫu đầm chữ A hoặc set chân váy ngắn tôn chân thon không nè?",
      bodyShape,
      caveats: ["Tư vấn theo phom dáng quả táo chuẩn LSOUL."]
    };
  }
  if (normalizedMsg.includes("thuoc ke") || normalizedMsg.includes("chu nhat") || normalizedMsg.includes("rectangle")) {
    const bodyShape: BodyShapeAnalysis = {
      shape: "rectangle",
      shapeLabel: "Dáng Thước Kẻ / Cân Đối",
      shapeDescription: "Số đo 3 vòng thanh thoát, cơ thể cân đối và dễ dàng diện đa dạng phong cách.",
      bestStyles: ["Corset gọng định hình eo", "Chân váy xòe xếp ly", "Đầm bodycon cut-out"],
      recommendedSize: "S",
      sizeAdviceNotes: ["Tạo đường cong giả bằng corset thắt eo đan dây và chân váy xòe bồng."],
      confidenceScore: 95
    };
    return {
      status: "exact",
      recommendedSize: "S",
      confidence: 0.9,
      explanation: `✨ **Tư vấn dáng người: ${bodyShape.shapeLabel}**\n${bodyShape.shapeDescription}\n\nPhong cách tôn dáng lý tưởng nhất: ${bodyShape.bestStyles.join(", ")}. Các mẫu corset gọng định hình siết eo kết hợp chân váy xếp ly bồng sẽ kiến tạo đường cong chữ S quyến rũ ngay tức thì!`,
      clarificationQuestion: "Bạn muốn mình gợi ý mẫu corset gọng siết eo kết hợp chân váy xếp ly xòe nhé?",
      bodyShape,
      caveats: ["Tư vấn theo phom dáng thước kẻ chuẩn LSOUL."]
    };
  }

  // 6. Khách chỉ hỏi tư vấn size mà không cung cấp thông số nào
  return {
    status: "insufficient_data",
    confidence: 0.1,
    explanation: "Để tư vấn size vừa vặn nhất, mình cần biết số đo của bạn (chiều cao, cân nặng, hoặc tốt nhất là số đo 3 vòng ngực - eo - mông) và thiết kế bạn đang muốn chọn.",
    clarificationQuestion: "Bạn cho mình xin chiều cao, cân nặng hoặc số đo 3 vòng và mẫu đồ bạn đang nhắm tới nhé?",
    caveats: [
      "Thiếu toàn bộ dữ liệu nhân trắc học."
    ]
  };
}

/**
 * Trả về thông tin tham khảo bảng size có nguồn xác minh (Verified Category Guidelines).
 * Không bịa đặt số đo chung không có nguồn.
 */
export function getVerifiedSizeGuide(categoryOrType?: string): {
  title: string;
  category: string;
  rows: Array<{ size: string; specs: string; notes?: string }>;
  generalDisclaimer: string;
} {
  const normalized = (categoryOrType || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized.includes("corset") || normalized.includes("ao") || normalized.includes("top")) {
    return {
      title: "Thông số tham khảo dòng Áo & Corset LSOUL",
      category: "tops_corset",
      rows: [
        { size: "S", specs: "Ngực 80 - 84cm | Eo 60 - 64cm", notes: "Phù hợp vóc dáng nhỏ gọn, dưới 48kg" },
        { size: "M", specs: "Ngực 84 - 88cm | Eo 64 - 68cm", notes: "Phù hợp vóc dáng cân đối, khoảng 48 - 54kg" },
        { size: "L", specs: "Ngực 88 - 92cm | Eo 68 - 72cm", notes: "Phù hợp vóc dáng khoảng 55 - 62kg" }
      ],
      generalDisclaimer: "Đặc biệt: Các mẫu Corset LSOUL có phần dây đan sau lưng (lace-up back) cho phép linh hoạt nới hoặc siết eo khoảng 3-4cm. Nếu vòng 1 đầy đặn hoặc nằm giữa 2 size, nên ưu tiên chọn theo vòng 1 để thoải mái."
    };
  }

  if (
    normalized.includes("quan") ||
    normalized.includes("chan vay") ||
    normalized.includes("vay") ||
    normalized.includes("bottom") ||
    normalized.includes("skirt") ||
    normalized.includes("pant") ||
    normalized.includes("trouser")
  ) {
    return {
      title: "Thông số tham khảo dòng Chân váy & Quần LSOUL",
      category: "bottoms",
      rows: [
        { size: "S", specs: "Eo 60 - 64cm | Mông 86 - 90cm", notes: "Dành cho dáng người thanh mảnh" },
        { size: "M", specs: "Eo 64 - 68cm | Mông 90 - 94cm", notes: "Dành cho dáng người cân đối" },
        { size: "L", specs: "Eo 68 - 72cm | Mông 94 - 98cm", notes: "Dành cho dáng người đầy đặn hơn" }
      ],
      generalDisclaimer: "Lưu ý: Đối với quần âu cạp cao, số đo eo tính tại điểm thắt nhỏ nhất trên rốn; đối với chân váy hoặc quần cạp trễ, số đo eo sẽ tính hạ xuống dưới rốn 2-3cm."
    };
  }

  return {
    title: "Hướng dẫn chọn size phom dáng thiết kế LSOUL",
    category: "general",
    rows: [
      { size: "S", specs: "Ngực 80 - 84cm | Eo 60 - 64cm | Mông 86 - 90cm", notes: "Thanh mảnh, dưới 48kg" },
      { size: "M", specs: "Ngực 84 - 88cm | Eo 64 - 68cm | Mông 90 - 94cm", notes: "Cân đối, khoảng 48 - 54kg" },
      { size: "L", specs: "Ngực 88 - 92cm | Eo 68 - 72cm | Mông 94 - 98cm", notes: "Khoảng 55 - 62kg" }
    ],
    generalDisclaimer: "LSOUL là thương hiệu thời trang thiết kế với đa dạng phom dáng (từ corset siết eo gọng định hình đến đầm ôm bodycon hay blazer suông). Vì vậy, mỗi dòng sản phẩm có thông số thành phẩm riêng. Để chọn size chuẩn nhất, bạn nên đối chiếu theo số đo 3 vòng của từng thiết kế cụ thể."
  };
}

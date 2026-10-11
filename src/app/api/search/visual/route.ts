import { NextResponse } from "next/server";
import {
  resolveImageBytes,
  analyzeImageWithGemini,
  heuristicVisualAnalysis,
  matchProductsFromVisualAnalysis,
  type VisualSearchResponse
} from "@/lib/server/visual-search";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const image = body?.image;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Vui lòng cung cấp dữ liệu hình ảnh (URL hoặc Base64)." },
        { status: 400 }
      );
    }

    // 1. Phân giải hình ảnh thành byte base64
    const resolved = await resolveImageBytes(image);
    if (!resolved) {
      return NextResponse.json(
        { error: "Không thể đọc dữ liệu hình ảnh. Vui lòng thử hình ảnh khác." },
        { status: 400 }
      );
    }

    // 2. Phân tích thị giác bằng Gemini Vision
    let analysis = await analyzeImageWithGemini(resolved);
    let source: "gemini-vision" | "smart-heuristic" = "gemini-vision";

    // 3. Fallback heuristic nếu không cấu hình Gemini hoặc API timeout
    if (!analysis) {
      analysis = heuristicVisualAnalysis(image);
      source = "smart-heuristic";
    }

    // 4. Tìm kiếm và chấm điểm sản phẩm tương đồng trong catalog
    const results = await matchProductsFromVisualAnalysis(analysis);

    const responseData: VisualSearchResponse = {
      success: true,
      analysis,
      results,
      source
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[Visual Search Error]", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi trong quá trình phân tích hình ảnh." },
      { status: 500 }
    );
  }
}

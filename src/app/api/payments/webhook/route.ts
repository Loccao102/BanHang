import { NextResponse } from "next/server";
import { POST as handleSepay } from "../sepay/webhook/route";
import { POST as handlePayos } from "../payos/webhook/route";

export const runtime = "nodejs";

/**
 * Smart Unified Webhook Endpoint:
 * Tự động nhận diện webhook đến từ SePay hay PayOS để điều hướng xử lý thích hợp.
 */
export async function POST(request: Request) {
  const clonedRequest = request.clone();
  const rawBody = await clonedRequest.text().catch(() => "");
  const sepaySignature = request.headers.get("x-sepay-signature");

  // 1. Nhận diện SePay (dựa vào header hoặc format body)
  if (sepaySignature || rawBody.includes("transferAmount") || rawBody.includes("accumulated")) {
    return handleSepay(request);
  }

  // 2. Nhận diện PayOS (dựa vào cấu trúc data + signature)
  try {
    const json = JSON.parse(rawBody);
    if (json?.data && json?.signature) {
      return handlePayos(request);
    }
  } catch {
    // Không phải JSON
  }

  // 3. Fallback: Kiểm tra gateway đang được ưu tiên cấu hình
  const preferred = (process.env.PAYMENT_GATEWAY_PROVIDER ?? "").trim().toLowerCase();
  if (preferred === "payos") {
    return handlePayos(request);
  }

  return handleSepay(request);
}

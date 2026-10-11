import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { recordAndMatchIncomingPayment } from "@/lib/server/payment-processor";
import {
  verifyPayosSignature,
  extractPayosOrderCode,
  type PayosWebhookPayload
} from "@/lib/server/payos";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ success: false, message: "Database unavailable" }, { status: 503 });
  }

  const checksumKey = (process.env.PAYOS_CHECKSUM_KEY ?? "").trim();
  if (!checksumKey) {
    return NextResponse.json(
      { success: false, message: "PAYOS_CHECKSUM_KEY is not configured" },
      { status: 503 }
    );
  }

  let rawBody: string;
  let payload: PayosWebhookPayload;
  try {
    rawBody = await request.text();
    payload = JSON.parse(rawBody) as PayosWebhookPayload;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const { data, signature } = payload;
  if (!data || !signature) {
    return NextResponse.json(
      { success: false, message: "Missing data or signature in PayOS payload" },
      { status: 400 }
    );
  }

  // 1. Xác thực chữ ký HMAC-SHA256 theo chuẩn PayOS
  const isValidSignature = verifyPayosSignature(data, signature, checksumKey);
  if (!isValidSignature) {
    return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 401 });
  }

  // 2. Xử lý webhook test từ PayOS Dashboard (khi bấm Test Webhook để liên kết URL)
  const isTestWebhook =
    /webhook.*confirm|test/i.test(String(data.description ?? "")) ||
    String(data.orderCode) === "123" ||
    payload.desc === "Webhook confirm";

  const orderCode = extractPayosOrderCode(data);
  const amount = Math.round(Number(data.amount ?? 0));
  const providerTransactionId = String(
    data.reference || data.paymentLinkId || data.orderCode || Date.now()
  ).trim();

  // Nếu là ping test hoặc không có mã đơn hợp lệ nhưng signature đã chuẩn
  if (isTestWebhook && !orderCode) {
    return NextResponse.json({
      success: true,
      message: "PayOS test webhook verified successfully"
    });
  }

  if (!providerTransactionId || amount <= 0 || payload.code !== "00") {
    return NextResponse.json({ success: true, message: "Ignored non-payment transaction" });
  }

  // 3. Ghi nhận và đối soát thanh toán đơn hàng
  try {
    const result = await recordAndMatchIncomingPayment(db, {
      provider: "payos",
      providerTransactionId,
      orderCode,
      amount,
      transferType: "in",
      content: String(data.description ?? ""),
      referenceCode: data.reference ? String(data.reference) : null,
      gateway: "PAYOS",
      accountNumber: data.accountNumber ? String(data.accountNumber) : null,
      rawPayload: payload
    });

    return NextResponse.json({
      success: true,
      matched: result.matched,
      orderId: result.orderId,
      message: "PayOS webhook processed successfully"
    });
  } catch (error) {
    console.error("PayOS webhook error", error);
    return NextResponse.json({ success: false, message: "Internal error" }, { status: 500 });
  }
}

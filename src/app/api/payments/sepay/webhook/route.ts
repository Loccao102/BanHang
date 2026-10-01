import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

type SepayPayload = {
  id?: number | string;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string;
  code?: string | null;
  content?: string;
  transferType?: string;
  description?: string;
  transferAmount?: number;
  accumulated?: number;
  referenceCode?: string;
};

function verifySignature(rawBody: string, signature: string, timestamp: string, secret: string) {
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) return false;
  if (Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false;

  const expected = "sha256=" + createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function extractOrderCode(payload: SepayPayload) {
  const direct = payload.code?.trim().toUpperCase();
  if (direct?.startsWith("LS")) return direct;

  const haystack = `${payload.content ?? ""} ${payload.description ?? ""}`.toUpperCase();
  const match = haystack.match(/LS\d{6}[A-F0-9]{6}/);
  return match?.[0] ?? null;
}

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ success: false, message: "Database unavailable" }, { status: 503 });

  const secret = process.env.SEPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ success: false, message: "Webhook secret not configured" }, { status: 503 });

  const rawBody = await request.text();
  const signature = request.headers.get("x-sepay-signature") ?? "";
  const timestamp = request.headers.get("x-sepay-timestamp") ?? "";

  if (!verifySignature(rawBody, signature, timestamp, secret)) {
    return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 401 });
  }

  let payload: SepayPayload;
  try {
    payload = JSON.parse(rawBody) as SepayPayload;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  const providerTransactionId = String(payload.id ?? "").trim();
  const amount = Math.round(Number(payload.transferAmount ?? 0));
  const transferType = String(payload.transferType ?? "").toLowerCase();
  const content = String(payload.content ?? "");
  const orderCode = extractOrderCode(payload);

  if (!providerTransactionId || amount <= 0 || transferType !== "in") {
    return NextResponse.json({ success: true });
  }

  try {
    await db.$transaction(async (tx) => {
      const existing = await tx.paymentTransaction.findUnique({
        where: {
          provider_providerTransactionId: {
            provider: "sepay",
            providerTransactionId
          }
        }
      });
      if (existing) return;

      const order = orderCode
        ? await tx.order.findUnique({ where: { id: orderCode } })
        : null;

      const failureReason = !order
        ? "ORDER_NOT_FOUND"
        : order.payment !== "qr"
          ? "ORDER_NOT_QR"
          : order.paymentStatus === "paid"
            ? "ALREADY_PAID"
            : order.status === "cancelled"
              ? "ORDER_CANCELLED"
              : order.total !== amount
                ? "AMOUNT_MISMATCH"
                : null;

      const matched = failureReason === null;

      await tx.paymentTransaction.create({
        data: {
          provider: "sepay",
          providerTransactionId,
          orderId: order?.id ?? null,
          referenceCode: payload.referenceCode || null,
          amount,
          transferType,
          content,
          gateway: payload.gateway || null,
          accountNumber: payload.accountNumber || null,
          matched,
          failureReason,
          rawPayload: payload
        }
      });

      if (matched && order) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "paid",
            paymentProvider: "sepay",
            paidAt: new Date(),
            status: order.status === "processing" ? "confirmed" : order.status
          }
        });
      }
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SePay webhook error", error);
    return NextResponse.json({ success: false, message: "Internal error" }, { status: 500 });
  }
}

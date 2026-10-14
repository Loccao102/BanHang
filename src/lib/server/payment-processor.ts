import type { Prisma, PrismaClient } from "@prisma/client";

export type IncomingPaymentData = {
  provider: "sepay" | "payos";
  providerTransactionId: string;
  orderCode: string | null;
  amount: number;
  transferType: string;
  content: string;
  referenceCode?: string | null;
  gateway?: string | null;
  accountNumber?: string | null;
  rawPayload: any;
};

export type ProcessPaymentResult = {
  alreadyProcessed: boolean;
  matched: boolean;
  orderId: string | null;
  failureReason: string | null;
};

/**
 * Xử lý giao dịch thanh toán chuyển khoản QR (áp dụng chung cho cả SePay và PayOS).
 * Đảm bảo:
 * 1. Chống lặp giao dịch (Idempotency) dựa trên (provider, providerTransactionId).
 * 2. Đối soát mã đơn hàng và số tiền chính xác (Serializable Transaction).
 * 3. Chuyển trạng thái đơn hàng sang paid và confirmed khi khớp số tiền.
 */
export async function recordAndMatchIncomingPayment(
  db: PrismaClient,
  payment: IncomingPaymentData
): Promise<ProcessPaymentResult> {
  const {
    provider,
    providerTransactionId,
    orderCode,
    amount,
    transferType,
    content,
    referenceCode,
    gateway,
    accountNumber,
    rawPayload
  } = payment;

  return await db.$transaction(
    async (tx) => {
      // 1. Kiểm tra giao dịch đã từng xử lý hay chưa
      const existing = await tx.paymentTransaction.findUnique({
        where: {
          provider_providerTransactionId: {
            provider,
            providerTransactionId
          }
        }
      });

      if (existing) {
        return {
          alreadyProcessed: true,
          matched: existing.matched,
          orderId: existing.orderId,
          failureReason: existing.failureReason
        };
      }

      // 2. Tìm đơn hàng tương ứng
      const order = orderCode
        ? await tx.order.findUnique({ where: { id: orderCode } })
        : null;

      // 3. Đánh giá tính hợp lệ
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

      // 4. Lưu lịch sử giao dịch vào PaymentTransaction
      await tx.paymentTransaction.create({
        data: {
          provider,
          providerTransactionId,
          orderId: order?.id ?? null,
          referenceCode: referenceCode || null,
          amount,
          transferType,
          content,
          gateway: gateway || null,
          accountNumber: accountNumber || null,
          matched,
          failureReason,
          rawPayload
        }
      });

      // 5. Nếu khớp, tự động cập nhật trạng thái đơn hàng
      if (matched && order) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "paid",
            paymentProvider: provider,
            paidAt: new Date(),
            status: order.status === "processing" ? "confirmed" : order.status
          }
        });
      }

      return {
        alreadyProcessed: false,
        matched,
        orderId: order?.id ?? null,
        failureReason
      };
    },
    { isolationLevel: "Serializable" }
  );
}

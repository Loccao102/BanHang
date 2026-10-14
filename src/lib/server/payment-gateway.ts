export type PaymentGatewayProvider = "sepay" | "payos";

export type PaymentGatewayConfig = {
  activeProvider: PaymentGatewayProvider;
  sepayConfigured: boolean;
  payosConfigured: boolean;
  bankId: string;
  bankAccount: string;
  bankAccountName: string;
};

/**
 * Xác định cổng thanh toán tự động được ưu tiên:
 * - Nếu PAYMENT_GATEWAY_PROVIDER được chỉ định cụ thể ('sepay' hoặc 'payos') -> dùng cổng đó.
 * - Nếu là 'auto' (hoặc không cấu hình):
 *   + Nếu có SEPAY_WEBHOOK_SECRET -> ưu tiên SePay.
 *   + Nếu không có SePay nhưng có PAYOS_CHECKSUM_KEY -> dùng PayOS.
 *   + Mặc định fallback về 'sepay' (chế độ demo).
 */
export function getActivePaymentGateway(): PaymentGatewayProvider {
  const envProvider = (process.env.PAYMENT_GATEWAY_PROVIDER ?? "").trim().toLowerCase();

  if (envProvider === "payos") return "payos";
  if (envProvider === "sepay") return "sepay";

  // Auto detection: Nếu có SePay thì ưu tiên SePay, không thì PayOS
  const hasSepay = Boolean((process.env.SEPAY_WEBHOOK_SECRET ?? "").trim());
  const hasPayos = Boolean((process.env.PAYOS_CHECKSUM_KEY ?? "").trim());

  if (hasSepay) return "sepay";
  if (hasPayos) return "payos";

  return "sepay"; // Fallback mặc định
}

export function getPaymentGatewayConfig(): PaymentGatewayConfig {
  const sepaySecret = (process.env.SEPAY_WEBHOOK_SECRET ?? "").trim();
  const payosChecksum = (process.env.PAYOS_CHECKSUM_KEY ?? "").trim();

  return {
    activeProvider: getActivePaymentGateway(),
    sepayConfigured: Boolean(sepaySecret && sepaySecret !== "lsoul_dev_sepay_secret"),
    payosConfigured: Boolean(payosChecksum),
    bankId: process.env.NEXT_PUBLIC_BANK_ID ?? "MB",
    bankAccount: process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "0123456789",
    bankAccountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "LSOUL"
  };
}

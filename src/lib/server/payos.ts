import { createHmac, timingSafeEqual } from "node:crypto";

export type PayosWebhookData = {
  orderCode: number | string;
  amount: number;
  description: string;
  accountNumber?: string;
  reference?: string;
  transactionDateTime?: string;
  currency?: string;
  paymentLinkId?: string;
  code?: string;
  desc?: string;
  counterAccountBankId?: string;
  counterAccountBankName?: string;
  counterAccountName?: string;
  counterAccountNumber?: string;
  virtualAccountName?: string;
  virtualAccountNumber?: string;
  [key: string]: any;
};

export type PayosWebhookPayload = {
  code: string;
  desc: string;
  data: PayosWebhookData;
  signature: string;
};

/**
 * Sinh chữ ký HMAC-SHA256 chuẩn theo đặc tả của PayOS:
 * 1. Sắp xếp các trường trong data theo thứ tự bảng chữ cái alphabet (ASCII sort).
 * 2. Ghép thành chuỗi dạng key1=value1&key2=value2...
 * 3. Băm HMAC-SHA256 với PAYOS_CHECKSUM_KEY.
 */
export function createPayosDataSignature(data: Record<string, any>, checksumKey: string): string {
  const sortedKeys = Object.keys(data).sort();
  const dataString = sortedKeys
    .map((key) => {
      let value = data[key];
      if (value === null || value === undefined) value = "";
      return `${key}=${value}`;
    })
    .join("&");

  return createHmac("sha256", checksumKey).update(dataString).digest("hex");
}

/**
 * Xác thực chữ ký webhook từ PayOS (sử dụng timingSafeEqual chống tấn công thời gian).
 */
export function verifyPayosSignature(
  data: Record<string, any>,
  signature: string,
  checksumKey: string
): boolean {
  if (!signature || !checksumKey) return false;
  try {
    const expected = createPayosDataSignature(data, checksumKey);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Trích xuất mã đơn hàng LSOUL (định dạng LSxxxxxx...) từ payload của PayOS.
 * Hỗ trợ trích xuất từ description, referenceCode, hoặc orderCode.
 */
export function extractPayosOrderCode(data: PayosWebhookData): string | null {
  // 1. Kiểm tra description hoặc reference
  const textHaystack = `${data.description ?? ""} ${data.reference ?? ""}`.toUpperCase();
  const match = textHaystack.match(/LS\d{6}[A-F0-9]{6}/);
  if (match) return match[0];

  // 2. Kiểm tra nếu orderCode là string bắt đầu bằng LS
  if (typeof data.orderCode === "string" && data.orderCode.trim().toUpperCase().startsWith("LS")) {
    return data.orderCode.trim().toUpperCase();
  }

  return null;
}

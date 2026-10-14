import { randomBytes } from "node:crypto";

const PAYMENT_CODE = /^LS[A-Z0-9]{3,10}$/;
const LEGACY_PAYMENT_CODE = /^LS\d{6}[A-F0-9]{6}$/;

/** SePay expects LS plus 3–10 alphanumeric characters. */
export function generateOrderCode() {
  return `LS${randomBytes(5).toString("hex").toUpperCase()}`;
}

export type SepayOrderPayload = {
  code?: string | null;
  content?: string;
  description?: string;
};

export function extractSepayOrderCode(payload: SepayOrderPayload): string | null {
  const direct = payload.code?.trim().toUpperCase();
  if (direct && (PAYMENT_CODE.test(direct) || LEGACY_PAYMENT_CODE.test(direct))) return direct;

  const content = `${payload.content ?? ""} ${payload.description ?? ""}`.toUpperCase();
  // Whole-code match: don't truncate an old 12-character code to 10 characters.
  return content.match(/\bLS[A-Z0-9]{3,10}\b/)?.[0]
    ?? content.match(/\bLS\d{6}[A-F0-9]{6}\b/)?.[0]
    ?? null;
}

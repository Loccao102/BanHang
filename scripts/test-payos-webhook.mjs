/**
 * Gửi webhook PayOS giả lập (đã ký HMAC-SHA256 theo chuẩn PayOS) để kiểm thử thanh toán VietQR.
 *
 * Cách dùng:
 *   node scripts/test-payos-webhook.mjs --order LS261004ABCDEF --amount 2500000
 *   node scripts/test-payos-webhook.mjs --order LS261004ABCDEF --amount 2500000 --base http://localhost:3000
 *   node scripts/test-payos-webhook.mjs --ping           # kiểm thử ping xác thực webhook của PayOS
 *
 * Checksum Key lấy từ PAYOS_CHECKSUM_KEY trong .env (hoặc mặc định lsoul_dev_payos_checksum_key).
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

function loadEnvFile() {
  try {
    const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      const value = rawValue.replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env là tuỳ chọn
  }
}

function arg(name, fallback = undefined) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

loadEnvFile();

const base = arg("base", process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000");
const checksumKey = process.env.PAYOS_CHECKSUM_KEY || "lsoul_dev_payos_checksum_key";

if (process.argv.includes("--ping")) {
  console.log("Đang gửi test ping webhook theo chuẩn PayOS...");
  const data = {
    orderCode: 123,
    amount: 10000,
    description: "Webhook confirm",
    accountNumber: "0123456789",
    reference: "PAYOS_PING",
    transactionDateTime: new Date().toISOString()
  };

  const sortedKeys = Object.keys(data).sort();
  const dataStr = sortedKeys.map((k) => `${k}=${data[k] ?? ""}`).join("&");
  const signature = createHmac("sha256", checksumKey).update(dataStr).digest("hex");

  const pingPayload = {
    code: "00",
    desc: "Webhook confirm",
    data,
    signature
  };

  const res = await fetch(`${base}/api/payments/payos/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pingPayload)
  });

  const json = await res.json().catch(() => null);
  console.log(`Ping status: ${res.status}`, json);
  process.exit(0);
}

const orderId = arg("order");
const amount = Number(arg("amount", "0"));

if (!orderId) {
  console.error("Thiếu --order <mã đơn>. Ví dụ: node scripts/test-payos-webhook.mjs --order LS261004ABCDEF --amount 2500000");
  process.exit(1);
}

const data = {
  accountNumber: arg("account", "0123456789"),
  amount: amount > 0 ? amount : 2500000,
  description: `Thanh toan don ${orderId}`,
  orderCode: Date.now() % 100000000,
  reference: `PAYOS_${Date.now()}`,
  transactionDateTime: new Date().toISOString().replace("T", " ").slice(0, 19)
};

// Chuỗi ký theo thứ tự bảng chữ cái của data
const sortedKeys = Object.keys(data).sort();
const dataString = sortedKeys.map((k) => `${k}=${data[k] ?? ""}`).join("&");
const signature = createHmac("sha256", checksumKey).update(dataString).digest("hex");

const payload = {
  code: "00",
  desc: "success",
  data,
  signature
};

console.log(`Đang gửi PayOS webhook tới: ${base}/api/payments/payos/webhook`);
console.log(`Đơn hàng: ${orderId} | Số tiền: ${data.amount.toLocaleString("vi-VN")} VND`);
console.log(`Payload data:`, data);
console.log(`Signature: ${signature}`);

const response = await fetch(`${base}/api/payments/payos/webhook`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
});

console.log(`POST ${base}/api/payments/payos/webhook -> ${response.status}`);
const result = await response.json().catch(() => null);
console.log("Phản hồi server:", result);

/**
 * Gửi webhook SePay giả lập (đã ký HMAC-SHA256) để kiểm thử Kịch bản 2 – "Cách B".
 *
 * Cách dùng:
 *   node scripts/test-sepay-webhook.mjs --order LS261004ABCDEF --amount 2500000
 *   node scripts/test-sepay-webhook.mjs --order LS261004ABCDEF --amount 2500000 --base http://localhost:3000
 *   node scripts/test-sepay-webhook.mjs --list          # liệt kê đơn QR đang chờ thanh toán
 *
 * Secret lấy từ SEPAY_WEBHOOK_SECRET trong .env (mặc định lsoul_dev_sepay_secret).
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
    // .env là tuỳ chọn; có thể truyền secret qua biến môi trường.
  }
}

function arg(name, fallback = undefined) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

loadEnvFile();

const base = arg("base", process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000");
const secret = process.env.SEPAY_WEBHOOK_SECRET;

if (!secret) {
  console.error("Thiếu SEPAY_WEBHOOK_SECRET (khai báo trong .env hoặc biến môi trường).");
  process.exit(1);
}

if (process.argv.includes("--list")) {
  console.log("Cần đăng nhập admin để lấy danh sách đơn QR đang chờ. Dùng trực tiếp:");
  console.log("  docker exec lsoul-postgres psql -U lsoul -d lsoul -c \"select id,total,\\\"paymentStatus\\\",payment from \\\"Order\\\" where payment='qr' and \\\"paymentStatus\\\"='pending' order by \\\"createdAt\\\" desc;\"");
  process.exit(0);
}

const orderId = arg("order");
const amount = Number(arg("amount", "0"));

if (!orderId) {
  console.error("Thiếu --order <mã đơn>. Ví dụ: node scripts/test-sepay-webhook.mjs --order LS261004ABCDEF --amount 2500000");
  process.exit(1);
}

const payload = {
  id: Number(arg("id", Date.now())),
  gateway: arg("gateway", "MB"),
  transactionDate: new Date().toISOString().slice(0, 19).replace("T", " "),
  accountNumber: arg("account", process.env.NEXT_PUBLIC_BANK_ACCOUNT || "0123456789"),
  code: orderId,
  content: `Thanh toan don ${orderId}`,
  transferType: "in",
  transferAmount: amount,
  referenceCode: arg("reference", `E2E${Date.now()}`)
};

const rawBody = JSON.stringify(payload);
const timestamp = String(Math.floor(Date.now() / 1000));
const signature = "sha256=" + createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");

const response = await fetch(`${base}/api/payments/sepay/webhook`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-sepay-signature": signature,
    "x-sepay-timestamp": timestamp
  },
  body: rawBody
});

const text = await response.text();
console.log(`POST ${base}/api/payments/sepay/webhook -> ${response.status}`);
console.log(text);
console.log("\nKiểm tra trạng thái đơn:");
console.log(`  curl.exe -s ${base}/api/orders/${orderId}/payment`);

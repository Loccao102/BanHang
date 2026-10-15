import dotenv from "dotenv";
dotenv.config();

import { products as catalog } from "../src/lib/products";
import { inferFallbackShoppingIntent, retrieveProductsFromIntent } from "../src/lib/server/chat-intent";
import { buildAgentPlan } from "../src/lib/server/chat-agent";
import { askGemini } from "../src/lib/server/chat-assistant";
import { socialChatReply } from "../src/lib/server/chat-social";
import { fastCatalogLookupReply } from "../src/lib/server/chat-fast-reply";
import { extractMeasurementsFromText, evaluateSizeAdvice } from "../src/lib/server/chat-size-knowledge";
import type { Coupon } from "@prisma/client";

const mockCoupons: Coupon[] = [
  {
    id: "welcome15",
    code: "WELCOME15",
    type: "percentage",
    value: 15,
    minOrder: 0,
    maxDiscount: 500_000,
    usageLimit: 100,
    usedCount: 5,
    active: true,
    startsAt: new Date("2026-01-01"),
    endsAt: new Date("2026-12-31"),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "lsoul10",
    code: "LSOUL10",
    type: "percentage",
    value: 10,
    minOrder: 1_000_000,
    maxDiscount: 250_000,
    usageLimit: 500,
    usedCount: 42,
    active: true,
    startsAt: new Date("2026-01-01"),
    endsAt: new Date("2026-12-31"),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "test99",
    code: "TEST99",
    type: "percentage",
    value: 99,
    minOrder: 0,
    maxDiscount: 999_999,
    usageLimit: 10,
    usedCount: 0,
    active: true,
    startsAt: new Date("2026-01-01"),
    endsAt: new Date("2026-12-31"),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

type Scenario = {
  name: string;
  message: string;
  contextProductNames?: string[];
  assertions: (result: {
    intent: any;
    products: any[];
    plan: any;
    response: string;
    elapsedMs: number;
  }) => boolean | string;
};

const scenarios: Scenario[] = [
  {
    name: "1. Social Greeting (Không gợi ý bừa sản phẩm)",
    message: "Chào shop ơi, shop có đó không?",
    assertions: ({ intent, products, response }) => {
      if (products.length > 0) return `Lỗi: Greeting không được trả sản phẩm, nhưng nhận ${products.length} món.`;
      if (!response || response.length < 5) return "Lỗi: Không nhận được phản hồi chào hỏi.";
      return true;
    }
  },
  {
    name: "2. Tìm kiếm sản phẩm cụ thể (Corset đỏ)",
    message: "Tìm áo corset màu đỏ giúp mình",
    assertions: ({ intent, products, response }) => {
      if (!products.length) return "Lỗi: Không tìm thấy sản phẩm corset đỏ.";
      const hasRedCorset = products.some((p) => p.colorFamily === "red" && (p.type === "corset" || p.name.toLowerCase().includes("corset")));
      if (!hasRedCorset) return "Lỗi: Danh sách không chứa corset đỏ phù hợp.";
      return true;
    }
  },
  {
    name: "3. Phối outfit dự tiệc (Áo đỏ + Chân váy trắng)",
    message: "Phối cho mình một set áo đỏ và chân váy trắng để đi tiệc gala",
    assertions: ({ intent, plan, products }) => {
      if (intent.intent !== "recommend_outfit") return `Lỗi: Intent phải là recommend_outfit, nhận ${intent.intent}`;
      if (products.length < 2) return `Lỗi: Set phải có ít nhất 2 món, nhận ${products.length}`;
      const hasRedTop = products.some((p) => p.colorFamily === "red" && (p.category === "tops" || p.type === "corset"));
      const hasWhiteSkirt = products.some((p) => p.colorFamily === "white" && (p.category === "bottoms" || p.type === "skirt"));
      if (!hasRedTop || !hasWhiteSkirt) return "Lỗi: Không đảm bảo đủ ràng buộc áo đỏ + chân váy trắng.";
      return true;
    }
  },
  {
    name: "4. Tư vấn size corset có căn cứ (Ngực 88 Eo 62)",
    message: "Mẫu áo corset đỏ này số đo 88-62 mặc vừa size gì?",
    contextProductNames: ["Red Gala Corset"],
    assertions: ({ plan }) => {
      const notes = plan.notes.join("\n");
      if (!notes.includes("Grounded Size Guidance")) return "Lỗi: Thiếu Grounded Size Guidance trong plan notes.";
      if (!notes.includes("size M")) return "Lỗi: 88-62 với corset phải khuyên chọn size M để thoải mái vòng 1.";
      if (!notes.includes("dây đan")) return "Lỗi: Phải nhắc tới dây đan lưng siết eo +/- 3-4cm.";
      return true;
    }
  },
  {
    name: "5. Xử lý trường hợp ngoại lệ nhân trắc (1m90 45kg)",
    message: "Mình cao 1m90 nặng 45kg nên mặc size gì?",
    assertions: ({ plan }) => {
      const notes = plan.notes.join("\n");
      if (!notes.includes("rất cao và mảnh mai") && !notes.includes("out_of_range")) {
        return "Lỗi: Không nhận diện đúng trường hợp 1m90 45kg rất cao mảnh mai.";
      }
      return true;
    }
  },
  {
    name: "6. Hỏi mã giảm giá (Loại trừ mã TEST, trả mã hợp lệ)",
    message: "Shop có mã giảm giá nào đang áp dụng được không?",
    assertions: ({ plan }) => {
      const couponActions = plan.actions.filter((a: any) => a.type === "apply_coupon");
      if (!couponActions.length) return "Lỗi: Không tạo action gợi ý áp mã giảm giá.";
      if (couponActions.some((a: any) => a.code === "TEST99")) return "Lỗi: Không được gợi ý mã TEST99.";
      if (!couponActions.some((a: any) => a.code === "WELCOME15")) return "Lỗi: Phải có mã WELCOME15.";
      return true;
    }
  },
  {
    name: "7. Yêu cầu vào phòng thử đồ AI (Try-on)",
    message: "Cho mình thử bộ đồ này vào phòng thử AI",
    assertions: ({ plan }) => {
      const tryOnAction = plan.actions.find((a: any) => a.type === "open_try_on");
      if (!tryOnAction) return "Lỗi: Không tạo action mở phòng thử đồ AI.";
      return true;
    }
  }
];

async function runScenario(scenario: Scenario) {
  const start = Date.now();
  const contextProducts = scenario.contextProductNames
    ? catalog.filter((p) => scenario.contextProductNames!.some((name) => p.name.includes(name)))
    : [];

  const social = socialChatReply(scenario.message);
  if (social) {
    const elapsedMs = Date.now() - start;
    const result = scenario.assertions({
      intent: { intent: "general" },
      products: [],
      plan: { actions: [], notes: [] },
      response: social,
      elapsedMs
    });
    return { name: scenario.name, success: result === true, error: result !== true ? result : null, elapsedMs, response: social };
  }

  const intent = inferFallbackShoppingIntent({
    message: scenario.message,
    contextProducts
  });

  const retrieved = retrieveProductsFromIntent(intent, catalog, 5, contextProducts);

  const plan = buildAgentPlan({
    message: scenario.message,
    found: retrieved,
    contextProducts,
    catalog,
    orders: [],
    coupons: mockCoupons,
    loggedIn: false,
    intent
  });

  const fastReply = fastCatalogLookupReply(scenario.message, intent, retrieved);
  let responseText = fastReply;

  if (!responseText) {
    const aiText = await askGemini({
      message: scenario.message,
      products: retrieved.slice(0, 3),
      history: [],
      agentContext: plan.notes.join("\n")
    });
    responseText = aiText || (plan.notes[0] ?? "Dạ LSOUL Stylist AI luôn sẵn sàng hỗ trợ bạn!");
  }

  const elapsedMs = Date.now() - start;
  const assertionResult = scenario.assertions({
    intent,
    products: retrieved,
    plan,
    response: responseText,
    elapsedMs
  });

  return {
    name: scenario.name,
    success: assertionResult === true,
    error: assertionResult !== true ? assertionResult : null,
    elapsedMs,
    response: responseText.slice(0, 150) + (responseText.length > 150 ? "..." : "")
  };
}

async function main() {
  console.log("===============================================================");
  console.log("       LSOUL AI CHATBOT — AUTOMATED TRAINING & SCENARIO TEST   ");
  console.log("===============================================================\n");

  let passed = 0;
  for (const s of scenarios) {
    process.stdout.write(`Đang kiểm thử: ${s.name} ... `);
    try {
      const res = await runScenario(s);
      if (res.success) {
        passed += 1;
        console.log(`[PASS] (${res.elapsedMs}ms)`);
        console.log(`  └─ Phản hồi: ${res.response.replace(/\n+/g, " ")}\n`);
      } else {
        console.log(`[FAIL] (${res.elapsedMs}ms)`);
        console.log(`  └─ Lỗi: ${res.error}\n`);
      }
    } catch (err: any) {
      console.log(`[ERROR]: ${err?.message}\n`);
    }
  }

  console.log("===============================================================");
  console.log(`Tổng kết: ${passed}/${scenarios.length} scenarios ĐẠT (${((passed / scenarios.length) * 100).toFixed(1)}%)`);
  console.log("===============================================================");

  if (passed < scenarios.length) {
    process.exitCode = 1;
  }
}

main();

import { NextResponse } from "next/server";
import type { ChatAgentAction, ChatMessageView } from "@/lib/chat";
import type { Product } from "@/lib/products";
import { getCurrentUser } from "@/lib/server/auth";
import { buildAgentPlan } from "@/lib/server/chat-agent";
import { askGemini, loadAvailableProducts, retrieveProducts, titleFromMessage } from "@/lib/server/chat-assistant";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

function fallbackReply(message: string, products: Product[], hasOrderContext: boolean, agentNotes: string[]) {
  const text = message.toLowerCase();
  // Try-on inquiry
  if (text.includes("thử") || text.includes("thu do") || text.includes("phòng thử")) {
    return "Dạ LSOUL đã chuẩn bị trang phục trong phòng thử đồ AI cho bạn rồi nè! Bạn có thể tải ảnh toàn thân hoặc chọn ảnh mẫu để ướm thử đồ lên vóc dáng ngay nhé. ✨";
  }

  // Outfit coordination
  if (text.includes("phối") || text.includes("outfit") || text.includes("set") || text.includes("mix")) {
    if (products.length) {
      const names = Array.from(new Set(products.map((p) => p.name))).join(" + ");
      return `Dạ LSOUL đã phối riêng cho bạn set đồ cực kỳ tôn dáng và thời thượng: ${names}. Bạn có thể bấm "Thêm cả set vào giỏ" hoặc bấm "Thử cả set trong phòng thử AI" để xem đồ lên dáng người nhé! ✨`;
    }
  }

  if (agentNotes.length && !agentNotes[0].includes("Outfit được chọn")) return agentNotes[0];
  if (hasOrderContext && (text.includes("đơn") || text.includes("order") || text.includes("vận đơn") || text.includes("giao"))) {
    return "LSOUL đã tra cứu thông tin đơn hàng gần nhất của bạn. Bạn có thể bấm vào thẻ đơn hàng bên dưới để xem chi tiết tình trạng vận chuyển nhé.";
  }

  // Sizing inquiry
  if (text.includes("size") || text.includes("cỡ") || text.includes("eo") || text.includes("ngực") || text.includes("nặng") || text.includes("cao") || text.includes("mặc vừa")) {
    return `Dạ đối với phom dáng thiết kế LSOUL:
• Size S: Ngực 80-84cm, Eo 60-64cm (Dưới 48kg)
• Size M: Ngực 84-88cm, Eo 64-68cm (48 - 54kg)
• Size L: Ngực 88-94cm, Eo 68-74cm (55 - 62kg)
• Size XL: Ngực 94-100cm, Eo 74-80cm (62 - 70kg)

✨ Lưu ý: Các mẫu Corset LSOUL có phần đan dây phía sau lưng giúp linh hoạt tăng giảm độ ôm eo 3-4cm. Nếu bạn có vòng 1 đầy đặn hoặc nằm giữa 2 size, nên chọn tăng 1 size để thoải mái nhất nhé!`;
  }

  // Policies inquiry
  if (text.includes("đổi") || text.includes("trả") || text.includes("ship") || text.includes("freeship") || text.includes("giao hàng") || text.includes("bảo hành")) {
    return `Dạ chính sách mua sắm tại LSOUL:
• Freeship toàn quốc cho đơn hàng từ 699.000đ.
• Đổi size / đổi mẫu trong vòng 7 ngày kể từ khi nhận hàng (yêu cầu còn nguyên tag mác, chưa qua sử dụng).
• Giao hàng hỏa tốc 2-4h nội thành Hà Nội & TP.HCM, giao tiêu chuẩn 2-4 ngày toàn quốc.
• Hỗ trợ thanh toán COD (kiểm tra hàng) và chuyển khoản VietQR tự động.`;
  }

  // Occasions / Styling
  if (text.includes("tiệc") || text.includes("party") || text.includes("prom") || text.includes("quẩy") || text.includes("club")) {
    if (products.length) {
      return `Dạ đi tiệc hoặc sự kiện thì phong cách quyến rũ, tôn dáng của LSOUL là chuẩn nhất! Bạn có thể chọn corset gọng ôm eo phối cùng chân váy xếp ly xòe hoặc diện đầm ôm bodycon gợi cảm. Dưới đây là những mẫu tiệc cực hot dành cho bạn:`;
    }
  }

  if (text.includes("hẹn hò") || text.includes("date")) {
    if (products.length) {
      return `Dạ cho buổi hẹn hò lãng mạn, LSOUL gợi ý bạn những mẫu đầm midi hoặc corset phối chân váy mềm mại, vừa quyến rũ vừa sang trọng. Mời bạn tham khảo các thiết kế bên dưới nhé:`;
    }
  }

  if (products.length) {
    const names = Array.from(new Set(products.slice(0, 3).map((p) => `${p.name} (${p.color})`))).join(", ");
    return `Dạ LSOUL tìm thấy các thiết kế rất hợp gu của bạn (${names}). Bạn có thể bấm vào sản phẩm để xem chi tiết hoặc bấm "Thêm giỏ" để lưu ngay nhé!`;
  }

  return "Dạ mình có thể giúp bạn tìm trang phục theo màu sắc (đen, trắng, đỏ...), kiểu dáng (corset, đầm tiệc, chân váy, blazer) hoặc tư vấn chọn size chuẩn. Bạn muốn tìm đồ diện cho dịp nào nè?";
}

function wantsOrderContext(message: string) {
  const text = message.toLowerCase();
  return ["đơn", "order", "giao hàng", "vận đơn", "tracking", "thanh toán", "đang giao"].some((keyword) => text.includes(keyword));
}

function productIdsFromMessage(message: { productIds: unknown }) {
  return Array.isArray(message.productIds) ? message.productIds.map(String) : [];
}

function productIdsFromGuestHistory(history: ChatMessageView[]) {
  const lastAssistant = [...history].reverse().find((item) => item.role === "assistant" && item.products?.length);
  return lastAssistant?.products?.map((product) => product.id) ?? [];
}

export async function POST(request: Request) {
  const body = await request.json() as {
    message?: string;
    conversationId?: string;
    history?: ChatMessageView[];
  };
  const message = String(body.message ?? "").replace(/\s+/g, " ").trim();

  if (!message) return NextResponse.json({ error: "Vui lòng nhập nội dung." }, { status: 400 });
  if (message.length > 2000) return NextResponse.json({ error: "Tin nhắn quá dài. Vui lòng rút gọn dưới 2.000 ký tự." }, { status: 400 });

  const db = getDb();
  const user = await getCurrentUser();
  const catalog = await loadAvailableProducts(db);
  const catalogMap = new Map(catalog.map((product) => [product.id, product]));

  let conversationId = body.conversationId;
  let history: { role: "user" | "assistant"; text: string }[] = [];
  let createdConversation = false;
  let orderContext = "";
  let contextProductIds: string[] = [];
  let orders: Array<{ id: string; status: "processing" | "confirmed" | "shipping" | "completed" | "cancelled"; createdAt: Date }> = [];
  let coupons: Awaited<ReturnType<NonNullable<typeof db>["coupon"]["findMany"]>> = [];

  if (user && db) {
    if (conversationId) {
      const owned = await db.chatConversation.findFirst({ where: { id: conversationId, userId: user.id } });
      if (!owned) return NextResponse.json({ error: "Cuộc trò chuyện không tồn tại." }, { status: 404 });
    } else {
      const conversation = await db.chatConversation.create({
        data: { userId: user.id, title: titleFromMessage(message) }
      });
      conversationId = conversation.id;
      createdConversation = true;
    }

    const previous = await db.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { role: true, content: true, productIds: true }
    });
    const chronological = previous.reverse();
    history = chronological.flatMap((item) =>
      item.role === "user" || item.role === "assistant"
        ? [{ role: item.role as "user" | "assistant", text: item.content }]
        : []
    );
    const lastAssistant = [...previous].find((item) => item.role === "assistant" && productIdsFromMessage(item).length);
    contextProductIds = lastAssistant ? productIdsFromMessage(lastAssistant) : [];

    await db.chatMessage.create({
      data: {
        conversationId: conversationId!,
        role: "user",
        content: message,
        productIds: [],
        actions: []
      }
    });

    [orders, coupons] = await Promise.all([
      db.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, status: true, createdAt: true }
      }),
      db.coupon.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
        take: 50
      })
    ]);

    if (wantsOrderContext(message)) {
      const orderDetails = await db.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          createdAt: true,
          status: true,
          paymentStatus: true,
          total: true,
          shippingCarrier: true,
          trackingCode: true
        }
      });
      orderContext = orderDetails.length
        ? orderDetails.map((order) => `#${order.id} | ${order.status} | payment=${order.paymentStatus} | total=${order.total} VND | carrier=${order.shippingCarrier ?? "-"} | tracking=${order.trackingCode ?? "-"} | ${order.createdAt.toISOString()}`).join("\n")
        : "Khách chưa có đơn hàng.";
    }
  } else {
    const guestHistory = (body.history ?? []).slice(-10);
    history = guestHistory.flatMap((item) =>
      item.role === "user" || item.role === "assistant"
        ? [{ role: item.role, text: item.text.slice(0, 1500) }]
        : []
    );
    contextProductIds = productIdsFromGuestHistory(guestHistory);

    // Khách chưa đăng nhập vẫn cần được tư vấn mã giảm giá.
    if (db) {
      coupons = await db.coupon.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
        take: 50
      });
    }
  }

  const contextProducts = contextProductIds.flatMap((id) => {
    const product = catalogMap.get(id);
    return product ? [product] : [];
  });

  const affinityRows = user && db ? await db.productAffinity.findMany({
    where: { userId: user.id },
    select: { productId: true, score: true }
  }) : [];
  const affinityScores = new Map(affinityRows.map((item) => [item.productId, item.score]));

  const initiallyFound = retrieveProducts(message, catalog, 5, contextProducts, affinityScores);
  const plan = buildAgentPlan({
    message,
    found: initiallyFound,
    contextProducts,
    catalog,
    orders,
    coupons,
    loggedIn: Boolean(user)
  });

  const productIdsFromActions = plan.actions.flatMap((action) => {
    if (action.type === "add_to_cart" || action.type === "open_product") return [action.productId];
    if (action.type === "add_bundle") return action.items.map((item) => item.productId);
    if (action.type === "open_try_on") return action.productIds;
    return [];
  });

  const responseProducts = Array.from(new Set([...plan.products.map((product) => product.id), ...productIdsFromActions]))
    .flatMap((id) => {
      const product = catalogMap.get(id);
      return product ? [product] : [];
    })
    .slice(0, 6);

  const aiText = await askGemini({
    message,
    products: responseProducts,
    history,
    orderContext,
    agentContext: plan.notes.join("\n")
  });
  const baseReply = aiText ?? fallbackReply(message, responseProducts, Boolean(orderContext), plan.notes);

  // Câu trả lời của model có thể bỏ sót món trong set đã phối, gây lệch với số thẻ sản phẩm
  // hiển thị bên dưới. Bổ sung danh sách chuẩn (tên + tổng tiền) khi thiếu món.
  const bundleAction = plan.actions.find((action) => action.type === "add_bundle");
  const bundleProducts = bundleAction
    ? bundleAction.items.flatMap((item) => {
        const product = catalogMap.get(item.productId);
        return product ? [product] : [];
      })
    : [];
  const bundleMissing = bundleProducts.filter((product) => !baseReply.includes(product.name));
  const bundleTotal = bundleProducts.reduce((sum, product) => sum + product.price, 0);
  const withBundle = bundleProducts.length && bundleMissing.length
    ? `${baseReply}\n\n📌 Set đã phối gồm ${bundleProducts.length} món: ${bundleProducts.map((product) => `${product.name} (${product.color})`).join(" + ")} — tổng ${bundleTotal.toLocaleString("vi-VN")}đ.`
    : baseReply;

  // Khi khách hỏi xin mã giảm giá, đảm bảo câu trả lời luôn nêu rõ mã đang hiệu lực
  // (một số model có thể bỏ qua danh sách mã trong prompt).
  const couponActions = plan.actions.filter((action) => action.type === "apply_coupon");
  const missingCodes = couponActions
    .map((action) => action.code)
    .filter((code) => !withBundle.toUpperCase().includes(code.toUpperCase()));
  const reply = couponActions.length && missingCodes.length
    ? `${withBundle}\n\nMã ưu đãi đang hiệu lực: ${missingCodes.join(", ")}. Bạn bấm nút bên dưới để áp dụng nhé!`
    : withBundle;

  if (user && db && conversationId) {
    await db.$transaction([
      db.chatMessage.create({
        data: {
          conversationId,
          role: "assistant",
          content: reply,
          productIds: responseProducts.map((product) => product.id),
          actions: plan.actions
        }
      }),
      db.chatConversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
          ...(createdConversation ? { title: titleFromMessage(message) } : {})
        }
      })
    ]);
  }

  return NextResponse.json({
    message: reply,
    products: responseProducts,
    actions: plan.actions satisfies ChatAgentAction[],
    conversationId: conversationId ?? null,
    persisted: Boolean(user && db)
  });
}

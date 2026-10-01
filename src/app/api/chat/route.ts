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
  if (agentNotes.length) return agentNotes[0];
  if (hasOrderContext && (text.includes("đơn") || text.includes("order") || text.includes("vận đơn") || text.includes("giao"))) {
    return "Mình đã lấy trạng thái đơn hàng gần nhất của bạn. Bạn có thể mở đúng đơn ngay từ hành động bên dưới.";
  }
  if (products.length) {
    return `Mình tìm được ${products.length} lựa chọn đang còn hàng khá sát yêu cầu. Bạn có thể mở sản phẩm hoặc yêu cầu mình thao tác tiếp.`;
  }
  return "Mình chưa thấy thiết kế khớp hoàn toàn. Bạn cho mình thêm ngân sách, màu hoặc dịp mặc để mình lọc chính xác hơn nhé.";
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
  }

  const contextProducts = contextProductIds.flatMap((id) => {
    const product = catalogMap.get(id);
    return product ? [product] : [];
  });

  const initiallyFound = retrieveProducts(message, catalog, 5, contextProducts);
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
  const reply = aiText ?? fallbackReply(message, responseProducts, Boolean(orderContext), plan.notes);

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

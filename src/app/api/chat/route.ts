import { NextResponse } from "next/server";
import type { ChatMessageView } from "@/lib/chat";
import type { Product } from "@/lib/products";
import { getCurrentUser } from "@/lib/server/auth";
import { askGemini, loadAvailableProducts, retrieveProducts, titleFromMessage } from "@/lib/server/chat-assistant";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

function fallbackReply(message: string, products: Product[], hasOrderContext: boolean) {
  const text = message.toLowerCase();
  if (hasOrderContext && (text.includes("đơn") || text.includes("order") || text.includes("vận đơn") || text.includes("giao"))) {
    return "Mình đã lấy trạng thái đơn hàng gần nhất của bạn ở phần context. Nếu bạn gửi mã đơn cụ thể, mình có thể đối chiếu chính xác hơn.";
  }
  if (products.length) {
    return `Mình tìm được ${products.length} thiết kế đang còn hàng khá sát yêu cầu. Mình ưu tiên những lựa chọn phù hợp về kiểu dáng, màu, dịp mặc và ngân sách của bạn.`;
  }
  return "Mình chưa thấy thiết kế khớp hoàn toàn. Bạn cho mình thêm ngân sách, màu hoặc dịp mặc để mình lọc chính xác hơn nhé.";
}

function wantsOrderContext(message: string) {
  const text = message.toLowerCase();
  return ["đơn", "order", "giao hàng", "vận đơn", "tracking", "thanh toán", "đang giao"].some((keyword) => text.includes(keyword));
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
  const found = retrieveProducts(message, catalog, 5);

  let conversationId = body.conversationId;
  let history: { role: "user" | "assistant"; text: string }[] = [];
  let createdConversation = false;
  let orderContext = "";

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
      select: { role: true, content: true }
    });
    history = previous.reverse().flatMap((item) =>
      item.role === "user" || item.role === "assistant"
        ? [{ role: item.role as "user" | "assistant", text: item.content }]
        : []
    );

    await db.chatMessage.create({
      data: {
        conversationId: conversationId!,
        role: "user",
        content: message,
        productIds: []
      }
    });

    if (wantsOrderContext(message)) {
      const orders = await db.order.findMany({
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
      orderContext = orders.length
        ? orders.map((order) => `#${order.id} | ${order.status} | payment=${order.paymentStatus} | total=${order.total} VND | carrier=${order.shippingCarrier ?? "-"} | tracking=${order.trackingCode ?? "-"} | ${order.createdAt.toISOString()}`).join("\n")
        : "Khách chưa có đơn hàng.";
    }
  } else {
    history = (body.history ?? []).slice(-10).flatMap((item) =>
      item.role === "user" || item.role === "assistant"
        ? [{ role: item.role, text: item.text.slice(0, 1500) }]
        : []
    );
  }

  const aiText = await askGemini({
    message,
    products: found,
    history,
    orderContext
  });
  const reply = aiText ?? fallbackReply(message, found, Boolean(orderContext));

  if (user && db && conversationId) {
    await db.$transaction([
      db.chatMessage.create({
        data: {
          conversationId,
          role: "assistant",
          content: reply,
          productIds: found.map((product) => product.id)
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
    products: found,
    conversationId: conversationId ?? null,
    persisted: Boolean(user && db)
  });
}

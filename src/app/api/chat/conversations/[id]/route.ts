import { NextResponse } from "next/server";
import type { ChatAgentAction } from "@/lib/chat";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fromProductRow } from "@/lib/server/product-db";

export const runtime = "nodejs";

async function ownedConversation(id: string, userId: string) {
  const db = getDb()!;
  return db.chatConversation.findFirst({ where: { id, userId } });
}

function parsedActions(value: unknown): ChatAgentAction[] {
  return Array.isArray(value) ? value as ChatAgentAction[] : [];
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const { id } = await params;
    const conversation = await ownedConversation(id, user.id);
    if (!conversation) return NextResponse.json({ error: "Không tìm thấy cuộc trò chuyện." }, { status: 404 });

    const messages = await db.chatMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" }
    });

    const productIds = Array.from(new Set(messages.flatMap((message) => Array.isArray(message.productIds) ? message.productIds.map(String) : [])));
    const rows = productIds.length
      ? await db.product.findMany({
          where: { id: { in: productIds } },
          include: {
            variants: { where: { active: true } },
            reviews: { where: { approved: true }, select: { rating: true } }
          }
        })
      : [];
    const productMap = new Map(rows.map((row) => [row.id, fromProductRow(row)]));

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString()
      },
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        text: message.content,
        createdAt: message.createdAt.toISOString(),
        actions: parsedActions(message.actions),
        products: (Array.isArray(message.productIds) ? message.productIds.map(String) : []).flatMap((productId) => {
          const product = productMap.get(productId);
          return product ? [product] : [];
        })
      }))
    });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const { id } = await params;
    const conversation = await ownedConversation(id, user.id);
    if (!conversation) return NextResponse.json({ error: "Không tìm thấy cuộc trò chuyện." }, { status: 404 });

    const body = await request.json() as { title?: string };
    const title = String(body.title ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
    if (!title) return NextResponse.json({ error: "Tiêu đề không hợp lệ." }, { status: 400 });

    const updated = await db.chatConversation.update({ where: { id }, data: { title } });
    return NextResponse.json({ conversation: { id: updated.id, title: updated.title, updatedAt: updated.updatedAt.toISOString() } });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const { id } = await params;
    const conversation = await ownedConversation(id, user.id);
    if (!conversation) return NextResponse.json({ error: "Không tìm thấy cuộc trò chuyện." }, { status: 404 });

    await db.chatConversation.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }
}

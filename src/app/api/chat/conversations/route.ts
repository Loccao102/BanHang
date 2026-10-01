import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const conversations = await db.chatConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true } }
      },
      take: 100
    });

    return NextResponse.json({
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messageCount: conversation._count.messages,
        lastMessage: conversation.messages[0]?.content ?? ""
      }))
    });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const conversation = await db.chatConversation.create({
      data: { userId: user.id, title: "Cuộc trò chuyện mới" }
    });
    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messageCount: 0,
        lastMessage: ""
      }
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }
}

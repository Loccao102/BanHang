import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  if (!db) return NextResponse.json({ deleted: false, mode: "browser" });

  const { id } = await params;
  await db.product.deleteMany({ where: { id } });
  return NextResponse.json({ deleted: true });
}

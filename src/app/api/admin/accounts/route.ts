import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
export const runtime = "nodejs";
export async function GET() {
  try {
    await requireAdmin();
    const db = getDb()!;
    const users = await db.user.findMany({select:{id:true,name:true,email:true,phone:true,role:true,createdAt:true,_count:{select:{sessions:true,orders:true}}},orderBy:{createdAt:"desc"}});
    return NextResponse.json({accounts:users.map(u=>({id:u.id,name:u.name,email:u.email,phone:u.phone,role:u.role,createdAt:u.createdAt.toISOString(),sessionCount:u._count.sessions,orderCount:u._count.orders}))});
  } catch { return NextResponse.json({error:"Không có quyền truy cập."},{status:403}); }
}

import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/password";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const db = getDb()!;
    const users = await db.user.findMany({
      select: { id:true, name:true, email:true, phone:true, role:true, createdAt:true, _count:{select:{sessions:true,orders:true}} },
      orderBy: { createdAt:"desc" }
    });
    return NextResponse.json({ accounts: users.map(u=>({ id:u.id,name:u.name,email:u.email,phone:u.phone,role:u.role,createdAt:u.createdAt.toISOString(),sessionCount:u._count.sessions,orderCount:u._count.orders })) });
  } catch {
    return NextResponse.json({error:"Không có quyền truy cập."},{status:403});
  }
}

export async function POST(request:Request) {
  try {
    await requireAdmin();
    const db=getDb()!;
    const body=await request.json() as {name?:string;email?:string;phone?:string;password?:string;role?:string};
    const name=String(body.name??"").trim();
    const email=String(body.email??"").trim().toLowerCase();
    const password=String(body.password??"");
    const role=body.role==="admin"?"admin":"customer";
    if(name.length<2) return NextResponse.json({error:"Họ tên cần ít nhất 2 ký tự."},{status:400});
    if(!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({error:"Email chưa hợp lệ."},{status:400});
    if(password.length<8) return NextResponse.json({error:"Mật khẩu cần ít nhất 8 ký tự."},{status:400});
    if(await db.user.findUnique({where:{email},select:{id:true}})) return NextResponse.json({error:"Email đã được sử dụng."},{status:409});
    const user=await db.user.create({data:{id:randomUUID(),name,email,phone:String(body.phone??"").trim()||null,passwordHash:hashPassword(password),role}});
    return NextResponse.json({created:true,id:user.id},{status:201});
  } catch {
    return NextResponse.json({error:"Không có quyền truy cập hoặc không thể tạo tài khoản."},{status:403});
  }
}

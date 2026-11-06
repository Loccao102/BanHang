import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/password";

export const runtime = "nodejs";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const admin=await requireAdmin();
    const db=getDb()!;
    const {id}=await params;
    const body=await request.json() as {action?:string;name?:string;email?:string;phone?:string;role?:string};
    const target=await db.user.findUnique({where:{id},select:{id:true,email:true,role:true}});
    if(!target) return NextResponse.json({error:"Không tìm thấy tài khoản."},{status:404});

    if(body.action==="edit") {
      const name=String(body.name??"").trim();
      const email=String(body.email??"").trim().toLowerCase();
      const phone=String(body.phone??"").trim();
      if(name.length<2) return NextResponse.json({error:"Họ tên cần ít nhất 2 ký tự."},{status:400});
      if(!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({error:"Email chưa hợp lệ."},{status:400});
      const duplicate=await db.user.findFirst({where:{email,id:{not:id}},select:{id:true}});
      if(duplicate) return NextResponse.json({error:"Email đã được tài khoản khác sử dụng."},{status:409});
      await db.user.update({where:{id},data:{name,email,phone:phone||null}});
      return NextResponse.json({updated:true});
    }

    if(body.action==="reset-password") {
      const temporaryPassword=randomBytes(12).toString("base64url");
      await db.$transaction([
        db.user.update({where:{id},data:{passwordHash:hashPassword(temporaryPassword)}}),
        db.session.deleteMany({where:{userId:id}}),
        db.passwordResetToken.deleteMany({where:{userId:id}})
      ]);
      return NextResponse.json({updated:true,temporaryPassword});
    }

    if(body.action==="revoke-sessions") {
      if(id===admin.id) return NextResponse.json({error:"Không thể tự thu hồi phiên đăng nhập của chính mình tại đây."},{status:400});
      const result=await db.session.deleteMany({where:{userId:id}});
      return NextResponse.json({revoked:result.count});
    }

    if(body.action==="change-role") {
      if(id===admin.id) return NextResponse.json({error:"Không thể tự thay đổi quyền của chính mình."},{status:400});
      if(body.role!=="customer"&&body.role!=="admin") return NextResponse.json({error:"Vai trò không hợp lệ."},{status:400});
      if(target.role==="admin"&&body.role==="customer"&&await db.user.count({where:{role:"admin"}})<=1)
        return NextResponse.json({error:"Không thể hạ quyền quản trị viên cuối cùng."},{status:409});
      await db.user.update({where:{id},data:{role:body.role}});
      await db.session.deleteMany({where:{userId:id}});
      return NextResponse.json({updated:true,role:body.role});
    }

    return NextResponse.json({error:"Thao tác không hợp lệ."},{status:400});
  } catch {
    return NextResponse.json({error:"Không có quyền truy cập hoặc thao tác thất bại."},{status:403});
  }
}

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const admin=await requireAdmin();
    const db=getDb()!;
    const {id}=await params;
    if(id===admin.id) return NextResponse.json({error:"Không thể xóa tài khoản đang đăng nhập."},{status:400});
    const target=await db.user.findUnique({where:{id},select:{id:true,role:true}});
    if(!target) return NextResponse.json({error:"Không tìm thấy tài khoản."},{status:404});
    if(target.role==="admin"&&await db.user.count({where:{role:"admin"}})<=1)
      return NextResponse.json({error:"Không thể xóa quản trị viên cuối cùng."},{status:409});
    // Related orders are preserved; User->Order uses onDelete:SetNull. Other personal data follows schema cascade rules.
    await db.user.delete({where:{id}});
    return NextResponse.json({deleted:true});
  } catch {
    return NextResponse.json({error:"Không có quyền truy cập hoặc không thể xóa tài khoản."},{status:403});
  }
}

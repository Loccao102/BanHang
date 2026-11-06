import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
export const runtime = "nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const admin=await requireAdmin(); const db=getDb()!; const {id}=await params;
    const body=await request.json() as {action?:string;role?:string};
    const target=await db.user.findUnique({where:{id},select:{id:true,role:true}});
    if(!target)return NextResponse.json({error:"Không tìm thấy tài khoản."},{status:404});
    if(body.action==="revoke-sessions"){
      if(id===admin.id)return NextResponse.json({error:"Không thể tự thu hồi phiên đăng nhập của chính mình."},{status:400});
      const result=await db.session.deleteMany({where:{userId:id}});
      return NextResponse.json({revoked:result.count});
    }
    if(body.action==="change-role"){
      if(id===admin.id)return NextResponse.json({error:"Không thể tự thay đổi quyền của chính mình."},{status:400});
      if(body.role!=="customer"&&body.role!=="admin")return NextResponse.json({error:"Vai trò không hợp lệ."},{status:400});
      if(target.role==="admin"&&body.role==="customer"&&await db.user.count({where:{role:"admin"}})<=1)
        return NextResponse.json({error:"Không thể hạ quyền quản trị viên cuối cùng."},{status:409});
      await db.user.update({where:{id},data:{role:body.role}});
      await db.session.deleteMany({where:{userId:id}});
      return NextResponse.json({updated:true,role:body.role});
    }
    return NextResponse.json({error:"Thao tác không hợp lệ."},{status:400});
  } catch { return NextResponse.json({error:"Không có quyền truy cập."},{status:403}); }
}

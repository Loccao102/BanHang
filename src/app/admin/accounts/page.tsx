"use client";
import Link from "next/link";
import {useCallback,useEffect,useMemo,useState} from "react";
import {CloseCircleOutlined,ReloadOutlined,SearchOutlined,SyncOutlined,UserOutlined,PlusOutlined,CopyOutlined} from "@ant-design/icons";
import {useStore} from "@/components/store-provider";
import {Pagination} from "@/components/pagination";

type Account={id:string;name:string;email:string;phone?:string|null;role:"admin"|"customer";createdAt:string;sessionCount:number;orderCount:number};
type Draft={name:string;email:string;phone:string;password:string;role:"customer"|"admin"};
const emptyDraft:Draft={name:"",email:"",phone:"",password:"",role:"customer"};

export default function AdminAccountsPage(){
 const {user,accountLoading}=useStore();
 const [accounts,setAccounts]=useState<Account[]>([]);
 const [query,setQuery]=useState(""); const [roleFilter,setRoleFilter]=useState("all");
 const [loading,setLoading]=useState(false); const [busyId,setBusyId]=useState("");
 const [error,setError]=useState(""); const [notice,setNotice]=useState("");
 const [page,setPage]=useState(1); const pageSize=12;
 const [modal,setModal]=useState<"create"|"edit"|"password"|null>(null);
 const [selected,setSelected]=useState<Account|null>(null);
 const [draft,setDraft]=useState<Draft>(emptyDraft);
 const [temporaryPassword,setTemporaryPassword]=useState("");

 const load=useCallback(async()=>{
  if(user?.role!=="admin")return;
  setLoading(true);setError("");
  try{const r=await fetch("/api/admin/accounts",{cache:"no-store"});const d=await r.json().catch(()=>null);if(!r.ok)throw new Error(d?.error||"Không thể tải tài khoản.");setAccounts(d.accounts||[]);}
  catch(e){setError(e instanceof Error?e.message:"Lỗi kết nối.");}
  finally{setLoading(false);}
 },[user?.role]);
 useEffect(()=>{void load();},[load]);

 const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return accounts.filter(a=>(roleFilter==="all"||a.role===roleFilter)&&(!q||`${a.name} ${a.email} ${a.phone||""}`.toLowerCase().includes(q)));},[accounts,query,roleFilter]);
 const admins=accounts.filter(a=>a.role==="admin").length;

 function openCreate(){setSelected(null);setDraft(emptyDraft);setError("");setModal("create");}
 function openEdit(a:Account){setSelected(a);setDraft({name:a.name,email:a.email,phone:a.phone||"",password:"",role:a.role});setError("");setModal("edit");}
 function closeModal(){setModal(null);setSelected(null);setTemporaryPassword("");}

 async function submitAccount(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusyId(selected?.id||"create");setError("");setNotice("");
  try{
   const isCreate=modal==="create";
   const r=await fetch(isCreate?"/api/admin/accounts":`/api/admin/accounts/${selected!.id}`,{
    method:isCreate?"POST":"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(isCreate?draft:{action:"edit",name:draft.name,email:draft.email,phone:draft.phone})
   });
   const d=await r.json().catch(()=>null);if(!r.ok)throw new Error(d?.error||"Không thể lưu tài khoản.");
   closeModal();setNotice(isCreate?"Đã tạo tài khoản mới.":"Đã cập nhật thông tin tài khoản.");await load();
  }catch(e){setError(e instanceof Error?e.message:"Không thể lưu tài khoản.");}
  finally{setBusyId("");}
 }

 async function runAction(a:Account,action:string){
  if(!action)return;
  if(action==="edit"){openEdit(a);return;}
  if(action==="reset-password"){setSelected(a);setTemporaryPassword("");setError("");setModal("password");return;}
  const descriptions:Record<string,string>={
   "revoke-sessions":"đăng xuất tài khoản này khỏi tất cả thiết bị",
   "change-role":a.role==="admin"?"hạ quyền tài khoản này xuống khách hàng":"cấp quyền quản trị cho tài khoản này",
   "delete":"xóa tài khoản này"
  };
  if(!window.confirm(`Bạn có chắc muốn ${descriptions[action]}? ${action==="delete"?"Đơn hàng đã tạo sẽ được giữ lại nhưng không còn gắn với tài khoản.":""}`))return;
  setBusyId(a.id);setError("");setNotice("");
  try{
   const r=await fetch(`/api/admin/accounts/${a.id}`,action==="delete"?{method:"DELETE"}:{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,role:a.role==="admin"?"customer":"admin"})
   });
   const d=await r.json().catch(()=>null);if(!r.ok)throw new Error(d?.error||"Không thể thực hiện thao tác.");
   setNotice(action==="delete"?"Đã xóa tài khoản.":action==="revoke-sessions"?`Đã thu hồi ${d.revoked} phiên đăng nhập.`:"Đã cập nhật tài khoản và thu hồi phiên đăng nhập cũ.");
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Không thể thực hiện thao tác.");}
  finally{setBusyId("");}
 }

 async function resetPassword(){
  if(!selected)return;setBusyId(selected.id);setError("");setTemporaryPassword("");
  try{
   const r=await fetch(`/api/admin/accounts/${selected.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"reset-password"})});
   const d=await r.json().catch(()=>null);if(!r.ok)throw new Error(d?.error||"Không thể đặt lại mật khẩu.");
   setTemporaryPassword(d.temporaryPassword);setNotice("Đã tạo mật khẩu tạm thời. Hãy sao chép và chuyển riêng cho khách hàng.");
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Không thể đặt lại mật khẩu.");}
  finally{setBusyId("");}
 }

 if(accountLoading||(loading&&accounts.length===0&&!error))return <div className="antLoadingState"><SyncOutlined spin style={{fontSize:32,color:"#1677ff"}}/><p>Đang tải tài khoản...</p></div>;
 if(!user||user.role!=="admin")return <section className="antAccessDeniedCard"><div className="antAccessDeniedContent"><CloseCircleOutlined style={{fontSize:48,color:"#ff4d4f",marginBottom:16}}/><h2>Khu vực quản trị bị hạn chế</h2><p>Yêu cầu tài khoản quản trị.</p><Link className="antBtn antBtnPrimary" href="/login?next=/admin/accounts">Đăng nhập quản trị</Link></div></section>;

 return <div className="antAdminPageContainer">
  <div className="antPageHeader"><div className="antPageHeaderLeft"><div className="antBreadcrumb"><Link href="/admin">Trang chủ</Link><span className="antBreadcrumbSeparator">/</span><span className="antBreadcrumbCurrent">Quản lý tài khoản</span></div><h1 className="antPageTitle">Quản lý tài khoản</h1><p className="antPageSubtitle">Thêm, chỉnh sửa, đặt lại mật khẩu và quản lý quyền truy cập tài khoản.</p></div><div className="antPageHeaderRight"><button className="antBtn antBtnDefault" disabled={loading} onClick={()=>void load()}><ReloadOutlined/> Làm mới</button><button className="antBtn antBtnPrimary" onClick={openCreate}><PlusOutlined/> Thêm tài khoản</button></div></div>
  <div className="antStatCardsGrid"><div className="antStatCard"><span className="antStatLabel">TỔNG TÀI KHOẢN</span><div className="antStatValue">{accounts.length}</div></div><div className="antStatCard"><span className="antStatLabel">KHÁCH HÀNG</span><div className="antStatValue">{accounts.length-admins}</div></div><div className="antStatCard"><span className="antStatLabel">QUẢN TRỊ VIÊN</span><div className="antStatValue">{admins}</div></div></div>
  {error&&<p role="alert" style={{color:"#cf1322",marginBottom:12}}>{error}</p>}{notice&&<p role="status" style={{color:"#237804",marginBottom:12}}>{notice}</p>}
  <div className="antCard">
   <div className="antCardHead antToolbar"><div className="antToolbarLeft"><h2 className="antCardTitle">Danh sách tài khoản <span className="antCountTag">{filtered.length}</span></h2></div><div className="antToolbarRight"><div className="antSearchInput"><SearchOutlined className="antSearchIcon"/><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} placeholder="Tìm tên, email, số điện thoại..."/></div><select className="antSelect" value={roleFilter} onChange={e=>{setRoleFilter(e.target.value);setPage(1);}}><option value="all">Tất cả vai trò</option><option value="customer">Khách hàng</option><option value="admin">Quản trị viên</option></select></div></div>
   <div className="antTableContainer"><table className="antTable"><thead><tr><th>Tài khoản</th><th>Vai trò</th><th>Ngày tạo</th><th>Đơn hàng</th><th>Phiên đăng nhập</th><th style={{textAlign:"right"}}>Thao tác</th></tr></thead><tbody>
    {filtered.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:24}}>Không có tài khoản phù hợp.</td></tr>}
    {filtered.slice((page-1)*pageSize,page*pageSize).map(a=><tr key={a.id}>
     <td><div className="antCustomerCell"><div className="antAvatar small"><UserOutlined/></div><div className="antCustomerMeta"><strong className="antCustomerName">{a.name}</strong><small className="antCustomerEmail">{a.email}</small><small className="antCustomerPhone">{a.phone||"Chưa có số điện thoại"}</small></div></div></td>
     <td><span className={a.role==="admin"?"antTag antTagWarning":"antTag antTagInfo"}>{a.role==="admin"?"Quản trị viên":"Khách hàng"}</span></td>
     <td>{new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium"}).format(new Date(a.createdAt))}</td><td>{a.orderCount}</td><td>{a.sessionCount}</td>
     <td style={{textAlign:"right"}}><select aria-label={`Thao tác với ${a.name}`} className="antSelect" value="" disabled={busyId===a.id} onChange={e=>{const v=e.target.value;e.target.value="";void runAction(a,v);}} style={{minWidth:150}}><option value="">Chọn thao tác...</option><option value="edit">Sửa thông tin</option><option value="reset-password">Đặt lại mật khẩu</option><option value="revoke-sessions" disabled={a.sessionCount===0||a.id===user.id}>Đăng xuất thiết bị</option>{a.id!==user.id&&<option value="change-role">{a.role==="admin"?"Hạ quyền admin":"Cấp quyền admin"}</option>}{a.id!==user.id&&<option value="delete">Xóa tài khoản</option>}</select></td>
    </tr>)}
   </tbody></table></div>
   {filtered.length>pageSize&&<div style={{padding:"16px 20px",borderTop:"1px solid var(--line)"}}><Pagination currentPage={page} totalPages={Math.ceil(filtered.length/pageSize)} onPageChange={setPage} totalItems={filtered.length} pageSize={pageSize} itemLabel="tài khoản"/></div>}
  </div>

  {modal&&<div role="presentation" onClick={closeModal} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.48)",display:"grid",placeItems:"center",padding:16}}>
   <section role="dialog" aria-modal="true" aria-labelledby="account-modal-title" onClick={e=>e.stopPropagation()} style={{background:"var(--surface,#fff)",color:"var(--text,#171717)",width:"min(100%,520px)",maxHeight:"90vh",overflowY:"auto",borderRadius:14,padding:24,boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:20}}><h2 id="account-modal-title" style={{margin:0,fontSize:20}}>{modal==="create"?"Thêm tài khoản":modal==="edit"?"Chỉnh sửa tài khoản":"Đặt lại mật khẩu"}</h2><button type="button" className="antBtn antBtnDefault" onClick={closeModal}>Đóng</button></div>
    {modal!=="password"?<form onSubmit={submitAccount} style={{display:"grid",gap:14}}>
     <label>Họ tên<input className="antInput" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} required minLength={2}/></label>
     <label>Email<input className="antInput" type="email" value={draft.email} onChange={e=>setDraft({...draft,email:e.target.value})} required/></label>
     <label>Số điện thoại<input className="antInput" value={draft.phone} onChange={e=>setDraft({...draft,phone:e.target.value})}/></label>
     {modal==="create"&&<><label>Mật khẩu ban đầu<input className="antInput" type="password" minLength={8} value={draft.password} onChange={e=>setDraft({...draft,password:e.target.value})} required/></label><label>Vai trò<select className="antSelect" value={draft.role} onChange={e=>setDraft({...draft,role:e.target.value as Draft["role"]})}><option value="customer">Khách hàng</option><option value="admin">Quản trị viên</option></select></label></>}
     {error&&<p role="alert" style={{color:"#cf1322",margin:0}}>{error}</p>}
     <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><button type="button" className="antBtn antBtnDefault" onClick={closeModal}>Hủy</button><button className="antBtn antBtnPrimary" disabled={!!busyId}>{busyId?"Đang lưu...":modal==="create"?"Tạo tài khoản":"Lưu thay đổi"}</button></div>
    </form>:<div style={{display:"grid",gap:14}}>
     <p style={{margin:0}}>Tạo mật khẩu tạm thời mới cho <strong>{selected?.name}</strong>. Mọi phiên đăng nhập hiện tại sẽ bị thu hồi.</p>
     {!temporaryPassword?<><p style={{color:"var(--muted)",fontSize:13,margin:0}}>Mật khẩu cũ không thể xem lại. Hệ thống sẽ tạo mật khẩu mới ngẫu nhiên và chỉ hiển thị một lần.</p>{error&&<p role="alert" style={{color:"#cf1322",margin:0}}>{error}</p>}<div style={{display:"flex",justifyContent:"flex-end",gap:8}}><button className="antBtn antBtnDefault" onClick={closeModal}>Hủy</button><button className="antBtn antBtnPrimary" disabled={!!busyId} onClick={()=>void resetPassword()}>{busyId?"Đang tạo...":"Tạo mật khẩu tạm thời"}</button></div></>:<><div style={{padding:14,borderRadius:8,background:"var(--surface-secondary,#f3f4f6)",fontFamily:"monospace",fontSize:16,wordBreak:"break-all"}}>{temporaryPassword}</div><button className="antBtn antBtnDefault" onClick={()=>void navigator.clipboard.writeText(temporaryPassword)}><CopyOutlined/> Sao chép mật khẩu</button><p style={{fontSize:13,color:"var(--muted)",margin:0}}>Hãy chuyển mật khẩu này cho khách hàng qua kênh riêng. Không gửi mật khẩu qua email công khai hoặc ghi vào ghi chú đơn hàng.</p><div style={{display:"flex",justifyContent:"flex-end"}}><button className="antBtn antBtnPrimary" onClick={closeModal}>Đã sao chép / Đóng</button></div></>}
    </div>}
   </section>
  </div>}
 </div>;
}

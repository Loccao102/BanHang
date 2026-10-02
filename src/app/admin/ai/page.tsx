"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, BrainCircuit, Sparkles, WandSparkles } from "lucide-react";
import { useStore } from "@/components/store-provider";

type Data = {
  tryOn:{total:number;completed:number;failed:number;rejected:number;successRate:number;accepted:number};
  stylist:{assessments:number;averageScore:number;feedback:Record<string,number>};
  personalization:{profiles:number;averageConfidence:number;signals:number};
  recommendations:{total:number;feedback:Record<string,number>};
  recentBehavior:Record<string,number>;
};

export default function AdminAIPage(){
  const {user,accountLoading}=useStore();
  const [data,setData]=useState<Data|null>(null);
  useEffect(()=>{if(user?.role==="admin") void fetch("/api/admin/ai",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(setData)},[user]);
  if(accountLoading || (user?.role==="admin" && !data)) return <div className="accountLoading"><div className="skeletonLine title"/><div className="skeletonBlock detailSkeleton"/></div>;
  if(!user || user.role!=="admin") return <section className="adminAccessDenied"><div><h1>Khu vực quản trị</h1><Link className="btn" href="/login?next=/admin/ai">Đăng nhập quản trị</Link></div></section>;
  if(!data) return null;
  return <section className="adminPage adminConsole">
    <div className="adminHero"><div><p className="eyebrow">AI OPERATIONS</p><h1>AI Insights.</h1></div><div className="adminHeroActions"><Link className="btn ghost small" href="/admin">← Tổng quan</Link><Link className="btn small" href="/admin/analytics">Sales Analytics</Link></div></div>
    <div className="statsGrid">
      <div className="statCard"><WandSparkles size={18}/><small>Try-On</small><strong>{data.tryOn.total}</strong><span>{data.tryOn.successRate}% hoàn thành</span></div>
      <div className="statCard"><Sparkles size={18}/><small>AI Stylist</small><strong>{data.stylist.assessments}</strong><span>Điểm TB {data.stylist.averageScore}/100</span></div>
      <div className="statCard"><BrainCircuit size={18}/><small>Style profiles</small><strong>{data.personalization.profiles}</strong><span>Confidence TB {data.personalization.averageConfidence}%</span></div>
      <div className="statCard"><Bot size={18}/><small>Recommendations</small><strong>{data.recommendations.total}</strong><span>{data.personalization.signals} tín hiệu đã học</span></div>
    </div>
    <div className="adminOverviewGrid">
      <div className="adminPanel"><h2>Try-On health</h2><div className="compactList"><div><span>Completed</span><b>{data.tryOn.completed}</b></div><div><span>Failed</span><b>{data.tryOn.failed}</b></div><div><span>Rejected</span><b>{data.tryOn.rejected}</b></div><div><span>User accepted</span><b>{data.tryOn.accepted}</b></div></div></div>
      <div className="adminPanel"><h2>Stylist feedback</h2><div className="compactList">{Object.entries(data.stylist.feedback).map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}</div></div>
    </div>
    <div className="adminOverviewGrid">
      <div className="adminPanel"><h2>Recommendation feedback</h2><div className="compactList">{Object.entries(data.recommendations.feedback).map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}</div></div>
      <div className="adminPanel"><h2>500 hành vi gần nhất</h2><div className="compactList">{Object.entries(data.recentBehavior).sort((a,b)=>b[1]-a[1]).map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}</div></div>
    </div>
  </section>;
}

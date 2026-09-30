import { Suspense } from "react";
import { ShopClient } from "./shop-client";

export default function ShopPage() {
  return <Suspense fallback={<div className="pageHero"><h1>Đang tải...</h1></div>}><ShopClient /></Suspense>;
}

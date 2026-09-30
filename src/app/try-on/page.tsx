import { Suspense } from "react";
import { TryOnClient } from "./try-on-client";

export default function TryOnPage() {
  return <Suspense fallback={<section className="tryonPage"><div className="tryonHero"><h1>Đang mở phòng thử đồ...</h1></div></section>}><TryOnClient /></Suspense>;
}

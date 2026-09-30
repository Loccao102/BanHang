import { Suspense } from "react";
import { OutfitClient } from "./outfit-client";

export default function OutfitPage() {
  return <Suspense fallback={<section className="builderPage"><div className="builderHero"><h1>Đang tạo outfit...</h1></div></section>}><OutfitClient /></Suspense>;
}

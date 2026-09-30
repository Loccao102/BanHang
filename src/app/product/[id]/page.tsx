import { notFound } from "next/navigation";
import { getProduct } from "@/lib/products";
import { ProductDetailClient } from "./product-detail-client";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();
  return <ProductDetailClient product={product} />;
}

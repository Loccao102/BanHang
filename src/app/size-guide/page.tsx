import type { Metadata } from "next";
import { SizeGuideClient } from "./size-guide-client";

export const metadata: Metadata = {
  title: "Hướng dẫn chọn size & Fit Studio AI — LSOUL",
  description: "Công cụ phân tích dáng người AI và bảng thông số chọn cỡ chuẩn cho trang phục thiết kế LSOUL."
};

export default function SizeGuidePage() {
  return <SizeGuideClient />;
}

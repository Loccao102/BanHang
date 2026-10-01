import type { Metadata } from "next";
import "./globals.css";
import "./commerce-extra.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { StoreProvider } from "@/components/store-provider";

export const metadata: Metadata = {
  title: "ÉLANE — Modern Fashion Store",
  description: "Thời trang tối giản hiện đại: bộ sưu tập mới, mua sắm, wishlist, giỏ hàng và thanh toán QR demo."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <StoreProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}

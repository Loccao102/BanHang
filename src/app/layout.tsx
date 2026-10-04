import type { Metadata } from "next";
import "./globals.css";
import "./commerce-extra.css";
import "./storefront-modern.css";
import "./typography-motion.css";
import "./catalog-db.css";
import "./social-commerce.css";
import "./admin-extended.css";
import "./account.css";
import "./chat-assistant.css";
import "./luxury-motion.css";
import "./flagship-motion.css";
import "./fitting-room.css";
import "./order-tracker.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { StoreProvider } from "@/components/store-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { StoreToast } from "@/components/store-toast";
import { ChatWidget } from "@/components/chat-widget";
import { SiteMotion } from "@/components/site-motion";

export const metadata: Metadata = {
  title: "LSOUL — Thời trang tích hợp AI",
  description: "Website thương mại điện tử thời trang LSOUL với trợ lý mua sắm AI và phòng thử đồ AI."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <StoreProvider>
          <SiteMotion />
          <Header />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
          <StoreToast />
          <ChatWidget />
        </StoreProvider>
      </body>
    </html>
  );
}

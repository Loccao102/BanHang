import type { Metadata } from "next";
import { Be_Vietnam_Pro, Noto_Serif } from "next/font/google";
import "./globals.css";
import "./commerce-extra.css";
import "./storefront-modern.css";
import "./typography-motion.css";
import "./catalog-db.css";
import "./account.css";
import "./chat-assistant.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { StoreProvider } from "@/components/store-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { StoreToast } from "@/components/store-toast";
import { ChatWidget } from "@/components/chat-widget";

const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap"
});

const serif = Noto_Serif({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap"
});

export const metadata: Metadata = {
  title: "LSOUL — Fashion Social Commerce",
  description: "LSOUL Social Commerce — khám phá, chia sẻ và mua trực tiếp những look thời trang nữ được yêu thích."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <StoreProvider>
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

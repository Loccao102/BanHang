import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { StoreProvider } from "@/components/store-provider";
import { ChatWidget } from "@/components/chat-widget";

export const metadata: Metadata = {
  title: "ÉLANE — Modern Fashion & AI Stylist",
  description: "Fashion ecommerce demo với AI stylist, outfit recommendation và virtual try-on."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <StoreProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <ChatWidget />
        </StoreProvider>
      </body>
    </html>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { Bot, ChevronRight, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { CHAT_KEY } from "@/lib/cart";
import { formatPrice, Product } from "@/lib/products";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  products?: Product[];
};

const starter: ChatMessage[] = [{
  id: "welcome",
  role: "assistant",
  text: "Chào bạn, mình là LSOUL Stylist. Hãy nói màu sắc, ngân sách hoặc dịp bạn sắp đi — mình sẽ tìm đồ đang còn trong shop."
}];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(starter);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CHAT_KEY);
      if (saved) setMessages(JSON.parse(saved) as ChatMessage[]);
    } catch { /* Conversation history is non-critical */ }
  }, []);

  useEffect(() => {
    if (messages !== starter) window.localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text: clean };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean })
      });
      const data = await response.json();
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        text: data.message ?? "Mình đã tìm một vài lựa chọn phù hợp.",
        products: data.products ?? []
      }]);
    } catch {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: "Mình đang mất kết nối. Bạn thử lại sau một chút nhé." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  return (
    <>
      <button className="chatLauncher" onClick={() => setOpen((value) => !value)} aria-label="Mở trợ lý AI">
        {open ? <X size={21} /> : <><MessageCircle size={20} /><span>Stylist AI</span></>}
      </button>
      {open ? (
        <aside className="chatPanel" aria-label="LSOUL Stylist AI">
          <div className="chatHead">
            <div className="chatAvatar"><Sparkles size={18} /></div>
            <div><strong>LSOUL Stylist</strong><small><span className="statusDot" /> AI shopping assistant</small></div>
            <button className="iconButton" onClick={() => setOpen(false)}><X size={19} /></button>
          </div>
          <div className="chatSuggestions">
            {["Áo đen dưới 500k", "Set đi date 1,5 triệu", "Quần xanh phối áo gì?"].map((prompt) => (
              <button key={prompt} onClick={() => void send(prompt)}>{prompt}</button>
            ))}
          </div>
          <div className="chatBody">
            {messages.map((message) => (
              <div className={`message ${message.role}`} key={message.id}>
                {message.role === "assistant" ? <Bot size={16} /> : null}
                <div className="messageBubble">
                  <p>{message.text}</p>
                  {message.products?.length ? (
                    <div className="chatProducts">
                      {message.products.slice(0, 3).map((product) => (
                        <Link href={`/product/${product.id}`} className="chatProduct" key={product.id}>
                          <Image src={product.image} alt={product.name} width={54} height={68} />
                          <span><strong>{product.name}</strong><small>{formatPrice(product.price)}</small></span>
                          <ChevronRight size={16} />
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {loading ? <div className="message assistant"><Bot size={16} /><div className="typing"><i /><i /><i /></div></div> : null}
            <div ref={endRef} />
          </div>
          <form className="chatForm" onSubmit={handleSubmit}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ví dụ: tìm áo đen đi date..." />
            <button aria-label="Gửi"><Send size={18} /></button>
          </form>
        </aside>
      ) : null}
    </>
  );
}

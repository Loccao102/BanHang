"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bot, Check, ChevronRight, Clock3, History, MessageCircle, MoreHorizontal,
  Pencil, Plus, Send, ShoppingBag, Sparkles, Trash2, X
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CHAT_KEY } from "@/lib/cart";
import type { ChatConversationSummary, ChatMessageView } from "@/lib/chat";
import { formatPrice, type Product } from "@/lib/products";
import { useStore } from "./store-provider";

const welcome: ChatMessageView = {
  id: "welcome",
  role: "assistant",
  text: "Chào bạn, mình là LSOUL Stylist AI. Mình có thể tìm sản phẩm đang còn hàng, phối outfit, tư vấn size, chính sách mua hàng và kiểm tra đơn của bạn khi đã đăng nhập."
};

function firstAvailableSize(product: Product) {
  return product.variants?.find((variant) => variant.stock > 0)?.size ?? product.sizes[0];
}

function readGuestHistory() {
  if (typeof window === "undefined") return [welcome];
  try {
    const raw = window.localStorage.getItem(CHAT_KEY);
    const parsed = raw ? JSON.parse(raw) as ChatMessageView[] : [];
    return parsed.length ? parsed : [welcome];
  } catch {
    return [welcome];
  }
}

export function ChatWidget() {
  const { user, addToCart } = useStore();
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageView[]>([welcome]);
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isGuest = !user;

  async function loadConversations() {
    if (!user) {
      setConversations([]);
      return;
    }
    const response = await fetch("/api/chat/conversations", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json() as { conversations: ChatConversationSummary[] };
    setConversations(data.conversations);
  }

  useEffect(() => {
    if (user) {
      setMessages([welcome]);
      setActiveConversationId(null);
      void loadConversations();
    } else {
      setMessages(readGuestHistory());
      setActiveConversationId(null);
      setConversations([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user && messages.length) {
      window.localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-80)));
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, user]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 150);
  }, [open, activeConversationId]);

  const activeTitle = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId)?.title ?? "LSOUL Stylist",
    [conversations, activeConversationId]
  );

  async function openConversation(id: string) {
    if (!user || loadingConversation) return;
    setLoadingConversation(true);
    setError("");
    try {
      const response = await fetch(`/api/chat/conversations/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Không thể tải cuộc trò chuyện.");
      const data = await response.json() as { messages: ChatMessageView[] };
      setMessages(data.messages.length ? data.messages : [welcome]);
      setActiveConversationId(id);
      setHistoryOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải lịch sử.");
    } finally {
      setLoadingConversation(false);
    }
  }

  function newChat() {
    setMessages([welcome]);
    setActiveConversationId(null);
    setInput("");
    setError("");
    setHistoryOpen(false);
    inputRef.current?.focus();
  }

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;

    const optimistic: ChatMessageView = {
      id: crypto.randomUUID(),
      role: "user",
      text: clean,
      createdAt: new Date().toISOString()
    };
    const historyForRequest = messages.filter((message) => message.id !== "welcome").slice(-10);
    setMessages((current) => [...current, optimistic]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: clean,
          conversationId: activeConversationId,
          history: isGuest ? historyForRequest : undefined
        })
      });
      const data = await response.json() as {
        error?: string;
        message?: string;
        products?: Product[];
        conversationId?: string | null;
      };
      if (!response.ok) throw new Error(data.error ?? "Không thể gửi tin nhắn.");

      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        text: data.message ?? "Mình đã tìm được một vài lựa chọn phù hợp.",
        products: data.products ?? [],
        createdAt: new Date().toISOString()
      }]);

      if (user && data.conversationId) {
        setActiveConversationId(data.conversationId);
        await loadConversations();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Mình đang mất kết nối. Bạn thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  async function renameConversation(id: string) {
    const title = editingTitle.trim();
    if (!title) return;
    const response = await fetch(`/api/chat/conversations/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    if (response.ok) {
      setEditingId(null);
      setEditingTitle("");
      await loadConversations();
    }
  }

  async function deleteConversation(id: string) {
    if (!window.confirm("Xóa cuộc trò chuyện này?")) return;
    const response = await fetch(`/api/chat/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) return;
    if (activeConversationId === id) newChat();
    await loadConversations();
  }

  function quickAdd(product: Product) {
    const size = firstAvailableSize(product);
    if (size) addToCart(product, size);
  }

  return (
    <>
      <button className="chatLauncher" onClick={() => setOpen((value) => !value)} aria-label="Mở LSOUL Stylist AI">
        {open ? <X size={20} /> : <><MessageCircle size={19} /><span>Stylist AI</span></>}
      </button>

      {open ? (
        <aside className="chatPanel" aria-label="LSOUL Stylist AI">
          <div className="chatHead">
            <button className="chatHistoryButton" onClick={() => setHistoryOpen((value) => !value)} aria-label="Lịch sử trò chuyện">
              <History size={18} />
            </button>
            <div className="chatAvatar"><Sparkles size={17} /></div>
            <div className="chatHeadTitle"><strong>{activeTitle}</strong><small><span className="statusDot" /> AI shopping assistant</small></div>
            <button className="chatNewButton" onClick={newChat} title="Cuộc trò chuyện mới"><Plus size={17} /></button>
            <button className="iconButton" onClick={() => setOpen(false)} aria-label="Đóng chatbot"><X size={18} /></button>
          </div>

          {historyOpen ? (
            <div className="chatHistoryDrawer">
              <div className="chatHistoryTop"><div><p className="eyebrow">HISTORY</p><h3>Lịch sử trò chuyện</h3></div><button onClick={newChat}><Plus size={14} /> New chat</button></div>
              {user ? (
                <div className="chatConversationList">
                  {conversations.length ? conversations.map((conversation) => (
                    <div className={`chatConversationItem ${activeConversationId === conversation.id ? "active" : ""}`} key={conversation.id}>
                      {editingId === conversation.id ? (
                        <form onSubmit={(event) => { event.preventDefault(); void renameConversation(conversation.id); }}>
                          <input autoFocus value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} maxLength={80} />
                          <button type="submit" aria-label="Lưu"><Check size={13} /></button>
                          <button type="button" onClick={() => setEditingId(null)} aria-label="Hủy"><X size={13} /></button>
                        </form>
                      ) : (
                        <>
                          <button className="chatConversationOpen" onClick={() => void openConversation(conversation.id)}>
                            <strong>{conversation.title}</strong>
                            <small>{conversation.lastMessage || "Chưa có tin nhắn"}</small>
                            <span><Clock3 size={11} /> {new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(conversation.updatedAt))} · {conversation.messageCount} tin</span>
                          </button>
                          <div className="chatConversationActions">
                            <button onClick={() => { setEditingId(conversation.id); setEditingTitle(conversation.title); }} aria-label="Đổi tên"><Pencil size={12} /></button>
                            <button onClick={() => void deleteConversation(conversation.id)} aria-label="Xóa"><Trash2 size={12} /></button>
                          </div>
                        </>
                      )}
                    </div>
                  )) : <div className="chatHistoryEmpty"><MessageCircle size={24} /><p>Chưa có lịch sử. Bắt đầu một cuộc trò chuyện mới nhé.</p></div>}
                </div>
              ) : (
                <div className="chatGuestHistory">
                  <History size={25} />
                  <h4>Lịch sử đang lưu trên thiết bị</h4>
                  <p>Đăng nhập để lưu nhiều cuộc trò chuyện vào tài khoản và tiếp tục trên thiết bị khác.</p>
                  <Link className="btn small" href="/login" onClick={() => setOpen(false)}>Đăng nhập</Link>
                </div>
              )}
            </div>
          ) : null}

          <div className="chatSuggestions">
            {["Tìm corset đen dưới 900k", "Phối set đi date 2 triệu", "Tư vấn size cho mình", ...(user ? ["Đơn gần nhất của mình đâu rồi?"] : [])].map((prompt) => (
              <button key={prompt} disabled={loading} onClick={() => void send(prompt)}>{prompt}</button>
            ))}
          </div>

          <div className="chatBody">
            {loadingConversation ? <div className="chatLoadingHistory">Đang tải lịch sử...</div> : null}
            {messages.map((message) => (
              <div className={`message ${message.role}`} key={message.id}>
                {message.role === "assistant" ? <Bot size={16} /> : null}
                <div className="messageBubble">
                  <p>{message.text}</p>
                  {message.products?.length ? (
                    <div className="chatProducts">
                      {message.products.slice(0, 4).map((product) => (
                        <div className="chatProduct" key={product.id}>
                          <Link href={`/product/${product.id}`} onClick={() => setOpen(false)}>
                            <Image src={product.image} alt={product.name} width={58} height={72} />
                            <span><strong>{product.name}</strong><small>{formatPrice(product.price)}</small><em>{product.variants?.filter((variant) => variant.stock > 0).map((variant) => variant.size).slice(0, 5).join(" · ")}</em></span>
                            <ChevronRight size={15} />
                          </Link>
                          <button onClick={() => quickAdd(product)} aria-label={`Thêm ${product.name} vào giỏ`}><ShoppingBag size={13} /></button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {message.createdAt ? <time>{new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}</time> : null}
                </div>
              </div>
            ))}
            {loading ? <div className="message assistant"><Bot size={16} /><div className="typing"><i /><i /><i /></div></div> : null}
            {error ? <div className="chatError">{error}</div> : null}
            <div ref={endRef} />
          </div>

          <form className="chatForm" onSubmit={handleSubmit}>
            <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} placeholder="Hỏi LSOUL Stylist..." />
            <button disabled={loading || !input.trim()} aria-label="Gửi"><Send size={17} /></button>
          </form>
          <div className="chatFoot">{user ? "Lịch sử được lưu vào tài khoản LSOUL." : "Guest mode · lịch sử lưu trên trình duyệt."}</div>
        </aside>
      ) : null}
    </>
  );
}

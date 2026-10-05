"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bot, Check, ChevronRight, Clock3, Heart, History, MessageCircle,
  Pencil, Plus, Send, ShoppingBag, Sparkles, Trash2, X
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CHAT_KEY } from "@/lib/cart";
import type { ChatAgentAction, ChatConversationSummary, ChatMessageView } from "@/lib/chat";
import { formatPrice, type Product } from "@/lib/products";
import { useStore } from "./store-provider";

const welcome: ChatMessageView = {
  id: "welcome",
  role: "assistant",
  text: "Chào bạn, mình là Trợ lý phối đồ AI LSOUL. Mình có thể tìm đồ, phối đồ và thực hiện các thao tác mua sắm như thêm vào giỏ, áp mã giảm giá, mở đơn hàng hoặc đưa bạn tới trang thanh toán."
};

function firstAvailableSize(product: Product) {
  return product.variants?.find((variant) => variant.stock > 0)?.size ?? (Array.isArray(product.sizes) ? product.sizes[0] : "S");
}

/** Mô tả set đồ đã phối (số món + tổng tiền) để chú thích ngay trên các thẻ sản phẩm. */
function bundleCaption(message: ChatMessageView) {
  const action = message.actions?.find((item) => item.type === "add_bundle");
  if (!action || action.type !== "add_bundle" || action.items.length < 2) return null;
  const total = (message.products ?? [])
    .filter((product) => action.items.some((item) => item.productId === product.id))
    .reduce((sum, product) => sum + product.price, 0);
  return `Set gồm ${action.items.length} món · tổng ${formatPrice(total)}`;
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
  const router = useRouter();
  const pathname = usePathname();
  const { user, catalog, addToCart, addBundleToCart, applyCoupon, wishlist, toggleWishlist } = useStore();
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
  const [actionState, setActionState] = useState<Record<string, "running" | "done" | "failed">>({});
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
    setActionState({});
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
      setActionState({});
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
    setActionState({});
    inputRef.current?.focus();
  }

  async function executeAction(action: ChatAgentAction) {
    if (actionState[action.id] === "running" || actionState[action.id] === "done") return;
    setActionState((current) => ({ ...current, [action.id]: "running" }));

    try {
      if (action.type === "add_to_cart") {
        const product = catalog.find((item) => item.id === action.productId && item.active !== false);
        const variant = product?.variants?.find((item) => item.size === action.size && item.stock >= action.quantity);
        if (!product || !variant) throw new Error("Sản phẩm hoặc size vừa hết hàng.");
        addToCart(product, action.size, action.quantity);
      }

      if (action.type === "add_bundle") {
        const bundle = action.items.flatMap((item) => {
          const product = catalog.find((candidate) => candidate.id === item.productId && candidate.active !== false);
          const variant = product?.variants?.find((candidate) => candidate.size === item.size && candidate.stock >= item.quantity);
          return product && variant ? [{ product, size: item.size, quantity: item.quantity }] : [];
        });
        if (bundle.length !== action.items.length) throw new Error("Một món trong bộ đồ vừa hết cỡ.");
        addBundleToCart(bundle);
      }

      if (action.type === "apply_coupon") {
        const applied = await applyCoupon(action.code);
        if (!applied) throw new Error("Mã giảm giá chưa đủ điều kiện cho giỏ hàng hiện tại.");
      }

      if (action.type === "open_order") {
        setOpen(false);
        router.push(`/orders#order-${encodeURIComponent(action.orderId)}`);
      }

      if (action.type === "open_product") {
        setOpen(false);
        router.push(`/product/${encodeURIComponent(action.productId)}`);
      }

      if (action.type === "open_try_on") {
        const productIds = action.productIds.filter(Boolean);
        if (!productIds.length) throw new Error("Chưa có sản phẩm nào để thử.");

        if (!user) {
          setOpen(false);
          const targetUrl = `/try-on?products=${encodeURIComponent(productIds.join(","))}`;
          router.push(`/login?next=${encodeURIComponent(targetUrl)}`);
          return;
        }

        // Add items to wishlist so fitting room shows them
        productIds.forEach((id) => {
          if (!wishlist.includes(id)) {
            toggleWishlist(id);
          }
        });

        setOpen(false);
        router.push(`/try-on?products=${encodeURIComponent(productIds.join(","))}`);
      }

      if (action.type === "open_checkout") {
        setOpen(false);
        router.push("/checkout");
      }

      setActionState((current) => ({ ...current, [action.id]: "done" }));
    } catch (cause) {
      setActionState((current) => ({ ...current, [action.id]: "failed" }));
      setError(cause instanceof Error ? cause.message : "Không thể thực hiện thao tác.");
    }
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
    const latestShoppingState = [...historyForRequest].reverse()
      .find((message) => message.role === "assistant" && message.shoppingState)?.shoppingState;
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
          history: isGuest ? historyForRequest : undefined,
          shoppingState: isGuest ? latestShoppingState : undefined
        })
      });
      const data = await response.json() as {
        error?: string;
        message?: string;
        products?: Product[];
        actions?: ChatAgentAction[];
        shoppingState?: unknown;
        conversationId?: string | null;
      };
      if (!response.ok) throw new Error(data.error ?? "Không thể gửi tin nhắn.");

      const assistantMessage: ChatMessageView = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: data.message ?? "Mình đã xử lý yêu cầu của bạn.",
        products: data.products ?? [],
        actions: data.actions ?? [],
        shoppingState: data.shoppingState,
        createdAt: new Date().toISOString()
      };
      setMessages((current) => [...current, assistantMessage]);

      if (user && data.conversationId) {
        setActiveConversationId(data.conversationId);
        await loadConversations();
      }

      for (const action of data.actions ?? []) {
        if (action.autoExecute) await executeAction(action);
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

  function quickTryOn(product: Product) {
    if (!user) {
      setOpen(false);
      router.push(`/login?next=${encodeURIComponent(`/try-on?products=${product.id}`)}`);
      return;
    }
    if (!wishlist.includes(product.id)) {
      toggleWishlist(product.id);
    }
    setOpen(false);
    router.push(`/try-on?products=${encodeURIComponent(product.id)}`);
  }

  function actionLabel(action: ChatAgentAction) {
    const state = actionState[action.id];
    if (state === "running") return "Đang thực hiện...";
    if (state === "done") return "Đã thực hiện";
    if (state === "failed") return "Thử lại";
    return action.label;
  }

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <button className="chatLauncher" onClick={() => setOpen((value) => !value)} aria-label="Mở LSOUL Stylist AI">
        {open ? <X size={20} /> : <><MessageCircle size={19} /><span>Stylist AI</span></>}
      </button>

      {open ? (
        <aside className="chatPanel" aria-label="LSOUL Stylist AI">
          <div className="chatHead">
            <button className="chatHistoryButton" onClick={() => setHistoryOpen((value) => !value)} aria-label="Lịch sử trò chuyện"><History size={18} /></button>
            <div className="chatAvatar"><Sparkles size={17} /></div>
            <div className="chatHeadTitle"><strong>{activeTitle}</strong><small><span className="statusDot" /> Trợ lý mua sắm AI</small></div>
            <button className="chatNewButton" onClick={newChat} title="Cuộc trò chuyện mới"><Plus size={17} /></button>
            <button className="chatCloseButton" onClick={() => setOpen(false)} aria-label="Đóng chatbot"><X size={18} /></button>
          </div>

          {historyOpen ? (
            <div className="chatHistoryDrawer">
              <div className="chatHistoryTop"><div><p className="eyebrow">LỊCH SỬ</p><h3>Lịch sử trò chuyện</h3></div><button onClick={newChat}><Plus size={14} /> Cuộc trò chuyện mới</button></div>
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
            {[
              "✨ Phối set Quần/Chân váy + Áo",
              "✨ Phối set Đầm liền & Áo khoác",
              "✨ Phối set đồ đồng bộ (Co-ord)",
              "Phối đồ đi hẹn hò dưới 2 triệu",
              "Áp mã LSOUL10"
            ].map((prompt) => <button key={prompt} disabled={loading} onClick={() => void send(prompt)}>{prompt}</button>)}
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
                      {bundleCaption(message) ? <div className="chatBundleSummary">{bundleCaption(message)}</div> : null}
                      {message.products.slice(0, 6).map((product) => {
                        const liked = wishlist.includes(product.id);
                        const availableSizes = product.variants?.filter((variant) => variant.stock > 0).map((variant) => variant.size).slice(0, 4).join(" · ") || (Array.isArray(product.sizes) ? product.sizes.slice(0, 4).join(" · ") : "");
                        return (
                          <div className="chatProductCard" key={product.id}>
                            <Link className="chatProductBody" href={`/product/${product.id}`} onClick={() => setOpen(false)}>
                              <div className="chatProductMedia">
                                <Image src={product.image} alt={product.name} width={56} height={70} />
                              </div>
                              <div className="chatProductInfo">
                                <strong>{product.name}</strong>
                                <span className="chatProductPrice">{formatPrice(product.price)}</span>
                                <span className="chatProductSizes">Size: {availableSizes}</span>
                              </div>
                              <ChevronRight size={16} className="chatProductArrow" />
                            </Link>
                            <div className="chatProductActionRow">
                              <button
                                type="button"
                                className="chatAddBtn"
                                onClick={() => quickAdd(product)}
                                aria-label={`Thêm ${product.name} vào giỏ`}
                                title="Thêm vào giỏ hàng"
                              >
                                <ShoppingBag size={13} />
                                <span>Thêm giỏ</span>
                              </button>
                              <button
                                type="button"
                                className="chatTryBtn"
                                onClick={() => quickTryOn(product)}
                                aria-label={`Thử ${product.name} trong phòng thử đồ AI`}
                                title="Thử đồ AI trên vóc dáng"
                              >
                                <Sparkles size={13} />
                                <span>Thử đồ</span>
                              </button>
                              <button
                                type="button"
                                className={`chatLikeBtn ${liked ? "active" : ""}`}
                                onClick={() => toggleWishlist(product.id)}
                                aria-label={liked ? "Bỏ yêu thích" : "Yêu thích"}
                                title={liked ? "Bỏ yêu thích" : "Lưu vào yêu thích"}
                              >
                                <Heart size={14} fill={liked ? "currentColor" : "none"} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {message.actions?.length ? (
                    <div className="chatAgentActions">
                      {message.actions.map((action) => {
                        const state = actionState[action.id];
                        const isTryOn = action.type === "open_try_on";
                        return (
                          <button
                            key={action.id}
                            className={`${state ? `state-${state}` : ""} ${isTryOn ? "action-try-on" : ""}`}
                            disabled={state === "running" || state === "done"}
                            onClick={() => void executeAction(action)}
                          >
                            {state === "done" ? <Check size={12} /> : <Sparkles size={12} />}
                            <span>{actionLabel(action)}</span>
                            {!state ? <ChevronRight size={12} /> : null}
                          </button>
                        );
                      })}
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
            <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} placeholder='Ví dụ: "thêm cái thứ 2 cỡ M vào giỏ"' />
            <button disabled={loading || !input.trim()} aria-label="Gửi"><Send size={17} /></button>
          </form>
          <div className="chatFoot">{user ? "Trợ lý mua sắm · lịch sử lưu vào tài khoản LSOUL." : "Chế độ khách · lịch sử lưu trên trình duyệt."}</div>
        </aside>
      ) : null}
    </>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bot, Camera, Check, CheckCircle2, ChevronRight, Clock3, Copy, CreditCard,
  Heart, History, ImagePlus, LoaderCircle, MessageCircle, Pencil, Plus,
  QrCode, Send, ShoppingBag, Sparkles, ThumbsDown, ThumbsUp, Trash2, Truck, X
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CHAT_KEY, type OrderRecord } from "@/lib/cart";
import type { ChatAgentAction, ChatConversationSummary, ChatMessageView, ChatOrderInfo, ChatTryOnResult } from "@/lib/chat";
import { formatPrice, type Product } from "@/lib/products";
import { useStore } from "./store-provider";

const bankId = process.env.NEXT_PUBLIC_BANK_ID ?? "MB";
const account = process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "0123456789";
const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "LSOUL";

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
  const { user, catalog, addToCart, addBundleToCart, applyCoupon, wishlist, toggleWishlist, addresses, placeOrder } = useStore();
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
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  // Feature 6: Feedback State
  const [feedbackMap, setFeedbackMap] = useState<Record<string, { rating: "thumbs_up" | "thumbs_down"; reason?: string }>>({});
  const [openFeedbackChips, setOpenFeedbackChips] = useState<string | null>(null);

  // Feature 2: In-Chat Try-On State
  const [inChatTryOnLoading, setInChatTryOnLoading] = useState<string | null>(null);

  // Feature 5: Conversational Checkout State
  const [activeCheckoutMessageId, setActiveCheckoutMessageId] = useState<string | null>(null);
  const [checkoutProducts, setCheckoutProducts] = useState<Product[]>([]);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<"qr" | "cod">("qr");
  const [checkoutShipping, setCheckoutShipping] = useState({ name: "", phone: "", address: "", city: "Hà Nội" });
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [pendingQrOrder, setPendingQrOrder] = useState<OrderRecord | null>(null);
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!user) return;
    const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
    setCheckoutShipping({
      name: defaultAddr?.recipientName ?? user.name ?? "",
      phone: defaultAddr?.phone ?? user.phone ?? "",
      address: defaultAddr?.address ?? "",
      city: defaultAddr?.city ?? "Hà Nội"
    });
  }, [user, addresses]);

  useEffect(() => {
    if (!pendingQrOrder) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(pendingQrOrder.id)}/payment`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json() as { paymentStatus: string };
          if (data.paymentStatus === "paid") {
            setCompletedOrder({ ...pendingQrOrder, paymentStatus: "paid", status: "confirmed" });
            setPendingQrOrder(null);
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [pendingQrOrder]);

  const activeTitle = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId)?.title ?? "LSOUL Stylist",
    [conversations, activeConversationId]
  );

  function copyToClipboard(text: string, key: string) {
    if (typeof navigator !== "undefined") {
      void navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  async function sendFeedback(message: ChatMessageView, rating: "thumbs_up" | "thumbs_down", reason?: string) {
    setFeedbackMap((prev) => ({ ...prev, [message.id]: { rating, reason } }));
    if (rating === "thumbs_down" && !reason) {
      setOpenFeedbackChips(message.id);
      return;
    }
    setOpenFeedbackChips(null);
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          messageId: message.id,
          rating,
          feedbackReason: reason,
          productIds: message.products?.map((p) => p.id)
        })
      });
    } catch (err) {
      console.warn("Feedback submission error:", err);
    }
  }

  async function startInChatTryOn(productsToTry: Product[]) {
    if (!productsToTry.length) return;
    let modelImage = attachedImage;
    if (!modelImage && typeof window !== "undefined") {
      modelImage = window.localStorage.getItem("lsoul_saved_tryon_model");
    }
    if (!modelImage) {
      setError("Để ướm thử đồ, bạn hãy bấm vào biểu tượng 📷 bên dưới để chọn ảnh toàn thân nhé!");
      fileInputRef.current?.click();
      return;
    }

    const tryOnKey = productsToTry.map((p) => p.id).join(",");
    setInChatTryOnLoading(tryOnKey);
    setError("");

    try {
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelImage,
          productIds: productsToTry.map((p) => p.id)
        })
      });
      const data = await res.json() as {
        output?: string;
        error?: string;
        assessment?: { overallScore: number; verdict: string; summary: string };
      };
      if (!res.ok || !data.output) {
        throw new Error(data.error ?? "Không thể tạo ảnh ướm thử.");
      }

      const resultMessage: ChatMessageView = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: `✨ Ảnh ướm thử AI: ${productsToTry.map((p) => p.name).join(" + ")}`,
        products: productsToTry,
        tryOnResult: {
          imageUrl: data.output,
          productIds: productsToTry.map((p) => p.id),
          assessment: data.assessment
        },
        actions: [
          {
            id: crypto.randomUUID(),
            type: "chat_checkout",
            label: "⚡ Chốt đơn set này ngay",
            productIds: productsToTry.map((p) => p.id)
          },
          {
            id: crypto.randomUUID(),
            type: "add_bundle",
            label: "Thêm cả set vào giỏ",
            items: productsToTry.map((p) => ({
              productId: p.id,
              size: selectedSizes[p.id] || firstAvailableSize(p),
              quantity: 1
            }))
          }
        ],
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, resultMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi khi ướm thử đồ trong chat.");
    } finally {
      setInChatTryOnLoading(null);
    }
  }

  function openInChatCheckout(productsToCheckout: Product[], messageId: string) {
    if (!user) {
      setOpen(false);
      router.push("/login?next=/checkout");
      return;
    }
    setActiveCheckoutMessageId(messageId);
    setCheckoutProducts(productsToCheckout.length ? productsToCheckout : catalog.slice(0, 1));
    setPendingQrOrder(null);
    setCompletedOrder(null);
  }

  async function submitInChatCheckout(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      setOpen(false);
      router.push("/login?next=/checkout");
      return;
    }
    if (!checkoutProducts.length) {
      setError("Chưa có sản phẩm nào để chốt đơn.");
      return;
    }
    if (!checkoutShipping.name || !checkoutShipping.phone || !checkoutShipping.address || !checkoutShipping.city) {
      setError("Vui lòng điền đầy đủ tên, số điện thoại, địa chỉ và tỉnh/thành nhận hàng.");
      return;
    }

    setCheckoutSubmitting(true);
    setError("");

    const orderLines = checkoutProducts.map((product) => ({
      product,
      size: selectedSizes[product.id] || firstAvailableSize(product),
      quantity: 1
    }));
    const subtotal = orderLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const shipping = subtotal >= 699000 ? 0 : 30000;
    const total = subtotal + shipping;

    const draft: OrderRecord = {
      id: "",
      createdAt: new Date().toISOString(),
      items: orderLines,
      subtotal,
      shipping,
      discount: 0,
      total,
      payment: checkoutPaymentMethod,
      checkoutMode: "cart",
      status: "processing",
      paymentStatus: checkoutPaymentMethod === "qr" ? "pending" : "cod_pending",
      customer: {
        name: checkoutShipping.name,
        phone: checkoutShipping.phone,
        address: checkoutShipping.address,
        city: checkoutShipping.city
      }
    };

    try {
      const created = await placeOrder(draft);
      if (checkoutPaymentMethod === "qr") {
        setPendingQrOrder(created);
      } else {
        setCompletedOrder(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo đơn hàng.");
    } finally {
      setCheckoutSubmitting(false);
    }
  }

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
    setAttachedImage(null);
    setError("");
    setHistoryOpen(false);
    setActionState({});
    setActiveCheckoutMessageId(null);
    setPendingQrOrder(null);
    setCompletedOrder(null);
    inputRef.current?.focus();
  }

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Vui lòng chọn ảnh định dạng JPG, PNG hoặc WebP.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Kích thước ảnh tối đa là 8MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(String(reader.result));
      setError("");
    };
    reader.onerror = () => {
      setError("Không thể đọc file ảnh.");
    };
    reader.readAsDataURL(file);
    if (event.target) event.target.value = "";
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

      if (action.type === "chat_try_on") {
        const productIds = action.productIds.filter(Boolean);
        const productsToTry = catalog.filter((p) => productIds.includes(p.id));
        await startInChatTryOn(productsToTry.length ? productsToTry : catalog.slice(0, 2));
      }

      if (action.type === "chat_checkout") {
        const productIds = (action.productIds && action.productIds.length > 0)
          ? action.productIds
          : [];
        const productsToCheckout = catalog.filter((p) => productIds.includes(p.id));
        openInChatCheckout(productsToCheckout.length ? productsToCheckout : catalog.slice(0, 1), action.id);
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
    const imageToSend = attachedImage;
    if ((!clean && !imageToSend) || loading) return;

    const optimistic: ChatMessageView = {
      id: crypto.randomUUID(),
      role: "user",
      text: clean || "Gợi ý phối đồ cho ảnh này giúp mình",
      imageUrl: imageToSend || undefined,
      createdAt: new Date().toISOString()
    };
    const historyForRequest = messages.filter((message) => message.id !== "welcome").slice(-10);
    const latestShoppingState = [...historyForRequest].reverse()
      .find((message) => message.role === "assistant" && message.shoppingState)?.shoppingState;
    setMessages((current) => [...current, optimistic]);
    setInput("");
    setAttachedImage(null);
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: clean,
          image: imageToSend || undefined,
          conversationId: activeConversationId,
          history: isGuest ? historyForRequest : undefined,
          shoppingState: latestShoppingState ?? undefined
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
    const chosenSize = selectedSizes[product.id] || firstAvailableSize(product);
    if (chosenSize) addToCart(product, chosenSize);
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

  function quickTryOnBundle(bundleProducts: Product[]) {
    const productIds = Array.from(new Set(bundleProducts.map((p) => p.id).filter(Boolean)));
    if (!productIds.length) return;
    if (!user) {
      setOpen(false);
      const targetUrl = `/try-on?products=${encodeURIComponent(productIds.join(","))}`;
      router.push(`/login?next=${encodeURIComponent(targetUrl)}`);
      return;
    }
    productIds.forEach((id) => {
      if (!wishlist.includes(id)) {
        toggleWishlist(id);
      }
    });
    setOpen(false);
    router.push(`/try-on?products=${encodeURIComponent(productIds.join(","))}`);
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
              "✨ Phối áo với quần",
              "✨ Phối áo với chân váy",
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
                  {message.imageUrl ? (
                    <div className="chatMessageImage">
                      <Image src={message.imageUrl} alt="Ảnh gửi cho AI" width={180} height={220} unoptimized />
                    </div>
                  ) : null}
                  <p>{message.text}</p>

                  {message.products?.length ? (
                    <div className="chatProducts">
                      {bundleCaption(message) ? (
                        <div className="chatBundleSummaryRow">
                          <div className="chatBundleSummary">{bundleCaption(message)}</div>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button
                              type="button"
                              className="chatTryBundleBtn"
                              onClick={() => void startInChatTryOn(message.products ?? [])}
                              title="Ướm thử ngay trong khung chat"
                              style={{ background: "#fdf2f8", color: "#be185d", borderColor: "#fbcfe8" }}
                            >
                              <Sparkles size={12} />
                              <span>Ướm trong chat</span>
                            </button>
                            <button
                              type="button"
                              className="chatTryBundleBtn"
                              onClick={() => quickTryOnBundle(message.products ?? [])}
                              title="Mở phòng thử đồ AI"
                            >
                              <Camera size={12} />
                              <span>Phòng thử</span>
                            </button>
                          </div>
                        </div>
                      ) : null}
                      {message.products.slice(0, 6).map((product) => {
                        const liked = wishlist.includes(product.id);
                        const activeSize = selectedSizes[product.id] || firstAvailableSize(product);
                        const variantsWithStock = product.variants?.filter((variant) => variant.stock > 0) ?? [];
                        const availableSizesList = variantsWithStock.length
                          ? variantsWithStock.map((variant) => variant.size)
                          : (Array.isArray(product.sizes) ? product.sizes : ["S"]);
                        return (
                          <div className="chatProductCard" key={product.id}>
                            <Link className="chatProductBody" href={`/product/${product.id}`} onClick={() => setOpen(false)}>
                              <div className="chatProductMedia">
                                <Image src={product.image} alt={product.name} width={56} height={70} />
                              </div>
                              <div className="chatProductInfo">
                                <strong>{product.name}</strong>
                                <span className="chatProductPrice">{formatPrice(product.price)}</span>
                                <div className="chatProductSizesRow">
                                  <span className="chatSizeLabel">Size:</span>
                                  <div className="chatSizeChips">
                                    {availableSizesList.slice(0, 4).map((s) => (
                                      <button
                                        key={s}
                                        type="button"
                                        className={`chatSizeChip ${activeSize === s ? "active" : ""}`}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setSelectedSizes((prev) => ({ ...prev, [product.id]: s }));
                                        }}
                                        title={`Chọn size ${s}`}
                                      >
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight size={16} className="chatProductArrow" />
                            </Link>
                            <div className="chatProductActionRow">
                              <button
                                type="button"
                                className="chatAddBtn"
                                onClick={() => quickAdd(product)}
                                aria-label={`Thêm ${product.name} size ${activeSize} vào giỏ`}
                                title={`Thêm size ${activeSize} vào giỏ hàng`}
                              >
                                <ShoppingBag size={13} />
                                <span>Thêm {activeSize}</span>
                              </button>
                              <button
                                type="button"
                                className="chatTryBtn"
                                onClick={() => void startInChatTryOn([product])}
                                aria-label={`Ướm thử ${product.name} trong chat`}
                                title="Ướm thử AI trực tiếp trong khung chat"
                              >
                                <Sparkles size={13} />
                                <span>Ướm thử</span>
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

                  {/* Feature 2: In-Chat Virtual Try-On Result */}
                  {message.tryOnResult ? (
                    <div className="chatTryOnCard">
                      <div className="chatTryOnHeader">
                        <span className="chatTryOnBadge"><Sparkles size={12} /> Ướm thử AI hoàn tất</span>
                        {message.tryOnResult.assessment ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#9333ea" }}>
                            Điểm hợp: {message.tryOnResult.assessment.overallScore}/100
                          </span>
                        ) : null}
                      </div>
                      <div className="chatTryOnImageWrapper">
                        <Image src={message.tryOnResult.imageUrl} alt="Kết quả ướm thử AI" fill unoptimized style={{ objectFit: "contain" }} />
                      </div>
                      {message.tryOnResult.assessment ? (
                        <div className="chatTryOnAssessment">
                          <strong><Bot size={13} /> Stylist nhận xét: {message.tryOnResult.assessment.verdict}</strong>
                          <p style={{ margin: 0 }}>{message.tryOnResult.assessment.summary}</p>
                        </div>
                      ) : null}
                      <div className="chatTryOnActions">
                        <button
                          type="button"
                          className="chatTryOnBtn primary"
                          onClick={() => {
                            const prods = (message.products ?? []).filter(p => message.tryOnResult?.productIds.includes(p.id));
                            openInChatCheckout(prods.length ? prods : (message.products ?? []), message.id);
                          }}
                        >
                          <CreditCard size={13} />
                          <span>Chốt đơn ngay</span>
                        </button>
                        <button
                          type="button"
                          className="chatTryOnBtn secondary"
                          onClick={() => {
                            const bundle = (message.products ?? []).map(p => ({
                              product: p,
                              size: selectedSizes[p.id] || firstAvailableSize(p),
                              quantity: 1
                            }));
                            addBundleToCart(bundle);
                          }}
                        >
                          <ShoppingBag size={13} />
                          <span>Thêm cả set</span>
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* In-Chat Try-On Loading State */}
                  {inChatTryOnLoading && message.role === "assistant" && message.id === messages[messages.length - 1]?.id ? (
                    <div className="chatTryOnCard">
                      <div className="chatTryOnLoading">
                        <div className="chatTryOnSpinner" />
                        <strong style={{ fontSize: 13, color: "#6b21a8" }}>AI Stylist đang ướm trang phục lên dáng của bạn...</strong>
                        <small style={{ color: "#7c3aed" }}>Đang phân tích phom dáng và hòa trộn ánh sáng chân thực...</small>
                      </div>
                    </div>
                  ) : null}

                  {/* Feature 5: Conversational Checkout Inline Card */}
                  {activeCheckoutMessageId === message.id ? (
                    <div className="chatCheckoutCard">
                      <div className="chatCheckoutTitle">
                        <CreditCard size={16} />
                        <span>Xác nhận chốt đơn trực tiếp</span>
                      </div>

                      {completedOrder ? (
                        <div className="chatOrderSuccessBadge">
                          <CheckCircle2 size={24} color="#059669" />
                          <strong>Đặt hàng thành công! Đơn #{completedOrder.id}</strong>
                          <p style={{ margin: "2px 0 6px", fontSize: 11.5 }}>
                            Cảm ơn bạn! Đơn hàng {completedOrder.payment === "cod" ? "COD" : "VietQR"} của bạn đang được chuẩn bị.
                          </p>
                          <Link
                            href={`/orders#order-${completedOrder.id}`}
                            onClick={() => setOpen(false)}
                            style={{ color: "#065f46", textDecoration: "underline", fontWeight: 600, fontSize: 11.5 }}
                          >
                            Xem chi tiết hành trình đơn hàng →
                          </Link>
                        </div>
                      ) : pendingQrOrder ? (
                        <div className="chatVietQrBox">
                          <div className="chatQrListenBadge">
                            <div className="chatQrListenDot" />
                            <span>Đang chờ chuyển khoản VietQR tự động...</span>
                          </div>
                          <div className="chatVietQrImgFrame">
                            <Image
                              src={`https://img.vietqr.io/image/${bankId}-${account}-compact2.png?amount=${pendingQrOrder.total}&addInfo=${encodeURIComponent(pendingQrOrder.id)}&accountName=${encodeURIComponent(accountName)}`}
                              alt="Mã QR thanh toán VietQR"
                              fill
                              unoptimized
                              style={{ objectFit: "contain" }}
                            />
                          </div>
                          <div className="chatQrTable">
                            <div className="chatQrTableRow">
                              <span>Ngân hàng:</span>
                              <strong>{bankId} (Quân Đội)</strong>
                            </div>
                            <div className="chatQrTableRow">
                              <span>Số tài khoản:</span>
                              <div>
                                <strong>{account}</strong>{" "}
                                <button type="button" className="chatCopyMiniBtn" onClick={() => copyToClipboard(account, "account")}>
                                  {copiedKey === "account" ? <Check size={10} /> : <Copy size={10} />}
                                  {copiedKey === "account" ? "Đã chép" : "Chép"}
                                </button>
                              </div>
                            </div>
                            <div className="chatQrTableRow">
                              <span>Chủ tài khoản:</span>
                              <strong>{accountName}</strong>
                            </div>
                            <div className="chatQrTableRow">
                              <span>Số tiền:</span>
                              <strong style={{ color: "#b91c1c" }}>{formatPrice(pendingQrOrder.total)}</strong>
                            </div>
                            <div className="chatQrTableRow" style={{ background: "#fef3c7", padding: "2px 4px", borderRadius: 4 }}>
                              <span>Nội dung CK:</span>
                              <div>
                                <strong style={{ fontFamily: "monospace", color: "#92400e" }}>{pendingQrOrder.id}</strong>{" "}
                                <button type="button" className="chatCopyMiniBtn" onClick={() => copyToClipboard(pendingQrOrder.id, "orderCode")}>
                                  {copiedKey === "orderCode" ? <Check size={10} /> : <Copy size={10} />}
                                  {copiedKey === "orderCode" ? "Đã chép" : "Chép"}
                                </button>
                              </div>
                            </div>
                          </div>
                          <small style={{ color: "#78350f", fontSize: 10.5 }}>
                            Hệ thống sẽ tự động cập nhật ngay khi ngân hàng báo có tiền.
                          </small>
                        </div>
                      ) : (
                        <form onSubmit={submitInChatCheckout} className="chatCheckoutForm">
                          <div className="chatCheckoutItems">
                            {checkoutProducts.map((p) => {
                              const activeSize = selectedSizes[p.id] || firstAvailableSize(p);
                              return (
                                <div key={p.id} className="chatCheckoutItemRow">
                                  <div className="chatCheckoutItemThumb">
                                    <Image src={p.image} alt={p.name} fill sizes="40px" style={{ objectFit: "cover" }} />
                                  </div>
                                  <div className="chatCheckoutItemDetails">
                                    <strong>{p.name}</strong>
                                    <small>Cỡ: {activeSize} · {formatPrice(p.price)}</small>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="chatCheckoutInputRow">
                            <input
                              className="chatCheckoutField"
                              placeholder="Họ và tên người nhận"
                              value={checkoutShipping.name}
                              onChange={(e) => setCheckoutShipping((prev) => ({ ...prev, name: e.target.value }))}
                              required
                            />
                            <input
                              className="chatCheckoutField"
                              placeholder="Số điện thoại"
                              value={checkoutShipping.phone}
                              onChange={(e) => setCheckoutShipping((prev) => ({ ...prev, phone: e.target.value }))}
                              required
                            />
                          </div>
                          <input
                            className="chatCheckoutField"
                            placeholder="Địa chỉ giao hàng chi tiết"
                            value={checkoutShipping.address}
                            onChange={(e) => setCheckoutShipping((prev) => ({ ...prev, address: e.target.value }))}
                            required
                          />
                          <input
                            className="chatCheckoutField"
                            placeholder="Tỉnh / Thành phố"
                            value={checkoutShipping.city}
                            onChange={(e) => setCheckoutShipping((prev) => ({ ...prev, city: e.target.value }))}
                            required
                          />

                          <div className="chatPaymentSelector">
                            <label
                              className={`chatPaymentOption ${checkoutPaymentMethod === "qr" ? "active" : ""}`}
                              onClick={() => setCheckoutPaymentMethod("qr")}
                            >
                              <QrCode size={14} />
                              <span>VietQR Tự động</span>
                            </label>
                            <label
                              className={`chatPaymentOption ${checkoutPaymentMethod === "cod" ? "active" : ""}`}
                              onClick={() => setCheckoutPaymentMethod("cod")}
                            >
                              <Truck size={14} />
                              <span>COD Nhận hàng</span>
                            </label>
                          </div>

                          {(() => {
                            const sub = checkoutProducts.reduce((sum, p) => sum + p.price, 0);
                            const ship = sub >= 699000 ? 0 : 30000;
                            const tot = sub + ship;
                            return (
                              <div className="chatCheckoutTotals">
                                <div className="chatCheckoutTotalRow">
                                  <span>Tạm tính:</span>
                                  <span>{formatPrice(sub)}</span>
                                </div>
                                <div className="chatCheckoutTotalRow">
                                  <span>Phí vận chuyển:</span>
                                  <span>{ship === 0 ? "Miễn phí" : formatPrice(ship)}</span>
                                </div>
                                <div className="chatCheckoutTotalRow final">
                                  <span>Tổng thanh toán:</span>
                                  <span>{formatPrice(tot)}</span>
                                </div>
                              </div>
                            );
                          })()}

                          <button
                            type="submit"
                            disabled={checkoutSubmitting}
                            className="chatConfirmOrderBtn"
                          >
                            {checkoutSubmitting ? <LoaderCircle size={14} className="spin" /> : <Check size={14} />}
                            <span>{checkoutSubmitting ? "Đang tạo đơn..." : "Xác nhận đặt hàng ngay"}</span>
                          </button>
                        </form>
                      )}
                    </div>
                  ) : null}

                  {message.actions?.length ? (
                    <div className="chatAgentActions">
                      {message.actions.map((action) => {
                        const state = actionState[action.id];
                        const isTryOn = action.type === "open_try_on" || action.type === "chat_try_on";
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

                  {/* Feature 6: Thumbs Up / Thumbs Down Feedback Bar */}
                  {message.role === "assistant" && message.id !== "welcome" ? (
                    <div className="chatFeedbackBar">
                      <button
                        type="button"
                        className={`chatFeedbackBtn ${feedbackMap[message.id]?.rating === "thumbs_up" ? "active-up" : ""}`}
                        onClick={() => void sendFeedback(message, "thumbs_up")}
                        title="Gợi ý này rất hợp gu mình"
                      >
                        <ThumbsUp size={12} />
                        <span>Hợp gu</span>
                      </button>
                      <button
                        type="button"
                        className={`chatFeedbackBtn ${feedbackMap[message.id]?.rating === "thumbs_down" ? "active-down" : ""}`}
                        onClick={() => void sendFeedback(message, "thumbs_down")}
                        title="Chưa đúng phong cách mong muốn"
                      >
                        <ThumbsDown size={12} />
                        <span>Chưa hợp</span>
                      </button>

                      {feedbackMap[message.id]?.rating === "thumbs_up" ? (
                        <span className="chatFeedbackToast">✨ Đã ghi nhận gu của bạn</span>
                      ) : null}

                      {openFeedbackChips === message.id ? (
                        <div className="chatFeedbackChips">
                          {[
                            { label: "Chưa đúng gu", code: "style_mismatch" },
                            { label: "Giá hơi cao", code: "price_high" },
                            { label: "Màu chưa thích", code: "color_dislike" },
                            { label: "Sai kích cỡ", code: "size_incorrect" }
                          ].map((chip) => (
                            <button
                              key={chip.code}
                              type="button"
                              className={`chatFeedbackChip ${feedbackMap[message.id]?.reason === chip.label ? "selected" : ""}`}
                              onClick={() => void sendFeedback(message, "thumbs_down", chip.label)}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      ) : feedbackMap[message.id]?.rating === "thumbs_down" && feedbackMap[message.id]?.reason ? (
                        <span className="chatFeedbackToast" style={{ color: "#b45309" }}>
                          📝 Stylist đã ghi nhận: {feedbackMap[message.id]?.reason}
                        </span>
                      ) : null}
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

          {attachedImage ? (
            <div className="chatAttachedPreview">
              <div className="chatAttachedThumb">
                <Image src={attachedImage} alt="Ảnh đính kèm" width={38} height={46} unoptimized />
                <button
                  type="button"
                  className="chatAttachedRemove"
                  onClick={() => setAttachedImage(null)}
                  title="Gỡ ảnh"
                >
                  <X size={12} />
                </button>
              </div>
              <span className="chatAttachedLabel">Đã đính kèm ảnh mẫu (AI Stylist sẽ phân tích gu & phối đồ tương tự)</span>
            </div>
          ) : null}

          <form className="chatForm" onSubmit={handleSubmit}>
            <label className="chatUploadBtn" title="Gửi ảnh mẫu outfit hoặc vóc dáng để AI stylist tư vấn">
              <ImagePlus size={18} />
              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
              />
            </label>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={2000}
              placeholder={attachedImage ? "Nhập thêm yêu cầu (hoặc bấm gửi để AI phân tích ảnh)..." : 'Ví dụ: "tìm set sexy giống ảnh", "thêm cỡ M vào giỏ"...'}
            />
            <button disabled={loading || (!input.trim() && !attachedImage)} aria-label="Gửi">
              <Send size={17} />
            </button>
          </form>
          <div className="chatFoot">{user ? "Trợ lý mua sắm · lịch sử lưu vào tài khoản LSOUL." : "Chế độ khách · lịch sử lưu trên trình duyệt."}</div>
        </aside>
      ) : null}
    </>
  );
}

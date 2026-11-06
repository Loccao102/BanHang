/**
 * Shared Vietnamese labels + visual tones for every status shown in the admin console.
 * Keep all admin pages on this single source so the same value never renders
 * as raw English ("Confirmed", "paid", "pending"...) in one place and Vietnamese in another.
 */
import type { OrderStatus, PaymentStatus } from "@/lib/cart";

export type StatusTone = "success" | "warning" | "error" | "processing" | "info" | "default" | "purple";

export type StatusMeta = { label: string; tone: StatusTone; hint?: string };

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  processing: { label: "Đang xử lý", tone: "processing", hint: "Đơn mới tiếp nhận, chờ kiểm tra và xác nhận" },
  confirmed: { label: "Đã xác nhận", tone: "info", hint: "Đang chuẩn bị hàng, chờ bàn giao vận chuyển" },
  shipping: { label: "Đang giao hàng", tone: "warning", hint: "Đã bàn giao cho đơn vị vận chuyển" },
  completed: { label: "Hoàn tất", tone: "success", hint: "Khách đã nhận hàng thành công" },
  cancelled: { label: "Đã hủy", tone: "error", hint: "Đơn đã bị hủy, không xử lý tiếp" }
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  pending: { label: "Chờ thanh toán", tone: "warning", hint: "Chưa nhận được giao dịch chuyển khoản" },
  paid: { label: "Đã thanh toán", tone: "success", hint: "Tiền đã được ghi nhận" },
  cod_pending: { label: "COD · chờ thu tiền", tone: "processing", hint: "Thu tiền mặt khi giao hàng" },
  failed: { label: "Thanh toán lỗi", tone: "error", hint: "Giao dịch thất bại hoặc sai số tiền" },
  refunded: { label: "Đã hoàn tiền", tone: "purple", hint: "Đã hoàn trả cho khách" }
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  qr: "QR Chuyển khoản",
  cod: "Thanh toán khi nhận (COD)"
};

const PAYMENT_PROVIDER_LABEL: Record<string, string> = {
  sepay: "SePay",
  payos: "payOS",
  cod_collected: "Thu tiền mặt COD",
  development_simulation: "Mô phỏng (dev)",
  qr: "Chuyển khoản QR",
  cod: "COD"
};

export const SOCIAL_STATUS_META: Record<string, StatusMeta> = {
  pending: { label: "Chờ duyệt", tone: "warning" },
  approved: { label: "Đã duyệt", tone: "success" },
  rejected: { label: "Đã từ chối", tone: "error" }
};

export const TRY_ON_STATUS_META: Record<string, StatusMeta> = {
  created: { label: "Mới tạo", tone: "default" },
  processing: { label: "Đang xử lý", tone: "processing" },
  completed: { label: "Thành công", tone: "success" },
  failed: { label: "Thất bại", tone: "error" },
  rejected: { label: "Yêu cầu tạo lại", tone: "warning" }
};

export const AI_FEEDBACK_META: Record<string, StatusMeta> = {
  love: { label: "Rất ưng ý (Yêu thích)", tone: "purple" },
  accurate: { label: "Chuẩn xác / Hợp gu", tone: "success" },
  inaccurate: { label: "Chưa chuẩn / Cần cải thiện", tone: "warning" },
  accepted: { label: "Khách chấp nhận gợi ý", tone: "success" },
  rejected: { label: "Khách bỏ qua / Không thích", tone: "error" },
  thumbs_up: { label: "Đánh giá tích cực", tone: "success" },
  thumbs_down: { label: "Đánh giá chưa tốt", tone: "error" },
  none: { label: "Chưa phản hồi", tone: "default" }
};

export const BEHAVIOR_EVENT_LABELS: Record<string, string> = {
  product_view: "Xem chi tiết sản phẩm",
  search: "Tìm kiếm sản phẩm",
  wishlist_add: "Thêm vào Yêu thích",
  wishlist_remove: "Bỏ khỏi Yêu thích",
  cart_add: "Thêm vào Giỏ hàng",
  cart_remove: "Xóa khỏi Giỏ hàng",
  tryon_start: "Bắt đầu thử đồ AI",
  tryon_success: "Thử đồ AI hoàn tất",
  tryon_retry: "Thử lại phòng thử đồ AI",
  tryon_reject: "Từ chối kết quả thử đồ",
  recommendation_shown: "Hiển thị gợi ý AI",
  recommendation_click: "Nhấn xem gợi ý AI",
  recommendation_accept: "Chấp nhận gợi ý AI",
  recommendation_reject: "Bỏ qua gợi ý AI",
  order_created: "Tạo đơn đặt hàng",
  purchase: "Thanh toán hoàn tất",
  review: "Đánh giá sản phẩm"
};

/** Ordered fulfilment steps used for the progress tracker on the order detail page. */
export const ORDER_FLOW: OrderStatus[] = ["processing", "confirmed", "shipping", "completed"];

const toneClass: Record<StatusTone, string> = {
  success: "antTagSuccess",
  warning: "antTagWarning",
  error: "antTagError",
  processing: "antTagProcessing",
  info: "antTagInfo",
  default: "antTagDefault",
  purple: "antTagPurple"
};

export function tagClass(tone: StatusTone) {
  return `antTag ${toneClass[tone]}`;
}

export function orderStatusMeta(status: string | null | undefined): StatusMeta {
  return ORDER_STATUS_META[status as OrderStatus] ?? { label: status || "Không rõ", tone: "default" };
}

export function paymentStatusMeta(status: string | null | undefined): StatusMeta {
  return PAYMENT_STATUS_META[status as PaymentStatus] ?? { label: status || "Chưa có", tone: "default" };
}

export function socialStatusMeta(status: string | null | undefined): StatusMeta {
  return SOCIAL_STATUS_META[status ?? ""] ?? { label: status || "Không rõ", tone: "default" };
}

export function tryOnStatusMeta(status: string | null | undefined): StatusMeta {
  return TRY_ON_STATUS_META[status ?? ""] ?? { label: status || "Không rõ", tone: "default" };
}

export function aiFeedbackMeta(feedback: string | null | undefined): StatusMeta {
  return AI_FEEDBACK_META[feedback ?? "none"] ?? { label: feedback || "Chưa phản hồi", tone: "default" };
}

export function behaviorEventLabel(eventType: string | null | undefined): string {
  if (!eventType) return "Khác";
  return BEHAVIOR_EVENT_LABELS[eventType] ?? eventType;
}

export function paymentMethodLabel(method: string | null | undefined) {
  return PAYMENT_METHOD_LABEL[method ?? ""] ?? (method || "—");
}

export function paymentProviderLabel(provider: string | null | undefined) {
  if (!provider) return "—";
  return PAYMENT_PROVIDER_LABEL[provider.toLowerCase()] ?? provider;
}

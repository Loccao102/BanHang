export type CouponRules = {
  type: "fixed" | "percentage";
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount?: number;
  startsAt: Date | null;
  endsAt: Date | null;
};

export function validateCouponRules(data: CouponRules): string | null {
  if (data.type !== "fixed" && data.type !== "percentage") return "Loại mã giảm giá không hợp lệ.";
  if (!Number.isSafeInteger(data.value) || data.value < 1 || data.value > 1_000_000_000) return "Giá trị giảm không hợp lệ.";
  if (data.type === "percentage" && data.value > 100) return "Mức giảm phần trăm phải từ 1 đến 100%.";
  if (!Number.isSafeInteger(data.minOrder) || data.minOrder < 0) return "Đơn tối thiểu phải là số nguyên không âm.";
  if (data.maxDiscount !== null && (!Number.isSafeInteger(data.maxDiscount) || data.maxDiscount < 1)) {
    return "Mức giảm tối đa phải là số nguyên dương hoặc để trống.";
  }
  if (data.usageLimit !== null && (!Number.isSafeInteger(data.usageLimit) || data.usageLimit < 1 ||
      data.usageLimit < (data.usedCount ?? 0))) return "Giới hạn lượt dùng không được nhỏ hơn số lượt đã sử dụng.";
  if (data.startsAt !== null && Number.isNaN(data.startsAt.getTime())) return "Ngày bắt đầu không hợp lệ.";
  if (data.endsAt !== null && Number.isNaN(data.endsAt.getTime())) return "Ngày kết thúc không hợp lệ.";
  if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) return "Ngày kết thúc phải sau ngày bắt đầu.";
  return null;
}

export function couponDateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  return new Date(String(value));
}

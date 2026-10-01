import type { Coupon } from "@prisma/client";
import type { CouponState } from "@/lib/cart";

export function couponIsUsable(coupon: Coupon, subtotal: number, now = new Date()) {
  if (!coupon.active) return false;
  if (subtotal < coupon.minOrder) return false;
  if (coupon.startsAt && coupon.startsAt > now) return false;
  if (coupon.endsAt && coupon.endsAt < now) return false;
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return false;
  return true;
}

export function couponDiscount(coupon: Coupon, subtotal: number) {
  const raw = coupon.type === "percentage"
    ? Math.round(subtotal * (coupon.value / 100))
    : coupon.value;
  return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
}

export function publicCoupon(coupon: Coupon): CouponState {
  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrder: coupon.minOrder,
    maxDiscount: coupon.maxDiscount ?? undefined
  };
}

import type { OrderStatus } from "@/lib/cart";

const transitions: Record<OrderStatus, OrderStatus[]> = {
  processing: ["confirmed", "cancelled"],
  confirmed: ["shipping", "cancelled"],
  shipping: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

/** A paid/cancelled/completed order must not be pushed back into an earlier state. */
export function allowedOrderStatuses(current: OrderStatus): OrderStatus[] {
  return [current, ...transitions[current]];
}

export function canTransitionOrderStatus(current: OrderStatus, next: OrderStatus) {
  return allowedOrderStatuses(current).includes(next);
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(transitions, value);
}

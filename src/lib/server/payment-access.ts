// Payment queries must be authorized; local simulation is never payment proof.
export type PaymentActor = { id: string; role: string } | null;

export function canReadPaymentStatus(actor: PaymentActor, orderUserId: string | null): boolean {
  return Boolean(actor && (actor.role === "admin" || (orderUserId && actor.id === orderUserId)));
}

export function canSimulatePayment(
  actor: PaymentActor,
  order: { payment: string; paymentStatus: string; status: string },
  environment: string | undefined
): boolean {
  return environment === "development" &&
    actor?.role === "admin" &&
    order.payment === "qr" &&
    order.paymentStatus !== "paid" &&
    order.status !== "cancelled";
}

/** Admin may record cash collection for completed COD orders, never for QR. */
export function canRecordCodCollection(
  order: { payment: string; paymentStatus: string; status: string },
  requestedStatus?: string
): boolean {
  return order.payment === "cod" &&
    order.paymentStatus !== "paid" &&
    order.status !== "cancelled" &&
    (requestedStatus ?? order.status) === "completed";
}

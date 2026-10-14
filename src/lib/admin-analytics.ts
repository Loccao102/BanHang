export type AnalyticsDays = 7 | 30 | 90;
export function parseAnalyticsDays(value: unknown): AnalyticsDays {
  return value === "7" ? 7 : value === "90" ? 90 : 30;
}
export function isRecognizedPaidOrder(order: {
  status: string;
  paymentStatus: string;
}): boolean {
  return order.status !== "cancelled" && order.paymentStatus === "paid";
}
/** Group dates in UTC to match stored ISO timestamps consistently. */
export function analyticsDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

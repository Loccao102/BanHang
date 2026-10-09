export function validateStockAdjustment(size: unknown, delta: unknown): { size: string; delta: number } | null {
  if (typeof size !== "string") return null;
  const normalizedSize = size.trim().toUpperCase();
  if (!normalizedSize || normalizedSize.length > 20) return null;
  if (typeof delta !== "number" || !Number.isSafeInteger(delta) || delta === 0 || Math.abs(delta) > 1000) return null;
  return { size: normalizedSize, delta };
}

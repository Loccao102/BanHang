import { NextResponse } from "next/server";
import { getPaymentGatewayConfig } from "@/lib/server/payment-gateway";

export const runtime = "nodejs";

export async function GET() {
  const config = getPaymentGatewayConfig();
  return NextResponse.json({
    activeProvider: config.activeProvider,
    sepayConfigured: config.sepayConfigured,
    payosConfigured: config.payosConfigured,
    bankId: config.bankId,
    bankAccount: config.bankAccount,
    bankAccountName: config.bankAccountName
  });
}

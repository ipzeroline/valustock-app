import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getProviderHealth } from "@/lib/market-data-store";
import { getMarketDataProviderPolicy } from "@/lib/market-quotes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const hours = Math.max(1, Math.min(168, Number(request.nextUrl.searchParams.get("hours") || 24)));
  const health = await getProviderHealth(hours);
  return NextResponse.json({
    ...health,
    policy: getMarketDataProviderPolicy(),
  });
}

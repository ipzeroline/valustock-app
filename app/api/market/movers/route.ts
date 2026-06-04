import { NextRequest, NextResponse } from "next/server";
import { getMarketMovers } from "@/lib/market-data-store";
import { sanitizePublicMarketPayload } from "@/lib/public-market-source";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const limit = Math.max(3, Math.min(20, Number(request.nextUrl.searchParams.get("limit") || 8)));
  const movers = await getMarketMovers(limit);

  return NextResponse.json(sanitizePublicMarketPayload(movers), {
    headers: {
      "Cache-Control": "public, max-age=30, stale-while-revalidate=300",
    },
  });
}

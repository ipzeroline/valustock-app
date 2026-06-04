import { NextRequest, NextResponse } from "next/server";
import { getUsdThbRate } from "@/lib/fx-rates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") || undefined;
  const rate = await getUsdThbRate(date);
  return NextResponse.json(rate, {
    headers: {
      "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
    },
  });
}

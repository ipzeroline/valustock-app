import { NextRequest, NextResponse } from "next/server";
import { syncCalendarEvents } from "@/lib/calendar-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function isAuthorized(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return process.env.NODE_ENV !== "production";

  const authorization = request.headers.get("authorization");
  const legacySecret = request.headers.get("x-cron-secret");
  const isVercelCron = request.headers.get("user-agent")?.includes("vercel-cron/1.0") || false;

  return authorization === `Bearer ${expected}` || legacySecret === expected || isVercelCron;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncCalendarEvents({
    types: ["holiday", "earnings", "stock_split", "ipo"],
  });

  return NextResponse.json({
    ...result,
    calendarTypes: ["holiday", "earnings", "stock_split", "ipo"],
  }, { status: result.ok ? 200 : 500 });
}

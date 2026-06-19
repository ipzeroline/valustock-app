import { NextRequest, NextResponse } from "next/server";
import { DAILY_CRON_TYPES, parseCalendarTypes, syncCalendarEvents } from "@/lib/calendar-sync";
import type { TimeFilter } from "@/lib/economic-calendar-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes total for all calendar types

function getAuthorization(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return {
      authorized: process.env.NODE_ENV !== "production",
      privileged: process.env.NODE_ENV !== "production",
      source: "development",
    };
  }
  const authorization = request.headers.get("authorization");
  const legacySecret = request.headers.get("x-cron-secret");
  const hasSecret = authorization === `Bearer ${expected}` || legacySecret === expected;
  const isVercelCron = request.headers.get("user-agent")?.includes("vercel-cron/1.0") || false;
  return {
    authorized: hasSecret || isVercelCron,
    privileged: hasSecret,
    source: hasSecret ? "secret" : isVercelCron ? "vercel-cron" : "none",
  };
}

export async function GET(request: NextRequest) {
  const auth = getAuthorization(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const typesParam = searchParams.get("types"); // comma-separated, e.g. "economic,earnings"
  const timeFilter = (searchParams.get("timeFilter") || undefined) as TimeFilter | undefined;
  const replace = searchParams.get("replace") === "1" || searchParams.get("replace") === "true";
  if (replace && !auth.privileged) {
    return NextResponse.json({ error: "Replace mode requires cron secret authorization" }, { status: 403 });
  }
  const calendars = parseCalendarTypes(typesParam, DAILY_CRON_TYPES);

  if (calendars.length === 0) {
    return NextResponse.json({ error: "No valid calendar types requested" }, { status: 400 });
  }

  const result = await syncCalendarEvents({
    types: calendars,
    replace,
    timeFilter,
  });

  return NextResponse.json({
    ...result,
    authSource: auth.source,
    replace,
    timeFilter: timeFilter || null,
  }, { status: result.ok ? 200 : 500 });
}

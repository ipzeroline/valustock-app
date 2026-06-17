import { NextRequest, NextResponse } from "next/server";
import { closeBrowser, fetchCalendarEvents } from "@/lib/economic-calendar";
import { getMongoDb, ensureMarketDataIndexes } from "@/lib/mongodb";
import type { CalendarType } from "@/lib/economic-calendar-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes total for all calendar types

const ALL_CALENDARS: { type: CalendarType; label: string }[] = [
  { type: "economic", label: "Economic" },
  { type: "holiday", label: "Holiday" },
  { type: "earnings", label: "Earnings" },
  { type: "dividends", label: "Dividends" },
  { type: "stock_split", label: "Stock Split" },
  { type: "ipo", label: "IPO" },
];

const DAILY_CRON_TYPES: CalendarType[] = ["economic", "holiday", "earnings", "stock_split", "ipo"];

const COLLECTIONS: Record<CalendarType, string> = {
  economic: "economic_events",
  holiday: "holiday_events",
  earnings: "earnings_events",
  dividends: "dividend_events",
  stock_split: "stock_split_events",
  ipo: "ipo_events",
};

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
  const replace = searchParams.get("replace") === "1" || searchParams.get("replace") === "true";
  if (replace && !auth.privileged) {
    return NextResponse.json({ error: "Replace mode requires cron secret authorization" }, { status: 403 });
  }
  const calendars = typesParam
    ? ALL_CALENDARS.filter((c) => typesParam.split(",").includes(c.type))
    : ALL_CALENDARS.filter((c) => DAILY_CRON_TYPES.includes(c.type));

  const startedAt = Date.now();
  const results: Array<{
    type: string;
    fetched: number;
    upserted: number;
    deleted: number;
    error?: string;
    durationMs: number;
  }> = [];

  const db = await getMongoDb();
  await ensureMarketDataIndexes();

  for (const cal of calendars) {
    const calStart = Date.now();
    try {
      console.log(`[calendar-sync] Fetching ${cal.type}...`);
      const events = await fetchCalendarEvents({
        calendarType: cal.type,
        timeZone: 27, // GMT+7
      });

      if (replace && events.length === 0) {
        throw new Error("Replace mode refused to overwrite existing data with 0 fetched events");
      }

      // Store to MongoDB
      const collection = db.collection(COLLECTIONS[cal.type]);
      const now = Date.now();
      let deleted = 0;
      let upserted = 0;

      if (replace) {
        const deleteResult = await collection.deleteMany({});
        deleted = deleteResult.deletedCount;
      }

      for (const event of events) {
        const { eventId, date, calendarType, ...rest } = event as any;
        const result = await collection.updateOne(
          { eventId, date },
          { $set: { eventId, date, ...rest, fetchedAt: now } },
          { upsert: true }
        );
        if (result.upsertedCount || result.modifiedCount) upserted++;
      }

      results.push({
        type: cal.type,
        fetched: events.length,
        upserted,
        deleted,
        durationMs: Date.now() - calStart,
      });

      console.log(`[calendar-sync] ${cal.type}: ${events.length} fetched, ${upserted} upserted, ${deleted} deleted`);
    } catch (error: any) {
      console.error(`[calendar-sync] ${cal.type} failed: ${error.message}`);
      results.push({
        type: cal.type,
        fetched: 0,
        upserted: 0,
        deleted: 0,
        error: error.message,
        durationMs: Date.now() - calStart,
      });
    }
  }

  const totalFetched = results.reduce((sum, r) => sum + r.fetched, 0);
  const totalUpserted = results.reduce((sum, r) => sum + r.upserted, 0);
  const totalDeleted = results.reduce((sum, r) => sum + r.deleted, 0);
  const totalDuration = Date.now() - startedAt;

  try {
    return NextResponse.json({
      ok: true,
      authSource: auth.source,
      replace,
      calendars: results.length,
      totalFetched,
      totalUpserted,
      totalDeleted,
      totalDurationMs: totalDuration,
      results,
      updatedAt: new Date().toISOString(),
    });
  } finally {
    await closeBrowser().catch(() => {});
  }
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getMongoDb, ensureMarketDataIndexes } from "@/lib/mongodb";
import { fetchCalendarEvents } from "@/lib/economic-calendar";
import type { CalendarType, TimeFilter } from "@/lib/economic-calendar-types";

const COLLECTIONS: Record<CalendarType, string> = {
  economic: "economic_events",
  holiday: "holiday_events",
  earnings: "earnings_events",
  dividends: "dividend_events",
  stock_split: "stock_split_events",
  ipo: "ipo_events",
};

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const calendarType: CalendarType = body.calendarType || "economic";
    const timeFilter: TimeFilter | undefined = body.timeFilter;
    const importance = body.importance?.length ? body.importance : undefined;

    console.log(`[fetch] Scraping ${calendarType} calendar${timeFilter ? " (" + timeFilter + ")" : ""}...`);

    const events = await fetchCalendarEvents({
      calendarType,
      timeFilter,
      importance,
      timeZone: 27, // GMT+7 Bangkok
    });

    if (events.length === 0) {
      return NextResponse.json({
        success: true,
        fetched: 0,
        upserted: 0,
        calendarType,
        message: `No events returned from investing.com ${calendarType} calendar`,
      });
    }

    const db = await getMongoDb();
    await ensureMarketDataIndexes();

    const collectionName = COLLECTIONS[calendarType];
    const collection = db.collection(collectionName);
    const now = Date.now();
    let upserted = 0;

    for (const event of events) {
      const { eventId, date, calendarType: ct, ...rest } = event as any;
      const result = await collection.updateOne(
        { eventId, date },
        { $set: { eventId, date, ...rest, fetchedAt: now } },
        { upsert: true }
      );
      if (result.upsertedCount || result.modifiedCount) upserted++;
    }

    return NextResponse.json({
      success: true,
      fetched: events.length,
      upserted,
      calendarType,
      collectionName,
      timestamp: now,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;

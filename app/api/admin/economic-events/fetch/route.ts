import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getMongoDb, ensureMarketDataIndexes } from "@/lib/mongodb";
import { closeBrowser, fetchCalendarEvents } from "@/lib/economic-calendar";
import type { CalendarType, TimeFilter } from "@/lib/economic-calendar-types";

const COLLECTIONS: Record<CalendarType, string> = {
  economic: "economic_events",
  holiday: "holiday_events",
  earnings: "earnings_events",
  dividends: "dividend_events",
  stock_split: "stock_split_events",
  ipo: "ipo_events",
};

const ALL_CALENDARS = Object.keys(COLLECTIONS) as CalendarType[];

async function fetchAndStoreCalendar(calendarType: CalendarType, timeFilter?: TimeFilter, importance?: number[], replace?: boolean) {
  console.log(`[fetch] Scraping ${calendarType} calendar${timeFilter ? " (" + timeFilter + ")" : ""}...`);

  const events = await fetchCalendarEvents({
    calendarType,
    timeFilter,
    importance,
    timeZone: 27, // GMT+7 Bangkok
  });

  if (replace && events.length === 0) {
    throw new Error("Replace mode refused to overwrite existing data with 0 fetched events");
  }

  const db = await getMongoDb();
  await ensureMarketDataIndexes();

  const collectionName = COLLECTIONS[calendarType];
  const collection = db.collection(collectionName);
  const now = Date.now();
  let deleted = 0;
  let upserted = 0;

  if (replace) {
    const result = await collection.deleteMany({});
    deleted = result.deletedCount;
  }

  for (const event of events) {
    const { eventId, date, calendarType: ct, ...rest } = event as any;
    const result = await collection.updateOne(
      { eventId, date },
      { $set: { eventId, date, ...rest, fetchedAt: now } },
      { upsert: true }
    );
    if (result.upsertedCount || result.modifiedCount) upserted++;
  }

  return {
    success: true,
    fetched: events.length,
    upserted,
    deleted,
    calendarType,
    collectionName,
    timestamp: now,
  };
}

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const all = Boolean(body.all) || body.calendarType === "all";
    const requestedTypes = Array.isArray(body.calendarTypes) && body.calendarTypes.length
      ? body.calendarTypes
      : [body.calendarType || "economic"];
    const calendarTypes: CalendarType[] = all
      ? ALL_CALENDARS
      : requestedTypes.filter((type: CalendarType) => ALL_CALENDARS.includes(type));
    const timeFilter: TimeFilter | undefined = body.timeFilter;
    const importance = body.importance?.length ? body.importance : undefined;

    if (calendarTypes.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid calendar types requested",
      }, { status: 400 });
    }

    const results = [];
    for (const calendarType of calendarTypes) {
      try {
        results.push(await fetchAndStoreCalendar(calendarType, timeFilter, importance, Boolean(body.replace)));
      } catch (error: any) {
        results.push({
          success: false,
          calendarType,
          fetched: 0,
          upserted: 0,
          deleted: 0,
          error: error?.message || "Failed to fetch calendar data",
        });
      }
    }

    const failed = results.filter((result) => !result.success);
    const fetched = results.reduce((sum, result) => sum + (result.fetched || 0), 0);
    const upserted = results.reduce((sum, result) => sum + (result.upserted || 0), 0);
    const deleted = results.reduce((sum, result) => sum + (result.deleted || 0), 0);

    return NextResponse.json({
      success: failed.length === 0,
      fetched,
      upserted,
      deleted,
      calendarType: calendarTypes.length === 1 ? calendarTypes[0] : "all",
      results,
      errors: failed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch calendar data" },
      { status: 500 }
    );
  } finally {
    await closeBrowser().catch(() => {});
  }
}

export const maxDuration = 300;

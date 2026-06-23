import { closeBrowser, fetchCalendarEvents } from "@/lib/economic-calendar";
import { getMongoDb, ensureMarketDataIndexes } from "@/lib/mongodb";
import type { CalendarType, TimeFilter } from "@/lib/economic-calendar-types";

export const ALL_CALENDARS: { type: CalendarType; label: string }[] = [
  { type: "economic", label: "Economic" },
  { type: "holiday", label: "Holiday" },
  { type: "earnings", label: "Earnings" },
  { type: "dividends", label: "Dividends" },
  { type: "stock_split", label: "Stock Split" },
  { type: "ipo", label: "IPO" },
];

export const DAILY_CRON_TYPES: CalendarType[] = ["economic", "holiday", "earnings", "dividends", "stock_split", "ipo"];

export const CALENDAR_COLLECTIONS: Record<CalendarType, string> = {
  economic: "economic_events",
  holiday: "holiday_events",
  earnings: "earnings_events",
  dividends: "dividend_events",
  stock_split: "stock_split_events",
  ipo: "ipo_events",
};

export type CalendarSyncResult = {
  type: CalendarType;
  fetched: number;
  upserted: number;
  deleted: number;
  error?: string;
  durationMs: number;
};

type CalendarSyncOptions = {
  types: CalendarType[];
  replace?: boolean;
  timeFilter?: TimeFilter;
};

export async function syncCalendarEvents(options: CalendarSyncOptions) {
  const startedAt = Date.now();
  const results: CalendarSyncResult[] = [];
  const db = await getMongoDb();
  await ensureMarketDataIndexes();

  try {
    for (const calendarType of options.types) {
      const calStart = Date.now();
      try {
        console.log(`[calendar-sync] Fetching ${calendarType}${options.timeFilter ? " (" + options.timeFilter + ")" : ""}...`);
        const events = await fetchCalendarEvents({
          calendarType,
          timeFilter: options.timeFilter,
          importance: calendarType === "economic" ? [1, 2, 3] : undefined,
          timeZone: 27,
        });

        if (options.replace && events.length === 0) {
          throw new Error("Replace mode refused to overwrite existing data with 0 fetched events");
        }

        const collection = db.collection(CALENDAR_COLLECTIONS[calendarType]);
        const now = Date.now();
        let deleted = 0;
        let upserted = 0;

        if (options.replace) {
          const deleteResult = await collection.deleteMany({});
          deleted = deleteResult.deletedCount;
        }

        for (const event of events) {
          const { eventId, date, calendarType: _calendarType, ...rest } = event as any;
          const result = await collection.updateOne(
            { eventId, date },
            { $set: { eventId, date, ...rest, fetchedAt: now } },
            { upsert: true }
          );
          if (result.upsertedCount || result.modifiedCount) upserted++;
        }

        results.push({
          type: calendarType,
          fetched: events.length,
          upserted,
          deleted,
          durationMs: Date.now() - calStart,
        });

        console.log(`[calendar-sync] ${calendarType}: ${events.length} fetched, ${upserted} upserted, ${deleted} deleted`);
      } catch (error: any) {
        console.error(`[calendar-sync] ${calendarType} failed: ${error.message}`);
        results.push({
          type: calendarType,
          fetched: 0,
          upserted: 0,
          deleted: 0,
          error: error.message,
          durationMs: Date.now() - calStart,
        });
      }
    }
  } finally {
    await closeBrowser().catch(() => {});
  }

  const totalFetched = results.reduce((sum, result) => sum + result.fetched, 0);
  const totalUpserted = results.reduce((sum, result) => sum + result.upserted, 0);
  const totalDeleted = results.reduce((sum, result) => sum + result.deleted, 0);
  const failures = results.filter((result) => result.error);

  return {
    ok: failures.length === 0 && totalFetched > 0,
    calendars: results.length,
    totalFetched,
    totalUpserted,
    totalDeleted,
    totalDurationMs: Date.now() - startedAt,
    results,
    failures,
    updatedAt: new Date().toISOString(),
  };
}

export function parseCalendarTypes(typesParam: string | null, fallback: CalendarType[]) {
  if (!typesParam) return fallback;
  const requestedTypes = typesParam.split(",").map((type) => type.trim());
  return ALL_CALENDARS
    .map((calendar) => calendar.type)
    .filter((type) => requestedTypes.includes(type));
}

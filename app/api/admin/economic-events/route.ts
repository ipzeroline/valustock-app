import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getMongoDb, ensureMarketDataIndexes } from "@/lib/mongodb";
import { syncCalendarEvents } from "@/lib/calendar-sync";
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
const AUTO_SYNC_MAX_AGE_MS = 6 * 60 * 60 * 1000;

function getCollection(calendarType: string): string {
  return COLLECTIONS[calendarType as CalendarType] || "economic_events";
}

async function getLatestFetchedAt(collection: any) {
  const latest = await collection
    .find({ fetchedAt: { $type: "number" } }, { projection: { fetchedAt: 1 } })
    .sort({ fetchedAt: -1 })
    .limit(1)
    .next();
  return typeof latest?.fetchedAt === "number" ? latest.fetchedAt : 0;
}

export async function GET(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    await ensureMarketDataIndexes();
    const db = await getMongoDb();

    const { searchParams } = new URL(req.url);
    const calendarType = (searchParams.get("calendarType") || "economic") as CalendarType;
    const country = searchParams.get("country");
    const currency = searchParams.get("currency");
    const minImportance = parseInt(searchParams.get("minImportance") || "0", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "500", 10), 2000);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const timeFilter = searchParams.get("timeFilter") as TimeFilter | null;
    const autoSync = searchParams.get("autoSync") === "1";

    const collectionName = getCollection(calendarType);
    const collection = db.collection(collectionName);

    const filter: any = {};
    if (country) filter.country = country;
    if (currency) filter.currency = currency.toUpperCase();
    if (minImportance > 0) filter.importance = { $gte: minImportance };

    // Apply time filter based on event date
    if (timeFilter) {
      const now = new Date();
      const nowTs = Math.floor(now.getTime() / 1000);
      const dayStart = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000);
      const dayEnd = dayStart + 86400;

      switch (timeFilter) {
        case "yesterday":
          filter.date = { $gte: dayStart - 86400, $lt: dayStart };
          break;
        case "today":
          filter.date = { $gte: dayStart, $lt: dayEnd };
          break;
        case "tomorrow":
          filter.date = { $gte: dayEnd, $lt: dayEnd + 86400 };
          break;
        case "thisWeek": {
          const dayOfWeek = now.getDay();
          const weekStart = dayStart - (dayOfWeek * 86400);
          const weekEnd = weekStart + 7 * 86400;
          filter.date = { $gte: weekStart, $lt: weekEnd };
          break;
        }
        case "nextWeek": {
          const dayOfWeek = now.getDay();
          const thisWeekStart = dayStart - (dayOfWeek * 86400);
          const nextWeekStart = thisWeekStart + 7 * 86400;
          const nextWeekEnd = nextWeekStart + 7 * 86400;
          filter.date = { $gte: nextWeekStart, $lt: nextWeekEnd };
          break;
        }
      }
    }

    let total = await collection.countDocuments(filter);
    let syncResult = null;

    if (autoSync && page === 1) {
      const latestFetchedAt = await getLatestFetchedAt(collection);
      const stale = !latestFetchedAt || Date.now() - latestFetchedAt > AUTO_SYNC_MAX_AGE_MS;
      if (stale || total === 0) {
        syncResult = await syncCalendarEvents({
          types: [calendarType],
          timeFilter: timeFilter || undefined,
        });
        total = await collection.countDocuments(filter);
      }
    }

    const events = await collection
      .find(filter)
      .sort({ date: -1, time: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Aggregate summary
    const [summary] = await collection
      .aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            countries: { $addToSet: "$country" },
            currencies: { $addToSet: "$currency" },
            highImportance: { $sum: { $cond: [{ $eq: ["$importance", 3] }, 1, 0] } },
            mediumImportance: { $sum: { $cond: [{ $eq: ["$importance", 2] }, 1, 0] } },
            lowImportance: { $sum: { $cond: [{ $eq: ["$importance", 1] }, 1, 0] } },
            latestFetchedAt: { $max: "$fetchedAt" },
            oldestEventDay: { $min: "$date" },
            newestEventDay: { $max: "$date" },
          },
        },
      ])
      .toArray();

    return NextResponse.json({
      events,
      total,
      page,
      limit,
      calendarType,
      collectionName,
      summary: summary || null,
      autoSync: syncResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export const maxDuration = 300;

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const db = await getMongoDb();
    const { searchParams } = new URL(req.url);
    const calendarType = searchParams.get("calendarType") || "economic";
    const olderThan = searchParams.get("olderThan");

    if (calendarType === "all") {
      const results = [];
      for (const type of ALL_CALENDARS) {
        const collectionName = getCollection(type);
        const collection = db.collection(collectionName);
        const result = olderThan
          ? await collection.deleteMany({ fetchedAt: { $lt: parseInt(olderThan, 10) } })
          : await collection.deleteMany({});
        results.push({ calendarType: type, collectionName, deleted: result.deletedCount });
      }

      return NextResponse.json({
        deleted: results.reduce((sum, result) => sum + result.deleted, 0),
        calendarType: "all",
        results,
      });
    }

    const collectionName = getCollection(calendarType);
    const collection = db.collection(collectionName);

    if (olderThan) {
      const result = await collection.deleteMany({ fetchedAt: { $lt: parseInt(olderThan, 10) } });
      return NextResponse.json({ deleted: result.deletedCount, collectionName });
    }

    const result = await collection.deleteMany({});
    return NextResponse.json({ deleted: result.deletedCount, collectionName });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete events" },
      { status: 500 }
    );
  }
}

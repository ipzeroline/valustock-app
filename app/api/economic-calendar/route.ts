import { NextResponse } from "next/server";
import { requireMember } from "@/lib/member-auth";
import { query } from "@/lib/db";
import { getMongoDb, ensureMarketDataIndexes } from "@/lib/mongodb";
import { planAllows } from "@/lib/plans";
import type { CalendarType, TimeFilter } from "@/lib/economic-calendar-types";
import type { PlanId } from "@/lib/types";

const COLLECTIONS: Record<CalendarType, string> = {
  economic: "economic_events",
  holiday: "holiday_events",
  earnings: "earnings_events",
  dividends: "dividend_events",
  stock_split: "stock_split_events",
  ipo: "ipo_events",
};

function getCollection(calendarType: string) {
  return COLLECTIONS[calendarType as CalendarType] || "economic_events";
}

function buildDateFilter(timeFilter: TimeFilter | null) {
  if (!timeFilter) return null;
  const now = new Date();
  const dayStart = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000);
  const dayEnd = dayStart + 86400;

  if (timeFilter === "yesterday") return { $gte: dayStart - 86400, $lt: dayStart };
  if (timeFilter === "today") return { $gte: dayStart, $lt: dayEnd };
  if (timeFilter === "tomorrow") return { $gte: dayEnd, $lt: dayEnd + 86400 };

  const dayOfWeek = now.getDay();
  const weekStart = dayStart - dayOfWeek * 86400;
  if (timeFilter === "thisWeek") return { $gte: weekStart, $lt: weekStart + 7 * 86400 };
  if (timeFilter === "nextWeek") return { $gte: weekStart + 7 * 86400, $lt: weekStart + 14 * 86400 };
  return null;
}

export async function GET(req: Request) {
  const { error, member } = await requireMember(req);
  if (error) return error;

  const rows = await query<{ plan: PlanId; billing: string }[]>(
    "SELECT plan, billing FROM users WHERE email = ? LIMIT 1",
    [member.email]
  );
  const plan = (rows[0]?.billing === "lifetime" ? "lifetime" : rows[0]?.plan || "free") as PlanId;
  if (!planAllows(plan, "premium")) {
    return NextResponse.json(
      { error: "Economic calendar requires Premium or Lifetime access", requiredPlan: "premium" },
      { status: 403 }
    );
  }

  try {
    await ensureMarketDataIndexes();
    const db = await getMongoDb();
    const { searchParams } = new URL(req.url);
    const calendarType = (searchParams.get("calendarType") || "economic") as CalendarType;
    const timeFilter = searchParams.get("timeFilter") as TimeFilter | null;
    const country = searchParams.get("country");
    const currency = searchParams.get("currency");
    const minImportance = parseInt(searchParams.get("minImportance") || "0", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "120", 10), 500);

    const collectionName = getCollection(calendarType);
    const collection = db.collection(collectionName);
    const filter: any = {};
    const dateFilter = buildDateFilter(timeFilter);
    if (dateFilter) filter.date = dateFilter;
    if (country) filter.country = country;
    if (currency) filter.currency = currency.toUpperCase();
    if (minImportance > 0) filter.importance = { $gte: minImportance };

    const [summary] = await collection.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          countries: { $addToSet: "$country" },
          currencies: { $addToSet: "$currency" },
          highImportance: { $sum: { $cond: [{ $eq: ["$importance", 3] }, 1, 0] } },
          latestFetchedAt: { $max: "$fetchedAt" },
          oldestEventDay: { $min: "$date" },
          newestEventDay: { $max: "$date" },
        },
      },
    ]).toArray();

    const events = await collection
      .find(filter)
      .sort({ date: 1, time: 1, importance: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      calendarType,
      collectionName,
      events,
      total: summary?.total || 0,
      summary: summary || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load economic calendar" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getPlanForEmail } from "@/lib/entitlements";
import { getMongoDb, ensureMarketDataIndexes } from "@/lib/mongodb";
import { planAllows } from "@/lib/plans";
import { getTelegramMiniMember } from "@/lib/telegram-mini";
import type { CalendarType, TimeFilter } from "@/lib/economic-calendar-types";

const COLLECTIONS: Record<CalendarType, string> = {
  economic: "economic_events",
  holiday: "holiday_events",
  earnings: "earnings_events",
  dividends: "dividend_events",
  stock_split: "stock_split_events",
  ipo: "ipo_events",
};

function buildDateFilter(timeFilter: TimeFilter | null) {
  const now = new Date();
  const dayStart = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000);
  const dayEnd = dayStart + 86400;

  if (timeFilter === "today") return { $gte: dayStart, $lt: dayEnd };
  if (timeFilter === "tomorrow") return { $gte: dayEnd, $lt: dayEnd + 86400 };
  if (timeFilter === "yesterday") return { $gte: dayStart - 86400, $lt: dayStart };

  const dayOfWeek = now.getDay();
  const weekStart = dayStart - dayOfWeek * 86400;
  if (timeFilter === "nextWeek") return { $gte: weekStart + 7 * 86400, $lt: weekStart + 14 * 86400 };
  return { $gte: weekStart, $lt: weekStart + 7 * 86400 };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const member = await getTelegramMiniMember(body.initData);
  if (!member) {
    return NextResponse.json({ error: "Telegram Mini App authentication failed" }, { status: 401 });
  }

  const plan = await getPlanForEmail(member.email);
  if (!planAllows(plan.id, "premium")) {
    return NextResponse.json({ error: "Economic Calendar requires Premium or Lifetime", requiredPlan: "premium" }, { status: 403 });
  }

  const calendarType = (body.calendarType || "economic") as CalendarType;
  const timeFilter = (body.timeFilter || "thisWeek") as TimeFilter;
  const collectionName = COLLECTIONS[calendarType] || "economic_events";
  const limit = Math.min(Number(body.limit || 8), 20);

  await ensureMarketDataIndexes();
  const db = await getMongoDb();
  const filter: any = { date: buildDateFilter(timeFilter) };

  if (calendarType === "economic") filter.importance = { $gte: 2 };

  const events = await db.collection(collectionName)
    .find(filter)
    .sort({ date: 1, time: 1, importance: -1 })
    .limit(limit)
    .project({
      eventId: 1,
      date: 1,
      time: 1,
      country: 1,
      currency: 1,
      name: 1,
      importance: 1,
      actual: 1,
      forecast: 1,
      previous: 1,
      fetchedAt: 1,
    })
    .toArray();

  return NextResponse.json({
    calendarType,
    timeFilter,
    events,
    total: events.length,
    generatedAt: new Date().toISOString(),
  });
}

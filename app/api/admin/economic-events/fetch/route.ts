import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
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

    if (calendarTypes.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid calendar types requested",
      }, { status: 400 });
    }

    const syncResult = await syncCalendarEvents({
      types: calendarTypes,
      timeFilter,
      replace: Boolean(body.replace),
    });

    const results = syncResult.results.map((result) => ({
      success: !result.error,
      calendarType: result.type,
      collectionName: COLLECTIONS[result.type],
      fetched: result.fetched,
      upserted: result.upserted,
      deleted: result.deleted,
      error: result.error,
      durationMs: result.durationMs,
    }));

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
      durationMs: syncResult.totalDurationMs,
      updatedAt: syncResult.updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}

export const maxDuration = 300;

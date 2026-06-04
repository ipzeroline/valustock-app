/**
 * Economic Calendar — Shared Types & Constants
 * Safe for both client and server components.
 */

// ── Calendar Types ──────────────────────────────────────────────────────────

export type CalendarType =
  | "economic"
  | "holiday"
  | "earnings"
  | "dividends"
  | "stock_split"
  | "ipo";

export const CALENDAR_TYPES: { key: CalendarType; labelTh: string; labelEn: string; path: string }[] = [
  { key: "economic", labelTh: "ปฏิทินเศรษฐกิจ", labelEn: "Economic", path: "/economic-calendar/" },
  { key: "holiday", labelTh: "วันหยุดราชการ", labelEn: "Holiday", path: "/holiday-calendar/" },
  { key: "earnings", labelTh: "ผลกำไร", labelEn: "Earnings", path: "/earnings-calendar/" },
  { key: "dividends", labelTh: "เงินปันผล", labelEn: "Dividends", path: "/dividends-calendar/" },
  { key: "stock_split", labelTh: "แตกหุ้น", labelEn: "Stock Split", path: "/stock-split-calendar/" },
  { key: "ipo", labelTh: "IPO", labelEn: "IPO", path: "/ipo-calendar/" },
];

// ── Time Filters ────────────────────────────────────────────────────────────

export type TimeFilter = "yesterday" | "today" | "tomorrow" | "thisWeek" | "nextWeek";

export const TIME_FILTERS: { key: TimeFilter; labelTh: string; labelEn: string }[] = [
  { key: "yesterday", labelTh: "เมื่อวาน", labelEn: "Yesterday" },
  { key: "today", labelTh: "วันนี้", labelEn: "Today" },
  { key: "tomorrow", labelTh: "พรุ่งนี้", labelEn: "Tomorrow" },
  { key: "thisWeek", labelTh: "สัปดาห์นี้", labelEn: "This Week" },
  { key: "nextWeek", labelTh: "สัปดาห์หน้า", labelEn: "Next Week" },
];

// ── Event Types ─────────────────────────────────────────────────────────────

export type EconomicImportance = 1 | 2 | 3;

export interface CalendarEventBase {
  calendarType: CalendarType;
  eventId: string;
  date: number; // Unix timestamp (seconds)
  time: string;
  country: string;
  currency: string;
  name: string;
  importance: EconomicImportance;
  fetchedAt: number;
}

export interface EconomicEvent extends CalendarEventBase {
  calendarType: "economic";
  actual: string | null;
  forecast: string | null;
  previous: string | null;
}

export interface HolidayEvent extends CalendarEventBase {
  calendarType: "holiday";
  exchange: string;
  holidayName: string;
}

export interface EarningsEvent extends CalendarEventBase {
  calendarType: "earnings";
  eps: string | null;
  epsForecast: string | null;
  revenue: string | null;
  revenueForecast: string | null;
  marketCap: string | null;
  lastPrice: string | null;
}

export interface DividendEvent extends CalendarEventBase {
  calendarType: "dividends";
  exDividendDate: string;
  dividend: string;
  dividendType: string;
  paymentDate: string;
  dividendYield: string | null;
}

export interface StockSplitEvent extends CalendarEventBase {
  calendarType: "stock_split";
  splitRatio: string;
}

export interface IPOEvent extends CalendarEventBase {
  calendarType: "ipo";
  exchange: string;
  ipoValue: string | null;
  ipoPrice: string | null;
  lastPrice: string | null;
}

export type CalendarEvent =
  | EconomicEvent
  | HolidayEvent
  | EarningsEvent
  | DividendEvent
  | StockSplitEvent
  | IPOEvent;

// ── Fetch Params ────────────────────────────────────────────────────────────

export interface FetchCalendarParams {
  calendarType?: CalendarType;
  timeFilter?: TimeFilter;
  countries?: number[];
  importance?: number[];
  timeZone?: number;
}

// ── Country & Timezone IDs ──────────────────────────────────────────────────

export const COUNTRY_IDS: Record<string, number> = {
  US: 5, GB: 4, EU: 72, JP: 35, CN: 37, DE: 17, FR: 22, IT: 10,
  ES: 26, CH: 12, AU: 25, NZ: 43, CA: 6, KR: 11, IN: 14, BR: 32,
  TH: 41, SG: 36, HK: 39, TW: 46, MY: 42, ID: 48, PH: 45, VN: 178,
};

export const TIMEZONE_IDS: Record<string, number> = {
  "UTC": 55, "GMT+7": 27, "GMT+8": 28, "GMT+9": 29,
  "GMT-4": 8, "GMT-5": 7, "GMT+1": 15, "GMT+2": 16,
};

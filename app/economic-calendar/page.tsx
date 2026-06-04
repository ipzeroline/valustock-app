"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LockedCard } from "@/components/Paywall";
import { useCurrentPlan, useStore } from "@/lib/store";
import { useTranslation } from "@/lib/translations";
import { planAllows } from "@/lib/plans";
import {
  CALENDAR_TYPES,
  TIME_FILTERS,
  type CalendarType,
  type TimeFilter,
} from "@/lib/economic-calendar-types";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Crown,
  Globe,
  RefreshCw,
  Zap,
} from "@/lib/icons";

type CalendarEventRow = {
  _id?: string;
  eventId?: string;
  date: number;
  time?: string;
  country?: string;
  currency?: string;
  name?: string;
  importance?: number;
  actual?: string | null;
  forecast?: string | null;
  previous?: string | null;
  exchange?: string;
  holidayName?: string;
  eps?: string | null;
  epsForecast?: string | null;
  revenue?: string | null;
  revenueForecast?: string | null;
  dividend?: string;
  dividendYield?: string | null;
  splitRatio?: string;
  ipoValue?: string | null;
  ipoPrice?: string | null;
};

type CalendarPayload = {
  events: CalendarEventRow[];
  total: number;
  summary: {
    total: number;
    countries?: string[];
    currencies?: string[];
    highImportance?: number;
    latestFetchedAt?: number;
    oldestEventDay?: number;
    newestEventDay?: number;
  } | null;
};

function formatDate(ts: number, lang: "th" | "en") {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTimeAgo(ms: number | undefined, lang: "th" | "en") {
  if (!ms) return "-";
  const minutes = Math.max(0, Math.floor((Date.now() - ms) / 60000));
  if (minutes < 1) return lang === "th" ? "เมื่อสักครู่" : "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function importanceTone(value?: number): "up" | "gold" | "down" | "muted" {
  if (value === 3) return "up";
  if (value === 2) return "gold";
  if (value === 1) return "muted";
  return "muted";
}

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  CNY: "🇨🇳",
  AUD: "🇦🇺",
  NZD: "🇳🇿",
  CAD: "🇨🇦",
  CHF: "🇨🇭",
  THB: "🇹🇭",
  SGD: "🇸🇬",
  HKD: "🇭🇰",
  KRW: "🇰🇷",
  INR: "🇮🇳",
  BRL: "🇧🇷",
  IDR: "🇮🇩",
  MYR: "🇲🇾",
  PHP: "🇵🇭",
  VND: "🇻🇳",
};

const COUNTRY_CODES: Array<[RegExp, string]> = [
  [/argentina|อาร์เจนตินา/i, "AR"],
  [/australia|ออสเตรเลีย/i, "AU"],
  [/austria|ออสเตรีย/i, "AT"],
  [/belgium|เบลเยียม/i, "BE"],
  [/brazil|บราซิล/i, "BR"],
  [/canada|แคนาดา/i, "CA"],
  [/chile|ชิลี/i, "CL"],
  [/china|จีน/i, "CN"],
  [/colombia|โคลอมเบีย/i, "CO"],
  [/czech|เช็ก|สาธารณรัฐเช็ก/i, "CZ"],
  [/denmark|เดนมาร์ก/i, "DK"],
  [/euro zone|euro area|european union|eurozone|ยุโรป|ยูโรโซน/i, "EU"],
  [/finland|ฟินแลนด์/i, "FI"],
  [/france|ฝรั่งเศส/i, "FR"],
  [/germany|เยอรมนี|เยอรมัน/i, "DE"],
  [/greece|กรีซ/i, "GR"],
  [/hong kong|ฮ่องกง/i, "HK"],
  [/hungary|ฮังการี/i, "HU"],
  [/india|อินเดีย/i, "IN"],
  [/indonesia|อินโด/i, "ID"],
  [/ireland|ไอร์แลนด์/i, "IE"],
  [/israel|อิสราเอล/i, "IL"],
  [/italy|อิตาลี/i, "IT"],
  [/japan|ญี่ปุ่น/i, "JP"],
  [/malaysia|มาเลเซีย/i, "MY"],
  [/mexico|เม็กซิโก/i, "MX"],
  [/netherlands|holland|เนเธอร์แลนด์|ฮอลแลนด์/i, "NL"],
  [/new zealand|นิวซีแลนด์/i, "NZ"],
  [/norway|นอร์เวย์/i, "NO"],
  [/philippines|ฟิลิป/i, "PH"],
  [/poland|โปแลนด์/i, "PL"],
  [/portugal|โปรตุเกส/i, "PT"],
  [/romania|โรมาเนีย/i, "RO"],
  [/russia|รัสเซีย/i, "RU"],
  [/saudi arabia|ซาอุดี|ซาอุ/i, "SA"],
  [/singapore|สิงคโปร์/i, "SG"],
  [/south africa|แอฟริกาใต้/i, "ZA"],
  [/south korea|korea|เกาหลี/i, "KR"],
  [/spain|สเปน/i, "ES"],
  [/sweden|สวีเดน/i, "SE"],
  [/switzerland|สวิต/i, "CH"],
  [/taiwan|ไต้หวัน/i, "TW"],
  [/thailand|ไทย/i, "TH"],
  [/turkey|ตุรกี/i, "TR"],
  [/united kingdom|great britain|britain|uk|อังกฤษ|สหราชอาณาจักร/i, "GB"],
  [/united states|usa|u\.s\.|us|สหรัฐ/i, "US"],
  [/vietnam|เวียดนาม/i, "VN"],
];

function codeToFlag(code: string) {
  if (code === "EU") return "🇪🇺";
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return code
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function countryFlag(country?: string, currency?: string) {
  const countryText = (country || "").trim();
  const directCode = countryText.toUpperCase();
  const matchedCode = COUNTRY_CODES.find(([pattern]) => pattern.test(countryText))?.[1];
  return codeToFlag(matchedCode || directCode) || CURRENCY_FLAGS[(currency || "").toUpperCase()] || "🌐";
}

function countryLabel(event: CalendarEventRow) {
  return event.country || event.currency || event.exchange || "-";
}

function impactLabel(value: number | undefined, lang: "th" | "en") {
  if (value === 3) return lang === "th" ? "แรง" : "High";
  if (value === 2) return lang === "th" ? "กลาง" : "Med";
  if (value === 1) return lang === "th" ? "เบา" : "Low";
  return "-";
}

function eventMeta(event: CalendarEventRow, type: CalendarType) {
  if (type === "economic") {
    return [
      event.actual ? `Act ${event.actual}` : null,
      event.forecast ? `Fcst ${event.forecast}` : null,
      event.previous ? `Prev ${event.previous}` : null,
    ].filter(Boolean).join(" · ");
  }
  if (type === "holiday") return event.exchange || event.holidayName || "";
  if (type === "earnings") {
    return [
      event.eps ? `EPS ${event.eps}` : null,
      event.epsForecast ? `Fcst ${event.epsForecast}` : null,
      event.revenue ? `Rev ${event.revenue}` : null,
    ].filter(Boolean).join(" · ");
  }
  if (type === "dividends") {
    return [event.dividend ? `Div ${event.dividend}` : null, event.dividendYield ? `Yield ${event.dividendYield}` : null]
      .filter(Boolean)
      .join(" · ");
  }
  if (type === "stock_split") return event.splitRatio ? `Split ${event.splitRatio}` : "";
  if (type === "ipo") {
    return [event.exchange, event.ipoPrice ? `Price ${event.ipoPrice}` : null, event.ipoValue ? `Value ${event.ipoValue}` : null]
      .filter(Boolean)
      .join(" · ");
  }
  return "";
}

export default function EconomicCalendarPage() {
  const plan = useCurrentPlan();
  const { authToken } = useStore();
  const { lang } = useTranslation();
  const canAccess = planAllows(plan.id, "premium");
  const [activeType, setActiveType] = useState<CalendarType>("economic");
  const [timeFilter, setTimeFilter] = useState<TimeFilter | "thisWeek">("thisWeek");
  const [minImportance, setMinImportance] = useState(0);
  const [data, setData] = useState<CalendarPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeLabel = useMemo(() => {
    const item = CALENDAR_TYPES.find((type) => type.key === activeType);
    return item ? (lang === "th" ? item.labelTh : item.labelEn) : activeType;
  }, [activeType, lang]);

  const loadCalendar = async () => {
    if (!authToken || !canAccess) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        calendarType: activeType,
        limit: "160",
      });
      if (timeFilter) params.set("timeFilter", timeFilter);
      if (minImportance > 0) params.set("minImportance", String(minImportance));
      const res = await fetch(`/api/economic-calendar?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to load calendar");
      setData(payload);
    } catch (err: any) {
      setError(err.message || "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, timeFilter, minImportance, authToken, canAccess]);

  if (!canAccess) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-gold/35 bg-gold/10 p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-black text-ink">
                {lang === "th" ? "ปฏิทินเศรษฐกิจสำหรับสมาชิก Premium" : "Premium Economic Calendar"}
              </h1>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-muted">
                {lang === "th"
                  ? "ติดตามตัวเลขเศรษฐกิจ วันหยุดตลาด ผลประกอบการ ปันผล แตกหุ้น และ IPO ในที่เดียว เหมาะสำหรับจัดจังหวะติดตามพอร์ตและข่าวมหภาค"
                  : "Track macro events, market holidays, earnings, dividends, stock splits, and IPOs in one portfolio-ready workspace."}
              </p>
            </div>
          </div>
        </section>
        <LockedCard
          required="premium"
          title={lang === "th" ? "ปลดล็อกปฏิทินเศรษฐกิจ" : "Unlock Economic Calendar"}
          desc={
            lang === "th"
              ? "ฟีเจอร์นี้รวมอยู่ในแพ็กเกจ Premium และ Lifetime เพื่อช่วยติดตามเหตุการณ์ที่กระทบพอร์ตและ watchlist"
              : "Included in Premium and Lifetime for tracking events that may affect portfolios and watchlists."
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-black text-gold">
              <Crown className="h-3.5 w-3.5" />
              {lang === "th" ? "Premium / Lifetime" : "Premium / Lifetime"}
            </div>
            <h1 className="mt-3 font-display text-3xl font-black text-ink">
              {lang === "th" ? "ปฏิทินเศรษฐกิจ" : "Economic Calendar"}
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-muted">
              {lang === "th"
                ? "รวมเหตุการณ์เศรษฐกิจ วันหยุดตลาด ผลประกอบการ ปันผล แตกหุ้น และ IPO สำหรับใช้ประกอบการติดตามพอร์ต"
                : "Macro events, market holidays, earnings, dividends, stock splits, and IPOs for active portfolio monitoring."}
            </p>
          </div>
          <Button variant="outline" onClick={loadCalendar} disabled={loading || !authToken}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {lang === "th" ? "โหลดใหม่" : "Refresh"}
          </Button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <MiniSummaryCard icon={Calendar} label={lang === "th" ? "รายการ" : "Events"} value={data?.total || 0} />
        <MiniSummaryCard icon={AlertTriangle} label={lang === "th" ? "สำคัญสูง" : "High impact"} value={data?.summary?.highImportance || 0} tone="gold" />
        <MiniSummaryCard icon={Globe} label={lang === "th" ? "ประเทศ" : "Countries"} value={data?.summary?.countries?.filter(Boolean).length || 0} />
        <MiniSummaryCard icon={Clock} label={lang === "th" ? "ซิงก์ล่าสุด" : "Last sync"} value={formatTimeAgo(data?.summary?.latestFetchedAt, lang)} />
      </section>

      <Card className="border border-line">
        <CardHeader
          title={activeLabel}
          subtitle={
            lang === "th"
              ? "เลือกประเภทและช่วงเวลาเพื่อดูเหตุการณ์ที่ต้องติดตาม"
              : "Choose a calendar type and period to review relevant events."
          }
          icon={<Calendar className="h-4 w-4" />}
          right={
            <div className="flex flex-wrap gap-1.5">
              {[0, 2, 3].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMinImportance(value)}
                  className={`h-8 rounded-lg border px-2.5 text-[10px] font-black transition ${
                    minImportance === value ? "border-brand bg-brand text-bg" : "border-line bg-bg text-muted hover:text-ink"
                  }`}
                >
                  {value === 0 ? (lang === "th" ? "ทั้งหมด" : "All") : value === 2 ? (lang === "th" ? "กลาง+" : "Med+") : (lang === "th" ? "สูง" : "High")}
                </button>
              ))}
            </div>
          }
        />

        <div className="border-b border-line p-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {CALENDAR_TYPES.map((type) => (
              <button
                key={type.key}
                type="button"
                onClick={() => setActiveType(type.key)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-black transition ${
                  activeType === type.key ? "border-brand bg-brand text-bg" : "border-line bg-bg text-muted hover:text-ink"
                }`}
              >
                {lang === "th" ? type.labelTh : type.labelEn}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {TIME_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setTimeFilter(filter.key)}
                className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                  timeFilter === filter.key ? "border-gold bg-gold/15 text-gold" : "border-line bg-bg text-muted hover:text-ink"
                }`}
              >
                {lang === "th" ? filter.labelTh : filter.labelEn}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="m-4 rounded-xl border border-down/30 bg-down/10 p-3 text-sm font-bold text-down">
            {error}
          </div>
        ) : null}

        <div className="divide-y divide-line">
          {loading ? (
            <div className="p-10 text-center text-sm font-bold text-muted animate-pulse">
              {lang === "th" ? "กำลังโหลดปฏิทิน..." : "Loading calendar..."}
            </div>
          ) : data?.events.length ? (
            data.events.map((event, index) => (
              <CalendarEventLine key={event._id || event.eventId || index} event={event} activeType={activeType} lang={lang} />
            ))
          ) : (
            <div className="p-10 text-center">
              <Zap className="mx-auto h-8 w-8 text-muted" />
              <div className="mt-2 text-sm font-bold text-muted">
                {lang === "th" ? "ยังไม่มีข้อมูลในช่วงเวลานี้" : "No events for this period."}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function CalendarEventLine({
  event,
  activeType,
  lang,
}: {
  event: CalendarEventRow;
  activeType: CalendarType;
  lang: "th" | "en";
}) {
  const meta = eventMeta(event, activeType);
  const flag = countryFlag(event.country, event.currency);
  const impact = Math.max(0, Math.min(event.importance || 0, 3));
  const country = countryLabel(event);

  return (
    <div className="grid gap-2 px-3 py-3 transition hover:bg-elevate/35 lg:grid-cols-[112px_172px_minmax(0,1fr)_150px_190px] lg:items-center lg:gap-3">
      <div className="flex items-center justify-between gap-2 lg:block">
        <div className="font-display text-sm font-black leading-none text-ink">{formatDate(event.date, lang)}</div>
        <div className="font-mono text-[11px] font-black text-muted lg:mt-1">{event.time || "-"}</div>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-line bg-bg text-lg shadow-sm">
          {flag}
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs font-black text-ink">{country}</div>
          <div className="mt-0.5 font-mono text-[10px] font-bold text-muted">{event.currency || event.exchange || activeType.toUpperCase()}</div>
        </div>
      </div>

      <div className="min-w-0">
        <div className="truncate font-display text-sm font-black text-ink">{event.name || event.holidayName || "-"}</div>
        <div className="mt-0.5 truncate text-[11px] font-semibold text-muted lg:hidden">{meta || "-"}</div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${
          impact === 3
            ? "border-up/30 bg-up/10 text-up"
            : impact === 2
              ? "border-gold/30 bg-gold/10 text-gold"
              : "border-line bg-elevate text-muted"
        }`}>
          {impactLabel(impact, lang)}
        </span>
        <div className="flex h-7 items-end gap-1" aria-label={impactLabel(impact, lang)}>
          {[1, 2, 3].map((level) => (
            <span
              key={level}
              className={`w-2 rounded-full transition ${
                level <= impact
                  ? impact === 3
                    ? "bg-up"
                    : impact === 2
                      ? "bg-gold"
                      : "bg-muted"
                  : "bg-line"
              }`}
              style={{ height: `${level * 6 + 5}px` }}
            />
          ))}
        </div>
      </div>

      <div className="hidden min-w-0 items-center justify-end lg:flex">
        <div className="max-w-full truncate text-right text-[11px] font-bold text-muted">{meta || "-"}</div>
      </div>
    </div>
  );
}

function MiniSummaryCard({
  icon: Icon,
  label,
  value,
  tone = "brand",
}: {
  icon: typeof Calendar;
  label: string;
  value: string | number;
  tone?: "brand" | "gold";
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-muted">
        <Icon className={`h-4 w-4 ${tone === "gold" ? "text-gold" : "text-brand"}`} />
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-black text-ink">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge, Card, CardHeader } from "@/components/ui/Card";
import { useTranslation } from "@/lib/translations";
import {
  Calendar, RefreshCw, Download, Trash2, Globe, Filter,
} from "@/lib/icons";
import {
  CALENDAR_TYPES, TIME_FILTERS,
  type CalendarType, type TimeFilter,
} from "@/lib/economic-calendar-types";

type FetchResultRow = {
  calendarType: CalendarType;
  fetched: number;
  upserted: number;
  success?: boolean;
  error?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(ts: number, lang: string): string {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
    year: "numeric", month: "short", day: "numeric", weekday: "short",
  });
}

function formatTimeAgo(ms: number, lang: string): string {
  if (!ms) return "—";
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60) return lang === "th" ? "เมื่อสักครู่" : "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

const importanceBadge: Record<number, { tone: "up" | "gold" | "down" | "muted"; th: string; en: string }> = {
  3: { tone: "up", th: "สูง", en: "High" },
  2: { tone: "gold", th: "กลาง", en: "Medium" },
  1: { tone: "down", th: "ต่ำ", en: "Low" },
};

// ── Page ───────────────────────────────────────────────────────────────────

export default function AdminCalendarPage() {
  const { lang } = useTranslation();

  const [activeTab, setActiveTab] = useState<CalendarType>("economic");
  const [timeFilter, setTimeFilter] = useState<TimeFilter | "">("");
  const [events, setEvents] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState("");
  const [fetchDetails, setFetchDetails] = useState<FetchResultRow[]>([]);
  const [error, setError] = useState("");
  const limit = 100;

  const fetchEvents = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    params.set("calendarType", activeTab);
    params.set("limit", String(limit));
    params.set("page", String(page));
    if (timeFilter) params.set("timeFilter", timeFilter);

    fetch(`/api/admin/economic-events?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setEvents(data.events || []);
        setSummary(data.summary || null);
        setTotal(data.total || 0);
      })
      .catch((err) => setError(err.message || "Could not load events"))
      .finally(() => setLoading(false));
  }, [activeTab, page, timeFilter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleFetch = async () => {
    setFetching(true);
    setFetchResult("");
    setFetchDetails([]);
    setError("");
    try {
      const res = await fetch("/api/admin/economic-events/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarType: activeTab,
          timeFilter: timeFilter || undefined,
          importance: [1, 2, 3],
          timeZone: 27,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fetch failed");
      const details = (data.results?.length ? data.results : [data]) as FetchResultRow[];
      setFetchDetails(details);
      setFetchResult(
        lang === "th"
          ? `ดึงข้อมูลสำเร็จ: ${data.fetched} รายการ, อัปเดต ${data.upserted} รายการ`
          : `Fetched ${data.fetched} events, upserted ${data.upserted}`
      );
      setPage(1);
      fetchEvents();
    } catch (err: any) {
      setError(err.message || "Could not fetch calendar data");
    } finally {
      setFetching(false);
    }
  };

  const handleFetchAll = async () => {
    setFetching(true);
    setFetchResult("");
    setFetchDetails([]);
    setError("");
    try {
      const res = await fetch("/api/admin/economic-events/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          all: true,
          replace: true,
          timeFilter: timeFilter || undefined,
          importance: [1, 2, 3],
          timeZone: 27,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fetch failed");
      setFetchDetails(data.results || []);
      setFetchResult(
        lang === "th"
          ? `ล้างแล้วดึงใหม่ครบทุกประเภท: ลบ ${data.deleted || 0} รายการ, ดึง ${data.fetched} รายการ, อัปเดต ${data.upserted} รายการ`
          : `Rebuilt all calendars: deleted ${data.deleted || 0}, fetched ${data.fetched}, upserted ${data.upserted}`
      );
      setPage(1);
      fetchEvents();
      if (data.errors?.length) {
        setError(
          lang === "th"
            ? `บางประเภทดึงไม่สำเร็จ: ${data.errors.map((item: FetchResultRow) => item.calendarType).join(", ")}`
            : `Some calendars failed: ${data.errors.map((item: FetchResultRow) => item.calendarType).join(", ")}`
        );
      }
    } catch (err: any) {
      setError(err.message || "Could not fetch calendar data");
    } finally {
      setFetching(false);
    }
  };

  const handleClearCurrent = async () => {
    if (!confirm(lang === "th" ? "ต้องการลบข้อมูลทั้งหมดในแท็บนี้?" : "Delete ALL events in this tab?")) return;
    try {
      const res = await fetch(`/api/admin/economic-events?calendarType=${activeTab}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setEvents([]);
      setSummary(null);
      setTotal(0);
      setPage(1);
    } catch (err: any) {
      setError(err.message || "Could not clear events");
    }
  };

  const handleClearAll = async () => {
    if (!confirm(lang === "th" ? "ต้องการลบข้อมูลทั้งหมดทุกประเภท?" : "Delete ALL events across every calendar type?")) return;
    try {
      const res = await fetch("/api/admin/economic-events?calendarType=all", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setEvents([]);
      setSummary(null);
      setTotal(0);
      setPage(1);
      setFetchDetails(data.results || []);
      setFetchResult(
        lang === "th"
          ? `ลบข้อมูลครบทุกประเภทแล้ว: ${data.deleted} รายการ`
          : `Deleted all calendars: ${data.deleted} events`
      );
    } catch (err: any) {
      setError(err.message || "Could not clear events");
    }
  };

  const totalPages = Math.ceil(total / limit);
  const tabLabel = (t: typeof CALENDAR_TYPES[0]) => lang === "th" ? t.labelTh : t.labelEn;

  // ── Render helpers per calendar type ────────────────────────────────────

  const renderEconomicTable = () => (
    <table className="w-full min-w-[800px] text-left text-xs">
      <thead>
        <tr className="border-b border-line bg-elevate text-muted uppercase tracking-wider font-semibold">
          <th className="p-3 pl-5">{lang === "th" ? "วันที่" : "Date"}</th>
          <th className="p-3">{lang === "th" ? "เวลา" : "Time"}</th>
          <th className="p-3">{lang === "th" ? "ประเทศ" : "Country"}</th>
          <th className="p-3">{lang === "th" ? "สกุลเงิน" : "Currency"}</th>
          <th className="p-3">{lang === "th" ? "เหตุการณ์" : "Event"}</th>
          <th className="p-3 text-center">{lang === "th" ? "ความสำคัญ" : "Importance"}</th>
          <th className="p-3 text-right">{lang === "th" ? "ค่าจริง" : "Actual"}</th>
          <th className="p-3 text-right">{lang === "th" ? "คาดการณ์" : "Forecast"}</th>
          <th className="p-3 text-right">{lang === "th" ? "ครั้งก่อน" : "Previous"}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {events.map((ev, i) => (
          <tr key={ev._id || ev.eventId || i} className="hover:bg-elevate/35">
            <td className="p-3 pl-5 font-bold whitespace-nowrap">{formatDate(ev.date, lang)}</td>
            <td className="p-3 font-mono whitespace-nowrap">{ev.time || "—"}</td>
            <td className="p-3 whitespace-nowrap">{ev.country || "—"}</td>
            <td className="p-3"><Badge tone="muted" className="text-[10px] font-bold">{ev.currency}</Badge></td>
            <td className="p-3 max-w-xs">{ev.name}</td>
            <td className="p-3 text-center">
              <Badge tone={importanceBadge[ev.importance]?.tone || "muted"} className="text-[10px] font-bold">
                {importanceBadge[ev.importance]?.[lang] || ev.importance}
              </Badge>
            </td>
            <td className="p-3 text-right font-mono">{ev.actual || "—"}</td>
            <td className="p-3 text-right font-mono text-muted">{ev.forecast || "—"}</td>
            <td className="p-3 text-right font-mono text-muted">{ev.previous || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderHolidayTable = () => (
    <table className="w-full min-w-[600px] text-left text-xs">
      <thead>
        <tr className="border-b border-line bg-elevate text-muted uppercase tracking-wider font-semibold">
          <th className="p-3 pl-5">{lang === "th" ? "วันที่" : "Date"}</th>
          <th className="p-3">{lang === "th" ? "ประเทศ" : "Country"}</th>
          <th className="p-3">{lang === "th" ? "ตลาด" : "Exchange"}</th>
          <th className="p-3">{lang === "th" ? "วันหยุด" : "Holiday"}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {events.map((ev, i) => (
          <tr key={ev._id || ev.eventId || i} className="hover:bg-elevate/35">
            <td className="p-3 pl-5 font-bold whitespace-nowrap">{formatDate(ev.date, lang)}</td>
            <td className="p-3 whitespace-nowrap">{ev.country || "—"}</td>
            <td className="p-3">{ev.exchange || "—"}</td>
            <td className="p-3 font-medium">{ev.holidayName || ev.name || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderEarningsTable = () => (
    <table className="w-full min-w-[900px] text-left text-xs">
      <thead>
        <tr className="border-b border-line bg-elevate text-muted uppercase tracking-wider font-semibold">
          <th className="p-3 pl-5">{lang === "th" ? "วันที่" : "Date"}</th>
          <th className="p-3">{lang === "th" ? "บริษัท" : "Company"}</th>
          <th className="p-3 text-right">EPS</th>
          <th className="p-3 text-right">{lang === "th" ? "คาดการณ์" : "EPS Fcst"}</th>
          <th className="p-3 text-right">{lang === "th" ? "รายรับ" : "Revenue"}</th>
          <th className="p-3 text-right">{lang === "th" ? "คาดการณ์" : "Rev Fcst"}</th>
          <th className="p-3 text-right">{lang === "th" ? "มูลค่าตลาด" : "Market Cap"}</th>
          <th className="p-3">{lang === "th" ? "ล่าสุด" : "Last"}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {events.map((ev, i) => (
          <tr key={ev._id || ev.eventId || i} className="hover:bg-elevate/35">
            <td className="p-3 pl-5 font-bold whitespace-nowrap">{formatDate(ev.date, lang)}</td>
            <td className="p-3 font-medium">{ev.name || "—"}</td>
            <td className="p-3 text-right font-mono">{ev.eps || "—"}</td>
            <td className="p-3 text-right font-mono text-muted">{ev.epsForecast || "—"}</td>
            <td className="p-3 text-right font-mono">{ev.revenue || "—"}</td>
            <td className="p-3 text-right font-mono text-muted">{ev.revenueForecast || "—"}</td>
            <td className="p-3 text-right">{ev.marketCap || "—"}</td>
            <td className="p-3 font-mono">{ev.lastPrice || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderDividendsTable = () => (
    <table className="w-full min-w-[700px] text-left text-xs">
      <thead>
        <tr className="border-b border-line bg-elevate text-muted uppercase tracking-wider font-semibold">
          <th className="p-3 pl-5">{lang === "th" ? "วันที่" : "Date"}</th>
          <th className="p-3">{lang === "th" ? "บริษัท" : "Company"}</th>
          <th className="p-3">{lang === "th" ? "วันปิดสมุด" : "Ex-Div Date"}</th>
          <th className="p-3 text-right">{lang === "th" ? "เงินปันผล" : "Dividend"}</th>
          <th className="p-3">{lang === "th" ? "ประเภท" : "Type"}</th>
          <th className="p-3">{lang === "th" ? "จ่ายวันที่" : "Pay Date"}</th>
          <th className="p-3 text-right">{lang === "th" ? "ผลตอบแทน" : "Yield"}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {events.map((ev, i) => (
          <tr key={ev._id || ev.eventId || i} className="hover:bg-elevate/35">
            <td className="p-3 pl-5 font-bold whitespace-nowrap">{formatDate(ev.date, lang)}</td>
            <td className="p-3 font-medium">{ev.name || "—"}</td>
            <td className="p-3 whitespace-nowrap">{ev.exDividendDate || formatDate(ev.date, lang)}</td>
            <td className="p-3 text-right font-mono">{ev.dividend || "—"}</td>
            <td className="p-3">{ev.dividendType || "—"}</td>
            <td className="p-3 whitespace-nowrap">{ev.paymentDate || "—"}</td>
            <td className="p-3 text-right font-mono">{ev.dividendYield || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderStockSplitTable = () => (
    <table className="w-full min-w-[500px] text-left text-xs">
      <thead>
        <tr className="border-b border-line bg-elevate text-muted uppercase tracking-wider font-semibold">
          <th className="p-3 pl-5">{lang === "th" ? "วันที่" : "Date"}</th>
          <th className="p-3">{lang === "th" ? "บริษัท" : "Company"}</th>
          <th className="p-3">{lang === "th" ? "อัตราส่วน" : "Split Ratio"}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {events.map((ev, i) => (
          <tr key={ev._id || ev.eventId || i} className="hover:bg-elevate/35">
            <td className="p-3 pl-5 font-bold whitespace-nowrap">{formatDate(ev.date, lang)}</td>
            <td className="p-3 font-medium">{ev.name || "—"}</td>
            <td className="p-3 font-mono">{ev.splitRatio || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderIPOTable = () => (
    <table className="w-full min-w-[700px] text-left text-xs">
      <thead>
        <tr className="border-b border-line bg-elevate text-muted uppercase tracking-wider font-semibold">
          <th className="p-3 pl-5">{lang === "th" ? "วันที่" : "Date"}</th>
          <th className="p-3">{lang === "th" ? "บริษัท" : "Company"}</th>
          <th className="p-3">{lang === "th" ? "ตลาด" : "Exchange"}</th>
          <th className="p-3 text-right">{lang === "th" ? "มูลค่า IPO" : "IPO Value"}</th>
          <th className="p-3 text-right">{lang === "th" ? "ราคา IPO" : "IPO Price"}</th>
          <th className="p-3 text-right">{lang === "th" ? "ล่าสุด" : "Last"}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {events.map((ev, i) => (
          <tr key={ev._id || ev.eventId || i} className="hover:bg-elevate/35">
            <td className="p-3 pl-5 font-bold whitespace-nowrap">{formatDate(ev.date, lang)}</td>
            <td className="p-3 font-medium">{ev.name || "—"}</td>
            <td className="p-3">{ev.exchange || "—"}</td>
            <td className="p-3 text-right font-mono">{ev.ipoValue || "—"}</td>
            <td className="p-3 text-right font-mono">{ev.ipoPrice || "—"}</td>
            <td className="p-3 text-right font-mono">{ev.lastPrice || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderTable = () => {
    switch (activeTab) {
      case "economic": return renderEconomicTable();
      case "holiday": return renderHolidayTable();
      case "earnings": return renderEarningsTable();
      case "dividends": return renderDividendsTable();
      case "stock_split": return renderStockSplitTable();
      case "ipo": return renderIPOTable();
      default: return null;
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl flex items-center gap-2">
            <Calendar className="h-7 w-7 text-brand" />
            {lang === "th" ? "ปฏิทินเศรษฐกิจ" : "Economic Calendar"}
          </h1>
          <p className="text-xs text-muted mt-1.5">
            {lang === "th"
              ? "ดึงข้อมูลจาก investing.com มาเก็บใน MongoDB — รองรับ 6 ประเภทปฏิทิน"
              : "Fetch data from investing.com into MongoDB — 6 calendar types supported."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {lang === "th" ? "โหลดใหม่" : "Refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearCurrent} disabled={total === 0}>
            <Trash2 className="h-4 w-4" />
            {lang === "th" ? "ล้างแท็บนี้" : "Clear Current"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4" />
            {lang === "th" ? "ล้างทุกประเภท" : "Clear All"}
          </Button>
        </div>
      </div>

      {/* Fetch Controls */}
      <Card className="border border-brand/20 bg-brand/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Download className="h-4 w-4 text-brand" />
          <h3 className="font-display font-bold text-sm text-ink">
            {lang === "th" ? "ดึงข้อมูลจาก Investing.com" : "Fetch from Investing.com"}
          </h3>
        </div>

        {/* Time Filter Buttons */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-muted mb-2 uppercase">
            {lang === "th" ? "ช่วงเวลา" : "Time Period"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setTimeFilter("")}
              className={`h-9 rounded-xl border px-3 text-[11px] font-black transition ${
                !timeFilter ? "border-brand bg-brand text-bg" : "border-line bg-bg text-muted hover:border-brand/40"
              }`}
            >
              {lang === "th" ? "ทั้งหมด" : "All"}
            </button>
            {TIME_FILTERS.map((tf) => (
              <button
                key={tf.key}
                onClick={() => setTimeFilter(tf.key === timeFilter ? "" : tf.key)}
                className={`h-9 rounded-xl border px-3 text-[11px] font-black transition ${
                  timeFilter === tf.key ? "border-brand bg-brand text-bg" : "border-line bg-bg text-muted hover:border-brand/40"
                }`}
              >
                {lang === "th" ? tf.labelTh : tf.labelEn}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={handleFetch} disabled={fetching} className="w-full sm:w-auto">
            <Download className={`h-4 w-4 ${fetching ? "animate-bounce" : ""}`} />
            {fetching
              ? lang === "th" ? "กำลังดึงข้อมูล..." : "Fetching..."
              : lang === "th" ? `ดึง${tabLabel(CALENDAR_TYPES.find(t => t.key === activeTab)!)}`
                : `Fetch ${tabLabel(CALENDAR_TYPES.find(t => t.key === activeTab)!)}`}
          </Button>
          <Button onClick={handleFetchAll} disabled={fetching} variant="outline" className="w-full sm:w-auto">
            <Download className={`h-4 w-4 ${fetching ? "animate-bounce" : ""}`} />
            {lang === "th" ? "ล้างแล้วดึงครบทุกประเภท" : "Rebuild All Calendars"}
          </Button>
        </div>

        {fetchResult && (
          <div className="mt-3 rounded-xl border border-brand/30 bg-brand/10 p-3 text-xs font-bold text-brand">{fetchResult}</div>
        )}

        {fetchDetails.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {fetchDetails.map((item) => {
              const type = CALENDAR_TYPES.find((ct) => ct.key === item.calendarType);
              return (
                <div key={item.calendarType} className="rounded-xl border border-line bg-bg p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-ink">{type ? tabLabel(type) : item.calendarType}</span>
                    <Badge tone={item.error ? "down" : "up"} className="text-[10px] font-bold">
                      {item.error ? "Error" : "OK"}
                    </Badge>
                  </div>
                  <div className="mt-2 text-muted">
                    {item.error
                      ? item.error
                      : lang === "th"
                        ? `ดึง ${item.fetched || 0} / อัปเดต ${item.upserted || 0}`
                        : `Fetched ${item.fetched || 0} / upserted ${item.upserted || 0}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-down/30 bg-down/10 p-3 text-xs font-bold text-down">{error}</div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <MiniCard label={lang === "th" ? "ทั้งหมด" : "Total"} value={summary.total} />
          <MiniCard label={lang === "th" ? "ความสำคัญสูง" : "High Impact"} value={summary.highImportance || 0} tone="up" />
          <MiniCard label={lang === "th" ? "ความสำคัญกลาง" : "Medium"} value={summary.mediumImportance || 0} tone="gold" />
          <MiniCard label={lang === "th" ? "ประเทศ" : "Countries"} value={(summary.countries || []).length} />
          <MiniCard label={lang === "th" ? "ล่าสุด" : "Last Fetch"} value={formatTimeAgo(summary.latestFetchedAt, lang)} />
          <MiniCard label={lang === "th" ? "วันที่" : "Date Range"} value={summary.oldestEventDay && summary.newestEventDay ? `${formatDate(summary.oldestEventDay, lang).split(",")[0]} → ${formatDate(summary.newestEventDay, lang).split(",")[0]}` : "—"} />
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-1.5 border-b border-line pb-0">
        {CALENDAR_TYPES.map((ct) => (
          <button
            key={ct.key}
            onClick={() => { setActiveTab(ct.key); setPage(1); }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border border-b-0 ${
              activeTab === ct.key
                ? "bg-surface text-brand border-line -mb-px"
                : "text-muted border-transparent hover:text-ink hover:bg-elevate/50"
            }`}
          >
            {lang === "th" ? ct.labelTh : ct.labelEn}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <Card className="border border-line">
        <CardHeader
          title={tabLabel(CALENDAR_TYPES.find(t => t.key === activeTab)!)}
          subtitle={
            lang === "th"
              ? `แสดง ${events.length} จาก ${total.toLocaleString()} รายการ${timeFilter ? " (" + (TIME_FILTERS.find(f => f.key === timeFilter)?.[lang === "th" ? "labelTh" : "labelEn"] || timeFilter) + ")" : ""}`
              : `Showing ${events.length} of ${total.toLocaleString()} events${timeFilter ? " (" + timeFilter + ")" : ""}`
          }
          icon={<Calendar className="h-4 w-4" />}
        />

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-xs text-muted animate-pulse">Loading...</div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center text-xs text-muted">
              {lang === "th" ? "ยังไม่มีข้อมูล กด 'ดึงข้อมูล' เพื่อ scrape จาก investing.com" : "No data yet. Click 'Fetch' to scrape from investing.com."}
            </div>
          ) : renderTable()}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <span className="text-[10px] text-muted">
              {lang === "th" ? `หน้า ${page} จาก ${totalPages}` : `Page ${page} of ${totalPages}`}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 rounded-lg border border-line bg-bg px-3 text-[10px] font-bold text-muted hover:border-brand/40 disabled:opacity-40"
              >←</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pg: number;
                if (totalPages <= 5) pg = i + 1;
                else if (page <= 3) pg = i + 1;
                else if (page >= totalPages - 2) pg = totalPages - 4 + i;
                else pg = page - 2 + i;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`h-8 w-8 rounded-lg text-[10px] font-bold transition ${
                      pg === page
                        ? "border border-brand bg-brand text-bg"
                        : "border border-line bg-bg text-muted hover:border-brand/40"
                    }`}
                  >{pg}</button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 rounded-lg border border-line bg-bg px-3 text-[10px] font-bold text-muted hover:border-brand/40 disabled:opacity-40"
              >→</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function MiniCard({ label, value, tone = "ink" }: { label: string; value: string | number; tone?: string }) {
  const toneStyles: Record<string, string> = {
    up: "border-up/20 bg-up/5",
    gold: "border-gold/20 bg-gold/5",
    down: "border-down/20 bg-down/5",
    ink: "border-line bg-bg",
  };
  return (
    <div className={`rounded-2xl border p-4 ${toneStyles[tone] || toneStyles.ink}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-display text-xl font-bold text-ink">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

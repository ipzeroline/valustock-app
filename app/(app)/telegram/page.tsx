"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { num } from "@/lib/format";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Layers,
  RefreshCw,
  Shield,
  Star,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "@/lib/icons";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
        MainButton?: {
          hide?: () => void;
        };
      };
    };
  }
}

type MiniSummary = {
  generatedAt: string;
  member: {
    email: string;
    plan: string;
    telegramUser?: { first_name?: string; username?: string; language_code?: string };
  };
  capabilities: { portfolio: boolean; compare: boolean; alerts: boolean; calendar?: boolean };
  portfolio: {
    totalValue: number;
    totalCost: number;
    pnl: number;
    pnlPct: number;
    positionCount: number;
    concentrationPct: number;
    bestPosition: MiniPosition | null;
    worstPosition: MiniPosition | null;
    positions: MiniPosition[];
  };
  watchlist: MiniWatchlistStock[];
  watchlistStats: {
    count: number;
    avgMos: number;
    undervaluedCount: number;
    topMos: MiniWatchlistStock | null;
    topYield: MiniWatchlistStock | null;
  };
  compareSets: Array<{
    id: string;
    name: string;
    symbols: string[];
    chartMetric: string;
    mosLeader: { symbol: string; mos: number } | null;
    yieldLeader: { symbol: string; dividendYield: number } | null;
  }>;
};

type MiniPosition = {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  price: number;
  value: number;
  pnl: number;
  pnlPct: number;
};

type MiniWatchlistStock = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  fairValue: number;
  mos: number;
  dividendYield: number;
  roe: number | null;
  verdict: string;
};

type MiniCalendarEvent = {
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
};

type MiniCalendarPayload = {
  events: MiniCalendarEvent[];
  generatedAt: string;
};

type Tab = "overview" | "portfolio" | "compare" | "watchlist" | "calendar";
type MiniLang = keyof typeof copy;

const copy = {
  th: {
    title: "ศูนย์สรุปพอร์ต",
    subtitleFallback: "เปิดผ่าน Telegram เพื่อดูพอร์ต Watchlist และ Compare แบบย่อ",
    openInTelegram: "ต้องเปิดผ่าน Telegram",
    openHint: "หน้านี้ต้องเปิดจาก Mini App ของบอท ระบบจะใช้ connection key ที่เชื่อมจากหน้า Account เพื่อดึงข้อมูลโดยไม่ต้อง login เว็บซ้ำ",
    backHome: "กลับเว็บหลัก",
    loading: "กำลังโหลดข้อมูล...",
    overview: "ภาพรวม",
    portfolio: "พอร์ต",
    compare: "เปรียบเทียบ",
    watchlist: "ติดตาม",
    calendar: "ปฏิทิน",
    economicCalendar: "ปฏิทินเศรษฐกิจ",
    noCalendar: "ยังไม่มีเหตุการณ์สำคัญในสัปดาห์นี้",
    calendarLocked: "ปฏิทินเศรษฐกิจใช้ได้ใน Premium / Lifetime",
    highImpact: "แรง",
    mediumImpact: "กลาง",
    totalValue: "มูลค่าพอร์ต",
    totalCost: "ต้นทุน",
    pnl: "กำไร/ขาดทุน",
    concentration: "น้ำหนักตัวใหญ่สุด",
    positions: "จำนวนสินทรัพย์",
    watchlistCount: "Watchlist",
    compareCount: "Compare",
    sendPortfolio: "ส่งสรุปพอร์ตเข้าแชท",
    sendWatchlist: "ส่งสรุป Watchlist เข้าแชท",
    sending: "กำลังส่ง...",
    sent: "ส่งเข้า Telegram แล้ว",
    topHolding: "สินทรัพย์หลักในพอร์ต",
    best: "ตัวทำกำไรดีที่สุด",
    worst: "ตัวที่ต้องติดตาม",
    noPortfolio: "ยังไม่มีรายการพอร์ตในระบบ",
    noCompare: "ยังไม่มี Compare Set ที่บันทึกไว้",
    noWatchlist: "ยังไม่มีหุ้นใน Watchlist",
    todayFocus: "จุดที่ควรดูวันนี้",
    avgMos: "MOS เฉลี่ย",
    valueIdeas: "ต่ำกว่ามูลค่า",
    mosLeader: "MOS เด่น",
    yieldLeader: "Yield เด่น",
    updated: "อัปเดต",
    locked: "ฟีเจอร์นี้ต้องใช้แพ็กเกจที่รองรับ",
  },
  en: {
    title: "Portfolio Command Center",
    subtitleFallback: "Open in Telegram to view portfolio, watchlist, and compare summaries.",
    openInTelegram: "Open inside Telegram",
    openHint: "This page must be opened from the bot Mini App. It uses your account connection key to load data without signing in again.",
    backHome: "Back to site",
    loading: "Loading data...",
    overview: "Overview",
    portfolio: "Portfolio",
    compare: "Compare",
    watchlist: "Watchlist",
    calendar: "Calendar",
    economicCalendar: "Economic Calendar",
    noCalendar: "No major events this week",
    calendarLocked: "Economic Calendar is available in Premium / Lifetime",
    highImpact: "High",
    mediumImpact: "Med",
    totalValue: "Portfolio Value",
    totalCost: "Cost Basis",
    pnl: "P/L",
    concentration: "Top Weight",
    positions: "Positions",
    watchlistCount: "Watchlist",
    compareCount: "Compare",
    sendPortfolio: "Send portfolio summary",
    sendWatchlist: "Send watchlist summary",
    sending: "Sending...",
    sent: "Sent to Telegram",
    topHolding: "Core holding",
    best: "Best performer",
    worst: "Needs attention",
    noPortfolio: "No portfolio transactions yet",
    noCompare: "No saved compare sets yet",
    noWatchlist: "No watchlist symbols yet",
    todayFocus: "Today focus",
    avgMos: "Avg MOS",
    valueIdeas: "Value ideas",
    mosLeader: "MOS leader",
    yieldLeader: "Yield leader",
    updated: "Updated",
    locked: "This feature requires an eligible plan",
  },
} as const;

function MiniStat({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "up" | "down" | "gold" | "muted";
}) {
  const color =
    tone === "up" ? "text-up" : tone === "down" ? "text-down" : tone === "gold" ? "text-gold" : "text-ink";
  return (
    <div className="rounded-xl border border-line bg-surface/60 p-3">
      <div className="text-[10px] font-black uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 font-display text-lg font-black ${color}`}>{value}</div>
    </div>
  );
}

function compactMoney(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${num(value / 1_000_000, 2)}M`;
  if (abs >= 1_000) return `${num(value / 1_000, 1)}K`;
  return num(value, 0);
}

function signedPct(value: number) {
  return `${value >= 0 ? "+" : ""}${num(value, 1)}%`;
}

const MINI_CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  CNY: "🇨🇳",
  THB: "🇹🇭",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
};

const MINI_COUNTRY_CODES: Array<[RegExp, string]> = [
  [/belgium|เบลเยียม/i, "BE"],
  [/italy|อิตาลี/i, "IT"],
  [/ireland|ไอร์แลนด์/i, "IE"],
  [/united kingdom|great britain|britain|uk|อังกฤษ|สหราชอาณาจักร/i, "GB"],
  [/united states|usa|u\.s\.|us|สหรัฐ/i, "US"],
  [/euro zone|euro area|european union|eurozone|ยุโรป|ยูโรโซน/i, "EU"],
  [/germany|เยอรมนี|เยอรมัน/i, "DE"],
  [/france|ฝรั่งเศส/i, "FR"],
  [/japan|ญี่ปุ่น/i, "JP"],
  [/china|จีน/i, "CN"],
  [/thailand|ไทย/i, "TH"],
];

function miniCodeToFlag(code: string) {
  if (code === "EU") return "🇪🇺";
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return code.split("").map((char) => String.fromCodePoint(127397 + char.charCodeAt(0))).join("");
}

function miniFlag(country?: string, currency?: string) {
  const countryText = (country || "").trim();
  const directCode = countryText.toUpperCase();
  const matchedCode = MINI_COUNTRY_CODES.find(([pattern]) => pattern.test(countryText))?.[1];
  return miniCodeToFlag(matchedCode || directCode) || MINI_CURRENCY_FLAGS[(currency || "").toUpperCase()] || "🌐";
}

function miniDate(ts: number, lang: MiniLang) {
  return new Date(ts * 1000).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function miniEventMeta(event: MiniCalendarEvent) {
  return [
    event.actual ? `Act ${event.actual}` : null,
    event.forecast ? `Fcst ${event.forecast}` : null,
    event.previous ? `Prev ${event.previous}` : null,
  ].filter(Boolean).join(" · ");
}

export default function TelegramMiniAppPage() {
  const [initData, setInitData] = useState("");
  const [summary, setSummary] = useState<MiniSummary | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [languageOverride, setLanguageOverride] = useState<MiniLang | null>(null);
  const [calendarData, setCalendarData] = useState<MiniCalendarPayload | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState("");

  const isTelegram = Boolean(initData);

  const loadSummary = async (nextInitData = initData) => {
    if (!nextInitData) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/telegram-mini/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: nextInitData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load Telegram Mini App data");
      setSummary(data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadCalendar = async (nextInitData = initData) => {
    if (!nextInitData || !summary?.capabilities.calendar) return;
    setCalendarLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/telegram-mini/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: nextInitData, calendarType: "economic", timeFilter: "thisWeek", limit: 8 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load calendar");
      setCalendarData(data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load calendar");
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    const savedLang = window.localStorage.getItem("valustock_telegram_lang");
    if (savedLang === "th" || savedLang === "en") setLanguageOverride(savedLang);

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    document.head.appendChild(script);

    const timer = window.setTimeout(() => {
      const webApp = window.Telegram?.WebApp;
      webApp?.ready?.();
      webApp?.expand?.();
      webApp?.MainButton?.hide?.();
      const nextInitData = webApp?.initData || "";
      setInitData(nextInitData);
      loadSummary(nextInitData);
    }, 350);

    return () => {
      window.clearTimeout(timer);
      script.remove();
    };
  }, []);

  const telegramLang = (summary?.member.telegramUser?.language_code || "").startsWith("th") ? "th" : "en";
  const lang: MiniLang = languageOverride || telegramLang;
  const c = copy[lang];

  const setLang = (nextLang: MiniLang) => {
    setLanguageOverride(nextLang);
    window.localStorage.setItem("valustock_telegram_lang", nextLang);
  };

  useEffect(() => {
    if (activeTab === "calendar" && summary?.capabilities.calendar && initData && !calendarData && !calendarLoading) {
      loadCalendar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, summary?.capabilities.calendar, initData]);

  const sendAction = async (action: "portfolio_summary" | "watchlist_summary" | "compare_alert", setId?: string) => {
    if (!initData) return;
    setActionLoading(setId || action);
    setMessage("");
    try {
      const res = await fetch("/api/telegram-mini/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, action, setId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Telegram action failed");
      setMessage(c.sent);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Telegram action failed");
    } finally {
      setActionLoading("");
    }
  };

  const topPosition = useMemo(() => summary?.portfolio.positions[0] || null, [summary]);
  const focusItems = useMemo(() => {
    if (!summary) return [];
    return [
      summary.portfolio.bestPosition
        ? {
            label: c.best,
            title: summary.portfolio.bestPosition.symbol,
            detail: signedPct(summary.portfolio.bestPosition.pnlPct),
            tone: "up" as const,
          }
        : null,
      summary.portfolio.worstPosition
        ? {
            label: c.worst,
            title: summary.portfolio.worstPosition.symbol,
            detail: signedPct(summary.portfolio.worstPosition.pnlPct),
            tone: summary.portfolio.worstPosition.pnlPct >= 0 ? ("up" as const) : ("down" as const),
          }
        : null,
      summary.watchlistStats.topMos
        ? {
            label: c.mosLeader,
            title: summary.watchlistStats.topMos.symbol,
            detail: `MOS ${signedPct(summary.watchlistStats.topMos.mos)}`,
            tone: "gold" as const,
          }
        : null,
    ].filter(Boolean) as Array<{ label: string; title: string; detail: string; tone: "up" | "down" | "gold" }>;
  }, [summary, c.best, c.worst, c.mosLeader]);

  return (
    <main className="min-h-screen bg-bg px-4 py-4 text-ink">
      <div className="mx-auto max-w-md space-y-4">
        <header className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-brand">
                <Shield className="h-4 w-4" />
                ValuStock Mini
              </div>
              <h1 className="mt-2 font-display text-2xl font-black leading-tight">
                {c.title}
              </h1>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">
                {summary
                  ? `${summary.member.email} · ${summary.member.plan.toUpperCase()}`
                  : c.subtitleFallback}
              </p>
              {summary?.generatedAt && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-lg border border-line bg-bg px-2 py-1 text-[10px] font-bold text-muted">
                  <Clock className="h-3 w-3" />
                  {c.updated} {new Date(summary.generatedAt).toLocaleTimeString(lang === "th" ? "th-TH" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => loadSummary()}
              disabled={loading || !initData}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-muted transition hover:text-brand disabled:opacity-40"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-line bg-bg p-1">
            {(["th", "en"] as MiniLang[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLang(item)}
                className={`h-9 rounded-lg text-xs font-black transition ${
                  lang === item ? "bg-brand text-bg" : "text-muted hover:text-ink"
                }`}
                aria-pressed={lang === item}
              >
                {item === "th" ? "ไทย" : "EN"}
              </button>
            ))}
          </div>
        </header>

        {!isTelegram && !loading ? (
          <section className="rounded-2xl border border-gold/35 bg-gold/10 p-4 text-sm font-semibold leading-relaxed text-muted">
            <div className="flex items-center gap-2 font-display text-base font-black text-ink">
              <Bell className="h-5 w-5 text-gold" />
              {c.openInTelegram}
            </div>
            <p className="mt-2">
              {c.openHint}
            </p>
            <Link href="/" className="mt-3 inline-flex items-center gap-1 text-brand">
              {c.backHome} <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        ) : null}

        {message ? (
          <div className="rounded-xl border border-line bg-elevate px-3 py-2 text-xs font-bold text-muted">
            {message}
          </div>
        ) : null}

        {loading ? (
          <section className="rounded-2xl border border-line bg-surface p-8 text-center text-sm font-bold text-muted">
            {c.loading}
          </section>
        ) : summary ? (
          <>
            <section className="grid grid-cols-2 gap-3">
              <MiniStat label={c.totalValue} value={compactMoney(summary.portfolio.totalValue)} tone="gold" />
              <MiniStat
                label={c.pnl}
                value={`${summary.portfolio.pnl >= 0 ? "+" : ""}${compactMoney(summary.portfolio.pnl)} · ${signedPct(summary.portfolio.pnlPct)}`}
                tone={summary.portfolio.pnl >= 0 ? "up" : "down"}
              />
              <MiniStat label={c.watchlistCount} value={`${summary.watchlistStats.count} · MOS ${signedPct(summary.watchlistStats.avgMos)}`} />
              <MiniStat label={c.compareCount} value={`${summary.compareSets.length}`} />
            </section>

            <nav className="grid grid-cols-5 gap-1 rounded-2xl border border-line bg-surface p-1">
              {[
                { id: "overview" as Tab, label: c.overview, icon: BarChart3 },
                { id: "portfolio" as Tab, label: c.portfolio, icon: Wallet },
                { id: "watchlist" as Tab, label: c.watchlist, icon: Star },
                { id: "compare" as Tab, label: c.compare, icon: Layers },
                { id: "calendar" as Tab, label: c.calendar, icon: Calendar },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-black transition ${
                      active ? "bg-brand text-bg" : "text-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {activeTab === "overview" ? (
              <section className="space-y-3">
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-center gap-2 text-xs font-black text-muted">
                    <Shield className="h-4 w-4 text-brand" />
                    {c.todayFocus}
                  </div>
                  {focusItems.length ? (
                    <div className="mt-3 grid gap-2">
                      {focusItems.map((item) => (
                        <div key={`${item.label}-${item.title}`} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg/60 px-3 py-2.5">
                          <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase tracking-wide text-muted">{item.label}</div>
                            <div className="font-display text-base font-black text-ink">{item.title}</div>
                          </div>
                          <div className={`shrink-0 text-right font-display text-base font-black ${
                            item.tone === "up" ? "text-up" : item.tone === "down" ? "text-down" : "text-gold"
                          }`}>
                            {item.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState text={c.noPortfolio} />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label={c.totalCost} value={compactMoney(summary.portfolio.totalCost)} />
                  <MiniStat label={c.concentration} value={signedPct(summary.portfolio.concentrationPct)} tone={summary.portfolio.concentrationPct > 45 ? "gold" : "muted"} />
                  <MiniStat label={c.positions} value={String(summary.portfolio.positionCount)} />
                  <MiniStat label={c.valueIdeas} value={String(summary.watchlistStats.undervaluedCount)} tone="up" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    size="sm"
                    variant="gold"
                    className="w-full"
                    onClick={() => sendAction("portfolio_summary")}
                    disabled={Boolean(actionLoading) || !summary.capabilities.portfolio || !summary.capabilities.alerts}
                  >
                    <Bell className="h-4 w-4" />
                    {actionLoading === "portfolio_summary" ? c.sending : c.portfolio}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => sendAction("watchlist_summary")}
                    disabled={Boolean(actionLoading) || !summary.capabilities.alerts}
                  >
                    <Bell className="h-4 w-4" />
                    {actionLoading === "watchlist_summary" ? c.sending : c.watchlist}
                  </Button>
                </div>
              </section>
            ) : null}

            {activeTab === "portfolio" ? (
              <section className="space-y-3">
                <Button
                  size="md"
                  variant="gold"
                  className="w-full"
                  onClick={() => sendAction("portfolio_summary")}
                  disabled={Boolean(actionLoading) || !summary.capabilities.portfolio || !summary.capabilities.alerts}
                >
                  <Bell className="h-4 w-4" />
                  {actionLoading === "portfolio_summary" ? c.sending : c.sendPortfolio}
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label={c.totalValue} value={compactMoney(summary.portfolio.totalValue)} tone="gold" />
                  <MiniStat
                    label={c.pnl}
                    value={`${summary.portfolio.pnl >= 0 ? "+" : ""}${compactMoney(summary.portfolio.pnl)} · ${signedPct(summary.portfolio.pnlPct)}`}
                    tone={summary.portfolio.pnl >= 0 ? "up" : "down"}
                  />
                </div>
                {topPosition ? (
                  <div className="rounded-2xl border border-line bg-surface p-4">
                    <div className="flex items-center gap-2 text-xs font-black text-muted">
                      <BarChart3 className="h-4 w-4 text-brand" />
                      {c.topHolding}
                    </div>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div>
                        <div className="font-display text-xl font-black">{topPosition.symbol}</div>
                        <div className="text-xs font-semibold text-muted">{topPosition.name}</div>
                      </div>
                      <div className={topPosition.pnl >= 0 ? "text-right text-up" : "text-right text-down"}>
                        <div className="font-display text-lg font-black">{compactMoney(topPosition.value)}</div>
                        <div className="text-xs font-bold">{signedPct(topPosition.pnlPct)}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState text={c.noPortfolio} />
                )}
                <div className="space-y-2">
                  {summary.portfolio.positions.slice(0, 6).map((pos) => (
                    <AssetRow
                      key={pos.symbol}
                      title={pos.symbol}
                      subtitle={`${num(pos.shares, 2)} sh · avg ${num(pos.avgCost, 2)} · px ${num(pos.price, 2)}`}
                      value={compactMoney(pos.value)}
                      change={pos.pnlPct}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {activeTab === "compare" ? (
              <section className="space-y-3">
                {summary.compareSets.length === 0 ? (
                  <EmptyState text={c.noCompare} />
                ) : (
                  summary.compareSets.map((set) => (
                    <div key={set.id} className="rounded-2xl border border-line bg-surface p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-display text-base font-black">{set.name}</div>
                          <div className="mt-1 truncate font-mono text-[11px] font-bold text-muted">
                            {set.symbols.join(" / ")}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="gold"
                          onClick={() => sendAction("compare_alert", set.id)}
                          disabled={Boolean(actionLoading)}
                        >
                          <Bell className="h-4 w-4" />
                          {actionLoading === set.id ? c.sending : c.compare}
                        </Button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <MiniStat
                          label={c.mosLeader}
                          value={set.mosLeader ? `${set.mosLeader.symbol} ${signedPct(set.mosLeader.mos)}` : "-"}
                          tone="up"
                        />
                        <MiniStat
                          label={c.yieldLeader}
                          value={set.yieldLeader ? `${set.yieldLeader.symbol} ${num(set.yieldLeader.dividendYield, 1)}%` : "-"}
                          tone="gold"
                        />
                      </div>
                    </div>
                  ))
                )}
              </section>
            ) : null}

            {activeTab === "watchlist" ? (
              <section className="space-y-3">
                <Button
                  size="md"
                  variant="gold"
                  className="w-full"
                  onClick={() => sendAction("watchlist_summary")}
                  disabled={Boolean(actionLoading)}
                >
                  <Bell className="h-4 w-4" />
                  {actionLoading === "watchlist_summary" ? c.sending : c.sendWatchlist}
                </Button>
                {summary.watchlist.length === 0 ? (
                  <EmptyState text={c.noWatchlist} />
                ) : (
                  summary.watchlist.map((stock) => (
                    <AssetRow
                      key={stock.symbol}
                      title={stock.symbol}
                      subtitle={`${stock.name} · MOS ${signedPct(stock.mos)} · Yield ${num(stock.dividendYield, 1)}% · ${stock.verdict}`}
                      value={num(stock.price, 2)}
                      change={stock.changePct}
                    />
                  ))
                )}
              </section>
            ) : null}

            {activeTab === "calendar" ? (
              <section className="space-y-3">
                {!summary.capabilities.calendar ? (
                  <div className="rounded-2xl border border-gold/35 bg-gold/10 p-4">
                    <div className="flex items-center gap-2 font-display text-base font-black text-ink">
                      <Calendar className="h-5 w-5 text-gold" />
                      {c.economicCalendar}
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">{c.calendarLocked}</p>
                    <Link href="/pricing" className="mt-3 inline-flex items-center gap-1 text-xs font-black text-gold">
                      Premium / Lifetime <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
                      <div>
                        <div className="font-display text-base font-black text-ink">{c.economicCalendar}</div>
                        <div className="mt-0.5 text-[11px] font-bold text-muted">
                          {lang === "th" ? "เหตุการณ์สำคัญสัปดาห์นี้" : "Major events this week"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => loadCalendar()}
                        disabled={calendarLoading}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-muted transition hover:text-brand disabled:opacity-40"
                        aria-label="Refresh calendar"
                      >
                        <RefreshCw className={`h-4 w-4 ${calendarLoading ? "animate-spin" : ""}`} />
                      </button>
                    </div>

                    {calendarLoading ? (
                      <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm font-bold text-muted animate-pulse">
                        {c.loading}
                      </div>
                    ) : calendarData?.events.length ? (
                      <div className="space-y-2">
                        {calendarData.events.map((event, index) => (
                          <MiniCalendarRow key={event.eventId || event._id || index} event={event} lang={lang} highLabel={c.highImpact} mediumLabel={c.mediumImpact} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState text={c.noCalendar} />
                    )}
                  </>
                )}
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}

function AssetRow({
  title,
  subtitle,
  value,
  change,
}: {
  title: string;
  subtitle: string;
  value: string;
  change: number;
}) {
  const up = change >= 0;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/70 p-3">
      <div className="min-w-0">
        <div className="font-display text-sm font-black">{title}</div>
        <div className="mt-0.5 truncate text-[11px] font-semibold text-muted">{subtitle}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-display text-sm font-black">{value}</div>
        <div className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] font-black ${up ? "text-up" : "text-down"}`}>
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {up ? "+" : ""}{num(change, 1)}%
        </div>
      </div>
    </div>
  );
}

function MiniCalendarRow({
  event,
  lang,
  highLabel,
  mediumLabel,
}: {
  event: MiniCalendarEvent;
  lang: MiniLang;
  highLabel: string;
  mediumLabel: string;
}) {
  const impact = Math.max(0, Math.min(event.importance || 0, 3));
  const flag = miniFlag(event.country, event.currency);
  const meta = miniEventMeta(event);
  return (
    <div className="rounded-2xl border border-line bg-surface/70 p-3">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-bg text-lg">
          {flag}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs font-black text-ink">{miniDate(event.date, lang)}</span>
            <span className="font-mono text-[10px] font-bold text-muted">{event.time || "-"}</span>
            {event.currency ? <span className="rounded-full border border-line bg-elevate px-1.5 py-0.5 font-mono text-[9px] font-black text-muted">{event.currency}</span> : null}
          </div>
          <div className="mt-1 truncate font-display text-sm font-black text-ink">{event.name || "-"}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className={`text-[10px] font-black ${impact === 3 ? "text-up" : impact === 2 ? "text-gold" : "text-muted"}`}>
            {impact === 3 ? highLabel : impact === 2 ? mediumLabel : "Low"}
          </div>
          <div className="mt-1 flex h-6 items-end justify-end gap-0.5">
            {[1, 2, 3].map((level) => (
              <span
                key={level}
                className={`w-1.5 rounded-full ${
                  level <= impact
                    ? impact === 3
                      ? "bg-up"
                      : impact === 2
                        ? "bg-gold"
                        : "bg-muted"
                    : "bg-line"
                }`}
                style={{ height: `${level * 5 + 4}px` }}
              />
            ))}
          </div>
        </div>
      </div>
      {meta ? <div className="mt-2 truncate text-[11px] font-semibold text-muted">{meta}</div> : null}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface/40 p-6 text-center">
      <CheckCircle className="mx-auto h-7 w-7 text-muted" />
      <div className="mt-2 text-sm font-bold text-muted">{text}</div>
    </div>
  );
}

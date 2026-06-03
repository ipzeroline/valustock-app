"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { num } from "@/lib/format";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle,
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
  member: {
    email: string;
    plan: string;
    telegramUser?: { first_name?: string; username?: string };
  };
  capabilities: { portfolio: boolean; compare: boolean; alerts: boolean };
  portfolio: {
    totalValue: number;
    pnl: number;
    pnlPct: number;
    positions: Array<{
      symbol: string;
      name: string;
      shares: number;
      avgCost: number;
      price: number;
      value: number;
      pnl: number;
      pnlPct: number;
    }>;
  };
  watchlist: Array<{
    symbol: string;
    name: string;
    price: number;
    changePct: number;
    fairValue: number;
    mos: number;
    dividendYield: number;
    roe: number | null;
    verdict: string;
  }>;
  compareSets: Array<{
    id: string;
    name: string;
    symbols: string[];
    chartMetric: string;
    mosLeader: { symbol: string; mos: number } | null;
    yieldLeader: { symbol: string; dividendYield: number } | null;
  }>;
};

type Tab = "portfolio" | "compare" | "watchlist";

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

export default function TelegramMiniAppPage() {
  const [initData, setInitData] = useState("");
  const [summary, setSummary] = useState<MiniSummary | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("portfolio");
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

  useEffect(() => {
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

  const sendAction = async (action: "watchlist_summary" | "compare_alert", setId?: string) => {
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
      setMessage("ส่งเข้า Telegram แล้ว");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Telegram action failed");
    } finally {
      setActionLoading("");
    }
  };

  const topPosition = useMemo(() => summary?.portfolio.positions[0] || null, [summary]);

  return (
    <main className="min-h-screen bg-bg px-4 py-4 text-ink">
      <div className="mx-auto max-w-md space-y-4">
        <header className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-brand">
                <Shield className="h-4 w-4" />
                ValuStock Telegram
              </div>
              <h1 className="mt-2 font-display text-2xl font-black leading-tight">
                Mini Portfolio & Compare
              </h1>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">
                {summary
                  ? `${summary.member.email} · ${summary.member.plan.toUpperCase()}`
                  : "เปิดจาก Telegram เพื่อดูข้อมูลสมาชิกแบบปลอดภัย"}
              </p>
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
        </header>

        {!isTelegram && !loading ? (
          <section className="rounded-2xl border border-gold/35 bg-gold/10 p-4 text-sm font-semibold leading-relaxed text-muted">
            <div className="flex items-center gap-2 font-display text-base font-black text-ink">
              <Bell className="h-5 w-5 text-gold" />
              ต้องเปิดผ่าน Telegram
            </div>
            <p className="mt-2">
              หน้านี้ต้องเปิดจาก Mini App ของ @valustockbot เพื่อให้ระบบตรวจตัวตนด้วย Telegram initData
            </p>
            <Link href="/" className="mt-3 inline-flex items-center gap-1 text-brand">
              กลับเว็บหลัก <ArrowRight className="h-4 w-4" />
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
            กำลังโหลดข้อมูลจาก Telegram...
          </section>
        ) : summary ? (
          <>
            <nav className="grid grid-cols-3 gap-1 rounded-2xl border border-line bg-surface p-1">
              {[
                { id: "portfolio" as Tab, label: "Portfolio", icon: Wallet },
                { id: "compare" as Tab, label: "Compare", icon: Layers },
                { id: "watchlist" as Tab, label: "Watchlist", icon: Star },
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

            {activeTab === "portfolio" ? (
              <section className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label="มูลค่าพอร์ต" value={num(summary.portfolio.totalValue, 0)} tone="gold" />
                  <MiniStat
                    label="กำไร/ขาดทุน"
                    value={`${summary.portfolio.pnl >= 0 ? "+" : ""}${num(summary.portfolio.pnl, 0)} (${num(summary.portfolio.pnlPct, 1)}%)`}
                    tone={summary.portfolio.pnl >= 0 ? "up" : "down"}
                  />
                </div>
                {topPosition ? (
                  <div className="rounded-2xl border border-line bg-surface p-4">
                    <div className="flex items-center gap-2 text-xs font-black text-muted">
                      <BarChart3 className="h-4 w-4 text-brand" />
                      หุ้นมูลค่าสูงสุดในพอร์ต
                    </div>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div>
                        <div className="font-display text-xl font-black">{topPosition.symbol}</div>
                        <div className="text-xs font-semibold text-muted">{topPosition.name}</div>
                      </div>
                      <div className={topPosition.pnl >= 0 ? "text-right text-up" : "text-right text-down"}>
                        <div className="font-display text-lg font-black">{num(topPosition.value, 0)}</div>
                        <div className="text-xs font-bold">{topPosition.pnl >= 0 ? "+" : ""}{num(topPosition.pnlPct, 1)}%</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState text="ยังไม่มีรายการพอร์ตในระบบ" />
                )}
                <div className="space-y-2">
                  {summary.portfolio.positions.slice(0, 6).map((pos) => (
                    <AssetRow
                      key={pos.symbol}
                      title={pos.symbol}
                      subtitle={`${num(pos.shares, 2)} หุ้น · avg ${num(pos.avgCost, 2)}`}
                      value={num(pos.value, 0)}
                      change={pos.pnlPct}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {activeTab === "compare" ? (
              <section className="space-y-3">
                {summary.compareSets.length === 0 ? (
                  <EmptyState text="ยังไม่มี Compare Set ที่บันทึกไว้" />
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
                          {actionLoading === set.id ? "ส่ง..." : "ส่ง"}
                        </Button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <MiniStat
                          label="MOS Leader"
                          value={set.mosLeader ? `${set.mosLeader.symbol} ${num(set.mosLeader.mos, 0)}%` : "-"}
                          tone="up"
                        />
                        <MiniStat
                          label="Yield Leader"
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
                  {actionLoading === "watchlist_summary" ? "กำลังส่ง..." : "ส่ง Watchlist Summary เข้า Telegram"}
                </Button>
                {summary.watchlist.length === 0 ? (
                  <EmptyState text="ยังไม่มีหุ้นใน Watchlist" />
                ) : (
                  summary.watchlist.map((stock) => (
                    <AssetRow
                      key={stock.symbol}
                      title={stock.symbol}
                      subtitle={`${stock.name} · MOS ${stock.mos >= 0 ? "+" : ""}${num(stock.mos, 0)}% · Yield ${num(stock.dividendYield, 1)}%`}
                      value={num(stock.price, 2)}
                      change={stock.changePct}
                    />
                  ))
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface/40 p-6 text-center">
      <CheckCircle className="mx-auto h-7 w-7 text-muted" />
      <div className="mt-2 text-sm font-bold text-muted">{text}</div>
    </div>
  );
}

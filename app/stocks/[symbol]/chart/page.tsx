"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AssetLogo } from "@/components/AssetLogo";
import { Badge } from "@/components/ui/Card";
import { LockedCard } from "@/components/Paywall";
import { useCurrentPlan } from "@/lib/store";
import { useTranslation } from "@/lib/translations";
import { OhlcPoint, Stock } from "@/lib/types";
import { num } from "@/lib/format";
import { ArrowRight, Info, Search, Shield, Sparkles, Star, TrendingUp } from "@/lib/icons";

type ChartRange = "1M" | "3M" | "6M" | "1Y" | "5Y" | "CUSTOM";
type ToolMode = "crosshair" | "support" | "trend";

const rangeSize: Record<ChartRange, number> = {
  "1M": 22,
  "3M": 66,
  "6M": 132,
  "1Y": 252,
  "5Y": 1260,
  "CUSTOM": 0,
};

function syntheticOhlc(priceHistory: number[] = []): OhlcPoint[] {
  const start = new Date();
  start.setDate(start.getDate() - priceHistory.length);

  return priceHistory.map((close, index) => {
    const previous = priceHistory[index - 1] || close * 0.99;
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const spread = Math.max(close * 0.006, Math.abs(close - previous) * 0.65);
    return {
      date: date.toISOString().split("T")[0],
      open: Math.round(previous * 100) / 100,
      high: Math.round((Math.max(previous, close) + spread) * 100) / 100,
      low: Math.round(Math.max(0.01, Math.min(previous, close) - spread) * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(500000 + ((index + 7) * 7919) % 3500000),
    };
  });
}

function sma(values: number[], period: number) {
  return values.map((_, index) => {
    if (index + 1 < period) return null;
    const slice = values.slice(index + 1 - period, index + 1);
    return slice.reduce((sum, value) => sum + value, 0) / period;
  });
}

function ema(values: number[], period: number) {
  const out: Array<number | null> = [];
  const multiplier = 2 / (period + 1);
  let current: number | null = null;
  values.forEach((value, index) => {
    if (index + 1 < period) {
      out.push(null);
      return;
    }
    if (current === null) {
      const seed = values.slice(index + 1 - period, index + 1);
      current = seed.reduce((sum, item) => sum + item, 0) / period;
    } else {
      current = (value - current) * multiplier + current;
    }
    out.push(current);
  });
  return out;
}

function rsi(values: number[], period = 14) {
  const out: Array<number | null> = Array(values.length).fill(null);
  for (let index = period; index < values.length; index += 1) {
    let gains = 0;
    let losses = 0;
    for (let cursor = index - period + 1; cursor <= index; cursor += 1) {
      const diff = values[cursor] - values[cursor - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    if (losses === 0) out[index] = 100;
    else {
      const rs = gains / losses;
      out[index] = 100 - 100 / (1 + rs);
    }
  }
  return out;
}

function bollinger(values: number[], period = 20) {
  const middle = sma(values, period);
  const upper: Array<number | null> = [];
  const lower: Array<number | null> = [];
  values.forEach((_, index) => {
    const mid = middle[index];
    if (mid === null || index + 1 < period) {
      upper.push(null);
      lower.push(null);
      return;
    }
    const slice = values.slice(index + 1 - period, index + 1);
    const variance = slice.reduce((sum, value) => sum + Math.pow(value - mid, 2), 0) / period;
    const deviation = Math.sqrt(variance);
    upper.push(mid + deviation * 2);
    lower.push(mid - deviation * 2);
  });
  return { middle, upper, lower };
}

function macd(values: number[]) {
  const fast = ema(values, 12);
  const slow = ema(values, 26);
  const line = values.map((_, index) => {
    if (fast[index] === null || slow[index] === null) return null;
    return Number(fast[index]) - Number(slow[index]);
  });
  const signalInput = line.map((value) => value ?? 0);
  const signalRaw = ema(signalInput, 9);
  const signal = signalRaw.map((value, index) => (line[index] === null ? null : value));
  const histogram = line.map((value, index) => {
    if (value === null || signal[index] === null) return null;
    return value - Number(signal[index]);
  });
  return { line, signal, histogram };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function polyline(points: Array<number | null>, x: (index: number) => number, y: (value: number) => number) {
  return points
    .map((value, index) => (value === null || !Number.isFinite(value) ? null : `${x(index)},${y(value)}`))
    .filter(Boolean)
    .join(" ");
}

export default function TechnicalChartPage() {
  const params = useParams();
  const symbol = String(params?.symbol || "").toUpperCase();
  const plan = useCurrentPlan();
  const { lang } = useTranslation();
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<ChartRange>("1Y");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [customError, setCustomError] = useState("");
  const [tool, setTool] = useState<ToolMode>("crosshair");
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(true);
  const [showMA200, setShowMA200] = useState(false);
  const [showEMA21, setShowEMA21] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [supportLines, setSupportLines] = useState<number[]>([]);
  const [trendLines, setTrendLines] = useState<Array<{ start: number; end: number }>>([]);
  const [pendingTrendStart, setPendingTrendStart] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    fetch(`/api/stock/${symbol}`)
      .then((res) => res.json())
      .then((payload) => {
        if (payload && !payload.error) setStock(payload);
      })
      .finally(() => setLoading(false));
  }, [symbol]);

  const fullHistory = useMemo(() => {
    if (!stock) return [];
    return stock.ohlcHistory?.length ? stock.ohlcHistory : syntheticOhlc(stock.priceHistory);
  }, [stock]);

  useEffect(() => {
    if (!fullHistory.length || customStart || customEnd) return;
    setCustomStart(fullHistory[Math.max(0, fullHistory.length - 132)]?.date || fullHistory[0]?.date || "");
    setCustomEnd(fullHistory[fullHistory.length - 1]?.date || "");
  }, [fullHistory, customStart, customEnd]);

  const visible = useMemo(() => {
    if (range === "CUSTOM") {
      const start = customStart || fullHistory[0]?.date || "";
      const end = customEnd || fullHistory[fullHistory.length - 1]?.date || "";
      return fullHistory.filter((item) => item.date >= start && item.date <= end);
    }
    return fullHistory.slice(-Math.min(rangeSize[range], fullHistory.length));
  }, [fullHistory, range, customStart, customEnd]);

  const chart = useMemo(() => {
    const closes = visible.map((item) => item.close);
    const highs = visible.map((item) => item.high);
    const lows = visible.map((item) => item.low);
    const volumes = visible.map((item) => item.volume || 0);
    const bands = bollinger(closes, 20);
    return {
      closes,
      highs,
      lows,
      volumes,
      ma20: sma(closes, 20),
      ma50: sma(closes, 50),
      ma200: sma(closes, 200),
      ema21: ema(closes, 21),
      bands,
      rsi: rsi(closes, 14),
      macd: macd(closes),
    };
  }, [visible]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!plan.limits.dcf) {
    return (
      <div className="mx-auto max-w-4xl py-10">
        <LockedCard
          required="pro"
          title={lang === "th" ? "Technical Chart Workspace" : "Technical Chart Workspace"}
          desc={lang === "th" ? "กราฟแท่งเทียนเต็มรูปแบบพร้อม Volume, Indicators และเครื่องมือวาด เปิดให้ใช้ในแพ็กเกจโปรขึ้นไป" : "Full candlestick workspace with volume, indicators and drawing tools is available on Pro and above."}
        />
      </div>
    );
  }

  if (loading || !stock) {
    return (
      <div className="mx-auto max-w-5xl py-20 text-center">
        <Sparkles className="mx-auto h-9 w-9 animate-spin text-brand" />
        <div className="mt-3 text-sm font-bold text-muted">{lang === "th" ? "กำลังโหลดกราฟเทคนิค..." : "Loading technical chart..."}</div>
      </div>
    );
  }

  const width = 1180;
  const height = 640;
  const pad = { left: 56, right: 70, top: 22, bottom: 26 };
  const priceTop = pad.top;
  const priceHeight = 360;
  const volumeTop = 400;
  const volumeHeight = 78;
  const rsiTop = 505;
  const rsiHeight = 70;
  const macdTop = 590;
  const macdHeight = 52;
  const minPrice = Math.min(...chart.lows, ...chart.bands.lower.filter((v): v is number => v !== null));
  const maxPrice = Math.max(...chart.highs, ...chart.bands.upper.filter((v): v is number => v !== null));
  const priceRange = Math.max(maxPrice - minPrice, 1);
  const maxVolume = Math.max(...chart.volumes, 1);
  const macdValues = [...chart.macd.line, ...chart.macd.signal, ...chart.macd.histogram].filter((v): v is number => v !== null);
  const macdMin = Math.min(...macdValues, -1);
  const macdMax = Math.max(...macdValues, 1);
  const macdRange = Math.max(macdMax - macdMin, 1);
  const step = visible.length > 1 ? (width - pad.left - pad.right) / (visible.length - 1) : width - pad.left - pad.right;
  const candleWidth = Math.max(3, Math.min(11, step * 0.58));
  const active = visible[hoverIndex ?? visible.length - 1];
  const chartSource = stock.chartSource || (stock.ohlcHistory?.length ? "api-history" : "synthetic");
  const chartSourceLabel = chartSource === "synthetic" || chartSource.includes("simulated")
    ? (lang === "th" ? "ข้อมูลพื้นฐาน" : "Basic history")
    : (lang === "th" ? "ข้อมูลตลาดย้อนหลัง" : "Historical market data");
  const chartUpdatedAt = stock.chartUpdatedAt ? new Date(stock.chartUpdatedAt) : null;
  const chartUpdatedLabel =
    chartUpdatedAt && !Number.isNaN(chartUpdatedAt.getTime())
      ? chartUpdatedAt.toLocaleString(lang === "th" ? "th-TH" : "en-US", { dateStyle: "medium", timeStyle: "short" })
      : "-";

  const x = (index: number) => pad.left + index * step;
  const priceY = (value: number) => priceTop + ((maxPrice - value) / priceRange) * priceHeight;
  const volumeY = (value: number) => volumeTop + volumeHeight - (value / maxVolume) * volumeHeight;
  const rsiY = (value: number) => rsiTop + ((100 - value) / 100) * rsiHeight;
  const macdY = (value: number) => macdTop + ((macdMax - value) / macdRange) * macdHeight;

  const handleChartClick = () => {
    const index = hoverIndex;
    if (index === null) return;
    if (tool === "support") {
      setSupportLines((current) => [...current, visible[index].close]);
    }
    if (tool === "trend") {
      if (pendingTrendStart === null) setPendingTrendStart(index);
      else {
        setTrendLines((current) => [...current, { start: pendingTrendStart, end: index }]);
        setPendingTrendStart(null);
      }
    }
  };

  const resetDrawings = () => {
    setSupportLines([]);
    setTrendLines([]);
    setPendingTrendStart(null);
  };

  const applyCustomRange = () => {
    setCustomError("");
    if (!customStart || !customEnd) {
      setCustomError(lang === "th" ? "กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด" : "Select both start and end dates.");
      return;
    }
    if (customStart > customEnd) {
      setCustomError(lang === "th" ? "วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด" : "Start date must be before end date.");
      return;
    }
    const matches = fullHistory.filter((item) => item.date >= customStart && item.date <= customEnd);
    if (!matches.length) {
      setCustomError(lang === "th" ? "ไม่มีข้อมูลในช่วงวันที่นี้" : "No data in this date range.");
      return;
    }
    setRange("CUSTOM");
  };

  const resetCustomRange = () => {
    setCustomError("");
    setRange("1Y");
    setCustomStart(fullHistory[Math.max(0, fullHistory.length - 132)]?.date || fullHistory[0]?.date || "");
    setCustomEnd(fullHistory[fullHistory.length - 1]?.date || "");
  };

  const toggleFullscreen = async () => {
    const element = workspaceRef.current;
    if (!element) return;

    try {
      if (!document.fullscreenElement) {
        await element.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((current) => !current);
    }
  };

  return (
    <div
      ref={workspaceRef}
      className={`${isFullscreen ? "fixed inset-0 z-50 max-w-none overflow-auto bg-bg p-4" : "mx-auto max-w-[1440px] px-3 py-4"} space-y-4`}
    >
      <div className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <AssetLogo symbol={stock.symbol} color={stock.color} size="md" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-black text-ink">{stock.symbol} Technical Chart</h1>
              <Badge tone="muted">{stock.market}</Badge>
              <Badge tone="gold">Pro</Badge>
              <Badge tone={stock.quoteIsDelayed ? "muted" : "up"}>
                {stock.quoteIsDelayed ? `${stock.quoteDelayMinutes || 15}m delayed` : "Realtime"}
              </Badge>
            </div>
            <p className="truncate text-sm font-medium text-muted">{lang === "th" ? stock.name : stock.enName}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-line px-3 text-xs font-bold text-muted hover:text-ink"
          >
            {isFullscreen ? lang === "th" ? "ออกจากเต็มจอ" : "Exit Fullscreen" : lang === "th" ? "เต็มจอ" : "Fullscreen"}
          </button>
          <Link href={`/stocks/${stock.symbol}`} className="inline-flex h-9 items-center justify-center rounded-lg border border-line px-3 text-xs font-bold text-muted hover:text-ink">
            {lang === "th" ? "กลับหน้า Valuation" : "Back to Valuation"}
          </Link>
          <Link href="/stocks" className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-line px-3 text-xs font-bold text-muted hover:text-ink">
            <Search className="h-3.5 w-3.5" /> {lang === "th" ? "ค้นหาหุ้น" : "Search"}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-3 rounded-2xl border border-line bg-surface p-4">
          <Panel title={lang === "th" ? "ช่วงเวลา" : "Range"}>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(rangeSize) as ChartRange[]).map((item) => (
                <Toggle key={item} active={range === item} onClick={() => setRange(item)}>{item}</Toggle>
              ))}
            </div>
            <div className="mt-3 space-y-2 rounded-xl border border-line bg-bg p-3">
              <div className="text-[11px] font-black uppercase text-muted">Custom Range</div>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-muted">{lang === "th" ? "เริ่มต้น" : "Start"}</span>
                <input
                  type="date"
                  value={customStart}
                  min={fullHistory[0]?.date}
                  max={fullHistory[fullHistory.length - 1]?.date}
                  onChange={(event) => setCustomStart(event.target.value)}
                  className="input-base h-9 text-xs"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-muted">{lang === "th" ? "สิ้นสุด" : "End"}</span>
                <input
                  type="date"
                  value={customEnd}
                  min={fullHistory[0]?.date}
                  max={fullHistory[fullHistory.length - 1]?.date}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  className="input-base h-9 text-xs"
                />
              </label>
              {customError && <div className="text-[11px] font-bold text-down">{customError}</div>}
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" onClick={applyCustomRange} className="h-8 rounded-lg bg-brand text-xs font-bold text-bg">
                  Apply
                </button>
                <button type="button" onClick={resetCustomRange} className="h-8 rounded-lg border border-line text-xs font-bold text-muted hover:text-ink">
                  Reset
                </button>
              </div>
            </div>
          </Panel>

          <Panel title={lang === "th" ? "เครื่องมือ" : "Tools"}>
            <div className="grid gap-1.5">
              <Toggle active={tool === "crosshair"} onClick={() => setTool("crosshair")}>Crosshair</Toggle>
              <Toggle active={tool === "support"} onClick={() => setTool("support")}>{lang === "th" ? "แนวรับ/แนวต้าน" : "Support Line"}</Toggle>
              <Toggle active={tool === "trend"} onClick={() => setTool("trend")}>Trendline</Toggle>
              <button onClick={resetDrawings} className="h-8 rounded-lg border border-line text-xs font-bold text-muted hover:text-ink">
                {lang === "th" ? "ล้างเส้นวาด" : "Clear Drawings"}
              </button>
            </div>
          </Panel>

          <Panel title="Overlays">
            <Check label="MA20" checked={showMA20} setChecked={setShowMA20} />
            <Check label="MA50" checked={showMA50} setChecked={setShowMA50} />
            <Check label="MA200" checked={showMA200} setChecked={setShowMA200} />
            <Check label="EMA21" checked={showEMA21} setChecked={setShowEMA21} />
            <Check label="Bollinger" checked={showBollinger} setChecked={setShowBollinger} />
          </Panel>

          <Panel title="Oscillators">
            <Check label="RSI 14" checked={showRSI} setChecked={setShowRSI} />
            <Check label="MACD" checked={showMACD} setChecked={setShowMACD} />
          </Panel>

          <div className="rounded-xl border border-line bg-bg p-3 text-xs font-semibold leading-relaxed text-muted">
            <div className="mb-1 flex items-center gap-2 font-bold text-ink">
              <Info className="h-3.5 w-3.5 text-brand" />
              {lang === "th" ? "ข้อมูลตลาด" : "Market Data"}
            </div>
            <div>
              {lang === "th" ? "ชุดข้อมูลกราฟ" : "Chart dataset"}: <span className="text-ink">{chartSourceLabel}</span>
            </div>
            <div>
              {lang === "th" ? "อัปเดต" : "Updated"}: <span className="text-ink">{chartUpdatedLabel}</span>
            </div>
            <div className="mt-2">
              {lang === "th"
                ? "ใช้ OHLC และ Volume จากแหล่งข้อมูลตลาดก่อนเสมอ หากไม่มีข้อมูลจึงใช้ข้อมูลเดิม"
                : "Uses market OHLC and volume first. Static history is used only when market data is unavailable."}
            </div>
          </div>
        </aside>

        <section className="min-w-0 rounded-2xl border border-line bg-surface">
          <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="Open" value={active ? num(active.open, 2) : "-"} />
              <Kpi label="High" value={active ? num(active.high, 2) : "-"} tone="up" />
              <Kpi label="Low" value={active ? num(active.low, 2) : "-"} tone="down" />
              <Kpi label="Close" value={active ? num(active.close, 2) : "-"} />
            </div>
            <div className="text-xs font-bold text-muted">
              {active?.date || "-"} · Vol {active ? num(active.volume, 0) : "-"}
            </div>
          </div>

          <div className="p-2">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-[640px] w-full rounded-xl bg-bg"
              role="img"
              aria-label={`${stock.symbol} technical candlestick chart`}
              onMouseMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const localX = ((event.clientX - rect.left) / rect.width) * width;
                const index = Math.round((localX - pad.left) / step);
                if (index >= 0 && index < visible.length) setHoverIndex(index);
              }}
              onMouseLeave={() => setHoverIndex(null)}
              onClick={handleChartClick}
            >
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const value = maxPrice - priceRange * ratio;
                const y = priceY(value);
                return (
                  <g key={ratio}>
                    <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="rgb(38 48 66)" strokeDasharray="4 6" />
                    <text x={width - pad.right + 8} y={y + 4} fill="rgb(138 150 170)" fontSize="11">{num(value, 2)}</text>
                  </g>
                );
              })}

              {visible.map((item, index) => {
                const green = item.close >= item.open;
                const color = green ? "rgb(52 211 153)" : "rgb(248 113 113)";
                const center = x(index);
                const openY = priceY(item.open);
                const closeY = priceY(item.close);
                const highY = priceY(item.high);
                const lowY = priceY(item.low);
                const bodyY = Math.min(openY, closeY);
                const bodyHeight = Math.max(2, Math.abs(closeY - openY));
                const volY = volumeY(item.volume || 0);
                const label = visible.length < 18 || index === 0 || index === visible.length - 1 || index % Math.ceil(visible.length / 5) === 0;
                return (
                  <g key={`${item.date}-${index}`}>
                    <line x1={center} x2={center} y1={highY} y2={lowY} stroke={color} strokeWidth="1.4" />
                    <rect x={center - candleWidth / 2} y={bodyY} width={candleWidth} height={bodyHeight} rx="1.4" fill={color} />
                    <rect x={center - candleWidth / 2} y={volY} width={candleWidth} height={volumeTop + volumeHeight - volY} rx="1" fill={color} opacity="0.32" />
                    {label && <text x={center} y={height - 8} textAnchor="middle" fontSize="10" fill="rgb(138 150 170)">{formatDate(item.date)}</text>}
                  </g>
                );
              })}

              {showBollinger && <polyline points={polyline(chart.bands.upper, x, priceY)} fill="none" stroke="rgb(96 165 250)" strokeWidth="1.2" opacity="0.7" />}
              {showBollinger && <polyline points={polyline(chart.bands.lower, x, priceY)} fill="none" stroke="rgb(96 165 250)" strokeWidth="1.2" opacity="0.7" />}
              {showMA20 && <polyline points={polyline(chart.ma20, x, priceY)} fill="none" stroke="rgb(232 188 96)" strokeWidth="1.7" />}
              {showMA50 && <polyline points={polyline(chart.ma50, x, priceY)} fill="none" stroke="rgb(96 165 250)" strokeWidth="1.7" />}
              {showMA200 && <polyline points={polyline(chart.ma200, x, priceY)} fill="none" stroke="rgb(196 181 253)" strokeWidth="1.7" />}
              {showEMA21 && <polyline points={polyline(chart.ema21, x, priceY)} fill="none" stroke="rgb(251 146 60)" strokeWidth="1.7" />}

              {supportLines.map((value, index) => (
                <g key={`${value}-${index}`}>
                  <line x1={pad.left} x2={width - pad.right} y1={priceY(value)} y2={priceY(value)} stroke="rgb(232 188 96)" strokeDasharray="8 5" />
                  <text x={pad.left + 6} y={priceY(value) - 5} fill="rgb(232 188 96)" fontSize="11">{num(value, 2)}</text>
                </g>
              ))}

              {trendLines.map((line, index) => (
                <line key={index} x1={x(line.start)} y1={priceY(visible[line.start]?.close || 0)} x2={x(line.end)} y2={priceY(visible[line.end]?.close || 0)} stroke="rgb(52 211 153)" strokeWidth="2" />
              ))}

              <line x1={pad.left} x2={width - pad.right} y1={volumeTop - 12} y2={volumeTop - 12} stroke="rgb(38 48 66)" />
              <text x={pad.left} y={volumeTop - 18} fill="rgb(138 150 170)" fontSize="11">Volume</text>

              {showRSI && (
                <g>
                  <line x1={pad.left} x2={width - pad.right} y1={rsiY(70)} y2={rsiY(70)} stroke="rgb(248 113 113)" strokeDasharray="4 5" opacity="0.7" />
                  <line x1={pad.left} x2={width - pad.right} y1={rsiY(30)} y2={rsiY(30)} stroke="rgb(52 211 153)" strokeDasharray="4 5" opacity="0.7" />
                  <polyline points={polyline(chart.rsi, x, rsiY)} fill="none" stroke="rgb(232 188 96)" strokeWidth="1.6" />
                  <text x={pad.left} y={rsiTop - 6} fill="rgb(138 150 170)" fontSize="11">RSI 14</text>
                </g>
              )}

              {showMACD && (
                <g>
                  <line x1={pad.left} x2={width - pad.right} y1={macdY(0)} y2={macdY(0)} stroke="rgb(38 48 66)" />
                  {chart.macd.histogram.map((value, index) => {
                    if (value === null) return null;
                    const center = x(index);
                    const zero = macdY(0);
                    const y = macdY(value);
                    return <rect key={index} x={center - candleWidth / 2} y={Math.min(zero, y)} width={candleWidth} height={Math.max(1, Math.abs(zero - y))} fill={value >= 0 ? "rgb(52 211 153)" : "rgb(248 113 113)"} opacity="0.55" />;
                  })}
                  <polyline points={polyline(chart.macd.line, x, macdY)} fill="none" stroke="rgb(96 165 250)" strokeWidth="1.4" />
                  <polyline points={polyline(chart.macd.signal, x, macdY)} fill="none" stroke="rgb(232 188 96)" strokeWidth="1.4" />
                  <text x={pad.left} y={macdTop - 6} fill="rgb(138 150 170)" fontSize="11">MACD</text>
                </g>
              )}

              {hoverIndex !== null && (
                <g>
                  <line x1={x(hoverIndex)} x2={x(hoverIndex)} y1={priceTop} y2={height - pad.bottom} stroke="rgb(138 150 170)" strokeDasharray="5 5" opacity="0.65" />
                  <circle cx={x(hoverIndex)} cy={priceY(visible[hoverIndex].close)} r="4" fill="rgb(232 188 96)" />
                </g>
              )}
            </svg>
          </div>
        </section>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-black uppercase text-muted">{title}</h2>
      {children}
    </div>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded-lg px-2.5 text-xs font-bold transition ${
        active ? "bg-brand text-bg" : "border border-line text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Check({ label, checked, setChecked }: { label: string; checked: boolean; setChecked: (checked: boolean) => void }) {
  return (
    <label className="flex h-8 cursor-pointer items-center justify-between rounded-lg border border-line px-2.5 text-xs font-bold text-muted">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="accent-brand" />
    </label>
  );
}

function Kpi({ label, value, tone = "ink" }: { label: string; value: string; tone?: "ink" | "up" | "down" }) {
  const toneClass = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-ink";
  return (
    <div className="rounded-xl border border-line bg-bg px-3 py-2">
      <div className="text-[10px] font-bold uppercase text-muted">{label}</div>
      <div className={`num mt-0.5 text-sm font-black ${toneClass}`}>{value}</div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { STOCKS, getStock } from "@/lib/stocks";
import {
  computeValuation,
  defaultDCFParams,
  marketCap,
} from "@/lib/valuation";
import { useCurrentPlan } from "@/lib/store";
import { baht, num, pct, moneyMB, dollar, nav } from "@/lib/format";
import { Card, CardHeader, Badge } from "@/components/ui/Card";
import { LockedCard } from "@/components/Paywall";
import { useTranslation } from "@/lib/translations";
import { AssetLogo } from "@/components/AssetLogo";
import {
  Plus,
  X,
  Layers,
  Search,
  Calculator,
  TrendingUp,
  TrendingDown,
  Info,
  Crown,
  ChevronRight,
  Star,
  Zap,
} from "@/lib/icons";

const verdictTone = {
  undervalued: "up",
  fair: "muted",
  overvalued: "down",
} as const;

type ChartMetric = "mos" | "yield" | "roe" | "margin";

export default function ComparePage() {
  const plan = useCurrentPlan();
  const { t, lang } = useTranslation();

  // Picked stocks (up to 4)
  const [picked, setPicked] = useState<string[]>(["PTT", "AOT", "KBANK"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChartMetric, setActiveChartMetric] = useState<ChartMetric>("mos");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    valuation: true,
    profitability: true,
    solvency: true,
    funds: false,
  });

  // Search & Filter available stocks
  const available = useMemo(() => {
    return STOCKS.filter(
      (s) =>
        !picked.includes(s.symbol) &&
        (s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.enName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [picked, searchQuery]);

  // Check compare limits
  if (!plan.limits.compare) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl text-ink">
            {t("compare.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t("compare.subtitle")}
          </p>
        </div>
        <LockedCard
          required="premium"
          title={t("compare.title")}
          desc={
            lang === "th"
              ? "เปรียบเทียบอัตราส่วนทางการเงิน สุขภาพงบ และมูลค่าเหมาะสมของหุ้นหลายตัวเคียงข้างกันอย่างโปร — เปิดใช้งานด้วยแพ็กเกจพรีเมียม"
              : "Compare multiples and fair values of several securities side-by-side. Unlocked with Premium Plan."
          }
        />
      </div>
    );
  }

  const stocks = picked.map((sym) => getStock(sym)!).filter(Boolean);

  const add = (sym: string) => {
    if (picked.length < 4) {
      setPicked((p) => [...p, sym]);
      setSearchQuery("");
    }
  };

  const remove = (sym: string) => {
    setPicked((p) => p.filter((s) => s !== sym));
  };

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const formatPrice = (s: any, p: number) => {
    if (s.assetType === "US_STOCK" || s.currency === "USD") return dollar(p);
    if (s.assetType === "FUND") return nav(p);
    return baht(p);
  };

  // Winner logic - Dynamic highlighting of leading metric cell in each comparison row
  const getWinnerSymbol = (metric: string) => {
    if (picked.length < 2) return null;
    const scores = picked.map((sym) => {
      const s = getStock(sym)!;
      const v = computeValuation(s, defaultDCFParams(s));
      let score = -99999;

      if (metric === "mos") score = v.marginOfSafety;
      else if (metric === "yield") score = v.ratios.dividendYield;
      else if (metric === "roe") score = isFinite(v.ratios.roe) ? v.ratios.roe : -99999;
      else if (metric === "pe") {
        // Lower positive PE is better. Negatives/NaN are bad.
        score = isFinite(v.ratios.pe) && v.ratios.pe > 0 ? -v.ratios.pe : -99999;
      } else if (metric === "pb") {
        score = isFinite(v.ratios.pb) && v.ratios.pb > 0 ? -v.ratios.pb : -99999;
      } else if (metric === "de") {
        const de =
          s.financials.totalDebt > 0 && s.financials.bookValuePerShare > 0
            ? s.financials.totalDebt / (s.financials.bookValuePerShare * s.sharesOutstanding)
            : 99999;
        score = -de; // lower is better
      } else if (metric === "margin") {
        score = s.financials.revenue > 0 ? (s.financials.netIncome / s.financials.revenue) * 100 : -99999;
      } else if (metric === "growth") score = s.financials.growthRate;
      else if (metric === "expense") {
        score = s.expenseRatio ? -s.expenseRatio : -99999; // lower is better
      }

      return { sym, score };
    });

    scores.sort((a, b) => b.score - a.score);
    if (scores[0].score === -99999 || scores[0].score === 99999) return null;
    return scores[0].sym;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-2 animate-fade-up">
      {/* 🚀 A. HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold md:text-3xl tracking-tight text-ink">
                {lang === "th" ? "สถานีเปรียบเทียบหลักทรัพย์อัจฉริยะ" : "Securities Comparison Terminal"}
              </h1>
              <p className="text-xs text-muted mt-0.5">
                {lang === "th"
                  ? "วิเคราะห์งบดุล ความคุ้มค่า อัตราปันผล และแบบจำลองมูลค่าเหมาะสมเคียงข้างกันสูงสุด 4 หลักทรัพย์"
                  : "Audit balance sheets, multiples, and intrinsic valuations side-by-side for up to 4 assets."}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic selector box */}
        <div className="relative w-full md:w-80 shrink-0">
          <div className="relative">
            <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder={
                picked.length >= 4
                  ? lang === "th"
                    ? "เลือกครบ 4 บริษัทแล้ว"
                    : "Max 4 items selected"
                  : lang === "th"
                  ? "พิมพ์ย่อเพื่อเพิ่มเปรียบเทียบ..."
                  : "Search ticker to add comparison..."
              }
              disabled={picked.length >= 4}
              className="input-base text-xs pl-10 pr-4 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Search Dropdown list overlay */}
          {searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-line rounded-xl shadow-card z-50 max-h-56 overflow-y-auto divide-y divide-line/50 p-1 backdrop-blur-md bg-surface/90">
              {available.length === 0 ? (
                <div className="p-3 text-center space-y-2">
                  <div className="text-[10px] text-muted font-mono leading-none">
                    {lang === "th" ? "ไม่พบในรายการดั้งเดิม" : "Not found in primary list"}
                  </div>
                  <button
                    onClick={async () => {
                      const sym = searchQuery.trim().toUpperCase();
                      if (!sym) return;
                      try {
                        const res = await fetch(`/api/stock/${sym}`);
                        if (res.ok) {
                          const data = await res.json();
                          if (data && data.symbol) {
                            add(data.symbol);
                          }
                        }
                      } catch (err) {
                        console.error("Comparison lookup error", err);
                      }
                    }}
                    className="w-full py-1.5 bg-brand/10 hover:bg-brand text-brand hover:text-ink border border-brand/20 rounded-lg text-center text-[10px] font-bold transition duration-200"
                  >
                    🚀 {lang === "th" 
                      ? `ดึงสัญลักษณ์ "${searchQuery.toUpperCase()}" จาก API` 
                      : `Fetch "${searchQuery.toUpperCase()}" from API`}
                  </button>
                </div>
              ) : (
                available.map((s) => (
                  <button
                    key={s.symbol}
                    onClick={() => add(s.symbol)}
                    className="w-full flex items-center justify-between p-2 hover:bg-brand-soft rounded-lg text-left transition"
                  >
                    <div className="flex items-center gap-2">
                      <AssetLogo symbol={s.symbol} color={s.color} size="sm" />
                      <div>
                        <span className="font-display font-extrabold text-xs text-ink block leading-none">
                          {s.symbol}
                        </span>
                        <span className="text-[10px] text-muted block mt-0.5">
                          {lang === "th" ? s.name : s.enName}
                        </span>
                      </div>
                    </div>
                    <Badge tone="brand" className="text-[9px] py-0.5">
                      {s.assetType}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {stocks.length === 0 ? (
        <Card className="p-16 text-center border border-dashed border-line">
          <Layers className="mx-auto h-12 w-12 text-muted animate-pulse" />
          <h3 className="mt-4 font-display font-bold text-base text-ink">
            {lang === "th" ? "ยังไม่ได้เลือกหลักทรัพย์เพื่อวิเคราะห์" : "No Securities Selected"}
          </h3>
          <p className="mt-1 text-xs text-muted max-w-sm mx-auto leading-relaxed">
            {lang === "th"
              ? "โปรดค้นหาบริษัทที่ต้องการเปรียบเทียบในช่องค้นหาขวาบน เพื่อเริ่มกระบวนการสแกนและเปรียบเทียบมูลค่าที่แท้จริงแบบสด"
              : "Search and add corporate assets in the search console above to start side-by-side valuation auditing."}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 🚀 B. DYNAMIC SUMMARY SCORECARDS (UP TO 4 SIDE-BY-SIDE) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stocks.map((s) => {
              const v = computeValuation(s, defaultDCFParams(s));
              const isUp = v.marginOfSafety >= 0;
              const change =
                s.prevClose > 0 ? ((s.price - s.prevClose) / s.prevClose) * 100 : 0;
              const priceIsUp = change >= 0;
              const tone = verdictTone[v.verdict] as "up" | "muted" | "down";

              return (
                <Card
                  key={s.symbol}
                  className="border border-line/60 bg-surface/30 p-4 relative overflow-hidden group hover:border-brand/50 transition flex flex-col justify-between"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => remove(s.symbol)}
                    className="absolute top-3 right-3 text-muted hover:text-down p-1 bg-surface border border-line rounded-lg transition"
                    title={lang === "th" ? "นำออก" : "Remove"}
                  >
                    <X className="h-3 w-3" />
                  </button>

                  <div className="space-y-3">
                    {/* Brand header */}
                    <div className="flex items-center gap-2.5">
                      <AssetLogo symbol={s.symbol} color={s.color} size="md" />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-display font-extrabold text-sm text-ink block leading-none">
                            {s.symbol}
                          </span>
                          <span className="text-[8px] border border-line text-muted px-0.5 rounded leading-none shrink-0 scale-90">
                            {s.market}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted truncate max-w-[120px] block mt-1">
                          {lang === "th" ? s.name : s.enName}
                        </span>
                      </div>
                    </div>

                    {/* Prices Row */}
                    <div className="flex items-baseline justify-between border-t border-line/50 pt-2.5">
                      <div>
                        <div className="text-[9px] uppercase font-bold text-muted leading-none">
                          {lang === "th" ? "ราคาปัจจุบัน" : "Mkt Price"}
                        </div>
                        <div className="text-sm font-mono font-extrabold text-ink mt-1.5 leading-none">
                          {formatPrice(s, s.price)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] uppercase font-bold text-muted leading-none">
                          {lang === "th" ? "ผลตอบแทน 24 ชม." : "24h Return"}
                        </div>
                        <div
                          className={`text-xs font-mono font-bold mt-1.5 leading-none flex items-center justify-end gap-0.5 ${
                            priceIsUp ? "text-up" : "text-down"
                          }`}
                        >
                          {priceIsUp ? (
                            <TrendingUp className="h-3 w-3 shrink-0" />
                          ) : (
                            <TrendingDown className="h-3 w-3 shrink-0" />
                          )}
                          {change.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* MOS Indicator for Non-Funds */}
                    {s.assetType !== "FUND" ? (
                      <div className="flex items-baseline justify-between border-t border-line/50 pt-2.5">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted block leading-none">
                            {lang === "th" ? "มูลค่าเหมาะสม" : "Fair Value"}
                          </span>
                          <span className="text-sm font-mono font-extrabold text-gold block mt-1.5 leading-none">
                            {formatPrice(s, v.fairValue)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold text-muted block leading-none">
                            {lang === "th" ? "ส่วนเผื่อความปลอดภัย" : "MOS %"}
                          </span>
                          <span
                            className={`text-xs font-mono font-black block mt-1.5 leading-none ${
                              isUp ? "text-up" : "text-down"
                            }`}
                          >
                            {isUp ? "+" : ""}
                            {v.marginOfSafety.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-elevate/45 border border-line rounded-lg p-2 text-center text-[10px] text-muted font-semibold mt-1">
                        NAV-Backed Fund Multiples
                      </div>
                    )}

                    {/* SVG Sparkline comparison */}
                    <div className="h-10 pt-2 flex items-center justify-center border-t border-line/45">
                      <Sparkline data={s.priceHistory} up={priceIsUp} symbol={s.symbol} />
                    </div>
                  </div>

                  {/* Verdict bottom tag */}
                  <div className="mt-3.5 pt-2 border-t border-line/50 text-center">
                    <Badge tone={tone} className="w-full text-[9px] font-bold py-0.5 justify-center">
                      {t(`verdict.${v.verdict}`)}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* 🚀 C. SVG METRIC VISUAL COMPARATOR PANEL */}
          {stocks.length >= 2 && (
            <Card className="border border-line/80 bg-surface/30 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4 mb-4 gap-4">
                <div>
                  <h3 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5 uppercase tracking-wider">
                    <Zap className="h-4.5 w-4.5 text-brand" />
                    {lang === "th" ? "ตัวแสดงกราฟฟิคเปรียบเทียบสถิติ" : "SVG Metric Visualizers"}
                  </h3>
                  <p className="text-[10px] text-muted mt-0.5">
                    {lang === "th"
                      ? "แสดงค่าเปรียบเทียบสเกลอัจฉริยะตามสีประจำบริษัทของแต่ละหลักทรัพย์"
                      : "Scalable side-by-side indicator charts with custom corporate identity colors."}
                  </p>
                </div>

                {/* Metric toggle bar */}
                <div className="flex flex-wrap gap-1 bg-elevate p-0.5 rounded-xl text-[10px] font-bold">
                  <button
                    onClick={() => setActiveChartMetric("mos")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeChartMetric === "mos"
                        ? "bg-surface text-brand shadow-sm border border-line/50"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    MOS %
                  </button>
                  <button
                    onClick={() => setActiveChartMetric("yield")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeChartMetric === "yield"
                        ? "bg-surface text-brand shadow-sm border border-line/50"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    Yield %
                  </button>
                  <button
                    onClick={() => setActiveChartMetric("roe")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeChartMetric === "roe"
                        ? "bg-surface text-brand shadow-sm border border-line/50"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    ROE %
                  </button>
                  <button
                    onClick={() => setActiveChartMetric("margin")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeChartMetric === "margin"
                        ? "bg-surface text-brand shadow-sm border border-line/50"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    Net Margin %
                  </button>
                </div>
              </div>

              {/* Render dynamic SVG comparison chart */}
              <MetricBarChart stocks={stocks} metricKey={activeChartMetric} lang={lang} />
            </Card>
          )}

          {/* 🚀 D. ANALYTICAL COMPILATION SHEET (ACCORDION ROWS) */}
          <Card className="border border-line/80 overflow-hidden">
            <div className="divide-y divide-line">
              {/* CATEGORY 1: VALUATION HUB */}
              <div>
                <button
                  onClick={() => toggleSection("valuation")}
                  className="w-full flex items-center justify-between p-4 bg-elevate/45 hover:bg-elevate transition text-left"
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4.5 w-4.5 text-brand" />
                    <span className="font-display font-extrabold text-xs text-ink uppercase tracking-wider">
                      {lang === "th" ? "1. สมมติฐานและโมเดลประเมินมูลค่า (Valuations & Safety)" : "1. Valuations & Safety margins"}
                    </span>
                  </div>
                  <ChevronRight
                    className={`h-4.5 w-4.5 text-muted transition-all duration-200 ${
                      openSections.valuation ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {openSections.valuation && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-xs">
                      <tbody className="divide-y divide-line/60">
                        <CompareRow
                          label={lang === "th" ? "ราคาปัจจุบัน" : "Market Price"}
                          stocks={stocks}
                          getVal={(s) => formatPrice(s, s.price)}
                        />
                        <CompareRow
                          label={lang === "th" ? "แบบจำลอง DCF" : "Simulated DCF"}
                          stocks={stocks}
                          getVal={(s) =>
                            s.assetType === "FUND"
                              ? "—"
                              : formatPrice(s, computeValuation(s, defaultDCFParams(s)).dcf.intrinsicValue)
                          }
                        />
                        <CompareRow
                          label={lang === "th" ? "มูลค่าเกรแฮม (Graham)" : "Graham Number"}
                          stocks={stocks}
                          getVal={(s) => {
                            const graham = computeValuation(s, defaultDCFParams(s)).grahamNumber;
                            return s.assetType === "FUND" || isNaN(graham)
                              ? "—"
                              : formatPrice(s, graham);
                          }}
                        />
                        <CompareRow
                          label={lang === "th" ? "มูลค่าที่เหมาะสมเฉลี่ย" : "Weighted Fair Value"}
                          stocks={stocks}
                          getVal={(s) =>
                            s.assetType === "FUND"
                              ? "—"
                              : formatPrice(s, computeValuation(s, defaultDCFParams(s)).fairValue)
                          }
                          winnerSymbol={getWinnerSymbol("mos")} // Winner is highest MOS
                          isGoldHighlight
                        />
                        <CompareRow
                          label={lang === "th" ? "ส่วนลดความปลอดภัย (MOS %)" : "Safety Margin (MOS %)"}
                          stocks={stocks}
                          getVal={(s) => {
                            const val = computeValuation(s, defaultDCFParams(s));
                            if (s.assetType === "FUND") return "NAV-Backed";
                            return pct(val.marginOfSafety, 1);
                          }}
                          winnerSymbol={getWinnerSymbol("mos")}
                          isTrendColor
                        />
                        <CompareRow
                          label={lang === "th" ? "อัตราส่วน P/E (เท่า)" : "Price/Earnings Ratio (P/E)"}
                          stocks={stocks}
                          getVal={(s) => {
                            const pe = computeValuation(s, defaultDCFParams(s)).ratios.pe;
                            return isFinite(pe) ? num(pe, 1) + "x" : "—";
                          }}
                          winnerSymbol={getWinnerSymbol("pe")}
                        />
                        <CompareRow
                          label={lang === "th" ? "อัตราส่วน P/BV (เท่า)" : "Price/Book Value (P/B)"}
                          stocks={stocks}
                          getVal={(s) => {
                            const pb = computeValuation(s, defaultDCFParams(s)).ratios.pb;
                            return isFinite(pb) ? num(pb, 2) + "x" : "—";
                          }}
                          winnerSymbol={getWinnerSymbol("pb")}
                        />
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* CATEGORY 2: PROFITABILITY & CORPORATE GROWTH */}
              <div>
                <button
                  onClick={() => toggleSection("profitability")}
                  className="w-full flex items-center justify-between p-4 bg-elevate/45 hover:bg-elevate transition text-left"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4.5 w-4.5 text-brand" />
                    <span className="font-display font-extrabold text-xs text-ink uppercase tracking-wider">
                      {lang === "th" ? "2. ความสามารถทำกำไรและการเติบโต (Earnings & Profits)" : "2. Profitability & Earnings Growth"}
                    </span>
                  </div>
                  <ChevronRight
                    className={`h-4.5 w-4.5 text-muted transition-all duration-200 ${
                      openSections.profitability ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {openSections.profitability && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-xs">
                      <tbody className="divide-y divide-line/60">
                        <CompareRow
                          label={lang === "th" ? "ยอดขาย/รายได้รวม" : "Total Revenue"}
                          stocks={stocks}
                          getVal={(s) => (s.assetType === "FUND" ? "—" : formatPrice(s, s.financials.revenue))}
                        />
                        <CompareRow
                          label={lang === "th" ? "กำไรสุทธิรวม" : "Net Profit (Income)"}
                          stocks={stocks}
                          getVal={(s) => (s.assetType === "FUND" ? "—" : formatPrice(s, s.financials.netIncome))}
                        />
                        <CompareRow
                          label={lang === "th" ? "อัตรากำไรสุทธิ %" : "Net profit Margin %"}
                          stocks={stocks}
                          getVal={(s) => {
                            if (s.assetType === "FUND") return "—";
                            const margin = (s.financials.netIncome / s.financials.revenue) * 100;
                            return pct(margin);
                          }}
                          winnerSymbol={getWinnerSymbol("margin")}
                        />
                        <CompareRow
                          label={lang === "th" ? "กำไรก่อนดอกเบี้ย EBITDA" : "EBITDA"}
                          stocks={stocks}
                          getVal={(s) => (s.assetType === "FUND" ? "—" : formatPrice(s, s.financials.ebitda))}
                        />
                        <CompareRow
                          label={lang === "th" ? "คาดการณ์อัตราการโตของ FCF" : "Forecasted FCF Growth"}
                          stocks={stocks}
                          getVal={(s) => (s.assetType === "FUND" ? "—" : pct(s.financials.growthRate * 100))}
                          winnerSymbol={getWinnerSymbol("growth")}
                        />
                        <CompareRow
                          label={lang === "th" ? "อัตราส่วน ROE %" : "Return on Equity (ROE %)"}
                          stocks={stocks}
                          getVal={(s) => {
                            const roe = computeValuation(s, defaultDCFParams(s)).ratios.roe;
                            return isFinite(roe) ? num(roe, 1) + "%" : "—";
                          }}
                          winnerSymbol={getWinnerSymbol("roe")}
                          isTrendColor
                        />
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* CATEGORY 3: SOLVENCY & CASH FLOW SUSTAINABILITY */}
              <div>
                <button
                  onClick={() => toggleSection("solvency")}
                  className="w-full flex items-center justify-between p-4 bg-elevate/45 hover:bg-elevate transition text-left"
                >
                  <div className="flex items-center gap-2">
                    <Star className="h-4.5 w-4.5 text-brand" />
                    <span className="font-display font-extrabold text-xs text-ink uppercase tracking-wider">
                      {lang === "th" ? "3. ความมั่นคงทางการเงินและกระแสเงินสด (Solvency & Dividend)" : "3. Solvency & Dividends analysis"}
                    </span>
                  </div>
                  <ChevronRight
                    className={`h-4.5 w-4.5 text-muted transition-all duration-200 ${
                      openSections.solvency ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {openSections.solvency && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-xs">
                      <tbody className="divide-y divide-line/60">
                        <CompareRow
                          label={lang === "th" ? "เงินสดและรายการเทียบเท่า" : "Cash Reserves"}
                          stocks={stocks}
                          getVal={(s) => (s.assetType === "FUND" ? "—" : formatPrice(s, s.financials.cash))}
                        />
                        <CompareRow
                          label={lang === "th" ? "หนี้สินรวมของบริษัท" : "Total Debt"}
                          stocks={stocks}
                          getVal={(s) => (s.assetType === "FUND" ? "—" : formatPrice(s, s.financials.totalDebt))}
                        />
                        <CompareRow
                          label={lang === "th" ? "หนี้สินสุทธิ (Net Debt)" : "Net Debt"}
                          stocks={stocks}
                          getVal={(s) => (s.assetType === "FUND" ? "—" : formatPrice(s, s.financials.totalDebt - s.financials.cash))}
                        />
                        <CompareRow
                          label={lang === "th" ? "อัตราส่วนหนี้สินต่อทุน (D/E)" : "Debt to Equity Ratio (D/E)"}
                          stocks={stocks}
                          getVal={(s) => {
                            if (s.assetType === "FUND") return "—";
                            const de = s.financials.totalDebt / (s.financials.bookValuePerShare * s.sharesOutstanding);
                            return de.toFixed(2);
                          }}
                          winnerSymbol={getWinnerSymbol("de")}
                        />
                        <CompareRow
                          label={lang === "th" ? "กระแสเงินสดอิสระ (FCF)" : "Free Cash Flow (FCF)"}
                          stocks={stocks}
                          getVal={(s) => (s.assetType === "FUND" ? "—" : formatPrice(s, s.financials.freeCashFlow))}
                        />
                        <CompareRow
                          label={lang === "th" ? "เงินปันผลจ่ายต่อหุ้น (DPS)" : "Dividend Per Share (DPS)"}
                          stocks={stocks}
                          getVal={(s) => (s.financials.dividendPerShare > 0 ? formatPrice(s, s.financials.dividendPerShare) : "0.00")}
                        />
                        <CompareRow
                          label={lang === "th" ? "อัตราเงินปันผลตอบแทน %" : "Dividend Yield %"}
                          stocks={stocks}
                          getVal={(s) => {
                            const val = computeValuation(s, defaultDCFParams(s));
                            return num(val.ratios.dividendYield, 2) + "%";
                          }}
                          winnerSymbol={getWinnerSymbol("yield")}
                          isGoldHighlight
                        />
                        <CompareRow
                          label={lang === "th" ? "อัตราการจ่ายปันผล (Payout)" : "Payout Ratio %"}
                          stocks={stocks}
                          getVal={(s) => {
                            if (s.financials.eps <= 0 || s.financials.dividendPerShare <= 0) return "0%";
                            const payout = (s.financials.dividendPerShare / s.financials.eps) * 100;
                            return pct(payout);
                          }}
                        />
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* CATEGORY 4: FUNDS AND ETFS SPECIAL DETAILS */}
              <div>
                <button
                  onClick={() => toggleSection("funds")}
                  className="w-full flex items-center justify-between p-4 bg-elevate/45 hover:bg-elevate transition text-left"
                >
                  <div className="flex items-center gap-2">
                    <Info className="h-4.5 w-4.5 text-brand" />
                    <span className="font-display font-extrabold text-xs text-ink uppercase tracking-wider">
                      {lang === "th" ? "4. ข้อมูลเฉพาะสำหรับกองทุน & ETF (Funds & Index ETFs)" : "4. Mutual Funds & Index ETFs specifics"}
                    </span>
                  </div>
                  <ChevronRight
                    className={`h-4.5 w-4.5 text-muted transition-all duration-200 ${
                      openSections.funds ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {openSections.funds && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-xs">
                      <tbody className="divide-y divide-line/60">
                        <CompareRow
                          label={lang === "th" ? "ประเภทสินทรัพย์" : "Asset Category"}
                          stocks={stocks}
                          getVal={(s) => s.assetType}
                        />
                        <CompareRow
                          label={lang === "th" ? "ประเภทนโยบายกองทุน" : "Fund Type"}
                          stocks={stocks}
                          getVal={(s) => s.fundType || "—"}
                        />
                        <CompareRow
                          label={lang === "th" ? "กองทุนหลักต่างประเทศ" : "Master Fund"}
                          stocks={stocks}
                          getVal={(s) => s.masterFund || s.feederFund || "—"}
                        />
                        <CompareRow
                          label={lang === "th" ? "ขนาดมูลค่าทรัพย์สิน (AUM)" : "AUM size"}
                          stocks={stocks}
                          getVal={(s) =>
                            s.aum ? (s.currency === "USD" ? dollar(s.aum) : baht(s.aum)) : "—"
                          }
                        />
                        <CompareRow
                          label={lang === "th" ? "ค่าธรรมเนียมกองทุน %" : "Expense Ratio %"}
                          stocks={stocks}
                          getVal={(s) => (s.expenseRatio ? `${s.expenseRatio.toFixed(2)}%` : "—")}
                          winnerSymbol={getWinnerSymbol("expense")}
                        />
                        <CompareRow
                          label={lang === "th" ? "ระดับความเสี่ยง (1-8)" : "Risk Level (1-8)"}
                          stocks={stocks}
                          getVal={(s) => (s.riskLevel ? `ระดับ ${s.riskLevel}` : "—")}
                        />
                        <CompareRow
                          label={lang === "th" ? "สัดส่วนถือครองหลักสูงสุด" : "Top Holding Allocation"}
                          stocks={stocks}
                          getVal={(s) =>
                            s.topHoldings && s.topHoldings.length > 0
                              ? `${s.topHoldings[0].name} (${s.topHoldings[0].weight}%)`
                              : "—"
                          }
                        />
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 🚀 E. SYSTEM FOOTER */}
      <div className="bg-elevate/45 border border-line rounded-xl p-3.5 text-[10px] text-muted flex items-start gap-2 max-w-4xl">
        <Info className="h-4 w-4 text-brand shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {lang === "th"
            ? "⚠️ คำเตือน: ระบบเปรียบเทียบข้อมูลทางการเงินข้างต้นคำนวณและดึงข้อมูลอ้างอิงจากแบบจำลอง DCF และ Graham Number อ้างอิงตัวชี้วัดปีงบการเงินล่าสุด ผลการวิเคราะห์ใช้เพื่อวัตถุประสงค์ในการสาธิตโปรแกรมเทอมินัลการเงินเท่านั้น ไม่ใช่คำเสนอแนะการชี้ชวนการลงทุนแต่อย่างใด โปรดศึกษารายละเอียดของบริษัทและงบการเงินจริงก่อนการลงทุน"
            : "⚠️ Disclaimer: Financial comparison indexes computed via automated DCF scenario matrices. Intended for institutional software showcase. This does not constitute professional investment solicitation or fiduciary advice."}
        </p>
      </div>
    </div>
  );
}

// ================== HIGH-DENSITY TABLE COMPARISON ROW COMPONENT ==================
function CompareRow({
  label,
  stocks,
  getVal,
  winnerSymbol,
  isTrendColor = false,
  isGoldHighlight = false,
}: {
  label: string;
  stocks: any[];
  getVal: (s: any) => string;
  winnerSymbol?: string | null;
  isTrendColor?: boolean;
  isGoldHighlight?: boolean;
}) {
  return (
    <tr className="hover:bg-elevate/20 transition group">
      <td className="px-5 py-3.5 font-semibold text-muted text-left w-56 border-r border-line/40">
        {label}
      </td>
      {stocks.map((s) => {
        const val = getVal(s);
        const isWinner = winnerSymbol === s.symbol;
        const isNegative = val.startsWith("-");

        // Styling triggers
        let valStyle = "text-ink";
        if (isTrendColor) {
          valStyle = isNegative ? "text-down font-mono font-bold" : "text-up font-mono font-bold";
        } else if (isGoldHighlight) {
          valStyle = "text-gold font-mono font-extrabold";
        } else {
          valStyle = "text-ink font-mono font-semibold";
        }

        return (
          <td
            key={s.symbol}
            className={`px-5 py-3.5 text-center transition-all ${
              isWinner ? "bg-brand/5 border-x border-brand/20 shadow-inner" : ""
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <span className={valStyle}>{val}</span>
              {isWinner && (
                <span
                  className="text-gold animate-pulse shrink-0 cursor-help"
                  title="🏆 ดัชนีดีที่สุดในกลุ่มเปรียบเทียบ (Metric Leader)"
                >
                  🏆
                </span>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

// ================== SPARKLINE CHART COMPONENT ==================
function Sparkline({ data, up, symbol }: { data: number[]; up: boolean; symbol: string }) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const width = 100;
  const height = 28;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - 2 - ((val - min) / range) * (height - 4);
      return `${x},${y}`;
    })
    .join(" ");

  const color = up ? "#10b981" : "#ef4444";
  const gradId = `compare-grad-${symbol}`;

  return (
    <svg width={width} height={height} className="overflow-visible select-none pointer-events-none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#${gradId})`} points={`0,${height} ${points} ${width},${height}`} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle cx={width} cy={height - 2 - ((data[data.length - 1] - min) / range) * (height - 4)} r="2" fill={color} />
    </svg>
  );
}

// ================== SVG BAR COMPARATOR CHART COMPONENT ==================
function MetricBarChart({
  stocks,
  metricKey,
  lang,
}: {
  stocks: any[];
  metricKey: ChartMetric;
  lang: "th" | "en";
}) {
  const data = stocks.map((s) => {
    const v = computeValuation(s, defaultDCFParams(s));
    let val = 0;
    if (metricKey === "mos") val = v.marginOfSafety;
    else if (metricKey === "yield") val = v.ratios.dividendYield;
    else if (metricKey === "roe") val = isFinite(v.ratios.roe) ? v.ratios.roe : 0;
    else if (metricKey === "margin") {
      val = s.financials.revenue > 0 ? (s.financials.netIncome / s.financials.revenue) * 100 : 0;
    }
    return {
      symbol: s.symbol,
      color: s.color || "#3b82f6",
      value: val,
    };
  });

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 10);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const chartHeight = 160;
  const paddingBottom = 25;
  const paddingTop = 15;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  // Zero-line Y coordinate
  const zeroY = paddingTop + (maxVal / range) * usableHeight;

  return (
    <div className="w-full flex flex-col items-center">
      <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">
        {metricKey === "mos" && (lang === "th" ? "📊 ส่วนต่ำกว่ามูลค่าเหมาะสม (Margin of Safety %)" : "📊 Margin of Safety % Scale")}
        {metricKey === "yield" && (lang === "th" ? "📊 อัตราเงินปันผลตอบแทน (Dividend Yield %)" : "📊 Dividend Yield % Scale")}
        {metricKey === "roe" && (lang === "th" ? "📊 อัตราผลตอบแทนต่อผู้ถือหุ้น (ROE %)" : "📊 Return on Equity % Scale")}
        {metricKey === "margin" && (lang === "th" ? "📊 อัตรากำไรสุทธิบริษัท (Net Margin %)" : "📊 Net Profit Margin % Scale")}
      </h4>

      <div className="w-full flex justify-around items-end h-[160px] relative border-b border-line px-2">
        {/* Y Axis line guides */}
        <div className="absolute left-0 right-0 border-t border-line/30 border-dashed" style={{ top: `${paddingTop}px` }}>
          <span className="absolute left-2 -top-2.5 text-[8px] font-mono text-muted">{maxVal.toFixed(0)}%</span>
        </div>
        <div className="absolute left-0 right-0 border-t border-line/60" style={{ top: `${zeroY}px` }}>
          <span className="absolute left-2 -top-2 text-[8px] font-mono font-bold text-ink">0%</span>
        </div>
        {minVal < 0 && (
          <div className="absolute left-0 right-0 border-t border-line/30 border-dashed" style={{ top: `${chartHeight - paddingBottom}px` }}>
            <span className="absolute left-2 -top-2 text-[8px] font-mono text-muted">{minVal.toFixed(0)}%</span>
          </div>
        )}

        {/* Dynamic Bars */}
        {data.map((item) => {
          const isPositive = item.value >= 0;
          
          let barHeight = 0;
          let barTop = zeroY;

          if (isPositive) {
            barHeight = (item.value / range) * usableHeight;
            barTop = zeroY - barHeight;
          } else {
            barHeight = (Math.abs(item.value) / range) * usableHeight;
            barTop = zeroY;
          }

          return (
            <div
              key={item.symbol}
              className="flex flex-col items-center group flex-1 max-w-[80px]"
              style={{ height: `${chartHeight}px` }}
            >
              {/* Floating value bubble */}
              <div
                className="absolute text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface border border-line text-ink transition-all opacity-0 group-hover:opacity-100 -translate-y-4"
                style={{
                  top: `${Math.max(barTop - 12, paddingTop - 10)}px`,
                  zIndex: 20
                }}
              >
                {item.value.toFixed(1)}%
              </div>

              {/* SVG Bar representation */}
              <svg width="32" height={chartHeight} className="overflow-visible select-none pointer-events-none">
                <defs>
                  <linearGradient id={`grad-bar-${item.symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={item.color} stopOpacity="0.85" />
                    <stop offset="100%" stopColor={item.color} stopOpacity="0.35" />
                  </linearGradient>
                </defs>
                <rect
                  x="4"
                  y={barTop}
                  width="24"
                  height={Math.max(barHeight, 2)}
                  rx="3"
                  fill={`url(#grad-bar-${item.symbol})`}
                  stroke={item.color}
                  strokeWidth="1.2"
                  className="transition-all duration-300 hover:brightness-110"
                />
              </svg>

              {/* Ticker label */}
              <span className="text-[9px] font-display font-extrabold text-ink mt-2 block z-10 bg-surface px-1 border border-line rounded">
                {item.symbol}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { STOCKS } from "@/lib/stocks";
import { computeValueSignal } from "@/lib/value-signal";
import { useStore } from "@/lib/store";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AssetLogo } from "@/components/AssetLogo";
import { ValueSignalBadge } from "@/components/ValueSignalBadge";
import { QuoteLoading, QuoteLoadingCard } from "@/components/QuoteLoading";
import { hasQuoteProvider, useLiveQuotes } from "@/lib/realtime-quotes";
import { useTranslation } from "@/lib/translations";
import { baht, dollar, num, pct } from "@/lib/format";
import type { Stock } from "@/lib/types";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  RefreshCw,
  Target,
  Sparkles,
  Info,
  X,
  Search,
} from "@/lib/icons";

const STORAGE_KEY = "valustock_virtual_portfolio";
const DEFAULT_CASH = 1_000_000; // ฿1,000,000

type VirtualTrade = {
  id: string;
  symbol: string;
  action: "BUY" | "SELL";
  price: number;
  shares: number;
  date: string;
  notes: string;
};

type VirtualHolding = {
  symbol: string;
  shares: number;
  avgCost: number;
};

type VirtualState = {
  cash: number;
  holdings: VirtualHolding[];
  history: VirtualTrade[];
};

function loadState(): VirtualState {
  if (typeof window === "undefined") return { cash: DEFAULT_CASH, holdings: [], history: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { cash: DEFAULT_CASH, holdings: [], history: [] };
    const parsed = JSON.parse(raw);
    return {
      cash: typeof parsed.cash === "number" && parsed.cash >= 0 ? parsed.cash : DEFAULT_CASH,
      holdings: Array.isArray(parsed.holdings) ? parsed.holdings : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return { cash: DEFAULT_CASH, holdings: [], history: [] };
  }
}

function saveState(state: VirtualState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable */
  }
}

function getSeedStock(symbol: string): Stock | undefined {
  return STOCKS.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
}

function formatPrice(stock: Stock | undefined, price: number): string {
  if (!stock) return baht(price);
  if (stock.assetType === "US_STOCK" || stock.currency === "USD") return dollar(price);
  return baht(price);
}

export default function VirtualPortfolio() {
  const { lang } = useTranslation();
  const { user } = useStore();

  const [state, setState] = useState<VirtualState>(loadState);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Form state
  const [txSymbol, setTxSymbol] = useState("PTT");
  const [txAction, setTxAction] = useState<"BUY" | "SELL">("BUY");
  const [txBudgetThb, setTxBudgetThb] = useState("");
  const [txShares, setTxShares] = useState("");
  const [txNotes, setTxNotes] = useState("");
  const [formError, setFormError] = useState("");

  // Persist state to localStorage on change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Collect symbols that need live quotes
  const quoteSymbols = useMemo(() => {
    const symbols = new Set<string>([txSymbol]);
    state.holdings.forEach((h) => symbols.add(h.symbol));
    return Array.from(symbols).filter((sym) => {
      const stock = getSeedStock(sym);
      return stock ? hasQuoteProvider(stock) : /^[A-Z0-9._-]{1,20}$/.test(sym);
    });
  }, [txSymbol, state.holdings]);

  const { liveStockMap, isLoading: quotesLoading } = useLiveQuotes(quoteSymbols, quoteSymbols.length > 0);

  const getStock = useCallback(
    (symbol: string): Stock | undefined => {
      const key = symbol.toUpperCase();
      return liveStockMap.get(key) || getSeedStock(key);
    },
    [liveStockMap]
  );

  // Compute portfolio summary
  const summary = useMemo(() => {
    let totalCost = 0;
    let totalValue = 0;

    const holdingsWithData = state.holdings
      .map((h) => {
        const stock = getStock(h.symbol);
        if (!stock) return null;
        const currentPrice = stock.price;
        const cost = h.shares * h.avgCost;
        const value = h.shares * currentPrice;
        const profit = value - cost;
        const profitPct = cost > 0 ? (profit / cost) * 100 : 0;

        totalCost += cost;
        totalValue += value;

        let signal = null;
        try {
          signal = computeValueSignal(stock, currentPrice);
        } catch {
          /* signal computation best-effort */
        }

        return {
          symbol: h.symbol,
          stock,
          shares: h.shares,
          avgCost: h.avgCost,
          currentPrice,
          value,
          profit,
          profitPct,
          signal,
        };
      })
      .filter(Boolean) as Array<{
      symbol: string;
      stock: Stock;
      shares: number;
      avgCost: number;
      currentPrice: number;
      value: number;
      profit: number;
      profitPct: number;
      signal: ReturnType<typeof computeValueSignal> | null;
    }>;

    const netProfit = totalValue - totalCost;
    const netProfitPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    return {
      holdingsWithData,
      totalCost,
      totalValue,
      netProfit,
      netProfitPct,
      totalEquity: state.cash + totalValue,
    };
  }, [state.holdings, state.cash, getStock]);

  // Calculate shares from budget
  const calcShares = useCallback(() => {
    const budget = Number(txBudgetThb);
    if (!Number.isFinite(budget) || budget <= 0) return;
    const stock = getStock(txSymbol);
    if (!stock || stock.price <= 0) return;

    const priceInThb = stock.assetType === "US_STOCK" || stock.currency === "USD" ? stock.price * 36.5 : stock.price;
    const shares = budget / priceInThb;
    setTxShares(shares.toFixed(6).replace(/\.?0+$/, ""));
  }, [txBudgetThb, txSymbol, getStock]);

  // Auto-fill price when symbol changes
  useEffect(() => {
    const stock = getStock(txSymbol);
    if (stock) {
      setTxBudgetThb("");
      setTxShares("");
    }
  }, [txSymbol, getStock]);

  // Handle trade submission
  const handleTrade = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const stock = getStock(txSymbol);
    if (!stock) {
      setFormError(lang === "th" ? "ไม่พบหลักทรัพย์นี้ในระบบ" : "Security not found");
      return;
    }

    const price = stock.price;
    const shares = Number(txShares);
    if (!Number.isFinite(shares) || shares <= 0) {
      setFormError(lang === "th" ? "กรุณาระบุจำนวนหุ้น" : "Please enter share quantity");
      return;
    }

    const totalCost = shares * price;
    if (txAction === "BUY" && totalCost > state.cash) {
      setFormError(
        lang === "th"
          ? `เงินไม่พอ: ต้องการ ${baht(totalCost)} แต่มี ${baht(state.cash)}`
          : `Insufficient cash: need ${baht(totalCost)}, have ${baht(state.cash)}`
      );
      return;
    }

    if (txAction === "SELL") {
      const holding = state.holdings.find((h) => h.symbol.toUpperCase() === stock.symbol.toUpperCase());
      if (!holding || holding.shares < shares) {
        setFormError(
          lang === "th" ? `มีหุ้น ${stock.symbol} ไม่พอสำหรับขาย` : `Not enough ${stock.symbol} shares to sell`
        );
        return;
      }
    }

    const trade: VirtualTrade = {
      id: `vt-${Date.now()}`,
      symbol: stock.symbol.toUpperCase(),
      action: txAction,
      price,
      shares,
      date: new Date().toISOString().slice(0, 10),
      notes: txNotes.trim(),
    };

    setState((prev) => {
      const holdings = [...prev.holdings];
      if (txAction === "BUY") {
        const idx = holdings.findIndex((h) => h.symbol.toUpperCase() === trade.symbol);
        if (idx >= 0) {
          const h = holdings[idx];
          const newTotalCost = h.shares * h.avgCost + totalCost;
          const newShares = h.shares + shares;
          holdings[idx] = { ...h, shares: newShares, avgCost: newTotalCost / newShares };
        } else {
          holdings.push({ symbol: trade.symbol, shares, avgCost: price });
        }
        return {
          cash: prev.cash - totalCost,
          holdings,
          history: [trade, ...prev.history],
        };
      } else {
        // SELL
        const idx = holdings.findIndex((h) => h.symbol.toUpperCase() === trade.symbol);
        if (idx >= 0) {
          const h = holdings[idx];
          const remaining = h.shares - shares;
          if (remaining <= 0.0001) {
            holdings.splice(idx, 1);
          } else {
            holdings[idx] = { ...h, shares: remaining };
          }
        }
        return {
          cash: prev.cash + totalCost,
          holdings,
          history: [trade, ...prev.history],
        };
      }
    });

    // Reset form
    setTxShares("");
    setTxBudgetThb("");
    setTxNotes("");
  };

  // Reset portfolio
  const handleReset = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 4000);
      return;
    }
    setState({ cash: DEFAULT_CASH, holdings: [], history: [] });
    setResetConfirm(false);
  };

  const isPortfolioLoading = quotesLoading && state.holdings.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left column: Summary + Trade Form */}
      <div className="lg:col-span-4 space-y-4">
        {/* Net worth summary */}
        <Card className="w-full border border-line p-4 bg-surface/30 sm:p-5">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                {lang === "th" ? "มูลค่าพอร์ตจำลอง" : "Virtual Portfolio Value"}
              </span>
              <div className="text-3xl font-display font-black text-ink mt-2">
                {baht(summary.totalEquity)}
              </div>
              {isPortfolioLoading && (
                <div className="mt-2">
                  <QuoteLoading label={lang === "th" ? "กำลังซิงก์ราคาล่าสุด" : "Syncing live quotes"} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-line/50 pt-3">
              <div>
                <span className="text-[9px] uppercase font-bold text-muted">{lang === "th" ? "เงินสดคงเหลือ" : "Cash Balance"}</span>
                <span className="block mt-1 font-mono font-bold text-ink text-lg">{baht(state.cash)}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-muted">{lang === "th" ? "มูลค่าหุ้น" : "Stock Value"}</span>
                <span className="block mt-1 font-mono font-bold text-ink text-lg">{baht(summary.totalValue)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-line/50 pt-3">
              <div>
                <span className="text-[9px] uppercase font-bold text-muted">{lang === "th" ? "กำไร/ขาดทุน" : "P&L"}</span>
                <span className={`block mt-1 font-mono font-black text-lg ${summary.netProfit >= 0 ? "text-up" : "text-down"}`}>
                  {summary.netProfit >= 0 ? "+" : ""}
                  {baht(Math.abs(summary.netProfit))}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-muted">%</span>
                <span className={`block mt-1 font-mono font-black text-lg ${summary.netProfitPct >= 0 ? "text-up" : "text-down"}`}>
                  {summary.netProfitPct >= 0 ? "+" : ""}
                  {summary.netProfitPct.toFixed(1)}%
                </span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full rounded-xl border border-line bg-elevate py-2 text-[10px] font-bold text-muted hover:text-down transition"
            >
              {resetConfirm
                ? lang === "th"
                  ? "⚠️ กดอีกครั้งเพื่อยืนยันรีเซ็ต"
                  : "⚠️ Press again to confirm reset"
                : lang === "th"
                ? "🔄 รีเซ็ตพอร์ตจำลอง"
                : "🔄 Reset Virtual Portfolio"}
            </button>
          </div>
        </Card>

        {/* Trade form */}
        <Card className="w-full border border-line p-4 sm:p-5">
          <h3 className="font-display font-extrabold text-xs text-ink uppercase tracking-wider mb-4 flex items-center gap-1">
            <Plus className="h-4 w-4 text-brand" />
            {lang === "th" ? "ซื้อ/ขาย จำลอง" : "Paper Trade"}
          </h3>

          {formError && (
            <div className="mb-3 rounded-xl border border-down/25 bg-down/10 px-3 py-2 text-[11px] font-semibold text-down">
              {formError}
            </div>
          )}

          <form onSubmit={handleTrade} className="space-y-3.5">
            {/* Symbol input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase">
                {lang === "th" ? "ตัวย่อหลักทรัพย์" : "Symbol"}
              </label>
              <input
                type="text"
                className="input-base text-xs font-mono font-bold"
                value={txSymbol}
                onChange={(e) => setTxSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL, PTT, SPY"
              />
            </div>

            {/* Live price display */}
            {(() => {
              const stock = getStock(txSymbol);
              if (!stock) return null;
              return (
                <div className="rounded-xl border border-line bg-bg/45 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AssetLogo symbol={stock.symbol} color={stock.color} size="sm" />
                    <span className="text-sm font-bold text-ink">{stock.symbol}</span>
                  </div>
                  <span className="font-mono font-black text-ink">{formatPrice(stock, stock.price)}</span>
                </div>
              );
            })()}

            {/* Buy/Sell toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTxAction("BUY")}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  txAction === "BUY" ? "bg-up/10 border border-up/40 text-up" : "bg-elevate text-muted hover:text-ink"
                }`}
              >
                📈 BUY
              </button>
              <button
                type="button"
                onClick={() => setTxAction("SELL")}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  txAction === "SELL" ? "bg-down/10 border border-down/40 text-down" : "bg-elevate text-muted hover:text-ink"
                }`}
              >
                📉 SELL
              </button>
            </div>

            {/* Budget + shares */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">
                  {lang === "th" ? "งบประมาณ (บาท)" : "Budget (THB)"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-base text-xs font-mono font-bold"
                    value={txBudgetThb}
                    onChange={(e) => setTxBudgetThb(e.target.value)}
                    placeholder={lang === "th" ? "เช่น 10000" : "e.g. 10000"}
                  />
                  <button
                    type="button"
                    onClick={calcShares}
                    className="shrink-0 rounded-lg border border-brand/40 bg-brand/10 px-3 text-[10px] font-black text-brand transition hover:bg-brand hover:text-bg"
                  >
                    {lang === "th" ? "คำนวณ" : "Calc"}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">
                  {lang === "th" ? "จำนวนหุ้น" : "Shares"}
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  className="input-base text-xs font-mono font-bold"
                  value={txShares}
                  onChange={(e) => setTxShares(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase">
                {lang === "th" ? "เหตุผล / หมายเหตุ" : "Notes"}
              </label>
              <textarea
                className="input-base min-h-16 resize-y text-xs leading-relaxed"
                value={txNotes}
                onChange={(e) => setTxNotes(e.target.value)}
                placeholder={lang === "th" ? "เช่น MOS > 25%, DCA entry" : "e.g. MOS > 25%, DCA entry"}
                maxLength={200}
              />
            </div>

            <Button type="submit" size="sm" className="w-full text-white bg-brand hover:bg-brand/90">
              💾 {lang === "th" ? "บันทึกรายการ" : "Execute Trade"}
            </Button>
          </form>
        </Card>
      </div>

      {/* Right column: Holdings + History */}
      <div className="lg:col-span-8 space-y-4">
        {/* Holdings table */}
        <Card className="w-full overflow-hidden border border-line">
          <CardHeader
            title={lang === "th" ? "สินทรัพย์ในพอร์ตจำลอง" : "Virtual Holdings"}
            subtitle={lang === "th" ? "ติดตามมูลค่าพอร์ตด้วยราคาสดจากตลาด" : "Live-priced paper trading portfolio"}
            icon={<Wallet className="h-4.5 w-4.5 text-brand" />}
          />
          <div className="space-y-3 p-4 md:hidden">
            {summary.holdingsWithData.length === 0 ? (
              isPortfolioLoading ? (
                <QuoteLoadingCard
                  title={lang === "th" ? "กำลังโหลดราคาพอร์ต" : "Loading portfolio quotes"}
                  subtitle={lang === "th" ? "กำลังดึงราคาล่าสุด..." : "Fetching latest prices..."}
                />
              ) : (
                <div className="rounded-xl border border-line bg-bg/40 p-5 text-center text-xs text-muted">
                  {lang === "th"
                    ? "🧪 ยังไม่มีหุ้นในพอร์ตจำลอง — ลองซื้อหุ้นตัวแรกดู!"
                    : "🧪 No virtual holdings yet — try buying your first stock!"}
                </div>
              )
            ) : (
              summary.holdingsWithData.map((h) => {
                const hIsUp = h.profit >= 0;
                return (
                  <div key={`vh-mobile-${h.symbol}`} className="rounded-2xl border border-line bg-bg/45 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <AssetLogo symbol={h.symbol} color={h.stock.color} size="sm" />
                        <div className="min-w-0">
                          <span className="block font-display text-sm font-bold text-ink">{h.symbol}</span>
                          <span className="block text-[10px] text-muted truncate">{lang === "th" ? h.stock.name : h.stock.enName}</span>
                        </div>
                      </div>
                      {h.signal && <ValueSignalBadge signal={h.signal} size="sm" showScore={false} />}
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted">{lang === "th" ? "จำนวนหุ้น" : "Shares"}</span>
                        <span className="font-mono font-bold">{h.shares.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">{lang === "th" ? "ต้นทุนเฉลี่ย" : "Avg Cost"}</span>
                        <span className="font-mono">{formatPrice(h.stock, h.avgCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">{lang === "th" ? "ราคาตลาด" : "Market"}</span>
                        <span className="font-mono font-bold">{formatPrice(h.stock, h.currentPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">{lang === "th" ? "มูลค่า" : "Value"}</span>
                        <span className="font-mono font-bold">{formatPrice(h.stock, h.value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">{lang === "th" ? "กำไร/ขาดทุน" : "P&L"}</span>
                        <span className={`font-mono font-black ${hIsUp ? "text-up" : "text-down"}`}>
                          {hIsUp ? "+" : ""}{formatPrice(h.stock, Math.abs(h.profit))} ({h.profitPct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-elevate/45 text-muted font-bold tracking-wider">
                  <th className="px-4 py-3">{lang === "th" ? "หลักทรัพย์" : "TICKER"}</th>
                  <th className="px-4 py-3 text-right">{lang === "th" ? "จำนวน" : "SHARES"}</th>
                  <th className="px-4 py-3 text-right">{lang === "th" ? "ต้นทุน" : "COST"}</th>
                  <th className="px-4 py-3 text-right">{lang === "th" ? "ราคาตลาด" : "MKT"}</th>
                  <th className="px-4 py-3 text-right">{lang === "th" ? "มูลค่า" : "VALUE"}</th>
                  <th className="px-4 py-3 text-right">{lang === "th" ? "กำไร/ขาดทุน" : "P&L"}</th>
                  <th className="px-4 py-3 text-center">{lang === "th" ? "สัญญาณ" : "SIGNAL"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {summary.holdingsWithData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted">
                      {isPortfolioLoading ? (
                        <div className="mx-auto max-w-sm">
                          <QuoteLoadingCard
                            title={lang === "th" ? "กำลังโหลดราคาพอร์ต" : "Loading portfolio quotes"}
                            subtitle={lang === "th" ? "กำลังดึงราคาล่าสุดของสินทรัพย์..." : "Fetching latest prices..."}
                          />
                        </div>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Sparkles className="h-4 w-4 text-brand" />
                          {lang === "th" ? "🧪 เริ่มเทรดหุ้นตัวแรกในพอร์ตจำลอง!" : "🧪 Start by buying your first stock!"}
                        </span>
                      )}
                    </td>
                  </tr>
                ) : (
                  summary.holdingsWithData.map((h) => {
                    const hIsUp = h.profit >= 0;
                    return (
                      <tr key={`vh-${h.symbol}`} className="hover:bg-elevate/20 transition group">
                        <td className="px-4 py-3 font-semibold text-ink">
                          <div className="flex items-center gap-2">
                            <AssetLogo symbol={h.symbol} color={h.stock.color} size="sm" />
                            <div>
                              <span className="font-display font-extrabold text-ink block group-hover:text-brand transition">
                                {h.symbol}
                              </span>
                              <span className="text-[9px] text-muted truncate max-w-[100px] block">
                                {lang === "th" ? h.stock.name : h.stock.enName}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-ink font-semibold">
                          {h.shares.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-muted">
                          {formatPrice(h.stock, h.avgCost)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-ink font-semibold">
                          {formatPrice(h.stock, h.currentPrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-ink font-bold">
                          {formatPrice(h.stock, h.value)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-black ${hIsUp ? "text-up" : "text-down"}`}>
                          {hIsUp ? "+" : ""}
                          {formatPrice(h.stock, Math.abs(h.profit))} ({h.profitPct.toFixed(1)}%)
                        </td>
                        <td className="px-4 py-3 text-center">
                          {h.signal ? (
                            <ValueSignalBadge signal={h.signal} size="sm" showScore={false} />
                          ) : (
                            <span className="text-[10px] text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent trades history */}
        <Card className="w-full overflow-hidden border border-line">
          <CardHeader
            title={lang === "th" ? "ประวัติการเทรดจำลอง" : "Virtual Trade History"}
            subtitle={lang === "th" ? "รายการซื้อขายล่าสุดในพอร์ตจำลอง" : "Recent paper trades"}
            icon={<RefreshCw className="h-4.5 w-4.5 text-brand" />}
          />
          <div className="space-y-3 p-4 md:hidden">
            {state.history.length === 0 ? (
              <div className="text-center text-xs text-muted py-4">
                {lang === "th" ? "ยังไม่มีประวัติการเทรด" : "No trade history yet"}
              </div>
            ) : (
              state.history.slice(0, 20).map((trade) => {
                const isBuy = trade.action === "BUY";
                const stock = getSeedStock(trade.symbol);
                return (
                  <div key={`vh-mobile-${trade.id}`} className="rounded-xl border border-line bg-bg/45 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {stock && <AssetLogo symbol={trade.symbol} color={stock.color} size="sm" />}
                        <span className="font-display font-bold text-xs">{trade.symbol}</span>
                      </div>
                      <span className={`chip text-[10px] font-bold ${isBuy ? "border-up/30 bg-up/10 text-up" : "border-down/30 bg-down/10 text-down"}`}>
                        {trade.action}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] text-muted">
                      <span>{trade.shares.toLocaleString()} @ {stock ? formatPrice(stock, trade.price) : baht(trade.price)}</span>
                      <span>{trade.date}</span>
                    </div>
                    {trade.notes && <div className="mt-1 text-[10px] text-muted italic">{trade.notes}</div>}
                  </div>
                );
              })
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-elevate/45 text-muted font-bold">
                  <th className="px-4 py-3">{lang === "th" ? "วันที่" : "DATE"}</th>
                  <th className="px-4 py-3">{lang === "th" ? "หลักทรัพย์" : "SYMBOL"}</th>
                  <th className="px-4 py-3 text-center">{lang === "th" ? "ประเภท" : "ACTION"}</th>
                  <th className="px-4 py-3 text-right">{lang === "th" ? "ราคา" : "PRICE"}</th>
                  <th className="px-4 py-3 text-right">{lang === "th" ? "จำนวนหุ้น" : "SHARES"}</th>
                  <th className="px-4 py-3 text-right">{lang === "th" ? "รวม" : "TOTAL"}</th>
                  <th className="px-4 py-3">{lang === "th" ? "หมายเหตุ" : "NOTES"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {state.history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted">
                      {lang === "th" ? "ยังไม่มีประวัติการเทรดจำลอง" : "No virtual trade history yet."}
                    </td>
                  </tr>
                ) : (
                  state.history.slice(0, 50).map((trade) => {
                    const isBuy = trade.action === "BUY";
                    const total = trade.shares * trade.price;
                    const stock = getSeedStock(trade.symbol);
                    return (
                      <tr key={trade.id} className="hover:bg-elevate/20 transition text-[11px]">
                        <td className="px-4 py-3 text-muted font-mono">{trade.date}</td>
                        <td className="px-4 py-3 font-bold text-ink">{trade.symbol}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`chip font-bold py-0.5 ${isBuy ? "border-up/30 bg-up/10 text-up" : "border-down/30 bg-down/10 text-down"}`}>
                            {trade.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-ink">
                          {stock ? formatPrice(stock, trade.price) : baht(trade.price)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-ink">
                          {trade.shares.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-ink">
                          {stock ? formatPrice(stock, total) : baht(total)}
                        </td>
                        <td className="px-4 py-3 text-muted max-w-48">
                          <span className="line-clamp-1">{trade.notes || "—"}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

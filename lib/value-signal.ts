import { Stock } from "@/lib/types";
import { computeValuation, computeRatios, defaultDCFParams } from "@/lib/valuation";

export type Signal = "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";

export type ValueSignalResult = {
  signal: Signal;
  score: number; // 0-100
  label: string;
  labelEn: string;
  color: string; // tailwind classes for badge
  factors: {
    mos: number;
    pe: number;
    roe: number;
    yield: number; // dividend yield %
    peg: number;
  };
  fairValue: number;
  upside: number;
};

const SIGNAL_META: Record<Signal, { label: string; labelEn: string; color: string; emoji: string }> = {
  STRONG_BUY: {
    label: "ซื้อมาก",
    labelEn: "Strong Buy",
    color: "border-up/40 bg-up/15 text-up",
    emoji: "🟢",
  },
  BUY: {
    label: "ซื้อ",
    labelEn: "Buy",
    color: "border-up/25 bg-up/8 text-up",
    emoji: "🟢",
  },
  HOLD: {
    label: "ถือ",
    labelEn: "Hold",
    color: "border-gold/30 bg-gold/10 text-gold",
    emoji: "🟡",
  },
  SELL: {
    label: "ขาย",
    labelEn: "Sell",
    color: "border-down/25 bg-down/8 text-down",
    emoji: "🔴",
  },
  STRONG_SELL: {
    label: "ขายมาก",
    labelEn: "Strong Sell",
    color: "border-down/40 bg-down/15 text-down",
    emoji: "🔴",
  },
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Normalize MOS to a 0-100 sub-score.
 * MOS ≥ 30% → 100, MOS ≤ -30% → 0
 */
function mosScore(mos: number): number {
  return clampScore(((mos + 30) / 60) * 100);
}

/**
 * P/E sub-score: lower is better.
 * P/E ≤ 8 → 100, P/E ≥ 40 → 0
 */
function peScore(pe: number): number {
  if (!Number.isFinite(pe) || pe <= 0) return 40; // negative earnings → middle-low
  return clampScore(100 - ((pe - 8) / 32) * 100);
}

/**
 * ROE sub-score: higher is better.
 * ROE ≥ 20% → 100, ROE ≤ 0% → 0
 */
function roeScore(roe: number): number {
  if (!Number.isFinite(roe)) return 30;
  return clampScore((Math.max(0, Math.min(20, roe)) / 20) * 100);
}

/**
 * PEG sub-score: closer to 1 is best.
 * PEG 0.8-1.2 → 100, PEG > 3 or < 0 → 0
 */
function pegScore(peg: number): number {
  if (!Number.isFinite(peg) || peg <= 0) return 40;
  if (peg >= 3) return 0;
  if (peg >= 0.8 && peg <= 1.2) return 100;
  if (peg < 0.8) return clampScore(peg * 125); // 0.4 → 50
  return clampScore(100 - ((peg - 1.2) / 1.8) * 100);
}

/**
 * Dividend yield sub-score: higher yield = better, up to a point.
 * Yield ≥ 5% → 100, 0% → 0
 */
function yieldScore(dividendYield: number): number {
  if (!Number.isFinite(dividendYield) || dividendYield < 0) return 0;
  return clampScore((Math.min(5, dividendYield) / 5) * 100);
}

function determineSignal(mos: number, pe: number, roe: number, peg: number): Signal {
  if (mos >= 25 && pe > 0 && pe < 15 && roe > 12) return "STRONG_BUY";
  if (mos >= 15 || (mos >= 10 && pe > 0 && pe < 20 && roe > 10)) return "BUY";
  if (mos < -25) return "STRONG_SELL";
  if (mos < -15 || (pe > 40 && mos < 0)) return "SELL";
  return "HOLD";
}

/**
 * Compute ValueSignal for a given stock at its current price.
 * Reuses existing valuation engine.
 */
export function computeValueSignal(stock: Stock, livePrice: number): ValueSignalResult {
  // Use the live price for valuation
  const pricedStock: Stock = { ...stock, price: livePrice };
  const valuation = computeValuation(pricedStock, defaultDCFParams(pricedStock));

  const mos = valuation.marginOfSafety;
  const pe = valuation.ratios.pe;
  const roe = valuation.ratios.roe;
  const dividendYield = valuation.ratios.dividendYield;
  const peg = valuation.ratios.peg;

  const signal = determineSignal(mos, pe, roe, peg);

  // Weighted composite score
  const score = clampScore(
    mosScore(mos) * 0.40 +
      peScore(pe) * 0.25 +
      roeScore(roe) * 0.20 +
      pegScore(peg) * 0.10 +
      yieldScore(dividendYield) * 0.05
  );

  const meta = SIGNAL_META[signal];

  return {
    signal,
    score,
    label: meta.label,
    labelEn: meta.labelEn,
    color: meta.color,
    factors: {
      mos,
      pe: Number.isFinite(pe) ? pe : 0,
      roe: Number.isFinite(roe) ? roe : 0,
      yield: dividendYield,
      peg: Number.isFinite(peg) ? peg : 0,
    },
    fairValue: valuation.fairValue,
    upside: valuation.dcf.upside,
  };
}

export function getSignalLabel(signal: Signal, lang: "th" | "en"): string {
  return lang === "th" ? SIGNAL_META[signal].label : SIGNAL_META[signal].labelEn;
}

export function getSignalEmoji(signal: Signal): string {
  return SIGNAL_META[signal].emoji;
}

export { SIGNAL_META };

import { NextRequest, NextResponse } from "next/server";
import { STOCKS } from "@/lib/stocks";
import { ensureMarketDataIndexes, getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { readExternalAsset } from "@/lib/market-data-store";
import { eodhdRealtimeTicker, fetchEodhdFundamentals, searchEodhdSymbol } from "@/lib/market-quotes";
import { sanitizePublicMarketPayload } from "@/lib/public-market-source";
import { normalizeTickerSymbol, tickerAliasNote } from "@/lib/ticker-aliases";
import type { Stock } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_TTL_MS = 30 * 60_000;

type IntelligenceCacheDocument = {
  symbol: string;
  data: MarketIntelligence;
  fetchedAt: Date;
  expiresAt: Date;
};

type MarketIntelligence = {
  symbol: string;
  ticker: string;
  provider: string;
  updatedAt: string;
  capabilities: string[];
  news: Array<{ title: string; date: string | null; source: string | null; url: string | null; sentiment?: string | null }>;
  technicals: Array<{ label: string; value: number | null; signal: "bullish" | "neutral" | "bearish"; source: string }>;
  dividends: Array<{ date: string; value: number; currency?: string | null }>;
  splits: Array<{ date: string; split: string }>;
  earnings: Array<{ date: string; epsActual: number | null; epsEstimate: number | null; surprisePct: number | null }>;
  etf: {
    aum: number | null;
    expenseRatio: number | null;
    nav: number | null;
    holdings: Array<{ name: string; symbol?: string | null; weight: number | null }>;
    sectors: Array<{ name: string; weight: number | null }>;
  } | null;
  options: {
    available: boolean;
    nearestExpiration: string | null;
    sampleContracts: Array<{ code: string; type: string | null; strike: number | null; last: number | null; volume: number | null }>;
  };
  macro: Array<{ indicator: string; value: number | null; date: string | null }>;
  dataQuality: Array<{ label: string; status: "ok" | "partial" | "missing"; detail: string }>;
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function fromDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return isoDate(date);
}

function finite(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function fetchJson(url: string, revalidate = 1800) {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data && !data.Error ? data : null;
}

async function readCached(symbol: string) {
  if (!isMongoConfigured()) return null;
  try {
    await ensureMarketDataIndexes();
    const db = await getMongoDb();
    const doc = await db.collection<IntelligenceCacheDocument>("market_intelligence_cache").findOne({
      symbol,
      expiresAt: { $gt: new Date() },
    });
    return doc?.data || null;
  } catch {
    return null;
  }
}

async function saveCached(symbol: string, data: MarketIntelligence) {
  if (!isMongoConfigured()) return;
  try {
    await ensureMarketDataIndexes();
    const db = await getMongoDb();
    const now = new Date();
    await db.collection<IntelligenceCacheDocument>("market_intelligence_cache").updateOne(
      { symbol },
      {
        $set: {
          symbol,
          data,
          fetchedAt: now,
          expiresAt: new Date(now.getTime() + CACHE_TTL_MS),
        },
      },
      { upsert: true }
    );
  } catch {
    /* Intelligence cache is optional. */
  }
}

function latestTechnicalValue(payload: any) {
  const rows = Array.isArray(payload) ? payload : [];
  const latest = rows[rows.length - 1] || rows[0];
  return finite(latest?.sma ?? latest?.rsi ?? latest?.ema ?? latest?.value);
}

function technicalSignal(label: string, value: number | null): "bullish" | "neutral" | "bearish" {
  if (value === null) return "neutral";
  if (label === "RSI 14") {
    if (value >= 70) return "bearish";
    if (value <= 30) return "bullish";
  }
  return "neutral";
}

function normalizeNews(payload: any): MarketIntelligence["news"] {
  const rows = Array.isArray(payload) ? payload : [];
  return rows.slice(0, 6).map((row: any) => ({
    title: String(row.title || row.caption || "Untitled"),
    date: row.date || row.publishedDate || null,
    source: row.source || null,
    url: row.link || row.url || null,
    sentiment: row.sentiment || null,
  }));
}

function normalizeDividends(payload: any): MarketIntelligence["dividends"] {
  const rows = Array.isArray(payload) ? payload : [];
  return rows.slice(-8).reverse().map((row: any) => ({
    date: String(row.date || row.declarationDate || ""),
    value: finite(row.value ?? row.dividend) || 0,
    currency: row.currency || null,
  })).filter((row) => row.date && row.value > 0);
}

function normalizeSplits(payload: any): MarketIntelligence["splits"] {
  const rows = Array.isArray(payload) ? payload : [];
  return rows.slice(-5).reverse().map((row: any) => ({
    date: String(row.date || ""),
    split: String(row.split || `${row.beforeSplit || ""}:${row.afterSplit || ""}`).replace(/^:$/, ""),
  })).filter((row) => row.date && row.split);
}

function normalizeEarnings(fundamentals: any): MarketIntelligence["earnings"] {
  const history = fundamentals?.Earnings?.History || {};
  return Object.values(history)
    .filter((row: any) => row && typeof row === "object")
    .sort((a: any, b: any) => String(b.reportDate || b.date || "").localeCompare(String(a.reportDate || a.date || "")))
    .slice(0, 6)
    .map((row: any) => ({
      date: String(row.reportDate || row.date || ""),
      epsActual: finite(row.epsActual),
      epsEstimate: finite(row.epsEstimate),
      surprisePct: finite(row.surprisePercent),
    }))
    .filter((row) => row.date);
}

function normalizeEtf(fundamentals: any) {
  const data = fundamentals?.ETF_Data || fundamentals?.ETF || null;
  if (!data) return null;
  const holdingsSource = data.Holdings || data.Top_10_Holdings || {};
  const sectorsSource = data.Sector_Weights || data.Sectors || {};
  const holdings = Object.values(holdingsSource)
    .filter((row: any) => row && typeof row === "object")
    .slice(0, 10)
    .map((row: any) => ({
      name: String(row.Name || row.name || row.Asset || row.asset || row.Code || "Holding"),
      symbol: row.Code || row.Symbol || null,
      weight: finite(row["Assets_%"] ?? row.weight ?? row.Weight),
    }));
  const sectors = Object.entries(sectorsSource)
    .slice(0, 8)
    .map(([name, value]) => ({ name, weight: finite(value) }));
  return {
    aum: finite(data.TotalAssets ?? data.totalAssets),
    expenseRatio: finite(data.NetExpenseRatio ?? data.ExpenseRatio),
    nav: finite(data.NAV ?? data.nav),
    holdings,
    sectors,
  };
}

function normalizeOptions(payload: any): MarketIntelligence["options"] {
  const expirations = payload?.data || payload?.options || [];
  const rows = Array.isArray(expirations) ? expirations : [];
  const nearest = rows[0];
  const contracts = [
    ...(Array.isArray(nearest?.calls) ? nearest.calls : []),
    ...(Array.isArray(nearest?.puts) ? nearest.puts : []),
  ].slice(0, 8);
  return {
    available: rows.length > 0,
    nearestExpiration: nearest?.expirationDate || nearest?.expiration || null,
    sampleContracts: contracts.map((row: any) => ({
      code: String(row.contractName || row.code || row.symbol || ""),
      type: row.type || row.optionType || null,
      strike: finite(row.strike),
      last: finite(row.lastPrice ?? row.last),
      volume: finite(row.volume),
    })).filter((row) => row.code),
  };
}

function normalizeMacro(rows: any[]) {
  return rows.map((row) => {
    const values = Array.isArray(row.payload) ? row.payload : [];
    const latest = values[values.length - 1] || values[0] || {};
    return {
      indicator: row.indicator,
      value: finite(latest.value),
      date: latest.date || null,
    };
  });
}

function quality(data: MarketIntelligence): MarketIntelligence["dataQuality"] {
  return [
    { label: "News", status: data.news.length ? "ok" : "missing", detail: `${data.news.length} items` },
    { label: "Technicals", status: data.technicals.some((row) => row.value !== null) ? "ok" : "partial", detail: "SMA/RSI indicators" },
    { label: "Dividends", status: data.dividends.length ? "ok" : "partial", detail: `${data.dividends.length} recent records` },
    { label: "Earnings", status: data.earnings.length ? "ok" : "partial", detail: `${data.earnings.length} events` },
    { label: "Options", status: data.options.available ? "ok" : "missing", detail: data.options.nearestExpiration || "No chain returned" },
    { label: "Macro", status: data.macro.length ? "ok" : "partial", detail: `${data.macro.length} indicators` },
  ];
}

async function resolveStock(symbol: string) {
  const staticStock = STOCKS.find((stock) => stock.symbol.toUpperCase() === symbol);
  if (staticStock) return staticStock;
  return readExternalAsset(symbol);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const requestedSymbol = rawSymbol.toUpperCase().trim();
  const symbol = normalizeTickerSymbol(requestedSymbol);
  const aliasMeta = tickerAliasNote(requestedSymbol);
  const refresh = request.nextUrl.searchParams.get("refresh") === "1";
  const apiKey = process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN;

  if (!apiKey) {
    return NextResponse.json({ error: "Market intelligence feed is not configured", symbol }, { status: 503 });
  }

  if (!refresh) {
    const cached = await readCached(symbol);
    if (cached) {
      return NextResponse.json(sanitizePublicMarketPayload({ ...cached, ...aliasMeta }), { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=1800" } });
    }
  }

  const stock = (await resolveStock(symbol)) || ({
    symbol,
    assetType: "ETF",
    currency: "USD",
    market: "NASDAQ",
  } as Stock);
  const search = await searchEodhdSymbol(symbol, apiKey).catch(() => null);
  const ticker = search?.Code && search?.Exchange ? `${search.Code}.${search.Exchange}` : eodhdRealtimeTicker(symbol, stock);
  const encodedTicker = encodeURIComponent(ticker);
  const encodedKey = encodeURIComponent(apiKey);
  const from1y = fromDate(370);
  const to = isoDate(new Date());

  const [fundamentals, news, sma50, sma200, rsi14, dividends, splits, options, gdp, inflation, realRate] = await Promise.all([
    fetchEodhdFundamentals(ticker, apiKey).catch(() => null),
    fetchJson(`https://eodhd.com/api/news?s=${encodedTicker}&offset=0&limit=6&api_token=${encodedKey}&fmt=json`, 900),
    fetchJson(`https://eodhd.com/api/technical/${encodedTicker}?from=${from1y}&to=${to}&function=sma&period=50&api_token=${encodedKey}&fmt=json`, 1800),
    fetchJson(`https://eodhd.com/api/technical/${encodedTicker}?from=${from1y}&to=${to}&function=sma&period=200&api_token=${encodedKey}&fmt=json`, 1800),
    fetchJson(`https://eodhd.com/api/technical/${encodedTicker}?from=${from1y}&to=${to}&function=rsi&period=14&api_token=${encodedKey}&fmt=json`, 1800),
    fetchJson(`https://eodhd.com/api/div/${encodedTicker}?from=${fromDate(3650)}&api_token=${encodedKey}&fmt=json`, 86400),
    fetchJson(`https://eodhd.com/api/splits/${encodedTicker}?from=${fromDate(3650)}&api_token=${encodedKey}&fmt=json`, 86400),
    fetchJson(`https://eodhd.com/api/options/${encodedTicker}?from=${to}&to=${to}&api_token=${encodedKey}&fmt=json`, 1800),
    fetchJson(`https://eodhd.com/api/macro-indicator/USA?indicator=gdp_current_usd&api_token=${encodedKey}&fmt=json`, 86400),
    fetchJson(`https://eodhd.com/api/macro-indicator/USA?indicator=inflation_consumer_prices_annual&api_token=${encodedKey}&fmt=json`, 86400),
    fetchJson(`https://eodhd.com/api/macro-indicator/USA?indicator=real_interest_rate&api_token=${encodedKey}&fmt=json`, 86400),
  ]);

  const intelligence: MarketIntelligence = {
    symbol,
    ticker,
    provider: "Market Data Network",
    updatedAt: new Date().toISOString(),
    capabilities: ["news", "technical-indicators", "dividends", "splits", "earnings", "etf-data", "options", "macro"],
    news: normalizeNews(news),
    technicals: [
      { label: "SMA 50", value: latestTechnicalValue(sma50), signal: "neutral", source: "Market Technical Feed" },
      { label: "SMA 200", value: latestTechnicalValue(sma200), signal: "neutral", source: "Market Technical Feed" },
      { label: "RSI 14", value: latestTechnicalValue(rsi14), signal: technicalSignal("RSI 14", latestTechnicalValue(rsi14)), source: "Market Technical Feed" },
    ],
    dividends: normalizeDividends(dividends),
    splits: normalizeSplits(splits),
    earnings: normalizeEarnings(fundamentals),
    etf: normalizeEtf(fundamentals),
    options: normalizeOptions(options),
    macro: normalizeMacro([
      { indicator: "US GDP", payload: gdp },
      { indicator: "US Inflation", payload: inflation },
      { indicator: "US Real Interest Rate", payload: realRate },
    ]),
    dataQuality: [],
  };
  intelligence.dataQuality = quality(intelligence);

  await saveCached(symbol, intelligence);

  return NextResponse.json(
    sanitizePublicMarketPayload({ ...intelligence, ...aliasMeta }),
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=1800" } }
  );
}

import { Stock } from "@/lib/types";
import type { OhlcPoint } from "@/lib/types";
import {
  logMarketApiEvent,
  readCachedHistoricalBars,
  readCachedQuote,
  saveCachedHistoricalBars,
  saveCachedQuote,
} from "@/lib/market-data-store";
import { fetchSetHistoricalBars, fetchSetQuote, isSetOnlineDataConfigured } from "@/lib/set-online-data";

export type LatestQuote = {
  price: number;
  prevClose: number | null;
  source: string;
  updatedAt: string;
  delayMinutes: number;
  isDelayed: boolean;
};

type CacheEntry = {
  quote: LatestQuote | null;
  expiresAt: number;
  staleUntil: number;
};

const QUOTE_TTL_MS = 45_000;
const QUOTE_STALE_MS = 5 * 60_000;
const HISTORICAL_TTL_MS = 6 * 60 * 60_000;
const QUOTE_CACHE_MAX_ENTRIES = 250;
export const QUOTE_CACHE_VERSION = "regular-close-v2";
const quoteCache = new Map<string, CacheEntry>();
const pendingQuotes = new Map<string, Promise<LatestQuote | null>>();

function pruneQuoteCache(now = Date.now()) {
  for (const [symbol, entry] of quoteCache) {
    if (entry.staleUntil <= now) quoteCache.delete(symbol);
  }

  if (quoteCache.size <= QUOTE_CACHE_MAX_ENTRIES) return;

  const overflow = quoteCache.size - QUOTE_CACHE_MAX_ENTRIES;
  let removed = 0;
  for (const symbol of quoteCache.keys()) {
    quoteCache.delete(symbol);
    removed += 1;
    if (removed >= overflow) break;
  }
}

export function getMarketDataProviderPolicy() {
  return {
    core: "eodhd",
    thaiPreferred: "set-online-data",
    usRealtime: "massive",
    usHistoricalPreferred: "massive",
    globalHistorical: "eodhd",
    thaiLicensedRealtime: isSetOnlineDataConfigured(),
    notes: [
      "EODHD is the core global provider for non-US quotes, EOD history, crypto, commodities, and global coverage.",
      "Massive is used for US stock/ETF quote snapshots, websocket streaming, and US aggregates when available.",
      "SET Online Data is used first for Thai listed securities when the SMART Marketplace endpoint configuration is present.",
      "Thai mutual fund NAV coverage may still require AIMC, FundConnext, or a fund-data vendor.",
    ],
  } as const;
}

function finiteNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function isUsExchangeSecurity(stock: Stock | undefined, symbol: string) {
  if (!stock) return /^[A-Z]{1,5}(\.[A-Z])?$/.test(symbol);
  if (stock.assetType === "INDEX") return false;
  if (stock.assetType === "CRYPTO" || stock.assetType === "FUTURES") return false;
  return (
    stock.assetType === "US_STOCK" ||
    (stock.assetType === "ETF" && stock.currency === "USD") ||
    stock.market === "NASDAQ" ||
    stock.market === "NYSE"
  );
}

export function isThaiExchangeSecurity(stock: Stock | undefined) {
  if (!stock) return false;
  return (
    stock.currency === "THB" &&
    (stock.assetType === "TH_STOCK" || stock.assetType === "ETF") &&
    (stock.market === "SET" || stock.market === "mai")
  );
}

function thaiTicker(symbol: string) {
  return symbol.includes(".") ? symbol : `${symbol}.BK`;
}

function usTicker(symbol: string) {
  return symbol.includes(".") ? symbol : `${symbol}.US`;
}

function cryptoTicker(symbol: string) {
  return symbol.includes("-") || symbol.includes(".") ? symbol : `${symbol}-USD.CC`;
}

export function eodhdRealtimeTicker(symbol: string, stock: Stock | undefined) {
  if (stock?.assetType === "INDEX") {
    const map: Record<string, string> = {
      SPX: "GSPC.INDX",
      GSPC: "GSPC.INDX",
      DJI: "DJI.INDX",
      DJIA: "DJI.INDX",
      IXIC: "IXIC.INDX",
      NDX: "NDX.INDX",
    };
    return map[symbol.toUpperCase()] || `${symbol}.INDX`;
  }
  if (stock?.assetType === "CRYPTO") return cryptoTicker(symbol);
  if (stock?.assetType === "FUTURES") {
    const map: Record<string, string> = {
      GOLD: "XAUUSD.FOREX",
      SILVER: "XAGUSD.FOREX",
    };
    return map[symbol.toUpperCase()] || symbol;
  }
  if (stock?.currency === "THB" || stock?.market === "SET" || stock?.market === "mai") return thaiTicker(symbol);
  if (stock?.assetType === "US_FUND" || stock?.assetType === "US_STOCK" || stock?.currency === "USD") return usTicker(symbol);
  return symbol;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function historicalRange(years: number) {
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - years);
  return { from: isoDate(from), to: isoDate(to), key: `${years}y-daily` };
}

function normalizeOhlcPoint(point: Partial<OhlcPoint>) {
  const open = finiteNumber(point.open);
  const high = finiteNumber(point.high);
  const low = finiteNumber(point.low);
  const close = finiteNumber(point.close);
  if (!point.date || !open || !high || !low || !close) return null;
  return {
    date: point.date,
    open,
    high,
    low,
    close,
    volume: Math.max(0, Number(point.volume || 0)),
  };
}

function eodhdCommodityCode(symbol: string) {
  const map: Record<string, { code: string; interval: "daily" | "monthly"; delayMinutes: number }> = {
    OIL: { code: "WTI", interval: "daily", delayMinutes: 7 * 24 * 60 },
    GAS: { code: "NATURAL_GAS", interval: "daily", delayMinutes: 7 * 24 * 60 },
    COPPER: { code: "COPPER", interval: "monthly", delayMinutes: 30 * 24 * 60 },
  };
  return map[symbol.toUpperCase()] || null;
}

export function isUsRegularSessionOpen(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const weekday = value("weekday");
  if (weekday === "Sat" || weekday === "Sun") return false;

  const hour = Number(value("hour"));
  const minute = Number(value("minute"));
  const minutes = hour * 60 + minute;
  return minutes >= 9 * 60 + 30 && minutes < 16 * 60;
}

function selectMassiveSnapshotPrice(ticker: any) {
  const regularClose = finiteNumber(ticker.day?.c);
  const intradayPrice =
    finiteNumber(ticker.lastTrade?.p) ||
    finiteNumber(ticker.min?.c) ||
    regularClose;

  if (!isUsRegularSessionOpen() && regularClose) {
    return {
      price: regularClose,
      source: "massive-regular-close",
    };
  }

  return {
    price: intradayPrice,
    source: "massive-snapshot",
  };
}

export async function fetchMassiveQuote(symbol: string, apiKey: string): Promise<LatestQuote | null> {
  const encodedKey = encodeURIComponent(apiKey);
  const startedAt = Date.now();
  const snapshotRes = await fetch(
    `https://api.massive.com/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${encodedKey}`,
    { next: { revalidate: 15 } }
  );

  if (snapshotRes.ok) {
    const snapshot = await snapshotRes.json();
    const ticker = snapshot.ticker || {};
    const selected = selectMassiveSnapshotPrice(ticker);
    const prevClose = finiteNumber(ticker.prevDay?.c) || finiteNumber(ticker.day?.o) || selected.price;
    if (selected.price) {
      logMarketApiEvent({
        provider: "massive",
        symbol,
        ok: true,
        source: selected.source,
        status: snapshotRes.status,
        latencyMs: Date.now() - startedAt,
      });
      return {
        price: selected.price,
        prevClose: prevClose || selected.price,
        source: selected.source,
        updatedAt: new Date().toISOString(),
        delayMinutes: 15,
        isDelayed: true,
      };
    }
  }

  const tradeRes = await fetch(
    `https://api.massive.com/v2/last/trade/${symbol}?apiKey=${encodedKey}`,
    { next: { revalidate: 15 } }
  );
  if (!tradeRes.ok) {
    logMarketApiEvent({
      provider: "massive",
      symbol,
      ok: false,
      source: "last-trade",
      status: tradeRes.status,
      latencyMs: Date.now() - startedAt,
    });
    return null;
  }

  const trade = await tradeRes.json();
  const price = finiteNumber(trade.results?.p);
  if (price) {
    logMarketApiEvent({
      provider: "massive",
      symbol,
      ok: true,
      source: "last-trade",
      status: tradeRes.status,
      latencyMs: Date.now() - startedAt,
    });
    return {
        price,
        prevClose: null,
        source: "massive-trade",
        updatedAt: new Date().toISOString(),
        delayMinutes: 15,
        isDelayed: true,
    };
  }
  return null;
}

export async function fetchEodhdQuote(symbol: string, apiKey: string, stock?: Stock): Promise<LatestQuote | null> {
  const startedAt = Date.now();
  const ticker = eodhdRealtimeTicker(symbol, stock);
  const res = await fetch(
    `https://eodhd.com/api/real-time/${encodeURIComponent(ticker)}?api_token=${encodeURIComponent(apiKey)}&fmt=json`,
    { next: { revalidate: 15 } }
  );
  if (!res.ok) {
    logMarketApiEvent({
      provider: "eodhd",
      symbol,
      ok: false,
      source: "real-time",
      status: res.status,
      latencyMs: Date.now() - startedAt,
    });
    return null;
  }

  const data = await res.json();
  const price =
    finiteNumber(data.close) ||
    finiteNumber(data.last) ||
    finiteNumber(data.price) ||
    finiteNumber(data.previousClose);
  const prevClose =
    finiteNumber(data.previousClose) ||
    finiteNumber(data.previous_close) ||
    finiteNumber(data.prev_close);
  if (price) {
    logMarketApiEvent({
      provider: "eodhd",
      symbol,
      ok: true,
      source: "real-time",
      status: res.status,
      latencyMs: Date.now() - startedAt,
    });
    return {
        price,
        prevClose: prevClose || price,
        source: finiteNumber(data.close) || finiteNumber(data.last) || finiteNumber(data.price)
          ? `eodhd-${ticker}`
          : `eodhd-prevclose-${ticker}`,
        updatedAt: typeof data.timestamp === "number" ? new Date(data.timestamp * 1000).toISOString() : new Date().toISOString(),
        delayMinutes: stock?.assetType === "CRYPTO" ? 1 : 20,
        isDelayed: true,
    };
  }
  return null;
}

export type EodhdSearchResult = {
  Code?: string;
  Exchange?: string;
  Name?: string;
  Type?: string;
  Country?: string;
  Currency?: string;
  ISIN?: string;
};

export async function searchEodhdSymbol(symbol: string, apiKey: string) {
  const normalized = symbol.toUpperCase().trim();
  const startedAt = Date.now();
  const res = await fetch(
    `https://eodhd.com/api/search/${encodeURIComponent(normalized)}?api_token=${encodeURIComponent(apiKey)}&fmt=json&limit=10`,
    { next: { revalidate: 86400 } }
  );

  if (!res.ok) {
    logMarketApiEvent({
      provider: "eodhd",
      symbol: normalized,
      ok: false,
      source: "search",
      status: res.status,
      latencyMs: Date.now() - startedAt,
    });
    return null;
  }

  const payload = await res.json();
  const rows = Array.isArray(payload) ? (payload as EodhdSearchResult[]) : [];
  const exact =
    rows.find((row) => row.Code?.toUpperCase() === normalized && row.Exchange === "US") ||
    rows.find((row) => row.Code?.toUpperCase() === normalized) ||
    rows[0];

  logMarketApiEvent({
    provider: "eodhd",
    symbol: normalized,
    ok: Boolean(exact),
    source: "search",
    status: res.status,
    latencyMs: Date.now() - startedAt,
  });

  return exact || null;
}

export async function fetchEodhdFundamentals(ticker: string, apiKey: string) {
  const normalized = ticker.toUpperCase().trim();
  const startedAt = Date.now();
  const res = await fetch(
    `https://eodhd.com/api/fundamentals/${encodeURIComponent(normalized)}?api_token=${encodeURIComponent(apiKey)}&fmt=json`,
    { next: { revalidate: 86400 } }
  );

  if (!res.ok) {
    logMarketApiEvent({
      provider: "eodhd",
      symbol: normalized,
      ok: false,
      source: "fundamentals",
      status: res.status,
      latencyMs: Date.now() - startedAt,
    });
    return null;
  }

  const payload = await res.json();
  logMarketApiEvent({
    provider: "eodhd",
    symbol: normalized,
    ok: Boolean(payload && !payload.Error),
    source: "fundamentals",
    status: res.status,
    latencyMs: Date.now() - startedAt,
  });

  return payload && !payload.Error ? payload : null;
}

export async function fetchEodhdCommodityQuote(symbol: string, apiKey: string): Promise<LatestQuote | null> {
  const commodity = eodhdCommodityCode(symbol);
  if (!commodity) return null;

  const startedAt = Date.now();
  const res = await fetch(
    `https://eodhd.com/api/commodities/historical/${encodeURIComponent(commodity.code)}?api_token=${encodeURIComponent(apiKey)}&interval=${commodity.interval}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    logMarketApiEvent({
      provider: "eodhd",
      symbol,
      ok: false,
      source: "commodities",
      status: res.status,
      latencyMs: Date.now() - startedAt,
    });
    return null;
  }

  const payload = await res.json();
  const rows = Array.isArray(payload?.data)
    ? [...payload.data].sort((a, b) => String(a?.date || "").localeCompare(String(b?.date || "")))
    : [];
  const latest = rows[rows.length - 1];
  const previous = rows[rows.length - 2] || latest;
  const price = finiteNumber(latest?.value);
  if (!price) return null;

  logMarketApiEvent({
    provider: "eodhd",
    symbol,
    ok: true,
    source: `commodities-${commodity.code}`,
    status: res.status,
    latencyMs: Date.now() - startedAt,
  });

  return {
    price,
    prevClose: finiteNumber(previous?.value) || price,
    source: `eodhd-commodity-${commodity.code}`,
    updatedAt: latest?.date ? new Date(latest.date).toISOString() : new Date().toISOString(),
    delayMinutes: commodity.delayMinutes,
    isDelayed: true,
  };
}

async function fetchMassiveHistoricalBars(symbol: string, apiKey: string, years = 5) {
  const { from, to } = historicalRange(years);
  const startedAt = Date.now();
  const res = await fetch(
    `https://api.massive.com/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${encodeURIComponent(apiKey)}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    logMarketApiEvent({
      provider: "massive",
      symbol,
      ok: false,
      source: "historical-aggs",
      status: res.status,
      latencyMs: Date.now() - startedAt,
    });
    return null;
  }

  const payload = await res.json();
  const bars = Array.isArray(payload?.results)
    ? payload.results
        .map((row: any) =>
          normalizeOhlcPoint({
            date: typeof row.t === "number" ? new Date(row.t).toISOString().slice(0, 10) : undefined,
            open: row.o,
            high: row.h,
            low: row.l,
            close: row.c,
            volume: row.v,
          })
        )
        .filter(Boolean)
    : [];

  if (!bars.length) return null;

  logMarketApiEvent({
    provider: "massive",
    symbol,
    ok: true,
    source: "historical-aggs",
    status: res.status,
    latencyMs: Date.now() - startedAt,
  });
  return { bars: bars as OhlcPoint[], source: "massive-historical-aggs" };
}

async function fetchEodhdHistoricalBars(symbol: string, apiKey: string, stock: Stock | undefined, years = 5) {
  const { from, to } = historicalRange(years);
  const ticker = eodhdRealtimeTicker(symbol, stock);
  const startedAt = Date.now();
  const res = await fetch(
    `https://eodhd.com/api/eod/${encodeURIComponent(ticker)}?from=${from}&to=${to}&period=d&api_token=${encodeURIComponent(apiKey)}&fmt=json`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    logMarketApiEvent({
      provider: "eodhd",
      symbol,
      ok: false,
      source: "historical-eod",
      status: res.status,
      latencyMs: Date.now() - startedAt,
    });
    return null;
  }

  const payload = await res.json();
  const bars = Array.isArray(payload)
    ? payload
        .map((row: any) =>
          normalizeOhlcPoint({
            date: row.date,
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.adjusted_close || row.close,
            volume: row.volume,
          })
        )
        .filter(Boolean)
    : [];

  if (!bars.length) return null;

  logMarketApiEvent({
    provider: "eodhd",
    symbol,
    ok: true,
    source: `historical-eod-${ticker}`,
    status: res.status,
    latencyMs: Date.now() - startedAt,
  });
  return { bars: bars as OhlcPoint[], source: `eodhd-historical-${ticker}` };
}

async function fetchEodhdCommodityHistoricalBars(symbol: string, apiKey: string) {
  const commodity = eodhdCommodityCode(symbol);
  if (!commodity) return null;

  const startedAt = Date.now();
  const res = await fetch(
    `https://eodhd.com/api/commodities/historical/${encodeURIComponent(commodity.code)}?api_token=${encodeURIComponent(apiKey)}&interval=${commodity.interval}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    logMarketApiEvent({
      provider: "eodhd",
      symbol,
      ok: false,
      source: "historical-commodities",
      status: res.status,
      latencyMs: Date.now() - startedAt,
    });
    return null;
  }

  const payload = await res.json();
  const values = Array.isArray(payload?.data)
    ? [...payload.data].sort((a, b) => String(a?.date || "").localeCompare(String(b?.date || "")))
    : [];
  const bars = values
    .map((row: any, index: number) => {
      const value = finiteNumber(row.value);
      if (!row.date || !value) return null;
      const previous = finiteNumber(values[index - 1]?.value) || value;
      const spread = Math.max(value * 0.004, Math.abs(value - previous) * 0.5);
      return normalizeOhlcPoint({
        date: row.date,
        open: previous,
        high: Math.max(previous, value) + spread,
        low: Math.max(0.01, Math.min(previous, value) - spread),
        close: value,
        volume: 0,
      });
    })
    .filter(Boolean) as OhlcPoint[];

  if (!bars.length) return null;

  logMarketApiEvent({
    provider: "eodhd",
    symbol,
    ok: true,
    source: `historical-commodities-${commodity.code}`,
    status: res.status,
    latencyMs: Date.now() - startedAt,
  });
  return { bars, source: `eodhd-commodity-history-${commodity.code}` };
}

export async function getHistoricalBars(symbol: string, stock?: Stock, options: { years?: number; allowStaleQuote?: boolean } = {}) {
  const normalized = symbol.toUpperCase().trim();
  const years = options.years || 5;
  const { key } = historicalRange(years);
  const massiveApiKey = process.env.MASSIVE_API_KEY;
  const eodhdApiKey = process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN;
  const preferredProvider = isThaiExchangeSecurity(stock) && isSetOnlineDataConfigured()
    ? "set"
    : stock?.assetType === "FUTURES" || !isUsExchangeSecurity(stock, normalized)
      ? "eodhd"
      : "massive";

  const cached = await readCachedHistoricalBars(normalized, key, preferredProvider);
  if (cached?.bars?.length) return cached;

  let result: { bars: OhlcPoint[]; source: string } | null = null;
  let provider = preferredProvider;
  if (isThaiExchangeSecurity(stock) && isSetOnlineDataConfigured()) {
    result = await fetchSetHistoricalBars(normalized, stock, historicalRange(years).from, historicalRange(years).to).catch(() => null);
    provider = result ? "set" : provider;
  }
  if (stock?.assetType === "FUTURES" && eodhdApiKey) {
    result = await fetchEodhdCommodityHistoricalBars(normalized, eodhdApiKey).catch(() => null);
    provider = "eodhd";
  }
  if (!result && isUsExchangeSecurity(stock, normalized) && massiveApiKey) {
    result = await fetchMassiveHistoricalBars(normalized, massiveApiKey, years).catch(() => null);
    provider = result ? "massive" : provider;
  }
  if (!result && eodhdApiKey) {
    result = await fetchEodhdHistoricalBars(normalized, eodhdApiKey, stock, years).catch(() => null);
    provider = result ? "eodhd" : provider;
  }

  if (result?.bars?.length) {
    await saveCachedHistoricalBars(normalized, key, provider, result.source, result.bars, HISTORICAL_TTL_MS);
    return { ...result, fetchedAt: new Date().toISOString() };
  }

  return null;
}

async function fetchProviderQuote(symbol: string, stock: Stock | undefined) {
  const massiveApiKey = process.env.MASSIVE_API_KEY;
  const eodhdApiKey = process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN;

  if (isThaiExchangeSecurity(stock) && isSetOnlineDataConfigured()) {
    const quote = await fetchSetQuote(symbol, stock).catch(() => null);
    if (quote) return quote;
  }

  if (isThaiExchangeSecurity(stock) && eodhdApiKey) {
    const quote = await fetchEodhdQuote(symbol, eodhdApiKey, stock).catch(() => null);
    if (quote) return quote;
  }

  if ((stock?.assetType === "US_FUND" || stock?.assetType === "FUND" || stock?.assetType === "CRYPTO") && eodhdApiKey) {
    const quote = await fetchEodhdQuote(symbol, eodhdApiKey, stock).catch(() => null);
    if (quote) return quote;
  }

  if (stock?.assetType === "INDEX" && eodhdApiKey) {
    const quote = await fetchEodhdQuote(symbol, eodhdApiKey, stock).catch(() => null);
    if (quote) return quote;
  }

  if (stock?.assetType === "FUTURES" && eodhdApiKey) {
    const quote = await fetchEodhdCommodityQuote(symbol, eodhdApiKey).catch(() => null);
    if (quote) return quote;
    const fallbackQuote = await fetchEodhdQuote(symbol, eodhdApiKey, stock).catch(() => null);
    if (fallbackQuote) return fallbackQuote;
  }

  const usSecurity = isUsExchangeSecurity(stock, symbol);
  if (usSecurity && !isUsRegularSessionOpen() && eodhdApiKey) {
    const quote = await fetchEodhdQuote(symbol, eodhdApiKey, stock).catch(() => null);
    if (quote) return quote;
  }

  if (usSecurity && massiveApiKey) {
    const quote = await fetchMassiveQuote(symbol, massiveApiKey).catch(() => null);
    if (quote) return quote;
  }

  if (usSecurity && eodhdApiKey) {
    const quote = await fetchEodhdQuote(symbol, eodhdApiKey, stock).catch(() => null);
    if (quote) return quote;
  }

  return null;
}

export async function getLatestQuote(symbol: string, stock?: Stock, options: { allowStale?: boolean } = {}) {
  const normalized = symbol.toUpperCase().trim();
  const now = Date.now();
  pruneQuoteCache(now);
  const cached = quoteCache.get(normalized);

  if (cached && cached.expiresAt > now) return cached.quote;
  if (options.allowStale && cached && cached.staleUntil > now) return cached.quote;

  const mongoCached = await readCachedQuote(normalized, {
    ...options,
    cacheVersion: QUOTE_CACHE_VERSION,
  });
  if (mongoCached) {
    quoteCache.set(normalized, {
      quote: mongoCached,
      expiresAt: now + QUOTE_TTL_MS,
      staleUntil: now + QUOTE_STALE_MS,
    });
    return mongoCached;
  }

  const pending = pendingQuotes.get(normalized);
  if (pending) return pending;

  const request = fetchProviderQuote(normalized, stock)
    .then((quote) => {
      const fetchedAt = Date.now();
      quoteCache.set(normalized, {
        quote,
        expiresAt: fetchedAt + QUOTE_TTL_MS,
        staleUntil: fetchedAt + QUOTE_STALE_MS,
      });
      pruneQuoteCache(fetchedAt);
      if (quote) saveCachedQuote(normalized, quote, QUOTE_TTL_MS, QUOTE_STALE_MS, QUOTE_CACHE_VERSION);
      return quote;
    })
    .finally(() => {
      pendingQuotes.delete(normalized);
    });

  pendingQuotes.set(normalized, request);
  return request;
}

export function applyLatestQuote<T extends Stock>(stock: T, quote: LatestQuote): T & {
  quoteSource: string;
  quoteUpdatedAt: string;
  quoteDelayMinutes: number;
  quoteIsDelayed: boolean;
} {
  const priceHistory = stock.priceHistory?.length ? [...stock.priceHistory] : [quote.price];
  priceHistory[priceHistory.length - 1] = quote.price;

  const ohlcHistory = stock.ohlcHistory?.length
    ? stock.ohlcHistory.map((point, index) => {
        if (index !== stock.ohlcHistory!.length - 1) return point;
        return {
          ...point,
          close: quote.price,
          high: Math.max(point.high, quote.price),
          low: Math.min(point.low, quote.price),
        };
      })
    : stock.ohlcHistory;

  return {
    ...stock,
    price: quote.price,
    prevClose: quote.prevClose || stock.prevClose || quote.price,
    priceHistory,
    ohlcHistory,
    quoteSource: quote.source,
    quoteUpdatedAt: quote.updatedAt,
    quoteDelayMinutes: quote.delayMinutes,
    quoteIsDelayed: quote.isDelayed,
  };
}

export function withStaticQuoteMeta<T extends Stock>(stock: T, source = "static") {
  return {
    ...stock,
    quoteSource: source,
    quoteUpdatedAt: new Date().toISOString(),
    quoteDelayMinutes: 0,
    quoteIsDelayed: source !== "static" && source !== "simulated",
  };
}

import type { LatestQuote } from "@/lib/market-quotes";
import type { OhlcPoint, Stock } from "@/lib/types";
import { logMarketApiEvent } from "@/lib/market-data-store";

type SetRequestOptions = {
  symbol: string;
  source: string;
  path?: string;
  query?: Record<string, string>;
};

function finiteNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function configured() {
  return Boolean(process.env.SET_API_KEY && process.env.SET_API_BASE_URL);
}

function apiKey() {
  return process.env.SET_API_KEY || process.env.SET_ONLINE_DATA_API_KEY || "";
}

function baseUrl() {
  return (process.env.SET_API_BASE_URL || "").replace(/\/+$/, "");
}

function quotePath() {
  return process.env.SET_QUOTE_PATH || process.env.SET_MARKET_DATA_PATH || "";
}

function eodPath() {
  return process.env.SET_EOD_PATH || process.env.SET_HISTORICAL_PATH || "";
}

function securitiesPath() {
  return process.env.SET_SECURITIES_PATH || process.env.SET_REFERENCE_SECURITIES_PATH || "";
}

function replacePath(path: string, symbol: string) {
  return path
    .replaceAll("{symbol}", encodeURIComponent(symbol))
    .replaceAll(":symbol", encodeURIComponent(symbol));
}

function collectObjects(value: unknown, out: any[] = []) {
  if (!value || out.length > 200) return out;
  if (Array.isArray(value)) {
    value.forEach((item) => collectObjects(item, out));
    return out;
  }
  if (typeof value === "object") {
    out.push(value);
    Object.values(value).forEach((item) => collectObjects(item, out));
  }
  return out;
}

function pickNumber(row: any, keys: string[]) {
  for (const key of keys) {
    const value = finiteNumber(row?.[key]);
    if (value) return value;
  }
  return null;
}

function pickDate(row: any) {
  const value =
    row?.date ||
    row?.tradingDate ||
    row?.tradeDate ||
    row?.asOfDate ||
    row?.datetime ||
    row?.timestamp;
  if (typeof value === "number") return new Date(value > 10_000_000_000 ? value : value * 1000).toISOString();
  if (typeof value === "string" && value.trim()) return new Date(value).toISOString();
  return new Date().toISOString();
}

async function setFetch({ symbol, source, path, query = {} }: SetRequestOptions) {
  if (!configured() || !path) return null;

  const startedAt = Date.now();
  const url = new URL(`${baseUrl()}${replacePath(path, symbol).startsWith("/") ? "" : "/"}${replacePath(path, symbol)}`);
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  if (process.env.SET_API_KEY_IN_QUERY === "1") url.searchParams.set(process.env.SET_API_KEY_QUERY_NAME || "apiKey", apiKey());

  const headers: Record<string, string> = {
    Accept: "application/json",
    "x-api-key": apiKey(),
  };
  if (process.env.SET_API_AUTH_HEADER) headers[process.env.SET_API_AUTH_HEADER] = apiKey();
  if (process.env.SET_API_BEARER === "1") headers.Authorization = `Bearer ${apiKey()}`;

  try {
    const res = await fetch(url, { headers, next: { revalidate: 15 } });
    const contentType = res.headers.get("content-type") || "";
    const payload = contentType.includes("json") ? await res.json() : await res.text();
    logMarketApiEvent({
      provider: "set",
      symbol,
      ok: res.ok,
      source,
      status: res.status,
      latencyMs: Date.now() - startedAt,
    });
    if (!res.ok) return null;
    return payload;
  } catch (error: any) {
    logMarketApiEvent({
      provider: "set",
      symbol,
      ok: false,
      source,
      error: error?.message || String(error),
      latencyMs: Date.now() - startedAt,
    });
    return null;
  }
}

export function isSetOnlineDataConfigured() {
  return configured();
}

export async function fetchSetQuote(symbol: string, stock?: Stock): Promise<LatestQuote | null> {
  if (!stock || stock.currency !== "THB" || stock.market === "MUTUAL_FUND") return null;

  const payload = await setFetch({ symbol, source: "quote", path: quotePath(), query: { symbol } });
  if (!payload) return null;

  const row = collectObjects(payload).find((item) => {
    const itemSymbol = String(item?.symbol || item?.securitySymbol || item?.security || item?.ticker || "").toUpperCase();
    return !itemSymbol || itemSymbol === symbol.toUpperCase();
  });
  if (!row) return null;

  const price = pickNumber(row, ["last", "lastPrice", "last_price", "marketPrice", "price", "close", "lastSale"]);
  const prevClose = pickNumber(row, ["prior", "priorClose", "previousClose", "prevClose", "previous_close", "prior_close"]);
  if (!price) return null;

  return {
    price,
    prevClose: prevClose || price,
    source: "set-online-data",
    updatedAt: pickDate(row),
    delayMinutes: process.env.SET_API_REALTIME === "1" ? 0 : 15,
    isDelayed: process.env.SET_API_REALTIME !== "1",
  };
}

export async function fetchSetHistoricalBars(symbol: string, stock?: Stock, from?: string, to?: string) {
  if (!stock || stock.currency !== "THB" || stock.market === "MUTUAL_FUND") return null;

  const payload = await setFetch({
    symbol,
    source: "historical-eod",
    path: eodPath(),
    query: {
      symbol,
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    },
  });
  if (!payload) return null;

  const bars = collectObjects(payload)
    .map((row) => {
      const dateValue = row?.date || row?.tradingDate || row?.tradeDate || row?.asOfDate;
      const date = typeof dateValue === "string" ? dateValue.slice(0, 10) : null;
      const close = pickNumber(row, ["close", "closePrice", "closingPrice", "last", "lastPrice"]);
      const open = pickNumber(row, ["open", "openPrice"]) || close;
      const high = pickNumber(row, ["high", "highPrice"]) || close;
      const low = pickNumber(row, ["low", "lowPrice"]) || close;
      if (!date || !open || !high || !low || !close) return null;
      return {
        date,
        open,
        high,
        low,
        close,
        volume: Number(row?.volume || row?.totalVolume || row?.tradeVolume || 0),
      } satisfies OhlcPoint;
    })
    .filter(Boolean) as OhlcPoint[];

  const uniqueBars = Array.from(new Map(bars.map((bar) => [bar.date, bar])).values())
    .sort((a, b) => a.date.localeCompare(b.date));

  return uniqueBars.length ? { bars: uniqueBars, source: "set-online-data-eod" } : null;
}

export type SetSecurityRecord = {
  symbol: string;
  name?: string;
  enName?: string;
  market?: string;
  securityType?: string;
  sector?: string;
  raw: Record<string, unknown>;
};

export async function fetchSetSecurityUniverse() {
  const payload = await setFetch({ symbol: "ALL", source: "security-universe", path: securitiesPath() });
  if (!payload) return [];

  const rows = collectObjects(payload)
    .map((row): SetSecurityRecord | null => {
      const symbol = String(row?.symbol || row?.securitySymbol || row?.security || row?.ticker || "").toUpperCase().trim();
      if (!/^[A-Z0-9.-]{1,20}$/.test(symbol)) return null;
      return {
        symbol,
        name: row?.nameTH || row?.nameTh || row?.thaiName || row?.name || undefined,
        enName: row?.nameEN || row?.nameEn || row?.englishName || row?.fullName || undefined,
        market: row?.market || row?.exchange || row?.board || undefined,
        securityType: row?.securityType || row?.type || row?.instrumentType || undefined,
        sector: row?.sector || row?.industry || undefined,
        raw: row,
      };
    })
    .filter(Boolean) as SetSecurityRecord[];

  return Array.from(new Map(rows.map((row) => [row.symbol, row])).values());
}

import { NextRequest, NextResponse } from "next/server";
import { STOCKS } from "@/lib/stocks";
import nasdaqIndex from "@/lib/nasdaq_index.json";
import { applyLatestQuote, getLatestQuote, withStaticQuoteMeta } from "@/lib/market-quotes";
import { readCachedMarketUniverse, saveCachedMarketUniverse } from "@/lib/market-data-store";
import { sanitizePublicMarketPayload } from "@/lib/public-market-source";
import type { Stock } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=30, stale-while-revalidate=300",
};

const UNIVERSE_TTL_MS = 60_000;
const UNIVERSE_STALE_MS = 10 * 60_000;
const UNIVERSE_CACHE_VERSION = "multi-asset-universe-v1";

const US_CORE_SYMBOLS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META",
  "TSLA",
  "AVGO",
  "COST",
  "NFLX",
  "AMD",
  "ADBE",
  "PEP",
  "CSCO",
  "TMUS",
  "JPM",
  "BRK.B",
  "V",
  "MA",
  "LLY",
  "UNH",
  "WMT",
  "PG",
  "JNJ",
  "HD",
  "BAC",
  "KO",
  "MRK",
  "XOM",
  "CVX",
  "ORCL",
  "CRM",
  "MCD",
  "DIS",
  "NKE",
  "IBM",
  "GS",
  "CAT",
  "BA",
];

const INDEX_ROWS: Stock[] = [
  buildIndexStock({
    symbol: "SPX",
    name: "S&P 500",
    about: "ดัชนีหุ้นขนาดใหญ่ 500 บริษัทของสหรัฐ ใช้เป็นตัวแทนภาพรวมตลาดหุ้นสหรัฐ",
    color: "#22C55E",
  }),
  buildIndexStock({
    symbol: "DJI",
    name: "Dow Jones Industrial Average",
    about: "ดัชนีหุ้น blue-chip สหรัฐ 30 บริษัท ใช้ดูภาพรวมอุตสาหกรรมขนาดใหญ่",
    color: "#F59E0B",
  }),
  buildIndexStock({
    symbol: "IXIC",
    name: "Nasdaq Composite",
    about: "ดัชนีรวมหลักทรัพย์ใน Nasdaq เน้นบริษัทเทคโนโลยีและ growth stocks",
    color: "#38BDF8",
  }),
];

function buildIndexStock(input: { symbol: string; name: string; about: string; color: string }): Stock {
  return {
    symbol: input.symbol,
    name: input.name,
    enName: input.name,
    sector: "กองทุนรวมดัชนี",
    market: "INDEX",
    price: 100,
    prevClose: 100,
    sharesOutstanding: 1,
    color: input.color,
    about: input.about,
    revenueHistory: [],
    fcfHistory: [],
    priceHistory: [],
    financials: {
      revenue: 0,
      netIncome: 0,
      eps: 0,
      bookValuePerShare: 0,
      freeCashFlow: 0,
      ebitda: 0,
      totalDebt: 0,
      cash: 0,
      dividendPerShare: 0,
      growthRate: 0,
      totalAssets: 0,
    },
    assetType: "INDEX",
    currency: "USD",
  };
}

function uniqueBySymbol(rows: Stock[]) {
  const bySymbol = new Map<string, Stock>();
  rows.forEach((row) => {
    const key = row.symbol.toUpperCase();
    if (!bySymbol.has(key)) bySymbol.set(key, row);
  });
  return Array.from(bySymbol.values());
}

type UniverseCounts = {
  thai: number;
  nyse: number;
  nasdaq: number;
  indices: number;
  funds: number;
  usFunds: number;
  crypto: number;
  futures: number;
};

type UniversePayload = {
  stocks: Stock[];
  counts: UniverseCounts;
  requestedLimit: number;
  updatedAt: string;
  source: string;
  cache: {
    status: "fresh" | "rebuilt" | "stale-fallback";
    freshForSeconds: number;
    staleForSeconds: number;
  };
};

function parseLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 160;
  return Math.min(Math.max(Math.round(parsed), 30), 260);
}

function isThaiListed(stock: Stock) {
  return stock.assetType === "TH_STOCK" && (stock.market === "SET" || stock.market === "mai");
}

function isUsListed(stock: Stock) {
  return stock.assetType === "US_STOCK" && (stock.market === "NASDAQ" || stock.market === "NYSE");
}

function isFundOrAlternative(stock: Stock) {
  return stock.assetType === "FUND" || stock.assetType === "US_FUND" || stock.assetType === "ETF" || stock.assetType === "CRYPTO" || stock.assetType === "FUTURES";
}

function buildUniverse(limit: number) {
  const thai = STOCKS.filter(isThaiListed);
  const fundsAndAlternatives = STOCKS.filter(isFundOrAlternative);
  const staticUs = STOCKS.filter(isUsListed);
  const nasdaqRows = (nasdaqIndex as Stock[]).filter(isUsListed);
  const usByPriority = uniqueBySymbol([
    ...US_CORE_SYMBOLS
      .map((symbol) => [...staticUs, ...nasdaqRows].find((stock) => stock.symbol.toUpperCase() === symbol))
      .filter((stock): stock is Stock => Boolean(stock)),
    ...staticUs,
    ...nasdaqRows,
  ]);

  const fixedUniverse = uniqueBySymbol([...INDEX_ROWS, ...thai, ...fundsAndAlternatives]);
  const usLimit = Math.max(0, limit - fixedUniverse.length);
  return uniqueBySymbol([...fixedUniverse, ...usByPriority.slice(0, usLimit)]);
}

async function enrichQuote(stock: Stock) {
  const quote = await getLatestQuote(stock.symbol, stock, { allowStale: true }).catch(() => null);
  return quote ? applyLatestQuote(stock, quote) : withStaticQuoteMeta(stock, stock.assetType === "INDEX" ? "index-reference" : "provider-fallback");
}

async function enrichInBatches(rows: Stock[], batchSize = 24) {
  const out: Stock[] = [];
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    out.push(...(await Promise.all(batch.map(enrichQuote))));
  }
  return out;
}

function buildCounts(stocks: Stock[]): UniverseCounts {
  return stocks.reduce(
    (acc, stock) => {
      if (stock.assetType === "INDEX") acc.indices += 1;
      else if (stock.market === "SET" || stock.market === "mai") acc.thai += 1;
      else if (stock.assetType === "US_STOCK" && stock.market === "NYSE") acc.nyse += 1;
      else if (stock.assetType === "US_STOCK" && stock.market === "NASDAQ") acc.nasdaq += 1;
      if (stock.assetType === "FUND") acc.funds += 1;
      else if (stock.assetType === "US_FUND" || stock.assetType === "ETF") acc.usFunds += 1;
      else if (stock.assetType === "CRYPTO") acc.crypto += 1;
      else if (stock.assetType === "FUTURES") acc.futures += 1;
      return acc;
    },
    { thai: 0, nyse: 0, nasdaq: 0, indices: 0, funds: 0, usFunds: 0, crypto: 0, futures: 0 }
  );
}

async function rebuildUniversePayload(limit: number): Promise<UniversePayload> {
  const stocks = await enrichInBatches(buildUniverse(limit));

  return sanitizePublicMarketPayload({
    stocks,
    counts: buildCounts(stocks),
    requestedLimit: limit,
    updatedAt: new Date().toISOString(),
    source: "provider-enriched-market-universe",
    cache: {
      status: "rebuilt",
      freshForSeconds: UNIVERSE_TTL_MS / 1000,
      staleForSeconds: UNIVERSE_STALE_MS / 1000,
    },
  });
}

export async function GET(request: NextRequest) {
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
  const cacheKey = `stocks-universe:${limit}`;
  const cached = await readCachedMarketUniverse<UniversePayload>(cacheKey, {
    cacheVersion: UNIVERSE_CACHE_VERSION,
  });

  if (cached) {
    return NextResponse.json(
      { ...cached, cache: { ...cached.cache, status: "fresh" as const } },
      { headers: { ...CACHE_HEADERS, "x-data-cache": "hit" } }
    );
  }

  const stale = await readCachedMarketUniverse<UniversePayload>(cacheKey, {
    allowStale: true,
    cacheVersion: UNIVERSE_CACHE_VERSION,
  });

  try {
    const payload = await rebuildUniversePayload(limit);
    await saveCachedMarketUniverse(cacheKey, payload, UNIVERSE_TTL_MS, UNIVERSE_STALE_MS, UNIVERSE_CACHE_VERSION);
    return NextResponse.json(payload, { headers: { ...CACHE_HEADERS, "x-data-cache": "miss" } });
  } catch (error) {
    if (stale) {
      return NextResponse.json(
        { ...stale, cache: { ...stale.cache, status: "stale-fallback" as const } },
        { headers: { ...CACHE_HEADERS, "x-data-cache": "stale" } }
      );
    }
    throw error;
  }
}

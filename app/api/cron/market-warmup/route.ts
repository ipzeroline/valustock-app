import { NextRequest, NextResponse } from "next/server";
import { STOCKS } from "@/lib/stocks";
import { getLatestQuote } from "@/lib/market-quotes";
import { Stock } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_SYMBOLS = [
  "PTT",
  "KBANK",
  "BBL",
  "SCB",
  "ADVANC",
  "CPALL",
  "AOT",
  "PTTEP",
  "SCC",
  "BDMS",
  "AAPL",
  "MSFT",
  "NVDA",
  "GOOGL",
  "META",
  "AMZN",
  "JPM",
  "V",
  "SPY",
  "QQQ",
];

function isAuthorized(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return process.env.NODE_ENV !== "production";
  const authorization = request.headers.get("authorization");
  const legacySecret = request.headers.get("x-cron-secret");
  const isVercelCron = request.headers.get("user-agent")?.includes("vercel-cron/1.0") || false;
  return authorization === `Bearer ${expected}` || legacySecret === expected || isVercelCron;
}

function parseSymbols(value: string | null) {
  if (!value) return DEFAULT_SYMBOLS;
  return Array.from(
    new Set(
      value
        .split(",")
        .map((symbol) => symbol.trim().toUpperCase())
        .filter((symbol) => /^[A-Z0-9.-]{1,20}$/.test(symbol))
    )
  ).slice(0, 100);
}

function hasMarketQuoteProvider(stock: Pick<Stock, "assetType" | "market" | "currency">) {
  if (stock.assetType === "CRYPTO" || stock.assetType === "FUTURES") return true;
  if (stock.assetType === "TH_STOCK") return true;
  if (stock.assetType === "US_STOCK" || stock.assetType === "US_FUND" || stock.assetType === "FUND") return true;
  if (stock.assetType === "ETF") return true;
  if (stock.market === "NASDAQ" || stock.market === "NYSE") return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const symbols = parseSymbols(request.nextUrl.searchParams.get("symbols"));
  const stockBySymbol = new Map(STOCKS.map((stock) => [stock.symbol.toUpperCase(), stock] as const));
  const eligible = symbols
    .map((symbol) => stockBySymbol.get(symbol))
    .filter((stock): stock is Stock => Boolean(stock && hasMarketQuoteProvider(stock)));

  const startedAt = Date.now();
  const results = await Promise.all(
    eligible.map(async (stock) => {
      const quote = await getLatestQuote(stock.symbol, stock, { allowStale: false });
      return {
        symbol: stock.symbol,
        ok: Boolean(quote),
        source: quote?.source || null,
        isDelayed: quote?.isDelayed ?? null,
      };
    })
  );

  return NextResponse.json({
    ok: true,
    requested: symbols.length,
    warmed: results.filter((result) => result.ok).length,
    results,
    latencyMs: Date.now() - startedAt,
    updatedAt: new Date().toISOString(),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { STOCKS } from "@/lib/stocks";
import { applyLatestQuote, getLatestQuote, withStaticQuoteMeta } from "@/lib/market-quotes";
import { sanitizePublicMarketPayload } from "@/lib/public-market-source";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const QUOTE_HEADERS = {
  "Cache-Control": "public, max-age=15, stale-while-revalidate=300",
};

function sanitizeSymbols(value: string | null) {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(",")
        .map((symbol) => symbol.trim().toUpperCase())
        .filter((symbol) => /^[A-Z0-9.-]{1,20}$/.test(symbol))
    )
  ).slice(0, 100);
}

export async function GET(request: NextRequest) {
  const symbols = sanitizeSymbols(request.nextUrl.searchParams.get("symbols"));

  if (symbols.length === 0) {
    return NextResponse.json({ error: "No symbols requested", quotes: [] }, { status: 400, headers: QUOTE_HEADERS });
  }

  const staticBySymbol = new Map(STOCKS.map((stock) => [stock.symbol.toUpperCase(), stock] as const));
  const quotes = await Promise.all(
    symbols.map(async (symbol) => {
      const stock = staticBySymbol.get(symbol);
      if (!stock) return null;

      const quote = await getLatestQuote(symbol, stock, { allowStale: true });
      return quote ? applyLatestQuote(stock, quote) : withStaticQuoteMeta(stock);
    })
  );

  return NextResponse.json(
    sanitizePublicMarketPayload({
      quotes: quotes.filter(Boolean),
      quoteDelayMinutes: 15,
      quoteIsDelayed: true,
      updatedAt: new Date().toISOString(),
    }),
    { headers: QUOTE_HEADERS }
  );
}

import { NextResponse } from "next/server";
import { STOCKS, getStock } from "@/lib/stocks";
import { computeValueSignal } from "@/lib/value-signal";
import { getLatestQuote } from "@/lib/market-quotes";
import type { Stock } from "@/lib/types";

export const dynamic = "force-dynamic";

function normalizeSymbol(raw: string | null): string {
  return typeof raw === "string" ? raw.trim().toUpperCase() : "";
}

function hasMarketData(stock: Pick<Stock, "assetType" | "market" | "currency">) {
  if (stock.assetType === "CRYPTO") return true;
  if (stock.assetType === "FUTURES") return true;
  if (stock.assetType === "TH_STOCK") return true;
  if (stock.assetType === "US_STOCK" || stock.assetType === "US_FUND" || stock.assetType === "FUND") return true;
  if (stock.assetType === "ETF") return true;
  if (stock.market === "NASDAQ" || stock.market === "NYSE") return true;
  return false;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = normalizeSymbol(searchParams.get("symbol"));

  if (!symbol) {
    return NextResponse.json({ error: "symbol query parameter is required" }, { status: 400 });
  }

  try {
    // First try seed data
    let stock: Stock | undefined = getStock(symbol);

    // If not found, try fetching external asset
    if (!stock) {
      try {
        const externalRes = await fetch(
          `${request.url.split("/api/")[0]}/api/stock/${encodeURIComponent(symbol)}?quote=1`
        );
        if (externalRes.ok) {
          const external = await externalRes.json();
          if (external?.symbol && !external.error) {
            stock = external as Stock;
          }
        }
      } catch {
        /* external lookup is best-effort */
      }
    }

    if (!stock) {
      return NextResponse.json(
        { error: `Symbol ${symbol} not found in database` },
        { status: 404 }
      );
    }

    // Get live price
    let livePrice = stock.price;
    if (hasMarketData(stock)) {
      const quote = await getLatestQuote(symbol, stock, { allowStale: true });
      if (quote?.price && quote.price > 0) {
        livePrice = quote.price;
      }
    }

    const signal = computeValueSignal(stock, livePrice);

    return NextResponse.json({
      symbol: stock.symbol,
      name: stock.name,
      enName: stock.enName,
      price: livePrice,
      ...signal,
    });
  } catch (err: any) {
    console.error("ValueSignal API error:", err.message);
    return NextResponse.json(
      { error: "Failed to compute value signal", detail: err.message },
      { status: 500 }
    );
  }
}

import { MongoClient } from "mongodb";
import { STOCKS } from "../lib/stocks";
import {
  fetchEodhdCommodityQuote,
  fetchEodhdQuote,
  fetchMassiveQuote,
  isThaiExchangeSecurity,
  QUOTE_CACHE_VERSION,
} from "../lib/market-quotes";
import { fetchSetQuote, isSetOnlineDataConfigured } from "../lib/set-online-data";
import { saveCachedQuote } from "../lib/market-data-store";
import { Stock } from "../lib/types";

function isMassiveStock(stock: Stock) {
  if (stock.assetType === "CRYPTO" || stock.assetType === "FUTURES" || stock.assetType === "US_FUND") return false;
  return (
    stock.assetType === "US_STOCK" ||
    (stock.assetType === "ETF" && stock.currency === "USD") ||
    stock.market === "NASDAQ" ||
    stock.market === "NYSE"
  );
}

function isEodhdRealtimeStock(stock: Stock) {
  if (stock.assetType === "FUTURES") return false;
  if (isMassiveStock(stock)) return false;
  return Boolean(
    stock.assetType === "TH_STOCK" ||
      stock.assetType === "FUND" ||
      stock.assetType === "US_FUND" ||
      stock.assetType === "CRYPTO" ||
      stock.assetType === "ETF"
  );
}

async function getMongoCache(symbols: string[]) {
  if (!process.env.MONGODB_URI) return new Map<string, any>();
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  try {
    const db = client.db(process.env.MONGODB_DB || "valustock");
    const rows = await db
      .collection("quote_cache")
      .find(
        { symbol: { $in: symbols } },
        { projection: { _id: 0, symbol: 1, price: 1, source: 1, cacheVersion: 1, expiresAt: 1 } }
      )
      .toArray();
    return new Map(rows.map((row) => [String(row.symbol), row]));
  } finally {
    await client.close();
  }
}

async function main() {
  const massiveApiKey = process.env.MASSIVE_API_KEY;
  const eodhdApiKey = process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN;
  const cacheBefore = await getMongoCache(STOCKS.map((stock) => stock.symbol));

  const refreshed: Array<{
    symbol: string;
    provider: "massive" | "eodhd" | "set";
    oldPrice: number | null;
    newPrice: number;
    changed: boolean;
    oldSource: string | null;
    newSource: string;
    oldVersion: string | null;
  }> = [];
  const failed: Array<{ symbol: string; provider: string; reason: string }> = [];
  const staticOnly: Array<{ symbol: string; reason: string }> = [];

  for (const stock of STOCKS) {
    let quote = null;
    let provider: "massive" | "eodhd" | "set" | null = null;

    if (isThaiExchangeSecurity(stock) && isSetOnlineDataConfigured()) {
      provider = "set";
      quote = await fetchSetQuote(stock.symbol, stock).catch(() => null);
      if (!quote && eodhdApiKey) {
        provider = "eodhd";
        quote = await fetchEodhdQuote(stock.symbol, eodhdApiKey, stock).catch(() => null);
      }
    } else if (isMassiveStock(stock)) {
      provider = "massive";
      quote = massiveApiKey ? await fetchMassiveQuote(stock.symbol, massiveApiKey).catch(() => null) : null;
      if (!quote && eodhdApiKey) {
        provider = "eodhd";
        quote = await fetchEodhdQuote(stock.symbol, eodhdApiKey, stock).catch(() => null);
      }
    } else if (isEodhdRealtimeStock(stock) && eodhdApiKey) {
      provider = "eodhd";
      quote = await fetchEodhdQuote(stock.symbol, eodhdApiKey, stock).catch(() => null);
    } else if (stock.assetType === "FUTURES" && eodhdApiKey) {
      provider = "eodhd";
      quote = await fetchEodhdCommodityQuote(stock.symbol, eodhdApiKey).catch(() => null);
      if (!quote) quote = await fetchEodhdQuote(stock.symbol, eodhdApiKey, stock).catch(() => null);
    }

    if (!provider) {
      staticOnly.push({ symbol: stock.symbol, reason: "no provider configured for asset class" });
      continue;
    }

    if (!quote) {
      failed.push({ symbol: stock.symbol, provider, reason: "provider returned no usable quote" });
      continue;
    }

    const previous = cacheBefore.get(stock.symbol);
    await saveCachedQuote(stock.symbol, quote, 45_000, 5 * 60_000, QUOTE_CACHE_VERSION);
    refreshed.push({
      symbol: stock.symbol,
      provider,
      oldPrice: typeof previous?.price === "number" ? previous.price : null,
      newPrice: quote.price,
      changed: typeof previous?.price === "number" ? Math.abs(previous.price - quote.price) > 0.0001 : true,
      oldSource: previous?.source || null,
      newSource: quote.source,
      oldVersion: previous?.cacheVersion || null,
    });
  }

  const changed = refreshed.filter((row) => row.changed);
  const summary = {
    totalSystemSymbols: STOCKS.length,
    refreshed: refreshed.length,
    refreshedSet: refreshed.filter((row) => row.provider === "set").length,
    refreshedMassive: refreshed.filter((row) => row.provider === "massive").length,
    refreshedEodhd: refreshed.filter((row) => row.provider === "eodhd").length,
    failed: failed.length,
    changed: changed.length,
    unchanged: refreshed.length - changed.length,
    staticOnly: staticOnly.length,
    cacheVersion: QUOTE_CACHE_VERSION,
  };

  console.log(JSON.stringify({ summary, changed, failed, staticOnly }, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error(JSON.stringify({ error: error?.message || String(error) }, null, 2));
  process.exit(1);
});

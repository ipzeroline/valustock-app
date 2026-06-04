import fs from "node:fs/promises";
import path from "node:path";
import { STOCKS } from "../lib/stocks";
import {
  fetchEodhdCommodityQuote,
  fetchEodhdQuote,
  fetchMassiveQuote,
  isThaiExchangeSecurity,
  isUsExchangeSecurity,
} from "../lib/market-quotes";
import { fetchSetQuote, isSetOnlineDataConfigured } from "../lib/set-online-data";
import type { LatestQuote } from "../lib/market-quotes";
import type { Stock } from "../lib/types";

function round(value: number) {
  return Math.round(value * 10000) / 10000;
}

async function fetchFreshQuote(stock: Stock): Promise<{ quote: LatestQuote; provider: string } | null> {
  const massiveApiKey = process.env.MASSIVE_API_KEY;
  const eodhdApiKey = process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN;

  if (isThaiExchangeSecurity(stock) && isSetOnlineDataConfigured()) {
    const quote = await fetchSetQuote(stock.symbol, stock).catch(() => null);
    if (quote) return { quote, provider: "set" };
  }

  if (isThaiExchangeSecurity(stock) && eodhdApiKey) {
    const quote = await fetchEodhdQuote(stock.symbol, eodhdApiKey, stock).catch(() => null);
    if (quote) return { quote, provider: "eodhd" };
  }

  if (stock.assetType === "FUTURES" && eodhdApiKey) {
    const quote =
      (await fetchEodhdCommodityQuote(stock.symbol, eodhdApiKey).catch(() => null)) ||
      (await fetchEodhdQuote(stock.symbol, eodhdApiKey, stock).catch(() => null));
    if (quote) return { quote, provider: "eodhd" };
  }

  if ((stock.assetType === "US_FUND" || stock.assetType === "FUND" || stock.assetType === "CRYPTO") && eodhdApiKey) {
    const quote = await fetchEodhdQuote(stock.symbol, eodhdApiKey, stock).catch(() => null);
    if (quote) return { quote, provider: "eodhd" };
  }

  if (isUsExchangeSecurity(stock, stock.symbol) && massiveApiKey) {
    const quote = await fetchMassiveQuote(stock.symbol, massiveApiKey).catch(() => null);
    if (quote) return { quote, provider: "massive" };
  }

  if (isUsExchangeSecurity(stock, stock.symbol) && eodhdApiKey) {
    const quote = await fetchEodhdQuote(stock.symbol, eodhdApiKey, stock).catch(() => null);
    if (quote) return { quote, provider: "eodhd" };
  }

  return null;
}

function replaceStockPrice(source: string, symbol: string, price: number, prevClose: number) {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockPattern = new RegExp(
    `(symbol:\\s*"${escaped}"[\\s\\S]*?price:\\s*)[-0-9.]+(\\s*,\\s*prevClose:\\s*)[-0-9.]+`,
    "m"
  );
  return source.replace(blockPattern, `$1${round(price)}$2${round(prevClose)}`);
}

async function main() {
  const filePath = path.join(process.cwd(), "lib/stocks.ts");
  let source = await fs.readFile(filePath, "utf8");
  const refreshed: Array<{ symbol: string; provider: string; oldPrice: number; newPrice: number; prevClose: number }> = [];
  const failed: string[] = [];

  for (const stock of STOCKS) {
    const fresh = await fetchFreshQuote(stock);
    if (!fresh) {
      failed.push(stock.symbol);
      continue;
    }

    const nextPrice = round(fresh.quote.price);
    const nextPrevClose = round(fresh.quote.prevClose || stock.prevClose || fresh.quote.price);
    if (Math.abs(stock.price - nextPrice) > 0.0001 || Math.abs(stock.prevClose - nextPrevClose) > 0.0001) {
      source = replaceStockPrice(source, stock.symbol, nextPrice, nextPrevClose);
      refreshed.push({
        symbol: stock.symbol,
        provider: fresh.provider,
        oldPrice: stock.price,
        newPrice: nextPrice,
        prevClose: nextPrevClose,
      });
    }
  }

  await fs.writeFile(filePath, source);
  console.log(JSON.stringify({ refreshed: refreshed.length, failed: failed.length, changed: refreshed, failedSymbols: failed }, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

"use client";

import { useEffect, useMemo, useState } from "react";
import { getStock } from "@/lib/stocks";
import { Stock } from "@/lib/types";

export const REALTIME_REFRESH_MS = 15000;

type LiveStock = Stock & {
  quoteSource?: string;
  quoteUpdatedAt?: string;
};

type StreamQuote = {
  symbol?: string;
  price?: number;
  quoteSource?: string;
  quoteUpdatedAt?: string;
};

export function hasQuoteProvider(stock: Pick<Stock, "assetType" | "market" | "currency">) {
  if (stock.assetType === "CRYPTO" || stock.assetType === "FUTURES") return false;
  if (stock.assetType === "TH_STOCK") return true;
  if (stock.assetType === "US_STOCK" || stock.assetType === "US_FUND") return true;
  if (stock.assetType === "ETF") return true;
  if (stock.market === "NASDAQ" || stock.market === "NYSE") return true;
  return false;
}

export function hasMassiveStream(stock: Pick<Stock, "assetType" | "market" | "currency"> | undefined, symbol: string) {
  if (!stock) return /^[A-Z]{1,5}(\.[A-Z])?$/.test(symbol);
  if (stock.assetType === "CRYPTO" || stock.assetType === "FUTURES") return false;
  return (
    stock.assetType === "US_STOCK" ||
    stock.assetType === "US_FUND" ||
    (stock.assetType === "ETF" && stock.currency === "USD") ||
    stock.market === "NASDAQ" ||
    stock.market === "NYSE"
  );
}

function uniqueSymbols(symbols: string[]) {
  return Array.from(new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)));
}

function mergeStocks(prev: LiveStock[], next: LiveStock[]) {
  const bySymbol = new Map(prev.map((stock) => [stock.symbol.toUpperCase(), stock] as const));
  next.forEach((stock) => bySymbol.set(stock.symbol.toUpperCase(), stock));
  return Array.from(bySymbol.values());
}

function applyStreamQuote(stock: LiveStock, quote: Required<Pick<StreamQuote, "symbol" | "price">> & StreamQuote): LiveStock {
  const nextPrice = Math.round(quote.price * 10000) / 10000;
  const priceHistory = stock.priceHistory?.length ? [...stock.priceHistory] : [];
  if (priceHistory.length > 0) priceHistory[priceHistory.length - 1] = nextPrice;

  const ohlcHistory = stock.ohlcHistory?.length ? [...stock.ohlcHistory] : undefined;
  if (ohlcHistory?.length) {
    const last = ohlcHistory[ohlcHistory.length - 1];
    ohlcHistory[ohlcHistory.length - 1] = {
      ...last,
      close: nextPrice,
      high: Math.max(last.high, nextPrice),
      low: Math.min(last.low, nextPrice),
    };
  }

  return {
    ...stock,
    price: nextPrice,
    priceHistory,
    ohlcHistory,
    quoteSource: quote.quoteSource || "massive-websocket",
    quoteUpdatedAt: quote.quoteUpdatedAt || new Date().toISOString(),
  };
}

export function useLiveQuotes(symbols: string[], enabled = true) {
  const normalizedSymbols = useMemo(() => uniqueSymbols(symbols), [symbols.join("|")]);
  const [liveStocks, setLiveStocks] = useState<LiveStock[]>([]);

  const liveStockMap = useMemo(() => {
    return new Map(liveStocks.map((stock) => [stock.symbol.toUpperCase(), stock] as const));
  }, [liveStocks]);

  useEffect(() => {
    if (!enabled || normalizedSymbols.length === 0) return;

    let cancelled = false;
    const refreshQuotes = () => {
      Promise.all(
        normalizedSymbols.map((sym) =>
          fetch(`/api/stock/${encodeURIComponent(sym)}${getStock(sym) ? "?quote=1" : ""}`, { cache: "no-store" })
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        )
      ).then((results) => {
        if (cancelled) return;
        const valid = results.filter((stock) => stock && !stock.error && stock.symbol) as LiveStock[];
        if (valid.length === 0) return;
        setLiveStocks((prev) => mergeStocks(prev, valid));
      });
    };

    refreshQuotes();
    const interval = window.setInterval(refreshQuotes, REALTIME_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled, normalizedSymbols]);

  useEffect(() => {
    if (!enabled || normalizedSymbols.length === 0 || typeof EventSource === "undefined") return;

    const streamSymbols = normalizedSymbols.filter((symbol) => hasMassiveStream(getStock(symbol), symbol));
    if (streamSymbols.length === 0) return;

    const source = new EventSource(`/api/quotes/stream?symbols=${encodeURIComponent(streamSymbols.join(","))}`);
    source.addEventListener("status", (event) => {
      try {
        const status = JSON.parse((event as MessageEvent).data) as { status?: string; message?: string };
        const text = `${status.status || ""} ${status.message || ""}`.toLowerCase();
        if (text.includes("not authorized") || text.includes("max_connections")) {
          source.close();
        }
      } catch {
        /* status events are informational only. */
      }
    });

    source.addEventListener("quote", (event) => {
      try {
        const quote = JSON.parse((event as MessageEvent).data) as StreamQuote;
        if (!quote.symbol || typeof quote.price !== "number" || !Number.isFinite(quote.price) || quote.price <= 0) return;

        setLiveStocks((prev) => {
          const key = quote.symbol!.toUpperCase();
          const existing = prev.find((stock) => stock.symbol.toUpperCase() === key);
          const base = existing || getStock(key);
          if (!base) return prev;
          return mergeStocks(prev, [applyStreamQuote(base, quote as Required<Pick<StreamQuote, "symbol" | "price">> & StreamQuote)]);
        });
      } catch {
        /* REST polling remains the fallback when stream payloads fail. */
      }
    });

    return () => source.close();
  }, [enabled, normalizedSymbols]);

  return {
    liveStocks,
    liveStockMap,
    setLiveStocks,
    isLoading: enabled && normalizedSymbols.some((symbol) => !liveStockMap.has(symbol.toUpperCase())),
  };
}

import { readCachedMarketUniverse } from "@/lib/market-data-store";
import type { Stock } from "@/lib/types";

export type ServerMarketUniversePayload = {
  stocks: Stock[];
  counts?: {
    thai: number;
    nyse: number;
    nasdaq: number;
    indices: number;
    funds?: number;
    usFunds?: number;
    crypto?: number;
    futures?: number;
  };
  requestedLimit?: number;
  updatedAt?: string;
  source?: string;
  cache?: {
    status: "fresh" | "rebuilt" | "stale-fallback";
    freshForSeconds: number;
    staleForSeconds: number;
  };
};

const UNIVERSE_CACHE_VERSION = "multi-asset-universe-v1";

export async function readInitialMarketUniverse(limit: number) {
  const cacheKey = `stocks-universe:${limit}`;
  const cached = await readCachedMarketUniverse<ServerMarketUniversePayload>(cacheKey, {
    allowStale: true,
    cacheVersion: UNIVERSE_CACHE_VERSION,
  });

  if (!cached?.stocks?.length) return null;
  return cached;
}

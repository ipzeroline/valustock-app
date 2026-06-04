import type { LatestQuote } from "@/lib/market-quotes";
import type { OhlcPoint, Stock } from "@/lib/types";
import { ensureMarketDataIndexes, getMongoDb, isMongoConfigured } from "@/lib/mongodb";

export type QuoteCacheDocument = LatestQuote & {
  symbol: string;
  cacheVersion?: string;
  providerUpdatedAt: Date;
  fetchedAt: Date;
  expiresAt: Date;
  staleUntil: Date;
};

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function fromDocument(doc: QuoteCacheDocument): LatestQuote {
  return {
    price: doc.price,
    prevClose: doc.prevClose,
    source: doc.source,
    updatedAt: doc.updatedAt,
    delayMinutes: doc.delayMinutes,
    isDelayed: doc.isDelayed,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

export async function readCachedQuote(symbol: string, options: { allowStale?: boolean; cacheVersion?: string } = {}) {
  if (!isMongoConfigured()) return null;

  try {
    await ensureMarketDataIndexes();
    const db = await getMongoDb();
    const now = new Date();
    const doc = await db.collection<QuoteCacheDocument>("quote_cache").findOne({
      symbol: symbol.toUpperCase(),
      ...(options.cacheVersion ? { cacheVersion: options.cacheVersion } : {}),
      [options.allowStale ? "staleUntil" : "expiresAt"]: { $gt: now },
    });
    return doc ? fromDocument(doc) : null;
  } catch {
    return null;
  }
}

export async function saveCachedQuote(
  symbol: string,
  quote: LatestQuote,
  ttlMs: number,
  staleMs: number,
  cacheVersion?: string
) {
  if (!isMongoConfigured()) return;

  try {
    await ensureMarketDataIndexes();
    const db = await getMongoDb();
    const fetchedAt = new Date();
    const document: QuoteCacheDocument = {
      ...quote,
      symbol: symbol.toUpperCase(),
      cacheVersion,
      providerUpdatedAt: toDate(quote.updatedAt),
      fetchedAt,
      expiresAt: new Date(fetchedAt.getTime() + ttlMs),
      staleUntil: new Date(fetchedAt.getTime() + staleMs),
    };

    await withTimeout(
      Promise.all([
        db.collection<QuoteCacheDocument>("quote_cache").updateOne(
          { symbol: document.symbol },
          { $set: document },
          { upsert: true }
        ),
        db.collection<QuoteCacheDocument>("quote_snapshots").insertOne(document),
      ]),
      4500,
      "saveCachedQuote"
    );
  } catch {
    /* MongoDB is a persistence layer, not a hard dependency for live quotes. */
  }
}

export async function logMarketApiEvent(event: {
  provider: string;
  symbol: string;
  ok: boolean;
  source?: string;
  status?: number;
  latencyMs?: number;
  error?: string;
}) {
  if (!isMongoConfigured()) return;

  try {
    await ensureMarketDataIndexes();
    const db = await getMongoDb();
    await withTimeout(
      db.collection("market_api_events").insertOne({
        ...event,
        symbol: event.symbol.toUpperCase(),
        createdAt: new Date(),
      }),
      2500,
      "logMarketApiEvent"
    );
  } catch {
    /* Diagnostics must never break the quote path. */
  }
}

export type HistoricalBarsDocument = {
  symbol: string;
  range: string;
  provider: string;
  source: string;
  bars: OhlcPoint[];
  fetchedAt: Date;
  expiresAt: Date;
};

export async function readCachedHistoricalBars(symbol: string, range: string, provider: string) {
  if (!isMongoConfigured()) return null;

  try {
    await ensureMarketDataIndexes();
    const db = await getMongoDb();
    const doc = await db.collection<HistoricalBarsDocument>("historical_bars").findOne({
      symbol: symbol.toUpperCase(),
      range,
      provider,
      expiresAt: { $gt: new Date() },
    });
    return doc?.bars?.length ? { bars: doc.bars, source: doc.source, fetchedAt: doc.fetchedAt.toISOString() } : null;
  } catch {
    return null;
  }
}

export async function saveCachedHistoricalBars(
  symbol: string,
  range: string,
  provider: string,
  source: string,
  bars: OhlcPoint[],
  ttlMs: number
) {
  if (!isMongoConfigured() || bars.length === 0) return;

  try {
    await ensureMarketDataIndexes();
    const db = await getMongoDb();
    const fetchedAt = new Date();
    await withTimeout(
      db.collection<HistoricalBarsDocument>("historical_bars").updateOne(
        { symbol: symbol.toUpperCase(), range, provider },
        {
          $set: {
            symbol: symbol.toUpperCase(),
            range,
            provider,
            source,
            bars,
            fetchedAt,
            expiresAt: new Date(fetchedAt.getTime() + ttlMs),
          },
        },
        { upsert: true }
      ),
      4500,
      "saveCachedHistoricalBars"
    );
  } catch {
    /* Historical cache should never break the quote path. */
  }
}

export type ExternalAssetDocument = {
  symbol: string;
  stock: Stock;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
};

export async function readExternalAsset(symbol: string) {
  if (!isMongoConfigured()) return null;

  try {
    await ensureMarketDataIndexes();
    const db = await getMongoDb();
    const doc = await db.collection<ExternalAssetDocument>("external_assets").findOne({
      symbol: symbol.toUpperCase(),
      expiresAt: { $gt: new Date() },
    });
    return doc?.stock || null;
  } catch {
    return null;
  }
}

export async function saveExternalAsset(symbol: string, stock: Stock, source: string, ttlMs = 24 * 60 * 60_000) {
  if (!isMongoConfigured()) return;

  try {
    await ensureMarketDataIndexes();
    const db = await getMongoDb();
    const now = new Date();
    await withTimeout(
      db.collection<ExternalAssetDocument>("external_assets").updateOne(
        { symbol: symbol.toUpperCase() },
        {
          $set: {
            symbol: symbol.toUpperCase(),
            stock,
            source,
            updatedAt: now,
            expiresAt: new Date(now.getTime() + ttlMs),
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true }
      ),
      4500,
      "saveExternalAsset"
    );
  } catch {
    /* External asset cache should not block the lookup response. */
  }
}

export type MarketMover = {
  symbol: string;
  price: number;
  prevPrice: number;
  change: number;
  changePct: number;
  source: string;
  isDelayed: boolean;
  delayMinutes: number;
  fetchedAt: string;
};

export async function getMarketMovers(limit = 8) {
  if (!isMongoConfigured()) {
    return { gainers: [], losers: [], volatile: [], updatedAt: null };
  }

  try {
    await ensureMarketDataIndexes();
    const db = await getMongoDb();
    const rows = await db.collection("quote_snapshots").aggregate<{
      symbol: string;
      points: Array<{
        price: number;
        source: string;
        isDelayed: boolean;
        delayMinutes: number;
        fetchedAt: Date;
      }>;
    }>([
      { $sort: { symbol: 1, fetchedAt: -1 } },
      {
        $group: {
          _id: "$symbol",
          points: {
            $push: {
              price: "$price",
              source: "$source",
              isDelayed: "$isDelayed",
              delayMinutes: "$delayMinutes",
              fetchedAt: "$fetchedAt",
            },
          },
        },
      },
      { $project: { _id: 0, symbol: "$_id", points: { $slice: ["$points", 2] } } },
      { $match: { "points.0.price": { $gt: 0 } } },
    ]).toArray();

    const movers: MarketMover[] = rows.map((row) => {
      const latest = row.points[0];
      const previous = row.points[1] || latest;
      const change = latest.price - previous.price;
      const changePct = previous.price > 0 ? (change / previous.price) * 100 : 0;
      return {
        symbol: row.symbol,
        price: latest.price,
        prevPrice: previous.price,
        change,
        changePct,
        source: latest.source,
        isDelayed: latest.isDelayed,
        delayMinutes: latest.delayMinutes,
        fetchedAt: latest.fetchedAt.toISOString(),
      };
    });

    const byGain = [...movers].sort((a, b) => b.changePct - a.changePct).slice(0, limit);
    const byLoss = [...movers].sort((a, b) => a.changePct - b.changePct).slice(0, limit);
    const byVolatility = [...movers].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, limit);

    return {
      gainers: byGain,
      losers: byLoss,
      volatile: byVolatility,
      updatedAt: movers[0]?.fetchedAt || null,
    };
  } catch {
    return { gainers: [], losers: [], volatile: [], updatedAt: null };
  }
}

export async function getProviderHealth(hours = 24) {
  if (!isMongoConfigured()) {
    return { providers: [], windowHours: hours, updatedAt: null };
  }

  try {
    await ensureMarketDataIndexes();
    const db = await getMongoDb();
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const providers = await db.collection("market_api_events").aggregate<{
      provider: string;
      total: number;
      failures: number;
      avgLatencyMs: number;
      latestAt: Date;
    }>([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: "$provider",
          total: { $sum: 1 },
          failures: { $sum: { $cond: ["$ok", 0, 1] } },
          avgLatencyMs: { $avg: "$latencyMs" },
          latestAt: { $max: "$createdAt" },
        },
      },
      { $project: { _id: 0, provider: "$_id", total: 1, failures: 1, avgLatencyMs: 1, latestAt: 1 } },
      { $sort: { total: -1 } },
    ]).toArray();

    return {
      providers: providers.map((provider) => ({
        ...provider,
        successRate: provider.total > 0 ? ((provider.total - provider.failures) / provider.total) * 100 : 0,
        avgLatencyMs: Math.round(provider.avgLatencyMs || 0),
        latestAt: provider.latestAt?.toISOString() || null,
      })),
      windowHours: hours,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return { providers: [], windowHours: hours, updatedAt: null };
  }
}

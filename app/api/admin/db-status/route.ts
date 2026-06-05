import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDbConnectionStatus, initDatabase } from "@/lib/db";
import { ensureMarketDataIndexes, getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { isSetOnlineDataConfigured } from "@/lib/set-online-data";

function iso(value: unknown) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function getDataCacheStatus() {
  if (!isMongoConfigured()) {
    return {
      connected: false,
      configured: false,
      error: "Data cache URI is not configured",
    };
  }

  try {
    await ensureMarketDataIndexes();
    const db = await getMongoDb();
    const [
      quoteCacheCount,
      quoteSnapshotsCount,
      apiEventsCount,
      historicalBarsCount,
      externalAssetsCount,
      setSecuritiesCount,
      marketIntelligenceCount,
      latestQuoteCache,
      latestQuoteSnapshot,
      latestHistoricalBars,
      latestExternalAsset,
      latestMarketIntelligence,
      latestApiEvent,
      latestSetSecurity,
      latestSetSyncEvent,
    ] = await Promise.all([
      db.collection("quote_cache").estimatedDocumentCount(),
      db.collection("quote_snapshots").estimatedDocumentCount(),
      db.collection("market_api_events").estimatedDocumentCount(),
      db.collection("historical_bars").estimatedDocumentCount(),
      db.collection("external_assets").estimatedDocumentCount(),
      db.collection("set_securities").estimatedDocumentCount(),
      db.collection("market_intelligence_cache").estimatedDocumentCount(),
      db.collection("quote_cache").find({}, { projection: { symbol: 1, source: 1, fetchedAt: 1, expiresAt: 1, staleUntil: 1 } }).sort({ fetchedAt: -1 }).limit(1).next(),
      db.collection("quote_snapshots").find({}, { projection: { symbol: 1, source: 1, fetchedAt: 1 } }).sort({ fetchedAt: -1 }).limit(1).next(),
      db.collection("historical_bars").find({}, { projection: { symbol: 1, range: 1, provider: 1, fetchedAt: 1, expiresAt: 1 } }).sort({ fetchedAt: -1 }).limit(1).next(),
      db.collection("external_assets").find({}, { projection: { symbol: 1, source: 1, updatedAt: 1, expiresAt: 1 } }).sort({ updatedAt: -1 }).limit(1).next(),
      db.collection("market_intelligence_cache").find({}, { projection: { symbol: 1, fetchedAt: 1, expiresAt: 1 } }).sort({ fetchedAt: -1 }).limit(1).next(),
      db.collection("market_api_events").find({}, { projection: { provider: 1, symbol: 1, ok: 1, source: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(1).next(),
      db.collection("set_securities").find({}, { projection: { symbol: 1, market: 1, updatedAt: 1 } }).sort({ updatedAt: -1 }).limit(1).next(),
      db.collection("set_sync_events").find({}, { projection: { type: 1, ok: 1, count: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(1).next(),
    ]);

    return {
      connected: true,
      configured: true,
      collections: {
        quoteCache: quoteCacheCount,
        quoteSnapshots: quoteSnapshotsCount,
        marketApiEvents: apiEventsCount,
        historicalBars: historicalBarsCount,
        externalAssets: externalAssetsCount,
        setSecurities: setSecuritiesCount,
        marketIntelligence: marketIntelligenceCount,
      },
      latest: {
        quoteCache: latestQuoteCache
          ? {
              symbol: latestQuoteCache.symbol,
              source: latestQuoteCache.source,
              fetchedAt: iso(latestQuoteCache.fetchedAt),
              expiresAt: iso(latestQuoteCache.expiresAt),
              staleUntil: iso(latestQuoteCache.staleUntil),
            }
          : null,
        quoteSnapshot: latestQuoteSnapshot
          ? {
              symbol: latestQuoteSnapshot.symbol,
              source: latestQuoteSnapshot.source,
              fetchedAt: iso(latestQuoteSnapshot.fetchedAt),
            }
          : null,
        historicalBars: latestHistoricalBars
          ? {
              symbol: latestHistoricalBars.symbol,
              range: latestHistoricalBars.range,
              provider: latestHistoricalBars.provider,
              fetchedAt: iso(latestHistoricalBars.fetchedAt),
              expiresAt: iso(latestHistoricalBars.expiresAt),
            }
          : null,
        externalAsset: latestExternalAsset
          ? {
              symbol: latestExternalAsset.symbol,
              source: latestExternalAsset.source,
              updatedAt: iso(latestExternalAsset.updatedAt),
              expiresAt: iso(latestExternalAsset.expiresAt),
            }
          : null,
        marketIntelligence: latestMarketIntelligence
          ? {
              symbol: latestMarketIntelligence.symbol,
              fetchedAt: iso(latestMarketIntelligence.fetchedAt),
              expiresAt: iso(latestMarketIntelligence.expiresAt),
            }
          : null,
        marketApiEvent: latestApiEvent
          ? {
              provider: latestApiEvent.provider,
              symbol: latestApiEvent.symbol,
              ok: latestApiEvent.ok,
              source: latestApiEvent.source,
              createdAt: iso(latestApiEvent.createdAt),
            }
          : null,
        setSecurity: latestSetSecurity
          ? {
              symbol: latestSetSecurity.symbol,
              market: latestSetSecurity.market,
              updatedAt: iso(latestSetSecurity.updatedAt),
            }
          : null,
        setSyncEvent: latestSetSyncEvent
          ? {
              type: latestSetSyncEvent.type,
              ok: latestSetSyncEvent.ok,
              count: latestSetSyncEvent.count,
              createdAt: iso(latestSetSyncEvent.createdAt),
            }
          : null,
      },
      cachePolicy: {
        quoteCache: {
          refresh: "On first quote request after 45 seconds, then saved to MongoDB",
          freshForSeconds: 45,
          staleForSeconds: 300,
          deleteAfter: "staleUntil via MongoDB TTL index",
        },
        quoteSnapshots: {
          refresh: "Inserted whenever a fresh quote is saved",
          deleteAfterDays: 90,
        },
        historicalBars: {
          refresh: "On first chart/history request after 6 hours",
          freshForSeconds: 21600,
          deleteAfter: "expiresAt via MongoDB TTL index",
        },
        externalAssets: {
          refresh: "When an external symbol lookup is resolved or refreshed",
          freshForSeconds: 86400,
          deleteAfter: "expiresAt via MongoDB TTL index",
        },
        marketIntelligence: {
          refresh: "On first intelligence request after 30 minutes",
          freshForSeconds: 1800,
          deleteAfter: "expiresAt via MongoDB TTL index",
        },
        marketApiEvents: {
          refresh: "Logged on provider API calls",
          deleteAfterDays: 30,
        },
        setSecurities: {
          refresh: "When /api/cron/set-online-data-sync runs",
          deleteAfter: "No automatic TTL; latest reference universe is updated in place",
        },
      },
    };
  } catch (error: any) {
    return {
      connected: false,
      configured: true,
      error: "Unable to connect to data cache",
      code: error?.code,
    };
  }
}

export async function GET(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const status = await getDbConnectionStatus();
  
  if (status.connected) {
    // Dynamically trigger schema initializer if tables are missing
    await initDatabase();
  }

  return NextResponse.json({
    connected: status.connected,
    error: status.error,
    code: status.code,
    database: {
      connected: status.connected,
      error: status.error,
      code: status.code,
      configured: Boolean(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER),
    },
    dataCache: await getDataCacheStatus(),
    marketData: {
      configured: isSetOnlineDataConfigured(),
      hasCredentials: Boolean(process.env.SET_API_KEY || process.env.SET_ONLINE_DATA_API_KEY),
      hasEndpoint: Boolean(process.env.SET_API_BASE_URL),
      hasQuoteFeed: Boolean(process.env.SET_QUOTE_PATH || process.env.SET_MARKET_DATA_PATH),
      hasHistoricalFeed: Boolean(process.env.SET_EOD_PATH || process.env.SET_HISTORICAL_PATH),
      hasReferenceFeed: Boolean(process.env.SET_SECURITIES_PATH || process.env.SET_REFERENCE_SECURITIES_PATH),
      realtime: process.env.SET_API_REALTIME === "1",
    },
  });
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDbConnectionStatus, initDatabase } from "@/lib/db";
import { ensureMarketDataIndexes, getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { isSetOnlineDataConfigured } from "@/lib/set-online-data";

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
    const [quoteCacheCount, quoteSnapshotsCount, apiEventsCount, historicalBarsCount, externalAssetsCount, setSecuritiesCount] = await Promise.all([
      db.collection("quote_cache").estimatedDocumentCount(),
      db.collection("quote_snapshots").estimatedDocumentCount(),
      db.collection("market_api_events").estimatedDocumentCount(),
      db.collection("historical_bars").estimatedDocumentCount(),
      db.collection("external_assets").estimatedDocumentCount(),
      db.collection("set_securities").estimatedDocumentCount(),
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

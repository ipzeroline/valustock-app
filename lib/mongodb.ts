import { Db, MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var __valustockMongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "valustock";

export function isMongoConfigured() {
  return Boolean(uri);
}

export async function getMongoClient() {
  if (!uri) throw new Error("MONGODB_URI is not configured");

  if (!global.__valustockMongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500,
      socketTimeoutMS: 5000,
      retryReads: true,
      retryWrites: true,
    });
    global.__valustockMongoClientPromise = client.connect();
  }

  return global.__valustockMongoClientPromise;
}

export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}

let indexesPromise: Promise<void> | null = null;

export async function ensureMarketDataIndexes() {
  if (!isMongoConfigured()) return;
  if (!indexesPromise) {
    indexesPromise = getMongoDb()
      .then(async (db) => {
        await Promise.all([
          db.collection("quote_cache").createIndex({ symbol: 1 }, { unique: true }),
          db.collection("quote_cache").createIndex({ expiresAt: 1 }),
          db.collection("quote_snapshots").createIndex({ symbol: 1, fetchedAt: -1 }),
          db.collection("quote_snapshots").createIndex({ fetchedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }),
          db.collection("historical_bars").createIndex({ symbol: 1, range: 1, provider: 1 }, { unique: true }),
          db.collection("historical_bars").createIndex({ expiresAt: 1 }),
          db.collection("external_assets").createIndex({ symbol: 1 }, { unique: true }),
          db.collection("external_assets").createIndex({ updatedAt: -1 }),
          db.collection("external_assets").createIndex({ expiresAt: 1 }),
          db.collection("market_intelligence_cache").createIndex({ symbol: 1 }, { unique: true }),
          db.collection("market_intelligence_cache").createIndex({ expiresAt: 1 }),
          db.collection("set_securities").createIndex({ symbol: 1 }, { unique: true }),
          db.collection("set_securities").createIndex({ market: 1, securityType: 1 }),
          db.collection("set_sync_events").createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }),
          db.collection("market_api_events").createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }),
          db.collection("market_api_events").createIndex({ provider: 1, symbol: 1, createdAt: -1 }),
          db.collection("economic_events").createIndex({ eventId: 1, date: 1 }, { unique: true }),
          db.collection("economic_events").createIndex({ fetchedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 }),
          db.collection("economic_events").createIndex({ country: 1, currency: 1 }),
          db.collection("economic_events").createIndex({ date: -1 }),
          db.collection("holiday_events").createIndex({ eventId: 1, date: 1 }, { unique: true }),
          db.collection("holiday_events").createIndex({ fetchedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 }),
          db.collection("holiday_events").createIndex({ date: -1 }),
          db.collection("earnings_events").createIndex({ eventId: 1, date: 1 }, { unique: true }),
          db.collection("earnings_events").createIndex({ fetchedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 }),
          db.collection("earnings_events").createIndex({ date: -1 }),
          db.collection("dividend_events").createIndex({ eventId: 1, date: 1 }, { unique: true }),
          db.collection("dividend_events").createIndex({ fetchedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 }),
          db.collection("dividend_events").createIndex({ date: -1 }),
          db.collection("stock_split_events").createIndex({ eventId: 1, date: 1 }, { unique: true }),
          db.collection("stock_split_events").createIndex({ fetchedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 }),
          db.collection("stock_split_events").createIndex({ date: -1 }),
          db.collection("ipo_events").createIndex({ eventId: 1, date: 1 }, { unique: true }),
          db.collection("ipo_events").createIndex({ fetchedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 }),
          db.collection("ipo_events").createIndex({ date: -1 }),
        ]);
      })
      .catch((error) => {
        indexesPromise = null;
        throw error;
      });
  }
  return indexesPromise;
}

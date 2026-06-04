import { NextRequest, NextResponse } from "next/server";
import { ensureMarketDataIndexes, getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { fetchSetSecurityUniverse, isSetOnlineDataConfigured } from "@/lib/set-online-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret") || request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) return unauthorized();

  if (!isMongoConfigured()) {
    return NextResponse.json({ ok: false, error: "MONGODB_URI is not configured" }, { status: 500 });
  }

  if (!isSetOnlineDataConfigured()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      error: "Licensed market data sync is not configured.",
    });
  }

  await ensureMarketDataIndexes();
  const db = await getMongoDb();
  const rows = await fetchSetSecurityUniverse();
  const now = new Date();

  if (rows.length > 0) {
    await db.collection("set_securities").bulkWrite(
      rows.map((row) => ({
        updateOne: {
          filter: { symbol: row.symbol },
          update: {
            $set: {
              ...row,
              updatedAt: now,
            },
            $setOnInsert: {
              createdAt: now,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  }

  await db.collection("set_sync_events").insertOne({
    provider: "set",
    type: "security-universe",
    ok: rows.length > 0,
    count: rows.length,
    createdAt: now,
  });

  return NextResponse.json({
    ok: rows.length > 0,
    configured: true,
    count: rows.length,
    updatedAt: now.toISOString(),
  });
}

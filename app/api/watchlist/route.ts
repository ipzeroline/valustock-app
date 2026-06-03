import { NextResponse } from "next/server";
import { getDbConnectionStatus, query } from "@/lib/db";
import { getPlanForEmail } from "@/lib/entitlements";
import { requireSameMemberEmail } from "@/lib/request-auth";

function normalizeEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizeSymbol(symbol: unknown) {
  return typeof symbol === "string" ? symbol.trim().toUpperCase() : "";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = normalizeEmail(searchParams.get("email"));

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  const access = await requireSameMemberEmail(req, email);
  if (access.error) return access.error;

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected", detail: status.error, code: status.code, watchlist: [], mockMode: false },
      { status: 503 }
    );
  }

  try {
    const rows = await query<{ symbol: string }[]>(
      "SELECT symbol FROM watchlists WHERE user_email = ? ORDER BY created_at ASC",
      [email]
    );
    return NextResponse.json({
      watchlist: rows.map((row) => row.symbol),
      mockMode: false,
    });
  } catch (err: any) {
    console.error("Database watchlist fetch error:", err.message);
    return NextResponse.json(
      { error: "Could not load watchlist from database", detail: err.message, watchlist: [], mockMode: false },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { email: rawEmail, symbol: rawSymbol } = await req.json();
  const email = normalizeEmail(rawEmail);
  const symbol = normalizeSymbol(rawSymbol);

  if (!email || !symbol) {
    return NextResponse.json({ error: "Email and symbol are required" }, { status: 400 });
  }
  const access = await requireSameMemberEmail(req, email);
  if (access.error) return access.error;

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Watchlist was not saved.", detail: status.error, code: status.code, mockMode: false },
      { status: 503 }
    );
  }

  try {
    const plan = await getPlanForEmail(email);
    const limit = plan.limits.watchlist;
    if (limit !== "unlimited") {
      const existing = await query<{ symbol: string }[]>(
        "SELECT symbol FROM watchlists WHERE user_email = ?",
        [email]
      );
      const alreadySaved = existing.some((row) => row.symbol.toUpperCase() === symbol);
      if (!alreadySaved && existing.length >= limit) {
        return NextResponse.json(
          {
            error: `Watchlist limit reached for ${plan.id} plan`,
            limit,
            requiredPlan: "pro",
            mockMode: false,
          },
          { status: 403 }
        );
      }
    }
    await query(
      "INSERT IGNORE INTO watchlists (user_email, symbol) VALUES (?, ?)",
      [email, symbol]
    );
    return NextResponse.json({ success: true, mockMode: false });
  } catch (err: any) {
    console.error("Database watchlist insert error:", err.message);
    return NextResponse.json(
      { error: "Could not save watchlist to database", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const { email: rawEmail, symbol: rawSymbol } = await req.json();
  const email = normalizeEmail(rawEmail);
  const symbol = normalizeSymbol(rawSymbol);

  if (!email || !symbol) {
    return NextResponse.json({ error: "Email and symbol are required" }, { status: 400 });
  }
  const access = await requireSameMemberEmail(req, email);
  if (access.error) return access.error;

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Watchlist was not deleted.", detail: status.error, code: status.code, mockMode: false },
      { status: 503 }
    );
  }

  try {
    await query("DELETE FROM watchlists WHERE user_email = ? AND symbol = ?", [email, symbol]);
    return NextResponse.json({ success: true, mockMode: false });
  } catch (err: any) {
    console.error("Database watchlist delete error:", err.message);
    return NextResponse.json(
      { error: "Could not delete watchlist from database", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { isDbConnected, query } from "@/lib/db";

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

  if (!(await isDbConnected())) {
    return NextResponse.json(
      { error: "Database is not connected", watchlist: [], mockMode: true },
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
      { error: "Could not load watchlist from database", watchlist: [], mockMode: true },
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

  if (!(await isDbConnected())) {
    return NextResponse.json(
      { error: "Database is not connected. Watchlist was not saved.", mockMode: true },
      { status: 503 }
    );
  }

  try {
    await query(
      "INSERT IGNORE INTO watchlists (user_email, symbol) VALUES (?, ?)",
      [email, symbol]
    );
    return NextResponse.json({ success: true, mockMode: false });
  } catch (err: any) {
    console.error("Database watchlist insert error:", err.message);
    return NextResponse.json(
      { error: "Could not save watchlist to database", mockMode: true },
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

  if (!(await isDbConnected())) {
    return NextResponse.json(
      { error: "Database is not connected. Watchlist was not deleted.", mockMode: true },
      { status: 503 }
    );
  }

  try {
    await query("DELETE FROM watchlists WHERE user_email = ? AND symbol = ?", [email, symbol]);
    return NextResponse.json({ success: true, mockMode: false });
  } catch (err: any) {
    console.error("Database watchlist delete error:", err.message);
    return NextResponse.json(
      { error: "Could not delete watchlist from database", mockMode: true },
      { status: 500 }
    );
  }
}

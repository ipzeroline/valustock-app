import { NextResponse } from "next/server";
import { getDbConnectionStatus, query } from "@/lib/db";

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

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Portfolio transactions were not loaded.", detail: status.error, code: status.code },
      { status: 503 }
    );
  }

  try {
    const rows = await query<any[]>(
      `SELECT id, symbol, action, price, shares, DATE_FORMAT(trade_date, '%Y-%m-%d') AS date
       FROM portfolio_transactions
       WHERE user_email = ?
       ORDER BY trade_date DESC, created_at DESC`,
      [email]
    );
    return NextResponse.json({ transactions: rows });
  } catch (err: any) {
    console.error("Database portfolio transactions fetch error:", err.message);
    return NextResponse.json(
      { error: "Could not load portfolio transactions from database", detail: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const email = normalizeEmail(body.email);
  const symbol = normalizeSymbol(body.symbol);
  const action = body.action === "SELL" ? "SELL" : "BUY";
  const price = Number(body.price);
  const shares = Number(body.shares);
  const date = typeof body.date === "string" ? body.date : "";
  const id = typeof body.id === "string" && body.id ? body.id : `tx-${Date.now()}`;

  if (!email || !symbol || !price || !shares || !date) {
    return NextResponse.json({ error: "Email, symbol, price, shares and date are required" }, { status: 400 });
  }

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Portfolio transaction was not saved.", detail: status.error, code: status.code },
      { status: 503 }
    );
  }

  try {
    await query(
      `INSERT INTO portfolio_transactions (id, user_email, symbol, action, price, shares, trade_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE symbol = VALUES(symbol), action = VALUES(action), price = VALUES(price), shares = VALUES(shares), trade_date = VALUES(trade_date)`,
      [id, email, symbol, action, price, shares, date]
    );
    return NextResponse.json({ success: true, transaction: { id, symbol, action, price, shares, date } });
  } catch (err: any) {
    console.error("Database portfolio transaction write error:", err.message);
    return NextResponse.json(
      { error: "Could not save portfolio transaction to database", detail: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const { email: rawEmail, id } = await req.json();
  const email = normalizeEmail(rawEmail);

  if (!email || !id) {
    return NextResponse.json({ error: "Email and transaction ID are required" }, { status: 400 });
  }

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Portfolio transaction was not deleted.", detail: status.error, code: status.code },
      { status: 503 }
    );
  }

  try {
    await query("DELETE FROM portfolio_transactions WHERE user_email = ? AND id = ?", [email, id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Database portfolio transaction delete error:", err.message);
    return NextResponse.json(
      { error: "Could not delete portfolio transaction from database", detail: err.message },
      { status: 500 }
    );
  }
}

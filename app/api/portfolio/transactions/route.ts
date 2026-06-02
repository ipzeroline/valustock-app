import { NextResponse } from "next/server";
import { ensureColumn, getDbConnectionStatus, query } from "@/lib/db";
import { getPlanForEmail } from "@/lib/entitlements";

function normalizeEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizeSymbol(symbol: unknown) {
  return typeof symbol === "string" ? symbol.trim().toUpperCase() : "";
}

function normalizeCurrency(currency: unknown, symbol: string) {
  if (typeof currency === "string" && /^[A-Z]{3,5}$/.test(currency.trim().toUpperCase())) {
    return currency.trim().toUpperCase();
  }
  return symbol.includes(".") ? "THB" : "THB";
}

async function ensurePortfolioTransactionColumns() {
  await ensureColumn("portfolio_transactions", "fee", "DECIMAL(18,6) NOT NULL DEFAULT 0");
  await ensureColumn("portfolio_transactions", "currency", "VARCHAR(10) DEFAULT 'THB'");
  await ensureColumn("portfolio_transactions", "notes", "TEXT");
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
    const plan = await getPlanForEmail(email);
    if (!plan.limits.portfolio) {
      return NextResponse.json({ error: "Portfolio Tracker requires Pro plan or higher", requiredPlan: "pro" }, { status: 403 });
    }
    await ensurePortfolioTransactionColumns();
    const rows = await query<any[]>(
      `SELECT id, symbol, action, price, shares, fee, currency, notes, DATE_FORMAT(trade_date, '%Y-%m-%d') AS date
       FROM portfolio_transactions
       WHERE user_email = ?
       ORDER BY trade_date DESC, created_at DESC`,
      [email]
    );
    return NextResponse.json({
      transactions: rows.map((row) => ({
        ...row,
        price: Number(row.price),
        shares: Number(row.shares),
        fee: Number(row.fee || 0),
        currency: row.currency || "THB",
        notes: row.notes || "",
      })),
    });
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
  const fee = Number(body.fee || 0);
  const currency = normalizeCurrency(body.currency, symbol);
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "";
  const date = typeof body.date === "string" ? body.date : "";
  const id = typeof body.id === "string" && body.id ? body.id : `tx-${Date.now()}`;

  if (!email || !symbol || !price || !shares || fee < 0 || !date) {
    return NextResponse.json({ error: "Email, symbol, price, shares, fee and date are required" }, { status: 400 });
  }

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Portfolio transaction was not saved.", detail: status.error, code: status.code },
      { status: 503 }
    );
  }

  try {
    const plan = await getPlanForEmail(email);
    if (!plan.limits.portfolio) {
      return NextResponse.json({ error: "Portfolio Tracker requires Pro plan or higher", requiredPlan: "pro" }, { status: 403 });
    }
    await ensurePortfolioTransactionColumns();
    await query(
      `INSERT INTO portfolio_transactions (id, user_email, symbol, action, price, shares, trade_date, fee, currency, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE symbol = VALUES(symbol), action = VALUES(action), price = VALUES(price), shares = VALUES(shares), trade_date = VALUES(trade_date), fee = VALUES(fee), currency = VALUES(currency), notes = VALUES(notes)`,
      [id, email, symbol, action, price, shares, date, fee, currency, notes]
    );
    return NextResponse.json({ success: true, transaction: { id, symbol, action, price, shares, fee, currency, notes, date } });
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
    const plan = await getPlanForEmail(email);
    if (!plan.limits.portfolio) {
      return NextResponse.json({ error: "Portfolio Tracker requires Pro plan or higher", requiredPlan: "pro" }, { status: 403 });
    }
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

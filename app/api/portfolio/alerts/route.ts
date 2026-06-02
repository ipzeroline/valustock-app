import { NextResponse } from "next/server";
import { getDbConnectionStatus, query } from "@/lib/db";
import { getPlanForEmail } from "@/lib/entitlements";

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
      { error: "Database is not connected. Portfolio alerts were not loaded.", detail: status.error, code: status.code },
      { status: 503 }
    );
  }

  try {
    const plan = await getPlanForEmail(email);
    if (!plan.limits.alerts) {
      return NextResponse.json({ error: "Portfolio alerts require Premium plan or higher", requiredPlan: "premium" }, { status: 403 });
    }
    const rows = await query<any[]>(
      "SELECT id, symbol, type, value, active FROM portfolio_alerts WHERE user_email = ? ORDER BY created_at DESC",
      [email]
    );
    return NextResponse.json({ alerts: rows.map((row) => ({ ...row, value: Number(row.value), active: !!row.active })) });
  } catch (err: any) {
    console.error("Database portfolio alerts fetch error:", err.message);
    return NextResponse.json(
      { error: "Could not load portfolio alerts from database", detail: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const email = normalizeEmail(body.email);
  const symbol = normalizeSymbol(body.symbol);
  const type = typeof body.type === "string" ? body.type : "price_below";
  const value = Number(body.value);
  const active = body.active === false ? 0 : 1;
  const id = typeof body.id === "string" && body.id ? body.id : `al-${Date.now()}`;

  if (!email || !symbol || !type || !Number.isFinite(value)) {
    return NextResponse.json({ error: "Email, symbol, type and value are required" }, { status: 400 });
  }

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Portfolio alert was not saved.", detail: status.error, code: status.code },
      { status: 503 }
    );
  }

  try {
    const plan = await getPlanForEmail(email);
    if (!plan.limits.alerts) {
      return NextResponse.json({ error: "Portfolio alerts require Premium plan or higher", requiredPlan: "premium" }, { status: 403 });
    }
    await query(
      `INSERT INTO portfolio_alerts (id, user_email, symbol, type, value, active)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE symbol = VALUES(symbol), type = VALUES(type), value = VALUES(value), active = VALUES(active)`,
      [id, email, symbol, type, value, active]
    );
    return NextResponse.json({ success: true, alert: { id, symbol, type, value, active: !!active } });
  } catch (err: any) {
    console.error("Database portfolio alert write error:", err.message);
    return NextResponse.json(
      { error: "Could not save portfolio alert to database", detail: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const { email: rawEmail, id } = await req.json();
  const email = normalizeEmail(rawEmail);

  if (!email || !id) {
    return NextResponse.json({ error: "Email and alert ID are required" }, { status: 400 });
  }

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Portfolio alert was not deleted.", detail: status.error, code: status.code },
      { status: 503 }
    );
  }

  try {
    const plan = await getPlanForEmail(email);
    if (!plan.limits.alerts) {
      return NextResponse.json({ error: "Portfolio alerts require Premium plan or higher", requiredPlan: "premium" }, { status: 403 });
    }
    await query("DELETE FROM portfolio_alerts WHERE user_email = ? AND id = ?", [email, id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Database portfolio alert delete error:", err.message);
    return NextResponse.json(
      { error: "Could not delete portfolio alert from database", detail: err.message },
      { status: 500 }
    );
  }
}

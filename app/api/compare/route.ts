import { NextResponse } from "next/server";
import { getDbConnectionStatus, query } from "@/lib/db";
import { getPlanForEmail } from "@/lib/entitlements";
import { requireSameMemberEmail } from "@/lib/request-auth";

type ChartMetric = "mos" | "yield" | "roe" | "margin";

function normalizeEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizeSymbols(symbols: unknown) {
  if (!Array.isArray(symbols)) return [];
  return Array.from(
    new Set(
      symbols
        .filter((symbol): symbol is string => typeof symbol === "string")
        .map((symbol) => symbol.trim().toUpperCase())
        .filter((symbol) => /^[A-Z0-9._-]{1,20}$/.test(symbol))
    )
  ).slice(0, 4);
}

function normalizeMetric(metric: unknown): ChartMetric {
  return metric === "yield" || metric === "roe" || metric === "margin" ? metric : "mos";
}

async function ensureComparisonTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS comparison_sets (
      id VARCHAR(64) PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      symbols TEXT NOT NULL,
      chart_metric VARCHAR(50) DEFAULT 'mos',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_comparison_user (user_email, updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

function parseSymbols(value: string) {
  try {
    const parsed = JSON.parse(value);
    return normalizeSymbols(parsed);
  } catch {
    return [];
  }
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
      { error: "Database is not connected. Comparison sets were not loaded.", detail: status.error, code: status.code, sets: [] },
      { status: 503 }
    );
  }

  try {
    const plan = await getPlanForEmail(email);
    if (!plan.limits.compare) {
      return NextResponse.json({ error: "Saved comparison sets require Premium plan or higher", requiredPlan: "premium", sets: [] }, { status: 403 });
    }
    await ensureComparisonTable();
    const rows = await query<any[]>(
      `SELECT id, name, symbols, chart_metric AS chartMetric, created_at AS createdAt, updated_at AS updatedAt
       FROM comparison_sets
       WHERE user_email = ?
       ORDER BY updated_at DESC`,
      [email]
    );

    return NextResponse.json({
      sets: rows.map((row) => ({
        id: row.id,
        name: row.name,
        symbols: parseSymbols(row.symbols),
        chartMetric: normalizeMetric(row.chartMetric),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
    });
  } catch (err: any) {
    console.error("Database comparison sets fetch error:", err.message);
    return NextResponse.json(
      { error: "Could not load comparison sets from database", detail: err.message, sets: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const email = normalizeEmail(body.email);
  const symbols = normalizeSymbols(body.symbols);
  const chartMetric = normalizeMetric(body.chartMetric);
  const name = typeof body.name === "string" && body.name.trim()
    ? body.name.trim().slice(0, 120)
    : symbols.join(" vs ");
  const id = typeof body.id === "string" && body.id.trim()
    ? body.id.trim().slice(0, 64)
    : `cmp-${Date.now()}`;

  if (!email || symbols.length < 2) {
    return NextResponse.json({ error: "Email and at least 2 symbols are required" }, { status: 400 });
  }
  const access = await requireSameMemberEmail(req, email);
  if (access.error) return access.error;

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Comparison set was not saved.", detail: status.error, code: status.code },
      { status: 503 }
    );
  }

  try {
    const plan = await getPlanForEmail(email);
    if (!plan.limits.compare) {
      return NextResponse.json({ error: "Saved comparison sets require Premium plan or higher", requiredPlan: "premium" }, { status: 403 });
    }
    await ensureComparisonTable();
    await query(
      `INSERT INTO comparison_sets (id, user_email, name, symbols, chart_metric)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), symbols = VALUES(symbols), chart_metric = VALUES(chart_metric)`,
      [id, email, name, JSON.stringify(symbols), chartMetric]
    );

    return NextResponse.json({
      success: true,
      set: { id, name, symbols, chartMetric },
    });
  } catch (err: any) {
    console.error("Database comparison set write error:", err.message);
    return NextResponse.json(
      { error: "Could not save comparison set to database", detail: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const email = normalizeEmail(body.email);
  const id = typeof body.id === "string" ? body.id.trim() : "";

  if (!email || !id) {
    return NextResponse.json({ error: "Email and comparison set ID are required" }, { status: 400 });
  }
  const access = await requireSameMemberEmail(req, email);
  if (access.error) return access.error;

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Comparison set was not deleted.", detail: status.error, code: status.code },
      { status: 503 }
    );
  }

  try {
    const plan = await getPlanForEmail(email);
    if (!plan.limits.compare) {
      return NextResponse.json({ error: "Saved comparison sets require Premium plan or higher", requiredPlan: "premium" }, { status: 403 });
    }
    await ensureComparisonTable();
    await query("DELETE FROM comparison_sets WHERE user_email = ? AND id = ?", [email, id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Database comparison set delete error:", err.message);
    return NextResponse.json(
      { error: "Could not delete comparison set from database", detail: err.message },
      { status: 500 }
    );
  }
}

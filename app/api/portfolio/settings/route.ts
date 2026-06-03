import { NextResponse } from "next/server";
import { getDbConnectionStatus, query } from "@/lib/db";
import { getPlanForEmail } from "@/lib/entitlements";
import { requireSameMemberEmail } from "@/lib/request-auth";

type TabType = "ledger" | "backtest" | "alerts";

function normalizeEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizeTab(tab: unknown): TabType {
  return tab === "backtest" || tab === "alerts" ? tab : "ledger";
}

function normalizeSymbol(symbol: unknown) {
  return typeof symbol === "string" && symbol.trim() ? symbol.trim().toUpperCase().slice(0, 50) : "PTT";
}

function normalizeYears(years: unknown) {
  const value = Number(years);
  return value === 5 ? 5 : 3;
}

async function ensurePortfolioSettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS portfolio_settings (
      user_email VARCHAR(255) PRIMARY KEY,
      active_tab VARCHAR(50) DEFAULT 'ledger',
      backtest_symbol VARCHAR(50) DEFAULT 'PTT',
      backtest_years INT DEFAULT 3,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
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
      { error: "Database is not connected. Portfolio settings were not loaded.", detail: status.error, code: status.code },
      { status: 503 }
    );
  }

  try {
    const plan = await getPlanForEmail(email);
    if (!plan.limits.portfolio) {
      return NextResponse.json({ error: "Portfolio settings require Pro plan or higher", requiredPlan: "pro" }, { status: 403 });
    }
    await ensurePortfolioSettingsTable();
    const rows = await query<any[]>(
      `SELECT active_tab AS activeTab, backtest_symbol AS backtestSymbol, backtest_years AS backtestYears
       FROM portfolio_settings
       WHERE user_email = ?
       LIMIT 1`,
      [email]
    );
    return NextResponse.json({
      settings: rows[0] || { activeTab: "ledger", backtestSymbol: "PTT", backtestYears: 3 },
    });
  } catch (err: any) {
    console.error("Database portfolio settings fetch error:", err.message);
    return NextResponse.json(
      { error: "Could not load portfolio settings from database", detail: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const email = normalizeEmail(body.email);
  const activeTab = normalizeTab(body.activeTab);
  const backtestSymbol = normalizeSymbol(body.backtestSymbol);
  const backtestYears = normalizeYears(body.backtestYears);

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  const access = await requireSameMemberEmail(req, email);
  if (access.error) return access.error;

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Portfolio settings were not saved.", detail: status.error, code: status.code },
      { status: 503 }
    );
  }

  try {
    const plan = await getPlanForEmail(email);
    if (!plan.limits.portfolio) {
      return NextResponse.json({ error: "Portfolio settings require Pro plan or higher", requiredPlan: "pro" }, { status: 403 });
    }
    const allowedTab = activeTab === "alerts" && !plan.limits.alerts
      ? "ledger"
      : activeTab === "backtest" && !plan.limits.scenarioDcf
        ? "ledger"
        : activeTab;
    await ensurePortfolioSettingsTable();
    await query(
      `INSERT INTO portfolio_settings (user_email, active_tab, backtest_symbol, backtest_years)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE active_tab = VALUES(active_tab), backtest_symbol = VALUES(backtest_symbol), backtest_years = VALUES(backtest_years)`,
      [email, allowedTab, backtestSymbol, backtestYears]
    );
    return NextResponse.json({ success: true, settings: { activeTab: allowedTab, backtestSymbol, backtestYears } });
  } catch (err: any) {
    console.error("Database portfolio settings write error:", err.message);
    return NextResponse.json(
      { error: "Could not save portfolio settings to database", detail: err.message },
      { status: 500 }
    );
  }
}

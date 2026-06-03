import { NextResponse } from "next/server";
import { getDbConnectionStatus, initDatabase, query } from "@/lib/db";
import { getPlanForEmail } from "@/lib/entitlements";
import { getStock } from "@/lib/stocks";
import { computeValuation, defaultDCFParams } from "@/lib/valuation";
import { getTelegramMiniMember } from "@/lib/telegram-mini";

type TransactionRow = {
  symbol: string;
  action: "BUY" | "SELL";
  price: string | number;
  shares: string | number;
  fee: string | number | null;
};

type CompareSetRow = {
  id: string;
  name: string;
  symbols: string;
  chartMetric: string | null;
  updatedAt: string;
};

function parseSymbols(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((symbol): symbol is string => typeof symbol === "string").map((symbol) => symbol.toUpperCase()).slice(0, 4)
      : [];
  } catch {
    return [];
  }
}

function stockSnapshot(symbol: string) {
  const stock = getStock(symbol);
  if (!stock) return null;
  const valuation = computeValuation(stock, defaultDCFParams(stock));
  const changePct = stock.prevClose > 0 ? ((stock.price - stock.prevClose) / stock.prevClose) * 100 : 0;
  return {
    symbol: stock.symbol,
    name: stock.name,
    price: stock.price,
    changePct,
    fairValue: valuation.fairValue,
    mos: valuation.marginOfSafety,
    dividendYield: valuation.ratios.dividendYield || 0,
    roe: Number.isFinite(valuation.ratios.roe) ? valuation.ratios.roe : null,
    verdict: valuation.verdict,
  };
}

function buildPortfolio(transactions: TransactionRow[]) {
  const bySymbol = new Map<string, { shares: number; cost: number }>();

  for (const row of transactions) {
    const symbol = String(row.symbol || "").toUpperCase();
    const price = Number(row.price || 0);
    const shares = Number(row.shares || 0);
    const fee = Number(row.fee || 0);
    if (!symbol || !price || !shares) continue;

    const current = bySymbol.get(symbol) || { shares: 0, cost: 0 };
    if (row.action === "SELL") {
      const avgCost = current.shares > 0 ? current.cost / current.shares : 0;
      current.shares = Math.max(0, current.shares - shares);
      current.cost = Math.max(0, current.cost - avgCost * shares + fee);
    } else {
      current.shares += shares;
      current.cost += price * shares + fee;
    }
    bySymbol.set(symbol, current);
  }

  const positions = Array.from(bySymbol.entries())
    .map(([symbol, pos]) => {
      const stock = getStock(symbol);
      if (!stock || pos.shares <= 0) return null;
      const value = stock.price * pos.shares;
      const pnl = value - pos.cost;
      const pnlPct = pos.cost > 0 ? (pnl / pos.cost) * 100 : 0;
      return {
        symbol,
        name: stock.name,
        shares: pos.shares,
        avgCost: pos.cost / pos.shares,
        price: stock.price,
        value,
        pnl,
        pnlPct,
      };
    })
    .filter(Boolean) as Array<{
      symbol: string;
      name: string;
      shares: number;
      avgCost: number;
      price: number;
      value: number;
      pnl: number;
      pnlPct: number;
    }>;

  positions.sort((a, b) => b.value - a.value);
  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
  const totalCost = positions.reduce((sum, pos) => sum + pos.avgCost * pos.shares, 0);
  const pnl = totalValue - totalCost;
  return {
    totalValue,
    pnl,
    pnlPct: totalCost > 0 ? (pnl / totalCost) * 100 : 0,
    positions,
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const member = await getTelegramMiniMember(body.initData);
  if (!member) {
    return NextResponse.json({ error: "Telegram Mini App authentication failed" }, { status: 401 });
  }

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected", detail: status.error, code: status.code },
      { status: 503 }
    );
  }
  await initDatabase();

  const plan = await getPlanForEmail(member.email);
  const [transactions, watchlistRows, compareRows] = await Promise.all([
    plan.limits.portfolio
      ? query<TransactionRow[]>(
          "SELECT symbol, action, price, shares, fee FROM portfolio_transactions WHERE user_email = ? ORDER BY trade_date DESC, created_at DESC",
          [member.email]
        )
      : Promise.resolve([]),
    query<{ symbol: string }[]>("SELECT symbol FROM watchlists WHERE user_email = ? ORDER BY created_at ASC", [member.email]),
    plan.limits.compare
      ? query<CompareSetRow[]>(
          `SELECT id, name, symbols, chart_metric AS chartMetric, updated_at AS updatedAt
           FROM comparison_sets
           WHERE user_email = ?
           ORDER BY updated_at DESC
           LIMIT 8`,
          [member.email]
        )
      : Promise.resolve([]),
  ]);

  const watchlist = watchlistRows
    .map((row) => stockSnapshot(row.symbol))
    .filter(Boolean)
    .sort((a: any, b: any) => b.mos - a.mos)
    .slice(0, 10);

  const compareSets = compareRows.map((row) => {
    const symbols = parseSymbols(row.symbols);
    const snapshots = symbols.map(stockSnapshot).filter(Boolean) as NonNullable<ReturnType<typeof stockSnapshot>>[];
    const mosLeader = [...snapshots].sort((a, b) => b.mos - a.mos)[0] || null;
    const yieldLeader = [...snapshots].sort((a, b) => b.dividendYield - a.dividendYield)[0] || null;
    return {
      id: row.id,
      name: row.name,
      symbols,
      chartMetric: row.chartMetric || "mos",
      updatedAt: row.updatedAt,
      mosLeader,
      yieldLeader,
    };
  });

  return NextResponse.json({
    member: {
      email: member.email,
      plan: plan.id,
      telegramUser: member.telegramUser,
    },
    capabilities: {
      portfolio: plan.limits.portfolio,
      compare: plan.limits.compare,
      alerts: plan.limits.alerts,
    },
    portfolio: buildPortfolio(transactions),
    watchlist,
    compareSets,
  });
}

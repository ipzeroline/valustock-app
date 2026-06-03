import { STOCKS, getStock } from "@/lib/stocks";
import { computeValuation, defaultDCFParams } from "@/lib/valuation";
import { num } from "@/lib/format";

function formatPriceValue(stock: any, price: number) {
  if (stock.assetType === "US_STOCK" || stock.currency === "USD") return `$${num(price, 2)}`;
  if (stock.assetType === "FUND") return `${num(price, 4)} NAV`;
  return `${num(price, 2)} บาท`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stockStatus(mos: number, dividendYield: number, changePct: number) {
  if (mos >= 20) return "ต่ำกว่า Fair Value มาก";
  if (mos >= 15) return "เข้าโซน Margin of Safety";
  if (dividendYield >= 5) return "หุ้นปันผลเด่น";
  if (changePct <= -3) return "ราคาปรับลงแรง ควรตรวจสอบ";
  if (changePct >= 3) return "ราคาปรับขึ้นแรง ควรทบทวนมูลค่า";
  return "ติดตามต่อ";
}

function metricLabel(metric: string) {
  if (metric === "yield") return "Dividend Yield";
  if (metric === "roe") return "ROE";
  if (metric === "margin") return "Net Margin";
  return "Margin of Safety";
}

function netMargin(stock: any) {
  return stock.financials.revenue > 0 ? (stock.financials.netIncome / stock.financials.revenue) * 100 : 0;
}

function compareScore(row: {
  valuation: ReturnType<typeof computeValuation>;
  stock: NonNullable<ReturnType<typeof getStock>>;
  changePct: number;
}) {
  return (
    row.valuation.marginOfSafety * 1.4 +
    (row.valuation.ratios.dividendYield || 0) * 1.2 +
    (Number.isFinite(row.valuation.ratios.roe) ? row.valuation.ratios.roe : 0) * 0.35 +
    Math.max(0, -row.changePct) * 0.4
  );
}

function metricValue(row: {
  valuation: ReturnType<typeof computeValuation>;
  stock: NonNullable<ReturnType<typeof getStock>>;
}, metric: string) {
  if (metric === "yield") return row.valuation.ratios.dividendYield || 0;
  if (metric === "roe") return Number.isFinite(row.valuation.ratios.roe) ? row.valuation.ratios.roe : 0;
  if (metric === "margin") return netMargin(row.stock);
  return row.valuation.marginOfSafety;
}

type PortfolioTransactionInput = {
  symbol: string;
  action: "BUY" | "SELL";
  price: string | number;
  shares: string | number;
  fee?: string | number | null;
};

export function buildPortfolioTelegramSummaryMessage({
  email,
  transactions,
  siteUrl,
}: {
  email: string;
  transactions: PortfolioTransactionInput[];
  siteUrl: string;
}) {
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
      const valuation = computeValuation(stock, defaultDCFParams(stock));
      return {
        symbol,
        name: stock.name,
        shares: pos.shares,
        value,
        pnl,
        pnlPct,
        mos: valuation.marginOfSafety,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.value - a.value) as Array<{
      symbol: string;
      name: string;
      shares: number;
      value: number;
      pnl: number;
      pnlPct: number;
      mos: number;
    }>;

  if (positions.length === 0) {
    return [
      "<b>ValuStock Portfolio Summary</b>",
      "",
      "ยังไม่มีรายการพอร์ตในระบบ",
      `บัญชี: <b>${escapeHtml(email)}</b>`,
      `${siteUrl}/portfolio`,
    ].join("\n");
  }

  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
  const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalCost = totalValue - totalPnl;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const bestPosition = [...positions].sort((a, b) => b.pnlPct - a.pnlPct)[0];
  const weakestPosition = [...positions].sort((a, b) => a.pnlPct - b.pnlPct)[0];
  const opportunity = [...positions].sort((a, b) => b.mos - a.mos)[0];

  const lines = positions.slice(0, 8).flatMap((pos, index) => [
    `<b>${index + 1}. ${escapeHtml(pos.symbol)}</b> - ${escapeHtml(pos.name)}`,
    `มูลค่า: <b>${num(pos.value, 0)}</b> | P/L: <b>${pos.pnl >= 0 ? "+" : ""}${num(pos.pnl, 0)} (${num(pos.pnlPct, 1)}%)</b>`,
    `MOS: <b>${pos.mos >= 0 ? "+" : ""}${num(pos.mos, 0)}%</b> | จำนวน: <b>${num(pos.shares, 2)}</b>`,
    "",
  ]);

  return [
    "<b>ValuStock Portfolio Summary</b>",
    `บัญชี: <b>${escapeHtml(email)}</b>`,
    "",
    `มูลค่าพอร์ต: <b>${num(totalValue, 0)}</b>`,
    `กำไร/ขาดทุนรวม: <b>${totalPnl >= 0 ? "+" : ""}${num(totalPnl, 0)} (${num(totalPnlPct, 1)}%)</b>`,
    `ตัวเด่นสุด: <b>${escapeHtml(bestPosition.symbol)}</b> (${bestPosition.pnlPct >= 0 ? "+" : ""}${num(bestPosition.pnlPct, 1)}%)`,
    `ตัวอ่อนสุด: <b>${escapeHtml(weakestPosition.symbol)}</b> (${weakestPosition.pnlPct >= 0 ? "+" : ""}${num(weakestPosition.pnlPct, 1)}%)`,
    `MOS สูงสุดในพอร์ต: <b>${escapeHtml(opportunity.symbol)}</b> (${opportunity.mos >= 0 ? "+" : ""}${num(opportunity.mos, 0)}%)`,
    "",
    ...lines,
    "หมายเหตุ: ข้อมูลนี้ใช้เพื่อการติดตามและวิเคราะห์ ไม่ใช่คำแนะนำซื้อขายหลักทรัพย์",
    `${siteUrl}/portfolio`,
  ].join("\n");
}

export function buildCompareTelegramSummaryMessage({
  email,
  name,
  symbols,
  chartMetric = "mos",
  siteUrl,
}: {
  email: string;
  name: string;
  symbols: string[];
  chartMetric?: string;
  siteUrl: string;
}) {
  const rows = Array.from(new Set(symbols.map((symbol) => symbol.toUpperCase())))
    .map((symbol) => {
      const stock = getStock(symbol);
      if (!stock) return null;
      const valuation = computeValuation(stock, defaultDCFParams(stock));
      const changePct = stock.prevClose > 0 ? ((stock.price - stock.prevClose) / stock.prevClose) * 100 : 0;
      return {
        stock,
        valuation,
        changePct,
        score: 0,
      };
    })
    .filter(Boolean) as Array<{
      stock: NonNullable<ReturnType<typeof getStock>>;
      valuation: ReturnType<typeof computeValuation>;
      changePct: number;
      score: number;
    }>;

  rows.forEach((row) => {
    row.score = compareScore(row);
  });

  if (rows.length < 2) {
    return [
      "<b>ValuStock Compare Alert</b>",
      "",
      "ยังไม่มีหลักทรัพย์เพียงพอสำหรับสรุปผลเปรียบเทียบ",
      `บัญชี: <b>${escapeHtml(email)}</b>`,
      `${siteUrl}/compare`,
    ].join("\n");
  }

  const ranked = [...rows].sort((a, b) => b.score - a.score);
  const mosLeader = [...rows].sort((a, b) => b.valuation.marginOfSafety - a.valuation.marginOfSafety)[0];
  const yieldLeader = [...rows].sort((a, b) => (b.valuation.ratios.dividendYield || 0) - (a.valuation.ratios.dividendYield || 0))[0];
  const roeLeader = [...rows].sort((a, b) => metricValue(b, "roe") - metricValue(a, "roe"))[0];
  const activeLeader = [...rows].sort((a, b) => metricValue(b, chartMetric) - metricValue(a, chartMetric))[0];

  const lines = ranked.map((row, index) => {
    const dividendYield = row.valuation.ratios.dividendYield || 0;
    return [
      `<b>${index + 1}. ${escapeHtml(row.stock.symbol)}</b> - ${escapeHtml(row.stock.name)}`,
      `ราคา: <b>${formatPriceValue(row.stock, row.stock.price)}</b> (${row.changePct >= 0 ? "+" : ""}${num(row.changePct, 2)}%)`,
      `Fair Value: <b>${formatPriceValue(row.stock, row.valuation.fairValue)}</b> | MOS: <b>${row.valuation.marginOfSafety >= 0 ? "+" : ""}${num(row.valuation.marginOfSafety, 0)}%</b>`,
      `P/E: <b>${Number.isFinite(row.valuation.ratios.pe) ? `${num(row.valuation.ratios.pe, 1)}x` : "-"}</b> | ROE: <b>${Number.isFinite(row.valuation.ratios.roe) ? `${num(row.valuation.ratios.roe, 1)}%` : "-"}</b> | Yield: <b>${num(dividendYield, 2)}%</b>`,
      `${siteUrl}/stocks/${encodeURIComponent(row.stock.symbol)}`,
      "",
    ];
  }).flat();

  return [
    "<b>ValuStock Compare Alert</b>",
    `ชุด: <b>${escapeHtml(name || symbols.join(" vs "))}</b>`,
    `บัญชี: <b>${escapeHtml(email)}</b>`,
    "",
    `<b>ผู้ชนะจากคะแนนรวม:</b> ${escapeHtml(ranked[0].stock.symbol)}`,
    `<b>MOS สูงสุด:</b> ${escapeHtml(mosLeader.stock.symbol)} (${mosLeader.valuation.marginOfSafety >= 0 ? "+" : ""}${num(mosLeader.valuation.marginOfSafety, 0)}%)`,
    `<b>Yield สูงสุด:</b> ${escapeHtml(yieldLeader.stock.symbol)} (${num(yieldLeader.valuation.ratios.dividendYield || 0, 2)}%)`,
    `<b>ROE สูงสุด:</b> ${escapeHtml(roeLeader.stock.symbol)} (${num(metricValue(roeLeader, "roe"), 1)}%)`,
    `<b>${escapeHtml(metricLabel(chartMetric))} leader:</b> ${escapeHtml(activeLeader.stock.symbol)} (${num(metricValue(activeLeader, chartMetric), 1)}%)`,
    "",
    ...lines,
    "หมายเหตุ: ข้อมูลนี้ใช้เพื่อการติดตามและวิเคราะห์ ไม่ใช่คำแนะนำซื้อขายหลักทรัพย์",
    `${siteUrl}/compare`,
  ].join("\n");
}

export function buildWatchlistTelegramSummary({
  email,
  symbols,
  siteUrl,
}: {
  email: string;
  symbols: string[];
  siteUrl: string;
}) {
  return buildWatchlistTelegramSummaryMessages({ email, symbols, siteUrl }).join("\n\n");
}

export function buildWatchlistTelegramSummaryMessages({
  email,
  symbols,
  siteUrl,
  batchSize = 8,
}: {
  email: string;
  symbols: string[];
  siteUrl: string;
  batchSize?: number;
}) {
  const uniqueSymbols = Array.from(new Set(symbols.map((symbol) => symbol.toUpperCase())));
  const rows = uniqueSymbols
    .map((symbol) => {
      const stock = getStock(symbol);
      if (!stock) return null;
      const valuation = computeValuation(stock, defaultDCFParams(stock));
      const changePct = stock.prevClose > 0 ? ((stock.price - stock.prevClose) / stock.prevClose) * 100 : 0;
      return {
        stock,
        valuation,
        changePct,
        score: valuation.marginOfSafety + valuation.ratios.dividendYield * 1.5 + Math.max(0, -changePct),
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.score - a.score) as Array<{
      stock: NonNullable<ReturnType<typeof getStock>>;
      valuation: ReturnType<typeof computeValuation>;
      changePct: number;
      score: number;
    }>;

  if (rows.length === 0) {
    return [[
      "<b>ValuStock Watchlist Summary</b>",
      "",
      "ยังไม่มีหุ้นในรายการโปรดที่สามารถสรุปได้",
      `บัญชี: <b>${escapeHtml(email)}</b>`,
      "",
      `${siteUrl}/watchlist`,
    ].join("\n")];
  }

  const batches: typeof rows[] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }

  return batches.map((batch, batchIndex) => {
    const start = batchIndex * batchSize;
    const lines = batch.flatMap((row, index) => {
    const { stock, valuation, changePct } = row;
    const dividendYield = valuation.ratios.dividendYield || 0;
    const status = stockStatus(valuation.marginOfSafety, dividendYield, changePct);
    return [
      `<b>${start + index + 1}. ${escapeHtml(stock.symbol)}</b> - ${escapeHtml(stock.name)}`,
      `ราคา: <b>${formatPriceValue(stock, stock.price)}</b> (${changePct >= 0 ? "+" : ""}${num(changePct, 2)}%)`,
      `Fair Value: <b>${formatPriceValue(stock, valuation.fairValue)}</b>`,
      `MOS: <b>${valuation.marginOfSafety >= 0 ? "+" : ""}${num(valuation.marginOfSafety, 0)}%</b> | Yield: <b>${num(dividendYield, 2)}%</b>`,
      `สถานะ: ${status}`,
      `${siteUrl}/stocks/${encodeURIComponent(stock.symbol)}`,
      "",
    ];
  });

    return [
    "<b>ValuStock Watchlist Summary</b>",
    `ชุดที่ ${batchIndex + 1}/${batches.length} | หุ้นทั้งหมด ${rows.length} ตัว`,
    "",
    `สรุปหุ้นในรายการโปรดของบัญชี <b>${escapeHtml(email)}</b>`,
    "จัดอันดับจาก Margin of Safety, Dividend Yield และการเปลี่ยนแปลงราคา",
    "",
    ...lines,
    "หมายเหตุ: ข้อมูลนี้ใช้เพื่อการติดตามและวิเคราะห์ ไม่ใช่คำแนะนำซื้อขายหลักทรัพย์",
    `${siteUrl}/watchlist`,
    ].join("\n");
  });
}

export function getDefaultWatchlistSymbols(symbols: string[]) {
  if (symbols.length > 0) return symbols;
  return [];
}

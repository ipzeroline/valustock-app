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

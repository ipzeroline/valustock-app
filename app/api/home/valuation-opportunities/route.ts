import { NextResponse } from "next/server";
import { STOCKS } from "@/lib/stocks";
import { computeValuation, defaultDCFParams } from "@/lib/valuation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 6), 10);

  const etfPriority = ["GLD", "SPY", "QQQ", "VOO", "VIG", "SCHD", "TLT", "JEPQ", "XLE"];
  const alternativePriority = ["GOLD", "BTC", "ETH", "OIL", "SILVER", "COPPER"];

  function categoryOf(stock: (typeof STOCKS)[number]) {
    if (stock.assetType === "TH_STOCK") return "thai";
    if (stock.assetType === "US_STOCK") return "us";
    if (stock.assetType === "ETF" || stock.assetType === "US_FUND") return "etf";
    if (stock.assetType === "CRYPTO" || stock.assetType === "FUTURES") return "alternative";
    return "other";
  }

  const ranked = STOCKS
    .filter((stock) => categoryOf(stock) !== "other")
    .map((stock) => {
      const valuation = computeValuation(stock, defaultDCFParams(stock));
      const priceHistory = stock.priceHistory || [];
      const first = priceHistory[0] || stock.prevClose || stock.price;
      const last = priceHistory[priceHistory.length - 1] || stock.price;
      const changePct = first > 0 ? ((last - first) / first) * 100 : 0;
      return {
        symbol: stock.symbol,
        name: stock.name,
        enName: stock.enName,
        assetType: stock.assetType,
        category: categoryOf(stock),
        currency: stock.currency,
        color: stock.color,
        price: stock.price,
        fairValue: Number.isFinite(valuation.fairValue) ? valuation.fairValue : stock.price,
        marginOfSafety: Number.isFinite(valuation.marginOfSafety) ? valuation.marginOfSafety : 0,
        pe: valuation.ratios.pe,
        dividendYield: valuation.ratios.dividendYield,
        changePct,
        priceHistory,
        href: `/stocks/${stock.symbol.toLowerCase()}`,
      };
    })
    .filter((row) => Number.isFinite(row.fairValue) && Number.isFinite(row.marginOfSafety))
    .sort((a, b) => {
      if (a.category !== b.category) {
        return ["thai", "us", "etf", "alternative"].indexOf(a.category) - ["thai", "us", "etf", "alternative"].indexOf(b.category);
      }
      if (a.category === "etf") {
        const aRank = etfPriority.indexOf(a.symbol);
        const bRank = etfPriority.indexOf(b.symbol);
        return (aRank === -1 ? 99 : aRank) - (bRank === -1 ? 99 : bRank);
      }
      if (a.category === "alternative") {
        const aRank = alternativePriority.indexOf(a.symbol);
        const bRank = alternativePriority.indexOf(b.symbol);
        return (aRank === -1 ? 99 : aRank) - (bRank === -1 ? 99 : bRank);
      }
      return b.marginOfSafety - a.marginOfSafety;
    })
  const opportunities = ["thai", "us", "etf", "alternative"].flatMap((category) =>
    ranked.filter((row) => row.category === category).slice(0, limit)
  );

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    source: "ValuStock valuation engine",
    opportunities,
  });
}

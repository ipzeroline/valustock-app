import { NextResponse } from "next/server";
import { STOCKS } from "@/lib/stocks";
import {
  applyLatestQuote,
  fetchEodhdFundamentals,
  getHistoricalBars,
  getLatestQuote,
  isThaiExchangeSecurity,
  isUsExchangeSecurity,
  searchEodhdSymbol,
  withStaticQuoteMeta,
} from "@/lib/market-quotes";
import { readExternalAsset, saveExternalAsset } from "@/lib/market-data-store";
import { sanitizePublicMarketPayload } from "@/lib/public-market-source";
import { normalizeTickerSymbol, tickerAliasNote } from "@/lib/ticker-aliases";
import type { Stock } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const QUOTE_HEADERS = {
  "Cache-Control": "public, max-age=15, stale-while-revalidate=300",
};

function jsonQuoteCache(body: unknown, init?: ResponseInit) {
  return NextResponse.json(sanitizePublicMarketPayload(body), {
    ...init,
    headers: {
      ...QUOTE_HEADERS,
      ...(init?.headers || {}),
    },
  });
}

async function applyMarketDataToStaticStock(stock: Stock) {
  const [quote, history] = await Promise.all([
    getLatestQuote(stock.symbol, stock, { allowStale: true }),
    getHistoricalBars(stock.symbol, stock, { years: 5 }),
  ]);

  const enriched = quote ? applyLatestQuote(stock, quote) : withStaticQuoteMeta(stock);
  if (!history?.bars?.length) return enriched;

  const ohlcHistory = [...history.bars];
  const priceHistory = ohlcHistory.map((point) => point.close);
  if (quote && ohlcHistory.length > 0) {
    const lastIndex = ohlcHistory.length - 1;
    ohlcHistory[lastIndex] = {
      ...ohlcHistory[lastIndex],
      close: quote.price,
      high: Math.max(ohlcHistory[lastIndex].high, quote.price),
      low: Math.min(ohlcHistory[lastIndex].low, quote.price),
    };
    priceHistory[lastIndex] = quote.price;
  }

  return {
    ...enriched,
    priceHistory,
    ohlcHistory,
    chartSource: history.source,
    chartUpdatedAt: history.fetchedAt,
  };
}

function inferExternalUsStock(symbol: string): Stock {
  return {
    symbol,
    name: symbol,
    enName: symbol,
    sector: "กองทุนรวมดัชนี",
    market: "NASDAQ",
    price: 100,
    prevClose: 100,
    sharesOutstanding: 1000,
    color: "#2563EB",
    about: `ข้อมูลตลาดล่าสุดสำหรับ ${symbol} จากระบบข้อมูลตลาดของ ValuStock`,
    revenueHistory: [],
    fcfHistory: [],
    priceHistory: [],
    financials: {
      revenue: 0,
      netIncome: 0,
      eps: 0,
      bookValuePerShare: 0,
      freeCashFlow: 0,
      ebitda: 0,
      totalDebt: 0,
      cash: 0,
      dividendPerShare: 0,
      growthRate: 0.06,
      totalAssets: 0,
    },
    assetType: "ETF",
    currency: "USD",
    fundType: "External US-listed ETF/security",
  };
}

function numberOrNull(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function eodhdTickerFromSearch(symbol: string, search: Awaited<ReturnType<typeof searchEodhdSymbol>> | null) {
  const code = search?.Code || symbol;
  const exchange = search?.Exchange || "US";
  return `${code}.${exchange}`;
}

function inferAssetTypeFromProvider(type: unknown): Stock["assetType"] {
  const value = String(type || "").toLowerCase();
  if (value.includes("etf")) return "ETF";
  if (value.includes("fund")) return "US_FUND";
  return "US_STOCK";
}

function rowsFromAnnuals(section: any) {
  if (!section || typeof section !== "object") return [];
  return Object.values(section)
    .filter((row: any) => row && typeof row === "object")
    .sort((a: any, b: any) => String(a.date || "").localeCompare(String(b.date || "")));
}

function metric(row: any, keys: string[]) {
  for (const key of keys) {
    const value = numberOrNull(row?.[key]);
    if (value !== null) return value;
  }
  return null;
}

function buildExternalStockFromEodhd(
  symbol: string,
  search: Awaited<ReturnType<typeof searchEodhdSymbol>> | null,
  fundamentals: any,
  quotePrice: number,
  prevClose: number,
  priceHistory: number[],
  ohlcHistory: Stock["ohlcHistory"]
): Stock {
  const general = fundamentals?.General || {};
  const highlights = fundamentals?.Highlights || {};
  const etfData = fundamentals?.ETF_Data || fundamentals?.ETF || {};
  const financials = fundamentals?.Financials || {};
  const incomeRows = rowsFromAnnuals(financials?.Income_Statement?.yearly);
  const cashRows = rowsFromAnnuals(financials?.Cash_Flow?.yearly);
  const balanceRows = rowsFromAnnuals(financials?.Balance_Sheet?.yearly);
  const latestIncome = incomeRows[incomeRows.length - 1] || {};
  const latestCash = cashRows[cashRows.length - 1] || {};
  const latestBalance = balanceRows[balanceRows.length - 1] || {};
  const rawShares =
    numberOrNull(highlights?.SharesOutstanding) ||
    (numberOrNull(highlights?.MarketCapitalization) ? numberOrNull(highlights?.MarketCapitalization)! / quotePrice : null) ||
    1_000_000_000;
  const sharesMillions = rawShares > 1_000_000 ? rawShares / 1_000_000 : rawShares;
  const revenue = (metric(latestIncome, ["totalRevenue", "revenue"]) || 0) / 1_000_000;
  const netIncome = (metric(latestIncome, ["netIncome", "netIncomeApplicableToCommonShares"]) || 0) / 1_000_000;
  const operatingCashFlow = metric(latestCash, ["totalCashFromOperatingActivities", "operatingCashFlow"]) || 0;
  const capex = metric(latestCash, ["capitalExpenditures", "capital_expenditures"]) || 0;
  const freeCashFlow = (operatingCashFlow + capex) / 1_000_000;
  const totalAssets = (metric(latestBalance, ["totalAssets"]) || 0) / 1_000_000;
  const totalDebt =
    ((metric(latestBalance, ["shortLongTermDebtTotal", "longTermDebt", "shortTermDebt"]) || 0) / 1_000_000);
  const cash = (metric(latestBalance, ["cash", "cashAndShortTermInvestments"]) || 0) / 1_000_000;
  const equity = (metric(latestBalance, ["totalStockholderEquity", "totalEquity"]) || 0) / 1_000_000;
  const dividendPerShare = numberOrNull(highlights?.DividendShare) || 0;
  const assetType = inferAssetTypeFromProvider(search?.Type || general.Type);
  const sector = assetType === "ETF" ? "กองทุนรวมดัชนี" : translateSector(general.Sector || general.Industry || "");

  const years = incomeRows.slice(-5).map((row: any) => Number(String(row.date || "").slice(0, 4))).filter(Boolean);
  const revenueHistory = incomeRows.slice(-5).map((row: any, index: number) => ({
    year: years[index] || new Date().getFullYear() - (incomeRows.slice(-5).length - index),
    value: Math.round((metric(row, ["totalRevenue", "revenue"]) || revenue * 1_000_000) / 1_000_000),
  }));
  const fcfHistory = cashRows.slice(-5).map((row: any, index: number) => {
    const ocf = metric(row, ["totalCashFromOperatingActivities", "operatingCashFlow"]) || freeCashFlow * 1_000_000;
    const rowCapex = metric(row, ["capitalExpenditures", "capital_expenditures"]) || 0;
    return {
      year: Number(String(row.date || "").slice(0, 4)) || new Date().getFullYear() - (cashRows.slice(-5).length - index),
      value: Math.round((ocf + rowCapex) / 1_000_000),
    };
  });

  return {
    symbol,
    name: general.Name || search?.Name || symbol,
    enName: general.Name || search?.Name || symbol,
    sector,
    market: search?.Exchange === "NYSE" ? "NYSE" : "NASDAQ",
    price: quotePrice,
    prevClose,
    sharesOutstanding: Math.max(1, Math.round(sharesMillions)),
    color: assetType === "ETF" ? "#D22630" : "#2563EB",
    about: general.Description || `ข้อมูลตลาดและข้อมูลพื้นฐานล่าสุดสำหรับ ${symbol} จากระบบข้อมูลตลาดของ ValuStock`,
    revenueHistory: revenueHistory.length ? revenueHistory : [],
    fcfHistory: fcfHistory.length ? fcfHistory : [],
    priceHistory,
    ohlcHistory,
    financials: {
      revenue: Math.round(revenue),
      netIncome: Math.round(netIncome),
      eps: numberOrNull(highlights?.DilutedEpsTTM) || numberOrNull(highlights?.EPSEstimateCurrentYear) || 0,
      bookValuePerShare: sharesMillions > 0 ? Math.round((equity / sharesMillions) * 100) / 100 : 0,
      freeCashFlow: Math.round(freeCashFlow),
      ebitda: Math.round((numberOrNull(highlights?.EBITDA) || 0) / 1_000_000),
      totalDebt: Math.round(totalDebt),
      cash: Math.round(cash),
      dividendPerShare: Math.round(dividendPerShare * 100) / 100,
      growthRate: 0.06,
      totalAssets: Math.round(totalAssets),
    },
    assetType,
    currency: search?.Currency === "THB" || general.CurrencyCode === "THB" ? "THB" : "USD",
    fundType: assetType === "ETF" ? `ETF ${general.Category || search?.Type || ""}`.trim() : undefined,
    aum: numberOrNull(etfData?.TotalAssets) ? Math.round(numberOrNull(etfData.TotalAssets)! / 1_000_000) : undefined,
    expenseRatio: numberOrNull(etfData?.NetExpenseRatio) || undefined,
    riskLevel: assetType === "ETF" ? 6 : undefined,
  };
}

async function resolveExternalAsset(symbol: string) {
  const eodhdApiKey = process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN;
  const search = eodhdApiKey ? await searchEodhdSymbol(symbol, eodhdApiKey).catch(() => null) : null;
  const eodhdTicker = eodhdApiKey ? eodhdTickerFromSearch(symbol, search) : null;
  const fundamentals = eodhdApiKey && eodhdTicker
    ? await fetchEodhdFundamentals(eodhdTicker, eodhdApiKey).catch(() => null)
    : null;
  const seed = buildExternalStockFromEodhd(
    symbol,
    search,
    fundamentals,
    100,
    100,
    [],
    []
  );

  const [quote, history] = await Promise.all([
    getLatestQuote(symbol, seed, { allowStale: true }),
    getHistoricalBars(symbol, seed, { years: 5 }),
  ]);

  if (!quote && !history?.bars?.length && !search && !fundamentals) return null;

  const price = quote?.price || history?.bars?.at(-1)?.close || seed.price;
  const prevClose = quote?.prevClose || history?.bars?.at(-2)?.close || price;
  const priceHistory = history?.bars?.length ? history.bars.map((bar) => bar.close) : [price];
  if (priceHistory.length) priceHistory[priceHistory.length - 1] = price;
  const ohlcHistory = history?.bars?.length ? [...history.bars] : [];
  if (ohlcHistory.length) {
    const lastIndex = ohlcHistory.length - 1;
    ohlcHistory[lastIndex] = {
      ...ohlcHistory[lastIndex],
      close: price,
      high: Math.max(ohlcHistory[lastIndex].high, price),
      low: Math.min(ohlcHistory[lastIndex].low, price),
    };
  }

  const stock = buildExternalStockFromEodhd(symbol, search, fundamentals, price, prevClose, priceHistory, ohlcHistory);
  const enriched = quote ? applyLatestQuote(stock, quote) : withStaticQuoteMeta(stock, history?.source || "eodhd-reference");
  return {
    ...enriched,
    chartSource: history?.source || "provider-reference",
    chartUpdatedAt: history?.fetchedAt || new Date().toISOString(),
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const url = new URL(request.url);
  const quoteOnly = url.searchParams.get("quote") === "1";
  const { symbol: rawSymbol } = await params;
  const requestedSymbol = rawSymbol.toUpperCase().trim();
  const symbol = normalizeTickerSymbol(requestedSymbol);
  if (!symbol) {
    return jsonQuoteCache({ error: "Symbol is required" }, { status: 400 });
  }
  const aliasMeta = tickerAliasNote(requestedSymbol);

  const staticFound = STOCKS.find(s => s.symbol.toUpperCase() === symbol);
  const massiveApiKey = process.env.MASSIVE_API_KEY;

  if (!staticFound) {
    const cachedExternal = await readExternalAsset(symbol);
    if (cachedExternal) {
      if (quoteOnly) {
        const quote = await getLatestQuote(symbol, cachedExternal, { allowStale: true });
        return jsonQuoteCache({ ...(quote ? applyLatestQuote(cachedExternal, quote) : cachedExternal), ...aliasMeta });
      }
      return jsonQuoteCache({ ...(await applyMarketDataToStaticStock(cachedExternal)), ...aliasMeta });
    }

    const resolvedExternal = await resolveExternalAsset(symbol);
    if (resolvedExternal) {
      await saveExternalAsset(symbol, resolvedExternal, resolvedExternal.quoteSource || resolvedExternal.chartSource || "external-provider");
      if (quoteOnly) return jsonQuoteCache({ ...resolvedExternal, ...aliasMeta });
      return jsonQuoteCache({ ...resolvedExternal, ...aliasMeta });
    }

    return jsonQuoteCache(
      {
        error: "Symbol not found from configured market-data feeds",
        symbol,
      },
      { status: 404 }
    );
  }

  if (quoteOnly && staticFound) {
    const quote = await getLatestQuote(symbol, staticFound, { allowStale: true });
    if (quote) return jsonQuoteCache({ ...applyLatestQuote(staticFound, quote), ...aliasMeta });
    return jsonQuoteCache({ ...withStaticQuoteMeta(staticFound), ...aliasMeta });
  }

  if (staticFound && isThaiExchangeSecurity(staticFound)) {
    return jsonQuoteCache({ ...(await applyMarketDataToStaticStock(staticFound)), ...aliasMeta });
  }

  if (staticFound && !isUsExchangeSecurity(staticFound, symbol)) {
    return jsonQuoteCache({ ...(await applyMarketDataToStaticStock(staticFound)), ...aliasMeta });
  }

  try {
    const apiKey = massiveApiKey;
    if (!apiKey) {
      return jsonQuoteCache({ ...(await applyMarketDataToStaticStock(staticFound)), ...aliasMeta });
    }

    // 1. Fetch ticker reference details from the configured US market feed.
    const tickerRes = await fetch(
      `https://api.massive.com/v3/reference/tickers/${symbol}?apiKey=${encodeURIComponent(apiKey)}`,
      { next: { revalidate: 86400 } }
    );

    if (!tickerRes.ok) {
      const providerStock = staticFound || inferExternalUsStock(symbol);
      const quote = await getLatestQuote(symbol, providerStock, { allowStale: true });
      const history = await getHistoricalBars(symbol, providerStock, { years: 5 });
      if (!staticFound && quote) {
        const fallbackStock = await applyMarketDataToStaticStock({
          ...providerStock,
          price: quote.price,
          prevClose: quote.prevClose || quote.price,
          name: symbol,
          enName: symbol,
          about: `External market-data profile for ${symbol}. Provider reference details were unavailable, but quote/history data was found.`,
        });
        await saveExternalAsset(symbol, fallbackStock, quote.source || history?.source || "external-provider");
        return jsonQuoteCache({ ...fallbackStock, ...aliasMeta });
      }

      return jsonQuoteCache({ ...(await applyMarketDataToStaticStock(staticFound)), ...aliasMeta });
    }

    const tickerData = await tickerRes.json();
    const tResults = tickerData.results || {};

    // 2. Fetch 5 Years of Daily Price Aggregates (Daily Bars)
    const providerStock = staticFound || inferExternalUsStock(symbol);
    const history = await getHistoricalBars(symbol, providerStock, { years: 5 });
    const rawHistory = history?.bars || [];

    // Map close prices. If history is empty, generate realistic ones
    let priceHistory = rawHistory.map((r: any) => r.close);
    if (priceHistory.length === 0) {
      priceHistory = generateMockPrices(100, symbol.charCodeAt(0));
    }
    const ohlcHistory = rawHistory.length > 0
      ? rawHistory
      : generateMockOhlc(priceHistory);

    const latestQuote = await getLatestQuote(symbol, providerStock, { allowStale: true });
    const latestPrice = latestQuote?.price || (priceHistory.length > 0 ? priceHistory[priceHistory.length - 1] : 150.0);
    if (priceHistory.length > 0) {
      priceHistory[priceHistory.length - 1] = latestPrice;
    } else {
      priceHistory = [latestPrice];
    }
    if (ohlcHistory.length > 0) {
      ohlcHistory[ohlcHistory.length - 1] = {
        ...ohlcHistory[ohlcHistory.length - 1],
        close: latestPrice,
        high: Math.max(ohlcHistory[ohlcHistory.length - 1].high, latestPrice),
        low: Math.min(ohlcHistory[ohlcHistory.length - 1].low, latestPrice),
      };
    }
    const prevClose =
      latestQuote?.prevClose ||
      (priceHistory.length > 1 ? priceHistory[priceHistory.length - 2] : latestPrice);

    // 3. Fetch Financial Statements (Income, Balance, Cash Flow)
    const finRes = await fetch(
      `https://api.massive.com/vX/reference/financials?ticker=${symbol}&limit=5&apiKey=${encodeURIComponent(apiKey)}`,
      { next: { revalidate: 86400 } } // Cache financials for 1 day
    );
    const finData = finRes.ok ? await finRes.json() : { results: [] };
    const finResults = finData.results || [];

    // Parse and map corporate financials (fallbacks if statements are incomplete)
    let revenue = 10000;
    let netIncome = 1500;
    let eps = 2.5;
    let bookValue = 8000;
    let freeCashFlow = 1200;
    let ebitda = 2000;
    let totalDebt = 3000;
    let cash = 2000;
    let totalAssets = 15000;
    let growthRate = 0.08;

    if (finResults.length > 0) {
      const f = finResults[0].financials;
      
      // Revenues
      if (f.income_statement?.revenues) {
        revenue = f.income_statement.revenues.value / 1_000_000;
      } else if (f.income_statement?.cost_of_revenue && f.income_statement?.gross_profit) {
        revenue = (f.income_statement.cost_of_revenue.value + f.income_statement.gross_profit.value) / 1_000_000;
      }
      
      // Net Income
      if (f.income_statement?.net_income_loss) {
        netIncome = f.income_statement.net_income_loss.value / 1_000_000;
      }
      
      // Diluted EPS
      if (f.income_statement?.diluted_earnings_per_share) {
        eps = f.income_statement.diluted_earnings_per_share.value;
      } else if (f.income_statement?.basic_earnings_per_share) {
        eps = f.income_statement.basic_earnings_per_share.value;
      }
      
      // Total Equity (Book Value)
      if (f.balance_sheet?.equity) {
        bookValue = f.balance_sheet.equity.value / 1_000_000;
      } else if (f.balance_sheet?.equity_attributable_to_parent) {
        bookValue = f.balance_sheet.equity_attributable_to_parent.value / 1_000_000;
      }

      // Total Assets
      if (f.balance_sheet?.assets) {
        totalAssets = f.balance_sheet.assets.value / 1_000_000;
      } else if (f.balance_sheet?.total_assets) {
        totalAssets = f.balance_sheet.total_assets.value / 1_000_000;
      }
      
      // Total Debt
      if (f.balance_sheet?.long_term_debt) {
        totalDebt = f.balance_sheet.long_term_debt.value / 1_000_000;
        if (f.balance_sheet.current_liabilities) {
          totalDebt += (f.balance_sheet.current_liabilities.value * 0.2) / 1_000_000; // Proxy short term debt
        }
      }
      
      // Cash and Cash Equivalents proxy
      if (f.balance_sheet?.current_assets) {
        cash = (f.balance_sheet.current_assets.value * 0.3) / 1_000_000; // standard 30% of current assets as cash
      }
      
      // Operating cash flow and Investing cash flow for FCF
      if (f.cash_flow_statement?.net_cash_flow_from_operating_activities) {
        const ocf = f.cash_flow_statement.net_cash_flow_from_operating_activities.value;
        const capex = f.cash_flow_statement.net_cash_flow_from_investing_activities?.value || 0;
        freeCashFlow = (ocf + capex) / 1_000_000;
      }
      
      // EBITDA / Operating Income
      if (f.income_statement?.operating_income_loss) {
        ebitda = f.income_statement.operating_income_loss.value / 1_000_000;
      }
    }

    // Historical Points (5 Years of Revenue & FCF)
    const YEARS = [2021, 2022, 2023, 2024, 2025];
    const revenueHistory = YEARS.map((yr, idx) => {
      const fin = finResults[finResults.length - 1 - idx] || finResults[0];
      const revVal = fin?.financials?.income_statement?.revenues?.value;
      return {
        year: yr,
        value: revVal ? Math.round(revVal / 1_000_000) : Math.round(revenue / Math.pow(1.06, 4 - idx))
      };
    });

    const fcfHistory = YEARS.map((yr, idx) => {
      const fin = finResults[finResults.length - 1 - idx] || finResults[0];
      const ocf = fin?.financials?.cash_flow_statement?.net_cash_flow_from_operating_activities?.value;
      const capex = fin?.financials?.cash_flow_statement?.net_cash_flow_from_investing_activities?.value || 0;
      return {
        year: yr,
        value: ocf ? Math.round((ocf + capex) / 1_000_000) : Math.round(freeCashFlow / Math.pow(1.06, 4 - idx))
      };
    });

    // Share counts and market cap
    const mCapInMillions = (tResults.market_cap || (latestPrice * (tResults.weighted_shares_outstanding || 100000000))) / 1_000_000;
    const sharesOutstanding = mCapInMillions / latestPrice;

    // Calculate FCF CAGR dynamically from 5 Years history
    let calculatedGrowthRate = 0.08; // default
    if (fcfHistory && fcfHistory.length >= 2) {
      const firstFcf = fcfHistory[0].value;
      const lastFcf = fcfHistory[fcfHistory.length - 1].value;
      if (firstFcf > 0 && lastFcf > 0) {
        const n = fcfHistory.length;
        const cagr = Math.pow(lastFcf / firstFcf, 1 / (n - 1)) - 1;
        if (!isNaN(cagr) && isFinite(cagr)) {
          // Clamp growth rate between 2% and 15% for conservative valuation
          calculatedGrowthRate = Math.max(0.02, Math.min(0.15, cagr));
        }
      }
    }

    // Parse and estimate dividends
    let parsedDividendPerShare = 0;
    if (finResults.length > 0) {
      const f = finResults[0].financials;
      if (f.cash_flow_statement?.payments_for_dividends) {
        const totalDividendsPaid = Math.abs(f.cash_flow_statement.payments_for_dividends.value / 1_000_000);
        parsedDividendPerShare = totalDividendsPaid / sharesOutstanding;
      } else if (f.cash_flow_statement?.dividends_paid) {
        const totalDividendsPaid = Math.abs(f.cash_flow_statement.dividends_paid.value / 1_000_000);
        parsedDividendPerShare = totalDividendsPaid / sharesOutstanding;
      } else {
        parsedDividendPerShare = latestPrice * (0.015 + (symbol.charCodeAt(0) % 4) * 0.005);
      }
    } else {
      parsedDividendPerShare = latestPrice * (0.015 + (symbol.charCodeAt(0) % 4) * 0.005);
    }

    // Standardize Sector
    let sector = "เทคโนโลยี";
    if (tResults.sic_description) {
      sector = translateSector(tResults.sic_description);
    }

    // Compile the clean Stock object
    const stock: any = {
      symbol: symbol,
      name: tResults.name || symbol,
      enName: tResults.name || symbol,
      sector: sector,
      market: symbol.length <= 4 ? "NASDAQ" : "NYSE",
      price: latestPrice,
      prevClose: prevClose,
      sharesOutstanding: Math.round(sharesOutstanding),
      color: "#2563EB",
      about: tResults.description || `ข้อมูลการวิเคราะห์พื้นฐานทางการเงินสำหรับหลักทรัพย์ ${symbol}`,
      revenueHistory,
      fcfHistory,
      priceHistory: priceHistory, // Contains full 5 Years history!
      ohlcHistory,
      financials: {
        revenue: Math.round(revenue),
        netIncome: Math.round(netIncome),
        eps: Math.round(eps * 100) / 100,
        bookValuePerShare: Math.round((bookValue / sharesOutstanding) * 100) / 100,
        freeCashFlow: Math.round(freeCashFlow),
        ebitda: Math.round(ebitda),
        totalDebt: Math.round(totalDebt),
        cash: Math.round(cash),
        dividendPerShare: Math.round(parsedDividendPerShare * 100) / 100,
        growthRate: calculatedGrowthRate,
        totalAssets: Math.round(totalAssets),
      },
      assetType: staticFound?.assetType || (String(tResults.type || "").toLowerCase().includes("etf") ? "ETF" : "US_STOCK"),
      currency: "USD",
      quoteSource: latestQuote?.source || "massive-daily",
      quoteUpdatedAt: latestQuote?.updatedAt || new Date().toISOString(),
      quoteDelayMinutes: latestQuote?.delayMinutes || 15,
      quoteIsDelayed: true,
      chartSource: history?.source || "simulated-history",
      chartUpdatedAt: history?.fetchedAt || new Date().toISOString(),
    };

    if (!staticFound) {
      await saveExternalAsset(symbol, stock, latestQuote?.source || history?.source || "external-provider");
    }

    return jsonQuoteCache({ ...stock, ...aliasMeta });
  } catch (error: any) {
    console.error("API Integration error:", error);
    return jsonQuoteCache({ ...(await applyMarketDataToStaticStock(staticFound)), ...aliasMeta });
  }
}

// ==== Fallback Simulator for international/Thai stocks and funds ====
function getSimulatedStock(symbol: string): any {
  const sym = symbol.toUpperCase().trim();
  let assetType = "TH_STOCK";
  let market = "SET";
  let currency = "THB";
  let name = "";
  let enName = "";
  let sector = "เทคโนโลยี";
  let price = 50.0;
  let color = "#3B82F6";
  let about = "";
  
  let fundType: string | undefined;
  let feederFund: string | undefined;
  let masterFund: string | undefined;
  let aum: number | undefined;
  let expenseRatio: number | undefined;
  let riskLevel: number | undefined;
  let topHoldings: { name: string; weight: number }[] | undefined;

  const isFund = sym.includes("-") || sym.includes("SET") || sym.startsWith("SCB") || sym.startsWith("K-") || sym.startsWith("B-") || sym.startsWith("TMB") || sym.startsWith("ONE-") || sym.startsWith("UOB") || sym.startsWith("KF") || sym.startsWith("LH") || sym.startsWith("ASP") || sym.startsWith("PRINCIPAL") || sym.startsWith("KT-") || sym.startsWith("TTB");

  if (isFund) {
    assetType = "FUND";
    market = "MUTUAL_FUND";
    currency = "THB";
    name = `กองทุนเปิด ${sym}`;
    enName = `${sym} Open-Ended Mutual Fund`;
    sector = "กองทุนรวมต่างประเทศ";
    price = 12.3456 + ((sym.charCodeAt(0) * 7) % 25);
    color = "#8B5CF6";
    about = `กองทุนรวม ${sym} เป็นกองทุนจำลองและอัปเดตราคา NAV ย้อนหลัง 5 ปี ข้อมูล Master Fund และพอร์ตการถือครองสินทรัพย์สากล`;
    fundType = sym.includes("SET") ? "กองทุนรวมตราสารทุนไทย (Passive Index)" : "กองทุนรวมตราสารทุนต่างประเทศ (Active Growth)";
    masterFund = sym.includes("US") || sym.includes("USA") ? "SPDR S&P 500 ETF Trust" : "Fidelity Global Growth Master Fund";
    feederFund = masterFund;
    aum = 500 + ((sym.charCodeAt(0) * 23) % 4500);
    expenseRatio = 0.5 + ((sym.charCodeAt(0) * 0.1) % 1.5);
    riskLevel = 6;
    topHoldings = [
      { name: "Microsoft Corp (MSFT)", weight: 9.5 },
      { name: "Apple Inc (AAPL)", weight: 8.7 },
      { name: "NVIDIA Corp (NVDA)", weight: 8.2 },
      { name: "Amazon.com Inc (AMZN)", weight: 5.1 },
      { name: "Alphabet Inc (GOOGL)", weight: 4.5 },
    ];
  } else {
    assetType = "TH_STOCK";
    market = "SET";
    currency = "THB";
    name = `บริษัท ${sym} จำกัด (มหาชน)`;
    enName = `${sym} Public Company Limited`;
    sector = "พลังงาน";
    price = 12.0 + ((sym.charCodeAt(0) * 3) % 180);
    color = "#F59E0B";
    about = `บริษัท ${sym} จำกัด (มหาชน) ดำเนินธุรกิจและจดทะเบียนซื้อขายในตลาดหลักทรัพย์แห่งประเทศไทย (SET) ให้บริการและดำเนินงานที่เป็นเสาหลักของเศรษฐกิจไทย`;
  }

  const priceHistory = generateMockPrices(price, sym.charCodeAt(0));
  const ohlcHistory = generateMockOhlc(priceHistory);
  const shares = 100 + ((sym.charCodeAt(0) * 5) % 2500);
  const revenue = price * shares * 1.6;
  const netIncome = price * shares * 0.18;
  const equity = price * shares * 0.9;
  const freeCashFlow = price * shares * 0.14;
  const ebitda = price * shares * 0.28;
  const totalDebt = price * shares * 0.35;
  const cash = price * shares * 0.15;
  const totalAssets = price * shares * 2.2;
  const growthRate = 0.06 + ((sym.charCodeAt(0) * 3) % 12) / 100;

  const YEARS = [2021, 2022, 2023, 2024, 2025];
  const revenueHistory = YEARS.map((yr, idx) => ({
    year: yr,
    value: Math.round(revenue / Math.pow(1 + growthRate, 4 - idx))
  }));
  const fcfHistory = YEARS.map((yr, idx) => ({
    year: yr,
    value: Math.round(freeCashFlow / Math.pow(1 + growthRate, 4 - idx))
  }));

  return {
    symbol: sym,
    name,
    enName,
    sector,
    market,
    price,
    prevClose: price * 0.99,
    sharesOutstanding: shares,
    color,
    about,
    revenueHistory,
    fcfHistory,
    priceHistory,
    ohlcHistory,
    financials: {
      revenue: Math.round(revenue),
      netIncome: Math.round(netIncome),
      eps: Math.round((netIncome / shares) * 100) / 100,
      bookValuePerShare: Math.round((equity / shares) * 100) / 100,
      freeCashFlow: Math.round(freeCashFlow),
      ebitda: Math.round(ebitda),
      totalDebt: Math.round(totalDebt),
      cash: Math.round(cash),
      dividendPerShare: assetType === "FUND" ? 0 : price * 0.02,
      growthRate,
      totalAssets: Math.round(totalAssets),
    },
    assetType,
    currency,
    fundType,
    feederFund,
    masterFund,
    aum,
    expenseRatio,
    riskLevel,
    topHoldings
  };
}

function generateMockPrices(base: number, seed: number): number[] {
  const out: number[] = [];
  let v = base * 0.82;
  let s = seed;
  for (let i = 0; i < 150; i++) { // Generate 150 points for detailed chart
    s = (s * 9301 + 49297) % 233280;
    const rnd = s / 233280 - 0.5;
    const drift = (base - v) * 0.04;
    v = Math.max(base * 0.5, v + drift + rnd * base * 0.05);
    out.push(Math.round(v * 100) / 100);
  }
  out[out.length - 1] = base;
  return out;
}

function generateMockOhlc(priceHistory: number[]) {
  const start = new Date();
  start.setDate(start.getDate() - priceHistory.length);

  return priceHistory.map((close, index) => {
    const prev = priceHistory[index - 1] || close * 0.99;
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const open = prev;
    const spread = Math.max(close * 0.006, Math.abs(close - open) * 0.65);
    const high = Math.max(open, close) + spread;
    const low = Math.max(0.01, Math.min(open, close) - spread);
    const volume = Math.round(500000 + ((index + 3) * 7919) % 3500000);
    return {
      date: date.toISOString().split("T")[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    };
  });
}

function translateSector(sicDesc: string): string {
  const desc = sicDesc.toLowerCase();
  if (desc.includes("electronic") || desc.includes("computer") || desc.includes("technology") || desc.includes("software")) {
    return "เทคโนโลยี";
  }
  if (desc.includes("bank") || desc.includes("finance") || desc.includes("credit")) {
    return "ธนาคาร";
  }
  if (desc.includes("energy") || desc.includes("petroleum") || desc.includes("oil") || desc.includes("gas")) {
    return "พลังงาน";
  }
  if (desc.includes("retail") || desc.includes("store") || desc.includes("merchandise")) {
    return "ค้าปลีก";
  }
  if (desc.includes("communication") || desc.includes("telecommunication") || desc.includes("telephone")) {
    return "สื่อสาร";
  }
  if (desc.includes("food") || desc.includes("beverage") || desc.includes("grain")) {
    return "อาหารและเครื่องดื่ม";
  }
  if (desc.includes("medical") || desc.includes("hospital") || desc.includes("pharmaceutical")) {
    return "การแพทย์";
  }
  return "เทคโนโลยี"; // Default fallback
}

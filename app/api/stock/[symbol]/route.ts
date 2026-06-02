import { NextResponse } from "next/server";
import { STOCKS } from "@/lib/stocks";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase().trim();
  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  // 0. Check if the stock is a hand-curated static stock (like KKP, PTT, KBANK)
  // This bypasses the US API search entirely, preventing Thai stocks from being misclassified as US OTC equities.
  const staticFound = STOCKS.find(s => s.symbol.toUpperCase() === symbol);
  if (staticFound) {
    return NextResponse.json(staticFound);
  }

  try {
    const apiKey = process.env.MASSIVE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(getSimulatedStock(symbol));
    }

    // 1. Fetch Ticker Details from Massive API
    const tickerRes = await fetch(
      `https://api.massive.com/v3/reference/tickers/${symbol}?apiKey=${encodeURIComponent(apiKey)}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!tickerRes.ok) {
      // If ticker not found in Massive (e.g. Thai stocks or funds), fall back to generator
      const simulated = getSimulatedStock(symbol);
      return NextResponse.json(simulated);
    }

    const tickerData = await tickerRes.json();
    const tResults = tickerData.results || {};

    // 2. Fetch 5 Years of Daily Price Aggregates (Daily Bars)
    const today = new Date().toISOString().split("T")[0];
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const fromDate = fiveYearsAgo.toISOString().split("T")[0];

    const aggRes = await fetch(
      `https://api.massive.com/v2/aggs/ticker/${symbol}/range/1/day/${fromDate}/${today}?adjusted=true&sort=asc&limit=50000&apiKey=${encodeURIComponent(apiKey)}`,
      { next: { revalidate: 3600 } }
    );
    const aggData = aggRes.ok ? await aggRes.json() : { results: [] };
    const rawHistory = aggData.results || [];
    
    // Map close prices. If history is empty, generate realistic ones
    let priceHistory = rawHistory.map((r: any) => r.c);
    if (priceHistory.length === 0) {
      priceHistory = generateMockPrices(100, symbol.charCodeAt(0));
    }

    const latestPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1] : 150.0;
    const prevClose = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2] : latestPrice;

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
      assetType: "US_STOCK",
      currency: "USD"
    };

    return NextResponse.json(stock);
  } catch (error: any) {
    console.error("API Integration error:", error);
    const simulated = getSimulatedStock(symbol);
    return NextResponse.json(simulated);
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

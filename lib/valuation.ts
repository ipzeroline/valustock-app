import { Stock, Ratios, DCFParams, DCFResult, Valuation, Verdict } from "./types";

/** มูลค่ากิจการสุทธิ (Net Debt) = หนี้สิน - เงินสด (ล้านบาท) */
export function netDebt(s: Stock): number {
  return s.financials.totalDebt - s.financials.cash;
}

/** Market Cap (ล้านบาท) = ราคา * จำนวนหุ้น(ล้านหุ้น) */
export function marketCap(s: Stock): number {
  return s.price * s.sharesOutstanding;
}

export function enterpriseValue(s: Stock): number {
  return marketCap(s) + netDebt(s);
}

export function computeRatios(s: Stock): Ratios {
  const f = s.financials;
  const mc = marketCap(s);
  const ev = enterpriseValue(s);
  const sps = f.revenue / s.sharesOutstanding; // ยอดขายต่อหุ้น
  const pe = f.eps > 0 ? s.price / f.eps : NaN;
  const pb = f.bookValuePerShare > 0 ? s.price / f.bookValuePerShare : NaN;
  const ps = sps > 0 ? s.price / sps : NaN;
  const evEbitda = f.ebitda > 0 ? ev / f.ebitda : NaN;
  const equity = f.bookValuePerShare * s.sharesOutstanding;
  const roe = equity > 0 ? (f.netIncome / equity) * 100 : NaN;
  const roa = f.totalAssets && f.totalAssets > 0 ? (f.netIncome / f.totalAssets) * 100 : null;
  const dividendYield = s.price > 0 ? (f.dividendPerShare / s.price) * 100 : 0;
  const growthPct = f.growthRate * 100;
  const peg = growthPct > 0 && pe > 0 ? pe / growthPct : NaN;
  const netMargin = f.revenue > 0 ? (f.netIncome / f.revenue) * 100 : NaN;
  return {
    pe,
    pb,
    ps,
    evEbitda,
    roe,
    roa,
    dividendYield,
    peg,
    netMargin,
  };
}

export function defaultDCFParams(s: Stock): DCFParams {
  return {
    growthRate: s.financials.growthRate,
    discountRate: 0.09, // WACC สมมติฐานเริ่มต้น 9%
    terminalGrowth: 0.025, // โตระยะยาว 2.5%
    years: 5,
  };
}

/**
 * คำนวณ DCF แบบ 2 ระยะ:
 *  - ระยะเติบโต: ทบ FCF ด้วย growthRate เป็นเวลา N ปี แล้วคิดลดกลับ
 *  - Terminal Value (Gordon Growth) = FCF_N*(1+g_term)/(r-g_term) คิดลดกลับ
 *  - EV = ผลรวม PV; Equity = EV - Net Debt; ต่อหุ้น = Equity / จำนวนหุ้น
 */
export function computeDCF(s: Stock, p: DCFParams): DCFResult {
  const f = s.financials;
  const r = p.discountRate;
  const g = p.growthRate;
  const gt = Math.min(p.terminalGrowth, r - 0.005); // กันหารด้วยศูนย์/ติดลบ
  let fcf = f.freeCashFlow;
  let pvSum = 0;
  const projections: DCFResult["projections"] = [];
  const baseYear = new Date().getFullYear();

  for (let t = 1; t <= p.years; t++) {
    fcf = fcf * (1 + g);
    const pv = fcf / Math.pow(1 + r, t);
    pvSum += pv;
    projections.push({ year: baseYear + t, fcf, pv });
  }

  const terminalValue = (fcf * (1 + gt)) / (r - gt);
  const pvTerminal = terminalValue / Math.pow(1 + r, p.years);
  const enterpriseValue = pvSum + pvTerminal; // ล้านบาท
  const equityValue = enterpriseValue - netDebt(s); // ล้านบาท
  const intrinsicValue = (equityValue / s.sharesOutstanding); // บาท/หุ้น
  const upside = ((intrinsicValue - s.price) / s.price) * 100;

  return {
    intrinsicValue,
    enterpriseValue,
    equityValue,
    upside,
    projections,
    terminalValue,
    pvTerminal,
  };
}

/** Graham Number = sqrt(22.5 * EPS * BVPS) — มูลค่าเหมาะสมแนวเน้นคุณค่า */
export function grahamNumber(s: Stock): number {
  const { eps, bookValuePerShare } = s.financials;
  if (eps <= 0 || bookValuePerShare <= 0) return NaN;
  return Math.sqrt(22.5 * eps * bookValuePerShare);
}

function verdictFromMargin(margin: number): Verdict {
  if (margin >= 15) return "undervalued";
  if (margin <= -15) return "overvalued";
  return "fair";
}

/**
 * มูลค่าเหมาะสม (Fair Value) = ค่าเฉลี่ยถ่วงน้ำหนักของ
 *   DCF 60% + Graham 40% (ถ้า Graham ใช้ไม่ได้ ใช้ DCF 100%)
 * Margin of Safety = (fairValue - price) / fairValue
 */
export function computeValuation(s: Stock, params: DCFParams): Valuation {
  if (s.assetType === "FUND" || s.assetType === "INDEX") {
    return {
      ratios: {
        pe: NaN,
        pb: NaN,
        ps: NaN,
        evEbitda: NaN,
        roe: NaN,
        roa: null,
        dividendYield: s.financials.dividendPerShare > 0 ? (s.financials.dividendPerShare / s.price) * 100 : 0,
        peg: NaN,
        netMargin: NaN,
      },
      dcf: {
        intrinsicValue: s.price,
        enterpriseValue: s.aum || 0,
        equityValue: s.aum || 0,
        upside: 0,
        projections: [],
        terminalValue: 0,
        pvTerminal: 0,
      },
      grahamNumber: NaN,
      fairValue: s.price,
      marginOfSafety: 0,
      verdict: "fair",
    };
  }

  const ratios = computeRatios(s);
  const dcf = computeDCF(s, params);
  const graham = grahamNumber(s);

  const fairValue = isFinite(graham)
    ? dcf.intrinsicValue * 0.6 + graham * 0.4
    : dcf.intrinsicValue;

  const marginOfSafety = ((fairValue - s.price) / fairValue) * 100;
  const verdict = verdictFromMargin(marginOfSafety);

  return {
    ratios,
    dcf,
    grahamNumber: graham,
    fairValue,
    marginOfSafety,
    verdict,
  };
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  undervalued: "ราคาต่ำกว่ามูลค่า",
  fair: "ราคาเหมาะสม",
  overvalued: "ราคาสูงกว่ามูลค่า",
};

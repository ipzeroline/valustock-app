// ---- Stocks & financials ----
export type Sector =
  | "พลังงาน"
  | "ธนาคาร"
  | "ค้าปลีก"
  | "สื่อสาร"
  | "อาหารและเครื่องดื่ม"
  | "อสังหาริมทรัพย์"
  | "การแพทย์"
  | "ขนส่งและโลจิสติกส์"
  | "วัสดุก่อสร้าง"
  | "เทคโนโลยี"
  | "กองทุนรวมตราสารทุน"
  | "กองทุนรวมตราสารหนี้"
  | "กองทุนรวมผสม"
  | "กองทุนรวมต่างประเทศ"
  | "กองทุนรวมดัชนี"
  | "กองทุนรวมสินค้าโภคภัณฑ์";

export type AssetType = "TH_STOCK" | "US_STOCK" | "FUND" | "US_FUND" | "ETF" | "CRYPTO" | "FUTURES" | "INDEX";

export interface YearPoint {
  year: number;
  value: number;
}

export interface OhlcPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Financials {
  revenue: number; // ล้านบาท หรือ ล้านดอลลาร์ ปีล่าสุด
  netIncome: number; // ล้านบาท หรือ ล้านดอลลาร์
  eps: number; // กำไรต่อหุ้น (บาท หรือ ดอลลาร์)
  bookValuePerShare: number; // มูลค่าตามบัญชีต่อหุ้น
  freeCashFlow: number; // ล้านบาท หรือ ล้านดอลลาร์ ปีล่าสุด
  ebitda: number; // ล้านบาท หรือ ล้านดอลลาร์
  totalDebt: number; // ล้านบาท หรือ ล้านดอลลาร์
  cash: number; // ล้านบาท หรือ ล้านดอลลาร์
  dividendPerShare: number; // ต่อหุ้น
  growthRate: number; // อัตราเติบโต FCF คาดการณ์ (ทศนิยม เช่น 0.08)
  totalAssets?: number; // สินทรัพย์รวม (ล้านบาท หรือ ล้านดอลลาร์)
}

export interface Stock {
  symbol: string;
  name: string; // ชื่อบริษัท/กองทุนภาษาไทย
  enName: string;
  sector: Sector | string;
  market: "SET" | "mai" | "NASDAQ" | "NYSE" | "MUTUAL_FUND" | "INDEX";
  price: number; // ราคาปัจจุบัน (บาท หรือ ดอลลาร์ หรือ NAV)
  prevClose: number; // ราคาปิดก่อนหน้า
  quoteSource?: string;
  quoteUpdatedAt?: string;
  quoteDelayMinutes?: number;
  quoteIsDelayed?: boolean;
  sharesOutstanding: number; // ล้านหุ้น หรือ ล้านหน่วย
  color: string; // สีโลโก้
  about: string;
  revenueHistory: YearPoint[]; // 5 ปี
  fcfHistory: YearPoint[]; // 5 ปี
  priceHistory: number[]; // ราคา 30 จุด (เดโม)
  ohlcHistory?: OhlcPoint[]; // ราคาเปิด-สูง-ต่ำ-ปิดและ volume สำหรับกราฟแท่งเทียน
  chartSource?: string;
  chartUpdatedAt?: string;
  financials: Financials;
  
  // ฟิลด์เพิ่มเติมสำหรับรองรับหลายสินทรัพย์
  assetType?: AssetType;
  currency?: "THB" | "USD";
  
  // สำหรับกองทุนรวม (Mutual Funds)
  fundType?: string; // ประเภทกองทุนย่อย เช่น "กองทุนตราสารทุนต่างประเทศ"
  feederFund?: string; // กองทุนต่างประเทศที่ไปลงทุน (ถ้ามี)
  masterFund?: string; // ชื่อ Master Fund
  aum?: number; // มูลค่าทรัพย์สินสุทธิ (ล้านบาท)
  expenseRatio?: number; // ค่าธรรมเนียมต่อปี (%)
  riskLevel?: number; // ระดับความเสี่ยง 1-8
  topHoldings?: { name: string; weight: number }[]; // หลักทรัพย์ที่ถือครองสูงสุด 5 อันดับ

  // สำหรับตราสารล่วงหน้า (Futures) & สินทรัพย์ดิจิทัล (Crypto)
  contractSize?: string; // ขนาดสัญญา เช่น "100 Troy Ounces"
  initialMargin?: number; // เงินประกันขั้นต้น เช่น 8500 (USD) หรือ %
  leverage?: number; // อัตราทด เช่น 10 (เท่า)
  expiryDate?: string; // วันครบกำหนดสัญญา เช่น "Dec 2026"
  tickSize?: string; // ขนาดช่องราคา เช่น "0.10 USD"
  cryptoCirculating?: string; // เหรียญหมุนเวียนคริปโต เช่น "19.7M BTC"
  cryptoConsensus?: string; // ระบบประมวลผล เช่น "Proof of Work"
}

// ---- Valuation outputs ----
export interface Ratios {
  pe: number;
  pb: number;
  ps: number;
  evEbitda: number;
  roe: number; // %
  roa: number | null;
  dividendYield: number; // %
  peg: number;
  netMargin: number; // %
}

export type Verdict = "undervalued" | "fair" | "overvalued";

export interface DCFParams {
  growthRate: number; // ทศนิยม
  discountRate: number; // ทศนิยม (WACC)
  terminalGrowth: number; // ทศนิยม
  years: number;
}

export interface DCFResult {
  intrinsicValue: number; // บาท/หุ้น
  enterpriseValue: number; // ล้านบาท
  equityValue: number; // ล้านบาท
  upside: number; // % เทียบราคาปัจจุบัน
  projections: { year: number; fcf: number; pv: number }[];
  terminalValue: number;
  pvTerminal: number;
}

export interface Valuation {
  ratios: Ratios;
  dcf: DCFResult;
  grahamNumber: number; // บาท/หุ้น
  fairValue: number; // ค่าเฉลี่ยถ่วงน้ำหนัก บาท/หุ้น
  marginOfSafety: number; // %
  verdict: Verdict;
}

// ---- Membership ----
export type PlanId = "free" | "pro" | "premium" | "lifetime";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number; // บาท
  priceYearly: number; // บาท/ปี
  highlight?: boolean;
  badge?: string;
  features: string[];
  limits: {
    maxStocks: number | "unlimited";
    dcf: boolean;
    screener: boolean;
    portfolio: boolean;
    watchlist: number | "unlimited";
    compare: boolean;
    exportData: boolean;
    alerts: boolean;
    aiInsights: number | "unlimited";
    scenarioDcf: boolean;
    alertChannels: string[];
    assetClasses: string[];
  };
}

export interface User {
  name: string;
  email: string;
  plan: PlanId;
  billing: "monthly" | "yearly" | "lifetime";
  joinedAt: string;
}

export interface AppData {
  user: User | null;
  watchlist: string[]; // symbols
  theme: "dark" | "light";
  lang?: "th" | "en";
}

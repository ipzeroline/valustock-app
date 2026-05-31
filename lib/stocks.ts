import { Stock, Sector, YearPoint, AssetType } from "./types";

// หมายเหตุ: ตัวเลขในไฟล์นี้เป็น "ข้อมูลตัวอย่างเพื่อสาธิต" เท่านั้น
// ไม่ใช่ข้อมูลเรียลไทม์ และไม่ใช่คำแนะนำการลงทุน
// ในการใช้งานจริงให้เชื่อมต่อ API (เช่น FMP / EODHD / Settrade) แทน seed นี้

const YEARS = [2021, 2022, 2023, 2024, 2025];

function series(base: number, growth: number): YearPoint[] {
  const out: YearPoint[] = [];
  for (let i = 0; i < YEARS.length; i++) {
    const back = YEARS.length - 1 - i;
    const v = base / Math.pow(1 + growth, back);
    out.push({ year: YEARS[i], value: Math.round(v) });
  }
  return out;
}

function prices(base: number, seed: number): number[] {
  const out: number[] = [];
  let v = base * 0.82;
  let s = seed;
  for (let i = 0; i < 30; i++) {
    s = (s * 9301 + 49297) % 233280;
    const rnd = s / 233280 - 0.5;
    const drift = (base - v) * 0.04;
    v = Math.max(base * 0.5, v + drift + rnd * base * 0.05);
    out.push(Math.round(v * 100) / 100);
  }
  out[out.length - 1] = base;
  return out;
}

interface Raw {
  symbol: string;
  name: string;
  enName: string;
  sector: Sector | string;
  market: "SET" | "mai" | "NASDAQ" | "NYSE" | "MUTUAL_FUND";
  price: number;
  prevClose: number;
  shares: number;
  color: string;
  about: string;
  revenue: number;
  netIncome: number;
  equity: number;
  fcf: number;
  ebitda: number;
  totalDebt: number;
  cash: number;
  dps: number;
  growth: number;
  
  assetType?: AssetType;
  currency?: "THB" | "USD";
  fundType?: string;
  feederFund?: string;
  masterFund?: string;
  aum?: number;
  expenseRatio?: number;
  riskLevel?: number;
  topHoldings?: { name: string; weight: number }[];
  
  contractSize?: string;
  initialMargin?: number;
  leverage?: number;
  expiryDate?: string;
  tickSize?: string;
  cryptoCirculating?: string;
  cryptoConsensus?: string;
}

function build(r: Raw): Stock {
  const eps = r.netIncome / r.shares;
  const bvps = r.equity / r.shares;
  return {
    symbol: r.symbol,
    name: r.name,
    enName: r.enName,
    sector: r.sector,
    market: r.market,
    price: r.price,
    prevClose: r.prevClose,
    sharesOutstanding: r.shares,
    color: r.color,
    about: r.about,
    revenueHistory: series(r.revenue, r.growth),
    fcfHistory: series(r.fcf, r.growth),
    priceHistory: prices(r.price, r.symbol.charCodeAt(0) * 131 + r.symbol.length),
    financials: {
      revenue: r.revenue,
      netIncome: r.netIncome,
      eps: Math.round(eps * 100) / 100,
      bookValuePerShare: Math.round(bvps * 100) / 100,
      freeCashFlow: r.fcf,
      ebitda: r.ebitda,
      totalDebt: r.totalDebt,
      cash: r.cash,
      dividendPerShare: r.dps,
      growthRate: r.growth,
    },
    assetType: r.assetType || (r.market === "NASDAQ" || r.market === "NYSE" ? "US_STOCK" : r.market === "MUTUAL_FUND" ? "FUND" : "TH_STOCK"),
    currency: r.currency || (r.market === "NASDAQ" || r.market === "NYSE" ? "USD" : "THB"),
    fundType: r.fundType,
    feederFund: r.feederFund,
    masterFund: r.masterFund,
    aum: r.aum,
    expenseRatio: r.expenseRatio,
    riskLevel: r.riskLevel,
    topHoldings: r.topHoldings,
    
    contractSize: r.contractSize,
    initialMargin: r.initialMargin,
    leverage: r.leverage,
    expiryDate: r.expiryDate,
    tickSize: r.tickSize,
    cryptoCirculating: r.cryptoCirculating,
    cryptoConsensus: r.cryptoConsensus,
  };
}

const RAW: Raw[] = [
  // ==== 🇹🇭 หุ้นไทย (10 อันดับหลัก) ====
  {
    symbol: "PTT", name: "ปตท.", enName: "PTT Public Company", sector: "พลังงาน", market: "SET",
    price: 32.5, prevClose: 32.0, shares: 28563, color: "#0050A0",
    about: "บริษัทพลังงานครบวงจรรายใหญ่ที่สุดของไทย ครอบคลุมก๊าซ น้ำมัน และปิโตรเคมี",
    revenue: 3100000, netIncome: 92000, equity: 1080000, fcf: 130000, ebitda: 410000,
    totalDebt: 720000, cash: 280000, dps: 2.0, growth: 0.04, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "AOT", name: "ท่าอากาศยานไทย", enName: "Airports of Thailand", sector: "ขนส่งและโลจิสติกส์", market: "SET",
    price: 58.0, prevClose: 59.25, shares: 14286, color: "#1B4F9C",
    about: "ผู้บริหารท่าอากาศยานหลักของไทยรวมถึงสุวรรณภูมิและดอนเมือง",
    revenue: 68000, netIncome: 19500, equity: 165000, fcf: 16000, ebitda: 34000,
    totalDebt: 42000, cash: 38000, dps: 0.9, growth: 0.10, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "CPALL", name: "ซีพี ออลล์", enName: "CP All", sector: "ค้าปลีก", market: "SET",
    price: 60.5, prevClose: 60.0, shares: 8983, color: "#E2231A",
    about: "ผู้บริหารร้านสะดวกซื้อ 7-Eleven และธุรกิจค้าส่งค้าปลีกในไทย",
    revenue: 980000, netIncome: 24000, equity: 215000, fcf: 31000, ebitda: 95000,
    totalDebt: 360000, cash: 70000, dps: 1.0, growth: 0.08, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "KBANK", name: "ธนาคารกสิกรไทย", enName: "Kasikornbank", sector: "ธนาคาร", market: "SET",
    price: 158.0, prevClose: 156.5, shares: 2369, color: "#138F2D",
    about: "ธนาคารพาณิชย์ขนาดใหญ่ของไทย เด่นด้านดิจิทัลแบงก์กิ้ง",
    revenue: 235000, netIncome: 48000, equity: 510000, fcf: 52000, ebitda: 60000,
    totalDebt: 300000, cash: 90000, dps: 6.0, growth: 0.06, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "ADVANC", name: "แอดวานซ์ อินโฟร์ เซอร์วิส", enName: "Advanced Info Service", sector: "สื่อสาร", market: "SET",
    price: 281.0, prevClose: 279.0, shares: 2973, color: "#00A95C",
    about: "ผู้ให้บริการเครือข่ายมือถือ AIS รายใหญ่ที่สุดของไทย",
    revenue: 205000, netIncome: 33000, equity: 78000, fcf: 40000, ebitda: 95000,
    totalDebt: 130000, cash: 28000, dps: 9.5, growth: 0.07, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "BDMS", name: "กรุงเทพดุสิตเวชการ", enName: "Bangkok Dusit Medical Services", sector: "การแพทย์", market: "SET",
    price: 27.0, prevClose: 26.75, shares: 15886, color: "#0A3D91",
    about: "เครือโรงพยาบาลเอกชนที่ใหญ่ที่สุดในไทย (กลุ่ม BDMS)",
    revenue: 105000, netIncome: 15000, equity: 95000, fcf: 14000, ebitda: 28000,
    totalDebt: 30000, cash: 12000, dps: 0.75, growth: 0.09, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "GULF", name: "กัลฟ์ เอ็นเนอร์จี", enName: "Gulf Energy Development", sector: "พลังงาน", market: "SET",
    price: 47.5, prevClose: 47.0, shares: 11742, color: "#1A1F71",
    about: "ผู้ผลิตและพัฒนาโรงไฟฟ้าและพลังงานหมุนเวียนรายใหญ่ของไทย",
    revenue: 130000, netIncome: 18500, equity: 140000, fcf: 12000, ebitda: 45000,
    totalDebt: 260000, cash: 40000, dps: 0.66, growth: 0.14, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "SCC", name: "ปูนซิเมนต์ไทย", enName: "Siam Cement Group", sector: "วัสดุก่อสร้าง", market: "SET",
    price: 178.0, prevClose: 180.0, shares: 1200, color: "#C8102E",
    about: "กลุ่มอุตสาหกรรมซีเมนต์ เคมีภัณฑ์ และบรรจุภัณฑ์ชั้นนำ",
    revenue: 510000, netIncome: 25000, equity: 420000, fcf: 28000, ebitda: 70000,
    totalDebt: 340000, cash: 80000, dps: 7.0, growth: 0.04, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "MINT", name: "ไมเนอร์ อินเตอร์เนชั่นแนล", enName: "Minor International", sector: "อาหารและเครื่องดื่ม", market: "SET",
    price: 28.5, prevClose: 28.25, shares: 5800, color: "#6B2C91",
    about: "ธุรกิจโรงแรม ร้านอาหาร และไลฟ์สไตล์ระดับนานาชาติ",
    revenue: 160000, netIncome: 8000, equity: 110000, fcf: 11000, ebitda: 38000,
    totalDebt: 230000, cash: 35000, dps: 0.5, growth: 0.11, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "PTTEP", name: "ปตท.สำรวจและผลิตปิโตรเลียม", enName: "PTT Exploration & Production", sector: "พลังงาน", market: "SET",
    price: 122.0, prevClose: 121.0, shares: 3970, color: "#003F7D",
    about: "ผู้สำรวจและผลิตปิโตรเลียมรายใหญ่ของไทยเพื่อความมั่นคงทางพลังงาน",
    revenue: 320000, netIncome: 78000, equity: 480000, fcf: 70000, ebitda: 230000,
    totalDebt: 120000, cash: 110000, dps: 8.5, growth: 0.05, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "DELTA", name: "เดลต้า อีเลคโทรนิคส์", enName: "Delta Electronics", sector: "เทคโนโลยี", market: "SET",
    price: 75.00, prevClose: 74.50, shares: 12400, color: "#0093DD",
    about: "ผู้ผลิตชิ้นส่วนอิเล็กทรอนิกส์และพัดลมระบายความร้อนระดับโลก รองรับตลาดดาต้าเซ็นเตอร์และยานยนต์ไฟฟ้า",
    revenue: 140000, netIncome: 18000, equity: 65000, fcf: 15000, ebitda: 22000,
    totalDebt: 12000, cash: 9800, dps: 0.45, growth: 0.16, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "SCB", name: "เอสซีบี เอกซ์", enName: "SCB X", sector: "ธนาคาร", market: "SET",
    price: 112.50, prevClose: 111.00, shares: 3360, color: "#4E2E7F",
    about: "บริษัทโฮลดิ้งด้านเทคโนโลยีการเงินชั้นนำและเป็นบริษัทแม่ของธนาคารไทยพาณิชย์",
    revenue: 165000, netIncome: 41000, equity: 490000, fcf: 35000, ebitda: 62000,
    totalDebt: 320000, cash: 280000, dps: 7.30, growth: 0.04, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "KKP", name: "ธนาคารเกียรตินาคินภัทร", enName: "Kiatnakin Phatra Bank", sector: "ธนาคาร", market: "SET",
    price: 53.00, prevClose: 52.75, shares: 846, color: "#5D2E88",
    about: "ธนาคารพาณิชย์ชั้นนำของไทย มีความเชี่ยวชาญด้านเช่าซื้อรถยนต์ สินเชื่อธุรกิจ และธุรกิจสถาบันการเงินการลงทุนเกียรตินาคินภัทร",
    revenue: 28000, netIncome: 6000, equity: 62000, fcf: 5500, ebitda: 8500,
    totalDebt: 45000, cash: 12000, dps: 3.00, growth: 0.04, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "BBL", name: "ธนาคารกรุงเทพ", enName: "Bangkok Bank", sector: "ธนาคาร", market: "SET",
    price: 138.50, prevClose: 139.00, shares: 1900, color: "#1E3A8A",
    about: "ธนาคารพาณิชย์ที่มีขนาดสินทรัพย์ใหญ่ที่สุดในไทย โดดเด่นด้านสินเชื่อภาคธุรกิจและพอร์ตลูกค้าสากล",
    revenue: 180000, netIncome: 42000, equity: 520000, fcf: 38000, ebitda: 65000,
    totalDebt: 380000, cash: 310000, dps: 7.00, growth: 0.05, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "CPN", name: "เซ็นทรัลพัฒนา", enName: "Central Pattana", sector: "อสังหาริมทรัพย์", market: "SET",
    price: 62.50, prevClose: 63.00, shares: 4480, color: "#005F4E",
    about: "ผู้นำด้านการพัฒนาและบริหารศูนย์การค้าเครือเซ็นทรัลพลาซา คอนโดมิเนียม และโรงแรมทั่วประเทศไทย",
    revenue: 45000, netIncome: 12500, equity: 89000, fcf: 9800, ebitda: 19000,
    totalDebt: 72000, cash: 8500, dps: 1.80, growth: 0.09, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "LH", name: "แลนด์แอนด์เฮ้าส์", enName: "Land and Houses", sector: "อสังหาริมทรัพย์", market: "SET",
    price: 7.20, prevClose: 7.15, shares: 11950, color: "#FF8C00",
    about: "ผู้พัฒนาอสังหาริมทรัพย์รายใหญ่ของไทย มุ่งเน้นโครงการบ้านเดี่ยวและทาวน์โฮมระดับกลางถึงไฮเอนด์",
    revenue: 35000, netIncome: 7500, equity: 48000, fcf: 6200, ebitda: 9800,
    totalDebt: 55000, cash: 4200, dps: 0.60, growth: 0.05, assetType: "TH_STOCK", currency: "THB"
  },
  {
    symbol: "BH", name: "โรงพยาบาลบำรุงราษฎร์", enName: "Bumrungrad Hospital", sector: "การแพทย์", market: "SET",
    price: 245.00, prevClose: 242.00, shares: 790, color: "#006B70",
    about: "โรงพยาบาลเอกชนชั้นนำที่ได้รับการยอมรับในเวทีสากล โดดเด่นด้านการรักษาขั้นสูงและกลุ่มลูกค้าต่างชาติ",
    revenue: 25000, netIncome: 7000, equity: 22000, fcf: 5800, ebitda: 9200,
    totalDebt: 3200, cash: 8500, dps: 4.50, growth: 0.12, assetType: "TH_STOCK", currency: "THB"
  },

  // ==== 🇺🇸 หุ้นสหรัฐฯ (10 อันดับหลัก) ====
  {
    symbol: "AAPL", name: "แอปเปิล", enName: "Apple Inc.", sector: "เทคโนโลยี", market: "NASDAQ",
    price: 189.5, prevClose: 188.0, shares: 15400, color: "#000000",
    about: "ผู้ผลิตอุปกรณ์เทคโนโลยีชั้นนำระดับโลก เช่น iPhone, iPad, Mac และระบบ AI ส่วนบุคคล",
    revenue: 385000, netIncome: 97000, equity: 62000, fcf: 105000, ebitda: 125000,
    totalDebt: 108000, cash: 73000, dps: 0.96, growth: 0.07, assetType: "US_STOCK", currency: "USD"
  },
  {
    symbol: "MSFT", name: "ไมโครซอฟท์", enName: "Microsoft Corporation", sector: "เทคโนโลยี", market: "NASDAQ",
    price: 415.2, prevClose: 418.0, shares: 7430, color: "#F25022",
    about: "ผู้นำเทคโนโลยีด้านคลาวด์ ซอฟต์แวร์ Windows/Office และระบบปัญญาประดิษฐ์ AI Copilot",
    revenue: 227000, netIncome: 72000, equity: 112000, fcf: 67000, ebitda: 102000,
    totalDebt: 79000, cash: 88000, dps: 3.0, growth: 0.12, assetType: "US_STOCK", currency: "USD"
  },
  {
    symbol: "NVDA", name: "เอ็นวิเดีย", enName: "NVIDIA Corporation", sector: "เทคโนโลยี", market: "NASDAQ",
    price: 940.5, prevClose: 930.2, shares: 2460, color: "#76B900",
    about: "ผู้ผลิตชิปประมวลผลกราฟิก (GPU) และโครงสร้างพื้นฐานสำหรับซูเปอร์คอมพิวเตอร์ปัญญาประดิษฐ์",
    revenue: 60900, netIncome: 29700, equity: 43000, fcf: 27000, ebitda: 34000,
    totalDebt: 9500, cash: 26000, dps: 0.16, growth: 0.28, assetType: "US_STOCK", currency: "USD"
  },
  {
    symbol: "TSLA", name: "เทสลา", enName: "Tesla, Inc.", sector: "เทคโนโลยี", market: "NASDAQ",
    price: 175.0, prevClose: 179.3, shares: 3180, color: "#CC0000",
    about: "ผู้นำนวัตกรรมรถยนต์ไฟฟ้า (EV) ระบบจัดเก็บพลังงาน และปัญญาประดิษฐ์หุ่นยนต์ฮิวแมนนอยด์",
    revenue: 96700, netIncome: 15000, equity: 62000, fcf: 4300, ebitda: 14000,
    totalDebt: 5000, cash: 29000, dps: 0, growth: 0.15, assetType: "US_STOCK", currency: "USD"
  },
  {
    symbol: "BRK.B", name: "เบิร์กเชียร์ แฮทธาเวย์", enName: "Berkshire Hathaway Inc.", sector: "ธนาคาร", market: "NYSE",
    price: 405.8, prevClose: 402.1, shares: 1300, color: "#003A70",
    about: "บริษัทโฮลดิ้งยักษ์ใหญ่ด้านการลงทุนระดับโลก นำโดยปู่ Warren Buffett เน้นลงทุนในหุ้นปันผลคุณค่าสูง",
    revenue: 364000, netIncome: 96000, equity: 570000, fcf: 38000, ebitda: 52000,
    totalDebt: 110000, cash: 167000, dps: 0, growth: 0.05, assetType: "US_STOCK", currency: "USD"
  },
  {
    symbol: "AMZN", name: "อเมซอน", enName: "Amazon.com, Inc.", sector: "ค้าปลีก", market: "NASDAQ",
    price: 180.2, prevClose: 179.0, shares: 10400, color: "#FF9900",
    about: "ผู้ให้บริการอีคอมเมิร์ซยักษ์ใหญ่ระดับโลกและผู้นำบริการโครงสร้างพื้นฐานคลาวด์ AWS",
    revenue: 574000, netIncome: 30400, equity: 201000, fcf: 36800, ebitda: 85000,
    totalDebt: 65000, cash: 73000, dps: 0, growth: 0.11, assetType: "US_STOCK", currency: "USD"
  },
  {
    symbol: "GOOGL", name: "กูเกิล", enName: "Alphabet Inc.", sector: "เทคโนโลยี", market: "NASDAQ",
    price: 172.5, prevClose: 171.0, shares: 12500, color: "#4285F4",
    about: "ผู้นำนวัตกรรมอินเทอร์เน็ต เสิร์ชเอ็นจิ้นอันดับหนึ่ง วิดีโอสตรีมมิ่ง YouTube และระบบคลาวด์ AI Gemini",
    revenue: 307000, netIncome: 73000, equity: 292000, fcf: 69000, ebitda: 96000,
    totalDebt: 28000, cash: 110000, dps: 0.8, growth: 0.10, assetType: "US_STOCK", currency: "USD"
  },
  {
    symbol: "META", name: "เมตา", enName: "Meta Platforms, Inc.", sector: "เทคโนโลยี", market: "NASDAQ",
    price: 478.4, prevClose: 482.0, shares: 2500, color: "#1877F2",
    about: "ผู้ให้บริการเครือข่ายโซเชียลมีเดียยักษ์ใหญ่ของโลก Facebook, Instagram, WhatsApp และวิสัยทัศน์เมทาเวิร์ส",
    revenue: 134000, netIncome: 39000, equity: 153000, fcf: 43000, ebitda: 55000,
    totalDebt: 18000, cash: 65000, dps: 2.0, growth: 0.14, assetType: "US_STOCK", currency: "USD"
  },
  {
    symbol: "NFLX", name: "เน็ตฟลิกซ์", enName: "Netflix, Inc.", sector: "เทคโนโลยี", market: "NASDAQ",
    price: 615.5, prevClose: 610.0, shares: 430, color: "#E50914",
    about: "ผู้ให้บริการความบันเทิงสตรีมมิ่งคอนเทนต์อันดับหนึ่งของโลก ครอบคลุมการผลิตซีรีส์และภาพยนตร์คุณภาพระดับสากล",
    revenue: 33700, netIncome: 5400, equity: 22000, fcf: 6900, ebitda: 8000,
    totalDebt: 14000, cash: 7000, dps: 0, growth: 0.12, assetType: "US_STOCK", currency: "USD"
  },
  {
    symbol: "AMD", name: "เอเอ็มดี", enName: "Advanced Micro Devices", sector: "เทคโนโลยี", market: "NASDAQ",
    price: 162.8, prevClose: 160.0, shares: 1600, color: "#000000",
    about: "ผู้ผลิตชิปประมวลผล CPU และสถาปัตยกรรมชิป AI ตระกูล MI300 เพื่อรองรับดาต้าเซ็นเตอร์แห่งอนาคต",
    revenue: 22600, netIncome: 850, equity: 55000, fcf: 1200, ebitda: 3500,
    totalDebt: 3000, cash: 5800, dps: 0, growth: 0.18, assetType: "US_STOCK", currency: "USD"
  },
  {
    symbol: "JNJ", name: "จอห์นสัน แอนด์ จอห์นสัน", enName: "Johnson & Johnson", sector: "การแพทย์", market: "NYSE",
    price: 155.20, prevClose: 154.50, shares: 2400, color: "#D32F2F",
    about: "ผู้นำระดับโลกด้านสินค้าอุปโภคบริโภคเพื่อสุขภาพ ยา และอุปกรณ์การแพทย์ที่มีประวัติยาวนานและปันผลสม่ำเสมอ",
    revenue: 85100, netIncome: 15600, equity: 70200, fcf: 18200, ebitda: 24200,
    totalDebt: 32000, cash: 26000, dps: 4.96, growth: 0.04, assetType: "US_STOCK", currency: "USD"
  },
  {
    symbol: "V", name: "วีซ่า", enName: "Visa Inc.", sector: "เทคโนโลยี", market: "NYSE",
    price: 275.50, prevClose: 273.80, shares: 2050, color: "#1A1F71",
    about: "ผู้ให้บริการเครือข่ายการชำระเงินดิจิทัลระดับโลก เชื่อมโยงผู้บริโภค ร้านค้า และสถาบันการเงินในกว่า 200 ประเทศ",
    revenue: 32600, netIncome: 17200, equity: 39500, fcf: 19100, ebitda: 22100,
    totalDebt: 20500, cash: 16500, dps: 2.08, growth: 0.11, assetType: "US_STOCK", currency: "USD"
  },
  {
    symbol: "PG", name: "พรอคเตอร์ แอนด์ แกมเบิล", enName: "Procter & Gamble Co.", sector: "ค้าปลีก", market: "NYSE",
    price: 165.40, prevClose: 164.20, shares: 2350, color: "#4F5D73",
    about: "ผู้ผลิตและจัดจำหน่ายผลิตภัณฑ์อุปโภคบริโภครายใหญ่ระดับโลก ครอบคลุมแบรนด์ยอดนิยมหลากหลายแบรนด์ เช่น Pampers, Gillette, Tide",
    revenue: 82000, netIncome: 14700, equity: 47000, fcf: 16100, ebitda: 21500,
    totalDebt: 34000, cash: 9500, dps: 3.76, growth: 0.05, assetType: "US_STOCK", currency: "USD"
  },
  {
    symbol: "JPM", name: "เจพีมอร์แกน เชส", enName: "JPMorgan Chase & Co.", sector: "ธนาคาร", market: "NYSE",
    price: 198.80, prevClose: 197.50, shares: 2850, color: "#0D2E5C",
    about: "สถาบันการเงินและธนาคารพาณิชย์ที่มีขนาดสินทรัพย์ใหญ่ที่สุดในสหรัฐอเมริกาและระดับโลก โดดเด่นด้าน Investment Banking และสินเชื่อ",
    revenue: 158000, netIncome: 49500, equity: 328000, fcf: 52000, ebitda: 62000,
    totalDebt: 450000, cash: 120000, dps: 4.20, growth: 0.05, assetType: "US_STOCK", currency: "USD"
  },
  {
    symbol: "WMT", name: "วอลมาร์ต", enName: "Walmart Inc.", sector: "ค้าปลีก", market: "NYSE",
    price: 65.20, prevClose: 64.80, shares: 8050, color: "#0071CE",
    about: "บริษัทค้าปลีกขนาดใหญ่ที่สุดในโลก ดำเนินธุรกิจซูเปอร์เซ็นเตอร์ ไฮเปอร์มาร์เก็ต และห้างสรรพสินค้าจำหน่ายสินค้าราคาประหยัด",
    revenue: 648000, netIncome: 15500, equity: 84000, fcf: 14800, ebitda: 38200,
    totalDebt: 61000, cash: 9800, dps: 0.84, growth: 0.06, assetType: "US_STOCK", currency: "USD"
  },
  {
    symbol: "LLY", name: "อีไล ลิลลี่", enName: "Eli Lilly and Company", sector: "การแพทย์", market: "NYSE",
    price: 820.50, prevClose: 815.00, shares: 950, color: "#C41F3C",
    about: "บริษัทยาข้ามชาติระดับโลก ผู้นำด้านนวัตกรรมยารักษาโรคเบาหวาน โรคอ้วน มะเร็ง และโรคอัลไซเมอร์ ด้วยการวิจัยทางวิทยาศาสตร์ขั้นสูง",
    revenue: 34100, netIncome: 5240, equity: 14200, fcf: 4800, ebitda: 9800,
    totalDebt: 25000, cash: 2800, dps: 5.20, growth: 0.22, assetType: "US_STOCK", currency: "USD"
  },

  // ==== 📊 กองทุน & ETF (ยอดนิยมของไทย และ สหรัฐฯ) ====
  {
    symbol: "TDEX", name: "กองทุนเปิด ThaiDEX SET50 ETF", enName: "ThaiDEX SET50 ETF",
    sector: "กองทุนรวมดัชนี", market: "SET", price: 9.20, prevClose: 9.15, shares: 450, color: "#D32F2F",
    about: "กองทุนเปิด ThaiDEX SET50 ETF เป็นกองทุนรวมประเภท ETF กองทุนแรกของประเทศไทยที่จดทะเบียนซื้อขายในตลาดหลักทรัพย์แห่งประเทศไทย (SET) โดยมีนโยบายลงทุนเพื่อสร้างผลตอบแทนให้ใกล้เคียงกับดัชนี SET50 Index ซึ่งเป็นดัชนีที่สะท้อนราคาหุ้นสามัญขนาดใหญ่และมีสภาพคล่องสูงที่สุด 50 อันดับแรกของไทย",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0.35, growth: 0.05,
    assetType: "ETF", currency: "THB", fundType: "กองทุน ETF ดัชนีหุ้นไทย (SET50)",
    feederFund: "ไม่มี (ลงทุนตรงในหุ้น SET50)", masterFund: "SET50 Index", aum: 4120, expenseRatio: 0.45, riskLevel: 6,
    topHoldings: [
      { name: "PTT Public Co Ltd (PTT)", weight: 10.2 },
      { name: "Delta Electronics Thailand (DELTA)", weight: 9.8 },
      { name: "Airports of Thailand (AOT)", weight: 7.5 },
      { name: "Advanced Info Service (ADVANC)", weight: 6.2 },
      { name: "Gulf Energy Development (GULF)", weight: 5.5 }
    ]
  },
  {
    symbol: "1DIV", name: "กองทุนเปิด ThaiDEX Select 10 Dividend ETF", enName: "ThaiDEX Select 10 Dividend ETF",
    sector: "กองทุนรวมตราสารทุน", market: "SET", price: 8.50, prevClose: 8.55, shares: 80, color: "#1976D2",
    about: "กองทุนเปิด ThaiDEX Select 10 Dividend ETF เน้นลงทุนในหุ้นสามัญที่เป็นส่วนประกอบของดัชนี SECHDIV10 ซึ่งเป็นดัชนีที่คัดเลือกหุ้นไทย 10 ตัวที่มีอัตราการจ่ายเงินปันผลสูงสม่ำเสมอ มีความมั่นคง และมีสภาพคล่องสูง เหมาะสำหรับผู้ลงทุนที่เน้นรับกระแสเงินสดปันผลในระยะยาว",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0.65, growth: 0.04,
    assetType: "ETF", currency: "THB", fundType: "กองทุน ETF ปันผลสูงของไทย (Dividend Yield)",
    feederFund: "ไม่มี (ลงทุนตรงในดัชนี SECHDIV10)", masterFund: "SECHDIV10 Index", aum: 680, expenseRatio: 0.52, riskLevel: 6,
    topHoldings: [
      { name: "Tisco Financial Group (TISCO)", weight: 12.5 },
      { name: "AP Thailand Public Co Ltd (AP)", weight: 11.2 },
      { name: "Supalai Public Co Ltd (SPALI)", weight: 10.8 },
      { name: "Land and Houses Public Co (LH)", weight: 10.5 },
      { name: "PTT Public Co Ltd (PTT)", weight: 9.8 }
    ]
  },
  {
    symbol: "BSET100", name: "กองทุนเปิด BBLAM SET100 ETF", enName: "BBLAM SET100 ETF",
    sector: "กองทุนรวมดัชนี", market: "SET", price: 8.95, prevClose: 8.90, shares: 150, color: "#0D47A1",
    about: "กองทุนเปิด BBLAM SET100 ETF จัดตั้งและบริหารโดย บลจ.บัวหลวง เน้นลงทุนในหลักทรัพย์ที่เป็นส่วนประกอบของดัชนี SET100 Index เพื่อสร้างผลตอบแทนที่สอดคล้องกับภาพรวมของบริษัทจดทะเบียนขนาดใหญ่และกลาง 100 อันดับแรกของตลาดหุ้นไทย",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0.28, growth: 0.05,
    assetType: "ETF", currency: "THB", fundType: "กองทุน ETF ดัชนีหุ้นไทย (SET100)",
    feederFund: "ไม่มี (ลงทุนในดัชนีโดยตรง)", masterFund: "SET100 Index", aum: 1340, expenseRatio: 0.38, riskLevel: 6,
    topHoldings: [
      { name: "PTT Public Co Ltd (PTT)", weight: 8.5 },
      { name: "Delta Electronics Thailand (DELTA)", weight: 7.9 },
      { name: "Airports of Thailand (AOT)", weight: 6.8 },
      { name: "Bangkok Dusit Medical Services (BDMS)", weight: 5.2 },
      { name: "CP ALL Public Co Ltd (CPALL)", weight: 4.8 }
    ]
  },
  {
    symbol: "ENGY", name: "กองทุนเปิด ThaiDEX Energy ETF", enName: "ThaiDEX Energy ETF",
    sector: "กองทุนรวมสินค้าโภคภัณฑ์", market: "SET", price: 5.40, prevClose: 5.45, shares: 120, color: "#E65100",
    about: "กองทุนเปิด ThaiDEX Energy ETF ลงทุนในดัชนีหมวดธุรกิจพลังงานและสาธารณูปโภค (SET Energy and Utilities Index) ของตลาดหลักทรัพย์แห่งประเทศไทย ช่วยให้นักลงทุนสามารถกระจายความเสี่ยงและเข้าเก็งกำไรในกลุ่มอุตสาหกรรมพลังงานหลักของไทยได้อย่างสะดวกเรียลไทม์",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0.18, growth: 0.03,
    assetType: "ETF", currency: "THB", fundType: "กองทุน ETF หมวดอุตสาหกรรมพลังงานและสาธารณูปโภค",
    feederFund: "ไม่มี (ลงทุนในหมวดธุรกิจโดยตรง)", masterFund: "SET Energy Index", aum: 650, expenseRatio: 0.48, riskLevel: 7,
    topHoldings: [
      { name: "PTT Public Co Ltd (PTT)", weight: 22.5 },
      { name: "PTT Exploration & Production (PTTEP)", weight: 18.2 },
      { name: "Gulf Energy Development (GULF)", weight: 14.5 },
      { name: "Energy Absolute (EA)", weight: 8.7 },
      { name: "B.Grimm Power Public Co (BGRIM)", weight: 6.2 }
    ]
  },
  {
    symbol: "GLD", name: "กองทุนทองคำ SPDR Gold Shares", enName: "SPDR Gold Shares",
    sector: "กองทุนรวมสินค้าโภคภัณฑ์", market: "NYSE", price: 220.50, prevClose: 218.90, shares: 250, color: "#D4AF37",
    about: "SPDR Gold Shares (GLD) เป็นกองทุนรวมประเภท ETF ทองคำที่ใหญ่ที่สุดในโลก จดทะเบียนซื้อขายหลักในตลาดหุ้นนิวยอร์ก (NYSE Arca) โดยตัวกองทุนจะเน้นถือครองทองคำแท่งจริง (Physical Gold Bullion) ปลอดภัยในตู้นิรภัยสากล เพื่อสร้างผลตอบแทนสอดคล้องกับราคาทองคำสปอตโลกในอัตราส่วนแบบ 1 ต่อ 10 ออนซ์",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0.04,
    assetType: "ETF", currency: "USD", fundType: "กองทุน ETF สินค้าโภคภัณฑ์ทองคำแท่ง (Physical Gold)",
    feederFund: "ไม่มี (ลงทุนในทองคำแท่งจริงตรง)", masterFund: "Gold Spot Price", aum: 58200, expenseRatio: 0.40, riskLevel: 8,
    topHoldings: [
      { name: "Physical Gold Bullion (100%)", weight: 100 }
    ]
  },
  {
    symbol: "SPY", name: "กองทุนดัชนีสหรัฐ S&P 500 ETF", enName: "SPDR S&P 500 ETF Trust",
    sector: "กองทุนรวมดัชนี", market: "MUTUAL_FUND", price: 520.4, prevClose: 518.0, shares: 900, color: "#008080",
    about: "กองทุน ETF ที่มีสภาพคล่องสูงที่สุดในโลก ลงทุนเลียนแบบผลตอบแทนดัชนี S&P 500 หุ้นใหญ่ 500 ตัวของอเมริกา",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 1.62, growth: 0,
    assetType: "ETF", currency: "USD", fundType: "กองทุน ETF ต่างประเทศ (Passive)",
    feederFund: "ไม่มี (ลงทุนในดัชนีโดยตรง)", masterFund: "S&P 500 Index", aum: 502000, expenseRatio: 0.09, riskLevel: 6,
    topHoldings: [
      { name: "Microsoft Corp (MSFT)", weight: 7.1 },
      { name: "Apple Inc (AAPL)", weight: 6.2 },
      { name: "NVIDIA Corp (NVDA)", weight: 5.0 },
      { name: "Amazon.com Inc (AMZN)", weight: 3.8 },
      { name: "Meta Platforms (META)", weight: 2.5 }
    ]
  },
  {
    symbol: "QQQ", name: "กองทุนดัชนีเทคโนโลยี Nasdaq 100", enName: "Invesco QQQ Trust",
    sector: "กองทุนรวมดัชนี", market: "MUTUAL_FUND", price: 440.8, prevClose: 438.0, shares: 410, color: "#0056B3",
    about: "กองทุนดัชนีที่ลงทุนในหุ้นยักษ์ใหญ่เทคโนโลยี 100 ตัวของสหรัฐอเมริกา ได้ประโยชน์จากกระแส Digitalization ทั่วโลก",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0.58, growth: 0,
    assetType: "ETF", currency: "USD", fundType: "กองทุน ETF ต่างประเทศ (Passive)",
    feederFund: "ไม่มี", masterFund: "Nasdaq 100 Index", aum: 260000, expenseRatio: 0.20, riskLevel: 6,
    topHoldings: [
      { name: "Microsoft Corp", weight: 8.8 },
      { name: "Apple Inc", weight: 7.9 },
      { name: "NVIDIA Corp", weight: 7.2 },
      { name: "Amazon.com Inc", weight: 4.9 },
      { name: "Meta Platforms", weight: 4.8 }
    ]
  },
  {
    symbol: "SCHD", name: "กองทุน ETF หุ้นปันผลคุณค่าสหรัฐฯ", enName: "Schwab U.S. Dividend Equity ETF",
    sector: "กองทุนรวมตราสารทุน", market: "MUTUAL_FUND", price: 80.2, prevClose: 79.5, shares: 300, color: "#0F2D59",
    about: "เน้นลงทุนในหุ้นปันผลประวัติศาสตร์ดี จ่ายปันผลสม่ำเสมอ และงบการเงินแข็งแกร่ง 100 อันดับของสหรัฐฯ",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 3.42, growth: 0,
    assetType: "ETF", currency: "USD", fundType: "กองทุน ETF ต่างประเทศ (Dividend Yield)",
    feederFund: "ไม่มี", masterFund: "Dow Jones U.S. Dividend 100 Index", aum: 55000, expenseRatio: 0.06, riskLevel: 6,
    topHoldings: [
      { name: "Broadcom Inc (AVGO)", weight: 4.8 },
      { name: "Abbott Laboratories", weight: 4.5 },
      { name: "Merck & Co Inc", weight: 4.2 },
      { name: "Home Depot Inc", weight: 4.0 },
      { name: "Chevron Corp", weight: 3.9 }
    ]
  },
  {
    symbol: "DIA", name: "กองทุนดัชนีอุตสาหกรรม Dow Jones", enName: "SPDR Dow Jones Industrial Average ETF",
    sector: "กองทุนรวมดัชนี", market: "MUTUAL_FUND", price: 390.5, prevClose: 388.5, shares: 200, color: "#D21F3C",
    about: "กองทุนเลียนแบบดัชนีดาวโจนส์ ลงทุนในหุ้นยักษ์ใหญ่สีน้ำเงิน (Blue Chip) 30 บริษัทที่เป็นรากฐานเศรษฐกิจสหรัฐฯ",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 1.85, growth: 0,
    assetType: "ETF", currency: "USD", fundType: "กองทุน ETF ดัชนีหลักต่างประเทศ",
    feederFund: "ไม่มี", masterFund: "Dow Jones Industrial Average", aum: 32000, expenseRatio: 0.16, riskLevel: 6,
    topHoldings: [
      { name: "UnitedHealth Group", weight: 8.5 },
      { name: "Goldman Sachs Group", weight: 7.2 },
      { name: "Home Depot Inc", weight: 6.1 },
      { name: "Microsoft Corp", weight: 5.8 },
      { name: "Caterpillar Inc", weight: 5.2 }
    ]
  },
  {
    symbol: "TLT", name: "กองทุนตราสารหนี้พันบัตรรัฐบาลสหรัฐ 20+ ปี", enName: "iShares 20+ Year Treasury Bond ETF",
    sector: "กองทุนรวมตราสารหนี้", market: "MUTUAL_FUND", price: 90.5, prevClose: 89.5, shares: 500, color: "#002B49",
    about: "กองทุน ETF มั่นคงสูง ลงทุนในพันธบัตรสหรัฐอเมริกาอายุมากกว่า 20 ปีขึ้นไป ปลอดภัยสูงและเคลื่อนไหวสวนทางทิศทางดอกเบี้ยนโยบาย",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 3.65, growth: 0,
    assetType: "ETF", currency: "USD", fundType: "กองทุน ETF ตราสารหนี้ต่างประเทศ",
    feederFund: "ไม่มี", masterFund: "U.S. Treasury Bond 20+ Year", aum: 48000, expenseRatio: 0.15, riskLevel: 3,
    topHoldings: [
      { name: "U.S. Treasury Bond 4.75% 2053", weight: 12.0 },
      { name: "U.S. Treasury Bond 4.125% 2054", weight: 9.8 },
      { name: "U.S. Treasury Bond 3.00% 2049", weight: 8.5 },
      { name: "U.S. Treasury Bond 2.875% 2052", weight: 7.6 },
      { name: "U.S. Treasury Bond 3.625% 2053", weight: 6.4 }
    ]
  },
  {
    symbol: "JEPQ", name: "กองทุนเปิด JPMorgan Nasdaq Equity Premium Income ETF", enName: "JPMorgan Nasdaq Equity Premium Income ETF",
    sector: "กองทุนรวมดัชนี", market: "MUTUAL_FUND", price: 54.20, prevClose: 53.85, shares: 2200, color: "#0D2E5C",
    about: "กองทุน ETF ยอดนิยมของ JPMorgan ที่เน้นสร้างกระแสเงินสดผ่านกลยุทธ์เขียนออปชั่น (Covered Call) บนดัชนี Nasdaq-100 เพื่อปันผลสูงสม่ำเสมอและผันผวนต่ำ",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 4.85, growth: 0,
    assetType: "ETF", currency: "USD", fundType: "กองทุน ETF ต่างประเทศ (Covered Call Income)",
    feederFund: "ไม่มี (ลงทุนตรงและตราสาร ELNs)", masterFund: "Nasdaq-100 Index Covered Call", aum: 14500, expenseRatio: 0.35, riskLevel: 6,
    topHoldings: [
      { name: "Microsoft Corp (MSFT)", weight: 8.5 },
      { name: "Apple Inc (AAPL)", weight: 7.2 },
      { name: "NVIDIA Corp (NVDA)", weight: 6.8 },
      { name: "Amazon.com Inc (AMZN)", weight: 4.5 },
      { name: "Alphabet Inc (GOOGL)", weight: 3.8 }
    ]
  },
  {
    symbol: "XLE", name: "กองทุนเปิด Energy Select Sector SPDR Fund", enName: "Energy Select Sector SPDR Fund",
    sector: "กองทุนรวมดัชนี", market: "MUTUAL_FUND", price: 94.50, prevClose: 94.10, shares: 1500, color: "#003B72",
    about: "กองทุน ETF กลุ่มพลังงานที่ใหญ่ที่สุดของสหรัฐฯ ลงทุนในบริษัทพลังงานชั้นนำในดัชนี S&P 500 เช่น Exxon Mobil และ Chevron เพื่อล้อตามความร้อนแรงของราคาพลังงานโลก",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 3.12, growth: 0,
    assetType: "ETF", currency: "USD", fundType: "กองทุน ETF ต่างประเทศกลุ่มพลังงาน (Energy Equity)",
    feederFund: "ไม่มี (ลงทุนตรงในหุ้นกลุ่มพลังงาน S&P 500)", masterFund: "Energy Select Sector Index", aum: 38500, expenseRatio: 0.10, riskLevel: 7,
    topHoldings: [
      { name: "Exxon Mobil Corp (XOM)", weight: 22.5 },
      { name: "Chevron Corp (CVX)", weight: 16.8 },
      { name: "ConocoPhillips (COP)", weight: 8.5 },
      { name: "EOG Resources Inc", weight: 4.8 },
      { name: "Schlumberger NV", weight: 4.2 }
    ]
  },
  {
    symbol: "IGF", name: "กองทุนเปิด iShares Global Infrastructure ETF", enName: "iShares Global Infrastructure ETF",
    sector: "กองทุนรวมดัชนี", market: "MUTUAL_FUND", price: 48.20, prevClose: 47.95, shares: 1800, color: "#0080FF",
    about: "กองทุน ETF ดัชนีโครงสร้างพื้นฐานระดับโลกที่ใหญ่ที่สุด ลงทุนในบริษัทพลังงาน ขนส่ง สาธารณูปโภค และระบบคมนาคมในกลุ่มประเทศพัฒนาแล้วเพื่อสร้างรายได้ปันผลสม่ำเสมอและมั่นคงสูง",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 1.88, growth: 0,
    assetType: "ETF", currency: "USD", fundType: "กองทุน ETF ต่างประเทศกลุ่มโครงสร้างพื้นฐาน (Infrastructure)",
    feederFund: "ไม่มี (ลงทุนตรงในโครงสร้างพื้นฐานโลก)", masterFund: "S&P Global Infrastructure Index", aum: 3600, expenseRatio: 0.47, riskLevel: 6,
    topHoldings: [
      { name: "NextEra Energy Inc (NEE)", weight: 5.2 },
      { name: "Enbridge Inc (ENB)", weight: 4.8 },
      { name: "Transurban Group (TCL)", weight: 4.5 },
      { name: "Iberdrola SA (IBE)", weight: 4.2 },
      { name: "Aena SME SA (AENA)", weight: 3.8 }
    ]
  },
  {
    symbol: "VOO", name: "กองทุนดัชนีสหรัฐ Vanguard S&P 500 ETF", enName: "Vanguard S&P 500 ETF",
    sector: "กองทุนรวมดัชนี", market: "MUTUAL_FUND", price: 478.50, prevClose: 476.00, shares: 850, color: "#D22630",
    about: "กองทุน ETF จำลองดัชนี S&P 500 ของ Vanguard ที่มีค่าธรรมเนียมการจัดการต่ำมากเป็นพิเศษ (0.03%) ยอดนิยมในกลุ่มนักลงทุนระยะยาว",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 1.58, growth: 0,
    assetType: "ETF", currency: "USD", fundType: "กองทุน ETF ต่างประเทศ (Passive S&P 500)",
    feederFund: "ไม่มี (ลงทุนตรง)", masterFund: "S&P 500 Index", aum: 1050000, expenseRatio: 0.03, riskLevel: 6,
    topHoldings: [
      { name: "Microsoft Corp (MSFT)", weight: 7.1 },
      { name: "Apple Inc (AAPL)", weight: 6.2 },
      { name: "NVIDIA Corp (NVDA)", weight: 5.0 },
      { name: "Amazon.com Inc (AMZN)", weight: 3.8 },
      { name: "Meta Platforms (META)", weight: 2.5 }
    ]
  },
  {
    symbol: "IVV", name: "กองทุนดัชนีสหรัฐ iShares Core S&P 500 ETF", enName: "iShares Core S&P 500 ETF",
    sector: "กองทุนรวมดัชนี", market: "MUTUAL_FUND", price: 480.20, prevClose: 478.00, shares: 800, color: "#000000",
    about: "กองทุน ETF อิงดัชนี S&P 500 จากค่าย BlackRock (iShares) เน้นประสิทธิภาพสูงสุดในการเลียนแบบดัชนีและมีสภาพคล่องสูงมาก",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 1.60, growth: 0,
    assetType: "ETF", currency: "USD", fundType: "กองทุน ETF ต่างประเทศ (Passive S&P 500)",
    feederFund: "ไม่มี (ลงทุนตรง)", masterFund: "S&P 500 Index", aum: 440000, expenseRatio: 0.03, riskLevel: 6,
    topHoldings: [
      { name: "Microsoft Corp", weight: 7.1 },
      { name: "Apple Inc", weight: 6.2 },
      { name: "NVIDIA Corp", weight: 5.0 },
      { name: "Amazon.com Inc", weight: 3.8 },
      { name: "Meta Platforms Inc", weight: 2.5 }
    ]
  },
  {
    symbol: "VEA", name: "กองทุน Vanguard หุ้นต่างประเทศพัฒนาแล้ว ETF", enName: "Vanguard FTSE Developed Markets ETF",
    sector: "กองทุนรวมต่างประเทศ", market: "MUTUAL_FUND", price: 48.50, prevClose: 48.10, shares: 1200, color: "#9E1B22",
    about: "ลงทุน in หุ้นขนาดใหญ่และกลางของประเทศพัฒนาแล้วนอกสหรัฐฯ เช่น ยุโรป ญี่ปุ่น แคนาดา เพื่อกระจายความเสี่ยงทางภูมิศาสตร์และค่าเงิน",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 1.48, growth: 0,
    assetType: "ETF", currency: "USD", fundType: "กองทุน ETF ต่างประเทศ (ตลาดพัฒนาแล้วไม่รวมสหรัฐฯ)",
    feederFund: "ไม่มี (ลงทุนตรง)", masterFund: "FTSE Developed All Cap ex US Index", aum: 125000, expenseRatio: 0.05, riskLevel: 6,
    topHoldings: [
      { name: "ASML Holding NV", weight: 2.3 },
      { name: "Nestle SA", weight: 1.8 },
      { name: "Novo Nordisk A/S", weight: 1.7 },
      { name: "Toyota Motor Corp", weight: 1.5 },
      { name: "LVMH Moet Hennessy", weight: 1.2 }
    ]
  },
  {
    symbol: "VWO", name: "กองทุน Vanguard หุ้นตลาดเกิดใหม่ ETF", enName: "Vanguard FTSE Emerging Markets ETF",
    sector: "กองทุนรวมต่างประเทศ", market: "MUTUAL_FUND", price: 41.80, prevClose: 41.50, shares: 1500, color: "#E51A22",
    about: "เน้นลงทุนในกลุ่มประเทศตลาดเกิดใหม่ เช่น จีน อินเดีย ไต้หวัน บราซิล แอฟริกาใต้ เพื่อคว้าโอกาสเติบโตสูงในระยะยาวตามทิศทางเศรษฐกิจโลกใหม่",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 1.24, growth: 0,
    assetType: "ETF", currency: "USD", fundType: "กองทุน ETF ต่างประเทศ (ตลาดเกิดใหม่)",
    feederFund: "ไม่มี (ลงทุนตรง)", masterFund: "FTSE Emerging All Cap Index", aum: 75000, expenseRatio: 0.08, riskLevel: 7,
    topHoldings: [
      { name: "Taiwan Semiconductor (TSMC)", weight: 8.5 },
      { name: "Tencent Holdings Ltd", weight: 3.8 },
      { name: "Alibaba Group Holding", weight: 2.5 },
      { name: "Reliance Industries Ltd", weight: 1.8 },
      { name: "Infosys Ltd", weight: 1.3 }
    ]
  },
  {
    symbol: "SCBSET50", name: "กองทุนเปิดไทยพาณิชย์ SET50 INDEX", enName: "SCB SET50 INDEX OPEN-ENDED FUND",
    sector: "กองทุนรวมดัชนี", market: "MUTUAL_FUND", price: 15.2345, prevClose: 15.1500, shares: 350, color: "#4E2E7F",
    about: "กองทุนดัชนีหุ้นไทยขนาดใหญ่ 50 ตัว ช่วยสร้างผลตอบแทนสอดคล้องการเติบโตทางเศรษฐกิจของประเทศไทยโดยรวม",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0,
    assetType: "FUND", currency: "THB", fundType: "กองทุนรวมตราสารทุนไทย (Passive Index)",
    feederFund: "ไม่มี (ลงทุนตรงใน SET50)", masterFund: "ดัชนี SET50", aum: 5320, expenseRatio: 0.45, riskLevel: 6,
    topHoldings: [
      { name: "PTT Public Company Limited", weight: 9.2 },
      { name: "Airports of Thailand (AOT)", weight: 7.8 },
      { name: "DELTA Electronics (Thailand)", weight: 7.1 },
      { name: "CP ALL Public Company", weight: 6.5 },
      { name: "Gulf Energy Development", weight: 5.2 }
    ]
  },
  {
    symbol: "K-USA-A", name: "กองทุนเปิดเค ยูเอสเอ หุ้นทุน-A", enName: "K USA Equity Fund - A",
    sector: "กองทุนรวมต่างประเทศ", market: "MUTUAL_FUND", price: 23.4567, prevClose: 23.6000, shares: 200, color: "#138F2D",
    about: "กองทุนรวมฟีดเดอร์ที่ไปลงทุนต่อใน Morgan Stanley US Advantage Fund หุ้นนอกเป้าหมายเติบโตสูงและนวัตกรรมจัดเต็ม",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0,
    assetType: "FUND", currency: "THB", fundType: "กองทุนรวมตราสารทุนต่างประเทศ (Feeder Fund)",
    feederFund: "Morgan Stanley US Advantage Fund (Master Fund)", masterFund: "Morgan Stanley US Advantage Fund", aum: 4890, expenseRatio: 1.62, riskLevel: 6,
    topHoldings: [
      { name: "Amazon.com Inc", weight: 8.9 },
      { name: "Microsoft Corp", weight: 8.4 },
      { name: "NVIDIA Corp", weight: 7.8 },
      { name: "Uber Technologies", weight: 5.2 },
      { name: "Meta Platforms Inc", weight: 4.9 }
    ]
  },
  {
    symbol: "B-INNOTECH", name: "กองทุนเปิดบัวหลวงโกลบอลอินโนเวชั่น", enName: "Bualuang Global Innovation Fund",
    sector: "กองทุนรวมต่างประเทศ", market: "MUTUAL_FUND", price: 18.9102, prevClose: 18.7500, shares: 450, color: "#004785",
    about: "เน้นการลงทุนในหลักทรัพย์เทคโนโลยีโลกผ่าน Fidelity Global Technology Fund จับเทรนด์ Semiconductors และเทคโนโลยีดิสรัปทีฟ",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0,
    assetType: "FUND", currency: "THB", fundType: "กองทุนรวมตราสารทุนต่างประเทศเฉพาะกลุ่มอุตสาหกรรม",
    feederFund: "Fidelity Funds - Global Technology Fund (Master Fund)", masterFund: "Fidelity Funds - Global Technology Fund", aum: 8120, expenseRatio: 1.55, riskLevel: 7,
    topHoldings: [
      { name: "Microsoft Corp", weight: 9.5 },
      { name: "Apple Inc", weight: 9.1 },
      { name: "NVIDIA Corp", weight: 8.3 },
      { name: "Taiwan Semiconductor (TSMC)", weight: 5.6 },
      { name: "ASML Holding NV", weight: 4.8 }
    ]
  },
  {
    symbol: "K-STAR-A", name: "กองทุนเปิดเค สตาร์ หุ้นทุน-A", enName: "K Star Active Equity Fund - A",
    sector: "กองทุนรวมตราสารทุน", market: "MUTUAL_FUND", price: 14.5678, prevClose: 14.4800, shares: 350, color: "#138F2D",
    about: "กองทุนหุ้นไทยบริหารเชิงรุก มุ่งเน้นคัดเลือกหุ้นที่มีปัจจัยพื้นฐานดีและเติบโตสูงในตลาดหลักทรัพย์แห่งประเทศไทยเพื่อสร้างผลตอบแทนชนะดัชนีอ้างอิง",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0,
    assetType: "FUND", currency: "THB", fundType: "กองทุนรวมตราสารทุนไทย (Active Management)",
    feederFund: "ไม่มี (ลงทุนตรงในหุ้นไทย)", masterFund: "ดัชนี SET TRI", aum: 4500, expenseRatio: 1.60, riskLevel: 6,
    topHoldings: [
      { name: "PTT Public Company Limited", weight: 8.5 },
      { name: "CP ALL Public Company", weight: 7.2 },
      { name: "Bangkok Dusit Medical Services (BDMS)", weight: 6.5 },
      { name: "Airports of Thailand (AOT)", weight: 5.8 },
      { name: "SCB X Public Company", weight: 5.2 }
    ]
  },
  {
    symbol: "B-ACTIVE", name: "กองทุนเปิดบัวหลวงแอคทีฟโฮลด์สกรีน", enName: "Bualuang Active Equity Fund",
    sector: "กองทุนรวมตราสารทุน", market: "MUTUAL_FUND", price: 28.1234, prevClose: 27.9500, shares: 280, color: "#004785",
    about: "เน้นคัดเลือกหุ้นไทยที่มีระดับมูลค่าน่าสนใจและศักยภาพการแข่งขันสูง โดยใช้การบริหารพอร์ตเชิงรุกเพื่อสร้างความยืดหยุ่นในทุกสภาวะตลาดการเงิน",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0,
    assetType: "FUND", currency: "THB", fundType: "กองทุนรวมตราสารทุนไทย (Active Management)",
    feederFund: "ไม่มี (ลงทุนตรงในหุ้นไทย)", masterFund: "ดัชนี SET TRI", aum: 3200, expenseRatio: 1.50, riskLevel: 6,
    topHoldings: [
      { name: "Kasikornbank (KBANK)", weight: 7.8 },
      { name: "Advanced Info Service (ADVANC)", weight: 6.9 },
      { name: "Siam Cement Group (SCC)", weight: 6.1 },
      { name: "Gulf Energy Development", weight: 5.5 },
      { name: "Central Pattana (CPN)", weight: 4.8 }
    ]
  },
  {
    symbol: "SCBSESTE", name: "กองทุนเปิดไทยพาณิชย์ยั่งยืน ESG", enName: "SCB Sustainable Equity Fund",
    sector: "กองทุนรวมตราสารทุน", market: "MUTUAL_FUND", price: 11.8976, prevClose: 11.8200, shares: 420, color: "#4E2E7F",
    about: "เน้นการลงทุนในบริษัทชั้นนำของไทยที่มีการจัดการสิ่งแวดล้อม สังคม และบรรษัทภิบาล (ESG) ยอดเยี่ยม เพื่อผลตอบแทนยั่งยืนในระยะยาวสำหรับทุกคน",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0,
    assetType: "FUND", currency: "THB", fundType: "กองทุนรวมตราสารทุนไทย (ESG / Sustainable)",
    feederFund: "ไม่มี (ลงทุนตรงในหุ้นไทย ESG)", masterFund: "ดัชนี SET ESG Ratings", aum: 2800, expenseRatio: 1.45, riskLevel: 6,
    topHoldings: [
      { name: "DELTA Electronics (Thailand)", weight: 8.2 },
      { name: "Krung Thai Bank (KTB)", weight: 7.0 },
      { name: "Global Power Synergy (GPSC)", weight: 6.2 },
      { name: "Central Pattana (CPN)", weight: 5.9 },
      { name: "Bangkok Dusit Medical Services (BDMS)", weight: 5.1 }
    ]
  },
  // ==== 🇺🇸 กองทุนรวมสหรัฐอเมริกา (US Mutual Funds) ====
  {
    symbol: "VTSAX", name: "กองทุนดัชนีตลาดหุ้นรวมสหรัฐฯ Vanguard", enName: "Vanguard Total Stock Market Index Fund",
    sector: "กองทุนรวมดัชนี", market: "MUTUAL_FUND", price: 128.50, prevClose: 127.90, shares: 800, color: "#D22630",
    about: "กองทุนรวมดัชนีขนาดใหญ่ที่สุดในโลกของ Vanguard มุ่งลงทุนในหุ้นสหรัฐอเมริกาครบทุกขนาด (Large, Mid, Small Cap) ครอบคลุมทั้งตลาดเพื่อสร้างผลตอบแทนสอดคล้องกับดัชนี CRSP US Total Market Index",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0.08,
    assetType: "US_FUND", currency: "USD", fundType: "กองทุนรวมตราสารทุนต่างประเทศ (US Index Fund)",
    feederFund: "ไม่มี (ลงทุนตรงในตะกร้าหุ้นสหรัฐฯ)", masterFund: "Vanguard Total Stock Market Index Fund", aum: 1350000, expenseRatio: 0.04, riskLevel: 6,
    topHoldings: [
      { name: "Microsoft Corp", weight: 6.8 },
      { name: "Apple Inc", weight: 6.2 },
      { name: "NVIDIA Corp", weight: 5.5 },
      { name: "Amazon.com Inc", weight: 3.8 },
      { name: "Meta Platforms", weight: 2.4 }
    ]
  },
  {
    symbol: "VFIAX", name: "กองทุนดัชนี Vanguard S&P 500", enName: "Vanguard 500 Index Fund Admiral Shares",
    sector: "กองทุนรวมดัชนี", market: "MUTUAL_FUND", price: 485.20, prevClose: 486.10, shares: 600, color: "#9E1B22",
    about: "กองทุนรวมดัชนี S&P 500 ยอดนิยมของ Vanguard เน้นการลงทุนในบริษัทขนาดใหญ่ที่เป็นผู้นำอุตสาหกรรมในตลาดสหรัฐอเมริกา 500 บริษัทแรก มีค่าธรรมเนียมต่ำมากและประสิทธิภาพการเลียนแบบดัชนีสูงสุด",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0.08,
    assetType: "US_FUND", currency: "USD", fundType: "กองทุนรวมตราสารทุนต่างประเทศ (US S&P 500 Index)",
    feederFund: "ไม่มี (ลงทุนตรงใน S&P 500)", masterFund: "Vanguard 500 Index Fund", aum: 1120000, expenseRatio: 0.04, riskLevel: 6,
    topHoldings: [
      { name: "Microsoft Corp", weight: 7.2 },
      { name: "Apple Inc", weight: 6.5 },
      { name: "NVIDIA Corp", weight: 5.9 },
      { name: "Amazon.com Inc", weight: 4.0 },
      { name: "Alphabet Inc", weight: 2.7 }
    ]
  },
  {
    symbol: "AGTHX", name: "กองทุนเติบโตเชิงรุกสหรัฐฯ American Funds", enName: "American Funds Growth Fund of America",
    sector: "กองทุนรวมต่างประเทศ", market: "MUTUAL_FUND", price: 72.85, prevClose: 72.10, shares: 900, color: "#0D5C75",
    about: "หนึ่งในกองทุนรวมแบบ Active Growth ขนาดใหญ่ที่สุดในโลก บริหารโดย Capital Group มุ่งเน้นการเติบโตของเงินลงทุนระยะยาว in หุ้นเติบโตชั้นนำที่มีความมั่นคงทางการเงินสูงและแนวโน้มขยายตัวดีเยี่ยมในสหรัฐฯ",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0.10,
    assetType: "US_FUND", currency: "USD", fundType: "กองทุนรวมตราสารทุนต่างประเทศ (US Active Growth)",
    feederFund: "ไม่มี (บริหารเชิงรุกโดย Capital Group)", masterFund: "The Growth Fund of America", aum: 260000, expenseRatio: 0.61, riskLevel: 7,
    topHoldings: [
      { name: "Broadcom Inc", weight: 8.1 },
      { name: "Microsoft Corp", weight: 7.5 },
      { name: "NVIDIA Corp", weight: 6.8 },
      { name: "Meta Platforms", weight: 5.4 },
      { name: "Eli Lilly & Co", weight: 4.2 }
    ]
  },
  {
    symbol: "FCNTX", name: "กองทุนเติบโตเชิงรุก Fidelity Contrafund", enName: "Fidelity Contrafund",
    sector: "กองทุนรวมต่างประเทศ", market: "MUTUAL_FUND", price: 18.25, prevClose: 18.12, shares: 750, color: "#E57200",
    about: "กองทุนรวมบริหารเชิงรุกระดับตำนานของ Fidelity มุ่งเน้นการลงทุนในบริษัทที่ตลาดมองข้ามหรือมีมูลค่าต่ำกว่าพื้นฐาน แต่มีศักยภาพเติบโตสูงและผู้บริหารมีวิสัยทัศน์ดีเยี่ยมในการขับเคลื่อน",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0.09,
    assetType: "US_FUND", currency: "USD", fundType: "กองทุนรวมตราสารทุนต่างประเทศ (US Active Growth / Blend)",
    feederFund: "ไม่มี (บริหารเชิงรุกโดย Fidelity)", masterFund: "Fidelity Contrafund", aum: 140000, expenseRatio: 0.45, riskLevel: 6,
    topHoldings: [
      { name: "Meta Platforms Inc", weight: 10.2 },
      { name: "Berkshire Hathaway Inc", weight: 7.5 },
      { name: "Microsoft Corp", weight: 6.9 },
      { name: "Amazon.com Inc", weight: 5.8 },
      { name: "Apple Inc", weight: 5.2 }
    ]
  },
  {
    symbol: "PRGFX", name: "กองทุนเติบโตสหรัฐฯ T. Rowe Price", enName: "T. Rowe Price Growth Stock Fund",
    sector: "กองทุนรวมต่างประเทศ", market: "MUTUAL_FUND", price: 95.40, prevClose: 94.80, shares: 580, color: "#0D2C54",
    about: "เน้นการลงทุนในบริษัทขนาดใหญ่ของสหรัฐฯ ที่มีศักยภาพเป็นผู้นำตลาด มีรายได้และกำไรเติบโตอย่างรวดเร็วและยั่งยืนเหนือค่าเฉลี่ยของอุตสาหกรรมในยุคดิจิทัล",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0.11,
    assetType: "US_FUND", currency: "USD", fundType: "กองทุนรวมตราสารทุนต่างประเทศ (US Large Cap Growth)",
    feederFund: "ไม่มี (บริหารเชิงรุกโดย T. Rowe Price)", masterFund: "T. Rowe Price Growth Stock Fund", aum: 58000, expenseRatio: 0.64, riskLevel: 7,
    topHoldings: [
      { name: "Microsoft Corp", weight: 11.5 },
      { name: "NVIDIA Corp", weight: 9.8 },
      { name: "Apple Inc", weight: 8.4 },
      { name: "Amazon.com Inc", weight: 7.2 },
      { name: "Alphabet Inc", weight: 6.0 }
    ]
  },
  {
    symbol: "FBALX", name: "กองทุนผสมสมดุลสหรัฐฯ Fidelity Balanced Fund", enName: "Fidelity Balanced Fund",
    sector: "กองทุนรวมผสม", market: "MUTUAL_FUND", price: 32.60, prevClose: 32.45, shares: 980, color: "#1F4E5B",
    about: "เน้นกลยุทธ์จัดสรรสินทรัพย์แบบสมดุล (Balanced Fund) โดยแบ่งสัดส่วนการลงทุนประมาณ 60% ในตราสารทุน และ 40% ในตราสารหนี้คุณภาพสูงเพื่อควบคุมความเสี่ยงของพอร์ต",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0.06,
    assetType: "US_FUND", currency: "USD", fundType: "กองทุนรวมผสมแบบสมดุล (US Asset Allocation)",
    feederFund: "ไม่มี (บริหารเชิงรุกโดย Fidelity)", masterFund: "Fidelity Balanced Fund", aum: 45000, expenseRatio: 0.48, riskLevel: 5,
    topHoldings: [
      { name: "Microsoft Corp", weight: 4.5 },
      { name: "Apple Inc", weight: 3.8 },
      { name: "U.S. Treasury Bond 4.0%", weight: 3.2 },
      { name: "NVIDIA Corp", weight: 2.8 },
      { name: "Amazon.com Inc", weight: 2.2 }
    ]
  },
  // ==== 🪙 สินทรัพย์ดิจิทัล (Cryptocurrencies) ====
  {
    symbol: "BTC", name: "บิตคอยน์ (Bitcoin)", enName: "Bitcoin",
    sector: "เทคโนโลยี", market: "NASDAQ", price: 67500, prevClose: 67200, shares: 21, color: "#F7931A",
    about: "ทองคำดิจิทัล (Digital Gold) สินทรัพย์ทางเลือกที่มีอุปทานจำกัดเพียง 21 ล้านเหรียญทั่วโลก ได้รับการยอมรับจากสถาบันการเงินชั้นนำในการกระจายความเสี่ยงพอร์ต",
    revenue: 12000, netIncome: 4500, equity: 85000, fcf: 6500, ebitda: 8000, totalDebt: 0, cash: 12000, dps: 0, growth: 0.15,
    assetType: "CRYPTO", currency: "USD",
    cryptoCirculating: "19.7M BTC", cryptoConsensus: "Proof of Work (PoW)"
  },
  {
    symbol: "ETH", name: "อีเธอเรียม (Ethereum)", enName: "Ethereum",
    sector: "เทคโนโลยี", market: "NASDAQ", price: 3450, prevClose: 3480, shares: 120, color: "#627EEA",
    about: "เครือข่ายบล็อกเชนแบบสัญญาอัจฉริยะ (Smart Contracts) อเนกประสงค์ที่เป็นรากฐานของระบบการเงินไร้ศูนย์กลาง (DeFi) และ Tokenization ทั่วโลก",
    revenue: 4800, netIncome: 1800, equity: 32000, fcf: 2100, ebitda: 2800, totalDebt: 0, cash: 4800, dps: 0, growth: 0.18,
    assetType: "CRYPTO", currency: "USD",
    cryptoCirculating: "120M ETH", cryptoConsensus: "Proof of Stake (PoS)"
  },
  {
    symbol: "SOL", name: "โซลานา (Solana)", enName: "Solana",
    sector: "เทคโนโลยี", market: "NASDAQ", price: 165.50, prevClose: 162.00, shares: 440, color: "#14F195",
    about: "แพลตฟอร์มบล็อกเชนประสิทธิภาพสูง โดดเด่นด้านความเร็วในการทำธุรกรรมที่รวดเร็วและค่าธรรมเนียมต่ำมาก เหมาะสำหรับการใช้งาน Web3, NFTs และ dApps ขนาดใหญ่ของคนรุ่นใหม่",
    revenue: 250, netIncome: 80, equity: 4200, fcf: 110, ebitda: 150, totalDebt: 0, cash: 450, dps: 0, growth: 0.25,
    assetType: "CRYPTO", currency: "USD",
    cryptoCirculating: "460M SOL", cryptoConsensus: "Proof of History (PoH) / PoS"
  },
  {
    symbol: "USDT", name: "เทเธอร์ (Tether)", enName: "Tether",
    sector: "เทคโนโลยี", market: "NASDAQ", price: 1.00, prevClose: 1.00, shares: 110000, color: "#26A17B",
    about: "เหรียญสเตเบิลคอยน์ (Stablecoin) ที่มีขนาดมูลค่าตลาดใหญ่ที่สุดในโลก ตรึงมูลค่าแบบ 1:1 กับดอลลาร์สหรัฐ โดยมีหลักประกันทางการเงินสำรองหนุนหลังเต็มจำนวนเพื่อเสถียรภาพสูงสุด",
    revenue: 6200, netIncome: 5500, equity: 8200, fcf: 5800, ebitda: 6000, totalDebt: 0, cash: 8500, dps: 0, growth: 0.05,
    assetType: "CRYPTO", currency: "USD",
    cryptoCirculating: "110B USDT", cryptoConsensus: "Multi-Chain (ERC-20/TRC-20)"
  },
  {
    symbol: "BNB", name: "บีเอ็นบี (BNB)", enName: "BNB",
    sector: "เทคโนโลยี", market: "NASDAQ", price: 580.40, prevClose: 575.20, shares: 147, color: "#F3BA2F",
    about: "โทเคนหลักในระบบนิเวศ BNB Chain และศูนย์ซื้อขายสินทรัพย์ดิจิทัลอันดับหนึ่งของโลกอย่าง Binance ใช้สำหรับชำระค่าธรรมเนียม ขับเคลื่อน DApps และเข้าร่วมกิจกรรมการเงินต่างๆ",
    revenue: 1800, netIncome: 1200, equity: 9500, fcf: 1300, ebitda: 1450, totalDebt: 0, cash: 2200, dps: 0, growth: 0.12,
    assetType: "CRYPTO", currency: "USD",
    cryptoCirculating: "147M BNB", cryptoConsensus: "Proof of Staked Authority (PoSA)"
  },
  // ==== 📊 สัญญาซื้อขายล่วงหน้า (Futures & Commodities) ====
  {
    symbol: "GOLD", name: "สัญญาซื้อขายทองคำล่วงหน้า", enName: "Gold Futures",
    sector: "กองทุนรวมสินค้าโภคภัณฑ์", market: "NYSE", price: 2340, prevClose: 2330, shares: 100, color: "#D4AF37",
    about: "สัญญาซื้อขายล่วงหน้าทองคำเกณฑ์มาตรฐานเพื่อการป้องกันความเสี่ยง (Hedging) จากอัตราเงินเฟ้อและความผันผวนทางภูมิรัฐศาสตร์โลก",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0.05,
    assetType: "FUTURES", currency: "USD",
    contractSize: "100 Troy Ounces", initialMargin: 8500, leverage: 15, expiryDate: "Dec 2026", tickSize: "0.10 USD"
  },
  {
    symbol: "OIL", name: "สัญญาน้ำมันดิบเบรนท์ล่วงหน้า", enName: "Brent Crude Futures",
    sector: "กองทุนรวมสินค้าโภคภัณฑ์", market: "NYSE", price: 82.50, prevClose: 83.10, shares: 50, color: "#333333",
    about: "สัญญาน้ำมันดิบล่วงหน้าเกณฑ์มาตรฐานยุโรป ตัวชี้วัดต้นทุนพลังงานของภาคอุตสาหกรรมทั่วโลกและความตึงเครียดทางเศรษฐกิจ",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0.03,
    assetType: "FUTURES", currency: "USD",
    contractSize: "1,000 Barrels", initialMargin: 6200, leverage: 10, expiryDate: "Sep 2026", tickSize: "0.01 USD"
  },
  {
    symbol: "SILVER", name: "สัญญาซื้อขายโลหะเงินล่วงหน้า", enName: "Silver Futures",
    sector: "กองทุนรวมสินค้าโภคภัณฑ์", market: "NYSE", price: 29.50, prevClose: 29.20, shares: 100, color: "#C0C0C0",
    about: "สัญญาซื้อขายแร่เงินล่วงหน้า มีความสำคัญทั้งในฐานะโลหะมีค่าเพื่อการปกป้องความเสี่ยงและวัตถุดิบทางอุตสาหกรรมเทคโนโลยี รวมถึงพลังงานหมุนเวียน",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0.05,
    assetType: "FUTURES", currency: "USD",
    contractSize: "5,000 Troy Ounces", initialMargin: 9500, leverage: 15, expiryDate: "Dec 2026", tickSize: "0.005 USD"
  },
  {
    symbol: "COPPER", name: "สัญญาซื้อขายทองแดงล่วงหน้า", enName: "Copper Futures",
    sector: "กองทุนรวมสินค้าโภคภัณฑ์", market: "NYSE", price: 4.65, prevClose: 4.62, shares: 100, color: "#B87333",
    about: "สัญญาซื้อขายทองแดงล่วงหน้า สินค้าโภคภัณฑ์ที่เป็นตัวดัชนีชี้วัดเศรษฐกิจโลกเนื่องจากใช้แพร่หลายในงานวิศวกรรมไฟฟ้า ก่อสร้าง และยานยนต์ไฟฟ้า",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0.04,
    assetType: "FUTURES", currency: "USD",
    contractSize: "25,000 Pounds", initialMargin: 6100, leverage: 18, expiryDate: "Oct 2026", tickSize: "0.0005 USD"
  },
  {
    symbol: "GAS", name: "สัญญาซื้อขายก๊าซธรรมชาติล่วงหน้า", enName: "Natural Gas Futures",
    sector: "กองทุนรวมสินค้าโภคภัณฑ์", market: "NYSE", price: 2.45, prevClose: 2.50, shares: 100, color: "#4A90E2",
    about: "สัญญาซื้อขายก๊าซธรรมชาติล่วงหน้า แหล่งพลังงานสำคัญสำหรับผลิตกระแสไฟฟ้าและทำความร้อนในภาคครัวเรือนและโรงงานอุตสาหกรรมในทวีปอเมริกาและยุโรป",
    revenue: 0, netIncome: 0, equity: 0, fcf: 0, ebitda: 0, totalDebt: 0, cash: 0, dps: 0, growth: 0.04,
    assetType: "FUTURES", currency: "USD",
    contractSize: "10,000 MMBtu", initialMargin: 4200, leverage: 12, expiryDate: "Nov 2026", tickSize: "0.001 USD"
  }
];

export const STOCKS: Stock[] = RAW.map(build);

export function getStock(symbol: string): Stock | undefined {
  const found = STOCKS.find((s) => s.symbol.toLowerCase() === symbol.toLowerCase());
  if (found) return found;

  const sym = symbol.toUpperCase().trim();
  if (!sym) return undefined;

  let assetType: AssetType = "TH_STOCK";
  let market: Stock["market"] = "SET";
  let currency: Stock["currency"] = "THB";
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

  const isUSFund = (sym.length === 5 && sym.endsWith("X")) || sym.includes("VANGUARD") || sym.includes("FIDELITY") || sym.includes("AMERICAN");
  const isFund = sym.includes("-") || sym.includes("SET") || sym.startsWith("SCB") || sym.startsWith("K-") || sym.startsWith("B-") || sym.startsWith("TMB") || sym.startsWith("ONE-") || sym.startsWith("UOB") || sym.startsWith("KF") || sym.startsWith("LH") || sym.startsWith("ASP") || sym.startsWith("PRINCIPAL") || sym.startsWith("KT-") || sym.startsWith("TTB");
  const isUS = sym.length <= 4 && /^[A-Z]+$/.test(sym);

  if (isUSFund) {
    assetType = "US_FUND";
    market = "MUTUAL_FUND";
    currency = "USD";
    name = `กองทุนรวมสหรัฐฯ ${sym}`;
    enName = `${sym} US Mutual Fund`;
    sector = "กองทุนรวมต่างประเทศ";
    price = 50.0 + ((sym.charCodeAt(0) * 13) % 250);
    color = "#EC4899"; // Premium pink
    about = `กองทุนรวมสหรัฐอเมริกา ${sym} เป็นกองทุนจำลองเพื่อเพิ่มการเข้าถึงข้อมูลกองทุนรวมสากลสำหรับนักลงทุนไทย โดยแสดงสัญญลักษณ์และราคา NAV จำลอง`;
    fundType = "กองทุนรวมตราสารทุนต่างประเทศ (US Mutual Fund)";
    masterFund = `${sym} Master Fund`;
    feederFund = "ไม่มี (ลงทุนตรง)";
    aum = 1000 + ((sym.charCodeAt(0) * 89) % 50000);
    expenseRatio = 0.05 + ((sym.charCodeAt(0) * 0.02) % 0.8);
    riskLevel = 6;
    topHoldings = [
      { name: "Microsoft Corp (MSFT)", weight: 8.5 },
      { name: "Apple Inc (AAPL)", weight: 7.9 },
      { name: "NVIDIA Corp (NVDA)", weight: 7.5 },
      { name: "Amazon.com Inc (AMZN)", weight: 4.8 },
      { name: "Meta Platforms (META)", weight: 4.2 },
    ];
  } else if (isFund) {
    assetType = "FUND";
    market = "MUTUAL_FUND";
    currency = "THB";
    name = `กองทุนเปิด ${sym}`;
    enName = `${sym} Open-Ended Mutual Fund`;
    sector = "กองทุนรวมต่างประเทศ";
    price = 12.3456 + ((sym.charCodeAt(0) * 7) % 25);
    color = "#8B5CF6";
    about = `กองทุนรวม ${sym} เป็นกองทุนจำลองเพื่อเพิ่มการเข้าถึงข้อมูลกองทุนรวมสำหรับนักลงทุนไทย โดยนำเสนอราคา NAV ย้อนหลัง ข้อมูล Master Fund และพอร์ตการถือครองสินทรัพย์`;
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
  } else if (isUS) {
    assetType = "US_STOCK";
    market = "NASDAQ";
    currency = "USD";
    name = `บริษัท ${sym} (สหรัฐอเมริกา)`;
    enName = `${sym} Corporation Inc.`;
    sector = "เทคโนโลยี";
    price = 80.0 + ((sym.charCodeAt(0) * 11) % 450);
    color = "#2563EB";
    about = `บริษัท ${sym} จดทะเบียนซื้อขายในตลาดหลักทรัพย์สหรัฐอเมริกา มีมูลค่าหลักทรัพย์ระดับสูงและสร้างกระแสเงินสดต่อเนื่อง`;
  } else {
    assetType = "TH_STOCK";
    market = "SET";
    currency = "THB";
    name = `บริษัท ${sym} จำกัด (มหาชน)`;
    enName = `${sym} Public Company Limited`;
    sector = "พลังงาน";
    price = 12.0 + ((sym.charCodeAt(0) * 3) % 180);
    color = "#F59E0B";
    about = `บริษัท ${sym} จำกัด (มหาชน) จดทะเบียนซื้อขายในตลาดหลักทรัพย์แห่งประเทศไทย (SET) ให้บริการและดำเนินธุรกิจที่เป็นเสาหลักของเศรษฐกิจไทย`;
  }

  const shares = 100 + ((sym.charCodeAt(0) * 5) % 2500);
  const raw: Raw = {
    symbol: sym,
    name,
    enName,
    sector,
    market,
    price,
    prevClose: price * 0.99,
    shares,
    color,
    about,
    revenue: price * shares * 1.6,
    netIncome: price * shares * 0.18,
    equity: price * shares * 0.9,
    fcf: price * shares * 0.14,
    ebitda: price * shares * 0.28,
    totalDebt: price * shares * 0.35,
    cash: price * shares * 0.15,
    dps: assetType === "FUND" ? 0 : price * 0.02,
    growth: 0.06 + ((sym.charCodeAt(0) * 3) % 12) / 100,
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

  return build(raw);
}

export const SECTORS: Sector[] = Array.from(
  new Set(STOCKS.map((s) => s.sector))
) as Sector[];

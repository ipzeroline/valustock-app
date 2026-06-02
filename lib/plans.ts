import { Plan, PlanId } from "./types";

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "ฟรี",
    tagline: "เริ่มต้นสำรวจมูลค่าหุ้น",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "ดูข้อมูลหุ้น TH & US ได้ 5 ตัว",
      "อัตราส่วนพื้นฐาน (P/E, P/B, ปันผล, ROA)",
      "ราคาและกราฟราคาย้อนหลัง 3 ปี",
      "บันทึกรายการโปรดได้ 3 ตัว",
    ],
    limits: {
      maxStocks: 5,
      dcf: false,
      screener: false,
      portfolio: false,
      watchlist: 3,
      compare: false,
      exportData: false,
      alerts: false,
      aiInsights: 0,
      scenarioDcf: false,
      alertChannels: [],
      assetClasses: ["TH_STOCK", "US_STOCK"],
    },
  },
  {
    id: "pro",
    name: "โปร",
    tagline: "ข้อมูล REST สำหรับนักลงทุน VI รายวัน",
    priceMonthly: 49,
    priceYearly: 490,
    highlight: true,
    badge: "ยอดนิยม",
    features: [
      "ข้อมูลผ่าน Massive REST API แบบเรียกตามต้องการ",
      "ดูหุ้น TH & US + ETF/กองทุนยอดนิยม",
      "สแกนเนอร์หุ้น undervalue และ dividend",
      "เครื่องคำนวณ DCF & Graham Number",
      "ประวัติราคา/งบย้อนหลังสำหรับวิเคราะห์รายตัว",
      "Watchlist และ Portfolio Tracker ไม่จำกัด",
    ],
    limits: {
      maxStocks: "unlimited",
      dcf: true,
      screener: true,
      portfolio: true,
      watchlist: "unlimited",
      compare: false,
      exportData: false,
      alerts: false,
      aiInsights: 10,
      scenarioDcf: false,
      alertChannels: ["in_app"],
      assetClasses: ["TH_STOCK", "US_STOCK", "FUND", "ETF"],
    },
  },
  {
    id: "premium",
    name: "พรีเมียม",
    tagline: "REST + สัญญาณสดสำหรับพอร์ตจริงจัง",
    priceMonthly: 88,
    priceYearly: 880,
    badge: "คุ้มสุดรายเดือน",
    features: [
      "รวมทุกอย่างในแพ็กเกจโปร",
      "ข้อมูลสินทรัพย์ทุกประเภท รวม Crypto & Futures",
      "รองรับแนวคิด WebSocket สำหรับ dashboard สด",
      "เปรียบเทียบหุ้นหลายตัวพร้อมกัน",
      "ประเมิน DCF หลายสมมติฐาน (Bull/Bear/Base Case)",
      "แจ้งเตือนราคาและ Margin of Safety",
      "ส่งออกข้อมูลทางการเงินเป็นไฟล์ CSV",
    ],
    limits: {
      maxStocks: "unlimited",
      dcf: true,
      screener: true,
      portfolio: true,
      watchlist: "unlimited",
      compare: true,
      exportData: true,
      alerts: true,
      aiInsights: "unlimited",
      scenarioDcf: true,
      alertChannels: ["in_app", "email", "line"],
      assetClasses: ["TH_STOCK", "US_STOCK", "FUND", "ETF", "CRYPTO", "FUTURES"],
    },
  },
  {
    id: "lifetime",
    name: "ตลอดชีพ",
    tagline: "จ่ายครั้งเดียว ใช้เครื่องมือครบระยะยาว",
    priceMonthly: 888,
    priceYearly: 888,
    badge: "จ่ายครั้งเดียว",
    features: [
      "รวมทุกอย่างใน Premium",
      "สิทธิ์ใช้งานตลอดชีพแบบจ่ายครั้งเดียว",
      "Bulk historical workflow อ้างอิง Massive Flat Files",
      "ส่งออก CSV สำหรับ backtest และทำ spreadsheet",
      "Priority support สำหรับตั้งค่าพอร์ตและข้อมูล",
      "เหมาะกับนักลงทุนที่ใช้ต่อเนื่องเกิน 10 เดือน",
    ],
    limits: {
      maxStocks: "unlimited",
      dcf: true,
      screener: true,
      portfolio: true,
      watchlist: "unlimited",
      compare: true,
      exportData: true,
      alerts: true,
      aiInsights: "unlimited",
      scenarioDcf: true,
      alertChannels: ["in_app", "email", "line"],
      assetClasses: ["TH_STOCK", "US_STOCK", "FUND", "ETF", "CRYPTO", "FUTURES"],
    },
  },
];

export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  pro: 1,
  premium: 2,
  lifetime: 3,
};

/** ตรวจว่าแผนปัจจุบันเข้าถึงระดับที่ต้องการได้ไหม */
export function planAllows(current: PlanId, required: PlanId): boolean {
  return PLAN_RANK[current] >= PLAN_RANK[required];
}

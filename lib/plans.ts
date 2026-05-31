import { Plan, PlanId } from "./types";

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "ฟรี",
    tagline: "เริ่มต้นสำรวจมูลค่าหุ้น",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "ดูข้อมูลหุ้นได้ 5 ตัว",
      "อัตราส่วนพื้นฐาน (P/E, P/B, ปันผล)",
      "ราคาและกราฟย้อนหลัง",
      "บันทึกรายการโปรดได้ 3 ตัว",
    ],
    limits: {
      maxStocks: 5,
      dcf: false,
      screener: false,
      watchlist: 3,
      compare: false,
      exportData: false,
      alerts: false,
    },
  },
  {
    id: "pro",
    name: "โปร",
    tagline: "เครื่องมือครบสำหรับนักลงทุนเน้นคุณค่า",
    priceMonthly: 99,
    priceYearly: 990,
    highlight: true,
    badge: "ยอดนิยม",
    features: [
      "ดูหุ้นได้ทั้งหมดในตลาด",
      "เครื่องคำนวณ DCF แบบปรับค่าได้",
      "Graham Number & มูลค่าเหมาะสม",
      "สกรีนเนอร์คัดกรองหุ้นถูก",
      "รายการโปรดไม่จำกัด",
      "อัตราส่วนการเงินครบทุกตัว",
    ],
    limits: {
      maxStocks: "unlimited",
      dcf: true,
      screener: true,
      watchlist: "unlimited",
      compare: false,
      exportData: false,
      alerts: false,
    },
  },
  {
    id: "premium",
    name: "พรีเมียม",
    tagline: "สำหรับมืออาชีพและพอร์ตจริงจัง",
    priceMonthly: 299,
    priceYearly: 2990,
    badge: "ครบทุกฟีเจอร์",
    features: [
      "ทุกอย่างในแพ็กเกจโปร",
      "เปรียบเทียบหุ้นหลายตัวพร้อมกัน",
      "แจ้งเตือนเมื่อราคาต่ำกว่ามูลค่า",
      "ส่งออกข้อมูลเป็น CSV",
      "สมมติฐานการประเมินขั้นสูง",
      "สนับสนุนแบบเร่งด่วน",
    ],
    limits: {
      maxStocks: "unlimited",
      dcf: true,
      screener: true,
      watchlist: "unlimited",
      compare: true,
      exportData: true,
      alerts: true,
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
};

/** ตรวจว่าแผนปัจจุบันเข้าถึงระดับที่ต้องการได้ไหม */
export function planAllows(current: PlanId, required: PlanId): boolean {
  return PLAN_RANK[current] >= PLAN_RANK[required];
}

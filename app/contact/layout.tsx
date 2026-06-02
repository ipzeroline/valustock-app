import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ติดต่อทีมงาน ValuStock | Support เครื่องมือวิเคราะห์หุ้นและ DCF Calculator",
  description:
    "ติดต่อทีมงาน ValuStock สำหรับคำถามเกี่ยวกับการใช้งาน เครื่องมือประเมินมูลค่าหุ้น DCF Calculator แพ็กเกจสมาชิก การชำระเงิน และข้อมูลพอร์ตลงทุน",
  keywords: [
    "ติดต่อ ValuStock",
    "ValuStock support",
    "ติดต่อทีมงานวิเคราะห์หุ้น",
    "สอบถาม DCF Calculator",
    "สอบถามโปรแกรมวิเคราะห์หุ้น",
    "support.valustock@gmail.com",
    "ติดต่อแพลตฟอร์มประเมินมูลค่าหุ้น",
  ],
  alternates: {
    canonical: "https://valustock.com/contact",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/contact",
    title: "ติดต่อทีมงาน ValuStock",
    description:
      "สอบถามการใช้งาน ValuStock, DCF Calculator, Stock Screener, Portfolio Tracker, แพ็กเกจสมาชิก และการชำระเงิน",
    siteName: "ValuStock",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

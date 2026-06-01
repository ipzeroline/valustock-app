import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio Tracker | จัดพอร์ตหุ้น บันทึกซื้อขาย และคำนวณกำไรขาดทุน",
  description:
    "ติดตามพอร์ตหุ้นด้วย Portfolio Tracker บันทึกซื้อขาย คำนวณต้นทุนเฉลี่ย กำไรขาดทุน มูลค่าพอร์ต Backtest และตั้งแจ้งเตือนราคา/Margin of Safety",
  keywords: [
    "portfolio tracker",
    "จัดพอร์ตหุ้น",
    "ติดตามพอร์ตหุ้น",
    "โปรแกรมบันทึกพอร์ตหุ้น",
    "คำนวณกำไรขาดทุนหุ้น",
    "คำนวณต้นทุนเฉลี่ยหุ้น",
    "บันทึกซื้อขายหุ้น",
    "สมุดบันทึกการลงทุน",
    "พอร์ตหุ้น",
    "portfolio management",
    "backtest หุ้น",
    "แจ้งเตือนราคาหุ้น",
    "margin of safety",
    "หุ้นไทย",
    "หุ้นอเมริกา",
    "นักลงทุนระยะยาว",
    "นักลงทุน VI",
  ],
  alternates: {
    canonical: "https://valustock.com/portfolio",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/portfolio",
    title: "Portfolio Tracker | จัดพอร์ตหุ้นและคำนวณกำไรขาดทุน",
    description:
      "บันทึกซื้อขายหุ้น ติดตามมูลค่าพอร์ต คำนวณต้นทุนเฉลี่ย กำไรขาดทุน Backtest และตั้งแจ้งเตือนราคา",
    siteName: "ValuStock",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio Tracker | จัดพอร์ตหุ้น",
    description:
      "ติดตามพอร์ตหุ้น บันทึกซื้อขาย คำนวณกำไรขาดทุน และตั้งแจ้งเตือนราคาด้วย ValuStock",
  },
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

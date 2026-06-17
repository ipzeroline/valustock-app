import type { Metadata } from "next";

const PRICING_IMAGE_URL = "https://valustock.com/images/pricing-plans-hero.png?v=1";

export const metadata: Metadata = {
  title: "ราคา ValuStock | แพ็กเกจเครื่องมือวิเคราะห์หุ้นไทยและหุ้นสหรัฐ",
  description:
    "ดูราคาแพ็กเกจ ValuStock สำหรับวิเคราะห์หุ้นไทย SET และหุ้นสหรัฐ พร้อม DCF Calculator, Graham Number, Stock Screener, Watchlist, Portfolio Tracker และ Price Alerts",
  keywords: [
    "ราคา ValuStock",
    "แพ็กเกจ ValuStock",
    "เครื่องมือวิเคราะห์หุ้น",
    "วิเคราะห์หุ้นไทย",
    "วิเคราะห์หุ้นสหรัฐ",
    "โปรแกรมวิเคราะห์หุ้น",
    "stock analysis subscription Thailand",
    "DCF Calculator",
    "Graham Number",
    "Stock Screener",
    "Portfolio Tracker",
    "Watchlist หุ้น",
    "แจ้งเตือนราคาหุ้น",
    "ลงทุนแบบ VI",
  ],
  alternates: {
    canonical: "https://valustock.com/pricing",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/pricing",
    title: "ราคา ValuStock | แพ็กเกจเครื่องมือวิเคราะห์หุ้น",
    description:
      "เลือกแพ็กเกจ ValuStock สำหรับประเมินมูลค่าหุ้น คัดกรองหุ้น จัดพอร์ต Watchlist และติดตาม Margin of Safety",
    siteName: "ValuStock",
    images: [
      {
        url: PRICING_IMAGE_URL,
        width: 1672,
        height: 941,
        alt: "ValuStock pricing plans for stock valuation and portfolio research",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ราคา ValuStock | แพ็กเกจวิเคราะห์หุ้น",
    description:
      "เริ่มใช้ฟรี หรืออัปเกรดเพื่อใช้ DCF, Graham Number, Screener, Portfolio และ Alerts",
    images: [PRICING_IMAGE_URL],
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

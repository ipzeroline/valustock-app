import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เปรียบเทียบหุ้น | เทียบ DCF, MOS, P/E, ROE และปันผล ValuStock",
  description:
    "เครื่องมือเปรียบเทียบหุ้นไทย หุ้นสหรัฐ ETF และกองทุน ดูราคาเหมาะสม DCF, Graham Number, Margin of Safety, P/E, P/BV, ROE, หนี้สิน กระแสเงินสด และปันผลแบบเคียงข้างกัน",
  keywords: [
    "เปรียบเทียบหุ้น",
    "เทียบหุ้น",
    "เปรียบเทียบหุ้นไทย",
    "เปรียบเทียบหุ้นสหรัฐ",
    "เปรียบเทียบ DCF",
    "เปรียบเทียบ P/E",
    "เปรียบเทียบ ROE",
    "Margin of Safety",
    "ราคาเหมาะสมหุ้น",
    "DCF หุ้น",
    "Graham Number",
    "หุ้น undervalue",
    "เครื่องมือวิเคราะห์หุ้น",
    "ValuStock compare",
  ],
  alternates: {
    canonical: "https://valustock.com/compare",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/compare",
    title: "เปรียบเทียบหุ้น | DCF, MOS, P/E, ROE และปันผล",
    description:
      "เทียบหุ้นหลายตัวแบบเคียงข้างกันด้วยราคาเหมาะสม, Margin of Safety, อัตราส่วนการเงิน และกระแสเงินสด",
    siteName: "ValuStock",
  },
  twitter: {
    card: "summary_large_image",
    title: "เปรียบเทียบหุ้น | ValuStock",
    description:
      "เทียบ DCF, MOS, P/E, P/BV, ROE, หนี้สิน และปันผลของหุ้นหลายตัวในหน้าเดียว",
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

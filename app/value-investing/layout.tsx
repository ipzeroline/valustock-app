import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Value Investing คืออะไร | คู่มือลงทุนแบบ VI หุ้นคุณค่า Benjamin Graham",
  description:
    "คู่มือ Value Investing สำหรับนักลงทุนไทย อธิบายการลงทุนแบบ VI, หุ้นคุณค่า, Intrinsic Value, Margin of Safety, Benjamin Graham, Warren Buffett และวิธีคัดกรองหุ้นระยะยาว",
  keywords: [
    "value investing คือ",
    "ลงทุนแบบ VI",
    "หุ้นคุณค่า",
    "นักลงทุน VI",
    "Benjamin Graham",
    "Warren Buffett",
    "Margin of Safety",
    "margin of safety คือ",
    "Intrinsic Value",
    "intrinsic value หุ้น",
    "หุ้นพื้นฐานดี",
    "หุ้น undervalue",
    "หุ้นราคาถูกพื้นฐานดี",
    "ลงทุนระยะยาว",
    "คูเมืองธุรกิจ",
    "economic moat",
    "owner earnings",
    "Graham Number",
  ],
  alternates: {
    canonical: "https://valustock.com/value-investing",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/value-investing",
    title: "Value Investing คืออะไร | คู่มือลงทุนแบบ VI หุ้นคุณค่า",
    description:
      "เรียนรู้แนวคิด VI, Intrinsic Value, Margin of Safety, Benjamin Graham และ Warren Buffett สำหรับนักลงทุนระยะยาว",
    siteName: "ValuStock",
  },
  twitter: {
    card: "summary_large_image",
    title: "Value Investing คืออะไร | คู่มือลงทุนแบบ VI",
    description:
      "คู่มือหุ้นคุณค่า Intrinsic Value, Margin of Safety และแนวคิด Benjamin Graham/Warren Buffett",
  },
};

export default function ValueInvestingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intrinsic Value Calculator | เครื่องมือประเมินมูลค่าหุ้น คำนวณ Graham Number",
  description:
    "คำนวณมูลค่าหุ้นที่แท้จริงด้วย Intrinsic Value Calculator, Graham Number, EPS, BVPS, Growth Rate และ Margin of Safety พร้อมวิธีอ่านผลสำหรับนักลงทุน VI",
  keywords: [
    "intrinsic value calculator",
    "intrinsic value หุ้น",
    "เครื่องมือประเมินมูลค่าหุ้น",
    "คำนวณมูลค่าหุ้น",
    "มูลค่าที่แท้จริงของหุ้น",
    "มูลค่าเหมาะสมของหุ้น",
    "graham number",
    "Benjamin Graham formula",
    "margin of safety",
    "margin of safety คือ",
    "EPS คือ",
    "BVPS คือ",
    "หุ้นถูกหรือแพง",
    "วิธีประเมินมูลค่าหุ้น",
    "หุ้นพื้นฐานดี",
    "หุ้น undervalue",
    "นักลงทุน VI",
  ],
  alternates: {
    canonical: "https://valustock.com/intrinsic-value-calculator",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/intrinsic-value-calculator",
    title: "Intrinsic Value Calculator | เครื่องมือประเมินมูลค่าหุ้น",
    description:
      "ประเมินมูลค่าหุ้นด้วยสูตร Benjamin Graham, Graham Number และ Margin of Safety เพื่อดูว่าหุ้นถูกหรือแพงก่อนลงทุน",
    siteName: "ValuStock",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intrinsic Value Calculator | เครื่องมือประเมินมูลค่าหุ้น",
    description:
      "คำนวณมูลค่าที่แท้จริงของหุ้นด้วย Graham Number, EPS, BVPS และ Margin of Safety",
  },
};

export default function IntrinsicValueCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

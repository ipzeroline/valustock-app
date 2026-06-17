import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DCF Calculator | เครื่องคำนวณมูลค่าหุ้นด้วยกระแสเงินสดคิดลด",
  description:
    "คำนวณมูลค่าหุ้นด้วย DCF Calculator ใช้ Free Cash Flow, Growth Rate, WACC, Terminal Value และ Margin of Safety เพื่อประเมินราคาเหมาะสมของหุ้น",
  keywords: [
    "dcf calculator",
    "dcf calculator หุ้น",
    "เครื่องคำนวณ dcf",
    "คำนวณ dcf หุ้น",
    "discounted cash flow",
    "กระแสเงินสดคิดลด",
    "ประเมินมูลค่าหุ้น dcf",
    "คำนวณมูลค่าหุ้น",
    "ราคาเหมาะสมหุ้น",
    "fair value หุ้น",
    "intrinsic value หุ้น",
    "free cash flow คือ",
    "fcf คือ",
    "wacc คือ",
    "terminal value คือ",
    "margin of safety",
    "หุ้นถูกหรือแพง",
    "นักลงทุน VI",
  ],
  alternates: {
    canonical: "https://valustock.com/dcf-calculator",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/dcf-calculator",
    title: "DCF Calculator | เครื่องคำนวณมูลค่าหุ้นด้วยกระแสเงินสดคิดลด",
    description:
      "ประเมินราคาเหมาะสมของหุ้นด้วย Free Cash Flow, WACC, Terminal Value และ Margin of Safety",
    siteName: "ValuStock",
  },
  twitter: {
    card: "summary_large_image",
    title: "DCF Calculator | เครื่องคำนวณมูลค่าหุ้น",
    description:
      "คำนวณมูลค่าหุ้นด้วยกระแสเงินสดคิดลด Free Cash Flow, WACC และ Terminal Value",
  },
};

export default function DcfCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

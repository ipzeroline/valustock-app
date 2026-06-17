import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "วิธีคำนวณมูลค่าหุ้น | ValuStock Methodology DCF Graham MOS",
  description:
    "อธิบายวิธีคำนวณมูลค่าหุ้นของ ValuStock ด้วย DCF, Free Cash Flow, WACC, Terminal Value, Graham Number, Margin of Safety และแหล่งข้อมูลที่ใช้ประเมินราคาเหมาะสมหุ้น",
  keywords: [
    "วิธีคำนวณมูลค่าหุ้น",
    "สูตรประเมินมูลค่าหุ้น",
    "สูตรคำนวณราคาเหมาะสมหุ้น",
    "ValuStock methodology",
    "DCF คือ",
    "DCF formula",
    "Free Cash Flow",
    "WACC คือ",
    "Terminal Value คือ",
    "Graham Number",
    "Benjamin Graham",
    "Margin of Safety",
    "intrinsic value หุ้น",
    "fair value หุ้น",
    "ประเมินหุ้นถูกหรือแพง",
    "หุ้น VI",
    "ลงทุนแบบ VI",
  ],
  alternates: {
    canonical: "https://valustock.com/methodology",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/methodology",
    title: "วิธีคำนวณมูลค่าหุ้น | ValuStock Methodology",
    description:
      "เจาะลึกสูตร DCF, Graham Number, Margin of Safety และแหล่งข้อมูลที่ใช้คำนวณราคาเหมาะสมหุ้นใน ValuStock",
    siteName: "ValuStock",
  },
  twitter: {
    card: "summary_large_image",
    title: "วิธีคำนวณมูลค่าหุ้น | ValuStock Methodology",
    description:
      "อธิบาย DCF, WACC, Terminal Value, Graham Number และ Margin of Safety สำหรับนักลงทุนไทย",
  },
};

export default function MethodologyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

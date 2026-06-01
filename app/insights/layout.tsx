import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "บทวิเคราะห์หุ้นและคู่มือลงทุน | ValuStock Insights",
  description:
    "อ่านบทวิเคราะห์หุ้นไทย หุ้นสหรัฐ Value Investing, DCF, Intrinsic Value, Margin of Safety, หุ้นปันผล, กองทุน Feeder Fund, W-8BEN และภาษีลงทุนต่างประเทศสำหรับนักลงทุนไทย",
  keywords: [
    "บทวิเคราะห์หุ้น",
    "ข่าวหุ้นวันนี้",
    "วิเคราะห์หุ้นไทย",
    "วิเคราะห์หุ้นสหรัฐ",
    "Value Investing",
    "ลงทุนแบบ VI",
    "Intrinsic Value คืออะไร",
    "DCF คืออะไร",
    "Margin of Safety คืออะไร",
    "หุ้นปันผลไทย",
    "หุ้นเทคโนโลยีสหรัฐ",
    "Feeder Fund",
    "W-8BEN",
    "ภาษีหุ้นต่างประเทศ",
    "กองทุนต่างประเทศ",
  ],
  alternates: {
    canonical: "https://valustock.com/insights",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/insights",
    title: "ValuStock Insights | บทวิเคราะห์หุ้นและคู่มือลงทุน",
    description:
      "ศูนย์ความรู้สำหรับนักลงทุนไทย ครอบคลุม DCF, Intrinsic Value, Margin of Safety, หุ้นไทย, หุ้นสหรัฐ, กองทุน และภาษีลงทุนต่างประเทศ",
    siteName: "ValuStock",
  },
  twitter: {
    card: "summary_large_image",
    title: "ValuStock Insights | บทวิเคราะห์หุ้นและคู่มือลงทุน",
    description:
      "อ่านบทวิเคราะห์หุ้น คู่มือ VI, DCF, หุ้นปันผล, กองทุนต่างประเทศ และภาษีนักลงทุนไทย",
  },
};

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "โปรแกรมคัดกรองหุ้น | Stock Screener หาหุ้นพื้นฐานดี หุ้น Undervalue",
  description:
    "ใช้ Stock Screener คัดกรองหุ้นไทย หุ้นอเมริกา หุ้นพื้นฐานดี หุ้น undervalue และหุ้นปันผลสูง ด้วย DCF, Graham Number, P/E, Dividend Yield และ Margin of Safety",
  keywords: [
    "โปรแกรมคัดกรองหุ้น",
    "stock screener",
    "stock screener ไทย",
    "คัดกรองหุ้น",
    "หุ้นพื้นฐานดี",
    "หุ้น undervalue",
    "หุ้นราคาถูกพื้นฐานดี",
    "หุ้นปันผลสูง",
    "หุ้นน่าซื้อ",
    "หุ้นตัวไหนดี",
    "หุ้นไทยถูกหรือแพง",
    "ค้นหาหุ้น",
    "วิเคราะห์หุ้น",
    "margin of safety",
    "dcf หุ้น",
    "intrinsic value หุ้น",
    "P/E ต่ำ",
    "Dividend Yield",
    "หุ้นไทย",
    "หุ้นอเมริกา",
  ],
  alternates: {
    canonical: "https://valustock.com/stocks",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/stocks",
    title: "โปรแกรมคัดกรองหุ้น | หาหุ้นพื้นฐานดี หุ้น Undervalue หุ้นปันผลสูง",
    description:
      "คัดกรองหุ้นด้วย DCF, Graham Number, Margin of Safety, P/E และ Dividend Yield สำหรับนักลงทุนระยะยาว",
    siteName: "ValuStock",
  },
  twitter: {
    card: "summary_large_image",
    title: "โปรแกรมคัดกรองหุ้น | Stock Screener",
    description:
      "ค้นหาหุ้นพื้นฐานดี หุ้น undervalue และหุ้นปันผลสูงด้วย ValuStock Stock Screener",
  },
};

export default function StocksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

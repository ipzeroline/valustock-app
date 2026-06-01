import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watchlist หุ้น | ติดตามหุ้น ราคา MOS และจังหวะเข้าซื้อ ValuStock",
  description:
    "สร้าง Watchlist หุ้นเพื่อติดตามหุ้นไทย หุ้นสหรัฐ กองทุน ETF และสินทรัพย์ที่สนใจ พร้อมดู Margin of Safety, ราคาเหมาะสม, สัญญาณ undervalue และแผนจังหวะเข้าซื้อรายสัปดาห์",
  keywords: [
    "watchlist หุ้น",
    "ติดตามหุ้น",
    "รายการหุ้นที่สนใจ",
    "แจ้งเตือนราคาหุ้น",
    "ติดตามราคาหุ้น",
    "Margin of Safety",
    "หุ้น undervalue",
    "หุ้นไทย",
    "หุ้นสหรัฐ",
    "พอร์ตหุ้น",
    "DCA หุ้น",
    "จังหวะซื้อหุ้น",
    "ราคาเหมาะสมหุ้น",
    "ValuStock watchlist",
  ],
  alternates: {
    canonical: "https://valustock.com/watchlist",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/watchlist",
    title: "Watchlist หุ้น | ติดตามหุ้น ราคา MOS และจังหวะเข้าซื้อ",
    description:
      "ติดตามหุ้นที่สนใจพร้อม Margin of Safety, ราคาเหมาะสม และแผนจังหวะเข้าซื้อรายสัปดาห์",
    siteName: "ValuStock",
  },
  twitter: {
    card: "summary_large_image",
    title: "Watchlist หุ้น | ValuStock",
    description:
      "ติดตามหุ้นไทย หุ้นสหรัฐ ETF และสินทรัพย์ที่สนใจ พร้อม MOS และสัญญาณ undervalue",
  },
};

export default function WatchlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

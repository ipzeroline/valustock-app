import type { Metadata } from "next";
import { getStock, STOCKS } from "@/lib/stocks";
import StockDetailClient from "./StockDetailClient";

type Props = {
  params: Promise<{ symbol: string }>;
};

function decodeSymbol(value: string) {
  return decodeURIComponent(value || "").trim().toUpperCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeSymbol(rawSymbol);
  const stock = getStock(symbol);
  const title = stock
    ? `${stock.symbol} ${stock.name} | ราคา มูลค่าเหมาะสม และ Margin of Safety`
    : `${symbol || "หุ้น"} | วิเคราะห์มูลค่าหุ้น`;
  const description = stock
    ? `วิเคราะห์ ${stock.symbol} ${stock.name} ราคา มูลค่าเหมาะสม DCF, P/E, Dividend Yield, Margin of Safety และข้อมูลพื้นฐานสำหรับนักลงทุน`
    : `วิเคราะห์ราคา มูลค่าเหมาะสม และข้อมูลพื้นฐานของ ${symbol} ด้วย ValuStock`;
  const canonical = `/stocks/${encodeURIComponent(symbol.toLowerCase())}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      locale: "th_TH",
      url: canonical,
      title,
      description,
      siteName: "ValuStock",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: stock ? `${stock.symbol} stock valuation` : "ValuStock stock valuation",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export function generateStaticParams() {
  return STOCKS.slice(0, 80).map((stock) => ({
    symbol: stock.symbol.toLowerCase(),
  }));
}

export default function StockDetailPage() {
  return <StockDetailClient />;
}

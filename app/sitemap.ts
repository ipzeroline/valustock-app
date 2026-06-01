import type { MetadataRoute } from "next";
import { STOCKS, SECTORS } from "@/lib/stocks";

const SITE_URL = "https://valustock.app";

const staticRoutes = [
  "",
  "/stocks",
  "/pricing",
  "/compare",
  "/insights",
  "/insights/dcf-calculator-stock-valuation",
  "/dcf-calculator",
  "/intrinsic-value-calculator",
  "/stock-valuation",
  "/undervalued-stocks",
  "/dividend-stocks",
  "/value-investing",
  "/methodology",
  "/disclaimer",
  "/privacy",
  "/terms",
];

const sectorSlugs: Record<string, string> = {
  "เทคโนโลยี": "technology",
  "พลังงาน": "energy",
  "ค้าปลีก": "retail",
  "สื่อสาร": "communication",
  "อาหารและเครื่องดื่ม": "food",
  "อสังหาริมทรัพย์": "realestate",
  "การแพทย์": "healthcare",
  "ขนส่งและโลจิสติกส์": "logistics",
  "วัสดุก่อสร้าง": "construction",
  "ธนาคาร": "banking",
};

function entry(path: string, priority = 0.7): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const stockRoutes = STOCKS.flatMap((stock) => {
    const symbol = stock.symbol.toLowerCase();
    return [entry(`/stocks/${symbol}`, 0.8), entry(`/stock/${symbol}`, 0.7)];
  });

  const sectorRoutes = SECTORS.map((sector) => sectorSlugs[String(sector)])
    .filter(Boolean)
    .map((slug) => entry(`/sector/${slug}`, 0.7));

  return [
    ...staticRoutes.map((route) => entry(route, route === "" ? 1 : 0.8)),
    entry("/country/thailand", 0.7),
    entry("/country/usa", 0.7),
    ...sectorRoutes,
    ...stockRoutes,
  ];
}

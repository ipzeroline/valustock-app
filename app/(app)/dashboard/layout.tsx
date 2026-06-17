import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ValuStock Dashboard | ภาพรวมพอร์ต หุ้นน่าสนใจ และเครื่องมือวิเคราะห์หุ้น",
  description:
    "Dashboard สำหรับนักลงทุนไทย ดูภาพรวมตลาด หุ้น undervalue, Watchlist, DCF, Margin of Safety, พอร์ตจำลอง และเครื่องมือวิเคราะห์หุ้นไทยกับหุ้นสหรัฐในที่เดียว",
  keywords: [
    "ValuStock Dashboard",
    "dashboard วิเคราะห์หุ้น",
    "ภาพรวมพอร์ตหุ้น",
    "เครื่องมือวิเคราะห์หุ้น",
    "หุ้น undervalue",
    "หุ้นน่าสนใจ",
    "watchlist หุ้น",
    "portfolio tracker",
    "DCF Calculator",
    "Margin of Safety",
    "หุ้นไทย",
    "หุ้นสหรัฐ",
    "ลงทุนแบบ VI",
  ],
  alternates: {
    canonical: "https://valustock.com/dashboard",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/dashboard",
    title: "ValuStock Dashboard | ภาพรวมพอร์ตและหุ้นน่าสนใจ",
    description:
      "ศูนย์ควบคุมสำหรับติดตามหุ้น Watchlist, หุ้น undervalue, DCF, Margin of Safety และภาพรวมตลาด",
    siteName: "ValuStock",
  },
  twitter: {
    card: "summary_large_image",
    title: "ValuStock Dashboard | ภาพรวมพอร์ตและหุ้นน่าสนใจ",
    description:
      "ติดตามหุ้น Watchlist, หุ้น undervalue และเครื่องมือวิเคราะห์มูลค่าหุ้นในหน้าเดียว",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

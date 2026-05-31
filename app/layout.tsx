import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  IBM_Plex_Sans_Thai,
  IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Shell } from "@/components/Shell";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ValuStock — แพลตฟอร์มประเมินมูลค่าสินทรัพย์และเทอร์มินัลการเงินสากล",
  description: "เทอร์มินัลการเงินและเครื่องมือประเมินมูลค่าสินทรัพย์ระดับสถาบัน วิเคราะห์หุ้นทั่วโลก คริปโตเคอร์เรนซี และฟิวเจอร์ส ด้วยเครื่องคำนวณ DCF, Graham Number และอัตราส่วนเชิงลึกเพื่อการจัดพอร์ตที่มีประสิทธิภาพสูงสุด",
  keywords: [
    "ประเมินมูลค่าหุ้น",
    "วิเคราะห์หุ้น",
    "มูลค่าเหมาะสมของหุ้น",
    "เครื่องคำนวณ dcf",
    "dcf calculator",
    "graham number",
    "สูตรเกรแฮม",
    "margin of safety",
    "คัดกรองหุ้น",
    "หุ้นไทย",
    "หุ้นอเมริกา",
    "มูลค่าหุ้นที่แท้จริง",
    "valustock",
    "งบการเงิน"
  ],
  authors: [{ name: "ValuStock Team", url: "https://valustock.app" }],
  creator: "ValuStock",
  publisher: "ValuStock",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.app",
    title: "ValuStock — แพลตฟอร์มประเมินมูลค่าสินทรัพย์และเทอร์มินัลการเงินสากล",
    description: "โปรแกรมประเมินมูลค่าสินทรัพย์ระดับโลกด้วย DCF และอัตราส่วนการเงิน คัดกรองหุ้นราคาถูกปันผลสูง วิเคราะห์ข้อมูลเทคโนโลยี คริปโต และฟิวเจอร์สด้วยระบบอัจฉริยะ",
    siteName: "ValuStock",
    images: [
      {
        url: "https://valustock.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "ValuStock — Financial Valuation Engine & Stock Screener",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ValuStock — แพลตฟอร์มประเมินมูลค่าสินทรัพย์และเทอร์มินัลการเงินสากล",
    description: "โปรแกรมคำนวณราคาเหมาะสมและวิเคราะห์เชิงลึกสินทรัพย์ระดับสากล ด้วย DCF Model, Graham Formula และข้อมูลงบการเงินสตรีมมิ่ง",
    images: ["https://valustock.app/og-image.png"],
    creator: "@valustock",
  },
  alternates: {
    canonical: "https://valustock.app",
    languages: {
      "th-TH": "https://valustock.app",
      "en-US": "https://valustock.app/en",
    },
  },
  category: "finance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" data-scroll-behavior="smooth" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}

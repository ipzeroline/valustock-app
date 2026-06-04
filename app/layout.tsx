import type { Metadata } from "next";
import Script from "next/script";
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
  metadataBase: new URL("https://valustock.com"),
  title: "ValuStock | เครื่องมือประเมินมูลค่าหุ้น คำนวณ DCF และหาหุ้นพื้นฐานดี",
  description: "ประเมินมูลค่าหุ้นด้วย DCF, Intrinsic Value และ Margin of Safety คัดกรองหุ้นพื้นฐานดี หุ้น undervalue หุ้นปันผลสูง และดูว่าหุ้นไทยหรือหุ้นอเมริกาถูกหรือแพง",
  keywords: [
    "หุ้นตัวไหนดี",
    "หุ้นปันผลสูง",
    "หุ้น undervalue",
    "หุ้นราคาถูกพื้นฐานดี",
    "หุ้นพื้นฐานดี",
    "หุ้นน่าซื้อ",
    "มูลค่าหุ้น",
    "fair value หุ้น",
    "intrinsic value",
    "intrinsic value หุ้น",
    "dcf calculator",
    "dcf calculator หุ้น",
    "คำนวณ dcf หุ้น",
    "peg ratio คือ",
    "pe ratio คือ",
    "roe คือ",
    "หุ้นไทยถูกหรือแพง",
    "ประเมินมูลค่าหุ้น",
    "วิเคราะห์หุ้น",
    "มูลค่าเหมาะสมของหุ้น",
    "เครื่องคำนวณ dcf",
    "เครื่องมือประเมินมูลค่าหุ้น",
    "โปรแกรมคัดกรองหุ้น",
    "วิธีประเมินมูลค่าหุ้น",
    "วิธีหาหุ้น undervalue",
    "graham number",
    "สูตรเกรแฮม",
    "margin of safety",
    "margin of safety คือ",
    "คัดกรองหุ้น",
    "หุ้นไทย",
    "หุ้นอเมริกา",
    "มูลค่าหุ้นที่แท้จริง",
    "valustock",
    "งบการเงิน"
  ],
  authors: [{ name: "ValuStock Team", url: "https://valustock.com" }],
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
    url: "https://valustock.com",
    title: "ValuStock | เครื่องมือประเมินมูลค่าหุ้น คำนวณ DCF และหาหุ้นพื้นฐานดี",
    description: "ประเมินมูลค่าหุ้นด้วย DCF, Intrinsic Value และ Margin of Safety คัดกรองหุ้นพื้นฐานดี หุ้น undervalue หุ้นปันผลสูง และดูว่าหุ้นไทยหรือหุ้นอเมริกาถูกหรือแพง",
    siteName: "ValuStock",
    images: [
      {
        url: "https://valustock.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ValuStock - เครื่องมือประเมินมูลค่าหุ้นและค้นหาหุ้นพื้นฐานดี",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ValuStock | เครื่องมือประเมินมูลค่าหุ้น คำนวณ DCF และหาหุ้นพื้นฐานดี",
    description: "ประเมินมูลค่าหุ้นด้วย DCF, Intrinsic Value และ Margin of Safety คัดกรองหุ้นพื้นฐานดี หุ้น undervalue หุ้นปันผลสูง และดูว่าหุ้นไทยหรือหุ้นอเมริกาถูกหรือแพง",
    images: ["https://valustock.com/opengraph-image"],
    creator: "@valustock",
  },
  alternates: {
    canonical: "/",
    languages: {
      "th-TH": "/",
    },
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXH2TRCZCD"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXH2TRCZCD');
          `}
        </Script>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}

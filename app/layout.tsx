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
  metadataBase: new URL("https://valustock.app"),
  title: "ValuStock - เครื่องมือประเมินมูลค่าหุ้น และค้นหาหุ้นพื้นฐานดีสำหรับนักลงทุนระยะยาว",
  description: "ตอบคำถาม 'หุ้นตัวไหนดี' และ 'หุ้นไทยถูกหรือแพง' ด้วยเครื่องประเมินมูลค่าหุ้นที่แท้จริง (Intrinsic Value / DCF Calculator) คัดกรอง หุ้นปันผลสูง และ หุ้น undervalue ทรงคุณค่าที่มีส่วนเผื่อความปลอดภัยสูงสุดได้อย่างเป็นระบบ",
  keywords: [
    "หุ้นตัวไหนดี",
    "หุ้นปันผลสูง",
    "หุ้น undervalue",
    "หุ้นพื้นฐานดี",
    "หุ้นน่าซื้อ",
    "มูลค่าหุ้น",
    "intrinsic value",
    "dcf calculator",
    "peg ratio คือ",
    "หุ้นไทยถูกหรือแพง",
    "ประเมินมูลค่าหุ้น",
    "วิเคราะห์หุ้น",
    "มูลค่าเหมาะสมของหุ้น",
    "เครื่องคำนวณ dcf",
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
    title: "ValuStock - เครื่องมือประเมินมูลค่าหุ้น และค้นหาหุ้นพื้นฐานดีสำหรับนักลงทุนระยะยาว",
    description: "ตอบคำถาม 'หุ้นตัวไหนดี' และ 'หุ้นไทยถูกหรือแพง' ด้วยเครื่องคำนวณ DCF / intrinsic value หุ้น คัดกรองหุ้นปันผลสูง หุ้นน่าซื้อ และหุ้น undervalue ทรงคุณค่าอย่างเป็นระบบ",
    siteName: "ValuStock",
    images: [
      {
        url: "https://valustock.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "ValuStock - เครื่องมือประเมินมูลค่าหุ้น",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ValuStock - เครื่องมือประเมินมูลค่าหุ้น และค้นหาหุ้นพื้นฐานดีสำหรับนักลงทุนระยะยาว",
    description: "ตอบคำถาม 'หุ้นตัวไหนดี' และ 'หุ้นไทยถูกหรือแพง' ด้วยเครื่องคำนวณ DCF / intrinsic value หุ้น คัดกรองหุ้นปันผลสูง หุ้นน่าซื้อ และหุ้น undervalue ทรงคุณค่าอย่างเป็นระบบ",
    images: ["https://valustock.app/og-image.png"],
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
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}

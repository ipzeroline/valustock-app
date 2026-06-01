"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PLANS } from "@/lib/plans";
import { STOCKS } from "@/lib/stocks";
import { computeValuation, defaultDCFParams } from "@/lib/valuation";
import { baht, dollar, pct, num } from "@/lib/format";
import { Sparkline } from "@/components/Charts";
import { AssetLogo } from "@/components/AssetLogo";
import { useTranslation } from "@/lib/translations";
import {
  Calculator,
  Gauge,
  Filter,
  Layers,
  Star,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Shield,
  ChevronRight,
  Target,
  Info,
} from "@/lib/icons";

interface Article {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  summary: string;
  tag: string;
  gradient: string;
}

const FEATURED_ARTICLES_TH: Article[] = [
  {
    id: "tech-vs-dividend",
    title: "หุ้นเทคโนโลยีสหรัฐฯ vs หุ้นปันผลไทย: จัดพอร์ตอย่างไรในครึ่งปีหลัง?",
    category: "จัดพอร์ตการลงทุน",
    date: "30 พ.ค. 2026",
    readTime: "5 นาที",
    tag: "แนะจัดพอร์ต",
    gradient: "from-blue-600/20 to-purple-600/20 text-purple-400 border-purple-500/20",
    summary: "เจาะลึกโครงสร้างอุตสาหกรรมในตลาดหุ้นสหรัฐฯ (US tech) และตลาดหุ้นไทย (Value/Dividend) พร้อมวิเคราะห์วิธีลดความเสี่ยงจากอัตราแลกเปลี่ยนภาษีนำเข้าเงินกลับประเทศแบบใหม่"
  },
  {
    id: "feeder-funds-guide",
    title: "คู่มือเลือกกองทุนรวม Feeder Fund สำหรับคนไทย: เลี่ยงค่าธรรมเนียมซ้ำซ้อน",
    category: "กองทุนรวมต่างประเทศ",
    date: "29 พ.ค. 2026",
    readTime: "4 นาที",
    tag: "สำหรับกองทุน",
    gradient: "from-emerald-600/20 to-teal-600/20 text-teal-400 border-teal-500/20",
    summary: "เข้าใจความเชื่อมโยงระหว่างกองทุนไทย (Feeder Fund) และกองทุนหลักต่างประเทศ (Master Fund) เคล็ดลับดูค่าธรรมเนียมแฝงไม่ให้ผลตอบแทนตกหล่น"
  },
  {
    id: "w-8ben-tax-tips",
    title: "เจาะลึกวิธียื่นแบบฟอร์ม W-8BEN เพื่อลดภาษีปันผลหุ้นสหรัฐฯ เหลือ 15%",
    category: "ภาษี & กฎหมาย",
    date: "28 พ.ค. 2026",
    readTime: "6 นาที",
    tag: "ความรู้ภาษี",
    gradient: "from-amber-600/20 to-red-600/20 text-amber-400 border-amber-500/20",
    summary: "ขั้นตอนละเอียดสำหรับนักลงทุนที่เปิดพอร์ตนอกประเทศ เพื่อรับสิทธิ์ลดหย่อนภาษีหัก ณ ที่จ่ายจากปันผลสหรัฐฯ จากปกติ 30% ให้เหลือเพียง 15% ตามอนุสัญญาภาษีซ้อน"
  }
];

const FEATURED_ARTICLES_EN: Article[] = [
  {
    id: "tech-vs-dividend",
    title: "US Technology vs. Thai Dividend Stocks: How to Allocate in 2H2026?",
    category: "Asset Allocation",
    date: "May 30, 2026",
    readTime: "5 mins",
    tag: "Portfolio Tips",
    gradient: "from-blue-600/20 to-purple-600/20 text-purple-400 border-purple-500/20",
    summary: "A deep dive into industrial structures of the US Tech and Thai Dividend sectors, detailing global growth strategies alongside inbound personal tax updates for Thai citizens."
  },
  {
    id: "feeder-funds-guide",
    title: "Thai Feeder Funds Handbook: Avoid Double-Layer Management Fees",
    category: "Offshore Mutual Funds",
    date: "May 29, 2026",
    readTime: "4 mins",
    tag: "Fund Analysis",
    gradient: "from-emerald-600/20 to-teal-600/20 text-teal-400 border-teal-500/20",
    summary: "Understand the mechanics connecting Thai local Feeder Funds to global Master Funds. Discover hidden expense ratios to keep your compounding yields intact."
  },
  {
    id: "w-8ben-tax-tips",
    title: "Step-by-Step W-8BEN Filing Guide to Halve US Withholding Dividend Taxes",
    category: "Taxation & Regulation",
    date: "May 28, 2026",
    readTime: "6 mins",
    tag: "Tax Education",
    gradient: "from-amber-600/20 to-red-600/20 text-amber-400 border-amber-500/20",
    summary: "A complete walk-through for international investors filing W-8BEN certificates to lower US dividend withholding taxes from 30% down to 15% under double-taxation treaties."
  }
];

export default function Landing() {
  const { t, lang } = useTranslation();
  const demo = STOCKS[1]; // AOT
  const val = computeValuation(demo, defaultDCFParams(demo));

  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Newsletter subscription states
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes("@")) {
      setSubscribed(true);
      setEmail("");
    }
  };

  useEffect(() => {
    fetch("/api/admin/articles")
      .then((res) => res.json())
      .then((data) => {
        if (data.articles && data.articles.length > 0) {
          const mapped = data.articles.slice(0, 3).map((a: any) => {
            const isAapl = a.tag === "AAPL";
            const isNvda = a.tag === "NVDA";
            const isMsft = a.tag === "MSFT";
            let gradient = "from-amber-600/20 to-red-600/20 text-amber-400 border-red-500/20";
            if (isAapl) gradient = "from-blue-600/20 to-purple-600/20 text-purple-400 border-purple-500/20";
            if (isNvda) gradient = "from-emerald-600/20 to-teal-600/20 text-teal-400 border-teal-500/20";
            if (isMsft) gradient = "from-blue-600/20 to-cyan-600/20 text-cyan-400 border-cyan-500/20";

            return {
              id: a.slug,
              title: a.title,
              category: a.category || (lang === "th" ? "ข่าวด่วนเชิงลึก" : "Hot News Analysis"),
              date: a.created_at ? new Date(a.created_at).toLocaleDateString(lang === "th" ? "th-TH" : "en-US") : (lang === "th" ? "วันนี้" : "Today"),
              readTime: a.read_time || (lang === "th" ? "5 นาที" : "5 mins"),
              tag: a.tag || "News",
              gradient: gradient,
              summary: a.summary || "",
            };
          });
          setDbArticles(mapped);
        }
      })
      .catch((err) => console.error("Error fetching homepage articles:", err));
  }, [lang]);

  const articlesList = useMemo(() => {
    const mocks = lang === "th" ? FEATURED_ARTICLES_TH : FEATURED_ARTICLES_EN;
    const combined = [...dbArticles, ...mocks];
    const seen = new Set<string>();
    const unique: Article[] = [];
    for (const art of combined) {
      if (!seen.has(art.id)) {
        seen.add(art.id);
        unique.push(art);
      }
    }
    return unique.slice(0, 3); // Show top 3 featured articles
  }, [dbArticles, lang]);

  // Real-time top 3 undervalued stocks from DB
  const topUndervalued = useMemo(() => {
    return STOCKS.map((s: any) => ({
      stock: s,
      val: computeValuation(s, defaultDCFParams(s)),
    }))
    .filter((x: any) => x.val.verdict === "undervalued" && x.val.marginOfSafety >= 15)
    .sort((a: any, b: any) => b.val.marginOfSafety - a.val.marginOfSafety)
    .slice(0, 3);
  }, []);

  // Real-time top 3 dividend stocks from DB
  const topDividend = useMemo(() => {
    return STOCKS.map((s: any) => ({
      stock: s,
      val: computeValuation(s, defaultDCFParams(s)),
    }))
    .filter((x: any) => x.val.ratios.dividendYield >= 3.5)
    .sort((a: any, b: any) => b.val.ratios.dividendYield - a.val.ratios.dividendYield)
    .slice(0, 3);
  }, []);

  // Topic Cluster Investment Guides
  const investmentGuides = [
    {
      level: lang === "th" ? "Beginner" : "Beginner",
      badgeColor: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      topics: [
        {
          title: lang === "th" ? "Intrinsic Value คืออะไร?" : "What is Intrinsic Value?",
          desc: lang === "th" ? "ทำความเข้าใจพื้นฐานมูลค่าที่แท้จริงเพื่อไม่ซื้อของแพง" : "Learn the absolute baseline of valuation targets to guard capital assets.",
          link: "/insights/dcf-calculator-stock-valuation"
        },
        {
          title: lang === "th" ? "DCF คืออะไร?" : "What is a DCF Model?",
          desc: lang === "th" ? "เจาะลึกกระแสเงินสดคิดลด และวิธีประเมินแบบมือโปร" : "Master multi-stage Discounted Cash Flow models in simple terms.",
          link: "/dcf-calculator"
        },
        {
          title: lang === "th" ? "Margin of Safety คืออะไร?" : "What is Margin of Safety?",
          desc: lang === "th" ? "ส่วนเผื่อความปลอดภัยที่เบนจามิน เกรแฮม เน้นย้ำเสมอ" : "Introduced by Graham, learn how to build solid safety cushions.",
          link: "/intrinsic-value-calculator"
        }
      ]
    },
    {
      level: lang === "th" ? "Intermediate" : "Intermediate",
      badgeColor: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
      topics: [
        {
          title: lang === "th" ? "วิธีหาหุ้น Undervalued" : "How to Find Undervalued Stocks",
          desc: lang === "th" ? "เคล็ดลับการใช้ส่วนลดราคาและสแกนงบเพื่อแต้มต่อพอร์ต" : "Step-by-step guidelines to screen undervalued companies dynamically.",
          link: "/undervalued-stocks"
        },
        {
          title: lang === "th" ? "PE Ratio เท่าไรถึงเรียกว่าถูก?" : "Optimal PE Ratios for Value Moats",
          desc: lang === "th" ? "เข้าใจระดับค่าเฉลี่ยและการแยกแยะกับดัก PE ต่ำลวง" : "Identify high earnings yields and differentiate value traps.",
          link: "/stock-valuation"
        }
      ]
    },
    {
      level: lang === "th" ? "Advanced" : "Advanced",
      badgeColor: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      topics: [
        {
          title: lang === "th" ? "DCF Model แบบ Warren Buffett" : "Warren Buffett's DCF Valuation Model",
          desc: lang === "th" ? "ถอดสูตรแบบฉบับออเนอร์เอิร์นนิ่งที่เบิร์กเชียร์ใช้จริง" : "Understand Buffett's Owner Earnings calculations in cash flows.",
          link: "/value-investing"
        },
        {
          title: lang === "th" ? "Owner Earnings Valuation" : "Owner Earnings Valuation Blueprint",
          desc: lang === "th" ? "เจาะลึกกระแสเงินสดอิสระที่แท้จริงของผู้ประกอบการ" : "An advanced guide on corporate solvency and capital allocation.",
          link: "/methodology"
        }
      ]
    }
  ];

  const searchIntentCards = [
    {
      title: lang === "th" ? "หุ้นตัวนี้ถูกหรือแพง?" : "Is this stock cheap or expensive?",
      desc: lang === "th"
        ? "เปรียบเทียบราคาตลาดกับมูลค่าเหมาะสมจาก DCF, Graham Number และ Margin of Safety เพื่อดูว่าหุ้นมีแต้มต่อพอหรือไม่"
        : "Compare market price against DCF, Graham Number, and Margin of Safety estimates before committing capital.",
      link: "/intrinsic-value-calculator",
      linkText: lang === "th" ? "คำนวณมูลค่าเหมาะสมของหุ้น" : "Calculate intrinsic value",
      icon: Target,
    },
    {
      title: lang === "th" ? "หุ้นพื้นฐานดีมีตัวไหนบ้าง?" : "Which stocks have strong fundamentals?",
      desc: lang === "th"
        ? "คัดกรองหุ้นด้วย ROE, P/E, กระแสเงินสด, เงินปันผล และงบดุล เพื่อหาโอกาสลงทุนระยะยาวทั้งหุ้นไทยและหุ้นอเมริกา"
        : "Screen equities by ROE, P/E, free cash flow, dividends, and balance-sheet strength across Thai and US markets.",
      link: "/stocks",
      linkText: lang === "th" ? "เปิดโปรแกรมคัดกรองหุ้น" : "Open stock screener",
      icon: Filter,
    },
    {
      title: lang === "th" ? "หุ้น undervalue และหุ้นปันผลสูงหายังไง?" : "How do I find undervalued and dividend stocks?",
      desc: lang === "th"
        ? "รวมรายการหุ้นราคาถูกพื้นฐานดีและหุ้นปันผลสูง พร้อมตัวเลขที่ใช้ตรวจว่าเป็นโอกาสจริงหรือเป็น value trap"
        : "Find deep-value and dividend candidates with practical checks against common value traps.",
      link: "/undervalued-stocks",
      linkText: lang === "th" ? "ดูหุ้น undervalue" : "View undervalued stocks",
      icon: Shield,
    },
  ];

  const keywordLinks = [
    { label: lang === "th" ? "เครื่องมือประเมินมูลค่าหุ้น" : "Stock valuation tool", href: "/intrinsic-value-calculator" },
    { label: lang === "th" ? "เครื่องคำนวณ DCF หุ้น" : "DCF calculator", href: "/dcf-calculator" },
    { label: lang === "th" ? "หุ้น undervalue" : "Undervalued stocks", href: "/undervalued-stocks" },
    { label: lang === "th" ? "หุ้นปันผลสูง" : "High dividend stocks", href: "/dividend-stocks" },
    { label: lang === "th" ? "วิธีประเมินมูลค่าหุ้น" : "How to value stocks", href: "/stock-valuation" },
    { label: lang === "th" ? "แนวคิดลงทุนแบบ VI" : "Value investing guide", href: "/value-investing" },
    { label: lang === "th" ? "สูตรและวิธีคำนวณ" : "Methodology", href: "/methodology" },
    { label: lang === "th" ? "เปรียบเทียบหุ้นและ ETF" : "Compare stocks and ETFs", href: "/compare" },
  ];

  // Homepage FAQs
  const homeFaqs = useMemo(() => [
    {
      q: lang === "th" ? "ValuStock คำนวณ Fair Value (มูลค่าเหมาะสม) อย่างไร?" : "How does ValuStock calculate Fair Value?",
      a: lang === "th"
        ? "เราใช้แบบจำลองทางการเงิน 2 แบบหลักคือกระแสเงินสดคิดลด (DCF) ร่วมกับสูตร Benjamin Graham Number โดยอ้างอิง WACC (ต้นทุนเงินทุน) และ Book Value จริงจาก SEC/SET เพื่อประเมินมูลค่าเหมาะสมออกมาอย่างเป็นระบบ"
        : "We utilize two core valuation frameworks: a conservative Discounted Cash Flow (DCF) model and the classic Benjamin Graham Number, drawing directly from SEC and SET exchange balance sheets."
    },
    {
      q: lang === "th" ? "ข้อมูลราคาและอัตราส่วนการเงินอัปเดตบ่อยแค่ไหน?" : "How often are the financial metrics updated?",
      a: lang === "th"
        ? "ราคาตลาดล่าสุดอัปเดตแบบเรียลไทม์ระหว่างวันสำหรับตลาดสหรัฐฯ และตลาดหลักทรัพย์แห่งประเทศไทย ส่วนข้อมูลสรุปงบการเงินและอัตราส่วนปันผล (Yield) จะอัปเดตรายวันตรงตามรอบรายงานบัญชีล่าสุด"
        : "Market prices update in real-time during active trading hours, while key financial ratios, balance sheets, and dividend yields are updated daily matching the latest SEC/SET filings."
    },
    {
      q: lang === "th" ? "สามารถประเมินมูลค่ากองทุนรวมหรือ ETF (เช่น SPY, VOO) ได้ด้วยหรือไม่?" : "Can I evaluate ETFs and Mutual Funds like SPY or VOO?",
      a: lang === "th"
        ? "ได้ครับ แพลตฟอร์มของเราสนับสนุนการวิเคราะห์สัดส่วนกองทุนดัชนีชั้นนำระดับโลก โดยจะคำนวณอัตราส่วนค่าใช้จ่าย (Expense Ratio), ขนาด AUM และพอร์ตการถือครอง (Holdings) แตกต่างจากหุ้นรายตัวเพื่อประสิทธิภาพสูงสุด"
        : "Yes. Our platform fully supports top-tier global ETFs. We dynamically adjust our metrics to evaluate management fees (Expense Ratio), fund sizes (AUM), and NAV indexes instead of single company metrics."
    },
    {
      q: lang === "th" ? "ส่วนเผื่อความปลอดภัย (Margin of Safety) ควรอยู่ที่เท่าไรจึงจะปลอดภัย?" : "What is an optimal Margin of Safety buffer?",
      a: lang === "th"
        ? "สำหรับนักลงทุนแนวคุณค่า (Value Investors) แนะนำส่วนเผื่อความปลอดภัยขั้นต่ำที่ 15% - 30% ขึ้นไป เพื่อช่วยเป็นกันชนป้องกันพอร์ตเมื่อเกิดความคาดเคลื่อนในการประเมินกระแสเงินสดอนาคต"
        : "For defensive value reinvestors, we recommend maintaining a Margin of Safety between 15% and 30%. This serves as an operational buffer against long-term cash flow projection errors."
    },
    {
      q: lang === "th" ? "มือใหม่ใช้ ValuStock หาหุ้นตัวไหนดีได้ไหม?" : "Can beginners use ValuStock to find stock ideas?",
      a: lang === "th"
        ? "ได้ครับ หน้าโปรแกรมคัดกรองหุ้นช่วยเริ่มจากคำถามง่าย ๆ เช่น หุ้นตัวนี้ถูกหรือแพง หุ้นพื้นฐานดีตัวไหนน่าสนใจ และหุ้นมี Margin of Safety เพียงพอหรือไม่ จากนั้นผู้ใช้ควรอ่านงบและศึกษาความเสี่ยงก่อนลงทุนจริง"
        : "Yes. The screener starts from practical questions such as whether a stock is cheap, financially strong, and trading with enough Margin of Safety. Users should still review filings and risks before investing."
    },
    {
      q: lang === "th" ? "หุ้น undervalue ต่างจากหุ้นราคาถูกทั่วไปอย่างไร?" : "How are undervalued stocks different from simply cheap stocks?",
      a: lang === "th"
        ? "หุ้น undervalue คือหุ้นที่ราคาตลาดต่ำกว่ามูลค่าที่ประเมินได้จากพื้นฐาน เช่น กระแสเงินสด กำไร คุณภาพงบดุล และผลตอบแทนต่อผู้ถือหุ้น ไม่ใช่แค่หุ้นที่ P/E ต่ำหรือราคาลดลงแรง"
        : "An undervalued stock trades below a reasonable estimate of intrinsic value based on cash flow, earnings quality, balance-sheet strength, and shareholder returns, not just a low P/E ratio."
    },
    {
      q: lang === "th" ? "DCF Calculator เหมาะกับหุ้นแบบไหน?" : "What types of stocks are best suited for DCF valuation?",
      a: lang === "th"
        ? "DCF เหมาะกับธุรกิจที่มีกระแสเงินสดคาดการณ์ได้พอสมควร เช่น บริษัทกำไรสม่ำเสมอ เติบโตเป็นรอบชัดเจน หรือมี free cash flow เป็นบวกต่อเนื่อง หุ้นวัฏจักรหนักหรือธุรกิจขาดทุนอาจต้องใช้สมมติฐานระมัดระวังเป็นพิเศษ"
        : "DCF is best for companies with reasonably forecastable cash flows, recurring earnings, or consistent free cash flow. Cyclical or loss-making businesses require more conservative assumptions."
    }
  ], [lang]);

  const sectionClass = "mx-auto max-w-6xl px-5 py-14 sm:py-16 lg:py-20";
  const borderedSectionClass = `${sectionClass} border-t border-line/60`;
  const compactSectionClass = "mx-auto max-w-4xl px-5 py-14 sm:py-16 lg:py-20 border-t border-line/60";
  const centeredHeaderClass = "mx-auto mb-9 max-w-2xl text-center sm:mb-11 lg:mb-12";
  const splitHeaderClass = "mb-9 flex flex-col gap-5 sm:mb-11 md:flex-row md:items-end md:justify-between lg:mb-12";
  const eyebrowClass = "chip mb-3 inline-flex max-w-full items-center gap-1.5 text-xs font-bold leading-relaxed [overflow-wrap:anywhere]";
  const sectionTitleClass = "font-display text-2xl font-bold leading-tight text-ink [text-wrap:balance] sm:text-3xl";

  return (
    <div className="max-w-full overflow-x-hidden pb-16 md:pb-24">
      {/* 📊 Structured JSON-LD Data for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                "@id": "https://valustock.app/#software",
                "url": "https://valustock.app",
                "name": "ValuStock",
                "applicationCategory": "FinancialApplication",
                "operatingSystem": "All",
                "description": "เครื่องมือประเมินมูลค่าหุ้นและคำนวณ DCF สำหรับนักลงทุนไทย ใช้ Intrinsic Value, Graham Number และ Margin of Safety เพื่อคัดกรองหุ้นพื้นฐานดี หุ้น undervalue และหุ้นปันผลสูง",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "THB",
                  "category": "FreeTrial"
                },
                "screenshot": "https://valustock.app/og-image.png"
              },
              {
                "@type": "WebSite",
                "@id": "https://valustock.app/#website",
                "url": "https://valustock.app",
                "name": "ValuStock — เครื่องมือประเมินมูลค่าหุ้นสำหรับนักลงทุนไทย",
                "description": "ประเมินมูลค่าหุ้นด้วย DCF, Intrinsic Value และ Margin of Safety คัดกรองหุ้นพื้นฐานดี หุ้น undervalue หุ้นปันผลสูง และดูว่าหุ้นไทยหรือหุ้นอเมริกาถูกหรือแพง",
                "publisher": {
                  "@id": "https://valustock.app/#organization"
                },
                "inLanguage": "th"
              },
              {
                "@type": "Organization",
                "@id": "https://valustock.app/#organization",
                "name": "ValuStock",
                "url": "https://valustock.app",
                "logo": "https://valustock.app/logo.png"
              },
              {
                "@type": "FAQPage",
                "@id": "https://valustock.app/#faq",
                "mainEntity": homeFaqs.map((faq) => ({
                  "@type": "Question",
                  "name": faq.q,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.a
                  }
                }))
              }
            ]
          })
        }}
      />

      {/* 🚀 1. HERO SECTION (Stock Valuation Platform) */}
      <section className="relative overflow-hidden border-b border-line/60">
        <div className="aurora absolute inset-0 -z-10" />
        <div className="grid-lines absolute inset-0 -z-10 opacity-60" />
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] items-start gap-9 px-4 pb-12 pt-9 text-center sm:px-5 sm:py-16 md:min-h-[720px] md:items-center lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:min-h-[760px] lg:gap-14 lg:py-20 lg:text-left">
          <div className="animate-fade-up mx-auto min-w-0 max-w-md sm:max-w-2xl lg:mx-0">
            <span className={`${eyebrowClass} mx-auto justify-center border-brand/35 bg-brand/10 text-brand sm:text-sm lg:mx-0 lg:justify-start`}>
              <Sparkles className="h-3.5 w-3.5" /> 
              {lang === "th" 
                ? "แพลตฟอร์มประเมินมูลค่าหุ้น และคัดกรองระบบงบการเงิน" 
                : "Institutional Stock Valuation & Intrinsic Value Terminal"}
            </span>
            
            <h1 className="mt-5 max-w-full font-display text-3xl font-bold leading-[1.18] text-ink [word-break:break-word] sm:text-4xl md:text-5xl">
              {lang === "th" ? (
                <>
                  <span className="block">ValuStock</span>
                  <span className="block">เครื่องมือประเมินมูลค่าหุ้น</span>
                  <span className="mt-3 block text-lg font-bold text-muted sm:text-xl md:text-2xl">
                    คำนวณ DCF และค้นหา <strong className="text-brand font-bold">หุ้นพื้นฐานดี</strong> สำหรับนักลงทุนระยะยาว
                  </span>
                </>
              ) : (
                <>
                  <span className="block">ValuStock</span>
                  <span className="block">Ultimate Stock Valuation Tool</span>
                  <span className="mt-3 block text-lg font-bold text-muted sm:text-xl md:text-2xl">
                    Calculate <strong className="text-brand font-bold">Intrinsic Value</strong> & Find Undervalued Equities
                  </span>
                </>
              )}
            </h1>

            <p className="mx-auto mt-6 max-w-md text-sm font-medium leading-relaxed text-muted [overflow-wrap:anywhere] sm:max-w-xl sm:text-base lg:mx-0">
              {lang === "th" 
                ? "ตอบคำถาม 'หุ้นตัวไหนดี' และ 'หุ้นไทยถูกหรือแพง' ด้วยเครื่องประเมินมูลค่าหุ้นที่แท้จริง คำนวณ Intrinsic Value, Fair Value, DCF Calculator และ Margin of Safety เพื่อคัดกรองหุ้นปันผลสูง หุ้น undervalue และหุ้นราคาถูกพื้นฐานดีอย่างเป็นระบบ"
                : "Solve the question of what stocks to buy and evaluate if equities are cheap or expensive. Utilize our professional DCF Calculator and intrinsic value models to discover high dividend, undervalued stocks in seconds."}
            </p>

            <div className="mx-auto mt-8 flex max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center lg:mx-0 lg:justify-start">
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-xs sm:w-auto sm:text-sm">
                  {t("common.startFree")} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/stocks" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full text-xs sm:w-auto sm:text-sm">
                  {lang === "th" ? "สแกนหาหุ้นน่าซื้อ 📈" : "Explore Undervalued Stocks 📈"}
                </Button>
              </Link>
            </div>

            <nav className="mx-auto mt-7 flex max-w-sm flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] font-bold text-muted sm:max-w-none sm:text-xs lg:mx-0 lg:justify-start" aria-label="ลิงก์เครื่องมือประเมินมูลค่าหุ้นยอดนิยม">
              <Link className="hover:text-brand" href="/dcf-calculator">DCF Calculator</Link>
              <Link className="hover:text-brand" href="/intrinsic-value-calculator">Intrinsic Value</Link>
              <Link className="hover:text-brand" href="/undervalued-stocks">หุ้น undervalue</Link>
              <Link className="hover:text-brand" href="/dividend-stocks">หุ้นปันผลสูง</Link>
            </nav>
          </div>

          {/* Floating Valuation Card */}
          <div className="animate-fade-up min-w-0 w-full overflow-hidden [animation-delay:120ms] lg:justify-self-end">
            <div className="surface mx-auto w-full max-w-[350px] rounded-2xl border border-line bg-surface/55 p-4 text-left shadow-card backdrop-blur-md sm:max-w-md sm:p-5">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <AssetLogo symbol={demo.symbol} color={demo.color} size="md" />
                  <div className="min-w-0">
                    <div className="font-display font-bold">{demo.symbol}</div>
                    <div className="truncate text-xs text-muted">{demo.name}</div>
                  </div>
                </div>
                <span className={`chip w-fit border-up/30 bg-up/10 text-up text-xs font-bold`}>
                  {t(`verdict.${val.verdict}`).toUpperCase()}
                </span>
              </div>
              <div className="my-4 h-14">
                <Sparkline data={demo.priceHistory} up />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Mini label={t("landing.marketPrice")} value={baht(demo.price)} />
                <Mini
                  label={t("landing.fairValue")}
                  value={baht(val.fairValue)}
                  accent
                />
                <Mini label="P/E" value={num(val.ratios.pe, 1)} />
                <Mini
                  label={t("landing.marginOfSafety")}
                  value={pct(val.marginOfSafety, 0)}
                  up={val.marginOfSafety >= 0}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO SEARCH INTENT SECTION */}
      <section className={borderedSectionClass}>
        <div className={centeredHeaderClass}>
          <span className={`${eyebrowClass} border-brand/35 bg-brand/10 text-brand`}>
            <Gauge className="h-3.5 w-3.5" /> {lang === "th" ? "คำถามที่นักลงทุนไทยค้นหาบ่อย" : "High-intent investor searches"}
          </span>
          <h2 className={sectionTitleClass}>
            {lang === "th" ? "เครื่องมือประเมินมูลค่าหุ้นสำหรับนักลงทุนไทย" : "Stock Valuation Tools for Long-Term Investors"}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-muted [overflow-wrap:anywhere]">
            {lang === "th"
              ? "ValuStock ช่วยตอบคำถามสำคัญก่อนซื้อหุ้น เช่น หุ้นตัวไหนดี หุ้นไทยถูกหรือแพง มูลค่าเหมาะสมควรเป็นเท่าไร และหุ้นมีส่วนเผื่อความปลอดภัยเพียงพอสำหรับลงทุนระยะยาวหรือไม่"
              : "ValuStock helps investors answer whether a stock is cheap or expensive, what its fair value may be, and whether there is enough Margin of Safety for long-term allocation."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {searchIntentCards.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.link}
                href={item.link}
                className="group surface rounded-2xl border border-line p-5 text-center transition duration-300 hover:border-brand/40 hover:shadow-lg sm:p-6"
              >
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand transition duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold leading-snug text-ink group-hover:text-brand">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs font-medium leading-relaxed text-muted [overflow-wrap:anywhere]">
                  {item.desc}
                </p>
                <span className="mt-4 inline-flex items-center justify-center gap-1 text-xs font-extrabold text-brand">
                  {item.linkText} <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-line bg-surface/35 p-4 sm:p-5">
          <h3 className="font-display text-sm font-bold text-ink">
            {lang === "th" ? "คำค้นยอดนิยมที่ ValuStock ครอบคลุม" : "Popular valuation topics covered"}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {keywordLinks.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="rounded-full border border-line bg-bg px-3 py-1.5 text-[11px] font-bold text-muted transition hover:border-brand/40 hover:text-brand"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 🛠️ 2. TOP FEATURES SECTION */}
      <section className={sectionClass}>
        <div className={centeredHeaderClass}>
          <span className={`${eyebrowClass} border-brand/35 bg-brand/10 text-brand`}>
            <Calculator className="h-3.5 w-3.5" /> High-Utility Core Toolkits
          </span>
          <h2 className={sectionTitleClass}>
            {lang === "th" ? "เครื่องมือวิเคราะห์หุ้น คำนวณ DCF และคัดกรองหุ้นพื้นฐานดี" : "Premium Valuation Toolkits"}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* DCF CALCULATOR */}
          <Link href="/dcf-calculator" className="group surface border border-line rounded-2xl p-6 hover:border-brand/40 hover:shadow-lg transition duration-300">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand group-hover:scale-110 transition duration-300">
              <Calculator className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display font-bold text-ink group-hover:text-brand transition">DCF Calculator</h3>
            <p className="mt-1.5 text-xs text-muted leading-relaxed font-medium">
              {lang === "th" ? "คิดลดกระแสเงินสดล่วงหน้า 10 ปี เพื่อประเมินมูลค่าเป้าหมายต่อหุ้นจริง" : "Project 10-year FCF scenarios and discount them back to capture precise value parameters."}
            </p>
          </Link>

          {/* INTRINSIC VALUE */}
          <Link href="/intrinsic-value-calculator" className="group surface border border-line rounded-2xl p-6 hover:border-brand/40 hover:shadow-lg transition duration-300">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition duration-300">
              <Target className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display font-bold text-ink group-hover:text-brand transition">Intrinsic Value</h3>
            <p className="mt-1.5 text-xs text-muted leading-relaxed font-medium">
              {lang === "th" ? "เครื่องคำนวณสูตร Benjamin Graham และตัวเลขความปลอดภัย (MOS)" : "Compute defensive Graham Multiples and required bond rate cushions instantly."}
            </p>
          </Link>

          {/* STOCK SCREENER */}
          <Link href="/stocks" className="group surface border border-line rounded-2xl p-6 hover:border-brand/40 hover:shadow-lg transition duration-300">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition duration-300">
              <Filter className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display font-bold text-ink group-hover:text-brand transition">Stock Screener</h3>
            <p className="mt-1.5 text-xs text-muted leading-relaxed font-medium">
              {lang === "th" ? "โปรแกรมคัดกรองหุ้นพื้นฐานดี หุ้นปันผลสูง และหุ้น undervalue ด้วยชุดงบการเงินเรียลไทม์" : "Filter cash cows and deep discounts from our multi-exchange dynamic database."}
            </p>
          </Link>

          {/* PORTFOLIO ANALYSIS */}
          <Link href="/portfolio" className="group surface border border-line rounded-2xl p-6 hover:border-brand/40 hover:shadow-lg transition duration-300">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition duration-300">
              <Layers className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display font-bold text-ink group-hover:text-brand transition">Portfolio Analysis</h3>
            <p className="mt-1.5 text-xs text-muted leading-relaxed font-medium">
              {lang === "th" ? "จัดพอร์ตลงทุนจำลอง ติดตามปันผล และประเมินน้ำหนักสินทรัพย์อัจฉริยะ" : "Simulate capital allocations, track dividend yields, and balance asset grades."}
            </p>
          </Link>
        </div>
      </section>

      {/* 🔍 3. TOP UNDERVALUED STOCKS */}
      <section className={sectionClass}>
        <div className={splitHeaderClass}>
          <div className="max-w-2xl">
            <span className={`${eyebrowClass} border-up/30 bg-up/10 text-up`}>
              <Sparkles className="h-3.5 w-3.5" /> High-Conviction Value Targets
            </span>
            <h2 className={sectionTitleClass}>
              {lang === "th" ? "หุ้นราคาต่ำกว่ามูลค่าประเมินดีที่สุด (Top Undervalued Stocks)" : "Top Undervalued Stocks"}
            </h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-muted">
              {lang === "th" ? "หลักทรัพย์งบการเงินเด่นที่มีส่วนเผื่อความปลอดภัย (Margin of Safety) สูงสุดในฐานข้อมูล" : "Real-time ledger of deep price discounts computed relative to dynamic intrinsic targets."}
            </p>
          </div>
          <Link href="/undervalued-stocks">
            <Button variant="outline" size="sm" className="font-bold flex items-center gap-1">
              {lang === "th" ? "ดูอันดับทั้งหมด" : "Explore Screener"} <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {topUndervalued.map(({ stock, val }: { stock: any; val: any }) => {
            const isUS = stock.currency === "USD";
            const f = isUS ? dollar(val.fairValue) : baht(val.fairValue);
            return (
              <div key={stock.symbol} className="surface border border-line rounded-2xl p-5 hover:border-brand/40 transition duration-300 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AssetLogo symbol={stock.symbol} color={stock.color} size="sm" />
                    <div>
                      <Link href={`/stocks/${stock.symbol.toLowerCase()}`} className="font-mono font-bold text-ink hover:text-brand block">
                        {stock.symbol}
                      </Link>
                      <span className="text-[10px] text-muted font-semibold truncate block max-w-[120px]">
                        {lang === "th" ? stock.name : (stock.enName || stock.name)}
                      </span>
                    </div>
                  </div>
                  <span className="chip border-up/30 bg-up/10 text-up font-bold text-[9px]">
                    MOS {pct(val.marginOfSafety, 0)}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-line/40 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-bg/50 p-2 rounded-xl border border-line font-semibold">
                    <span className="text-[10px] text-muted block font-medium">P/E Ratio</span>
                    <span className="font-mono text-ink mt-0.5 block">{num(val.ratios.pe, 1)}x</span>
                  </div>
                  <div className="bg-bg/50 p-2 rounded-xl border border-line font-semibold">
                    <span className="text-[10px] text-muted block font-medium">{lang === "th" ? "ราคาประเมิน" : "Fair Value"}</span>
                    <span className="font-mono text-gold mt-0.5 block">{f}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 💰 4. TOP DIVIDEND STOCKS */}
      <section className={sectionClass}>
        <div className={splitHeaderClass}>
          <div className="max-w-2xl">
            <span className={`${eyebrowClass} border-gold/30 bg-gold/10 text-gold`}>
              <Sparkles className="h-3.5 w-3.5" /> Sustainable Yield Compounds
            </span>
            <h2 className={sectionTitleClass}>
              {lang === "th" ? "หุ้นปันผลตอบแทนสม่ำเสมอดีที่สุด (Top Dividend Stocks)" : "Top Dividend Stocks"}
            </h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-muted">
              {lang === "th" ? "คัดกรองหุ้นปันผลเด่นที่มีระดับการหมุนเวียนและเสถียรภาพงบสูงสุด" : "Qualifying cash cow index sorted dynamically by estimated dividend yields."}
            </p>
          </div>
          <Link href="/dividend-stocks">
            <Button variant="outline" size="sm" className="font-bold flex items-center gap-1">
              {lang === "th" ? "ดูอันดับทั้งหมด" : "Explore Screener"} <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {topDividend.map(({ stock, val }: { stock: any; val: any }) => {
            const isUS = stock.currency === "USD";
            const f = isUS ? dollar(val.fairValue) : baht(val.fairValue);
            return (
              <div key={stock.symbol} className="surface border border-line rounded-2xl p-5 hover:border-brand/40 transition duration-300 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AssetLogo symbol={stock.symbol} color={stock.color} size="sm" />
                    <div>
                      <Link href={`/stocks/${stock.symbol.toLowerCase()}`} className="font-mono font-bold text-ink hover:text-brand block">
                        {stock.symbol}
                      </Link>
                      <span className="text-[10px] text-muted font-semibold truncate block max-w-[120px]">
                        {lang === "th" ? stock.name : (stock.enName || stock.name)}
                      </span>
                    </div>
                  </div>
                  <span className="chip border-gold/30 bg-gold/10 text-gold font-bold text-[9px]">
                    Yield {num(val.ratios.dividendYield, 2)}%
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-line/40 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-bg/50 p-2 rounded-xl border border-line font-semibold">
                    <span className="text-[10px] text-muted block font-medium">ROE %</span>
                    <span className="font-mono text-ink mt-0.5 block">{num(val.ratios.roe, 1)}%</span>
                  </div>
                  <div className="bg-bg/50 p-2 rounded-xl border border-line font-semibold">
                    <span className="text-[10px] text-muted block font-medium">{lang === "th" ? "ราคาประเมิน" : "Fair Value"}</span>
                    <span className="font-mono text-gold mt-0.5 block">{f}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 📰 5. LATEST ANALYSIS */}
      <section id="insights" className={borderedSectionClass}>
        <div className={splitHeaderClass}>
          <div className="max-w-xl">
            <span className={`${eyebrowClass} border-brand/35 bg-brand/10 text-brand`}>
              <Sparkles className="h-3.5 w-3.5" /> Hot Value Reports
            </span>
            <h2 className={`${sectionTitleClass} md:text-4xl`}>
              {lang === "th" ? "เกาะติดวิเคราะห์มูลค่า & เทรนด์การลงทุน" : "Latest Financial Intelligence Reports"}
            </h2>
          </div>
          <Link href="/insights">
            <Button variant="outline" className="flex items-center gap-2 font-bold hover:scale-[1.02] active:scale-95 transition text-xs sm:text-sm">
              {lang === "th" ? "อ่านวิเคราะห์ทั้งหมด" : "Explore All News"} 
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {articlesList.map((art, idx) => {
            return (
              <article 
                key={art.id} 
                className="group relative flex flex-col justify-between surface rounded-2xl p-6 border border-line/60 hover:border-brand/40 hover:shadow-lg transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`chip border px-2 py-0.5 rounded-lg text-[10px] font-bold leading-none ${art.gradient}`}>
                      {art.category}
                    </span>
                    <span className="text-xs text-muted font-mono flex items-center gap-1 font-semibold">
                      ⏱️ {art.readTime}
                    </span>
                  </div>

                  <h3 className="font-display text-sm sm:text-base font-bold text-ink leading-snug group-hover:text-brand transition duration-200">
                    <Link href={art.id === "dcf-for-beginners" ? "/insights/dcf-calculator-stock-valuation" : `/insights?article=${art.id}`}>
                      {art.title}
                    </Link>
                  </h3>

                  <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-3 font-medium [overflow-wrap:anywhere]">
                    {art.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-line/45 flex items-center justify-between">
                  <span className="text-[10px] text-muted font-bold tracking-wider font-mono">
                    📅 {art.date}
                  </span>
                  <Link href={art.id === "dcf-for-beginners" ? "/insights/dcf-calculator-stock-valuation" : `/insights?article=${art.id}`} className="text-xs text-brand font-extrabold flex items-center gap-1 hover:underline">
                    {lang === "th" ? "อ่านต่อบทความ" : "Read Full"} 
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition duration-200" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 📚 6. INVESTMENT GUIDES (Topic Clusters) */}
      <section className={borderedSectionClass}>
        <div className={centeredHeaderClass}>
          <span className={`${eyebrowClass} border-brand/35 bg-brand/10 text-brand`}>
            <Star className="h-3.5 w-3.5" /> Structured Learning moats
          </span>
          <h2 className={sectionTitleClass}>
            {lang === "th" ? "คู่มือคอร์สวิเคราะห์หุ้นตามลำดับระดับ" : "Value Investing Educational Syllabus"}
          </h2>
          <p className="mt-2 text-xs font-medium leading-relaxed text-muted">
            {lang === "th" ? "Topic Clusters ช่วยปูพื้นฐานแนวคิด VI จากศูนย์จนถึงระดับแอดวานซ์อย่างเป็นระบบ" : "Topic cluster guides designed to build core compounding intelligence."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {investmentGuides.map((guide, idx) => (
            <Card key={idx} className="border border-line p-5.5 bg-surface/20 flex flex-col justify-between space-y-4 text-center">
              <div>
                <span className={`chip mx-auto justify-center border text-[10px] font-bold uppercase tracking-wider ${guide.badgeColor}`}>
                  {guide.level} Syllabus
                </span>
                
                <div className="mt-4 space-y-4">
                  {guide.topics.map((t, tIdx) => (
                    <div key={tIdx} className="group rounded-xl border border-line/45 bg-bg/35 p-3 text-center transition hover:border-brand/35 hover:bg-brand/5">
                      <span className="mx-auto mb-2 grid h-6 w-6 place-items-center rounded-full bg-brand/10 font-mono text-[10px] font-black text-brand">
                        {String(tIdx + 1).padStart(2, "0")}
                      </span>
                      <Link href={t.link} className="font-display text-xs sm:text-sm font-bold text-ink hover:text-brand transition block leading-snug">
                        {t.title}
                      </Link>
                      <p className="mx-auto mt-1.5 max-w-[240px] text-[11px] text-muted leading-relaxed font-medium [overflow-wrap:anywhere]">
                        {t.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ❓ 7. FAQ SECTION */}
      <section className={`${compactSectionClass} animate-fade-up`}>
        <div className={centeredHeaderClass}>
          <span
            className={`${eyebrowClass} border-amber-500/30 bg-amber-500/10 text-amber-400`}
          >
            <Info className="h-3.5 w-3.5" />{" "}
            {lang === "th" ? "FAQ พร้อมสำหรับดัชนีค้นหา" : "Search Engine Indexable FAQ"}
          </span>
          <h2 className={sectionTitleClass}>
            {lang === "th" ? "คำถามที่พบบ่อย (FAQs)" : "Frequently Asked Questions"}
          </h2>
        </div>

        <div className="space-y-3.5">
          {homeFaqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-line bg-bg/40 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-ink hover:bg-elevate/45 transition"
                >
                  <span>{faq.q}</span>
                  <span className="text-brand text-xs font-bold font-mono pl-3 shrink-0">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4.5 pt-1.5 border-t border-line/25 text-xs text-muted leading-relaxed font-medium [overflow-wrap:anywhere]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ✉️ 8. NEWSLETTER SECTION */}
      <section className={compactSectionClass}>
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-7 text-center md:p-12">
          <div className="aurora absolute inset-0 -z-10 opacity-70" />
          
          <h2 className={sectionTitleClass}>
            {lang === "th" ? "เกาะติดรายงานวิเคราะห์หุ้นเจาะลึกฟรี" : "Subscribe to Premium Value Reports"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-muted font-medium leading-relaxed [overflow-wrap:anywhere]">
            {lang === "th"
              ? "รับบทความวิเคราะห์กลยุทธ์ W-8BEN, Feeder Fund และหุ้น undervalue ดาวรุ่งส่งตรงถึงอีเมลคุณทุกสัปดาห์ ไม่มีโฆษณาคั่น"
              : "Weekly institutional metrics, cross-border tax advice, and underpriced asset notifications sent straight to your inbox."}
          </p>

          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="mt-6 flex flex-col sm:flex-row max-w-md mx-auto gap-2">
              <input
                type="email"
                required
                placeholder={lang === "th" ? "กรอกอีเมลของคุณ..." : "Enter your email address..."}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-xl border border-line bg-bg px-4 py-2 text-xs text-ink focus:border-brand focus:ring-1 focus:ring-brand outline-none font-bold"
              />
              <Button type="submit" size="sm" className="font-bold shrink-0">
                {lang === "th" ? "สมัครรับข้อมูล" : "Subscribe Now"}
              </Button>
            </form>
          ) : (
            <div className="mt-6 p-4 border border-up/30 bg-up/10 rounded-2xl max-w-md mx-auto animate-fade-up text-xs text-up font-bold">
              🎉 {lang === "th" ? "สำเร็จ! เราได้ส่งรายงานต้อนรับพอร์ตคุณค่าไปยังอีเมลของคุณเรียบร้อย" : "Success! Welcome package and value checklist sent to your inbox."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-extrabold text-ink">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function Mini({
  label,
  value,
  accent,
  up,
}: {
  label: string;
  value: string;
  accent?: boolean;
  up?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-bg px-3 py-2.5 text-center">
      <div className="text-[10px] font-medium leading-snug text-muted [overflow-wrap:anywhere] sm:text-[11px]">{label}</div>
      <div
        className={`num mt-0.5 font-bold text-xs [overflow-wrap:anywhere] ${
          accent ? "text-gold" : up === false ? "text-down" : up ? "text-up" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

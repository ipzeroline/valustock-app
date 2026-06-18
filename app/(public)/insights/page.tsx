"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import { useTranslation } from "@/lib/translations";
import { STOCKS } from "@/lib/stocks";
import { num, pct, dollar, nav, baht } from "@/lib/format";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronRight,
  CircleDollarSign,
  Target,
  Calculator,
  Shield,
  Zap,
  BarChart3,
  Wallet,
  Download,
  Gauge,
  Plus,
  Minus,
  CheckCircle,
  RefreshCw,
  Calendar,
  FileText,
} from "@/lib/icons";

interface Article {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  summary: string;
  content: string;
  gradient: string;
  tag: string;
}

const ARTICLES_TH: Article[] = [
  {
    id: "tech-vs-dividend",
    title: "หุ้นเทคโนโลยีสหรัฐฯ vs หุ้นปันผลไทย: จัดพอร์ตอย่างไรในครึ่งปีหลัง?",
    category: "จัดพอร์ตการลงทุน",
    date: "30 พ.ค. 2026",
    readTime: "5 นาที",
    tag: "แนะจัดพอร์ต",
    gradient: "from-blue-600/20 to-purple-600/20 text-purple-400 border-purple-500/20",
    summary: "เจาะลึกโครงสร้างอุตสาหกรรมในตลาดหุ้นสหรัฐฯ (US tech) และตลาดหุ้นไทย (Value/Dividend) พร้อมวิเคราะห์วิธีลดความเสี่ยงจากอัตราแลกเปลี่ยนภาษีนำเข้าเงินกลับประเทศแบบใหม่",
    content: `ในการจัดพอร์ตระดับโลก นักลงทุนไทยมักประสบปัญหาการตัดสินใจระหว่างการเติบโตระดับโลก (Global Growth) กับกระแสเงินสดที่สม่ำเสมอในประเทศ (Local Yield)...

**1. หุ้นเทคโนโลยีสหรัฐฯ (US Tech)**
มีจุดเด่นในด้านอุตสาหกรรมแห่งอนาคต เช่น AI, Cloud, Semiconductors (เช่น NVDA, MSFT, AAPL) ที่ขับเคลื่อนด้วยนวัตกรรมสูง แต่อัตราการจ่ายปันผลค่อนข้างน้อยและมีความผันผวนสูงตามทิศทางดอกเบี้ย

**2. หุ้นปันผลไทย (Thai Dividend)**
เช่น PTT, ADVANC, CPALL มีรายได้ที่เสถียร มีกำไรต่อเนื่อง และมีอัตราส่วนเงินปันผลตอบแทน (Dividend Yield) ในระดับ 4-7% ซึ่งทำหน้าที่เป็นเบาะรองรับยามตลาดผันผวน

**ข้อแนะนำในการจัดพอร์ตสำหรับคนไทย:**
- สำหรับวัยทำงาน (อายุ 25-45 ปี): แนะนำแบ่งพอร์ตเป็น Core Portfolio หุ้นเทคโนโลยีสหรัฐฯ 60% เพื่อสะสมความมั่งคั่งระยะยาว และ Satellite Portfolio หุ้นไทยปันผลสูง 30% อีก 10% ถือเป็นกองทุนตราสารหนี้หรือสภาพคล่อง
- ป้องกันความเสี่ยงเรื่องภาษีต่างประเทศปี 2024-2026: หากมีกำไรจากการขายหุ้นสหรัฐฯ แนะนำให้วางแผนนำเงินกลับเข้าไทยอย่างรอบคอบ หรือพักเงินไว้ในบัญชีต่างประเทศข้ามปีภาษีก่อนนำกลับ`
  },
  {
    id: "feeder-funds-guide",
    title: "คู่มือเลือกกองทุนรวม Feeder Fund สำหรับคนไทย: เลี่ยงค่าธรรมเนียมซ้ำซ้อน",
    category: "กองทุนรวมต่างประเทศ",
    date: "29 พ.ค. 2026",
    readTime: "4 นาที",
    tag: "สำหรับกองทุน",
    gradient: "from-emerald-600/20 to-teal-600/20 text-teal-400 border-teal-500/20",
    summary: "เข้าใจความเชื่อมโยงระหว่างกองทุนไทย (Feeder Fund) และกองทุนหลักต่างประเทศ (Master Fund) เคล็ดลับดูค่าธรรมเนียมแฝงไม่ให้ผลตอบแทนตกหล่น",
    content: `เมื่อนักลงทุนไทยต้องการซื้อหุ้นต่างประเทศโดยไม่อยากเปิดบัญชีต่างประเทศโดยตรง กองทุนรวมประเภท Feeder Fund คือทางออกที่ง่ายที่สุด แต่การซ่อนตัวของค่าใช้จ่ายเป็นสิ่งที่ต้องระวังอย่างมาก...

**ค่าธรรมเนียมสองต่อ (Double-Layer Fees) คืออะไร?**
เวลาลงทุนใน Feeder Fund ระบบจะมีการหักค่าใช้จ่าย 2 ระดับ:
1. ค่าธรรมเนียมการจัดการของบลจ.ไทย (Management Fee TH): เก็บโดยผู้ดูแลฝั่งไทย มักอยู่ที่ 0.5% - 1.5% ต่อปี
2. ค่าธรรมเนียมของกองทุนต่างประเทศ (Expense Ratio Master): เก็บโดย บลจ.ระดับโลก (เช่น Morgan Stanley, Fidelity, BlackRock) มักอยู่ที่ 0.7% - 1.8% ต่อปี

**วิธีเลือก Feeder Fund ให้คุ้มค่าที่สุด:**
- เช็กค่าธรรมเนียมรวม (TER - Total Expense Ratio) จากหนังสือชี้ชวนเสมอ
- ตรวจสอบความสม่ำเสมอในการปรับพอร์ตและอัตรา tracking error ของกองทุนไทยเทียบกับกองทุนหลัก
- เลือกลงทุนในคลาสหน่วยลงทุนที่ไม่เก็บค่าธรรมเนียมการจัดการแบบซ้ำซ้อน (เช่น คลาส Institutional หรือคลาสสะสมมูลค่า)`
  },
  {
    id: "w-8ben-tax-tips",
    title: "เจาะลึกวิธียื่นแบบฟอร์ม W-8BEN เพื่อลดภาษีปันผลหุ้นสหรัฐฯ เหลือ 15%",
    category: "ภาษี & กฎหมาย",
    date: "28 พ.ค. 2026",
    readTime: "6 นาที",
    tag: "ความรู้ภาษี",
    gradient: "from-amber-600/20 to-red-600/20 text-amber-400 border-amber-500/20",
    summary: "ขั้นตอนละเอียดสำหรับนักลงทุนที่เปิดพอร์ตนอกประเทศ เพื่อรับสิทธิ์ลดหย่อนภาษีหัก ณ ที่จ่ายจากปันผลสหรัฐฯ จากปกติ 30% ให้เหลือเพียง 15% ตามอนุสัญญาภาษีซ้อน",
    content: `สำหรับนักลงทุนไทยที่เน้นเก็บหุ้นปันผลในฝั่งอเมริกา (เช่น Coca-Cola, Realty Income หรือ Microsoft) ภาษีปันผลหัก ณ ที่จ่ายถือเป็นปัจจัยสำคัญที่ห้ามมองข้าม...

**แบบฟอร์ม W-8BEN คืออะไร?**
W-8BEN (Certificate of Foreign Status of Beneficial Owner for United States Tax Withholding and Reporting) เป็นแบบฟอร์มที่พิสูจน์ว่าคุณเป็นคนไทย (บุคคลธรรมดาต่างชาติที่ไม่ได้พำนักในสหรัฐฯ) เพื่อขอใช้สิทธิ์ภายใต้อนุสัญญาภาษีซ้อน (Double Taxation Treaty - DTA) ระหว่างไทยและสหรัฐฯ

**ประโยชน์สูงสุด:**
- ลดอัตราภาษีปันผลจาก 30% เหลือเพียง 15% ทันที
- แบบฟอร์มมีอายุ 3 ปีปฏิทิน (ต้องกรอกใหม่เมื่อครบกำหนด)

**ขั้นตอนยื่นผ่านโบรกเกอร์ไทยหรือโบรกเกอร์นอก:**
1. โบรกเกอร์ดิจิทัลในไทยและโบรกเกอร์นอกหลายแห่ง (เช่น Interactive Brokers) จะมีระบบกรอก W-8BEN อิเล็กทรอนิกส์ให้คุณทันทีก่อนเริ่มซื้อขายหุ้นต่างประเทศ
2. ตรวจสอบข้อมูลชื่อ-ที่อยู่ให้ตรงกับพาสปอร์ตไทย
3. กรอกหมายเลขบัตรประชาชนไทยในช่อง Foreign Tax Identifying Number (TIN)`
  },
  {
    id: "dcf-for-beginners",
    title: "การประเมินมูลค่าหุ้นด้วยโมเดล Discounted Cash Flow (DCF) สำหรับมือใหม่",
    category: "ความรู้คุณค่า",
    date: "26 พ.ค. 2026",
    readTime: "8 นาที",
    tag: "มือใหม่เน้นคุณค่า",
    gradient: "from-rose-600/20 to-pink-600/20 text-rose-400 border-rose-500/20",
    summary: "สอนคิดลดกระแสเงินสดหามูลค่าที่แท้จริงแบบเข้าใจง่ายพร้อมสูตรและตัวอย่างจริง เพื่อให้ได้เปรียบตลาดและปลอดภัยทุกการเข้าซื้อ",
    content: `หัวใจหลักของนักลงทุนเน้นคุณค่า (Value Investor) คือ 'ซื้อของที่ราคาต่ำกว่ามูลค่าที่แท้จริง' และหนึ่งในเครื่องมือที่เป็นมาตรฐานทองคำคือการวิเคราะห์กระแสเงินสดคิดลด (DCF)...

**หลักการคิดลดกระแสเงินสด:**
เงิน 100 บาทในวันนี้ มีมูลค่ามากกว่าเงิน 100 บาทในอีก 5 ปีข้างหน้า เพราะวันนี้เราเอาเงินไปลงทุนสร้างผลตอบแทนได้ ดังนั้น DCF จึงคาดการณ์กระแสเงินสดอิสระ (Free Cash Flow) ของกิจการไปในอนาคต N ปี แล้ว 'คิดลด' (Discount) กลับมาเป็นมูลค่าปัจจุบันด้วยอัตราคิดลด (Discount Rate หรือ WACC)

**3 ปัจจัยสำคัญในเครื่องคำนวณ ValuStock:**
1. **Free Cash Flow (FCF)**: กระแสเงินสดที่เหลือจริงหลังจากหักเงินลงทุนขยายธุรกิจ (CAPEX)
2. **Growth Rate (g)**: อัตราการเติบโตของกระแสเงินสด คาดการณ์อย่างระมัดระวัง (เช่น 5-10% ต่อปี)
3. **Discount Rate (r)**: ผลตอบแทนคาดหวังหรือต้นทุนทางการเงิน มักใช้ 8-10% สำหรับหุ้นขนาดใหญ่`
  }
];

const ARTICLES_EN: Article[] = [
  {
    id: "tech-vs-dividend",
    title: "US Technology vs. Thai Dividend Stocks: How to Allocate in 2H2026?",
    category: "Asset Allocation",
    date: "May 30, 2026",
    readTime: "5 mins",
    tag: "Portfolio Tips",
    gradient: "from-blue-600/20 to-purple-600/20 text-purple-400 border-purple-500/20",
    summary: "A deep dive into industrial structures of the US Tech and Thai Dividend sectors, detailing global growth strategies alongside inbound personal tax updates for Thai citizens.",
    content: `In global asset allocation, Thai investors often face a key dilemma: Global Growth vs. Local Yield.

**1. US Technology (US Tech)**
Features future-oriented tech industries driven by AI, cloud computing, and semiconductors (e.g., NVDA, MSFT, AAPL) yielding massive capital gains but minimal yields and high volatility.

**2. Thai Dividend Equities**
Blue chips like PTT, ADVANC, and CPALL offer stable earnings, steady defensive cash flows, and attractive dividend yields of 4-7% which anchor portfolios during down cycles.

**Portfolio Advice for Thai Investors:**
- Working Professionals (Ages 25-45): Maintain a Core Portfolio with 60% in US Tech/Global stocks for compounding growth, alongside a Satellite Portfolio with 30% in high-yielding Thai equities, and 10% in liquid instruments.
- International Tax Management: Plan personal inbound earnings transfers meticulously or defer offshore earnings across calendar years to leverage lower brackets.`
  },
  {
    id: "feeder-funds-guide",
    title: "Thai Feeder Funds Handbook: Avoid Double-Layer Management Fees",
    category: "Offshore Mutual Funds",
    date: "May 29, 2026",
    readTime: "4 mins",
    tag: "Fund Analysis",
    gradient: "from-emerald-600/20 to-teal-600/20 text-teal-400 border-teal-500/20",
    summary: "Understand the mechanics connecting Thai local Feeder Funds to global Master Funds. Discover hidden expense ratios to keep your compounding yields intact.",
    content: `Feeder funds provide Thai investors with direct cross-border market access without opening foreign accounts. However, double-layer fee structures must be carefully reviewed.

**Understanding Double-Layer Fees:**
1. Local Management Fee (Thai Feeder): Charged by local asset managers, typically ranging from 0.5% to 1.5% annually.
2. Global Management Fee (Master Fund): Charged by institutional global managers (e.g., Morgan Stanley, BlackRock), typically ranging from 0.7% to 1.8% annually.

**Feeder Fund Selection Tips:**
- Always analyze the Total Expense Ratio (TER) in the fund's official prospectus.
- Review the tracking error and historical correlation against its underlying Master Fund.
- Prefer institutional or accumulation units to minimize double-dipping fees.`
  },
  {
    id: "w-8ben-tax-tips",
    title: "Step-by-Step W-8BEN Filing Guide to Halve US Withholding Dividend Taxes",
    category: "Taxation & Regulation",
    date: "May 28, 2026",
    readTime: "6 mins",
    tag: "Tax Education",
    gradient: "from-amber-600/20 to-red-600/20 text-amber-400 border-amber-500/20",
    summary: "A complete walk-through for international investors filing W-8BEN certificates to lower US dividend withholding taxes from 30% down to 15% under double-taxation treaties.",
    content: `For value investors building cash flow from US dividend heavyweights (like Coca-Cola, Realty Income, or Microsoft), optimizing withholding taxes is paramount.

**What is a W-8BEN Form?**
W-8BEN (Certificate of Foreign Status of Beneficial Owner for United States Tax Withholding and Reporting) confirms your non-US status and establishes foreign tax treaty eligibility between Thailand and the US.

**Core Benefits:**
- Automatically reduces US dividend withholding taxes from 30% to 15%.
- Remains valid for 3 calendar years (requires refiling thereafter).

**Filing Guide via Local and Foreign Brokers:**
1. Many Thai digital brokerages and international firms (e.g., Interactive Brokers) offer integrated electronic W-8BEN forms during account setup.
2. Ensure your legal name and address align exactly with your Thai passport.
3. Insert your 13-digit Thai national ID under the Foreign Tax Identifying Number (TIN) field.`
  },
  {
    id: "dcf-for-beginners",
    title: "Discounted Cash Flow (DCF) Valuation Playbook for Value Investors",
    category: "Value Strategy",
    date: "May 26, 2026",
    readTime: "8 mins",
    tag: "Defensive Strategy",
    gradient: "from-rose-600/20 to-pink-600/20 text-rose-400 border-rose-500/20",
    summary: "A step-by-step introduction to projecting and discounting free cash flows. Learn formulas, growth vectors, and safety margins to secure defensive entries.",
    content: `The core principle of value investing is simple: 'Buy assets trading below their intrinsic value.' Discounted Cash Flow (DCF) modeling is the gold standard methodology.

**The Mechanics of Discounting Cash Flows:**
A dollar today is worth more than a dollar in five years because present funds can be compounded immediately. DCF projects future Free Cash Flows (FCF) over N years, then discounts them to present value using WACC.

**Three Pillars in ValuStock's Engine:**
1. **Free Cash Flow (FCF)**: Organic cash left over after operating expenses and Capital Expenditures (CAPEX).
2. **Growth Rate (g)**: Conservatively estimated FCF growth over the initial period (e.g., 5-10%).
3. **Discount Rate (r)**: The required rate of return or WACC, typically 8-10% for large caps.`
  }
];

export default function InsightsPage() {
  const { t, lang } = useTranslation();
  const [activeSegment, setActiveSegment] = useState<"articles" | "dev_portal" | "futures_sandbox">("articles");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const insightsHeroImage =
    "/article-image/valustock-insights-research-hub?category=Value%20Investing%20Guides&symbol=VI&v=5";

  // DB news load
  useEffect(() => {
    setLoadingDb(true);
    fetch("/api/admin/articles")
      .then((res) => res.json())
      .then((data) => {
        if (data.articles && data.articles.length > 0) {
          const mapped: Article[] = data.articles.map((a: any) => {
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
              content: a.content || "",
            };
          });
          setDbArticles(mapped);
        }
      })
      .catch((err) => console.error("Error loading articles from DB:", err))
      .finally(() => setLoadingDb(false));
  }, [lang]);

  const ARTICLES = useMemo(() => {
    const mocks = lang === "th" ? ARTICLES_TH : ARTICLES_EN;
    const combined = [...dbArticles, ...mocks];
    const seen = new Set<string>();
    const unique: Article[] = [];
    for (const art of combined) {
      if (!seen.has(art.id)) {
        seen.add(art.id);
        unique.push(art);
      }
    }
    return unique;
  }, [dbArticles, lang]);

  const seoPillars = [
    {
      href: "/insights/dcf-calculator-stock-valuation",
      title: lang === "th" ? "DCF คืออะไร?" : "What is DCF?",
      desc:
        lang === "th"
          ? "เรียนรู้การคำนวณมูลค่าหุ้นด้วย Free Cash Flow, WACC และ Terminal Value"
          : "Learn stock valuation with free cash flow, WACC, and terminal value.",
      icon: <Calculator className="h-4.5 w-4.5" />,
    },
    {
      href: "/intrinsic-value-calculator",
      title: lang === "th" ? "Intrinsic Value คืออะไร?" : "What is Intrinsic Value?",
      desc:
        lang === "th"
          ? "เข้าใจมูลค่าที่แท้จริงของหุ้นและวิธีใช้ Graham Number ประเมินราคาเหมาะสม"
          : "Understand true business value and Graham Number valuation.",
      icon: <Target className="h-4.5 w-4.5" />,
    },
    {
      href: "/value-investing",
      title: lang === "th" ? "ลงทุนแบบ VI เริ่มยังไง?" : "How to Start Value Investing?",
      desc:
        lang === "th"
          ? "วางกรอบเลือกหุ้นคุณค่า Margin of Safety และการถือระยะยาวแบบมีวินัย"
          : "Build a value investing framework with margin of safety and discipline.",
      icon: <Shield className="h-4.5 w-4.5" />,
    },
  ];

  const faqItems = [
    {
      q: lang === "th" ? "ValuStock Insights เหมาะกับใคร?" : "Who is ValuStock Insights for?",
      a:
        lang === "th"
          ? "เหมาะกับนักลงทุนไทยที่ต้องการอ่านบทวิเคราะห์หุ้นไทย หุ้นสหรัฐ แนวคิด Value Investing, DCF, Intrinsic Value, Margin of Safety, กองทุนต่างประเทศ และภาษีลงทุนแบบเข้าใจง่าย"
          : "It is built for investors who want practical explainers on Thai and US stocks, value investing, DCF, intrinsic value, margin of safety, offshore funds, and tax topics.",
    },
    {
      q: lang === "th" ? "บทวิเคราะห์ในหน้านี้เป็นคำแนะนำซื้อขายไหม?" : "Is this investment advice?",
      a:
        lang === "th"
          ? "ไม่ใช่ครับ เนื้อหาเป็นข้อมูลเพื่อการศึกษาและช่วยวิเคราะห์ นักลงทุนควรตรวจงบการเงิน ข่าว ความเสี่ยง และเป้าหมายของตัวเองก่อนตัดสินใจลงทุน"
          : "No. The content is for education and research. Investors should review filings, news, risks, and personal objectives before investing.",
    },
    {
      q: lang === "th" ? "ควรเริ่มอ่านหัวข้อไหนก่อน?" : "Where should I start?",
      a:
        lang === "th"
          ? "ถ้าเป็นมือใหม่ แนะนำเริ่มจาก Intrinsic Value, Margin of Safety และ DCF ก่อน เพราะเป็นแกนหลักของการประเมินว่าหุ้นถูกหรือแพงเมื่อเทียบกับพื้นฐาน"
          : "Start with intrinsic value, margin of safety, and DCF because they form the core of judging whether a stock is cheap or expensive versus fundamentals.",
    },
    {
      q: lang === "th" ? "มีเนื้อหาเกี่ยวกับภาษีหุ้นต่างประเทศไหม?" : "Does this cover international investment tax?",
      a:
        lang === "th"
          ? "มีครับ มีหัวข้อ W-8BEN, ภาษีปันผลหุ้นสหรัฐ และการวางแผนนำเงินลงทุนต่างประเทศกลับไทย แต่เนื้อหาภาษีเป็นข้อมูลเบื้องต้น ไม่ใช่คำปรึกษาภาษีอย่างเป็นทางการ"
          : "Yes. It covers W-8BEN, US dividend withholding tax, and Thai inbound tax planning at a high level, but it is not formal tax advice.",
    },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://valustock.com/insights#collection",
        name: lang === "th" ? "ValuStock Insights บทวิเคราะห์หุ้นและคู่มือลงทุน" : "ValuStock Insights",
        url: "https://valustock.com/insights",
        description:
          lang === "th"
            ? "ศูนย์บทวิเคราะห์หุ้นไทย หุ้นสหรัฐ Value Investing, DCF, Intrinsic Value, Margin of Safety และภาษีนักลงทุนไทย"
            : "A research hub for Thai and US stocks, value investing, DCF, intrinsic value, margin of safety, and investor tax topics.",
        image: "https://valustock.com/article-image/valustock-insights-research-hub?category=Value%20Investing%20Guides&symbol=VI&v=5",
        inLanguage: lang === "th" ? "th-TH" : "en-US",
      },
      {
        "@type": "ItemList",
        "@id": "https://valustock.com/insights#articles",
        itemListElement: ARTICLES.slice(0, 10).map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Article",
            headline: article.title,
            description: article.summary,
            url:
              article.id === "dcf-for-beginners"
                ? "https://valustock.com/insights/dcf-calculator-stock-valuation"
                : `https://valustock.com/insights?article=${article.id}`,
            datePublished: article.date,
            author: {
              "@type": "Organization",
              name: "ValuStock",
            },
          },
        })),
      },
      {
        "@type": "FAQPage",
        "@id": "https://valustock.com/insights#faq",
        mainEntity: faqItems.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "ValuStock",
            item: "https://valustock.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Insights",
            item: "https://valustock.com/insights",
          },
        ],
      },
    ],
  };

  // Pre-select article from URL query param (e.g. ?article=tech-vs-dividend)
  useEffect(() => {
    if (typeof window !== "undefined" && ARTICLES.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get("article");
      if (slug === "dcf-for-beginners") {
        window.location.replace("/insights/dcf-calculator-stock-valuation");
        return;
      }
      if (slug) {
        const found = ARTICLES.find((a) => a.id === slug);
        if (found) {
          setActiveArticle(found);
          setActiveSegment("articles");
        }
      }
    }
  }, [ARTICLES]);

  // AI report simulation
  const generateAIReport = () => {
    setGenerating(true);
    setProgress(10);
    setAiReport(null);

    const steps = [
      { p: 25, delay: 600 },
      { p: 55, delay: 1200 },
      { p: 85, delay: 1800 },
      { p: 100, delay: 2400 },
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setProgress(step.p);
        if (step.p === 100) {
          setTimeout(() => {
            if (lang === "th") {
              setAiReport(`### 📈 บทวิเคราะห์ประจำวันนี้โดย AI หุ่นยนต์วิเคราะห์อัตโนมัติ (Automated Market Insight)
*อัปเดตข้อมูลล่าสุดเมื่อ: ${new Date().toLocaleDateString("th-TH")} | สภาวะตลาดรอบวัน*

#### 1. ภาพรวมตลาดหุ้นไทย (SET Index) และหุ้นใหญ่น่าสนใจ
- จากการประเมินด้วยแบบจำลอง DCF และ Graham Number พบว่าหุ้นกลุ่มพลังงานขนาดใหญ่อย่าง **PTT** มีส่วนเผื่อความปลอดภัย (Margin of Safety) แข็งแกร่งเฉลี่ยอยู่ที่ประมาณ **40%** ซึ่งจัดว่าเป็นระดับ Undervalued ที่น่าจับตาสำหรับนักลงทุนที่ต้องการกระแสเงินสดปันผลสูง
- หุ้นกลุ่มขนส่งอย่าง **AOT** มีการประเมินเติบโตคาดการณ์ในระดับ **10%** สะท้อนการฟื้นตัวที่แข็งแกร่งของภาคการท่องเที่ยว แต่ราคาปัจจุบันเข้าใกล้ราคาเหมาะสม (Fair Value) ทำให้เหลือ MOS ราว **15%** แนะนำซื้อสะสมเมื่อราคาอ่อนตัว

#### 2. เจาะลึกตลาดหุ้นสหรัฐฯ (US Tech & AI Growth)
- หุ้น **NVDA** (NVIDIA) นำพาเทคโนโลยีปัญญาประดิษฐ์เติบโตอย่างร้อนแรง คาดการณ์อัตราการโตกระแสเงินสด FCF สูงสุดถึง **28%** ต่อปี แต่เนื่องจากราคาปรับตัวขึ้นสูงเกือบ $940 ทำให้ตัวคูณมูลค่าตึงตัว P/E สูงกว่า **30 เท่า** นักลงทุนเน้นคุณค่าควรรอจังหวะปรับฐานใหญ่ในการเข้าทยอยสะสม
- หุ้นยักษ์ใหญ่อย่าง **AAPL** (Apple) และ **MSFT** (Microsoft) มีความผันผวนค่อนข้างต่ำและมีฐานเงินสดแกร่ง (Cash Balance รวมกันกว่า 1.5 แสนล้านดอลลาร์) ถือเป็นแหล่งพักพิงความเสี่ยงที่ดีหากเงินเฟ้อกลับมาพุ่งสูงอีกครั้ง

#### 3. สรุปคำแนะนำกองทุนรวมสำหรับนักลงทุนไทย
- สำหรับนักลงทุนที่ไม่สะดวกถือหุ้นตรง การกระจายความเสี่ยงไปในกองทุนดัชนีอย่าง **SCBSET50** (สัดส่วนหุ้นไทย 50 อันดับแรก ค่าธรรมเนียมต่ำมากเพียง 0.45% ต่อปี) ถือเป็นการสร้าง Core Portfolio ที่ดี
- ควบคู่ไปกับ **B-INNOTECH** (Feeder ไปยัง Fidelity Global Tech) เพื่อจับกระแส AI โลก โดยแนะนำแบบดอลลาร์คอสต์เอเวอเรจ (DCA) เพื่อเฉลี่ยต้นทุนอัตราแลกเปลี่ยนในยุคที่ค่าเงินบาทผันผวน`);
            } else {
              setAiReport(`### 📈 Today's Financial Market Analysis by AI Analyst (Automated Market Insight)
*Last Updated: ${new Date().toLocaleDateString("en-US")} | Daily Market Conditions*

#### 1. Thai Equities Overview (SET Index)
- Evaluating via DCF and Graham models shows large-cap energy giant **PTT** offering a solid average Margin of Safety (MOS) of **40%**, making it an attractive undervalued dividend pick.
- Transport leader **AOT** shows a projected FCF growth rate of **10%** on recovering tourism. However, its current price sits near its Fair Value, leaving a modest **15%** MOS. We recommend buying on minor pullbacks.

#### 2. US Tech & AI Growth Analysis
- Ticker **NVDA** (NVIDIA) continues its meteoric rise driven by global AI demand, with an estimated FCF growth rate of **28%** annually. Yet at a price near $940, it sports a stretched P/E ratio exceeding **30x**. Value investors should wait for healthy corrections.
- Blue chips **AAPL** (Apple) and **MSFT** (Microsoft) exhibit very low beta and a massive combined cash buffer of $150 billion, serving as ideal inflation hedges in volatile environments.

#### 3. Investment Recommendations & Feeder Strategies
- For mutual fund investors, passive index ETFs like **SCBSET50** (tracking the top 50 Thai equities at an ultra-low expense ratio of 0.45% annually) represent a sturdy Core Portfolio builder.
- Complement this with global feeder options like **B-INNOTECH** (feeding into Fidelity Global Tech) to capture global AI tailwinds. Use Dollar-Cost-Averaging (DCA) to smooth out FX swings.`);
            }
            setGenerating(false);
          }, 300);
        }
      }, step.delay);
    });
  };

  // ==================== TABS INTERACTIVE LOCAL STATES ====================
  // 1. REST API Explorer Local States
  const [restEndpoint, setRestEndpoint] = useState("/v3/reference/tickers/VTSAX");
  const [restResponse, setRestResponse] = useState<string | null>(null);
  const [restLoading, setRestLoading] = useState(false);

  // 2. WebSocket Simulation Local States
  const [wsMessages, setWsMessages] = useState<string[]>([]);
  const [wsActive, setWsActive] = useState(false);
  const [jitterTime, setJitterTime] = useState(14);
  const [wsTesting, setWsTesting] = useState(false);

  // 3. Flat-Files Local CSV Exporter States
  const [csvSymbol, setCsvSymbol] = useState("VTSAX");
  const [csvShares, setCsvShares] = useState(100);
  const [csvPrice, setCsvPrice] = useState(128.5);
  const [csvAction, setCsvAction] = useState("BUY");
  const [csvLogs, setCsvLogs] = useState<string>("");

  // 4. Futures Leverage Simulator States
  const [futuresAsset, setFuturesAsset] = useState("GOLD");
  const [leverageFactor, setLeverageFactor] = useState(10);
  const [futuresPriceMove, setFuturesPriceMove] = useState(2); // In percent

  // 5. Thai Personal Tax & FX Auditor States
  const [capitalGainsUsd, setCapitalGainsUsd] = useState(25000);
  const [buyRate, setBuyRate] = useState(34.20);
  const [repatriationRate, setRepatriationRate] = useState(36.45);
  const [sameYearRepatPercent, setSameYearRepatPercent] = useState(50); // 0% to 100%

  // Real-time WebSocket stream generator simulator
  useEffect(() => {
    if (!wsActive) return;
    setWsMessages([
      `[${new Date().toLocaleTimeString()}] 🟢 CONNECTED: wss://stream.valustock.com/v1`,
      `[${new Date().toLocaleTimeString()}] 📥 SUBSCRIBE: ["VTSAX", "AAPL", "BTC", "GOLD"]`,
    ]);

    const interval = setInterval(() => {
      // Pick random asset to update
      const assets = [
        { sym: "VTSAX", p: 128.5 + (Math.random() - 0.5) * 0.4, currency: "USD", type: "US_FUND" },
        { sym: "AAPL", p: 189.45 + (Math.random() - 0.5) * 1.5, currency: "USD", type: "US_STOCK" },
        { sym: "BTC", p: 67500 + (Math.random() - 0.5) * 200, currency: "USD", type: "CRYPTO" },
        { sym: "GOLD", p: 2340.5 + (Math.random() - 0.5) * 5, currency: "USD", type: "FUTURES" },
      ];
      const picked = assets[Math.floor(Math.random() * assets.length)];
      const latency = 8 + Math.floor(Math.random() * 12);
      setJitterTime(latency);

      const priceStr = picked.type === "US_FUND" ? `$${picked.p.toFixed(4)}` : `$${picked.p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      setWsMessages((prev) => [
        `[${new Date().toLocaleTimeString()}] ⚡ UPDATE: ${picked.sym} ➔ ${priceStr} | Latency: ${latency}ms | RTT`,
        ...prev.slice(0, 15),
      ]);
    }, 1500);

    return () => clearInterval(interval);
  }, [wsActive]);

  // REST mock response handler
  const handleRestSend = () => {
    setRestLoading(true);
    setRestResponse(null);
    setTimeout(() => {
      let payload = {};
      if (restEndpoint.includes("tickers/VTSAX")) {
        payload = {
          ticker: "VTSAX",
          name: "Vanguard Total Stock Market Index Fund Admiral Shares",
          assetType: "US_FUND",
          currency: "USD",
          market: "MUTUAL_FUND",
          aum: 1350000000000,
          expenseRatio: 0.04,
          price: 128.50,
          riskLevel: 6,
          topHoldings: [
            { symbol: "MSFT", weight: 0.068 },
            { symbol: "AAPL", weight: 0.062 },
            { symbol: "NVDA", weight: 0.055 },
            { symbol: "AMZN", weight: 0.038 }
          ]
        };
      } else if (restEndpoint.includes("aggs/ticker/AAPL")) {
        payload = {
          ticker: "AAPL",
          adjusted: true,
          queryCount: 30,
          resultsCount: 30,
          results: Array.from({ length: 10 }).map((_, i) => ({
            v: 52140000 + Math.random() * 10000000,
            vw: 188.5 + Math.random() * 4,
            o: 187.9 + Math.random() * 4,
            c: 189.45 + (Math.random() - 0.5) * 3,
            h: 190.1,
            l: 186.5,
            t: Date.now() - i * 86400000
          }))
        };
      } else if (restEndpoint.includes("news?limit=5")) {
        payload = {
          status: "OK",
          results: [
            { title: "Vanguard VTSAX index fund sees record cash inflows", published: "2026-05-30T10:00:00Z", sentiment: "positive", tickers: ["VTSAX"] },
            { title: "AI processing demands drive semiconductor rallies", published: "2026-05-30T08:30:00Z", sentiment: "positive", tickers: ["NVDA", "MSFT"] }
          ]
        };
      } else {
        payload = {
          contract: "GOLD",
          market: "COMEX",
          size: "100 Troy Ounces",
          initialMargin: 8500,
          maintenanceMargin: 6300,
          leverageFactor: 15,
          expiry: "Dec 2026"
        };
      }
      setRestResponse(JSON.stringify(payload, null, 2));
      setRestLoading(false);
    }, 600);
  };

  // Flat-Files Mock ledger CSV generator
  const handleGenerateCsv = () => {
    const header = "Ticker,Type,Shares,Price,Total,Action,Currency,Timestamp\n";
    const total = csvShares * csvPrice;
    const row = `${csvSymbol},${csvSymbol === "VTSAX" ? "US_FUND" : "STOCK"},${csvShares},${csvPrice},${total.toFixed(2)},${csvAction},USD,${new Date().toISOString()}`;
    const fullCsv = header + row;
    setCsvLogs(fullCsv);

    // Dynamic browser trigger download
    const blob = new Blob([fullCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `valustock_sdk_ledger_${csvSymbol.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Futures data calculations
  const futuresOptions: Record<string, { size: number; price: number; margin: number; desc: string; unit: string }> = {
    GOLD: { size: 100, price: 2340.50, margin: 8500, desc: "สัญญาซื้อขายทองคำล่วงหน้า (COMEX Gold)", unit: "Troy Ounces" },
    OIL: { size: 1000, price: 82.50, margin: 6200, desc: "สัญญาน้ำมันดิบเบรนท์ล่วงหน้า (Brent Crude)", unit: "Barrels" },
    S50: { size: 200, price: 850.00, margin: 12000, desc: "SET50 Index Futures (TFEX Index)", unit: "Baht Multiplier" },
  };

  const selectedFutures = futuresOptions[futuresAsset];
  const positionValue = selectedFutures.price * selectedFutures.size;
  const rawProfit = (positionValue * (futuresPriceMove / 100));
  const leveragedProfit = rawProfit * (leverageFactor / 10); // Simulated leverage magnifier
  const leverageReturn = futuresPriceMove * leverageFactor;
  const isLiquidation = leverageReturn <= -100;

  // Thai Inbound tax and currency calculations
  const totalInvestedUsd = capitalGainsUsd;
  const thbInvested = totalInvestedUsd * buyRate;
  const thbRepatriatedGainsRaw = totalInvestedUsd * repatriationRate;
  // Calculate currency profit impact: (rate diff) * gains
  const fxProfitImpact = totalInvestedUsd * (repatriationRate - buyRate);
  const finalThaiRepatAmount = thbRepatriatedGainsRaw;

  // Tax progressive calculations
  const taxableAmount = finalThaiRepatAmount * (sameYearRepatPercent / 100);
  const getProgressiveTax = (income: number) => {
    // 100,000 THB standard allowance
    const taxable = Math.max(0, income - 100000);
    if (taxable <= 150000) return { tax: 0, bracket: "0% (ยกเว้นภาษี)" };
    if (taxable <= 300000) return { tax: (taxable - 150000) * 0.05, bracket: "5%" };
    if (taxable <= 500000) return { tax: 7500 + (taxable - 300000) * 0.10, bracket: "10%" };
    if (taxable <= 750000) return { tax: 27500 + (taxable - 500000) * 0.15, bracket: "15%" };
    if (taxable <= 1000000) return { tax: 65000 + (taxable - 750000) * 0.20, bracket: "20%" };
    return { tax: 115000 + (taxable - 1000000) * 0.25, bracket: "25%" };
  };

  const taxAnalysis = getProgressiveTax(taxableAmount);

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-up">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* A. HEADER WITH TABS CONTROLS */}
      <section className="overflow-hidden rounded-2xl border border-line bg-surface/55">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand">
              <Sparkles className="h-4 w-4" />
              {lang === "th" ? "ValuStock Insights" : "ValuStock Insights"}
            </div>
            <h1 className="mt-4 font-display text-3xl font-black leading-tight text-ink md:text-5xl">
              {lang === "th" ? "บทวิเคราะห์หุ้นและคู่มือลงทุน" : "Stock Insights & Investing Guides"}
            </h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-muted sm:text-base">
              {lang === "th" 
                ? "ศูนย์ความรู้สำหรับนักลงทุนไทย ครอบคลุมหุ้นไทย หุ้นสหรัฐ Value Investing, DCF, Intrinsic Value, Margin of Safety, กองทุนต่างประเทศ และภาษีลงทุน" 
                : "Research hub for Thai and US stocks, value investing, DCF, intrinsic value, margin of safety, offshore funds, and investor tax topics."}
            </p>

            {/* Dynamic 3 Segmented Tabs */}
            <div className="mt-6 flex w-fit max-w-full flex-wrap gap-1 rounded-xl border border-line/60 bg-elevate p-1 text-xs font-bold">
              <button
                onClick={() => setActiveSegment("articles")}
                className={`rounded-lg px-3 py-2 transition-all ${
                  activeSegment === "articles"
                    ? "bg-surface text-brand shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {lang === "th" ? "บทวิเคราะห์" : "Insights"}
              </button>
              <button
                onClick={() => setActiveSegment("dev_portal")}
                className={`rounded-lg px-3 py-2 transition-all ${
                  activeSegment === "dev_portal"
                    ? "bg-surface text-brand shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {lang === "th" ? "Sandbox" : "Developer Portal"}
              </button>
              <button
                onClick={() => setActiveSegment("futures_sandbox")}
                className={`rounded-lg px-3 py-2 transition-all ${
                  activeSegment === "futures_sandbox"
                    ? "bg-surface text-brand shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {lang === "th" ? "Futures & Tax" : "Derivative & Tax"}
              </button>
            </div>
          </div>

          <figure className="overflow-hidden rounded-2xl border border-line bg-bg shadow-soft">
            <img
              src={insightsHeroImage}
              alt={
                lang === "th"
                  ? "ภาพศูนย์บทวิเคราะห์หุ้น Value Investing DCF Intrinsic Value และ Margin of Safety"
                  : "ValuStock Insights visual for value investing DCF intrinsic value and margin of safety guides"
              }
              width={1200}
              height={630}
              loading="eager"
              decoding="async"
              className="aspect-[1200/630] w-full object-cover object-center"
            />
          </figure>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {seoPillars.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl border border-line bg-surface/35 p-4 transition hover:border-brand/45 hover:bg-brand/5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                {item.icon}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand" />
            </div>
            <h2 className="mt-3 font-display text-sm font-black text-ink group-hover:text-brand">
              {item.title}
            </h2>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">
              {item.desc}
            </p>
          </Link>
        ))}
      </section>

      {/* ==================== SEGMENT 1: ARTICLES & AI REPORT ==================== */}
      {activeSegment === "articles" && (
        <div className="space-y-8 animate-fade-in">
          {/* DYNAMIC AI GENERATOR */}
          <Card className="relative overflow-hidden border-brand/30 bg-brand/5 p-6 shadow-glow">
            <div className="aurora absolute inset-0 -z-10 opacity-30" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="chip border-brand/40 bg-brand/10 text-brand text-xs font-semibold uppercase">
                  {lang === "th" ? "สรุปตลาด" : "Market Brief"}
                </span>
                <h2 className="font-display text-lg font-bold text-ink">
                  {lang === "th" 
                    ? "ระบบวิเคราะห์ข้อมูลหุ้นไทย หุ้นสหรัฐฯ และกองทุนแบบอัตโนมัติ (AI Analyst)"
                    : "Automated Thai & US Equity Market Synthesizer (AI Analyst)"}
                </h2>
                <p className="text-xs text-muted max-w-2xl">
                  {lang === "th"
                    ? "ดึงข้อมูลแบบจำลองกระแสเงินสดคิดลด (DCF), ส่วนเผื่อความปลอดภัยสูงสุดวันนี้, อัตราแลกเปลี่ยน และ Master Fund กองทุนรวมมาสังเคราะห์เป็นบทวิเคราะห์ให้อ่านทันที"
                    : "Stream DCF modeling metrics, top safety margins, currency impacts, and mutual fund structures synthesized into a comprehensive analytical market overview."}
                </p>
              </div>
              <Button
                onClick={generateAIReport}
                disabled={generating}
                className="shrink-0 bg-brand hover:bg-brand/90 text-white flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {generating 
                  ? (lang === "th" ? "กำลังวิเคราะห์ตลาด..." : "Analyzing markets...") 
                  : (lang === "th" ? "สแกนและวิเคราะห์ตลาดตอนนี้" : "Scan & Analyze Markets Now")}
              </Button>
            </div>

            {generating && (
              <div className="mt-6 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-medium text-muted">
                  <span>{t("insights.generatingNews")}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-line rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {aiReport && (
              <div className="mt-6 border-t border-line/60 pt-6 animate-fade-in">
                <div className="prose prose-invert max-w-none text-sm text-ink leading-relaxed space-y-4 whitespace-pre-line bg-surface border border-line rounded-xl p-5 md:p-6">
                  {aiReport}
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted">
                  <Info className="h-3.5 w-3.5" />
                  <span>
                    {lang === "th" 
                      ? "* บทวิเคราะห์นี้สร้างขึ้นโดย AI อ้างอิงจากแบบจำลองทางการเงินภายในระบบ ไม่ใช่คำแนะนำการลงทุนอย่างเป็นทางการ"
                      : "* These insights are generated automatically based on system quant models for demo use and do not serve as certified advisory recommendations."}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* ARTICLES GRID & DETAIL VIEW */}
          {activeArticle ? (
            <Card className="p-6 md:p-8 space-y-6 border border-line">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveArticle(null)}
                  className="text-xs font-medium text-brand hover:underline flex items-center gap-1"
                >
                  {lang === "th" ? "← กลับไปรายการบทความทั้งหมด" : "← Back to all editorials"}
                </button>
                <span className={`chip border px-2.5 py-0.5 rounded-full text-xs font-medium ${activeArticle.gradient}`}>
                  {activeArticle.category}
                </span>
              </div>

              <div className="space-y-3">
                <h2 className="font-display text-2xl font-bold md:text-3xl leading-tight text-ink">
                  {activeArticle.title}
                </h2>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span>{lang === "th" ? "ผู้เขียน: ระบบ AI อัตโนมัติ" : "Author: ValuStock AI Robot"}</span>
                  <span>•</span>
                  <span>{lang === "th" ? `เผยแพร่: ${activeArticle.date}` : `Published: ${activeArticle.date}`}</span>
                  <span>•</span>
                  <span>{lang === "th" ? `เวลาอ่านประมาณ: ${activeArticle.readTime}` : `Read time: ${activeArticle.readTime}`}</span>
                </div>
              </div>

              <div className="h-px bg-line" />

              <div className="prose prose-invert max-w-none text-ink text-sm md:text-base leading-relaxed space-y-6 whitespace-pre-line">
                {activeArticle.content}
              </div>

              {/* 📚 Topic Cluster Navigator for Deep Internal Link Equity */}
              <TopicClusterNavigator currentSlug={activeArticle.id} setActiveArticle={setActiveArticle} articles={ARTICLES} />

              <div className="pt-6 border-t border-line flex justify-end">
                <Button variant="outline" onClick={() => setActiveArticle(null)}>
                  {lang === "th" ? "ปิดบทความนี้" : "Close Article"}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* 📚 Topic Cluster Pillar Hub for Main Topic: Stock Valuation */}
              <TopicClusterPillarHub setActiveArticle={setActiveArticle} articles={ARTICLES} />

              <h3 className="font-display text-lg font-bold flex items-center gap-2 text-ink">
                <Target className="h-4.5 w-4.5 text-brand" /> {t("insights.knowledgeHub")}
              </h3>

              <div className="grid gap-6 sm:grid-cols-2">
                {ARTICLES.map((art) => (
                  <Card
                    key={art.id}
                    className="group flex flex-col justify-between p-5 border border-line hover:border-brand/40 hover:shadow-card cursor-pointer"
                    onClick={() => setActiveArticle(art)}
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                          {art.category}
                        </span>
                        <span className={`chip border text-xs px-2 py-0.5 rounded-full font-medium ${art.gradient}`}>
                          {art.tag}
                        </span>
                      </div>
                      <h4 className="font-display font-bold group-hover:text-brand transition text-base md:text-lg leading-snug text-ink">
                        {art.title}
                      </h4>
                      <p className="text-xs text-muted leading-relaxed line-clamp-3">
                        {art.summary}
                      </p>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-line/60 flex items-center justify-between text-xs">
                      <span className="text-muted flex items-center gap-1">
                        {art.date} · {lang === "th" ? `อ่าน ${art.readTime}` : `${art.readTime} read`}
                      </span>
                      <span className="text-brand font-medium group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                        {lang === "th" ? "อ่านต่อ" : "Read more"} <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* FOOTER ADVICE FOR THAI INVESTORS */}
          <Card className="p-5 border border-line bg-surface/50">
            <h4 className="font-display text-sm font-bold text-ink flex items-center gap-1.5 mb-2">
              <Info className="h-4 w-4 text-gold" /> {lang === "th" ? "คู่มือภาษีและแนวทางการบริหารพอร์ตสินทรัพย์ทั่วโลก" : "Global Asset Taxation & Portfolio Guide"}
            </h4>
            <ul className="text-xs text-muted space-y-2 list-disc pl-4 leading-relaxed">
              <li>
                <strong>{lang === "th" ? "ภาษีเงินได้ต่างประเทศ:" : "Foreign Inbound Income Tax:"}</strong> {lang === "th"
                  ? "ตั้งแต่ปีภาษี 2024 เป็นต้นไป หากโอนเงินกำไรที่ได้จากหุ้นหรือสินทรัพย์ต่างประเทศกลับเข้าไทย จะถูกนำไปคิดภาษีเงินได้บุคคลธรรมดาในปีภาษีนั้นๆ แนะนำวางแผนตารางนำเงินกลับให้สัมพันธ์กับระดับภาษีขั้นบันไดของคุณ"
                  : t("insights.taxAlertDesc")}
              </li>
              <li>
                <strong>{lang === "th" ? "การยื่นแบบ W-8BEN:" : "Filing W-8BEN Form:"}</strong> {lang === "th"
                  ? "การยื่นเอกสารกับโบรกเกอร์จะช่วยลดหย่อนภาษีเงินปันผลหัก ณ ที่จ่ายในฝั่งสหรัฐฯ จาก 30% เหลือ 15% โดยอัตโนมัติ ซึ่งมีอายุ 3 ปี"
                  : "Filing W-8BEN certificates lowers US dividend withholding taxes from 30% to 15% automatically. Good for 3 calendar years."}
              </li>
              <li>
                <strong>{lang === "th" ? "ค่าธรรมเนียมกองทุน (Feeder Fund vs Master Fund):" : "Mutual Fund Fees (Feeder vs Master):"}</strong> {lang === "th"
                  ? "ตรวจสอบสัดส่วนกองทุนรวมต่างประเทศให้ชัดเจนเสมอ โดยค่าธรรมเนียมรวมเฉลี่ยไม่ควรเกิน 1.5% - 2.0% ต่อปี เพื่อผลตอบแทนสุทธิระยะยาวที่ดีที่สุด"
                  : "Combined Feeder and Master fees should ideally not exceed 1.5% - 2.0% annually to preserve compounding long-term returns."}
              </li>
            </ul>
          </Card>

          <Card className="p-5 border border-line bg-surface/35">
            <div className="mb-4">
              <h3 className="font-display text-lg font-black text-ink">
                {lang === "th" ? "คำถามที่พบบ่อยเกี่ยวกับ ValuStock Insights" : "ValuStock Insights FAQ"}
              </h3>
              <p className="mt-1 text-xs font-semibold text-muted">
                {lang === "th"
                  ? "คำตอบสั้น ๆ สำหรับผู้อ่านที่เริ่มศึกษาการประเมินมูลค่าหุ้นและการลงทุนต่างประเทศ"
                  : "Quick answers for readers learning stock valuation and international investing."}
              </p>
            </div>
            <div className="space-y-3">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={item.q} className="rounded-xl border border-line bg-bg/35">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left"
                    >
                      <span className="font-display text-sm font-black text-ink">{item.q}</span>
                      <span className="text-brand">{isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</span>
                    </button>
                    {isOpen ? (
                      <div className="px-4 pb-4 text-xs font-semibold leading-relaxed text-muted">
                        {item.a}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ==================== SEGMENT 2: API DEVELOPER PORTAL & SANDBOX ==================== */}
      {activeSegment === "dev_portal" && (
        <div className="grid gap-6 lg:grid-cols-12 animate-fade-in">
          {/* LEFT COLUMN: INTERACTIVE DEV TOOLS & GUIDES */}
          <div className="lg:col-span-7 space-y-6">
            {/* TOOL 1: INTERACTIVE REST EXPLORER */}
            <Card className="border border-line bg-surface/30 p-5 rounded-2xl space-y-4">
              <div>
                <h3 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5 uppercase tracking-wider">
                  <Zap className="h-4.5 w-4.5 text-brand" />
                  {lang === "th" ? "1. เครื่องทดสอบการดึงข้อมูลจำลอง" : "1. Interactive Mock Data Explorer"}
                </h3>
                <p className="text-[10px] text-muted mt-0.5">
                  {lang === "th" 
                    ? "จำลองการขอข้อมูลประวัติหุ้น ยอดรายได้ และงบกองทุนสากลจาก Valustock Dev Engine" 
                    : "Simulate calling native data services from the ValuStock proprietary quantitative core."}
                </p>
              </div>

              {/* Endpoint selection row */}
              <div className="flex gap-2">
                <select
                  value={restEndpoint}
                  onChange={(e) => setRestEndpoint(e.target.value)}
                  className="flex-1 bg-elevate text-ink border border-line rounded-xl px-3 py-2 text-xs font-mono font-bold appearance-none cursor-pointer focus:border-brand outline-none"
                >
                  <option value="/v3/reference/tickers/VTSAX">GET /v3/reference/tickers/VTSAX (US Mutual Fund)</option>
                  <option value="/v2/aggs/ticker/AAPL/range/1/day">GET /v2/aggs/ticker/AAPL/range/1/day (Stock Aggregates)</option>
                  <option value="/v2/reference/news?limit=5">GET /v2/reference/news?limit=5 (AI Translated News)</option>
                  <option value="/v1/derivatives/contracts/GOLD">GET /v1/derivatives/contracts/GOLD (Futures Specs)</option>
                </select>
                <Button
                  onClick={handleRestSend}
                  disabled={restLoading}
                  className="bg-brand text-white px-4 text-xs shrink-0 font-bold"
                >
                  {restLoading ? (lang === "th" ? "กำลังส่ง..." : "Sending...") : (lang === "th" ? "ส่งคำขอ" : "Send Request")}
                </Button>
              </div>

              {/* JSON code response viewer */}
              <div className="relative rounded-xl overflow-hidden bg-[#0A0D14] border border-line p-4 min-h-[160px] max-h-[280px] overflow-y-auto scrollbar-none">
                <span className="absolute top-2.5 right-3 text-[8px] font-mono text-muted uppercase tracking-wider select-none">
                  Response Payload (JSON)
                </span>
                {restLoading ? (
                  <div className="h-32 flex items-center justify-center text-xs text-muted font-mono animate-pulse">
                    🚀 Fetching dynamic endpoint data...
                  </div>
                ) : restResponse ? (
                  <pre className="text-[10px] font-mono text-[#4ADE80] whitespace-pre-wrap leading-normal">
                    {restResponse}
                  </pre>
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center text-xs text-muted font-mono text-center">
                    <span>📡 Waiting for trigger...</span>
                    <span className="text-[9px] mt-1 text-muted/60">Select an endpoint above and click "Send Request" to request mock data</span>
                  </div>
                )}
              </div>
            </Card>

            {/* TOOL 2: FLAT-FILES CSV LEDGER GENERATOR */}
            <Card className="border border-line bg-surface/30 p-5 rounded-2xl space-y-4">
              <div>
                <h3 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5 uppercase tracking-wider">
                  <Wallet className="h-4.5 w-4.5 text-brand" />
                  {lang === "th" ? "2. เครื่องจำลองออกรายงานประวัติพอร์ต (Flat-Files CSV SDK)" : "2. Portfolio CSV Exporter (Flat-Files SDK)"}
                </h3>
                <p className="text-[10px] text-muted mt-0.5">
                  {lang === "th" 
                    ? "ออกแบบงบส่งออกประวัติการทำรายการ (Ledger) ในพอร์ตสากลออกเป็นรูปแบบไฟล์แบน (.csv) มาตรฐาน" 
                    : "Generate and export mock flat-files containing your global transaction ledger locally as CSV."}
                </p>
              </div>

              {/* CSV input controls */}
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">Ticker</label>
                  <input
                    type="text"
                    value={csvSymbol}
                    onChange={(e) => setCsvSymbol(e.target.value.toUpperCase())}
                    className="w-full bg-elevate text-ink border border-line rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">Shares</label>
                  <input
                    type="number"
                    value={csvShares}
                    onChange={(e) => setCsvShares(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-elevate text-ink border border-line rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">Price (USD)</label>
                  <input
                    type="number"
                    value={csvPrice}
                    onChange={(e) => setCsvPrice(Math.max(0.1, parseFloat(e.target.value) || 0))}
                    className="w-full bg-elevate text-ink border border-line rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">Action</label>
                  <select
                    value={csvAction}
                    onChange={(e) => setCsvAction(e.target.value)}
                    className="w-full bg-elevate text-ink border border-line rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateCsv}
                  className="bg-brand text-white px-4 text-xs font-bold w-full flex items-center justify-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  {lang === "th" ? "สร้างและดาวน์โหลดไฟล์ CSV Ledger" : "Export & Download CSV Ledger"}
                </Button>
              </div>

              {csvLogs && (
                <div className="rounded-xl overflow-hidden bg-[#0A0D14] border border-line p-3">
                  <span className="text-[8px] font-mono text-muted uppercase tracking-wider block mb-1 select-none">Generated CSV Content Preview:</span>
                  <pre className="text-[10px] font-mono text-cyan-400 whitespace-pre">{csvLogs}</pre>
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT COLUMN: LIVE WEBSOCKET TERMINAL & SPEED DIAGNOSTICS */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border border-line bg-surface/30 p-5 rounded-2xl flex flex-col justify-between min-h-[440px] relative overflow-hidden">
              <div className="space-y-4">
                {/* Header info */}
                <div className="border-b border-line pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5 uppercase tracking-wider">
                      <BarChart3 className="h-4.5 w-4.5 text-brand" />
                      {lang === "th" ? "3. แผงคุมสัญญาณ WebSocket" : "3. Live WebSocket Terminal"}
                    </h3>
                    <Badge tone={wsActive ? "up" : "muted"} className="animate-pulse">
                      {wsActive ? "LIVE" : "STANDBY"}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted mt-0.5">
                    {lang === "th" 
                      ? "ทดสอบความหน่วง (Latency) และ Jitter ของสตรีมข้อมูลราคาสากลเวลาจริงแบบ 1:1" 
                      : "Stream real-time price updates dynamically and measure local Ping connection health."}
                  </p>
                </div>

                {/* Status indicator meters */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-elevate border border-line/60 rounded-xl">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted block mb-0.5">Connection Jitter</span>
                    <span className="text-xs font-mono font-extrabold text-ink flex items-center gap-1">
                      ⚡ {wsActive ? `${jitterTime} ms` : "—"}
                      {wsActive && (
                        <span className="text-[8px] bg-up-soft text-up px-1.5 py-0.5 rounded-full font-bold">
                          Excellent
                        </span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted block mb-0.5">Stream Quality</span>
                    <span className="text-xs font-mono font-extrabold text-ink">
                      📶 {wsActive ? "100% Stable" : "Disconnected"}
                    </span>
                  </div>
                </div>

                {/* Live stream terminal output screen */}
                <div className="rounded-xl bg-black border border-line/80 p-3 h-64 overflow-y-auto font-mono text-[9px] leading-relaxed text-[#00FF00] space-y-1 scrollbar-none flex flex-col-reverse">
                  {wsMessages.length > 0 ? (
                    wsMessages.map((msg, idx) => (
                      <div key={idx} className="hover:bg-white/5 px-1 py-0.5 rounded">
                        {msg}
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted font-mono text-[10px] text-center p-4">
                      <span>🖥️ TERMINAL OFFLINE</span>
                      <span className="text-[8px] text-muted/60 mt-1 select-none">Click "Start Live Feed Stream" below to initialize connection and stream prices</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Start/Stop WS control */}
              <div className="mt-4 pt-3 border-t border-line/45 flex gap-2">
                <Button
                  onClick={() => setWsActive(!wsActive)}
                  className={`w-full text-xs font-bold py-2 ${
                    wsActive 
                      ? "bg-down hover:bg-down/90 text-white" 
                      : "bg-brand hover:bg-brand/90 text-white"
                  }`}
                >
                  {wsActive ? (lang === "th" ? "🔴 ปิดสตรีมราคาสด" : "🛑 Disconnect Stream") : (lang === "th" ? "🟢 เปิดสตรีมราคาสด" : "⚡ Start Live Feed Stream")}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ==================== SEGMENT 3: FUTURES & TAX PORTAL (THAI SPECIAL) ==================== */}
      {activeSegment === "futures_sandbox" && (
        <div className="grid gap-6 lg:grid-cols-12 animate-fade-in">
          {/* LEFT SIDE: DERIVATIVE LEVERAGE SIMULATOR */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-line bg-surface/30 p-5 rounded-2xl space-y-4">
              <div>
                <h3 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5 uppercase tracking-wider">
                  <Gauge className="h-4.5 w-4.5 text-brand" strokeWidth={2.5} />
                  {lang === "th" ? "1. เครื่องวิเคราะห์อัตราทดฟิวเจอร์สสากล" : "1. Global Futures Leverage Simulator"}
                </h3>
                <p className="text-[10px] text-muted mt-0.5">
                  {lang === "th" 
                    ? "จำลองผลตอบแทนและจุดโดนบังคับขาย (Liquidation) ของทองคำ พลังงาน และ SET50 ฟิวเจอร์ส" 
                    : "Simulate leverage multiplication and liquidation levels for high-density contracts."}
                </p>
              </div>

              {/* Select contracts specification */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">
                    {lang === "th" ? "เลือกประเภทตราสาร" : "Futures Contract"}
                  </label>
                  <select
                    value={futuresAsset}
                    onChange={(e) => setFuturesAsset(e.target.value)}
                    className="w-full bg-elevate text-ink border border-line rounded-xl px-3 py-2 text-xs font-bold cursor-pointer outline-none"
                  >
                    <option value="GOLD">🥇 ทองคำสัญญาล่วงหน้า (GOLD)</option>
                    <option value="OIL">🛢️ น้ำมันดิบเบรนท์ล่วงหน้า (OIL)</option>
                    <option value="S50">🇹🇭 SET50 TFEX Index Futures (S50)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">
                    {lang === "th" ? "มูลค่ารวมต่อ 1 สัญญา" : "Total Contract Notional Value"}
                  </label>
                  <div className="bg-elevate text-ink border border-line rounded-xl px-3 py-2 text-xs font-mono font-bold">
                    {futuresAsset === "S50" ? `${num(positionValue, 0)} THB` : `$${num(positionValue, 2)}`}
                  </div>
                </div>
              </div>

              {/* Sliders for Price Movement and Leverage */}
              <div className="space-y-4 pt-2 border-t border-line/45">
                {/* Price Movement Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-muted">
                    <span>{lang === "th" ? "การเคลื่อนไหวของราคาที่คาดการณ์ (%)" : "Underlying Asset Price Move (%)"}</span>
                    <span className={`font-mono font-extrabold ${futuresPriceMove >= 0 ? "text-up" : "text-down"}`}>
                      {futuresPriceMove >= 0 ? "+" : ""}
                      {futuresPriceMove}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-25"
                    max="25"
                    step="0.5"
                    value={futuresPriceMove}
                    onChange={(e) => setFuturesPriceMove(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>

                {/* Leverage Factor Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-muted">
                    <span>{lang === "th" ? "อัตราทด (Leverage Factor)" : "Simulated Leverage Multiplier"}</span>
                    <span className="text-brand font-mono font-extrabold">{leverageFactor}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={leverageFactor}
                    onChange={(e) => setLeverageFactor(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>
              </div>

              {/* Leveraged PnL output details */}
              <div className="p-4 bg-elevate border border-line/60 rounded-xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted font-bold">{lang === "th" ? "เงินค้ำประกันขั้นต้นขั้นต่ำ (Margin)" : "Initial Margin Required"}</span>
                  <span className="font-mono font-bold text-ink">
                    {futuresAsset === "S50" ? `${num(selectedFutures.margin, 0)} THB` : `$${num(selectedFutures.margin, 0)}`}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted font-bold">{lang === "th" ? "อัตราการขยายผลกำไร/ขาดทุน (Leveraged Return)" : "Hedged Leveraged PnL"}</span>
                  <span className={`font-mono font-extrabold ${leverageReturn >= 0 ? "text-up" : "text-down"}`}>
                    {leverageReturn >= 0 ? "+" : ""}
                    {leverageReturn.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs border-t border-line/50 pt-2 font-extrabold">
                  <span className="text-ink">{lang === "th" ? "ผลกำไร/ขาดทุนที่เป็นเงินสดรวม" : "Simulated Cash PnL"}</span>
                  <span className={`font-mono ${leveragedProfit >= 0 ? "text-up" : "text-down"}`}>
                    {leveragedProfit >= 0 ? "+" : ""}
                    {futuresAsset === "S50" ? `${num(leveragedProfit, 0)} THB` : `$${num(leveragedProfit, 2)}`}
                  </span>
                </div>
              </div>

              {/* Liquidation warning box */}
              {isLiquidation ? (
                <div className="p-3 bg-down/10 border border-down/30 rounded-xl text-center space-y-1 animate-pulse">
                  <span className="font-extrabold text-xs text-down block">
                    ⚠️ LIQUIDATION / MARGIN CALL RISK!
                  </span>
                  <span className="text-[9px] text-muted leading-tight block">
                    {lang === "th" 
                      ? "การขาดทุนเกินกว่า 100% ของเงินค้ำประกันเริ่มต้น คุณอาจโดนปิดฐานะสัญญาอัตโนมัติทันที!" 
                      : "Simulated losses exceed 100% of your initial margin capital. Position will trigger margin call."}
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-up/10 border border-up/30 rounded-xl text-center">
                  <span className="font-extrabold text-[10px] text-up flex items-center justify-center gap-1.5 leading-none">
                    🛡️ Position Secure (Margin buffer holds above threshold)
                  </span>
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT SIDE: THAI PERSONAL INCOME TAX & FX AUDITOR */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-line bg-surface/30 p-5 rounded-2xl space-y-4">
              <div>
                <h3 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5 uppercase tracking-wider">
                  <CircleDollarSign className="h-4.5 w-4.5 text-brand" />
                  {lang === "th" ? "2. เครื่องปรับดุลภาษีต่างประเทศ & FX (Thai Special)" : "2. Inbound Personal Tax & FX Hedging Auditor"}
                </h3>
                <p className="text-[10px] text-muted mt-0.5">
                  {lang === "th" 
                    ? "ประเมินผลกำไรสุทธิหลังหักภาษีเงินได้นำเข้าไทย และผลกระทบจากส่วนต่างของอัตราแลกเปลี่ยน" 
                    : "Calculate exchange rate impacts and personal progressive tax liabilities on global gains."}
                </p>
              </div>

              {/* Sliders for Capital Gains & FX rates */}
              <div className="space-y-3.5">
                {/* Capital Gains in USD */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-muted">
                    <span>{lang === "th" ? "กำไรสุทธิจากการลงทุนนอกสะสม (USD)" : "Invested Capital Gains Abroad (USD)"}</span>
                    <span className="text-brand font-mono font-extrabold">${capitalGainsUsd.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={capitalGainsUsd}
                    onChange={(e) => setCapitalGainsUsd(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>

                {/* FX Rates controls */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">
                      {lang === "th" ? "เรทตอนแลกเงินออก (USD/THB)" : "Initial FX Rate (Outbound)"}
                    </label>
                    <input
                      type="number"
                      value={buyRate}
                      onChange={(e) => setBuyRate(Math.max(28, parseFloat(e.target.value) || 0))}
                      className="w-full bg-elevate text-ink border border-line rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">
                      {lang === "th" ? "เรทตอนดึงเงินเข้าไทย (USD/THB)" : "Repatriation FX Rate (Inbound)"}
                    </label>
                    <input
                      type="number"
                      value={repatriationRate}
                      onChange={(e) => setRepatriationRate(Math.max(28, parseFloat(e.target.value) || 0))}
                      className="w-full bg-elevate text-ink border border-line rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Repatriation slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-muted">
                    <span>{lang === "th" ? "สัดส่วนการโอนเงินกลับในปีภาษีเดียวกัน" : "Repatriation Share in the Same Fiscal Year"}</span>
                    <span className="text-brand font-mono font-extrabold">{sameYearRepatPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={sameYearRepatPercent}
                    onChange={(e) => setSameYearRepatPercent(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>
              </div>

              {/* Dynamic calculations output */}
              <div className="p-4 bg-elevate border border-line/60 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted font-bold">{lang === "th" ? "ผลกำไรสุทธิคิดเป็นเงินบาทไทย" : "Gains Equivalent in THB"}</span>
                  <span className="font-mono font-bold text-ink">{num(finalThaiRepatAmount, 0)} THB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted font-bold">{lang === "th" ? "ผลได้/เสียจากอัตราแลกเปลี่ยน (FX Impact)" : "Currency Exchange Swings Gain/Loss"}</span>
                  <span className={`font-mono font-bold ${fxProfitImpact >= 0 ? "text-up" : "text-down"}`}>
                    {fxProfitImpact >= 0 ? "+" : ""}
                    {num(fxProfitImpact, 0)} THB
                  </span>
                </div>
                <div className="flex justify-between border-t border-line/50 pt-2">
                  <span className="text-muted font-bold">{lang === "th" ? "ยอดเงินที่โอนนำเข้าไทย (ปีภาษีนี้)" : "Repatriated Amount Taxable (This Year)"}</span>
                  <span className="font-mono font-extrabold text-ink">{num(taxableAmount, 0)} THB</span>
                </div>
                <div className="flex justify-between font-extrabold">
                  <span className="text-down">{lang === "th" ? "ภาษีเงินได้บุคคลธรรมดาที่คาดว่าจะเก็บ" : "Est. Progressive Inbound Income Tax"}</span>
                  <span className="font-mono text-down">
                    {taxAnalysis.tax === 0 ? "0 THB (ยกเว้น)" : `${num(taxAnalysis.tax, 0)} THB (ฐาน ${taxAnalysis.bracket})`}
                  </span>
                </div>
              </div>

              {/* VIP Thai Tax optimization blueprint alert */}
              <div className="p-3 bg-gold/10 border border-gold/30 rounded-xl flex gap-2">
                <Shield className="h-4.5 w-4.5 text-gold shrink-0 mt-0.5" />
                <div className="text-[9px] text-muted leading-relaxed">
                  <strong>💡 ValuStock Legal Tax Optimization Strategy Blueprint:</strong>
                  {lang === "th" ? (
                    <span className="block mt-0.5">
                      1. **พักเงินสากล:** หลีกเลี่ยงภาษีนำเข้าด้วยการพักเงินส่วนต่างกำไรไว้ในบัญชีโบรกเกอร์ต่างประเทศ (เช่น Interactive Brokers) ข้ามปีปฏิทินภาษี ก่อนที่จะโอนกลับเข้าไทยในปีถัดไปเพื่อปรับดุลฐานภาษีให้ประหยัดสูงสุด<br />
                      2. **ลดปันผล:** ยื่นฟอร์ม W-8BEN ทันทีเพื่อขอลดหย่อนภาษีเงินปันผลหัก ณ ที่จ่ายจากอัตราเริ่มต้น 30% ให้เหลือ 15% ทันที ช่วยรักษาผลตอบแทนกองทุนอย่างดีเยี่ยม
                    </span>
                  ) : (
                    <span className="block mt-0.5">
                      1. **Cross-year Deferral:** Keep your capital gains within foreign brokerage custody and repatriate across fiscal calendar years to legally distribute and minimize progressive tax liabilities.<br />
                      2. **Treaty Relief:** Fill W-8BEN documents immediately to deduct US dividend withholding taxes from 30% to 15% directly under bilateral agreements.
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}


// ================== SEO TOPIC CLUSTER NAVIGATOR & PILLAR SYSTEM ==================

function TopicClusterPillarHub({
  setActiveArticle,
  articles = []
}: {
  setActiveArticle: (art: any) => void;
  articles?: any[];
}) {
  const { lang } = useTranslation();
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);

  // Nodes for radial mind map
  const nodes = [
    {
      label: "Intrinsic Value",
      slug: "what-is-intrinsic-value",
      icon: Target,
      title: lang === "th" ? "Intrinsic Value (มูลค่าที่แท้จริง)" : "Intrinsic Value Principles",
      desc: lang === "th"
        ? "ทฤษฎีประเมินมูลค่าหุ้นตามปัจจัยพื้นฐานที่แท้จริง โดยตัดอารมณ์ความผันผวนของตลาดออกไป เพื่อค้นหาจังหวะซื้อที่ได้เปรียบสูงเมื่อราคาตลาดต่ำกว่ามูลค่าประเมิน"
        : "Core Value Investing anchor. Determines the true fundamental worth of a business based on earnings power and assets, independent of market emotional noise.",
      eeatReason: lang === "th"
        ? "แกนหลักด้านการวิเคราะห์มูลค่าที่แท้จริง (Pillar Core E-E-A-T)"
        : "Google EEAT Core Pillar Anchor: Essential search authority verification for structural valuation metrics.",
      metrics: lang === "th" 
        ? ["ราคาตลาด vs ราคาเหมาะสม", "มูลค่าชำระบัญชี", "สินทรัพย์หมุนเวียนสุทธิ"]
        : ["Market Price vs. Fair Value", "Liquidation Asset Values", "Net Current Asset Value (NCAV)"],
      keywords: ["Intrinsic Value คืออะไร", "สูตรหามูลค่าที่แท้จริง", "ราคาเหมาะสมหุ้น"],
      score: "99.8%",
      color: "border-amber-500/30 text-amber-400 bg-amber-500/5 hover:border-amber-400",
      glowColor: "rgba(245, 158, 11, 0.4)",
      x: 405,
      y: 250,
      left: "81%",
      top: "50%"
    },
    {
      label: "DCF Model",
      slug: "what-is-dcf",
      icon: Calculator,
      title: lang === "th" ? "DCF Model (กระแสเงินสดคิดลด)" : "Discounted Cash Flow Model",
      desc: lang === "th"
        ? "แบบจำลองกระแสเงินสดคิดลด (Discounted Cash Flow) มาตรฐานสากล คาดการณ์กระแสเงินสดอิสระของบริษัทในอนาคต N ปี แล้วคิดลดกลับมาด้วยต้นทุนทางการเงินเฉลี่ย"
        : "The gold standard of quantitative finance. Projects future free cash flows and discounts them back to present value using a customized cost of capital (WACC).",
      eeatReason: lang === "th"
        ? "แสดงความเชี่ยวชาญทางการเงินระดับสถาบัน (Advanced Financial Modeling)"
        : "Demonstrates high topical authority in quantitative corporate finance and absolute pricing algorithms.",
      metrics: lang === "th"
        ? ["กระแสเงินสดอิสระ (FCF)", "อัตราคิดลด (WACC)", "มูลค่าสุดท้าย (Terminal Value)"]
        : ["Free Cash Flow to Firm (FCFF)", "Weighted Average Cost (WACC)", "Terminal Growth Rate (g)"],
      keywords: ["DCF คืออะไร", "สูตรคำนวณ DCF", "กระแสเงินสดคิดลด"],
      score: "99.6%",
      color: "border-blue-500/30 text-blue-400 bg-blue-500/5 hover:border-blue-400",
      glowColor: "rgba(59, 130, 246, 0.4)",
      x: 347,
      y: 371,
      left: "69.4%",
      top: "74.2%"
    },
    {
      label: "PE Ratio",
      slug: "what-pe-ratio-is-cheap",
      icon: CircleDollarSign,
      title: lang === "th" ? "P/E Ratio (ราคาต่อกำไรสุทธิ)" : "Price-to-Earnings Ratio",
      desc: lang === "th"
        ? "อัตราส่วนทางการเงินยอดนิยมสำหรับวัดความคุ้มค่าราคาหุ้นเทียบกับกำไรสุทธิ พร้อมวิธีวิเคราะห์ค่า PE รายกลุ่มอุตสาหกรรม และวิธีหลีกเลี่ยงกับดักหุ้น PE ต่ำ"
        : "Most widely used relative valuation multiple. Compares the stock price to its earnings per share, with strategic guidelines to sidestep dangerous low-PE value traps.",
      eeatReason: lang === "th"
        ? "ความเข้าใจเชิงสัมพัทธ์ในตัวคูณมูลค่าตลาด (Relative Multiples Authority)"
        : "Covers key comparative financial ratios to verify comprehensive understanding of market multiple valuations.",
      metrics: lang === "th"
        ? ["Trailing P/E vs. Forward P/E", "PEG Ratio ปรับตามการโต", "ดัชนีกับดักมูลค่า PE ต่ำ"]
        : ["Trailing vs. Forward P/E", "PEG Ratio (Growth Adjusted)", "Low PE Value Trap Flags"],
      keywords: ["PE Ratio เท่าไหร่ดี", "ค่า PE หุ้นคืออะไร", "หุ้นราคาถูกดูยังไง"],
      score: "99.2%",
      color: "border-purple-500/30 text-purple-400 bg-purple-500/5 hover:border-purple-400",
      glowColor: "rgba(168, 85, 247, 0.4)",
      x: 216,
      y: 401,
      left: "43.2%",
      top: "80.2%"
    },
    {
      label: "PBV Ratio",
      slug: "how-to-find-undervalued-stocks",
      icon: BarChart3,
      title: lang === "th" ? "P/BV Ratio (ราคาต่อสินทรัพย์สุทธิ)" : "Price-to-Book Value Ratio",
      desc: lang === "th"
        ? "การประเมินมูลค่าหุ้นโดยเปรียบเทียบกับส่วนของผู้ถือหุ้นทางบัญชี เหมาะสำหรับคัดสรรหุ้นก้นบุหรี่ที่มีมูลค่าสินทรัพย์แข็งแกร่งคอยหนุนหลัง เช่น กลุ่มธนาคาร"
        : "Compares current stock price to net asset book value per share. Essential tool for screening asset-heavy stocks and protective net-net cash bargains.",
      eeatReason: lang === "th"
        ? "การวิเคราะห์โครงสร้างความปลอดภัยของสินทรัพย์ (Balance Sheet Integrity)"
        : "Validates deep comprehension of balance sheet security, book reserves, and structural margins.",
      metrics: lang === "th"
        ? ["มูลค่าทางบัญชีต่อหุ้น (BVPS)", "สินทรัพย์สุทธิที่จับต้องได้", "ตัวคูณ PBV ย้อนหลัง"]
        : ["Book Value Per Share (BVPS)", "Net Tangible Assets", "Historical PBV Bands"],
      keywords: ["PBV คืออะไร", "หุ้นปันผลดีราคาถูก", "วิธีการสแกนหาหุ้น VI"],
      score: "98.9%",
      color: "border-teal-500/30 text-teal-400 bg-teal-500/5 hover:border-teal-400",
      glowColor: "rgba(20, 184, 166, 0.4)",
      x: 22,
      y: 317,
      left: "22%",
      top: "63.4%"
    },
    {
      label: "ROE Metrics",
      slug: "how-to-find-undervalued-stocks",
      icon: TrendingUp,
      title: lang === "th" ? "ROE (ผลตอบแทนต่อส่วนของเจ้าของ)" : "Return on Equity Metrics",
      desc: lang === "th"
        ? "อัตราผลตอบแทนต่อส่วนของผู้ถือหุ้น ตัวชี้วัดประสิทธิภาพของคณะผู้บริหารในการหมุนเงินทุนเพื่อสร้างกำไร หุ้นปันผลแกร่งควรมี ROE > 12-15% อย่างยั่งยืน"
        : "Key efficiency multiple. Tracks how effectively corporate management reinvests retained earnings. Authoritative compounding indicator for business moats.",
      eeatReason: lang === "th"
        ? "การวิเคราะห์ประสิทธิภาพการบริหารทุนหมุนเวียน (Capital Allocation Authority)"
        : "Demonstrates sophisticated competency in structural returns and management capital stewardship.",
      metrics: lang === "th"
        ? ["สมการย่อย DuPont 3 ขั้น", "อัตราหมุนเวียนทรัพย์สิน", "ความคุ้มค่ากำไรสุทธิ"]
        : ["DuPont Analysis (3-Step)", "Asset Turnover Ratio", "Financial Leverage Impact"],
      keywords: ["ROE คืออะไร", "วิธีคำนวณ ROE", "หุ้นเติบโตคูเมืองกว้าง"],
      score: "99.4%",
      color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/5 hover:border-cyan-400",
      glowColor: "rgba(6, 182, 212, 0.4)",
      x: 22,
      y: 183,
      left: "22%",
      top: "36.6%"
    },
    {
      label: "Dividend Yield",
      slug: "tech-vs-dividend",
      icon: Wallet,
      title: lang === "th" ? "Dividend Yield (อัตราปันผลตอบแทน)" : "Dividend Yield Safety",
      desc: lang === "th"
        ? "อัตราผลตอบแทนปันผลในรูปเปอร์เซ็นต์ ตัวชี้วัดหลักสำหรับพอร์ตเกษียณสำราญ คัดเลือกเฉพาะหุ้นปันผลปลอดภัยที่มีกระแสเงินสด FCF แกร่งและหนี้ต่ำ"
        : "Measures annual dividend cash distribution relative to the share price. Focuses on safe, defensive cash yield compounding while dodging yield traps.",
      eeatReason: lang === "th"
        ? "ความเชี่ยวชาญด้านพอร์ตสร้างกระแสเงินสดเชิงรับ (Yield & Portfolio Stewardship)"
        : "Directly matches high-intent investor search traffic looking for retirement cash flow and safety buffers.",
      metrics: lang === "th"
        ? ["สัดส่วนจ่ายเงินปันผลต่อกำไร", "อัตราเติบโตปันผลสม่ำเสมอ", "การสกัดกั้นกับดักปันผลลวง"]
        : ["Dividend Payout Ratio", "Dividend Aristocrats Growth", "Yield Trap Mitigation"],
      keywords: ["หุ้นปันผลสูง", "Dividend Yield คืออะไร", "พอร์ตปันผลปลอดภัย"],
      score: "99.5%",
      color: "border-rose-500/30 text-rose-400 bg-rose-500/5 hover:border-rose-400",
      glowColor: "rgba(244, 63, 94, 0.4)",
      x: 216,
      y: 99,
      left: "43.2%",
      top: "19.8%"
    },
    {
      label: "Margin of Safety",
      slug: "what-is-margin-of-safety",
      icon: Shield,
      title: lang === "th" ? "Margin of Safety (ส่วนเผื่อความปลอดภัย)" : "Margin of Safety (MOS)",
      desc: lang === "th"
        ? "กฎเหล็กประวัติศาสตร์ของบิดา VI Benjamin Graham ที่สอนให้ซื้อสินทรัพย์เฉพาะเมื่อราคาตลาดมีส่วนลดหักออก 15-30% จากมูลค่า Intrinsic Value เพื่อลดความเสี่ยง"
        : "Benjamin Graham’s cornerstone risk management rule. Mandates investing only when prices offer a 15-30% discount under intrinsic worth to buffer forecasting errors.",
      eeatReason: lang === "th"
        ? "การรักษาเสถียรภาพและบริหารความเสี่ยงระดับสูง (Professional Risk Management)"
        : "Demonstrates structural authority in proactive wealth protection and systemic risk containment.",
      metrics: lang === "th"
        ? ["อัตราส่วนลดเปอร์เซ็นต์ MOS", "ส่วนเผื่อความคลาดเคลื่อนประมาณการ", "เกราะป้องกันเงินต้น"]
        : ["MOS Discount Percentages", "Estimates Error Buffer Range", "Principal Protection Shields"],
      keywords: ["Margin of Safety คืออะไร", "Benjamin Graham กฎเหล็ก", "ส่วนต่างราคาที่ปลอดภัย"],
      score: "99.7%",
      color: "border-amber-500/30 text-amber-400 bg-amber-500/5 hover:border-amber-400",
      glowColor: "rgba(245, 158, 11, 0.4)",
      x: 347,
      y: 129,
      left: "69.4%",
      top: "25.8%"
    }
  ];

  const activeNode = nodes[activeNodeIndex];

  return (
    <Card className="p-6 md:p-8 border border-line bg-surface/30 backdrop-blur-md relative overflow-hidden rounded-3xl">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-gold {
          0% { transform: translate(-50%, -50%) scale(0.96); opacity: 0.95; box-shadow: 0 0 15px rgba(217, 119, 6, 0.4); }
          50% { transform: translate(-50%, -50%) scale(1.04); opacity: 1; box-shadow: 0 0 35px rgba(217, 119, 6, 0.8); }
          100% { transform: translate(-50%, -50%) scale(0.96); opacity: 0.95; box-shadow: 0 0 15px rgba(217, 119, 6, 0.4); }
        }
        @keyframes orbit-flow {
          to { stroke-dashoffset: -20; }
        }
        .animate-center-pulse {
          animation: pulse-gold 3s ease-in-out infinite;
        }
        .animate-orbit-flow-line {
          stroke-dasharray: 6, 6;
          animation: orbit-flow 3s linear infinite;
        }
      `}} />
      <div className="aurora absolute inset-0 -z-10 opacity-30" />
      
      {/* Pillar Intro and E-E-A-T badges */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-line/45 pb-6 mb-6">
        <div>
          <span className="chip border-brand/30 bg-brand/10 text-brand text-xs font-bold mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full">
            <Sparkles className="h-3.5 w-3.5 text-brand" /> E-E-A-T AUTHORITATIVE TOPIC CLUSTER
          </span>
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-black text-ink leading-tight">
            {lang === "th" ? "Main Topic: แผนผังความเชี่ยวชาญการประเมินมูลค่าหุ้น" : "Main Topic: Stock Valuation Pillar & Cluster Hub"}
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-2 font-medium leading-relaxed max-w-3xl">
            {lang === "th"
              ? "โครงข่ายหัวข้อการเงินที่เชื่อมโยงถึงกันอย่างสมบูรณ์แบบตามเกณฑ์ Google Search Core Algorithm เพื่อแสดงความเชี่ยวชาญสูงสุดและสร้างความเข้าใจในการวิเคราะห์หุ้นของนักลงทุนระยะยาว"
              : "Google E-E-A-T compliant circular semantic node graph. Explores highly linked subtopic domains supporting absolute valuation and wealth protection structures."}
          </p>
        </div>
      </div>

      {/* Main Cluster Area */}
      <div className="grid gap-8 lg:grid-cols-12 items-center">
        
        {/* Left Side: SVG Radial Visual Mind Map */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-2 relative">
          
          <div className="relative w-full aspect-square max-w-[400px] sm:max-w-[420px] md:max-w-[450px] mx-auto overflow-visible rounded-full bg-surface/5 border border-line/20 backdrop-blur-sm p-4">
            
            {/* SVG Connecting Lines Graph */}
            <svg
              viewBox="0 0 500 500"
              className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-visible"
            >
              <defs>
                <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                </radialGradient>
                {nodes.map((node, i) => (
                  <linearGradient key={i} id={`gradient-${i}`} x1="50%" y1="50%" x2={node.x} y2={node.y} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#d97706" stopOpacity="0.75" />
                    <stop offset="100%" stopColor={node.glowColor.includes("59, 130") ? "#3b82f6" : node.glowColor.includes("168, 85") ? "#a855f7" : "#14b8a6"} stopOpacity="0.4" />
                  </linearGradient>
                ))}
              </defs>

              {/* Orbital circle paths guides */}
              <circle cx="250" cy="250" r="155" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" strokeDasharray="4, 4" />
              <circle cx="250" cy="250" r="215" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />

              {/* Connecting paths with flowing animation */}
              {nodes.map((node, i) => {
                const isActive = activeNodeIndex === i;
                return (
                  <g key={i}>
                    {/* Background line */}
                    <line
                      x1="250"
                      y1="250"
                      x2={node.x}
                      y2={node.y}
                      stroke={isActive ? `url(#gradient-${i})` : "rgba(255, 255, 255, 0.07)"}
                      strokeWidth={isActive ? "2.5" : "1"}
                      className="transition-all duration-300"
                    />
                    {/* Glowing flow dots line */}
                    {isActive && (
                      <line
                        x1="250"
                        y1="250"
                        x2={node.x}
                        y2={node.y}
                        stroke="#fbbf24"
                        strokeWidth="2.5"
                        className="animate-orbit-flow-line opacity-85"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* PULSING PILLAR CORE CENTER NODE */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center border-2 border-amber-500 bg-bg/95 text-center p-3 animate-center-pulse cursor-pointer select-none group"
              onClick={() => setActiveNodeIndex(0)}
            >
              <div className="absolute inset-0 rounded-full bg-amber-500/10 pointer-events-none group-hover:bg-amber-500/25 transition duration-300" />
              <Target className="h-5 w-5 text-amber-500 mb-1 group-hover:scale-110 transition duration-300" />
              <span className="text-[9px] text-amber-500 uppercase tracking-widest font-black leading-none">{lang === "th" ? "เสาหลักความรู้" : "Pillar Page"}</span>
              <span className="font-display text-[10px] sm:text-xs font-black text-ink block mt-1 leading-tight">{lang === "th" ? "การประเมิน มูลค่าหุ้น" : "Stock Valuation"}</span>
            </div>

            {/* 7 RADIAL SUBTOPICS ORBITAL NODES */}
            {nodes.map((node, i) => {
              const IconComponent = node.icon;
              const isActive = activeNodeIndex === i;
              return (
                <div
                  key={i}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                  style={{ left: node.left, top: node.top }}
                >
                  {/* Interactive Button */}
                  <button
                    onMouseEnter={() => setActiveNodeIndex(i)}
                    onClick={() => setActiveNodeIndex(i)}
                    className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center border transition-all duration-300 relative group shadow-lg ${
                      isActive
                        ? `${node.color.split(" ")[2]} ${node.color.split(" ")[1]} scale-110 shadow-xl ring-4 ring-brand/10`
                        : "border-line bg-bg/90 hover:bg-brand-soft/20 hover:border-brand/40 text-muted hover:text-brand"
                    }`}
                  >
                    <IconComponent className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${isActive ? "" : "group-hover:scale-110"} transition-all`} />
                    
                    {/* Ring highlight element */}
                    {isActive && (
                      <span className="absolute inset-0 rounded-full border-2 border-brand/50 scale-105 pointer-events-none animate-ping opacity-45" />
                    )}
                  </button>

                  {/* Legible text label floating below/above */}
                  <span
                    className={`text-[9px] sm:text-[10px] font-black mt-2 text-center whitespace-nowrap px-2 py-0.5 rounded-md border backdrop-blur-sm shadow-sm transition-all duration-200 pointer-events-none ${
                      isActive
                        ? "border-brand/35 text-ink bg-brand-soft/85 scale-105"
                        : "border-line/30 text-muted bg-bg/85 group-hover:text-ink"
                    }`}
                  >
                    {node.label}
                  </span>
                </div>
              );
            })}

          </div>
          
          <span className="text-[10px] text-muted/65 italic text-center mt-3 block">
            {lang === "th" ? "💡 วางเมาส์หรือแตะที่วงโคจรย่อยเพื่อวิเคราะห์เจาะลึก" : "💡 Hover or tap orbital nodes to inspect subtopic E-E-A-T credentials."}
          </span>
        </div>

        {/* Right Side: E-E-A-T Inspector Panel */}
        <div className="lg:col-span-6">
          <Card className="p-5 md:p-6 border border-line bg-bg/40 rounded-2xl relative overflow-hidden flex flex-col justify-between h-full min-h-[360px] shadow-inner">
            <div className="space-y-4">
              
              {/* Header info */}
              <div className="flex items-center justify-between border-b border-line/30 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg border ${activeNode.color.split(" ")[0]} ${activeNode.color.split(" ")[2]}`}>
                    <activeNode.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-brand font-bold uppercase tracking-wider block">{lang === "th" ? "การวิเคราะห์กลุ่มหัวข้อย่อย" : "SUBTOPIC METRIC NODE"}</span>
                    <h3 className="font-display text-sm sm:text-base font-black text-ink leading-none mt-0.5">
                      {activeNode.title}
                    </h3>
                  </div>
                </div>
                
                {/* Authority Match Rate */}
                <div className="text-right">
                  <span className="text-[9px] text-muted font-bold block">{lang === "th" ? "ความเชี่ยวชาญ E-E-A-T" : "Semantic Authority"}</span>
                  <span className="text-xs font-mono font-extrabold text-brand block mt-0.5">{activeNode.score} Match</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-ink leading-relaxed font-semibold">
                {activeNode.desc}
              </p>

              {/* Core metrics covered */}
              <div className="p-3.5 bg-surface/20 rounded-xl border border-line/35 space-y-2">
                <span className="text-[10px] text-muted block font-extrabold uppercase tracking-wide">
                  📈 {lang === "th" ? "ตัวแปรประเมินมูลค่าหลักในเครื่องมือ:" : "Underlying Valuation Metrics:"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeNode.metrics.map((m, idx) => (
                    <span key={idx} className="text-[9px] sm:text-[10px] font-bold text-ink px-2.5 py-1 bg-surface/50 border border-line/30 rounded-lg">
                      🔹 {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Target search queries / keywords */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted block font-extrabold uppercase tracking-wide">
                  🔍 {lang === "th" ? "คีย์เวิร์ดดึง Traffic (High Intent Keywords):" : "High Volume Target Keywords:"}
                </span>
                <div className="flex flex-wrap gap-1">
                  {activeNode.keywords.map((k, idx) => (
                    <span key={idx} className="text-[9px] font-mono text-muted bg-surface/10 px-2 py-0.5 rounded border border-line/10">
                      #{k}
                    </span>
                  ))}
                </div>
              </div>

              {/* E-E-A-T Authority Note */}
              <div className="text-[9px] text-muted leading-relaxed flex gap-1.5 items-start mt-2">
                <Info className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                <span>
                  <strong>Topical Authority Note:</strong> {activeNode.eeatReason}
                </span>
              </div>

            </div>

            {/* Read Article CTA Button */}
            <div className="pt-5 border-t border-line/45 mt-4 flex items-center justify-end">
              <Button
                onClick={() => {
                  const targetSlug = activeNode.slug;
                  // Look inside articles prop directly
                  const found = articles.find((a: any) => a.id === targetSlug) || {
                    id: targetSlug,
                    title: activeNode.title,
                    category: "Academy",
                    date: "Today",
                    readTime: "5 mins",
                    summary: activeNode.desc,
                    content: activeNode.desc,
                    gradient: "from-amber-600/20 to-red-600/20 text-amber-400 border-red-500/20",
                    tag: "SEO"
                  };
                  setActiveArticle(found);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full sm:w-auto font-bold text-xs bg-brand hover:bg-brand/90 text-bg border-none flex items-center justify-center gap-1.5 py-2 px-5 group shadow-lg shadow-brand/10 transition duration-300"
              >
                {lang === "th" ? "เปิดอ่านเจาะลึกทฤษฎีนี้" : "Read Authoritative Guide"} 
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

          </Card>
        </div>

      </div>
    </Card>
  );
}

function TopicClusterNavigator({
  currentSlug,
  setActiveArticle,
  articles = []
}: {
  currentSlug: string;
  setActiveArticle: (art: any) => void;
  articles?: any[];
}) {
  const { lang } = useTranslation();

  const clusterItems = [
    { label: "Intrinsic Value", slug: "what-is-intrinsic-value", desc: lang === "th" ? "ทฤษฎีมูลค่าที่แท้จริง" : "Intrinsic Value" },
    { label: "DCF Model", slug: "what-is-dcf", desc: lang === "th" ? "กระแสเงินสดคิดลด" : "DCF" },
    { label: "PE Ratio", slug: "what-pe-ratio-is-cheap", desc: lang === "th" ? "ราคาต่อกำไร PE" : "PE Ratio" },
    { label: "PBV Ratio", slug: "how-to-find-undervalued-stocks", desc: lang === "th" ? "ราคาต่อสมุดบัญชี PBV" : "PBV Ratio" },
    { label: "ROE", slug: "how-to-find-undervalued-stocks", desc: lang === "th" ? "ผลตอบแทนต่อทุน ROE" : "ROE Metrics" },
    { label: "Dividend Yield", slug: "tech-vs-dividend", desc: lang === "th" ? "ปันผลตอบแทน" : "Dividend Yield" },
    { label: "Margin of Safety", slug: "what-is-margin-of-safety", desc: lang === "th" ? "ส่วนเผื่อความปลอดภัย MOS" : "Margin of Safety" }
  ];

  return (
    <Card className="mt-8 p-5 border border-line bg-surface/20 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 border-b border-line/30 pb-3">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/15 text-brand">
          <FileText className="h-4 w-4" />
        </span>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-ink leading-none">
            {lang === "th" ? "📚 สารบัญเชื่อมโยงกลุ่มความรู้: การประเมินมูลค่าหุ้น (Stock Valuation)" : "📚 Stock Valuation Cluster Hub"}
          </h4>
          <span className="text-[10px] text-muted mt-1 block">
            {lang === "th" ? "เพิ่มความเชี่ยวชาญ ค้นหาคำตอบของแต่ละตัวแปรทางการเงินแบบเชื่อมโยง" : "Explore supporting valuation models to build a professional foundation."}
          </span>
        </div>
      </div>

      <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
        {/* Back to Pillar Hub */}
        <button
          onClick={() => {
            setActiveArticle(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="p-2.5 rounded-xl border border-dashed border-brand/50 bg-brand-soft/20 text-left hover:bg-brand/10 transition"
        >
          <span className="text-[9px] text-brand font-bold uppercase block">Pillar Page</span>
          <span className="text-xs font-black text-ink block mt-0.5 leading-none">🏠 {lang === "th" ? "กลับไปหน้าหลัก" : "Main Hub"}</span>
        </button>

        {clusterItems.map((item) => {
          const isActive = item.slug === currentSlug;
          return (
            <button
              key={item.label}
              disabled={isActive}
              onClick={() => {
                const found = articles.find((a: any) => a.id === item.slug) || {
                  id: item.slug,
                  title: item.desc,
                  category: "Academy",
                  date: "Today",
                  readTime: "5 mins",
                  summary: "",
                  content: "",
                  gradient: "from-amber-600/20 to-red-600/20 text-amber-400 border-red-500/20",
                  tag: "SEO"
                };
                setActiveArticle(found);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`p-2.5 rounded-xl text-left border transition ${
                isActive 
                  ? "border-brand/40 bg-brand/5 cursor-not-allowed opacity-80" 
                  : "border-line bg-bg/50 hover:bg-brand/5 hover:border-brand/35"
              }`}
            >
              <span className="text-[9px] text-muted font-bold block">{item.label}</span>
              <span className="text-xs font-black text-ink block mt-0.5 leading-none truncate">{item.desc}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

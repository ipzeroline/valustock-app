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
1. โบรกเกอร์ส่วนใหญ่ในไทย (เช่น InnovestX, Dime) และโบรกเกอร์นอก (เช่น Interactive Brokers) จะมีระบบกรอก W-8BEN อิเล็กทรอนิกส์ให้คุณทันทีก่อนเริ่มซื้อขายหุ้นต่างประเทศ
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
1. Digital brokerages (e.g., Dime, InnovestX) and international firms (e.g., Interactive Brokers) offer integrated electronic W-8BEN forms during account setup.
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

  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

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

  // Pre-select article from URL query param (e.g. ?article=tech-vs-dividend)
  useEffect(() => {
    if (typeof window !== "undefined" && ARTICLES.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get("article");
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
      {/* A. HEADER WITH TABS CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl flex items-center gap-2 text-ink">
            <Sparkles className="h-6 w-6 text-brand" /> {lang === "th" ? "ห้องข่าววิเคราะห์ & พอร์ทัลนักพัฒนา" : "ValuStock Intel & Developer Suite"}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {lang === "th" 
              ? "ศูนย์รวบรวมเครื่องมือวิเคราะห์ตลาดเชิงรุก ระบบแปลภาษา SEO และ API Sandbox สำหรับเทรดเดอร์สากล" 
              : "Advanced intelligence hub presenting AI report aggregates, interactive API explorers, and derivative simulators."}
          </p>
        </div>

        {/* Dynamic 3 Segmented Tabs */}
        <div className="flex bg-elevate p-1 rounded-xl gap-1 text-xs font-bold shrink-0 self-start md:self-auto border border-line/60">
          <button
            onClick={() => setActiveSegment("articles")}
            className={`px-3 py-2 rounded-lg transition-all ${
              activeSegment === "articles"
                ? "bg-surface text-brand shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            📰 {lang === "th" ? "บทวิเคราะห์ & AI" : "Insights & AI Report"}
          </button>
          <button
            onClick={() => setActiveSegment("dev_portal")}
            className={`px-3 py-2 rounded-lg transition-all ${
              activeSegment === "dev_portal"
                ? "bg-surface text-brand shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            ⚡ {lang === "th" ? "Dev API Sandbox" : "API Developer Portal"}
          </button>
          <button
            onClick={() => setActiveSegment("futures_sandbox")}
            className={`px-3 py-2 rounded-lg transition-all ${
              activeSegment === "futures_sandbox"
                ? "bg-surface text-brand shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            📈 {lang === "th" ? "Futures & Tax Simulator" : "Derivative & Tax Hub"}
          </button>
        </div>
      </div>

      {/* ==================== SEGMENT 1: ARTICLES & AI REPORT ==================== */}
      {activeSegment === "articles" && (
        <div className="space-y-8 animate-fade-in">
          {/* DYNAMIC AI GENERATOR */}
          <Card className="relative overflow-hidden border-brand/30 bg-brand/5 p-6 shadow-glow">
            <div className="aurora absolute inset-0 -z-10 opacity-30" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="chip border-brand/40 bg-brand/10 text-brand text-xs font-semibold uppercase">
                  {lang === "th" ? "ฟีเจอร์เด่น" : "Premium Feature"}
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

              <div className="pt-6 border-t border-line flex justify-end">
                <Button variant="outline" onClick={() => setActiveArticle(null)}>
                  {lang === "th" ? "ปิดบทความนี้" : "Close Article"}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
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
                  {lang === "th" ? "1. เครื่องทดสอบการเรียกใช้ REST API" : "1. Interactive REST API Explorer"}
                </h3>
                <p className="text-[10px] text-muted mt-0.5">
                  {lang === "th" 
                    ? "จำลองการขอข้อมูลประวัติหุ้น ยอดรายได้ และงบกองทุนสากลจาก Valustock Dev Engine" 
                    : "Simulate calling native REST API endpoints from the ValuStock proprietary quantitative core."}
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
                  {restLoading ? (lang === "th" ? "กำลังส่ง..." : "Sending...") : (lang === "th" ? "ส่งคำขอ" : "Send API")}
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
                    <span className="text-[9px] mt-1 text-muted/60">Select an endpoint above and click "Send API" to request mock data</span>
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

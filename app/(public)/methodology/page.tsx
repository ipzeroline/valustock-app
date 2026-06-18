"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/lib/translations";
import {
  Sparkles,
  Target,
  Shield,
  Info,
  Calculator,
  Layers,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BarChart3,
  FileText,
} from "@/lib/icons";

export default function MethodologyPage() {
  const { lang } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const methodCards = [
    {
      label: "DCF",
      title:
        lang === "th"
          ? "กระแสเงินสดคิดลด"
          : "Discounted Cash Flow",
      detail:
        lang === "th"
          ? "เหมาะกับธุรกิจที่คาดการณ์กระแสเงินสดได้ เช่น บริษัทกำไรสม่ำเสมอ มี FCF เป็นบวก และมีแผนเติบโตพอประเมินได้"
          : "Best for companies with predictable free cash flow, steady earnings, and a growth path that can be estimated with reasonable assumptions.",
    },
    {
      label: "Graham",
      title:
        lang === "th"
          ? "Graham Number"
          : "Graham Number",
      detail:
        lang === "th"
          ? "เหมาะกับหุ้นคุณค่าเชิงรับที่มีกำไรและสินทรัพย์รองรับ ใช้ EPS และ BVPS เพื่อตรวจว่าราคาหุ้นสูงเกินพื้นฐานหรือไม่"
          : "Useful for defensive value stocks with positive earnings and tangible book value, combining EPS and BVPS into a conservative ceiling price.",
    },
    {
      label: "MOS",
      title:
        lang === "th"
          ? "Margin of Safety"
          : "Margin of Safety",
      detail:
        lang === "th"
          ? "ใช้ลดความเสี่ยงจากสมมติฐานผิดพลาด โดยต้องการส่วนลดจากมูลค่าที่แท้จริงก่อนพิจารณาเข้าซื้อ"
          : "Adds a cushion against forecasting errors by requiring a discount to estimated intrinsic value before considering an entry.",
    },
  ];

  const processSteps = [
    {
      title: lang === "th" ? "รวบรวมข้อมูลพื้นฐาน" : "Collect financial inputs",
      body:
        lang === "th"
          ? "เริ่มจากรายได้ กำไรสุทธิ Free Cash Flow หนี้สิน เงินสด ส่วนของผู้ถือหุ้น EPS, BVPS, ROE และอัตราการเติบโตย้อนหลัง"
          : "Start with revenue, net income, free cash flow, debt, cash, equity, EPS, BVPS, ROE, and historical growth.",
    },
    {
      title: lang === "th" ? "ปรับสมมติฐานให้อนุรักษ์นิยม" : "Normalize assumptions",
      body:
        lang === "th"
          ? "ลดผลกระทบของตัวเลขปีพิเศษ ตรวจ cyclicality และหลีกเลี่ยงการใช้ growth สูงเกินจริงกับธุรกิจที่ยังพิสูจน์กระแสเงินสดไม่ได้"
          : "Reduce one-off effects, account for cyclicality, and avoid aggressive growth assumptions for businesses without proven cash generation.",
    },
    {
      title: lang === "th" ? "ถ่วงน้ำหนักหลายสูตร" : "Blend valuation models",
      body:
        lang === "th"
          ? "ใช้ DCF เพื่อดูมูลค่าจากกระแสเงินสด และใช้ Graham Number หรืออัตราส่วนพื้นฐานเป็นตัวตรวจความสมเหตุสมผล"
          : "Use DCF for cash-flow value, then cross-check with Graham Number and core fundamentals.",
    },
    {
      title: lang === "th" ? "อ่านผลพร้อมความเสี่ยง" : "Read value with risk context",
      body:
        lang === "th"
          ? "ราคาถูกกว่ามูลค่าไม่ได้แปลว่าควรซื้อทันที ต้องดูคุณภาพธุรกิจ หนี้ สภาพคล่อง ข่าวสำคัญ และ Margin of Safety ประกอบ"
          : "A discount to fair value is not an automatic buy signal; quality, debt, liquidity, news, and margin of safety still matter.",
    },
  ];

  const faqItems = [
    {
      q: lang === "th" ? "ValuStock คำนวณมูลค่าหุ้นจากอะไร?" : "What does ValuStock use to estimate fair value?",
      a:
        lang === "th"
          ? "ระบบใช้ข้อมูลทางการเงิน เช่น Free Cash Flow, EPS, BVPS, หนี้สิน, เงินสด, อัตราการเติบโต และราคาตลาด แล้วประเมินร่วมด้วย DCF, Graham Number และ Margin of Safety เพื่อให้เห็นกรอบราคาเหมาะสม ไม่ใช่ตัวเลขฟันธงเพียงค่าเดียว"
          : "ValuStock combines financial inputs such as free cash flow, EPS, BVPS, debt, cash, growth, and market price with DCF, Graham Number, and margin-of-safety logic.",
    },
    {
      q: lang === "th" ? "DCF กับ Graham Number ต่างกันอย่างไร?" : "How are DCF and Graham Number different?",
      a:
        lang === "th"
          ? "DCF ประเมินจากกระแสเงินสดในอนาคต จึงเหมาะกับธุรกิจที่คาดการณ์ FCF ได้ ส่วน Graham Number เป็นสูตรเชิงรับจาก EPS และ BVPS เหมาะกับหุ้นที่มีกำไรและสินทรัพย์รองรับชัดเจน"
          : "DCF values future cash flows, while Graham Number is a defensive EPS and book-value formula for companies with tangible asset backing.",
    },
    {
      q: lang === "th" ? "ควรใช้ Margin of Safety เท่าไร?" : "What margin of safety should investors use?",
      a:
        lang === "th"
          ? "โดยทั่วไปหุ้นคุณภาพสูงอาจใช้ส่วนเผื่อ 15-25% ส่วนธุรกิจผันผวน หนี้สูง หรือคาดการณ์ยากควรใช้ 30-50% ขึ้นไป เพราะความผิดพลาดของสมมติฐานส่งผลต่อมูลค่า DCF มาก"
          : "High-quality companies may justify a 15-25% cushion, while cyclical, leveraged, or uncertain businesses often need 30-50% or more.",
    },
    {
      q: lang === "th" ? "สูตรเหล่านี้ใช้แทนคำแนะนำลงทุนได้ไหม?" : "Is this investment advice?",
      a:
        lang === "th"
          ? "ไม่ได้ครับ ข้อมูลและสูตรใน ValuStock เป็นเครื่องมือช่วยวิเคราะห์และเรียนรู้ นักลงทุนควรตรวจงบการเงิน ข่าว ความเสี่ยงเฉพาะบริษัท และเป้าหมายการลงทุนของตัวเองก่อนตัดสินใจ"
          : "No. These models are research and education tools. Investors should review filings, news, company-specific risks, and personal objectives before making decisions.",
    },
  ];

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline:
        lang === "th"
          ? "วิธีคำนวณมูลค่าหุ้นของ ValuStock: DCF, Graham Number และ Margin of Safety"
          : "ValuStock valuation methodology: DCF, Graham Number, and Margin of Safety",
      description:
        lang === "th"
          ? "คู่มืออธิบายสูตรประเมินมูลค่าหุ้น แหล่งข้อมูล และวิธีอ่านผลราคาเหมาะสมใน ValuStock"
          : "A guide to ValuStock's stock valuation formulas, data sources, and fair value interpretation.",
      inLanguage: lang === "th" ? "th-TH" : "en-US",
      author: {
        "@type": "Organization",
        name: "ValuStock",
        url: "https://valustock.com",
      },
      publisher: {
        "@type": "Organization",
        name: "ValuStock",
        url: "https://valustock.com",
      },
      mainEntityOfPage: "https://valustock.com/methodology",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
    {
      "@context": "https://schema.org",
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
          name: "Methodology",
          item: "https://valustock.com/methodology",
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6 animate-fade-up px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* 🔮 TOP BANNER */}
      <div className="surface rounded-2xl p-6 border border-line bg-surface/40 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-36 h-36 bg-brand/10 rounded-full blur-2xl pointer-events-none" />
        <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold mb-2 inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> E-E-A-T Trust Core
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-ink leading-tight">
          {lang === "th"
            ? "ระเบียบวิธีวิจัยและแหล่งอ้างอิงข้อมูล (Methodology & Data Sources)"
            : "Valuation Methodology & Credible Data Sources"}
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 font-semibold leading-relaxed">
          {lang === "th"
            ? "เจาะลึกทฤษฎีการเงิน สูตรคำนวณมูลค่าหุ้น และวิธีอ่านราคาเหมาะสมจาก DCF, Graham Number และ Margin of Safety พร้อมที่มาของชุดข้อมูลทางการเงินในระบบ ValuStock"
            : "Explore the financial theories, mathematical models, and datasets underpinning ValuStock's dynamic intrinsic value assessments."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
          {["DCF", "Free Cash Flow", "WACC", "Graham Number", "Margin of Safety"].map((term) => (
            <span key={term} className="rounded-full border border-line bg-bg/50 px-3 py-1 text-muted">
              {term}
            </span>
          ))}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {methodCards.map((item) => (
          <Card key={item.label} className="border border-line bg-surface/35 p-4">
            <span className="inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-black text-brand">
              {item.label}
            </span>
            <h2 className="mt-3 font-display text-base font-black text-ink">{item.title}</h2>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-muted">{item.detail}</p>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand" />
            {lang === "th" ? "วิธีประเมินมูลค่าหุ้นใน ValuStock" : "How ValuStock Estimates Stock Value"}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted font-semibold leading-relaxed">
            {lang === "th"
              ? "เป้าหมายของ methodology นี้คือทำให้ตัวเลข Fair Value อ่านง่าย ตรวจสอบได้ และไม่พึ่งสูตรเดียวจนเสี่ยงเกินไป เพราะหุ้นแต่ละกลุ่มตอบสนองต่อ DCF, สินทรัพย์, กำไร และอัตราดอกเบี้ยไม่เหมือนกัน"
              : "This methodology is designed to make fair value easier to interpret and less dependent on a single formula because sectors react differently to cash flow, assets, earnings, and interest rates."}
          </p>
        </div>
        <div className="grid gap-3">
          {processSteps.map((step, index) => (
            <Card key={step.title} className="border border-line bg-surface/30 p-4">
              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-xs font-black text-brand">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-display text-sm font-black text-ink">{step.title}</h3>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">{step.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 📊 1. HOW WE CALCULATE FAIR VALUE */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
          <Calculator className="h-5 w-5 text-brand" />
          {lang === "th" ? "1. การประเมินมูลค่าเหมาะสม (How We Calculate Fair Value)" : "1. How We Calculate Fair Value"}
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* DCF MODEL */}
          <Card className="border border-line p-5 space-y-3 bg-surface/30">
            <h3 className="font-display font-bold text-sm text-ink flex items-center gap-1.5">
              <span className="grid h-6 w-6 place-items-center rounded bg-brand-soft text-brand font-bold text-xs">A</span>
              แบบจำลองกระแสเงินสดคิดลด (Discounted Cash Flow - DCF)
            </h3>
            <p className="text-xs text-muted leading-relaxed font-semibold">
              {lang === "th"
                ? "DCF เป็นมาตรฐานทองคำของการประเมินมูลค่า โดยคาดการณ์กระแสเงินสดอิสระ (Free Cash Flow to Firm) ไปข้างหน้า 5-10 ปี แล้วคิดลดกลับมาเป็นมูลค่าปัจจุบันด้วยต้นทุนเฉลี่ยของเงินทุน (WACC)"
                : "The DCF model projects free cash flows (FCF) 5 to 10 years into the future and discounts them back to present value using a conservative Weighted Average Cost of Capital (WACC)."}
            </p>
            <div className="bg-bg/60 p-3 rounded-xl border border-line font-mono text-[10px] text-brand font-bold">
              PV = FCF₁/(1+r)¹ + FCF₂/(1+r)² + ... + [Terminal Value/(1+r)ⁿ]
            </div>
            <span className="text-[10px] text-muted block font-semibold leading-none">
              * {lang === "th" ? "สัดส่วนปรับลดรวมเผื่อความปลอดภัย (Margin of Safety) คํานวณร่วมในรอบการกรองขั้นสุดท้าย" : "Margin of Safety adjustments are dynamically subtracted in final verdicts."}
            </span>
          </Card>

          {/* GRAHAM NUMBER */}
          <Card className="border border-line p-5 space-y-3 bg-surface/30">
            <h3 className="font-display font-bold text-sm text-ink flex items-center gap-1.5">
              <span className="grid h-6 w-6 place-items-center rounded bg-brand-soft text-brand font-bold text-xs">B</span>
              สูตรเบนจามิน เกรแฮม (Benjamin Graham Number)
            </h3>
            <p className="text-xs text-muted leading-relaxed font-semibold">
              {lang === "th"
                ? "ตัวเลขเกรแฮมช่วยประเมินมูลค่าหุ้นเชิงรับ (Defensive Value) โดยคูณมูลค่าทางบัญชี (BVPS) และกำไรสุทธิต่อหุ้น (EPS) เข้ากับตัวคูณจำกัดความเสี่ยงทางทฤษฎีที่ 22.5 เท่า"
                : "Introduced by the father of value investing, the Graham Number represents the theoretical ceiling price where P/E ratio is 15x and P/B is 1.5x (15 * 1.5 = 22.5 multiplier)."}
            </p>
            <div className="bg-bg/60 p-3 rounded-xl border border-line font-mono text-[10px] text-brand font-bold">
              Graham Number = √ ( 22.5 * EPS * Book Value Per Share )
            </div>
            <span className="text-[10px] text-muted block font-semibold leading-none">
              * {lang === "th" ? "เหมาอย่างยิ่งในการตรวจสอบสินทรัพย์หนุนหลังกลุ่มอุตสาหกรรมดั้งเดิม" : "Highly effective for tangible asset-heavy defensive banking and industrial sectors."}
            </span>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
          <Target className="h-5 w-5 text-brand" />
          {lang === "th" ? "4. วิธีอ่านผล Fair Value ให้ไม่พลาด" : "4. How to Interpret Fair Value"}
        </h2>
        <Card className="border border-line bg-surface/35 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              lang === "th"
                ? "ถ้าราคาตลาดต่ำกว่ามูลค่าที่ประเมินมาก อาจเป็นหุ้นน่าสนใจ แต่ต้องตรวจเหตุผลที่ตลาดให้ส่วนลด เช่น กำไรถดถอย หนี้สูง หรือความเสี่ยงเฉพาะอุตสาหกรรม"
                : "If market price is meaningfully below estimated value, it may be attractive, but the reason for the discount still matters.",
              lang === "th"
                ? "ถ้าราคาตลาดสูงกว่ามูลค่ามาก หุ้นอาจสะท้อนความคาดหวังสูงไปแล้ว ควรระวังการเติบโตที่ถูก price-in จน Margin of Safety เหลือน้อย"
                : "If market price is far above estimated value, expectations may already be priced in and margin of safety may be thin.",
              lang === "th"
                ? "หุ้น cyclical เช่น พลังงาน เดินเรือ หรือสินค้าโภคภัณฑ์ ควรใช้กำไรเฉลี่ยหลายปี ไม่ใช้ปีที่กำไรสูงผิดปกติเป็นฐาน"
                : "For cyclical stocks, use normalized multi-year earnings rather than a peak-profit year.",
              lang === "th"
                ? "หุ้นเติบโตสูงควรทดสอบหลาย scenario เพราะการเปลี่ยน growth rate หรือ WACC เพียงเล็กน้อยสามารถทำให้มูลค่า DCF เปลี่ยนมาก"
                : "For high-growth stocks, test several scenarios because small changes in growth or WACC can move DCF value materially.",
            ].map((text) => (
              <div key={text} className="flex gap-2 text-xs font-semibold leading-relaxed text-muted">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* 🛡️ 2. DATA SOURCES & TRANSPARENCY */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand" />
          {lang === "th" ? "2. แหล่งที่มาของข้อมูล (Credible Data Sources)" : "2. Our Financial Data Sources"}
        </h2>

        <Card className="border border-line p-6 bg-surface/35 space-y-4">
          <p className="text-xs sm:text-sm text-muted leading-relaxed font-semibold">
            {lang === "th"
              ? "เพื่อรักษามาตรฐานความน่าเชื่อถือ ระบบ ValuStock รวบรวมข้อมูลราคาตลาด งบการเงิน และข้อมูลย้อนหลังจากแหล่งข้อมูลตลาดที่เชื่อถือได้ โดยแสดงสถานะความสดใหม่ของราคาอย่างชัดเจน:"
              : "To keep data provenance clear, ValuStock aggregates market prices, financial statements, and historical data from trusted market-data feeds, with quote freshness shown clearly:"}
          </p>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="p-3 bg-bg/50 border border-line rounded-xl space-y-1">
              <span className="font-bold text-ink block">🇺🇸 US SEC Filings</span>
              <span className="text-[10px] text-muted font-semibold block">
                {lang === "th" ? "ดึงข้อมูลจากแบบแสดงงบการเงิน 10-K, 10-Q รายไตรมาสและประจำปีโดยตรง" : "SEC EDGAR feeds compiling direct 10-K and 10-Q statements."}
              </span>
            </div>
            <div className="p-3 bg-bg/50 border border-line rounded-xl space-y-1">
              <span className="font-bold text-ink block">🇹🇭 SET Exchange Feeds</span>
              <span className="text-[10px] text-muted font-semibold block">
                {lang === "th" ? "งบการเงินประจำงวด บัญชีแสดงผลดำเนินงาน ตลาดหลักทรัพย์แห่งประเทศไทย" : "SET exchange balance sheets, income statements, and cash flows."}
              </span>
            </div>
            <div className="p-3 bg-bg/50 border border-line rounded-xl space-y-1">
              <span className="font-bold text-ink block">📈 Live Market Feeds</span>
              <span className="text-[10px] text-muted font-semibold block">
                {lang === "th" ? "ราคาปิดและราคาซื้อขายระหว่างวันจากผู้ให้บริการข้อมูลชั้นนำทางการเงิน" : "Leading real-time stock ticker price updates and ETF indexing streams."}
              </span>
            </div>
          </div>
        </Card>
      </section>

      {/* 📜 3. HOW WE HANDLE METRICS FOR ETFS */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
          <Layers className="h-5 w-5 text-brand" />
          {lang === "th" ? "3. การคำนวณอัตราส่วนกองทุน (ETF & Mutual Funds Metrics)" : "3. ETF & Fund Performance Tracking"}
        </h2>

        <Card className="border border-line p-5 bg-surface/30 text-xs sm:text-sm text-muted leading-relaxed font-semibold space-y-2.5">
          <p>
            {lang === "th"
              ? "เนื่องจากกองทุนดัชนี (เช่น SPY, VOO, IGF) เป็นตราสารที่ระดมสินทรัพย์ไปลงทุนต่อในพอร์ตอื่น ระบบ ValuStock จึงใช้วิธีวิเคราะห์ที่ไม่เหมือนหุ้นรายตัว:"
              : "Because exchange-traded funds represent dynamic baskets of underlying security allocations rather than single operating entities, our calculations shift accordingly:"}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-muted">
            <li>
              <strong>Expense Ratio:</strong> {lang === "th" ? "ดึงสัดส่วนค่าธรรมเนียมจริงต่อปีเพื่อมาใช้ประเมินความคุ้มทุนระยะยาว" : "Direct compilation of annual management fees to evaluate long-term cost drags."}
            </li>
            <li>
              <strong>AUM (Assets Under Management):</strong> {lang === "th" ? "จัดอันดับขนาดกองเพื่อสะท้อนความสามารถในการซื้อมอบสภาพคล่อง" : "Dynamic assessment of total fund scale and asset backing for liquidity."}
            </li>
            <li>
              <strong>Intraday NAV:</strong> {lang === "th" ? "ประเมินราคาสินทรัพย์สุทธิต่อหน่วยลงทุนแทนราคาหนังสือแบบหุ้นเดี่ยว" : "Tracking net asset values instead of physical book price components."}
            </li>
          </ul>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand" />
          {lang === "th" ? "อ่านต่อและทดลองคำนวณจริง" : "Continue With Practical Tools"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              href: "/dcf-calculator",
              title: lang === "th" ? "DCF Calculator" : "DCF Calculator",
              desc:
                lang === "th"
                  ? "คำนวณราคาเหมาะสมหุ้นจาก Free Cash Flow, Growth, WACC และ Terminal Value"
                  : "Estimate fair value using free cash flow, growth, WACC, and terminal value.",
            },
            {
              href: "/intrinsic-value-calculator",
              title: lang === "th" ? "Intrinsic Value Calculator" : "Intrinsic Value Calculator",
              desc:
                lang === "th"
                  ? "ใช้สูตร Graham Number และ Margin of Safety เพื่อประเมินกรอบราคาหุ้นเชิงรับ"
                  : "Use Graham Number and margin of safety to estimate a defensive valuation range.",
            },
            {
              href: "/stocks",
              title: lang === "th" ? "ค้นหาหุ้นและกรองหุ้น" : "Stock Screener",
              desc:
                lang === "th"
                  ? "ดูหุ้นที่มีพื้นฐาน ราคา และสัญญาณมูลค่าน่าสนใจจากรายการหุ้นในระบบ"
                  : "Browse stocks by fundamentals, price, and value signals.",
            },
            {
              href: "/value-investing",
              title: lang === "th" ? "คู่มือ Value Investing" : "Value Investing Guide",
              desc:
                lang === "th"
                  ? "เรียนรู้แนวคิดหุ้นคุณค่า Intrinsic Value และการลงทุนพร้อมส่วนเผื่อความปลอดภัย"
                  : "Learn value investing, intrinsic value, and margin-of-safety principles.",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-line bg-surface/35 p-4 transition hover:border-brand/45 hover:bg-brand/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-sm font-black text-ink group-hover:text-brand">{item.title}</h3>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">{item.desc}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-brand transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-ink">
          {lang === "th" ? "คำถามที่พบบ่อยเกี่ยวกับสูตรคำนวณมูลค่าหุ้น" : "Valuation Methodology FAQ"}
        </h2>
        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <Card key={item.q} className="border border-line bg-surface/35">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="font-display text-sm font-black text-ink">{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-brand" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-brand" />
                  )}
                </button>
                {isOpen ? (
                  <div className="px-4 pb-4 text-xs font-semibold leading-relaxed text-muted">
                    {item.a}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </section>

      {/* 🏛️ EEAT DISCLAIMER WIDGET */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-xs flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 font-semibold text-muted">
          <span className="text-ink font-bold block">{lang === "th" ? "ข้อพึงระวังด้านความเสี่ยงทางการเงิน" : "Financial Allocation Risk Advisory"}</span>
          <p className="leading-relaxed text-[11px]">
            {lang === "th"
              ? "แบบจำลองกระแสเงินสดคิดลด (DCF) และอัตราส่วนการเงินที่ประมวลผลผ่าน ValuStock เป็นระบบจำลองความคุ้มค่าทางทฤษฎีเท่านั้น ไม่ใช่บทวิเคราะห์ทางการเงินและไม่ได้ชักชวนให้ระดมทุนหรือซื้อขายตราสารหนี้แต่อย่างใด นักลงทุนควรศึกษารายละเอียดอย่างครบถ้วนก่อนการตัดสินใจจัดสรรความเสี่ยงของพอร์ต"
              : "Financial evaluation scenarios, Graham multiple estimations, and DCF templates generated by our engines are designed for theoretical simulation purposes only. They do not constitute formal investment advice or capital acquisition solicitations. Past simulations do not predict future returns."}
          </p>
        </div>
      </div>
    </div>
  );
}

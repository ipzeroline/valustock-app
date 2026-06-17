"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/translations";
import { Sparkles, Target, Shield, Info, Layers, Calculator, CheckCircle, ChevronRight, TrendingUp, CircleDollarSign } from "@/lib/icons";

export default function ValueInvestingPage() {
  const { lang } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const titleTH = "Value Investing (VI): คู่มือแนวคิดออมหุ้นคุณค่าและลงทุนระยะยาว";
  const titleEN = "Value Investing (VI) Masterclass: Strategies for Long-Term Moats";
  const descTH = "เจาะลึกปรัชญาการลงทุนแบบเน้นคุณค่า (Value Investing) ค้นหาหุ้นราคาถูกกว่ามูลค่าจริงด้วยส่วนเผื่อความปลอดภัยที่แข็งแกร่ง";
  const descEN = "A comprehensive programmatic masterclass guiding value reinvestors on Benjamin Graham rules, intrinsic cushions, and compounding strategies.";

  useEffect(() => {
    document.title = `${lang === "th" ? titleTH : titleEN} | ValuStock`;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', lang === "th" ? descTH : descEN);
  }, [lang]);

  const viProcess = [
    {
      title: lang === "th" ? "ประเมินมูลค่าที่แท้จริง" : "Estimate intrinsic value",
      desc: lang === "th"
        ? "ใช้ DCF, Graham Number หรือวิธีเปรียบเทียบมูลค่าเพื่อประเมินว่าธุรกิจควรมีมูลค่าเท่าไร ไม่ใช่ดูแค่ราคาหุ้นล่าสุด"
        : "Use DCF, Graham Number, or valuation multiples to estimate what the business is worth, not just where the stock trades.",
      icon: Calculator,
    },
    {
      title: lang === "th" ? "รอ Margin of Safety" : "Wait for Margin of Safety",
      desc: lang === "th"
        ? "ซื้อเมื่อราคาตลาดต่ำกว่ามูลค่าประเมินพอสมควร เช่น 15-30% เพื่อกันความผิดพลาดจากสมมติฐานและความผันผวน"
        : "Buy only when market price is meaningfully below estimated value, often 15-30%, to protect against errors and volatility.",
      icon: Shield,
    },
    {
      title: lang === "th" ? "เลือกธุรกิจที่มีคูเมือง" : "Prefer durable moats",
      desc: lang === "th"
        ? "มองหาธุรกิจที่มีแบรนด์แข็งแรง ต้นทุนต่ำ ลูกค้าผูกพัน เครือข่ายใหญ่ หรือความสามารถขึ้นราคาได้"
        : "Look for brands, cost advantages, customer stickiness, network effects, or pricing power.",
      icon: Target,
    },
    {
      title: lang === "th" ? "ถือระยะยาวและทบทวนพื้นฐาน" : "Hold long-term and review fundamentals",
      desc: lang === "th"
        ? "VI ไม่ใช่ซื้อแล้วลืม ควรติดตามกำไร กระแสเงินสด หนี้สิน และความสามารถแข่งขันเป็นระยะ"
        : "Value investing is not buy-and-forget. Review earnings, cash flow, leverage, and competitive position over time.",
      icon: TrendingUp,
    },
  ];

  const checklist = [
    lang === "th" ? "ธุรกิจเข้าใจง่ายและมีรายได้คาดการณ์ได้พอสมควร" : "The business is understandable with reasonably forecastable revenue",
    lang === "th" ? "มีกระแสเงินสดอิสระหรือ Owner Earnings ที่แข็งแรง" : "Free cash flow or owner earnings are durable",
    lang === "th" ? "ROE/ROIC ดีต่อเนื่อง ไม่ได้เกิดจากหนี้สูงเกินไป" : "ROE/ROIC are consistently healthy and not driven by excessive leverage",
    lang === "th" ? "หนี้สินอยู่ในระดับที่รับได้เมื่อเทียบกับกระแสเงินสด" : "Debt is reasonable relative to cash flow",
    lang === "th" ? "ราคาตลาดต่ำกว่ามูลค่าประเมินและมี Margin of Safety" : "Market price is below estimated value with Margin of Safety",
    lang === "th" ? "มีเหตุผลชัดเจนว่าธุรกิจจะยังแข่งขันได้ในอนาคต" : "There is a clear reason the business can remain competitive",
  ];

  const faqItems = [
    {
      q: lang === "th" ? "Value Investing คืออะไร?" : "What is value investing?",
      a: lang === "th"
        ? "Value Investing คือแนวทางลงทุนที่มองหุ้นเป็นส่วนหนึ่งของธุรกิจ และพยายามซื้อเมื่อราคาตลาดต่ำกว่ามูลค่าที่แท้จริง โดยมี Margin of Safety เพื่อป้องกันความผิดพลาด"
        : "Value investing treats stocks as business ownership and aims to buy below intrinsic value with a Margin of Safety.",
    },
    {
      q: lang === "th" ? "VI ต่างจากการเก็งกำไรอย่างไร?" : "How is VI different from speculation?",
      a: lang === "th"
        ? "VI เน้นพื้นฐานธุรกิจ กระแสเงินสด มูลค่าที่แท้จริง และระยะยาว ส่วนการเก็งกำไรมักเน้นทิศทางราคา ข่าว หรือ momentum ระยะสั้น"
        : "VI focuses on business fundamentals, cash flow, intrinsic value, and long-term ownership, while speculation often focuses on short-term price movement.",
    },
    {
      q: lang === "th" ? "Margin of Safety ควรเท่าไร?" : "How much Margin of Safety is enough?",
      a: lang === "th"
        ? "โดยทั่วไปนักลงทุน VI มักมองหา MOS อย่างน้อย 15-30% แต่หุ้นที่ธุรกิจเสี่ยง กำไรผันผวน หรือหนี้สูงควรต้องการส่วนเผื่อมากกว่านั้น"
        : "Many value investors seek at least 15-30%, but riskier, cyclical, or leveraged businesses may require a larger discount.",
    },
    {
      q: lang === "th" ? "หุ้น P/E ต่ำคือหุ้นคุณค่าเสมอไหม?" : "Is a low P/E always a value stock?",
      a: lang === "th"
        ? "ไม่เสมอครับ P/E ต่ำอาจมาจากกำไรพิเศษชั่วคราวหรือธุรกิจถดถอย ควรตรวจคุณภาพกำไร กระแสเงินสด หนี้สิน และแนวโน้มอุตสาหกรรมควบคู่"
        : "No. Low P/E can result from temporary earnings or business decline. Check earnings quality, cash flow, leverage, and industry trend.",
    },
    {
      q: lang === "th" ? "มือใหม่เริ่มลงทุนแบบ VI อย่างไร?" : "How should beginners start value investing?",
      a: lang === "th"
        ? "เริ่มจากธุรกิจที่เข้าใจง่าย อ่านงบพื้นฐาน ใช้เครื่องมือประเมินมูลค่า เช่น DCF หรือ Graham Number แล้วค่อยสร้าง watchlist เพื่อรอราคาที่มี Margin of Safety"
        : "Start with understandable businesses, read basic financial statements, use valuation tools like DCF or Graham Number, and build a watchlist.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6 animate-fade-up px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Article",
                "@id": "https://valustock.com/value-investing#article",
                "headline": "Value Investing คืออะไร คู่มือลงทุนแบบ VI หุ้นคุณค่า",
                "description": "คู่มือ Value Investing สำหรับนักลงทุนไทย ครอบคลุม Intrinsic Value, Margin of Safety, Benjamin Graham และ Warren Buffett",
                "author": {
                  "@type": "Organization",
                  "name": "ValuStock"
                },
                "publisher": {
                  "@type": "Organization",
                  "name": "ValuStock"
                },
                "mainEntityOfPage": "https://valustock.com/value-investing"
              },
              {
                "@type": "FAQPage",
                "@id": "https://valustock.com/value-investing#faq",
                "mainEntity": faqItems.map((faq) => ({
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
      {/* HEADER */}
      <div className="surface rounded-2xl p-6 border border-line bg-surface/40 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-36 h-36 bg-brand/10 rounded-full blur-2xl pointer-events-none" />
        <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold mb-2 inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> E-E-A-T Authority Hub
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-ink leading-tight">
          {lang === "th" ? titleTH : titleEN}
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 font-semibold leading-relaxed">
          {lang === "th" ? descTH : descEN}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            "Value Investing",
            "ลงทุนแบบ VI",
            "Benjamin Graham",
            "Warren Buffett",
            "Margin of Safety",
          ].map((item) => (
            <span key={item} className="rounded-full border border-line bg-bg/70 px-3 py-1 text-[11px] font-bold text-muted">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* CORE VI PILLARS */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
          <Target className="h-5 w-5 text-brand" />
          {lang === "th" ? "3 เสาหลักของการลงทุนแบบเน้นคุณค่า" : "The Three Core Pillars of Value Investing"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-3 text-xs sm:text-sm">
          <Card className="border border-line p-5 bg-surface/30 space-y-2">
            <span className="font-display font-extrabold text-brand text-lg">01</span>
            <h4 className="font-bold text-ink">{lang === "th" ? "ราคาต่ำกว่ามูลค่าจริง" : "Intrinsic Value Focus"}</h4>
            <p className="text-muted leading-relaxed font-semibold text-xs">
              {lang === "th"
                ? "ซื้อธุรกิจเมื่อราคาตลาดต่ำกว่ามูลค่าที่ควรจะเป็นอย่างเป็นนัยสำคัญ โดยประเมินมูลค่าเหมาะสมจากปัจจัยพื้นฐาน"
                : "Buying businesses only when their market price is significantly lower than their calculated intrinsic worth."}
            </p>
          </Card>

          <Card className="border border-line p-5 bg-surface/30 space-y-2">
            <span className="font-display font-extrabold text-brand text-lg">02</span>
            <h4 className="font-bold text-ink">{lang === "th" ? "ส่วนเผื่อความปลอดภัย" : "Margin of Safety (MOS)"}</h4>
            <p className="text-muted leading-relaxed font-semibold text-xs">
              {lang === "th"
                ? "มีระดับความปลอดภัยเป็นแนวต้านเพื่อลดความคลาดเคลื่อนของการคาดเดาอนาคต แนะนำส่วนเผื่อขั้นต่ำ 15% - 30%"
                : "Maintaining a pricing cushion of 15% to 30% under Fair Value to buffer against unpredictable future market events."}
            </p>
          </Card>

          <Card className="border border-line p-5 bg-surface/30 space-y-2">
            <span className="font-display font-extrabold text-brand text-lg">03</span>
            <h4 className="font-bold text-ink">{lang === "th" ? "คูเมืองของธุรกิจ" : "Economic Moats"}</h4>
            <p className="text-muted leading-relaxed font-semibold text-xs">
              {lang === "th"
                ? "เลือกเฉพาะธุรกิจที่มีความได้เปรียบในการแข่งขันอย่างยั่งยืน เช่น แบรนด์แข็งแกร่ง หรือมีประสิทธิภาพต้นทุนที่เหนือกว่า"
                : "Selecting premium compounders displaying durable competitive advantages (e.g., strong brands or cost leadership)."}
            </p>
          </Card>
        </div>
      </section>

      {/* VI PROCESS */}
      <section className="space-y-5 border-t border-line/60 pt-8">
        <div className="text-center">
          <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold">
            <Shield className="h-3.5 w-3.5" /> {lang === "th" ? "กระบวนการลงทุนแบบ VI" : "Value investing process"}
          </span>
          <h2 className="mt-3 font-display text-2xl font-black leading-tight text-ink">
            {lang === "th" ? "วิธีเลือกหุ้นคุณค่าแบบเป็นระบบ" : "A systematic way to find value stocks"}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm font-medium leading-relaxed text-muted">
            {lang === "th"
              ? "การลงทุนแบบ VI ไม่ใช่แค่ซื้อหุ้นราคาถูก แต่คือการประเมินธุรกิจ หา intrinsic value รอราคาที่มี Margin of Safety และถือธุรกิจที่ยังรักษาความได้เปรียบได้จริง"
              : "Value investing is more than buying cheap stocks. It means valuing the business, waiting for Margin of Safety, and owning durable companies."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {viProcess.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border border-line bg-surface/25 p-5">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="font-mono text-[10px] font-black text-brand">STEP {idx + 1}</span>
                    <h3 className="font-display text-sm font-bold text-ink">{item.title}</h3>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-muted">{item.desc}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CHECKLIST */}
      <section className="grid gap-5 border-t border-line/60 pt-8 md:grid-cols-[1fr_0.9fr]">
        <Card className="border border-line bg-surface/25 p-5">
          <span className="chip border-up/30 bg-up/10 text-up text-[10px] font-bold">
            <CheckCircle className="h-3.5 w-3.5" /> {lang === "th" ? "VI Checklist" : "VI Checklist"}
          </span>
          <h2 className="mt-3 font-display text-xl font-black text-ink">
            {lang === "th" ? "ก่อนซื้อหุ้นคุณค่า ควรตรวจอะไรบ้าง" : "What to check before buying a value stock"}
          </h2>
          <div className="mt-4 grid gap-2 text-xs font-bold text-muted">
            {checklist.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border border-line bg-surface/25 p-5">
          <h2 className="font-display text-xl font-black text-ink">
            {lang === "th" ? "ตัวเลขที่นักลงทุน VI ควรดู" : "Metrics value investors should watch"}
          </h2>
          <div className="mt-4 space-y-3">
            {[
              { label: "Intrinsic Value", desc: lang === "th" ? "มูลค่าที่แท้จริงของธุรกิจจากกระแสเงินสดและพื้นฐาน" : "Estimated business value from cash flow and fundamentals", icon: Target },
              { label: "Margin of Safety", desc: lang === "th" ? "ส่วนลดจากมูลค่าที่แท้จริงเพื่อกันความผิดพลาด" : "Discount to intrinsic value as an error buffer", icon: Shield },
              { label: "ROE / ROIC", desc: lang === "th" ? "ประสิทธิภาพการใช้ทุนและคุณภาพธุรกิจ" : "Capital efficiency and business quality", icon: TrendingUp },
              { label: "Free Cash Flow", desc: lang === "th" ? "เงินสดที่ธุรกิจเหลือจริงสำหรับเจ้าของ" : "Cash truly available to owners", icon: CircleDollarSign },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex gap-3 rounded-xl border border-line bg-bg p-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="font-display text-xs font-bold text-ink">{item.label}</div>
                    <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-muted">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* BENJAMIN GRAHAM VS WARREN BUFFETT */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
          <Layers className="h-5 w-5 text-brand" />
          {lang === "th" ? "Graham vs Buffett: สองสำนักแห่งมูลค่า" : "Graham vs Buffett: Two Schools of Value"}
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border border-line p-5 bg-surface/20 space-y-2">
            <h4 className="font-display font-bold text-ink text-sm sm:text-base">Benjamin Graham: ปรัชญาเชิงรับ (Defensive Value)</h4>
            <p className="text-xs sm:text-sm text-muted font-semibold leading-relaxed">
              {lang === "th"
                ? "เน้นหาหุ้นที่ราคาถูกมากๆ เช่น ซื้อหุ้นที่ราคายังไม่เกินราคาหนังสือสินทรัพย์หมุนเวียนสุทธิ (Net-Net Stocks) เหมาะสำหรับตลาดไซด์เวย์ที่มุ่งหาผลตอบแทนลดความเสี่ยงเป็นหลัก"
                : "Prioritizes buying assets at deeply depressed multiples (e.g., Net-Net bargains trading under current asset liquidation limits). Highly defensive and statistical."}
            </p>
          </Card>

          <Card className="border border-line p-5 bg-surface/20 space-y-2">
            <h4 className="font-display font-bold text-ink text-sm sm:text-base">Warren Buffett: เน้นคุณภาพเติบโต (Quality Compounding)</h4>
            <p className="text-xs sm:text-sm text-muted font-semibold leading-relaxed">
              {lang === "th"
                ? "เน้นคัดเฉพาะ 'ธุรกิจที่ยอดเยี่ยมในราคาสมน้ำสมเนื้อ' โดยเน้นกระแสเงินสดอิสระที่เจ้าของพึงได้ (Owner Earnings) และ ROE ทบต้นในระยะยาวเพื่อสร้างมูลค่าอันยิ่งใหญ่"
                : "Focuses on 'wonderful businesses at fair prices'. Prioritizes strong free cash flow generation (Owner Earnings) and long-term capital compounding."}
            </p>
          </Card>
        </div>
      </section>

      {/* SYSTEM TOOL LINKS */}
      <Card className="border border-line p-6 bg-surface/30 space-y-4">
        <h3 className="font-display font-bold text-ink text-sm sm:text-base">
          {lang === "th" ? "เริ่มต้นหาหุ้นคุณค่าตัวแรกบน ValuStock" : "Start Hunting for Quality Compounders"}
        </h3>
        <p className="text-xs sm:text-sm text-muted font-semibold leading-relaxed">
          {lang === "th"
            ? "เรามีเครื่องมือชั้นนำที่จะช่วยคุณคัดกรองหุ้นตามเป้าหมายมูลค่าโดยไม่จำเป็นต้องคำนวณสูตรมือให้ยุ่งยากอีกต่อไป:"
            : "Use our comprehensive automated suite to calculate discounts, analyze SEC balance sheets, and identify Moats instantly:"}
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href="/undervalued-stocks">
            <Button size="sm">
              {lang === "th" ? "ค้นหาหุ้นราคาถูกกว่ามูลค่า" : "Find Undervalued Stocks"}
            </Button>
          </Link>
          <Link href="/dividend-stocks">
            <Button variant="ghost" size="sm">
              {lang === "th" ? "สแกนหุ้นปันผลเด่น" : "Screen Dividend Stocks"}
            </Button>
          </Link>
          <Link href="/stocks">
            <Button variant="ghost" size="sm">
              {lang === "th" ? "เปิดโปรแกรมคัดกรองหุ้น" : "Open Stock Screener"}
            </Button>
          </Link>
          <Link href="/dcf-calculator">
            <Button variant="ghost" size="sm">
              DCF Calculator
            </Button>
          </Link>
          <Link href="/intrinsic-value-calculator">
            <Button variant="ghost" size="sm">
              Intrinsic Value
            </Button>
          </Link>
        </div>
      </Card>

      {/* FAQ */}
      <section className="space-y-4 border-t border-line/60 pt-8">
        <div className="text-center">
          <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold">
            <Info className="h-3.5 w-3.5" /> FAQ
          </span>
          <h2 className="mt-3 font-display text-2xl font-black text-ink">
            {lang === "th" ? "คำถามที่พบบ่อยเกี่ยวกับ Value Investing" : "Value Investing FAQ"}
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={faq.q} className="overflow-hidden rounded-2xl border border-line bg-bg/40">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-ink transition hover:bg-elevate/45"
                >
                  <span>{faq.q}</span>
                  <span className="shrink-0 font-mono text-xs text-brand">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-line/30 px-5 pb-4 pt-3 text-xs font-medium leading-relaxed text-muted">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

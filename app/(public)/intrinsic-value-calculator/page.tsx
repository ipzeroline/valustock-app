"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/translations";
import { num } from "@/lib/format";
import { Sparkles, Calculator, Info, Shield, Target, CheckCircle, ChevronRight } from "@/lib/icons";

export default function IntrinsicValueCalculatorPage() {
  const { lang } = useTranslation();

  // Calculator inputs
  const [eps, setEps] = useState<string>("5.5");
  const [bvps, setBvps] = useState<string>("45.0");
  const [growth, setGrowth] = useState<string>("8.0");
  const [price, setPrice] = useState<string>("120.0");
  const [bondYield, setBondYield] = useState<string>("4.4"); // AAA Corporate Bond Yield

  // Computed metrics
  const [grahamNum, setGrahamNum] = useState<number>(0);
  const [grahamFormula, setGrahamFormula] = useState<number>(0);
  const [mosNum, setMosNum] = useState<number>(0);
  const [mosFormula, setMosFormula] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const e = parseFloat(eps) || 0;
    const b = parseFloat(bvps) || 0;
    const g = parseFloat(growth) || 0;
    const p = parseFloat(price) || 0;
    const y = parseFloat(bondYield) || 4.4;

    // 1. Classic Graham Number: sqrt(22.5 * EPS * BVPS)
    let gNum = 0;
    if (e > 0 && b > 0) {
      gNum = Math.sqrt(22.5 * e * b);
    }
    setGrahamNum(gNum);

    // 2. Graham Growth Intrinsic Value: (EPS * (8.5 + 2g) * 4.4) / Y
    let gForm = 0;
    if (e > 0) {
      gForm = (e * (8.5 + 2 * g) * 4.4) / y;
    }
    setGrahamFormula(gForm);

    // 3. Margin of Safety
    if (p > 0) {
      setMosNum(((gNum - p) / gNum) * 100);
      setMosFormula(((gForm - p) / gForm) * 100);
    } else {
      setMosNum(0);
      setMosFormula(0);
    }
  }, [eps, bvps, growth, price, bondYield]);

  const titleTH = "Intrinsic Value Calculator: เครื่องมือประเมินมูลค่าหุ้นด้วยสูตร Graham";
  const titleEN = "Graham Intrinsic Value Calculator: Real-Time Intrinsic Price Modeling";
  const descTH = "คำนวณมูลค่าที่แท้จริงของหุ้นด้วย Graham Number, EPS, BVPS, Growth Rate และ Margin of Safety เพื่อดูว่าหุ้นถูกหรือแพงก่อนตัดสินใจลงทุน";
  const descEN = "Evaluate core defensive pricing parameters using our interactive Benjamin Graham Growth formulas. Reside capital safety targets instantly.";

  const howToSteps = [
    {
      title: lang === "th" ? "กรอก EPS หรือกำไรต่อหุ้น" : "Enter earnings per share",
      desc: lang === "th"
        ? "ใช้ EPS จากงบล่าสุดหรือค่าเฉลี่ยหลายปีสำหรับธุรกิจที่กำไรผันผวน เพื่อไม่ให้ผลประเมินสูงเกินจริง"
        : "Use trailing EPS or a multi-year average for cyclical businesses to avoid overestimating value.",
    },
    {
      title: lang === "th" ? "ใส่ BVPS หรือมูลค่าทางบัญชีต่อหุ้น" : "Add book value per share",
      desc: lang === "th"
        ? "BVPS ช่วยให้สูตร Graham Number ตรวจความแข็งแรงของสินทรัพย์และส่วนของผู้ถือหุ้นร่วมกับกำไร"
        : "BVPS lets the Graham Number blend asset backing with earnings power.",
    },
    {
      title: lang === "th" ? "ตั้ง Growth Rate และ Bond Yield อย่างระมัดระวัง" : "Set growth and bond-yield assumptions carefully",
      desc: lang === "th"
        ? "อัตราเติบโตควรมาจากสมมติฐานที่พิสูจน์ได้ ส่วน Bond Yield ใช้เป็นตัวปรับผลตอบแทนทางเลือก"
        : "Growth should be evidence-based, while bond yield acts as an opportunity-cost anchor.",
    },
    {
      title: lang === "th" ? "อ่าน Margin of Safety ก่อนตัดสินใจ" : "Review Margin of Safety before deciding",
      desc: lang === "th"
        ? "ถ้าราคาตลาดต่ำกว่ามูลค่าที่ประเมินได้มากพอ หุ้นอาจมีแต้มต่อ แต่ยังต้องตรวจหนี้ กระแสเงินสด และคุณภาพธุรกิจเสมอ"
        : "A positive discount can be attractive, but debt, cash flow, and business quality still matter.",
    },
  ];

  const formulaCards = [
    {
      title: "Graham Number",
      formula: "√(22.5 × EPS × BVPS)",
      desc: lang === "th"
        ? "สูตรประเมินเชิงรับที่เหมาะกับธุรกิจมีกำไรและมีสินทรัพย์รองรับ ช่วยตอบว่าหุ้นแพงเกินไปเมื่อเทียบกับกำไรและมูลค่าทางบัญชีหรือไม่"
        : "A defensive estimate for profitable, asset-backed businesses that balances earnings and book value.",
    },
    {
      title: "Graham Growth Formula",
      formula: "EPS × (8.5 + 2g) × 4.4 ÷ Y",
      desc: lang === "th"
        ? "สูตรที่นำอัตราเติบโตคาดหวังและผลตอบแทนตราสารหนี้มาใช้เทียบ เพื่อประมาณมูลค่าหุ้นเติบโตอย่างระมัดระวัง"
        : "A growth-adjusted estimate using expected growth and bond-yield assumptions.",
    },
    {
      title: "Margin of Safety",
      formula: "(Intrinsic Value - Price) ÷ Intrinsic Value",
      desc: lang === "th"
        ? "ส่วนเผื่อความปลอดภัยช่วยบอกว่าราคาตลาดต่ำกว่ามูลค่าประเมินกี่เปอร์เซ็นต์ นักลงทุน VI มักมองหา MOS อย่างน้อย 15-30%"
        : "The estimated discount between market price and intrinsic value. Value investors often seek 15-30% or more.",
    },
  ];

  const faqItems = [
    {
      q: lang === "th" ? "Intrinsic Value คืออะไร?" : "What is intrinsic value?",
      a: lang === "th"
        ? "Intrinsic Value หรือมูลค่าที่แท้จริง คือมูลค่าประเมินของหุ้นจากพื้นฐานธุรกิจ เช่น กำไร กระแสเงินสด สินทรัพย์ หนี้สิน และศักยภาพเติบโต ไม่ใช่ราคาที่ตลาดซื้อขายในแต่ละวัน"
        : "Intrinsic value is an estimate of a company's value based on fundamentals such as earnings, cash flow, assets, liabilities, and growth potential.",
    },
    {
      q: lang === "th" ? "Graham Number ใช้กับหุ้นทุกตัวได้ไหม?" : "Can Graham Number be used for every stock?",
      a: lang === "th"
        ? "ไม่เหมาะกับทุกตัวครับ สูตรนี้เหมาะกับหุ้นที่มีกำไรเป็นบวกและมีมูลค่าทางบัญชีชัดเจน ส่วนหุ้นเทคโนโลยี asset-light หรือบริษัทขาดทุนควรใช้ DCF และการวิเคราะห์คุณภาพธุรกิจประกอบ"
        : "No. It works best for profitable companies with meaningful book value. Asset-light or loss-making companies need other valuation methods as well.",
    },
    {
      q: lang === "th" ? "Margin of Safety เท่าไรถึงน่าสนใจ?" : "What Margin of Safety is attractive?",
      a: lang === "th"
        ? "โดยทั่วไปนักลงทุนแนวคุณค่ามักเริ่มสนใจเมื่อ MOS มากกว่า 15-30% แต่ตัวเลขนี้ควรสูงขึ้นถ้าธุรกิจมีหนี้มาก กำไรผันผวน หรือคาดการณ์เติบโตยาก"
        : "Many value investors look for at least 15-30%, but riskier or more cyclical companies may require a wider discount.",
    },
    {
      q: lang === "th" ? "ควรใช้ EPS ปีล่าสุดหรือค่าเฉลี่ยย้อนหลัง?" : "Should I use latest EPS or an average EPS?",
      a: lang === "th"
        ? "ถ้าธุรกิจมีกำไรสม่ำเสมอ ใช้ EPS ล่าสุดได้ แต่ถ้าธุรกิจเป็นวัฏจักร เช่น สินค้าโภคภัณฑ์ อสังหา หรือธนาคารบางช่วง ควรใช้ค่าเฉลี่ย 3-5 ปีเพื่อความระมัดระวัง"
        : "Use latest EPS for stable businesses. For cyclical companies, a 3-5 year average is often more conservative.",
    },
  ];

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

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6 animate-fade-up px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                "@id": "https://valustock.com/intrinsic-value-calculator#calculator",
                "name": "ValuStock Intrinsic Value Calculator",
                "applicationCategory": "FinanceApplication",
                "operatingSystem": "All",
                "url": "https://valustock.com/intrinsic-value-calculator",
                "description": "เครื่องมือคำนวณมูลค่าที่แท้จริงของหุ้นด้วย Graham Number, Graham Growth Formula และ Margin of Safety",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "THB"
                }
              },
              {
                "@type": "FAQPage",
                "@id": "https://valustock.com/intrinsic-value-calculator#faq",
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
          <Sparkles className="h-3 w-3" /> Interactive Financial Web Utility
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-ink leading-tight">
          {lang === "th" ? titleTH : titleEN}
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 font-semibold leading-relaxed">
          {lang === "th" ? descTH : descEN}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            "intrinsic value หุ้น",
            "Graham Number",
            "Margin of Safety",
            "คำนวณมูลค่าหุ้น",
          ].map((item) => (
            <span key={item} className="rounded-full border border-line bg-bg/70 px-3 py-1 text-[11px] font-bold text-muted">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* INPUTS COLUMN */}
        <Card className="border border-line p-5 bg-surface/30 space-y-4 md:col-span-1">
          <h3 className="font-display font-bold text-sm text-ink flex items-center gap-1.5 uppercase tracking-wide">
            <Calculator className="h-4.5 w-4.5 text-brand" /> {lang === "th" ? "กำหนดสมมติฐาน" : "Model Inputs"}
          </h3>

          {/* EPS INPUT */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted font-bold block uppercase">{lang === "th" ? "กำไรสุทธิต่อหุ้น (EPS)" : "Earnings Per Share (EPS)"}</label>
            <input
              type="number"
              value={eps}
              onChange={(e) => setEps(e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-mono text-xs text-ink font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          {/* BVPS INPUT */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted font-bold block uppercase">{lang === "th" ? "ราคาสมุดบัญชีต่อหุ้น (BVPS)" : "Book Value Per Share (BVPS)"}</label>
            <input
              type="number"
              value={bvps}
              onChange={(e) => setBvps(e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-mono text-xs text-ink font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          {/* GROWTH EXPECTED */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted font-bold block uppercase">{lang === "th" ? "อัตราเติบโตคาดหวัง (%)" : "Expected Growth Rate (%)"}</label>
            <input
              type="number"
              value={growth}
              onChange={(e) => setGrowth(e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-mono text-xs text-ink font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          {/* CURRENT PRICE */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted font-bold block uppercase">{lang === "th" ? "ราคาซื้อขายล่าสุด" : "Current Market Price"}</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-mono text-xs text-ink font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          {/* BOND YIELD */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted font-bold block uppercase">{lang === "th" ? "ดอกเบี้ยหุ้นกู้ AAA (Y %)" : "Bond Yield Anchor (Y %)"}</label>
            <input
              type="number"
              value={bondYield}
              onChange={(e) => setBondYield(e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-mono text-xs text-ink font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>
        </Card>

        {/* RESULTS COLUMNS */}
        <div className="md:col-span-2 space-y-4.5 flex flex-col">
          {/* METHOD 1: GRAHAM NUMBER */}
          <Card className="border border-line p-5 bg-surface/20 space-y-3 flex-1 flex flex-col justify-between">
            <div>
              <span className="chip border-brand/30 bg-brand/10 text-brand text-[10px] font-bold mb-1.5 inline-block uppercase">
                Method A: Classic Benjamin Graham Number
              </span>
              <h3 className="font-display font-black text-lg text-ink">
                {lang === "th" ? "สูตรประเมินความปลอดภัยเชิงรับ (Defensive Cap Price)" : "Defensive Capitalization Price Target"}
              </h3>
              <p className="text-xs text-muted leading-relaxed font-semibold mt-1">
                {lang === "th"
                  ? "เหมาะสำหรับหุ้นพื้นฐานหนักในอุตสาหกรรมดั้งเดิม ที่เน้นตรวจสอบว่าตัวคูณ PE ไม่เกิน 15 เท่า และมีทรัพย์สินสมุดบัญชี (P/B) ค้ำหนี้ไม่เกิน 1.5 เท่า"
                  : "Designed by Benjamin Graham for asset-heavy traditional industries, ensuring valuation multiple balances don't exceed conservative levels."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mt-4">
              <div className="bg-bg/60 p-3.5 border border-line rounded-xl text-center">
                <span className="text-[10px] text-muted font-bold block uppercase">{lang === "th" ? "มูลค่าเหมาะสมของเกรแฮม" : "Graham Intrinsic Value"}</span>
                <span className="font-display font-black text-2xl text-gold mt-1 block font-mono">
                  {grahamNum > 0 ? num(grahamNum, 2) : "—"}
                </span>
              </div>
              <div className="bg-bg/60 p-3.5 border border-line rounded-xl text-center flex flex-col justify-center">
                <span className="text-[10px] text-muted font-bold block uppercase">{lang === "th" ? "ส่วนต่างความปลอดภัย (MOS)" : "Margin of Safety"}</span>
                <span className={`font-display font-black text-xl mt-1 block font-mono ${mosNum >= 0 ? "text-up" : "text-down"}`}>
                  {price && grahamNum > 0 ? (mosNum > 0 ? "+" : "") + num(mosNum, 0) + "%" : "—"}
                </span>
              </div>
            </div>
          </Card>

          {/* METHOD 2: GRAHAM GROWTH */}
          <Card className="border border-line p-5 bg-surface/20 space-y-3 flex-1 flex flex-col justify-between">
            <div>
              <span className="chip border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold mb-1.5 inline-block uppercase">
                Method B: Revised Graham Growth Formula
              </span>
              <h3 className="font-display font-black text-lg text-ink">
                {lang === "th" ? "สูตรคิดอัตราเติบโต (Compounding Growth intrinsic)" : "Capital Growth Compounder Intrinsic"}
              </h3>
              <p className="text-xs text-muted leading-relaxed font-semibold mt-1">
                {lang === "th"
                  ? "เหมาะสำหรับวิเคราะห์แนวต้านราคาของหุ้นที่มีการจัดกลุ่มเติบโตอย่างมั่นคง โดยเอาทัศนคติของดอกเบี้ยหุ้นกู้บริษัทชั้นนำ (AAA) มาร่วมเปรียบเทียบแต้มต่อผลตอบแทนในคาบเวลา"
                  : "Takes management growth estimates into account and integrates AAA corporate bond rate adjustments to estimate value premium levels."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mt-4">
              <div className="bg-bg/60 p-3.5 border border-line rounded-xl text-center">
                <span className="text-[10px] text-muted font-bold block uppercase">{lang === "th" ? "มูลค่าประเมินเชิงรับเติบโต" : "Graham Growth Value"}</span>
                <span className="font-display font-black text-2xl text-gold mt-1 block font-mono">
                  {grahamFormula > 0 ? num(grahamFormula, 2) : "—"}
                </span>
              </div>
              <div className="bg-bg/60 p-3.5 border border-line rounded-xl text-center flex flex-col justify-center">
                <span className="text-[10px] text-muted font-bold block uppercase">{lang === "th" ? "ส่วนต่างความปลอดภัย (MOS)" : "Margin of Safety"}</span>
                <span className={`font-display font-black text-xl mt-1 block font-mono ${mosFormula >= 0 ? "text-up" : "text-down"}`}>
                  {price && grahamFormula > 0 ? (mosFormula > 0 ? "+" : "") + num(mosFormula, 0) + "%" : "—"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* RISKS & FORMULA EXPLANATION */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-xs flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 font-semibold text-muted">
          <span className="text-ink font-bold block">{lang === "th" ? "ระเบียบวิธีคํานวณตัวเลขเกรแฮมในเครื่องมือ" : "Graham Formula Fiduciary Rules"}</span>
          <p className="leading-relaxed text-[11px]">
            {lang === "th"
              ? "สูตรเกรแฮมดั้งเดิมมีข้อจํากัดในการใช้งานกับหุ้นกลุ่มเทคโนโลยีที่มีระดับการเติบโตสูงผิดปกติ หรือทรัพย์สินทางปัญญาล้นสมุดบัญชี (Asset-Light) ในระบบจึงแนะนําให้ใช้ตัวคูณอัตราเติบโต Y % (Bond Yield) เข้าประคองแนวรับราคาร่วมกับส่วนเผื่อความปลอดภัยที่ระดับ 15-30% เสมอเพื่อรักษาพอร์ตปลอดภัยสูงสุด"
              : "Defensive Graham calculations provide an absolute margin of capital cushion. However, they may penalize fast-growing asset-light tech entities command higher intangible book tags. Reinvestors are encouraged to cross-allocate parameters alongside 15-30% Margin of Safety cushions."}
          </p>
        </div>
      </div>

      {/* SEO CONTENT */}
      <section className="space-y-5 border-t border-line/60 pt-8">
        <div className="text-center">
          <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold">
            <Target className="h-3.5 w-3.5" /> {lang === "th" ? "คู่มือใช้งานสำหรับนักลงทุน VI" : "Value investor guide"}
          </span>
          <h2 className="mt-3 font-display text-2xl font-black leading-tight text-ink">
            {lang === "th" ? "Intrinsic Value Calculator ใช้ประเมินหุ้นถูกหรือแพงอย่างไร" : "How to use an Intrinsic Value Calculator"}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm font-medium leading-relaxed text-muted">
            {lang === "th"
              ? "เครื่องมือนี้ช่วยประเมินมูลค่าเหมาะสมของหุ้นจาก EPS, BVPS, Growth Rate และ Bond Yield เพื่อให้เห็นกรอบราคาเชิงพื้นฐาน ก่อนนำไปเทียบกับราคาตลาดและส่วนเผื่อความปลอดภัย"
              : "This tool estimates a fundamental value range from EPS, BVPS, growth rate, and bond yield, then compares it with market price and Margin of Safety."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {howToSteps.map((step, idx) => (
            <Card key={step.title} className="border border-line bg-surface/25 p-5">
              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 font-mono text-xs font-black text-brand">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold text-ink">{step.title}</h3>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-muted">{step.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-5 border-t border-line/60 pt-8">
        <div>
          <h2 className="font-display text-2xl font-black leading-tight text-ink">
            {lang === "th" ? "สูตรคำนวณมูลค่าหุ้นที่ใช้ในหน้านี้" : "Valuation formulas used on this page"}
          </h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
            {lang === "th"
              ? "สูตรเหล่านี้เป็นกรอบประเมินเชิงอนุรักษ์นิยมตามแนวคิด Benjamin Graham เหมาะสำหรับใช้เป็นจุดเริ่มต้นในการวิเคราะห์ ไม่ใช่คำแนะนำซื้อขายหลักทรัพย์"
              : "These formulas are conservative Benjamin Graham-style valuation frameworks and should be used as a starting point, not as trading advice."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {formulaCards.map((item) => (
            <Card key={item.title} className="border border-line bg-surface/25 p-5">
              <h3 className="font-display text-base font-black text-ink">{item.title}</h3>
              <div className="mt-3 rounded-xl border border-line bg-bg p-3 font-mono text-[11px] font-bold text-gold">
                {item.formula}
              </div>
              <p className="mt-3 text-xs font-medium leading-relaxed text-muted">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-5 border-t border-line/60 pt-8 md:grid-cols-[1fr_0.9fr]">
        <Card className="border border-line bg-surface/25 p-5">
          <span className="chip border-up/30 bg-up/10 text-up text-[10px] font-bold">
            <Shield className="h-3.5 w-3.5" /> {lang === "th" ? "วิธีอ่านผลลัพธ์" : "Reading the result"}
          </span>
          <h2 className="mt-3 font-display text-xl font-black text-ink">
            {lang === "th" ? "ดู Margin of Safety อย่างเดียวพอไหม?" : "Is Margin of Safety enough?"}
          </h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
            {lang === "th"
              ? "Margin of Safety เป็นจุดเริ่มต้นที่ดี แต่ยังไม่พอสำหรับการตัดสินใจลงทุน ควรดูคุณภาพกำไร หนี้สิน กระแสเงินสด ความสามารถแข่งขัน และความสม่ำเสมอของธุรกิจควบคู่กัน หุ้นที่ดู undervalue อาจเป็น value trap ได้ถ้ากำไรลดลงถาวรหรือหนี้สูงเกินไป"
              : "Margin of Safety is useful, but investors should also review earnings quality, leverage, cash flow, competitive position, and business consistency."}
          </p>
          <div className="mt-4 grid gap-2 text-xs font-bold text-muted">
            {[
              lang === "th" ? "MOS เป็นบวก: ราคาตลาดต่ำกว่ามูลค่าประเมิน" : "Positive MOS: price is below estimated value",
              lang === "th" ? "MOS ติดลบ: ราคาตลาดสูงกว่ามูลค่าประเมิน" : "Negative MOS: price is above estimated value",
              lang === "th" ? "MOS สูงมาก: ตรวจสมมติฐานและความเสี่ยงธุรกิจซ้ำ" : "Very high MOS: re-check assumptions and business risk",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border border-line bg-surface/25 p-5">
          <h2 className="font-display text-xl font-black text-ink">
            {lang === "th" ? "เครื่องมือที่ควรใช้ต่อ" : "Related tools"}
          </h2>
          <div className="mt-4 space-y-2">
            {[
              { href: "/dcf-calculator", label: lang === "th" ? "DCF Calculator สำหรับประเมินกระแสเงินสด" : "DCF Calculator" },
              { href: "/stock-valuation", label: lang === "th" ? "คู่มือวิธีประเมินมูลค่าหุ้น" : "Stock valuation guide" },
              { href: "/undervalued-stocks", label: lang === "th" ? "หุ้น undervalue จากระบบคัดกรอง" : "Undervalued stocks screener" },
              { href: "/stocks", label: lang === "th" ? "โปรแกรมคัดกรองหุ้นพื้นฐานดี" : "Stock screener" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl border border-line bg-bg px-3 py-2.5 text-xs font-bold text-muted transition hover:border-brand/40 hover:text-brand"
              >
                {item.label}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-4 border-t border-line/60 pt-8">
        <div className="text-center">
          <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold">
            <Info className="h-3.5 w-3.5" /> FAQ
          </span>
          <h2 className="mt-3 font-display text-2xl font-black text-ink">
            {lang === "th" ? "คำถามที่พบบ่อยเกี่ยวกับ Intrinsic Value" : "Intrinsic Value FAQ"}
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

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/translations";
import { num } from "@/lib/format";
import { Sparkles, Calculator, Info, Shield, Target, CheckCircle, ChevronRight } from "@/lib/icons";

export default function DcfCalculatorPage() {
  const { lang } = useTranslation();

  // Calculator inputs
  const [fcf, setFcf] = useState<string>("500.0"); // Free Cash Flow in Millions
  const [growth1_5, setGrowth1_5] = useState<string>("10.0"); // FCF Growth Rate Years 1-5 (%)
  const [growth6_10, setGrowth6_10] = useState<string>("6.0"); // FCF Growth Rate Years 6-10 (%)
  const [wacc, setWacc] = useState<string>("8.5"); // Weighted Average Cost of Capital (%)
  const [terminalGrowth, setTerminalGrowth] = useState<string>("2.5"); // Perpetual Growth Rate (%)
  const [netDebt, setNetDebt] = useState<string>("200.0"); // Net Debt (Total Debt - Cash) in Millions
  const [shares, setShares] = useState<string>("100.0"); // Shares Outstanding in Millions
  const [price, setPrice] = useState<string>("55.0"); // Current Market Price

  // Computed metrics
  const [intrinsicValue, setIntrinsicValue] = useState<number>(0);
  const [mos, setMos] = useState<number>(0);
  const [fcfTimeline, setFcfTimeline] = useState<Array<{ year: number; val: number; pv: number }>>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const f = parseFloat(fcf) || 0;
    const g1 = (parseFloat(growth1_5) || 0) / 100;
    const g2 = (parseFloat(growth6_10) || 0) / 100;
    const w = (parseFloat(wacc) || 8.5) / 100;
    const tg = (parseFloat(terminalGrowth) || 2.5) / 100;
    const nd = parseFloat(netDebt) || 0;
    const sh = parseFloat(shares) || 100;
    const p = parseFloat(price) || 0;

    if (f <= 0 || w <= tg || sh <= 0) {
      setIntrinsicValue(0);
      setFcfTimeline([]);
      return;
    }

    // 1. Project FCF and Discount them
    const timeline = [];
    let currentFCF = f;
    let sumPV = 0;

    for (let yr = 1; yr <= 10; yr++) {
      const activeGrowth = yr <= 5 ? g1 : g2;
      currentFCF = currentFCF * (1 + activeGrowth);
      const discountFactor = Math.pow(1 + w, yr);
      const pv = currentFCF / discountFactor;
      sumPV += pv;

      timeline.push({
        year: yr,
        val: currentFCF,
        pv: pv,
      });
    }

    // 2. Terminal Value at Year 10
    const terminalValue = (currentFCF * (1 + tg)) / (w - tg);
    const terminalValuePV = terminalValue / Math.pow(1 + w, 10);
    const totalPV = sumPV + terminalValuePV;

    // 3. Equity Value (Enterprise Value - Net Debt)
    const equityValue = totalPV - nd;
    const valuePerShare = equityValue / sh;

    setIntrinsicValue(valuePerShare);
    setFcfTimeline(timeline);

    // 4. Margin of Safety
    if (p > 0 && valuePerShare > 0) {
      setMos(((valuePerShare - p) / valuePerShare) * 100);
    } else {
      setMos(0);
    }
  }, [fcf, growth1_5, growth6_10, wacc, terminalGrowth, netDebt, shares, price]);

  const titleTH = "DCF Calculator: เครื่องคำนวณมูลค่าหุ้นด้วยกระแสเงินสดคิดลด";
  const titleEN = "Discounted Cash Flow (DCF) Calculator: Real-Time Intrinsic Cash Flow Modeling";
  const descTH = "คำนวณมูลค่าหุ้นด้วย Discounted Cash Flow ใช้ Free Cash Flow, Growth Rate, WACC, Terminal Value และ Margin of Safety เพื่อดูราคาเหมาะสมต่อหุ้น";
  const descEN = "Estimate dynamic intrinsic equity values using our interactive multi-stage Discounted Cash Flow models. Reserve safety buffers instantly.";

  const howToSteps = [
    {
      title: lang === "th" ? "เริ่มจาก Free Cash Flow ที่เชื่อถือได้" : "Start with reliable free cash flow",
      desc: lang === "th"
        ? "ใช้ FCF ล่าสุดหรือค่าเฉลี่ยย้อนหลัง 3-5 ปี หากธุรกิจเป็นวัฏจักร เพื่อไม่ให้มูลค่าประเมินเหวี่ยงตามกำไรปีเดียว"
        : "Use latest FCF or a 3-5 year average for cyclical companies to avoid one-year distortions.",
    },
    {
      title: lang === "th" ? "แยกอัตราเติบโตระยะสั้นและระยะกลาง" : "Separate near-term and mid-term growth",
      desc: lang === "th"
        ? "ปี 1-5 มักสะท้อนช่วงเติบโตหลัก ส่วนปี 6-10 ควรลดสมมติฐานลงให้ใกล้การเติบโตระยะยาวมากขึ้น"
        : "Years 1-5 often reflect stronger growth, while years 6-10 should usually fade toward mature growth.",
    },
    {
      title: lang === "th" ? "ตั้ง WACC ให้เหมาะกับความเสี่ยงธุรกิจ" : "Set WACC based on business risk",
      desc: lang === "th"
        ? "ธุรกิจมั่นคงอาจใช้อัตราคิดลดต่ำกว่า ส่วนธุรกิจผันผวน หนี้สูง หรือคาดการณ์ยากควรใช้ WACC สูงขึ้น"
        : "Stable companies may justify lower discount rates; volatile or leveraged companies need higher WACC.",
    },
    {
      title: lang === "th" ? "ระวัง Terminal Growth ไม่ให้สูงเกินจริง" : "Keep terminal growth realistic",
      desc: lang === "th"
        ? "Terminal Growth ควรต่ำกว่า WACC และมักไม่ควรสูงกว่าอัตราเติบโตเศรษฐกิจระยะยาวของประเทศ"
        : "Terminal growth must stay below WACC and should usually not exceed long-term GDP growth.",
    },
  ];

  const formulaCards = [
    {
      title: lang === "th" ? "มูลค่าปัจจุบันของ FCF" : "Present value of FCF",
      formula: "PV = FCFₙ ÷ (1 + WACC)ⁿ",
      desc: lang === "th"
        ? "นำกระแสเงินสดอิสระในอนาคตแต่ละปีกลับมาเป็นมูลค่าปัจจุบัน เพราะเงินในอนาคตมีค่าน้อยกว่าเงินวันนี้"
        : "Future free cash flows are discounted back because future money is worth less than money today.",
    },
    {
      title: "Terminal Value",
      formula: "TV = FCF₁₀ × (1 + g) ÷ (WACC - g)",
      desc: lang === "th"
        ? "มูลค่าหลังปีที่ 10 มักเป็นส่วนใหญ่ของ DCF จึงต้องตั้ง g อย่างระมัดระวังมากเป็นพิเศษ"
        : "Terminal value often drives most DCF value, so the perpetual growth assumption must be conservative.",
    },
    {
      title: lang === "th" ? "มูลค่าต่อหุ้น" : "Value per share",
      formula: "(PV of FCF + PV of TV - Net Debt) ÷ Shares",
      desc: lang === "th"
        ? "หลังรวมมูลค่ากิจการแล้วต้องหักหนี้สินสุทธิ และหารด้วยจำนวนหุ้น เพื่อได้ราคาเหมาะสมต่อหุ้น"
        : "After estimating enterprise value, subtract net debt and divide by shares outstanding.",
    },
  ];

  const faqItems = [
    {
      q: lang === "th" ? "DCF คืออะไร?" : "What is DCF?",
      a: lang === "th"
        ? "DCF หรือ Discounted Cash Flow คือวิธีประเมินมูลค่ากิจการจากกระแสเงินสดอิสระในอนาคต แล้วคิดลดกลับมาเป็นมูลค่าปัจจุบันด้วย WACC หรืออัตราผลตอบแทนที่นักลงทุนต้องการ"
        : "DCF estimates a company's value from future free cash flows discounted back to today using WACC or a required return.",
    },
    {
      q: lang === "th" ? "Free Cash Flow คืออะไร?" : "What is free cash flow?",
      a: lang === "th"
        ? "Free Cash Flow คือเงินสดที่ธุรกิจเหลือหลังจ่ายค่าใช้จ่าย ดอกเบี้ย ภาษี และลงทุนรักษาการดำเนินงานแล้ว เป็นเงินสดที่ใช้จ่ายหนี้ ปันผล ซื้อหุ้นคืน หรือลงทุนต่อได้"
        : "Free cash flow is cash remaining after operating expenses, taxes, and maintenance investment. It can be used for debt repayment, dividends, buybacks, or reinvestment.",
    },
    {
      q: lang === "th" ? "WACC ควรใส่เท่าไร?" : "What WACC should I use?",
      a: lang === "th"
        ? "ไม่มีเลขเดียวที่ถูกเสมอ หุ้นใหญ่กำไรมั่นคงอาจอยู่แถว 7-9% ส่วนหุ้นเติบโตสูง วัฏจักร หนี้เยอะ หรือคาดการณ์ยากควรใช้สูงกว่า เช่น 10-14% เพื่อสะท้อนความเสี่ยง"
        : "There is no universal number. Stable large caps may use 7-9%, while high-growth, cyclical, leveraged, or uncertain companies may require 10-14% or more.",
    },
    {
      q: lang === "th" ? "ทำไม Terminal Value มีผลต่อราคาเหมาะสมมาก?" : "Why does terminal value matter so much?",
      a: lang === "th"
        ? "เพราะ DCF ประเมินธุรกิจที่ดำเนินต่อเนื่องหลังช่วงประมาณการ 10 ปี มูลค่าหลังปีสุดท้ายจึงมักเป็นสัดส่วนใหญ่ หากตั้ง Terminal Growth สูงเกินไป ราคาเหมาะสมจะสูงเกินจริงทันที"
        : "DCF values a business beyond the explicit forecast period, so terminal value often represents a large share of total value. Overstating terminal growth can inflate fair value quickly.",
    },
    {
      q: lang === "th" ? "DCF เหมาะกับหุ้นแบบไหน?" : "Which stocks are best for DCF?",
      a: lang === "th"
        ? "DCF เหมาะกับธุรกิจที่คาดการณ์กระแสเงินสดได้พอสมควร เช่น กำไรสม่ำเสมอ มี FCF เป็นบวก และมีโมเดลธุรกิจชัดเจน หุ้นขาดทุนหรือกำไรผันผวนมากควรใช้สมมติฐานอนุรักษ์นิยม"
        : "DCF is best for companies with reasonably predictable cash flows, positive FCF, and clear business models. Loss-making or highly cyclical companies need conservative assumptions.",
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
    <div className="mx-auto max-w-5xl space-y-6 py-6 animate-fade-up px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                "@id": "https://valustock.com/dcf-calculator#calculator",
                "name": "ValuStock DCF Calculator",
                "applicationCategory": "FinanceApplication",
                "operatingSystem": "All",
                "url": "https://valustock.com/dcf-calculator",
                "description": "เครื่องคำนวณมูลค่าหุ้นด้วย Discounted Cash Flow, Free Cash Flow, WACC, Terminal Value และ Margin of Safety",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "THB"
                }
              },
              {
                "@type": "FAQPage",
                "@id": "https://valustock.com/dcf-calculator#faq",
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
            "DCF Calculator",
            "Free Cash Flow",
            "WACC",
            "Terminal Value",
            "Margin of Safety",
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
            <Calculator className="h-4.5 w-4.5 text-brand" /> {lang === "th" ? "ปรับแต่ง DCF Model" : "DCF Model Assumptions"}
          </h3>

          {/* FCF INPUT */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted font-bold block uppercase">{lang === "th" ? "กระแสเงินสดอิสระเริ่มต้น (ล้าน)" : "Initial Free Cash Flow (M)"}</label>
            <input
              type="number"
              value={fcf}
              onChange={(e) => setFcf(e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-mono text-xs text-ink font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          {/* GROWTH YEARS 1-5 */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted font-bold block uppercase">{lang === "th" ? "เติบโต ปี 1-5 (%)" : "FCF Growth Y1-5 (%)"}</label>
            <input
              type="number"
              value={growth1_5}
              onChange={(e) => setGrowth1_5(e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-mono text-xs text-ink font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          {/* GROWTH YEARS 6-10 */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted font-bold block uppercase">{lang === "th" ? "เติบโต ปี 6-10 (%)" : "FCF Growth Y6-10 (%)"}</label>
            <input
              type="number"
              value={growth6_10}
              onChange={(e) => setGrowth6_10(e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-mono text-xs text-ink font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          {/* DISCOUNT RATE / WACC */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted font-bold block uppercase">{lang === "th" ? "อัตราคิดลด / WACC (%)" : "Discount Rate / WACC (%)"}</label>
            <input
              type="number"
              value={wacc}
              onChange={(e) => setWacc(e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-mono text-xs text-ink font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          {/* TERMINAL GROWTH */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted font-bold block uppercase">{lang === "th" ? "เติบโตถาวร (Perpetual %)" : "Perpetual Growth (%)"}</label>
            <input
              type="number"
              value={terminalGrowth}
              onChange={(e) => setTerminalGrowth(e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-mono text-xs text-ink font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          {/* NET DEBT */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted font-bold block uppercase">{lang === "th" ? "หนี้สินสุทธิ (หนี้ - เงินสด)" : "Net Debt (Debt - Cash) (M)"}</label>
            <input
              type="number"
              value={netDebt}
              onChange={(e) => setNetDebt(e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-mono text-xs text-ink font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          {/* SHARES OUTSTANDING */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted font-bold block uppercase">{lang === "th" ? "จำนวนหุ้นทั้งหมด (ล้านหุ้น)" : "Shares Outstanding (M)"}</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-mono text-xs text-ink font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          {/* CURRENT PRICE */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted font-bold block uppercase">{lang === "th" ? "ราคาปัจจุบันเพื่อเทียบ MOS" : "Market Price for MOS"}</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-mono text-xs text-ink font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>
        </Card>

        {/* RESULTS COLUMN */}
        <div className="md:col-span-2 space-y-6">
          {/* DCF SUMMARY CARD */}
          <Card className="border border-line p-6 bg-surface/20 space-y-4 relative overflow-hidden">
            <span className="chip border-brand/30 bg-brand/10 text-brand text-[10px] font-bold mb-1.5 inline-block uppercase">
              DCF Intrinsic Value Summary
            </span>
            <h3 className="font-display font-black text-xl text-ink leading-tight">
              {lang === "th" ? "มูลค่าเหมาะสมของหน่วยหุ้น (Fair Value Per Share)" : "Fair Value Per Share Result"}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div className="bg-bg/60 p-4 border border-line rounded-xl text-center">
                <span className="text-[10px] text-muted font-bold block uppercase">{lang === "th" ? "มูลค่าเหมาะสม DCF ต่อหุ้น" : "DCF Intrinsic Target"}</span>
                <span className="font-display font-black text-3xl text-gold mt-1.5 block font-mono">
                  {intrinsicValue > 0 ? num(intrinsicValue, 2) : "—"}
                </span>
              </div>
              <div className="bg-bg/60 p-4 border border-line rounded-xl text-center flex flex-col justify-center">
                <span className="text-[10px] text-muted font-bold block uppercase">{lang === "th" ? "ส่วนต่างความปลอดภัย (MOS)" : "Margin of Safety"}</span>
                <span className={`font-display font-black text-2xl mt-1.5 block font-mono ${mos >= 0 ? "text-up" : "text-down"}`}>
                  {price && intrinsicValue > 0 ? (mos > 0 ? "+" : "") + num(mos, 0) + "%" : "—"}
                </span>
              </div>
            </div>
          </Card>

          {/* PROJECTED FCF TIMELINE TABLE */}
          {fcfTimeline.length > 0 && (
            <Card className="border border-line overflow-hidden animate-fade-up">
              <div className="p-4 border-b border-line">
                <h3 className="font-display font-black text-sm text-ink">{lang === "th" ? "ตารางประมาณการเงินสดในพอร์ต 10 ปี" : "10-Year Projected Cash Flow Ledger"}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-elevate/60 text-muted font-bold">
                      <th className="px-5 py-3">{lang === "th" ? "ปีที่" : "Year"}</th>
                      <th className="px-5 py-3 text-right">{lang === "th" ? "คาดการณ์กระแสเงินสด FCF" : "Projected FCF"}</th>
                      <th className="px-5 py-3 text-right">{lang === "th" ? "คิดลดกลับมูลค่าปัจจุบัน (PV)" : "Present Value (PV)"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60 font-mono font-semibold text-ink">
                    {fcfTimeline.map((item) => (
                      <tr key={item.year} className="hover:bg-elevate/30 transition">
                        <td className="px-5 py-2.5 text-muted">Year {item.year}</td>
                        <td className="px-5 py-2.5 text-right">{num(item.val, 1)}M</td>
                        <td className="px-5 py-2.5 text-right text-brand">{num(item.pv, 1)}M</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* EEAT DISCLAIMER */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-xs flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 font-semibold text-muted">
          <span className="text-ink font-bold block">{lang === "th" ? "ระเบียบวิธีคํานวณและการจัดการ WACC" : "WACC & Discount Rate Fiduciary Rules"}</span>
          <p className="leading-relaxed text-[11px]">
            {lang === "th" ? "WACC หรือต้นทุนเฉลี่ยของเงินทุน ถือเป็นอัตราผลตอบแทนขั้นต่ำที่ผู้จัดสรรความเสี่ยงของเงินทุนคาดหวัง อัตราคิดลดที่เพิ่มขึ้นจะทำให้กระแสเงินสดในอนาคตมีค่าคิดลดกลับมาน้อยลง (มูลค่าเหมาะสมหดตัว) ในขณะเดียวกัน อัตราการเติบโตถาวร (Perpetual Growth) ไม่ควรมากกว่าผลการขยายตัวผลิตภัณฑ์มวลรวมเฉลี่ยในระยะยาว (GDP Growth) ของประเทศนั้น ๆ ซึ่งระบบแนะนําให้อยู่ในช่วง 2.0% - 3.0% เสมอ" : "The Weighted Average Cost of Capital (WACC) represents the required rate of return for equity holders and debt providers. A higher WACC results in deeper discounts to future cash flows, lowering computed fair values. We highly recommend keeping perpetual growth rates under long-term GDP growth averages, typically within 2.0% - 3.0% per annum."}
          </p>
        </div>
      </div>

      {/* SEO CONTENT */}
      <section className="space-y-5 border-t border-line/60 pt-8">
        <div className="text-center">
          <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold">
            <Target className="h-3.5 w-3.5" /> {lang === "th" ? "คู่มือ DCF สำหรับนักลงทุน" : "DCF investor guide"}
          </span>
          <h2 className="mt-3 font-display text-2xl font-black leading-tight text-ink">
            {lang === "th" ? "DCF Calculator ใช้ประเมินราคาเหมาะสมของหุ้นอย่างไร" : "How to use a DCF Calculator"}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm font-medium leading-relaxed text-muted">
            {lang === "th"
              ? "DCF เป็นวิธีประเมินมูลค่าหุ้นจากเงินสดที่ธุรกิจน่าจะสร้างได้ในอนาคต เหมาะกับนักลงทุนระยะยาวที่ต้องการเข้าใจว่าราคาหุ้นปัจจุบันถูกหรือแพงเมื่อเทียบกับกระแสเงินสดจริง"
              : "DCF values a stock from the cash a business may generate in the future, helping long-term investors compare today's market price with fundamental value."}
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
            {lang === "th" ? "สูตร DCF ที่ใช้คำนวณมูลค่าหุ้น" : "DCF formulas used on this page"}
          </h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
            {lang === "th"
              ? "หัวใจของ DCF คือการประมาณการ Free Cash Flow ในอนาคต คิดลดกลับด้วย WACC รวม Terminal Value หักหนี้สินสุทธิ แล้วหารด้วยจำนวนหุ้นเพื่อหา Fair Value ต่อหุ้น"
              : "DCF projects future free cash flow, discounts it by WACC, adds terminal value, subtracts net debt, and divides by shares to estimate fair value per share."}
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
            <Shield className="h-3.5 w-3.5" /> {lang === "th" ? "การอ่านผล DCF" : "Reading DCF output"}
          </span>
          <h2 className="mt-3 font-display text-xl font-black text-ink">
            {lang === "th" ? "อย่าใช้ DCF แบบดูตัวเลขเดียว" : "Do not rely on a single DCF number"}
          </h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
            {lang === "th"
              ? "DCF อ่อนไหวต่อ Growth Rate, WACC และ Terminal Growth มาก นักลงทุนควรลองหลาย scenario เช่น conservative, base case และ optimistic เพื่อดูช่วงมูลค่าที่เป็นไปได้ ไม่ควรยึดราคาเหมาะสมตัวเดียวเป็นคำตอบสุดท้าย"
              : "DCF is highly sensitive to growth, WACC, and terminal growth assumptions. Investors should compare conservative, base, and optimistic scenarios instead of relying on one precise number."}
          </p>
          <div className="mt-4 grid gap-2 text-xs font-bold text-muted">
            {[
              lang === "th" ? "เพิ่ม WACC: มูลค่าเหมาะสมมักลดลง" : "Higher WACC usually lowers fair value",
              lang === "th" ? "เพิ่ม Terminal Growth: มูลค่าเหมาะสมเพิ่มขึ้นเร็ว" : "Higher terminal growth can raise value quickly",
              lang === "th" ? "FCF ผันผวน: ควรใช้ค่าเฉลี่ยและ MOS สูงขึ้น" : "Volatile FCF needs averages and a wider MOS",
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
              { href: "/intrinsic-value-calculator", label: lang === "th" ? "Intrinsic Value Calculator และ Graham Number" : "Intrinsic Value Calculator" },
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
            {lang === "th" ? "คำถามที่พบบ่อยเกี่ยวกับ DCF Calculator" : "DCF Calculator FAQ"}
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

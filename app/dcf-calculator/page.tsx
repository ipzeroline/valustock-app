"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/translations";
import { num } from "@/lib/format";
import { Sparkles, Calculator, Info, Shield, Target } from "@/lib/icons";

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

  const titleTH = "Discounted Cash Flow (DCF) Calculator: เครื่องคำนวณราคาเหมาะสมจากกระแสเงินสด";
  const titleEN = "Discounted Cash Flow (DCF) Calculator: Real-Time Intrinsic Cash Flow Modeling";
  const descTH = "คำนวณหามูลค่าที่แท้จริงตามทฤษฎีการเงินสูงสุด (DCF Model) ปรับค่ากระแสเงินสดอิสระ อัตราคิดลด (WACC) และอัตราเติบโตทบต้น";
  const descEN = "Estimate dynamic intrinsic equity values using our interactive multi-stage Discounted Cash Flow models. Reserve safety buffers instantly.";

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
    </div>
  );
}

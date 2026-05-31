"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/translations";
import { num } from "@/lib/format";
import { Sparkles, Calculator, Info, Shield, Target } from "@/lib/icons";

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

  const titleTH = "Graham Intrinsic Value Calculator: เครื่องคำนวณหามูลค่าหุ้นของเกรแฮม";
  const titleEN = "Graham Intrinsic Value Calculator: Real-Time Intrinsic Price Modeling";
  const descTH = "คำนวณราคาหุ้นที่แท้จริงตามแนวคิดของ Benjamin Graham บิดาแห่งการลงทุนแบบเน้นคุณค่า ปรับค่า EPS, Growth Rate และ Book Value เพื่อหาจุดคุ้มทุน";
  const descEN = "Evaluate core defensive pricing parameters using our interactive Benjamin Graham Growth formulas. Reside capital safety targets instantly.";

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
    </div>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/translations";
import { Sparkles, Target, Layers, Calculator, Info } from "@/lib/icons";

export default function StockValuationPage() {
  const { lang } = useTranslation();

  const titleTH = "Stock Valuation: คู่มือวิธีการประเมินมูลค่าหุ้นของนักลงทุนมือโปร";
  const titleEN = "Stock Valuation: Comprehensive Intrinsic Valuation Guide";
  const descTH = "เรียนรู้วิธีการประเมินมูลค่าหุ้นด้วยแบบจำลองทางการเงินกระแสเงินสดคิดลด (DCF) ตัวเลขเกรแฮม และการวิเคราะห์ P/E เพื่อหาจุดซื้อที่เหมาะสม";
  const descEN = "A comprehensive topic cluster gateway detailing core valuation methodologies, Discounted Cash Flow models, Graham multipliers, and defensive multiples.";

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
    <div className="mx-auto max-w-4xl space-y-8 py-6 animate-fade-up px-4 sm:px-6">
      {/* HEADER */}
      <div className="surface rounded-2xl p-6 border border-line bg-surface/40 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-36 h-36 bg-brand/10 rounded-full blur-2xl pointer-events-none" />
        <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold mb-2 inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Core Keyword Topic Gateway
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-ink leading-tight">
          {lang === "th" ? titleTH : titleEN}
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 font-semibold leading-relaxed">
          {lang === "th" ? descTH : descEN}
        </p>
      </div>

      {/* CORE VALUATION METHODOLOGIES */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
          <Calculator className="h-5 w-5 text-brand" />
          {lang === "th" ? "แบบจำลองการประเมินมูลค่าหลักในระบบ" : "Core Valuation Methodologies"}
        </h2>

        <div className="space-y-4 text-xs sm:text-sm">
          {/* DCF METHOD */}
          <Card className="border border-line p-5 bg-surface/20 space-y-2">
            <h3 className="font-display font-bold text-ink text-sm sm:text-base flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded bg-brand/20 text-brand font-bold text-xs">01</span>
              {lang === "th" ? "แบบจำลองกระแสเงินสดคิดลด (Discounted Cash Flow - DCF)" : "Discounted Cash Flow Model (DCF)"}
            </h3>
            <p className="text-muted leading-relaxed font-semibold">
              {lang === "th"
                ? "ประเมินมูลค่าหุ้นจากเงินสดอิสระที่บริษัทคาดว่าจะได้รับในอนาคตคิดกลับมาเป็นมูลค่าในเวลาปัจจุบัน โดยถือเป็นแนวคิดที่มีความถูกต้องตามทฤษฎีการเงินสูงสุด เพราะมองบริษัทเสมือนเครื่องจักรผลิตเงินสด"
                : "Projects a firm's future free cash flows and discounts them back to the present value using the Cost of Capital. The most mathematically sound approach to intrinsic values."}
            </p>
            <Link href="/dcf-calculator">
              <span className="text-xs text-brand font-bold hover:underline inline-flex items-center gap-0.5 mt-2 cursor-pointer">
                {lang === "th" ? "เปิดเครื่องประเมิน DCF" : "Launch DCF Calculator"} →
              </span>
            </Link>
          </Card>

          {/* GRAHAM MULTIPLE */}
          <Card className="border border-line p-5 bg-surface/20 space-y-2">
            <h3 className="font-display font-bold text-ink text-sm sm:text-base flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded bg-brand/20 text-brand font-bold text-xs">02</span>
              {lang === "th" ? "สูตรเบนจามิน เกรแฮม (Graham Intrinsic Valuation)" : "Benjamin Graham Intrinsic Value"}
            </h3>
            <p className="text-muted leading-relaxed font-semibold">
              {lang === "th"
                ? "ตัวเลขทางประวัติศาสตร์ของ Benjamin Graham ที่มองว่ามูลค่าที่สมเหตุสมผลสูงสุดควรค้ำด้วยราคาสมุดบัญชี (Book Value) และอัตรา P/E ไม่เกิน 15 เท่า เหมาะสำหรับคัดกรองหุ้นสถาบันการเงินและหุ้นกลุ่มพัฒนาอสังหาริมทรัพย์"
                : "Defensive relative asset value measuring where P/E doesn't exceed 15x and P/B doesn't exceed 1.5x. Gold standard screening for classic industrials and defensive banks."}
            </p>
            <Link href="/intrinsic-value-calculator">
              <span className="text-xs text-brand font-bold hover:underline inline-flex items-center gap-0.5 mt-2 cursor-pointer">
                {lang === "th" ? "เปิดเครื่องคำนวณ Intrinsic Value" : "Launch Intrinsic Value Calculator"} →
              </span>
            </Link>
          </Card>

          {/* PE PBV */}
          <Card className="border border-line p-5 bg-surface/20 space-y-2">
            <h3 className="font-display font-bold text-ink text-sm sm:text-base flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded bg-brand/20 text-brand font-bold text-xs">03</span>
              {lang === "th" ? "การวิเคราะห์อัตราส่วนทบเท่า (Relative Multiples Analysis)" : "Relative Multiples Valuation"}
            </h3>
            <p className="text-muted leading-relaxed font-semibold">
              {lang === "th"
                ? "เปรียบเทียบ P/E, P/BV และ Dividend Yield เทียบกับค่าเฉลี่ยในกลุ่มอุตสาหกรรม (Sector) เพื่อสแกนหาหลักทรัพย์ที่เป็นผู้นำราคาถูกและมีส่วนลดพรีเมียมต่ำสุดในตาราง"
                : "Side-by-side comparative scans of P/E, P/BV, and Dividend Yield averages relative to industry parameters to map absolute discount advantages."}
            </p>
          </Card>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <div className="flex justify-center gap-4">
        <Link href="/undervalued-stocks">
          <Button size="sm">
            {lang === "th" ? "สแกนหุ้นราคาถูกกว่ามูลค่า" : "Screen Undervalued Stocks"}
          </Button>
        </Link>
        <Link href="/value-investing">
          <Button variant="ghost" size="sm">
            {lang === "th" ? "ศึกษาคู่มือลงทุน VI" : "VI Masterclass"}
          </Button>
        </Link>
      </div>
    </div>
  );
}

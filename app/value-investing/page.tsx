"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/translations";
import { Sparkles, Target, Shield, Info, Layers, Calculator } from "@/lib/icons";

export default function ValueInvestingPage() {
  const { lang } = useTranslation();

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

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6 animate-fade-up px-4 sm:px-6">
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
        </div>
      </Card>
    </div>
  );
}

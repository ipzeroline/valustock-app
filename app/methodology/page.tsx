"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/translations";
import { Sparkles, Target, Shield, Info, Calculator, Layers } from "@/lib/icons";

export default function MethodologyPage() {
  const { lang } = useTranslation();

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6 animate-fade-up px-4 sm:px-6">
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
            ? "เจาะลึกทฤษฎีการเงินและสูตรคณิตศาสตร์ที่ใช้ประเมินมูลค่าหุ้นที่แท้จริง พร้อมที่มาของชุดข้อมูลทางการเงินในระบบ ValuStock"
            : "Explore the financial theories, mathematical models, and datasets underpinning ValuStock's dynamic intrinsic value assessments."}
        </p>
      </div>

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

      {/* 🛡️ 2. DATA SOURCES & TRANSPARENCY */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand" />
          {lang === "th" ? "2. แหล่งที่มาของข้อมูล (Credible Data Sources)" : "2. Our Financial Data Sources"}
        </h2>

        <Card className="border border-line p-6 bg-surface/35 space-y-4">
          <p className="text-xs sm:text-sm text-muted leading-relaxed font-semibold">
            {lang === "th"
              ? "เพื่อรักษามาตรฐานความน่าเชื่อถือสูงสด ระบบ ValuStock เชื่อมต่อและรวบรวมข้อมูลทางการเงินจากแหล่งข้อมูลชั้นนำของโลกแบบเรียลไทม์และรายวัน ดังนี้:"
              : "To maintain absolute data integrity and regulatory transparency, ValuStock aggregates and syncs financial statistics and market prices from industry-grade global provider feeds:"}
          </p>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="p-3 bg-bg/50 border border-line rounded-xl space-y-1">
              <span className="font-bold text-ink block">🇺🇸 US SEC Filings</span>
              <span className="text-[10px] text-muted font-semibold block">
                {lang === "th" ? "ดึงข้อมูลจากแบบแสดงงบการเงิน 10-K, 10-Q รายไตรมาสและประจำปีโดยตรง" : "SEC EDGAR API feeds compiling direct 10-K and 10-Q statements."}
              </span>
            </div>
            <div className="p-3 bg-bg/50 border border-line rounded-xl space-y-1">
              <span className="font-bold text-ink block">🇹🇭 SET Exchange Feeds</span>
              <span className="text-[10px] text-muted font-semibold block">
                {lang === "th" ? "งบการเงินประจำงวด บัญชีแสดงผลดำเนินงาน ตลาดหลักทรัพย์แห่งประเทศไทย" : "SET exchange balance sheets, income statements, and cash flows."}
              </span>
            </div>
            <div className="p-3 bg-bg/50 border border-line rounded-xl space-y-1">
              <span className="font-bold text-ink block">📈 Live Market APIs</span>
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

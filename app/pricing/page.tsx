"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/plans";
import { PlanCard, PLAN_TRANS } from "@/components/PlanCard";
import { useStore } from "@/lib/store";
import { Card, CardHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PlanId } from "@/lib/types";
import { getPlan } from "@/lib/plans";
import { num } from "@/lib/format";
import { useTranslation } from "@/lib/translations";
import { Check, CircleDollarSign, Crown, X, Layers, Info } from "@/lib/icons";

export default function PricingPage() {
  const { user, setPlan } = useStore();
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [checkout, setCheckout] = useState<PlanId | null>(null);

  const choose = (id: PlanId) => {
    if (id === "free") {
      setPlan("free", billing);
      router.push("/dashboard");
      return;
    }
    setCheckout(id);
  };

  const confirm = () => {
    if (!checkout) return;
    setPlan(checkout, billing);
    setCheckout(null);
    router.push("/dashboard");
  };

  const plan = checkout ? getPlan(checkout) : null;
  const price = plan
    ? billing === "monthly"
      ? plan.priceMonthly
      : plan.priceYearly
    : 0;

  const defaultIncludedFeatures = lang === "th" 
    ? [
        "ข้อมูลหุ้นไทย SET และสหรัฐฯ",
        "กราฟราคาย้อนหลัง",
        "ธีมสว่าง/มืด",
        "ใช้งานบนมือถือและเดสก์ท็อป",
        "อัปเดตข้อมูลสม่ำเสมอ",
        "ยกเลิกได้ทุกเมื่อ",
      ]
    : [
        "SET Thai & US stock databases",
        "Historical price action charts",
        "Light & Dark UI options",
        "Mobile & Desktop responsive layout",
        "Prism continuous data sync",
        "Cancel subscription anytime",
      ];

  const paymentMethods = lang === "th"
    ? ["บัตรเครดิต / เดบิต", "พร้อมเพย์ (PromptPay)", "โอนผ่านธนาคาร"]
    : ["Credit / Debit Card", "PromptPay (TH Local)", "Bank Wire Transfer"];

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 space-y-12">
      {/* SECTION 1: HERO */}
      <div className="text-center animate-fade-up">
        <span className="chip border-gold/30 bg-gold/10 text-gold shadow-glow">
          <Crown className="h-3.5 w-3.5 text-gold" /> {t("common.pricing")}
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight md:text-5xl text-ink">
          {t("pricing.title")}
        </h1>
        <p className="mt-3 text-muted text-sm max-w-xl mx-auto leading-relaxed">
          {lang === "th" 
            ? "เริ่มต้นฟรี ไม่ต้องใช้บัตรเครดิต เลือกสไตล์การลงทุนที่ตรงใจ ปลดล็อคฟีเจอร์ระดับสถาบันการเงินได้ทันที" 
            : "Start free, no credit card required. Upgrade or downgrade your plan anytime to fit your trading habits."}
        </p>

        {/* billing toggle */}
        <div className="mt-7 inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-inner">
          <button
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition ${
              billing === "monthly" ? "bg-brand text-bg shadow-sm font-extrabold" : "text-muted"
            }`}
          >
            {lang === "th" ? "รายเดือน" : "Monthly"}
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition flex items-center gap-1 ${
              billing === "yearly" ? "bg-brand text-bg shadow-sm font-extrabold" : "text-muted"
            }`}
          >
            {lang === "th" ? "รายปี" : "Annually"}
            <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[9px] text-gold font-bold">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 2: PLANS CARD GRID */}
      <div className="grid gap-5 md:grid-cols-3 animate-fade-up [animation-delay:80ms]">
        {PLANS.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            billing={billing}
            current={user?.plan === p.id}
            onSelect={() => choose(p.id)}
          />
        ))}
      </div>

      {/* SECTION 3: 🏆 HIGH-DENSITY MONETIZATION FEATURE MATRIX */}
      <Card className="border border-line/80 overflow-hidden animate-fade-up [animation-delay:120ms] bg-surface/30">
        <CardHeader
          title={lang === "th" ? "ตารางเปรียบเทียบฟังก์ชันการใช้งานแบบละเอียด" : "Detailed Feature Comparison Matrix"}
          subtitle={lang === "th" ? "เจาะลึก 12 ฟังก์ชันการวิเคราะห์ การแจ้งเตือน และการทำธุรกรรม" : "Granular breakdown of all 12 key financial terminal modules"}
          icon={<Layers className="h-4.5 w-4.5 text-brand" />}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-elevate/50 text-muted font-bold tracking-wider">
                <th className="px-5 py-3.5 w-72">{lang === "th" ? "ฟังก์ชันการวิเคราะห์ (Analytical Modules)" : "FEATURE"}</th>
                <th className="px-5 py-3.5 text-center w-40">FREE</th>
                <th className="px-5 py-3.5 text-center w-40 text-brand">PRO</th>
                <th className="px-5 py-3.5 text-center w-40 text-gold">PREMIUM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 bg-surface/30">
              {/* Category Header 1 */}
              <tr className="bg-elevate/25">
                <td colSpan={4} className="px-5 py-2 font-display font-extrabold text-[10px] uppercase text-muted tracking-wider">
                  📈 {lang === "th" ? "ความแข็งแกร่งทางการเงิน & การประเมินมูลค่า" : "Core Valuation & Financial Analysis"}
                </td>
              </tr>
              <MatrixRow
                label={lang === "th" ? "1. รายงานหุ้นวิเคราะห์ลึก" : "1. Stock Reports"}
                free={lang === "th" ? "จำกัด 5 หุ้นแรกในระบบ" : "Limited (5 Assets)"}
                pro={lang === "th" ? "เต็มรูปแบบ (ทุกหุ้น)" : "Full Access (All Assets)"}
                premium={lang === "th" ? "เต็มรูปแบบ (ทุกหุ้น)" : "Full Access (All Assets)"}
              />
              <MatrixRow
                label={lang === "th" ? "2. ผลตอบแทนผู้ถือหุ้น (ROE/Yield)" : "2. Shareholder Return"}
                free={lang === "th" ? "อัตราส่วนพื้นฐาน" : "Basic ratios"}
                pro={lang === "th" ? "วิเคราะห์ลึกเปรียบเทียบ" : "Comparative dashboards"}
                premium={lang === "th" ? "วิเคราะห์ลึกเปรียบเทียบ" : "Comparative dashboards"}
              />
              <MatrixRow
                label={lang === "th" ? "3. อัตราความปลอดภัยปันผล" : "3. Dividend Safety Rating"}
                free={lang === "th" ? "สรุปมือใหม่เบื้องต้น" : "Rookie guidance"}
                pro={lang === "th" ? "ลึกประวัติศาสตร์ 5 ปี" : "5-Yr detailed audit"}
                premium={lang === "th" ? "ลึกประวัติศาสตร์ 5 ปี" : "5-Yr detailed audit"}
              />
              <MatrixRow
                label={lang === "th" ? "4. เครื่องมือคัดกรองหุ้นสไลเดอร์" : "4. Advanced Stock Screener"}
                free="❌"
                pro={lang === "th" ? "ปลดล็อคตัวกรองละเอียด" : "Unlocked Sliders"}
                premium={lang === "th" ? "ปลดล็อคตัวกรองละเอียด" : "Unlocked Sliders"}
              />
              <MatrixRow
                label={lang === "th" ? "5. การทดสอบย้อนหลังโมเดล" : "5. Valuation Backtesting"}
                free="❌"
                freeStyle="muted"
                pro="❌"
                proStyle="muted"
                premium={lang === "th" ? "ทดสอบประวัติย้อนหลังแม่นยำ" : "Valuation Backtest Engine"}
                premiumStyle="gold"
              />

              {/* Category Header 2 */}
              <tr className="bg-elevate/25">
                <td colSpan={4} className="px-5 py-2 font-display font-extrabold text-[10px] uppercase text-muted tracking-wider">
                  🔔 {lang === "th" ? "การแจ้งเตือนราคาและความปลอดภัยพอร์ต" : "Notifications & Dynamic Price Alerts"}
                </td>
              </tr>
              <MatrixRow
                label={lang === "th" ? "6. การแจ้งเตือนราคา & ความจำ" : "6. Price Alerts & Reminders"}
                free="❌"
                pro="❌"
                premium={lang === "th" ? "ส่งเสียงเตือน/อีเมลสด" : "Live Push Alerts"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "7. การแจ้งเตือนราคาถูกของพอร์ต" : "7. Watchlist MOS Alerts"}
                free="❌"
                pro="❌"
                premium={lang === "th" ? "เตือนทันทีเมื่อตกเขต MOS" : "Undervalued triggers"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "8. การแจ้งเตือนสูตรคัดกรองใหม่" : "8. Screener Match Alerts"}
                free="❌"
                pro="❌"
                premium={lang === "th" ? "เตือนเมื่อมีหุ้นตรงเงื่อนไขใหม่" : "Auto-screener matches"}
                premiumStyle="gold"
              />

              {/* Category Header 3 */}
              <tr className="bg-elevate/25">
                <td colSpan={4} className="px-5 py-2 font-display font-extrabold text-[10px] uppercase text-muted tracking-wider">
                  💼 {lang === "th" ? "การจัดการพอร์ตและข่าวกระแสเงินสด" : "Portfolios, Watchlists & Inbound News"}
                </td>
              </tr>
              <MatrixRow
                label={lang === "th" ? "9. บันทึกซื้อขายกำไรลงทุน" : "9. Investment Portfolio Ledger"}
                free="❌"
                pro={lang === "th" ? "บันทึกพอร์ตต้นทุนเฉลี่ย" : "Virtual portfolio tracker"}
                premium={lang === "th" ? "บันทึกพอร์ตต้นทุนเฉลี่ย" : "Virtual portfolio tracker"}
              />
              <MatrixRow
                label={lang === "th" ? "10. ข่าวสารที่ลิ้งก์ตรงอิงหุ้น" : "10. News-Related Equities"}
                free={lang === "th" ? "หัวข้อข่าวย่อทั่วไป" : "Basic News"}
                pro={lang === "th" ? "เจาะลึกข่าววิเคราะห์เชิงดัชนี" : "Audit Sentiment News"}
                premium={lang === "th" ? "เจาะลึกข่าววิเคราะห์เชิงดัชนี" : "Audit Sentiment News"}
              />
              <MatrixRow
                label={lang === "th" ? "11. จำนวน Watchlist" : "11. Watchlists Folder Capacity"}
                free={lang === "th" ? "สร้างได้สูงสุด 1 แผง" : "Max 1 Watchlist"}
                pro={lang === "th" ? "สร้างได้สูงสุด 3 แผง" : "Max 3 Watchlists"}
                premium={lang === "th" ? "สร้างได้ไม่จำกัดจำนวน" : "Unlimited watchlists"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "12. จำนวนหุ้นในแต่ละ Watchlist" : "12. Watchlist Item Limits"}
                free={lang === "th" ? "จำกัด 3 หุ้นต่อโฟลเดอร์" : "Max 3 Tickers"}
                pro={lang === "th" ? "บันทึกได้ไม่จำกัด" : "Unlimited"}
                premium={lang === "th" ? "บันทึกได้ไม่จำกัด" : "Unlimited"}
              />
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 4: DEFAULT FEATURES */}
      <div className="rounded-2xl border border-line bg-surface p-6 animate-fade-up [animation-delay:120ms]">
        <h3 className="font-display text-lg font-semibold text-ink">
          {lang === "th" ? "ทุกแพ็กเกจรวมฟีเจอร์พื้นฐาน" : "Every Plan Includes Core Features"}
        </h3>
        <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-3">
          {defaultIncludedFeatures.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand" /> {f}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted animate-fade-up [animation-delay:160ms]">
        {lang === "th" 
          ? "ราคารวมภาษีมูลค่าเพิ่มแล้ว · รองรับบัตรเครดิต/เดบิต และพร้อมเพย์ (PromptPay) ผ่านผู้ให้บริการในไทย" 
          : "Prices include VAT. Supports credit/debit cards and PromptPay local payments."}
      </p>

      {/* checkout modal (simulated) */}
      <Modal
        open={!!checkout}
        onClose={() => setCheckout(null)}
        title={lang === "th" ? "ยืนยันการสมัครสมาชิก" : "Confirm Subscription"}
      >
        {plan && (
          <div>
            <div className="flex items-center justify-between rounded-xl border border-line bg-elevate px-4 py-3">
              <div>
                <div className="font-display font-semibold text-ink">
                  {lang === "th" ? `แพ็กเกจ ${PLAN_TRANS[lang][plan.id].name}` : `${PLAN_TRANS[lang][plan.id].name} Tier`}
                </div>
                <div className="text-xs text-muted">
                  {billing === "monthly" 
                    ? (lang === "th" ? "ชำระรายเดือน" : "Billed Monthly") 
                    : (lang === "th" ? "ชำระรายปี" : "Billed Annually")}
                </div>
              </div>
              <div className="num font-display text-xl font-bold text-ink">
                {num(price, 0)} {lang === "th" ? "บาท" : "THB"}
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              <div className="text-sm font-medium text-ink">{lang === "th" ? "วิธีชำระเงิน" : "Select Payment Method"}</div>
              {paymentMethods.map((m, i) => (
                <label
                  key={m}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm has-[input:checked]:border-brand text-ink"
                >
                  <input
                    type="radio"
                    name="pay"
                    defaultChecked={i === 0}
                    className="accent-brand"
                  />
                  <CircleDollarSign className="h-4 w-4 text-muted" />
                  {m}
                </label>
              ))}
            </div>

            <Button className="mt-5 w-full text-white bg-brand hover:bg-brand/90" size="lg" onClick={confirm}>
              {lang === "th" ? "ยืนยันและเริ่มใช้งาน" : "Confirm & Subscribe"}
            </Button>
            <p className="mt-3 text-center text-[11px] text-muted">
              {lang === "th" 
                ? "เดโม: ไม่มีการตัดเงินจริง — สามารถเชื่อมต่อ Stripe / Omise / GB Prime Pay ในโปรดักชันได้ทันที" 
                : "Demo Mode: No real funds charged. Seamlessly integrates Stripe / Omise / local gateways."}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ================== MATRIX ROW HELPER COMPONENT ==================
function MatrixRow({
  label,
  free,
  pro,
  premium,
  freeStyle = "normal",
  proStyle = "normal",
  premiumStyle = "normal",
}: {
  label: string;
  free: string;
  pro: string;
  premium: string;
  freeStyle?: "normal" | "muted";
  proStyle?: "normal" | "muted" | "brand";
  premiumStyle?: "normal" | "muted" | "gold";
}) {
  return (
    <tr className="hover:bg-elevate/25 transition">
      <td className="px-5 py-3 font-semibold text-ink/90 border-r border-line/40">{label}</td>
      <td className={`px-5 py-3 text-center font-mono font-bold ${
        free === "❌" ? "text-down text-sm" : freeStyle === "muted" ? "text-muted" : "text-ink"
      }`}>{free}</td>
      <td className={`px-5 py-3 text-center font-mono font-bold ${
        pro === "❌" ? "text-down text-sm" : proStyle === "muted" ? "text-muted" : "text-brand"
      }`}>{pro}</td>
      <td className={`px-5 py-3 text-center font-mono font-bold ${
        premium === "❌" ? "text-down text-sm" : premiumStyle === "muted" ? "text-muted" : "text-gold"
      }`}>{premium}</td>
    </tr>
  );
}

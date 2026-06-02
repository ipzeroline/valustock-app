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
import {
  Check,
  Crown,
  Layers,
  Info,
  Shield,
  Zap,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "@/lib/icons";

export default function PricingPage() {
  const { user, setPlan } = useStore();
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [checkout, setCheckout] = useState<PlanId | null>(null);
  const [checkoutEmail, setCheckoutEmail] = useState(user?.email || "");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const choose = (id: PlanId) => {
    if (id === "free") {
      setPlan("free", billing);
      router.push("/dashboard");
      return;
    }
    setCheckoutEmail(user?.email || checkoutEmail);
    setCheckoutError("");
    setCheckout(id);
  };

  const confirm = async () => {
    if (!checkout) return;
    const normalizedEmail = (user?.email || checkoutEmail).trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setCheckoutError(lang === "th" ? "กรุณากรอกอีเมลที่ถูกต้อง" : "Please enter a valid email address.");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: checkout,
          billing,
          email: normalizedEmail,
          name: user?.name,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout");
      }

      window.location.href = data.url;
    } catch (err: any) {
      setCheckoutError(
        err.message ||
          (lang === "th" ? "เริ่มชำระเงินไม่สำเร็จ กรุณาลองใหม่" : "Unable to start checkout. Please try again.")
      );
      setCheckoutLoading(false);
    }
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
    ? ["ชำระผ่าน Stripe Checkout", "รองรับบัตรเครดิต/เดบิตและ Link", "ใบเสร็จและข้อมูลสมาชิกซิงก์อัตโนมัติ"]
    : ["Secured by Stripe Checkout", "Supports credit/debit cards and Link", "Receipts and membership sync automatically"];

  const planGuides = [
    {
      id: "free" as PlanId,
      icon: Shield,
      title: lang === "th" ? "Free เหมาะกับใคร" : "Who Free Is For",
      badge: lang === "th" ? "เริ่มต้น" : "Starter",
      desc:
        lang === "th"
          ? "เหมาะสำหรับทดลองดูข้อมูลหุ้นพื้นฐาน กราฟย้อนหลัง และทำความเข้าใจมูลค่าหุ้นก่อนอัปเกรด"
          : "Best for trying core stock data, historical charts, and basic valuation concepts before upgrading.",
      points:
        lang === "th"
          ? ["ดูหุ้นตัวอย่าง", "เรียนรู้ P/E, P/B, ปันผล", "เริ่มสร้าง Watchlist เล็ก ๆ"]
          : ["Sample stock access", "Learn P/E, P/B, yield", "Start a small watchlist"],
    },
    {
      id: "pro" as PlanId,
      icon: Zap,
      title: lang === "th" ? "Pro เหมาะกับใคร" : "Who Pro Is For",
      badge: lang === "th" ? "แนะนำ" : "Recommended",
      desc:
        lang === "th"
          ? "เหมาะกับนักลงทุน VI ที่ต้องการคำนวณ DCF, Graham Number, คัดกรองหุ้น undervalue และติดตามหุ้นได้ไม่จำกัด"
          : "Best for value investors who need DCF, Graham Number, undervalued stock screening, and unlimited watchlists.",
      points:
        lang === "th"
          ? ["DCF และมูลค่าเหมาะสม", "สกรีนหุ้นราคาต่ำกว่ามูลค่า", "ดูหุ้นได้ครบทั้งระบบ"]
          : ["DCF and fair value", "Undervalued stock screener", "Full asset access"],
    },
    {
      id: "premium" as PlanId,
      icon: Crown,
      title: lang === "th" ? "Premium เหมาะกับใคร" : "Who Premium Is For",
      badge: lang === "th" ? "ครบสุด" : "Full access",
      desc:
        lang === "th"
          ? "เหมาะกับคนมีพอร์ตจริงจัง ต้องการเปรียบเทียบหุ้นหลายตัว ตั้งแจ้งเตือน MOS และส่งออกข้อมูลไปวิเคราะห์ต่อ"
          : "Best for active portfolios that need comparisons, margin-of-safety alerts, and data exports.",
      points:
        lang === "th"
          ? ["เปรียบเทียบหุ้นหลายตัว", "แจ้งเตือนราคาต่ำกว่ามูลค่า", "ส่งออก CSV"]
          : ["Multi-stock comparison", "Below-value price alerts", "CSV export"],
    },
  ];

  const trustItems = [
    {
      title: lang === "th" ? "เริ่มใช้ฟรี" : "Start free",
      desc: lang === "th" ? "ทดลองใช้ได้ทันที ไม่ต้องใส่บัตรเครดิต" : "Try instantly with no credit card required.",
    },
    {
      title: lang === "th" ? "ยกเลิกได้ทุกเมื่อ" : "Cancel anytime",
      desc: lang === "th" ? "เปลี่ยนแผนหรือยกเลิกได้ตามรอบบิล" : "Change or cancel your plan based on billing cycle.",
    },
    {
      title: lang === "th" ? "จ่ายปลอดภัยผ่าน Stripe" : "Secure Stripe billing",
      desc: lang === "th" ? "ชำระแบบสมาชิกด้วยบัตรเครดิต/เดบิตและ Link ผ่าน Stripe Checkout" : "Recurring card and Link subscriptions are handled by Stripe Checkout.",
    },
    {
      title: lang === "th" ? "ข้อมูลเพื่อการวิเคราะห์" : "Research focused",
      desc: lang === "th" ? "ช่วยตัดสินใจด้วยข้อมูล ไม่ใช่คำแนะนำซื้อขาย" : "Built for research, not buy/sell recommendations.",
    },
  ];

  const faqItems = [
    {
      q: lang === "th" ? "ValuStock Free ใช้ได้ตลอดไหม?" : "Can I use ValuStock Free forever?",
      a:
        lang === "th"
          ? "ใช้ได้ตลอดครับ แพ็กเกจ Free เหมาะสำหรับทดลองข้อมูลพื้นฐาน ดูกราฟย้อนหลัง และเริ่มติดตามหุ้นจำนวนน้อยก่อนตัดสินใจอัปเกรด"
          : "Yes. The Free plan is available for basic research, historical charts, and a small watchlist before upgrading.",
    },
    {
      q: lang === "th" ? "รายปีประหยัดกว่ารายเดือนเท่าไร?" : "How much do I save with annual billing?",
      a:
        lang === "th"
          ? "รายปีลดประมาณ 20% เมื่อเทียบกับการจ่ายรายเดือนครบ 12 เดือน เหมาะสำหรับผู้ใช้ที่ตั้งใจวิเคราะห์หุ้นต่อเนื่องทั้งปี"
          : "Annual billing saves about 20% compared with paying monthly for 12 months.",
    },
    {
      q: lang === "th" ? "ควรเลือก Pro หรือ Premium?" : "Should I choose Pro or Premium?",
      a:
        lang === "th"
          ? "ถ้าเน้นคำนวณ DCF, หามูลค่าเหมาะสม และสกรีนหุ้น Pro เพียงพอสำหรับนักลงทุนส่วนใหญ่ แต่ถ้าต้องการเปรียบเทียบหลายหุ้น ตั้งแจ้งเตือน และส่งออกข้อมูล ควรเลือก Premium"
          : "Pro is enough for DCF, fair value, and screening. Premium is better if you need comparisons, alerts, and exports.",
    },
    {
      q: lang === "th" ? "ข้อมูลในระบบใช้แทนคำแนะนำลงทุนได้ไหม?" : "Is ValuStock investment advice?",
      a:
        lang === "th"
          ? "ไม่ได้ครับ ValuStock เป็นเครื่องมือช่วยวิเคราะห์และเรียนรู้ นักลงทุนควรตรวจงบการเงิน ข่าว ความเสี่ยง และเป้าหมายของตัวเองก่อนตัดสินใจลงทุน"
          : "No. ValuStock is a research and education tool. Investors should review filings, news, risks, and personal objectives.",
    },
    {
      q: lang === "th" ? "รองรับหุ้นไทยและหุ้นสหรัฐไหม?" : "Does ValuStock support Thai and US stocks?",
      a:
        lang === "th"
          ? "รองรับทั้งหุ้นไทย SET และหุ้นสหรัฐในระบบ พร้อมเครื่องมือดูมูลค่าเหมาะสม อัตราส่วนการเงิน Watchlist และพอร์ตจำลอง"
          : "Yes. ValuStock supports Thai SET and US stocks with fair value tools, ratios, watchlists, and portfolio tracking.",
    },
  ];

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "ValuStock",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: "https://valustock.com/pricing",
      description:
        lang === "th"
          ? "แพลตฟอร์มวิเคราะห์หุ้นไทยและหุ้นสหรัฐ พร้อม DCF Calculator, Graham Number, Stock Screener, Watchlist และ Portfolio Tracker"
          : "A Thai and US stock analysis platform with DCF Calculator, Graham Number, Stock Screener, Watchlist, and Portfolio Tracker.",
      offers: PLANS.map((p) => ({
        "@type": "Offer",
        name: PLAN_TRANS[lang][p.id].name,
        price: billing === "monthly" ? p.priceMonthly : p.priceYearly,
        priceCurrency: "THB",
        url: "https://valustock.com/pricing",
        availability: "https://schema.org/InStock",
      })),
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
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
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

      {/* SECTION 3: PLAN FIT GUIDE */}
      <section className="space-y-4 animate-fade-up [animation-delay:100ms]">
        <div className="text-center">
          <h2 className="font-display text-2xl font-extrabold text-ink">
            {lang === "th" ? "เลือกแพ็กเกจไหนดี?" : "Which Plan Should You Choose?"}
          </h2>
          <p className="mt-2 text-sm font-medium text-muted">
            {lang === "th"
              ? "ถ้ายังไม่แน่ใจ ให้เลือกจากสไตล์การใช้งานของคุณก่อน แล้วค่อยอัปเกรดภายหลังได้"
              : "Start from your investing workflow and upgrade later whenever you need more tools."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {planGuides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Card
                key={guide.id}
                className={`border p-5 ${
                  guide.id === "pro"
                    ? "border-brand/55 bg-brand/5"
                    : "border-line bg-surface/35"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      guide.id === "premium" ? "bg-gold/15 text-gold" : "bg-brand-soft text-brand"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wide text-brand">
                      {guide.badge}
                    </span>
                    <h3 className="font-display text-base font-black text-ink">{guide.title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold leading-relaxed text-muted">{guide.desc}</p>
                <ul className="mt-4 space-y-2">
                  {guide.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-xs font-semibold text-ink/85">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5 w-full"
                  variant={guide.id === "pro" ? "primary" : guide.id === "premium" ? "gold" : "outline"}
                  onClick={() => choose(guide.id)}
                >
                  {guide.id === "free"
                    ? t("common.startFree")
                    : `${lang === "th" ? "เลือก" : "Select"} ${PLAN_TRANS[lang][guide.id].name}`}
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: TRUST STRIP */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up [animation-delay:110ms]">
        {trustItems.map((item) => (
          <div key={item.title} className="rounded-2xl border border-line bg-surface/35 p-4">
            <div className="flex items-center gap-2 font-display text-sm font-black text-ink">
              <Shield className="h-4 w-4 text-brand" />
              {item.title}
            </div>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-muted">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* SECTION 5: 🏆 HIGH-DENSITY MONETIZATION FEATURE MATRIX */}
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

      {/* SECTION 6: DEFAULT FEATURES */}
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
          ? "ราคารวมภาษีมูลค่าเพิ่มแล้ว · ชำระแบบสมาชิกอย่างปลอดภัยผ่าน Stripe Checkout" 
          : "Prices include VAT. Secured by Stripe Checkout for recurring card subscriptions."}
      </p>

      {/* SECTION 7: FAQ */}
      <section className="mx-auto max-w-3xl space-y-4 animate-fade-up [animation-delay:180ms]">
        <div className="text-center">
          <h2 className="font-display text-2xl font-extrabold text-ink">
            {lang === "th" ? "คำถามที่พบบ่อยเกี่ยวกับราคาและแพ็กเกจ" : "Pricing FAQ"}
          </h2>
          <p className="mt-2 text-sm font-medium text-muted">
            {lang === "th"
              ? "สรุปคำถามสำคัญก่อนเริ่มใช้งาน ValuStock"
              : "Key questions before starting with ValuStock."}
          </p>
        </div>
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

      {/* SECTION 8: FINAL CTA */}
      <section className="rounded-2xl border border-brand/30 bg-brand/10 p-6 text-center animate-fade-up [animation-delay:200ms]">
        <span className="inline-flex items-center gap-1 rounded-full border border-brand/35 bg-bg/50 px-3 py-1 text-[11px] font-black text-brand">
          <Info className="h-3.5 w-3.5" />
          {lang === "th" ? "เริ่มต้นได้ทันที" : "Ready when you are"}
        </span>
        <h2 className="mt-3 font-display text-2xl font-extrabold text-ink">
          {lang === "th" ? "เริ่มวิเคราะห์หุ้นด้วยมูลค่าที่แท้จริงวันนี้" : "Start Investing With Intrinsic Value Today"}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-muted">
          {lang === "th"
            ? "เริ่มจาก Free ได้เลย หรือเลือก Pro เพื่อปลดล็อก DCF, Graham Number, Stock Screener และ Watchlist แบบเต็มระบบ"
            : "Start with Free, or choose Pro to unlock DCF, Graham Number, stock screening, and full watchlist access."}
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={() => choose("pro")} className="w-full sm:w-auto">
            {lang === "th" ? "เลือก Pro ยอดนิยม" : "Choose Pro"}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => choose("free")} className="w-full sm:w-auto">
            {t("common.startFree")}
          </Button>
        </div>
      </section>

      {/* Stripe checkout modal */}
      <Modal
        open={!!checkout}
        onClose={() => setCheckout(null)}
        title={lang === "th" ? "ชำระเงินผ่าน Stripe" : "Stripe Checkout"}
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

            {!user?.email && (
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-semibold text-ink">
                  {lang === "th" ? "อีเมลสำหรับสมัครสมาชิก" : "Membership email"}
                </span>
                <input
                  className="input-base"
                  type="email"
                  value={checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
            )}

            <div className="mt-4 rounded-xl border border-line bg-elevate/55 p-4">
              <div className="text-sm font-bold text-ink">{lang === "th" ? "สิ่งที่จะเกิดขึ้น" : "What happens next"}</div>
              <ul className="mt-3 space-y-2">
                {paymentMethods.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-xs font-semibold leading-relaxed text-muted">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            {checkoutError && (
              <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-400">
                {checkoutError}
              </div>
            )}

            <Button
              className="mt-5 w-full text-white bg-brand hover:bg-brand/90"
              size="lg"
              onClick={confirm}
              disabled={checkoutLoading}
            >
              {checkoutLoading
                ? (lang === "th" ? "กำลังเปิด Stripe..." : "Opening Stripe...")
                : (lang === "th" ? "ไปที่หน้า Stripe Checkout" : "Continue to Stripe Checkout")}
            </Button>
            <p className="mt-3 text-center text-[11px] text-muted">
              {lang === "th" 
                ? "คุณจะถูกพาไปหน้า Stripe ที่ปลอดภัย ValuStock ไม่เก็บเลขบัตรหรือ CVV" 
                : "You will be redirected to Stripe. ValuStock never stores card numbers or CVV."}
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

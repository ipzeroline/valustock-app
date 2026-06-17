"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Database,
  Calendar,
} from "@/lib/icons";

const PRICING_IMAGE_URL = "https://valustock.com/images/pricing-plans-hero.png?v=1";
const PRICING_IMAGE_PATH = "/images/pricing-plans-hero.png?v=1";

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
  const isLifetimeMember = user?.plan === "lifetime" || user?.billing === "lifetime";

  const choose = (id: PlanId) => {
    if (isLifetimeMember) {
      router.push("/account");
      return;
    }
    if (id === "free") {
      if (process.env.NODE_ENV !== "production") {
        setPlan("free", billing);
      }
      router.push("/dashboard");
      return;
    }
    // Dev mode: set paid plan directly without Stripe checkout
    if (process.env.NODE_ENV !== "production") {
      setPlan(id, id === "lifetime" ? "lifetime" : billing);
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
    const checkoutBilling = checkout === "lifetime" ? "lifetime" : billing;

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
          billing: checkoutBilling,
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
    ? plan.id === "lifetime"
      ? plan.priceMonthly
      : billing === "monthly"
      ? plan.priceMonthly
      : plan.priceYearly
    : 0;

  const defaultIncludedFeatures = lang === "th" 
    ? [
        "ข้อมูลหุ้นไทย SET และสหรัฐฯ",
        "กราฟเส้นราคาย้อนหลังพื้นฐาน",
        "ธีมสว่าง/มืด",
        "ใช้งานบนมือถือและเดสก์ท็อป",
        "อัปเดตข้อมูลสม่ำเสมอ",
        "รายเดือน/รายปีเปลี่ยนหรือยกเลิกได้",
      ]
    : [
        "SET Thai & US stock databases",
        "Historical price action charts",
        "Light & Dark UI options",
        "Mobile & Desktop responsive layout",
        "Prism continuous data sync",
        "Change or cancel monthly/yearly plans anytime",
      ];

  const paymentMethods = lang === "th"
    ? ["ชำระผ่าน Stripe Checkout", "รองรับบัตรเครดิต/เดบิตและ Link", "รายเดือน/รายปีเป็นสมาชิกต่ออายุ ส่วน Lifetime ชำระครั้งเดียว", "ใบเสร็จและข้อมูลสมาชิกซิงก์อัตโนมัติ"]
    : ["Secured by Stripe Checkout", "Supports credit/debit cards and Link", "Monthly/yearly plans renew; Lifetime is one-time", "Receipts and membership sync automatically"];

  const planGuides = [
    {
      id: "free" as PlanId,
      icon: Shield,
      title: lang === "th" ? "Free เหมาะกับใคร" : "Who Free Is For",
      badge: lang === "th" ? "เริ่มต้น" : "Starter",
      desc:
        lang === "th"
          ? "เหมาะสำหรับทดลองดูข้อมูลหุ้นพื้นฐาน กราฟเส้นย้อนหลัง และทำความเข้าใจมูลค่าหุ้นก่อนอัปเกรด"
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
          ? "เหมาะกับนักลงทุน VI ที่ต้องการ DCF, Screener, Portfolio Tracker, Watchlist ไม่จำกัด และกราฟแท่งเทียนระดับเทคนิคสำหรับวิเคราะห์รายตัว"
          : "Best for value investors who need DCF, screening, portfolio tracking, unlimited watchlists, Market Pulse, and a technical candlestick workspace.",
      points:
        lang === "th"
          ? ["DCF และมูลค่าเหมาะสม", "Market Intelligence รายตัว", "Smart Symbol Lookup", "กราฟแท่งเทียน + Volume + Fullscreen", "Mini App Overview"]
          : ["DCF and fair value", "Per-asset Market Intelligence", "Smart Symbol Lookup", "Candlesticks + volume + fullscreen", "Mini App overview"],
    },
    {
      id: "premium" as PlanId,
      icon: Crown,
      title: lang === "th" ? "Premium เหมาะกับใคร" : "Who Premium Is For",
      badge: lang === "th" ? "ครบสุด" : "Full access",
      desc:
        lang === "th"
          ? "เหมาะกับคนมีพอร์ตจริงจัง ต้องการเปรียบเทียบหุ้นหลายตัว ติดตามปฏิทินเศรษฐกิจ/ผลประกอบการ/ปันผล รับ Telegram Alerts, ใช้ Mini App กดส่งสรุปกลับเข้าแชท, ทำ Backtest/Scenario และส่งออกข้อมูลไปวิเคราะห์ต่อ"
          : "Best for active portfolios that need comparisons, economic calendar monitoring, market movers, Telegram alerts, Mini App actions back to chat, backtests/scenarios, and data exports.",
      points:
        lang === "th"
          ? ["Compare หุ้นหลายตัวและบันทึกชุด", "ปฏิทินเศรษฐกิจ + Earnings + Dividends", "Mini Command Center", "Portfolio Summary + Compare Alert ใน Telegram", "Backtest, Scenario และ CSV Export"]
          : ["Saved multi-asset compare sets", "Economic calendar + earnings + dividends", "Mini Command Center", "Portfolio Summary + Compare Alert in Telegram", "Backtest, scenarios, and CSV export"],
    },
    {
      id: "lifetime" as PlanId,
      icon: Database,
      title: lang === "th" ? "Lifetime เหมาะกับใคร" : "Who Lifetime Is For",
      badge: lang === "th" ? "จ่ายครั้งเดียว" : "One-time",
      desc:
        lang === "th"
          ? "เหมาะกับผู้ใช้ระยะยาวที่ต้องการ Premium ครบ รวมปฏิทินเศรษฐกิจ, Telegram Watchlist/Portfolio/Compare Alerts, Mini App, export/backtest/scenario และ bulk historical workflow สำหรับวิเคราะห์ย้อนหลัง"
          : "Best for long-term users who want Premium access, Economic Calendar, Telegram Watchlist/Portfolio/Compare Alerts, Mini App, and historical research workflows.",
      points:
        lang === "th"
          ? ["จ่ายครั้งเดียว 888 บาท", "ปฏิทินเศรษฐกิจ + Telegram + Mini App ครบ", "Premium ครบทุกโมดูลตลอดชีพ"]
          : ["One-time 888 THB", "Economic calendar + Telegram + Mini App", "Lifetime Premium modules"],
    },
  ];

  const trustItems = [
    {
      title: lang === "th" ? "เริ่มใช้ฟรี" : "Start free",
      desc: lang === "th" ? "ทดลองใช้ได้ทันที ไม่ต้องใส่บัตรเครดิต" : "Try instantly with no credit card required.",
    },
    {
      title: lang === "th" ? "ยืดหยุ่นตามรอบบิล" : "Flexible billing",
      desc: lang === "th" ? "รายเดือน/รายปีเปลี่ยนหรือยกเลิกได้ ส่วน Lifetime จ่ายครั้งเดียว" : "Change or cancel monthly/yearly plans; Lifetime is one-time.",
    },
    {
      title: lang === "th" ? "จ่ายปลอดภัยผ่าน Stripe" : "Secure Stripe billing",
      desc: lang === "th" ? "ชำระแบบสมาชิกหรือจ่ายครั้งเดียวด้วยบัตรเครดิต/เดบิตและ Link ผ่าน Stripe Checkout" : "Card and Link subscriptions or one-time payments are handled by Stripe Checkout.",
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
          ? "ถ้าเน้นคำนวณ DCF, หามูลค่าเหมาะสม, สกรีนหุ้น, Portfolio Tracker และกราฟเทคนิค Pro เพียงพอสำหรับนักลงทุนส่วนใหญ่ แต่ถ้าต้องการ Compare, Backtest/Scenario, CSV Export, Telegram Watchlist/Portfolio/Compare Alerts และ Mini App actions ควรเลือก Premium"
          : "Pro is enough for DCF, fair value, screening, portfolio tracking, and technical charts. Premium is better if you need Compare, backtest/scenario workflows, CSV exports, Telegram Watchlist/Portfolio/Compare Alerts, and Mini App actions.",
    },
    {
      q: lang === "th" ? "Market Intelligence ใน Pro ใช้ทำอะไร?" : "What is Market Intelligence in Pro?",
      a:
        lang === "th"
          ? "Market Intelligence เป็นแผงข้อมูลรายสินทรัพย์ที่รวมข่าวล่าสุด technical snapshot ปันผล งบ เหตุการณ์สำคัญ ETF/Fund data และคุณภาพข้อมูลในหน้าเดียว เหมาะสำหรับอ่านภาพรวมก่อนตัดสินใจเจาะลึก"
          : "Market Intelligence is a per-asset panel that combines news, technical snapshots, dividends, statements, key events, ETF/Fund data, and coverage quality in one place before deeper research.",
    },
    {
      q: lang === "th" ? "Smart Symbol Lookup ต่างจากค้นหาปกติอย่างไร?" : "How is Smart Symbol Lookup different from normal search?",
      a:
        lang === "th"
          ? "ถ้าสัญลักษณ์ยังไม่มีในรายการหลัก ระบบจะพยายามค้นหาจากข้อมูลตลาด ตรวจว่าเป็นสินทรัพย์จริง ดึงราคา/กราฟ/ข้อมูลพื้นฐาน และบันทึกไว้ให้เรียกใช้ในพอร์ตหรือ Watchlist ได้ง่ายขึ้น"
          : "When a symbol is not in the core list, the system tries to resolve it from market data, verify the asset, fetch quote/chart/fundamental context, and keep it ready for portfolio or watchlist workflows.",
    },
    {
      q: lang === "th" ? "Telegram Alert ใน Premium ส่งอะไรได้บ้าง?" : "What does Premium Telegram Alert send?",
      a:
        lang === "th"
          ? "Premium และ Lifetime ส่งสรุปรายการโปรดรายวัน/รายสัปดาห์ได้ทุกตัวใน Watchlist, ส่ง Portfolio Summary, ส่ง Compare Set Alert และใช้ Mini App กดส่งสรุปกลับเข้า Telegram ส่วนตัวได้ โดยมี MOS, Fair Value, Yield, ROE, อันดับหุ้นเด่น และลิงก์กลับไปยังหน้าวิเคราะห์"
          : "Premium and Lifetime can send daily/weekly summaries for every watchlist symbol, Portfolio Summary, Compare Set Alerts, and Mini App actions back to the member's private Telegram chat with MOS, fair value, yield, ROE, ranked leaders, and links back to analysis pages.",
    },
    {
      q: lang === "th" ? "ปฏิทินเศรษฐกิจอยู่ในแพ็กเกจไหน?" : "Which plans include the Economic Calendar?",
      a:
        lang === "th"
          ? "ปฏิทินเศรษฐกิจเปิดให้สมาชิก Premium และ Lifetime ใช้งาน โดยรวมเหตุการณ์ Macro, วันหยุดตลาด, Earnings, Dividends, Stock Split และ IPO เพื่อช่วยวางแผนติดตามพอร์ตและ Watchlist"
          : "The Economic Calendar is included in Premium and Lifetime. It covers macro events, market holidays, earnings, dividends, stock splits, and IPOs for portfolio and watchlist monitoring.",
    },
    {
      q: lang === "th" ? "Telegram Mini App ใช้ทำอะไรได้บ้าง?" : "What can the Telegram Mini App do?",
      a:
        lang === "th"
          ? "Mini App เปิดจาก @valustockbot โดยใช้การเชื่อมต่อ Telegram จากหน้า Account ไม่ต้องล็อกอินเว็บซ้ำ สามารถดู Portfolio Summary, Compare Sets, Watchlist แบบย่อ และสำหรับ Premium/Lifetime สามารถกดส่ง Watchlist Summary, Portfolio Summary หรือ Compare Alert กลับเข้าแชท Telegram ส่วนตัวได้"
          : "The Mini App opens from @valustockbot using the Telegram connection from Account, so members do not need to log in to the web again. It shows Portfolio Summary, saved Compare Sets, and Watchlist snapshots. Premium/Lifetime members can send Watchlist Summary, Portfolio Summary, or Compare Alert back into their private Telegram chat.",
    },
    {
      q: lang === "th" ? "Lifetime คุ้มกว่ารายเดือนเมื่อไหร่?" : "When is Lifetime better than monthly billing?",
      a:
        lang === "th"
          ? "Lifetime เหมาะกับสมาชิกที่ตั้งใจใช้ ValuStock ต่อเนื่องเกินประมาณ 10 เดือน และต้องการ Premium ครบทุกโมดูล เช่น Compare, Telegram Watchlist/Portfolio/Compare Alerts, Mini App, Backtest, Scenario DCF และ CSV Export โดยไม่ต้องต่ออายุรายเดือนหรือรายปี"
          : "Lifetime is best when you plan to use ValuStock for more than about 10 months and want all Premium modules such as Compare, Telegram Watchlist/Portfolio/Compare Alerts, Mini App, backtests, scenario DCF, and CSV exports without monthly or annual renewal.",
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
      screenshot: PRICING_IMAGE_URL,
      offers: PLANS.map((p) => ({
        "@type": "Offer",
        name: PLAN_TRANS[lang][p.id].name,
        price: p.id === "lifetime" ? p.priceMonthly : billing === "monthly" ? p.priceMonthly : p.priceYearly,
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
    <div className="mx-auto w-full max-w-[100vw] overflow-x-hidden px-5 py-16 space-y-12 xl:max-w-6xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* SECTION 1: HERO */}
      <div className="grid items-center gap-8 animate-fade-up lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="text-center lg:text-left">
          <span className="chip border-gold/30 bg-gold/10 text-gold shadow-glow lg:justify-start">
            <Crown className="h-3.5 w-3.5 text-gold" /> {isLifetimeMember ? (lang === "th" ? "สมาชิกตลอดชีพ" : "Lifetime member") : t("common.pricing")}
          </span>
          <h1 className="mx-auto mt-4 max-w-[22rem] font-display text-3xl font-extrabold leading-tight tracking-tight text-ink [overflow-wrap:anywhere] sm:max-w-none sm:text-4xl md:text-5xl lg:mx-0">
            {isLifetimeMember ? (
              lang === "th" ? (
                <>
                  คุณเป็นสมาชิก
                  <br />
                  ตลอดชีพแล้ว
                </>
              ) : (
                <>
                  Lifetime access
                  <br />
                  is active
                </>
              )
            ) : lang === "th" ? (
              <>
                เลือกแพ็กเกจ
                <br />
                ที่เหมาะกับคุณ
              </>
            ) : (
              t("pricing.title")
            )}
          </h1>
          <p className="mx-auto mt-3 max-w-[20rem] text-sm leading-relaxed text-muted sm:max-w-xl lg:mx-0">
            {isLifetimeMember
              ? lang === "th"
                ? "บัญชีนี้ได้รับสิทธิ์ Premium ครบทุกโมดูลตลอดชีพแล้ว ไม่จำเป็นต้องซื้อแพ็กเกจซ้ำ สามารถดูสิทธิ์และตั้งค่าบัญชีได้จากหน้านี้"
                : "This account already has lifetime Premium access. Checkout is disabled to prevent duplicate purchases."
              : lang === "th" 
              ? "เริ่มต้นฟรี ไม่ต้องใช้บัตรเครดิต เลือกสไตล์การลงทุนที่ตรงใจ ปลดล็อคฟีเจอร์ระดับสถาบันการเงินได้ทันที" 
              : "Start free, no credit card required. Upgrade or downgrade your plan anytime to fit your trading habits."}
          </p>

          {/* billing toggle */}
          {!isLifetimeMember && (
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
          )}
        </div>

        <div className="mx-auto w-full max-w-[560px] lg:mx-0 lg:justify-self-end">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface/55 shadow-card">
            <img
              src={PRICING_IMAGE_PATH}
              alt={lang === "th" ? "ภาพสรุปแพ็กเกจ ValuStock Free Pro Premium และ Lifetime" : "ValuStock Free Pro Premium and Lifetime plan visual summary"}
              width={1672}
              height={941}
              loading="eager"
              decoding="async"
              className="block aspect-[16/9] w-full object-cover"
            />
          </div>
        </div>
      </div>

      {isLifetimeMember && (
        <section className="rounded-2xl border border-gold/35 bg-gold/10 p-5 shadow-glow animate-fade-up [animation-delay:60ms]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
                <CheckCircle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-extrabold text-ink">
                  {lang === "th" ? "สถานะสมาชิกตลอดชีพเปิดใช้งานแล้ว" : "Lifetime membership is active"}
                </h2>
                <p className="mt-1 text-sm font-medium leading-relaxed text-muted">
                  {lang === "th"
                    ? "คุณมีสิทธิ์ Premium ครบทุกฟีเจอร์ รวมกราฟเทคนิค, Alert Center ผ่าน Telegram, Backtest, Scenario และ Export โดยไม่ต้องต่ออายุรายเดือน/รายปี"
                    : "You have full Premium access including technical charts, Telegram Alert Center, backtests, scenarios, and exports without monthly or annual renewal."}
                </p>
              </div>
            </div>
            <Button variant="gold" onClick={() => router.push("/account")}>
              {lang === "th" ? "ดูบัญชีสมาชิก" : "View account"}
            </Button>
          </div>
        </section>
      )}

      {/* SECTION 2: PLANS CARD GRID */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 animate-fade-up [animation-delay:80ms]">
        {PLANS.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            billing={billing}
            current={user?.plan === p.id}
            disabled={isLifetimeMember}
            actionLabel={
              isLifetimeMember
                ? p.id === "lifetime"
                  ? t("pricing.currentPlanBadge")
                  : lang === "th"
                    ? "รวมอยู่ใน Lifetime แล้ว"
                    : "Included in Lifetime"
                : undefined
            }
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {planGuides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Card
                key={guide.id}
                className={`min-w-0 border p-5 ${
                  guide.id === "pro"
                    ? "border-brand/55 bg-brand/5"
                    : "border-line bg-surface/35"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      guide.id === "premium" || guide.id === "lifetime" ? "bg-gold/15 text-gold" : "bg-brand-soft text-brand"
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
                <p className="mt-3 text-xs font-semibold leading-relaxed text-muted [overflow-wrap:anywhere]">{guide.desc}</p>
                <ul className="mt-4 space-y-2">
                  {guide.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-xs font-semibold text-ink/85">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                      <span className="[overflow-wrap:anywhere]">{point}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5 w-full"
                  variant={guide.id === "pro" ? "primary" : guide.id === "premium" || guide.id === "lifetime" ? "gold" : "outline"}
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

      <section className="grid gap-4 md:grid-cols-3 animate-fade-up [animation-delay:115ms]">
        {[
          {
            icon: Calendar,
            title: lang === "th" ? "Economic Calendar Suite" : "Economic Calendar Suite",
            plan: "Premium 88",
            desc:
              lang === "th"
                ? "ติดตาม Macro, วันหยุดตลาด, Earnings, Dividends, Stock Split และ IPO ในหน้าเดียวสำหรับวางแผนพอร์ต"
                : "Track macro events, holidays, earnings, dividends, stock splits, and IPOs in one portfolio-ready workspace.",
          },
          {
            icon: Layers,
            title: lang === "th" ? "Market Intelligence" : "Market Intelligence",
            plan: "Pro 49",
            desc:
              lang === "th"
                ? "อ่านข้อมูลรายตัวในหน้าเดียว ทั้งข่าว, technical snapshot, ปันผล, งบ, ETF/Fund และคุณภาพข้อมูล"
                : "Per-asset research in one panel: news, technical snapshot, dividends, statements, ETF/Fund data, and coverage quality.",
          },
          {
            icon: Database,
            title: lang === "th" ? "Research Workflow ระยะยาว" : "Long-Term Research Workflow",
            plan: "Lifetime 888",
            desc:
              lang === "th"
                ? "เหมาะกับงานข้อมูลย้อนหลังจำนวนมาก export/backtest/scenario และ workflow วิเคราะห์พอร์ตต่อเนื่อง"
                : "For historical exports, backtesting, scenarios, and continuous portfolio research workflows.",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="border border-line bg-surface/35 p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wide text-brand">{item.plan}</span>
                  <h3 className="font-display text-base font-black text-ink">{item.title}</h3>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold leading-relaxed text-muted">{item.desc}</p>
            </Card>
          );
        })}
      </section>

      {/* SECTION 5: 🏆 HIGH-DENSITY MONETIZATION FEATURE MATRIX */}
      <Card className="border border-line/80 overflow-hidden animate-fade-up [animation-delay:120ms] bg-surface/30">
        <CardHeader
          title={lang === "th" ? "ตารางเปรียบเทียบฟังก์ชันการใช้งานแบบละเอียด" : "Detailed Feature Comparison Matrix"}
          subtitle={lang === "th" ? "เจาะลึกฟังก์ชันวิเคราะห์ กราฟเทคนิค Telegram Mini App การแจ้งเตือน และพอร์ต" : "Granular breakdown of research, charting, Telegram Mini App, alerts, and portfolio modules"}
          icon={<Layers className="h-4.5 w-4.5 text-brand" />}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-elevate/50 text-muted font-bold tracking-wider">
                <th className="px-5 py-3.5 w-72">{lang === "th" ? "ฟังก์ชันการวิเคราะห์ (Analytical Modules)" : "FEATURE"}</th>
                <th className="px-5 py-3.5 text-center w-40">FREE</th>
                <th className="px-5 py-3.5 text-center w-40 text-brand">PRO</th>
                <th className="px-5 py-3.5 text-center w-40 text-gold">PREMIUM</th>
                <th className="px-5 py-3.5 text-center w-40 text-gold">LIFETIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 bg-surface/30">
              {/* Category Header 1 */}
              <tr className="bg-elevate/25">
                <td colSpan={5} className="px-5 py-2 font-display font-extrabold text-[10px] uppercase text-muted tracking-wider">
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
                label={lang === "th" ? "5. Portfolio Backtest / Scenario DCF" : "5. Portfolio Backtest / Scenario DCF"}
                free="❌"
                freeStyle="muted"
                pro="❌"
                proStyle="muted"
                premium={lang === "th" ? "Backtest + Bull/Bear/Base Case" : "Backtest + Bull/Bear/Base Case"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "6. Market Intelligence รายตัว" : "6. Per-Asset Market Intelligence"}
                free="❌"
                pro={lang === "th" ? "ข่าว, เทคนิค, ปันผล, ETF/Fund" : "News, technicals, dividends, ETF/Fund"}
                proStyle="brand"
                premium={lang === "th" ? "ครบ + คุณภาพข้อมูล + event summary" : "Full panel + coverage quality + events"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "7. Smart Symbol Lookup" : "7. Smart Symbol Lookup"}
                free="❌"
                pro={lang === "th" ? "ค้นหาและบันทึกสินทรัพย์ใหม่" : "Resolve and save new assets"}
                proStyle="brand"
                premium={lang === "th" ? "ค้นหา + ใช้ในพอร์ต/Compare" : "Resolve + portfolio/compare workflows"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "8. ปฏิทินเศรษฐกิจและเหตุการณ์ตลาด" : "8. Economic Calendar & Market Events"}
                free="❌"
                pro="❌"
                proStyle="muted"
                premium={lang === "th" ? "Macro, Holiday, Earnings, Dividends, Split, IPO" : "Macro, holidays, earnings, dividends, splits, IPO"}
                premiumStyle="gold"
              />

              {/* Category Header 2 */}
              <tr className="bg-elevate/25">
                <td colSpan={5} className="px-5 py-2 font-display font-extrabold text-[10px] uppercase text-muted tracking-wider">
                  📊 {lang === "th" ? "กราฟราคาและเครื่องมือเทคนิค" : "Charting & Technical Tools"}
                </td>
              </tr>
              <MatrixRow
                label={lang === "th" ? "9. กราฟราคาพื้นฐาน" : "9. Basic Price Chart"}
                free={lang === "th" ? "กราฟเส้นย้อนหลัง" : "Historical line chart"}
                pro={lang === "th" ? "กราฟเส้น + แท่งเทียน" : "Line + candlestick"}
                premium={lang === "th" ? "กราฟเส้น + แท่งเทียน" : "Line + candlestick"}
              />
              <MatrixRow
                label={lang === "th" ? "10. Technical Chart Workspace" : "10. Technical Chart Workspace"}
                free="❌"
                pro={lang === "th" ? "แท่งเทียน + Volume + Fullscreen" : "Candlestick + volume + fullscreen"}
                premium={lang === "th" ? "แท่งเทียน + Volume + Fullscreen" : "Candlestick + volume + fullscreen"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "11. Indicators และ Custom Range" : "11. Indicators & Custom Range"}
                free="❌"
                pro={lang === "th" ? "MA/EMA/RSI/MACD/Bollinger" : "MA/EMA/RSI/MACD/Bollinger"}
                premium={lang === "th" ? "MA/EMA/RSI/MACD/Bollinger" : "MA/EMA/RSI/MACD/Bollinger"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "12. Drawing Tools" : "12. Drawing Tools"}
                free="❌"
                pro={lang === "th" ? "Support Line + Trendline" : "Support line + trendline"}
                premium={lang === "th" ? "Support Line + Trendline" : "Support line + trendline"}
                premiumStyle="gold"
              />

              {/* Category Header 3 */}
              <tr className="bg-elevate/25">
                <td colSpan={5} className="px-5 py-2 font-display font-extrabold text-[10px] uppercase text-muted tracking-wider">
                  🔔 {lang === "th" ? "การแจ้งเตือนราคาและความปลอดภัยพอร์ต" : "Notifications & Dynamic Price Alerts"}
                </td>
              </tr>
              <MatrixRow
                label={lang === "th" ? "13. Alert Center ในพอร์ต" : "13. Portfolio Alert Center"}
                free="❌"
                pro="❌"
                premium={lang === "th" ? "ตั้งเงื่อนไขและติดตามสถานะ" : "Rules and status tracking"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "14. การแจ้งเตือน Margin of Safety" : "14. Margin-of-Safety Alerts"}
                free="❌"
                pro="❌"
                premium={lang === "th" ? "เตือนเมื่อหุ้นเข้าโซน MOS" : "Undervalued triggers"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "15. Telegram Watchlist Digest" : "15. Telegram Watchlist Digest"}
                free="❌"
                pro="❌"
                premium={lang === "th" ? "รายวัน/รายสัปดาห์ ทุกตัวใน Watchlist" : "Daily/weekly for every watchlist symbol"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "16. Telegram Portfolio Summary" : "16. Telegram Portfolio Summary"}
                free="❌"
                pro="❌"
                premium={lang === "th" ? "มูลค่าพอร์ต, P/L, ตัวเด่น, MOS สูงสุด" : "Portfolio value, P/L, leaders, highest MOS"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "17. Telegram Compare Set Alert" : "17. Telegram Compare Set Alert"}
                free="❌"
                pro="❌"
                premium={lang === "th" ? "สรุปอันดับ MOS/Yield/ROE จากชุดเปรียบเทียบ" : "Ranked MOS/Yield/ROE summary from compare sets"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "18. ช่องทางแจ้งเตือน" : "18. Alert Channels"}
                free="❌"
                pro={lang === "th" ? "In-app พื้นฐาน" : "Basic in-app"}
                proStyle="brand"
                premium={lang === "th" ? "In-app + Telegram ส่วนตัว" : "In-app + personal Telegram"}
                premiumStyle="gold"
              />

              {/* Category Header 4 */}
              <tr className="bg-elevate/25">
                <td colSpan={5} className="px-5 py-2 font-display font-extrabold text-[10px] uppercase text-muted tracking-wider">
                  🤖 {lang === "th" ? "Telegram Mini App และการเชื่อมต่อสมาชิก" : "Telegram Mini App & Member Connection"}
                </td>
              </tr>
              <MatrixRow
                label={lang === "th" ? "19. เชื่อมต่อ Telegram จากหน้า Account" : "19. Telegram connection from Account"}
                free="❌"
                pro={lang === "th" ? "ดูสถานะและเชื่อมต่อ" : "Connect and view status"}
                proStyle="brand"
                premium={lang === "th" ? "เชื่อมต่อ + รับแจ้งเตือน" : "Connect + receive alerts"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "20. Telegram Mini Command Center" : "20. Telegram Mini Command Center"}
                free="❌"
                pro={lang === "th" ? "Overview + Portfolio + Watchlist" : "Overview + portfolio + watchlist"}
                proStyle="brand"
                premium={lang === "th" ? "P/L, concentration, best/worst, Compare" : "P/L, concentration, best/worst, compare"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "21. ปุ่มส่งข้อมูลกลับเข้า Telegram" : "21. Send summaries back to Telegram"}
                free="❌"
                pro="❌"
                premium={lang === "th" ? "Watchlist, Portfolio, Compare" : "Watchlist, portfolio, compare"}
                premiumStyle="gold"
              />

              {/* Category Header 5 */}
              <tr className="bg-elevate/25">
                <td colSpan={5} className="px-5 py-2 font-display font-extrabold text-[10px] uppercase text-muted tracking-wider">
                  💼 {lang === "th" ? "การจัดการพอร์ตและข่าวกระแสเงินสด" : "Portfolios, Watchlists & Inbound News"}
                </td>
              </tr>
              <MatrixRow
                label={lang === "th" ? "22. บันทึกซื้อขายและ Portfolio Tracker" : "22. Investment Ledger & Portfolio Tracker"}
                free="❌"
                pro={lang === "th" ? "บันทึกพอร์ตต้นทุนเฉลี่ย" : "Virtual portfolio tracker"}
                premium={lang === "th" ? "บันทึกพอร์ตต้นทุนเฉลี่ย" : "Virtual portfolio tracker"}
              />
              <MatrixRow
                label={lang === "th" ? "23. ข่าวสารที่ลิ้งก์ตรงอิงหุ้น" : "23. News-Related Equities"}
                free={lang === "th" ? "หัวข้อข่าวย่อทั่วไป" : "Basic News"}
                pro={lang === "th" ? "เจาะลึกข่าววิเคราะห์เชิงดัชนี" : "Audit Sentiment News"}
                premium={lang === "th" ? "เจาะลึกข่าววิเคราะห์เชิงดัชนี" : "Audit Sentiment News"}
              />
              <MatrixRow
                label={lang === "th" ? "24. Watchlist และจำนวนหุ้นที่ติดตาม" : "24. Watchlists & Tracked Assets"}
                free={lang === "th" ? "บันทึกได้ 3 รายการ" : "Track 3 items"}
                pro={lang === "th" ? "ไม่จำกัดรายการ" : "Unlimited items"}
                premium={lang === "th" ? "ไม่จำกัดรายการ" : "Unlimited items"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "25. Export / Backtest / Scenario Workflow" : "25. Export / Backtest / Scenario Workflow"}
                free="❌"
                pro="❌"
                proStyle="muted"
                premium={lang === "th" ? "CSV Export + Backtest + Bull/Bear/Base" : "CSV export + backtest + bull/bear/base"}
                premiumStyle="gold"
              />

              {/* Category Header 6 */}
              <tr className="bg-elevate/25">
                <td colSpan={5} className="px-5 py-2 font-display font-extrabold text-[10px] uppercase text-muted tracking-wider">
                  🧪 {lang === "th" ? "ValueSignal™ และพอร์ตจำลอง (Paper Trading)" : "ValueSignal™ & Virtual Portfolio"}
                </td>
              </tr>
              <MatrixRow
                label={lang === "th" ? "26. ValueSignal™ สัญญาณซื้อ-ขาย" : "26. ValueSignal™ Buy/Sell Signal"}
                free={lang === "th" ? "สัญญาณพื้นฐาน (MOS)" : "Basic signal (MOS only)"}
                pro={lang === "th" ? "สัญญาณครบ 5 ระดับ + Score" : "Full 5-level signal + Score"}
                proStyle="brand"
                premium={lang === "th" ? "สัญญาณครบ + API + Factor Breakdown" : "Full signal + API + Factor Breakdown"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "27. ValueSignal API Endpoint" : "27. ValueSignal API Endpoint"}
                free="❌"
                pro="❌"
                proStyle="muted"
                premium={lang === "th" ? "GET /api/valuation/signal" : "GET /api/valuation/signal"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "28. พอร์ตจำลอง (Paper Trading)" : "28. Virtual Portfolio (Paper Trade)"}
                free={lang === "th" ? "เงินเสมือน ฿100,000" : "฿100K virtual cash"}
                pro={lang === "th" ? "เงินเสมือน ฿1,000,000" : "฿1M virtual cash"}
                proStyle="brand"
                premium={lang === "th" ? "ไม่จำกัด + สัญญาณ ValueSignal ในพอร์ต" : "Unlimited + ValueSignal in holdings"}
                premiumStyle="gold"
              />
              <MatrixRow
                label={lang === "th" ? "29. ราคาสดในพอร์ตจำลอง (Massive)" : "29. Live Prices in Virtual Portfolio"}
                free="✅"
                pro="✅"
                proStyle="brand"
                premium="✅"
                premiumStyle="gold"
              />
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 6: SEO BUYER GUIDE */}
      <section className="grid gap-5 rounded-2xl border border-line bg-surface/35 p-6 animate-fade-up [animation-delay:125ms] lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-[11px] font-black text-brand">
            <Info className="h-3.5 w-3.5" />
            {lang === "th" ? "คู่มือเลือกแพ็กเกจ" : "Plan buying guide"}
          </span>
          <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight text-ink">
            {lang === "th"
              ? "แพ็กเกจ ValuStock สำหรับวิเคราะห์หุ้นไทย หุ้นสหรัฐ และพอร์ตลงทุน"
              : "ValuStock plans for Thai stocks, US stocks, and portfolio research"}
          </h2>
          <div className="mt-3 space-y-3 text-sm font-medium leading-relaxed text-muted">
            <p>
              {lang === "th"
                ? "ValuStock เป็นโปรแกรมวิเคราะห์หุ้นและเครื่องมือประเมินมูลค่าหุ้นสำหรับนักลงทุนที่ต้องการดู DCF Calculator, Stock Screener, Portfolio Tracker, Watchlist และกราฟแท่งเทียนในที่เดียว แพ็กเกจ Free เหมาะสำหรับทดลองข้อมูลพื้นฐาน ส่วน Pro เหมาะกับการวิเคราะห์รายตัวด้วยมูลค่าเหมาะสม, Margin of Safety, Graham Number และเครื่องมือเทคนิคอย่าง MA, EMA, RSI, MACD และ Bollinger"
                : "ValuStock is a stock analysis and valuation platform for investors who need a DCF calculator, stock screener, portfolio tracker, watchlist, and candlestick charts in one workspace. Free is for basic exploration, while Pro fits single-stock research with fair value, margin of safety, Graham Number, and technical indicators such as MA, EMA, RSI, MACD, and Bollinger."}
            </p>
            <p>
              {lang === "th"
                ? "สำหรับสมาชิกที่ต้องติดตามพอร์ตจริงจัง Premium และ Lifetime จะปลดล็อก Compare, ปฏิทินเศรษฐกิจ, Backtest, Scenario DCF, CSV Export, Telegram Watchlist Digest ทุกตัว, Portfolio Summary, Compare Set Alert และ Telegram Mini App ที่กดส่งข้อมูลกลับเข้าแชทส่วนตัวได้ เหมาะกับนักลงทุนที่ต้องเปรียบเทียบหุ้นธนาคาร หุ้นปันผล หุ้นเติบโต หุ้นสหรัฐ หรือ ETF หลายตัวก่อนตัดสินใจ"
                : "For active members, Premium and Lifetime unlock Compare, the Economic Calendar, backtesting, scenario DCF, CSV exports, Telegram Watchlist Digest for every symbol, Portfolio Summary, Compare Set Alerts, and Telegram Mini App actions that send summaries back into private chat. This is useful when comparing banks, dividend stocks, growth names, US stocks, or ETFs before making a decision."}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-elevate/35 p-4">
          <h3 className="font-display text-sm font-black text-ink">
            {lang === "th" ? "เครื่องมือหลักที่เกี่ยวข้อง" : "Related research tools"}
          </h3>
          <div className="mt-3 grid gap-2 text-xs font-bold text-muted sm:grid-cols-2 lg:grid-cols-1">
            {[
              { href: "/stock-valuation", label: lang === "th" ? "คู่มือประเมินมูลค่าหุ้น" : "Stock valuation guide" },
              { href: "/dcf-calculator", label: lang === "th" ? "DCF Calculator" : "DCF calculator" },
              { href: "/screeners", label: lang === "th" ? "Stock Screener" : "Stock screener" },
              { href: "/portfolio", label: lang === "th" ? "Portfolio Tracker" : "Portfolio tracker" },
              { href: "/compare", label: lang === "th" ? "Compare หุ้นหลายตัว" : "Compare multiple stocks" },
              { href: "/economic-calendar", label: lang === "th" ? "ปฏิทินเศรษฐกิจ Premium" : "Premium economic calendar" },
              { href: "/watchlist", label: lang === "th" ? "Watchlist และ Telegram Digest" : "Watchlist and Telegram digest" },
              { href: "/telegram", label: lang === "th" ? "Telegram Mini App" : "Telegram Mini App" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-lg border border-line bg-surface/50 px-3 py-2 transition hover:border-brand hover:text-brand"
              >
                <span>{item.label}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: DEFAULT FEATURES */}
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
          ? "ราคารวมภาษีมูลค่าเพิ่มแล้ว · ชำระรายเดือน/รายปีหรือจ่ายครั้งเดียวอย่างปลอดภัยผ่าน Stripe Checkout" 
          : "Prices include VAT. Secured by Stripe Checkout for recurring subscriptions and one-time payments."}
      </p>

      {/* SECTION 8: FAQ */}
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

      {/* SECTION 9: FINAL CTA */}
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
            ? "เริ่มจาก Free ได้เลย หรือเลือก Pro เพื่อปลดล็อก DCF, Stock Screener, Portfolio Tracker และ Technical Chart แบบเต็มระบบ"
            : "Start with Free, or choose Pro to unlock DCF, screening, portfolio tracking, and the full Technical Chart workspace."}
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
                  {plan.id === "lifetime"
                    ? (lang === "th" ? "ชำระครั้งเดียว ใช้งานตลอดชีพ" : "One-time lifetime payment")
                    : billing === "monthly"
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
  lifetime,
  freeStyle = "normal",
  proStyle = "normal",
  premiumStyle = "normal",
}: {
  label: string;
  free: string;
  pro: string;
  premium: string;
  lifetime?: string;
  freeStyle?: "normal" | "muted";
  proStyle?: "normal" | "muted" | "brand";
  premiumStyle?: "normal" | "muted" | "gold";
}) {
  const lifetimeValue = lifetime || premium;
  return (
    <tr className="align-top transition hover:bg-elevate/25">
      <td className="border-r border-line/40 px-5 py-3 font-semibold leading-snug text-ink/90">{label}</td>
      <td className={`min-w-40 px-5 py-3 text-center text-[11px] font-extrabold leading-snug ${
        free === "❌" ? "text-down text-sm" : freeStyle === "muted" ? "text-muted" : "text-ink"
      }`}>{free}</td>
      <td className={`min-w-40 px-5 py-3 text-center text-[11px] font-extrabold leading-snug ${
        pro === "❌" ? "text-down text-sm" : proStyle === "muted" ? "text-muted" : "text-brand"
      }`}>{pro}</td>
      <td className={`min-w-40 px-5 py-3 text-center text-[11px] font-extrabold leading-snug ${
        premium === "❌" ? "text-down text-sm" : premiumStyle === "muted" ? "text-muted" : "text-gold"
      }`}>{premium}</td>
      <td className="min-w-40 px-5 py-3 text-center text-[11px] font-extrabold leading-snug text-gold">{lifetimeValue}</td>
    </tr>
  );
}

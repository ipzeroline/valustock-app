"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useStore, useCurrentPlan } from "@/lib/store";
import { STOCKS, getStock } from "@/lib/stocks";
import { computeValuation, defaultDCFParams } from "@/lib/valuation";
import { StockCard } from "@/components/StockCard";
import { Card, CardHeader, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { num, pct, dollar, nav, baht } from "@/lib/format";
import { useTranslation } from "@/lib/translations";
import { Sparkline } from "@/components/Charts";
import { AssetLogo } from "@/components/AssetLogo";
import {
  TrendingUp,
  Star,
  Gauge,
  Crown,
  Sparkles,
  Info,
  CircleDollarSign,
  Calculator,
  Layers,
  ChevronRight,
  ArrowUpRight,
} from "@/lib/icons";

type StrategyType = "dividend" | "growth" | "value";
type GlossaryTerm = "mos" | "dcf" | "roe" | "pe" | "de";

export default function Dashboard() {
  const { user, watchlist, toggleWatch, isWatched } = useStore();
  const plan = useCurrentPlan();
  const { t, lang } = useTranslation();

  // FX / Tax Estimator Local States
  const [foreignIncome, setForeignIncome] = useState<number>(10000); // in USD
  const fxRate = 36.45; // USD/THB

  // Beginner interactive strategy wizard state
  const [activeStrategy, setActiveStrategy] = useState<StrategyType>("dividend");
  // Beginner glossary tab state
  const [activeGlossary, setActiveGlossary] = useState<GlossaryTerm>("mos");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "ValuStock Dashboard",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: "https://valustock.com/dashboard",
    description:
      lang === "th"
        ? "แดชบอร์ดสำหรับติดตามหุ้น Watchlist, หุ้น undervalue, DCF, Margin of Safety, พอร์ตจำลอง และภาพรวมตลาด"
        : "A dashboard for tracking watchlists, undervalued stocks, DCF, margin of safety, portfolio tools, and market overview.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "THB",
    },
    publisher: {
      "@type": "Organization",
      name: "ValuStock",
      url: "https://valustock.com",
    },
  };

  const ranked = useMemo(() => {
    return STOCKS.map((s) => ({
      s,
      v: computeValuation(s, defaultDCFParams(s)),
    })).sort((a, b) => b.v.marginOfSafety - a.v.marginOfSafety);
  }, []);

  const undervalued = ranked.filter((r) => r.v.verdict === "undervalued").length;
  const watched = watchlist.map(getStock).filter(Boolean).slice(0, 3);

  // Group top picks by asset class for Thai investor visibility
  const topThai = ranked.filter((r) => r.s.assetType === "TH_STOCK").slice(0, 2);
  const topUs = ranked.filter((r) => r.s.assetType === "US_STOCK").slice(0, 2);
  const topFunds = ranked.filter((r) => r.s.assetType === "FUND").slice(0, 2);
  const topUsFunds = ranked.filter((r) => r.s.assetType === "US_FUND").slice(0, 2);
  const topCrypto = ranked.filter((r) => r.s.assetType === "CRYPTO").slice(0, 2);
  const topFutures = ranked.filter((r) => r.s.assetType === "FUTURES").slice(0, 2);

  // Tax calculations based on Thai personal brackets (simplified)
  const incomeThb = foreignIncome * fxRate;
  const calculateEstimatedTax = (thb: number) => {
    const taxable = Math.max(0, thb - 100000);
    if (taxable <= 150000) return 0;
    if (taxable <= 300000) return (taxable - 150000) * 0.05;
    if (taxable <= 500000) return 7500 + (taxable - 300000) * 0.10;
    if (taxable <= 750000) return 27500 + (taxable - 500000) * 0.15;
    if (taxable <= 1000000) return 65000 + (taxable - 750000) * 0.20;
    return 115000 + (taxable - 1000000) * 0.25;
  };

  const estimatedTax = calculateEstimatedTax(incomeThb);

  const welcomeText = lang === "th"
    ? `สวัสดี${user ? `, ${user.name}` : " นักลงทุน"}`
    : `Hello${user ? `, ${user.name}` : ", Investor"}`;

  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, [lang]);

  const formatPrice = (s: any, p: number) => {
    if (s.assetType === "US_FUND") {
      return "$" + num(p, 4);
    }
    if (s.assetType === "US_STOCK" || s.currency === "USD") return dollar(p);
    if (s.assetType === "FUND") return nav(p);
    return baht(p);
  };

  // Beginner strategy filter recommendation details
  const strategyDetails = {
    dividend: {
      titleTh: "พอร์ตปันผลรับทรัพย์ (High-Dividend Shield)",
      titleEn: "High-Dividend Shields",
      descTh: "เน้นปันผลสูงสม่ำเสมอ ชนะเงินเฟ้อและลดความเสี่ยงพอร์ตในช่วงตลาดผันผวน เหมาะกับผู้ที่ต้องการเงินสดสำรองเรื่อยๆ",
      descEn: "Focus on resilient cash payouts, superior yield safety, and low volatility during consolidation.",
      badge: lang === "th" ? "ชนะเงินเฟ้อ" : "Yield Shield",
      stocks: ["KBANK", "ADVANC", "PTT"],
      insights: {
        KBANK: lang === "th" ? "ปันผลสูง 3.8% มีอัตราส่วนลดความปลอดภัย (MOS) สูงถึง 23.5% หุ้นธนาคารดิจิทัลชั้นนำ" : "High 3.8% yield with deep 23.5% Safety Margin.",
        ADVANC: lang === "th" ? "ยักษ์ใหญ่สื่อสาร (AIS) ปันผลนิ่งสม่ำเสมอ ผูกขาดกลุ่มผู้ใช้งานโทรคมนาคม แกร่งปลอดภัย" : "Telecom cash cow. Monopolistic market control with robust payout safety.",
        PTT: lang === "th" ? "บริษัทพลังงานแห่งชาติ ปันผลสูงลิ่ว 6.1% ต่อปี ฐานเงินสดล้นมือต้านทานวิกฤตเศรษฐกิจ" : "State energy leader. Extremely high 6.1% dividend yield.",
      } as Record<string, string>,
    },
    growth: {
      titleTh: "พอร์ตเติบโตระยะยาว (High-Growth Innovators)",
      titleEn: "High-Tech Growth Innovators",
      descTh: "เน้นบริษัทเทคโนโลยีระดับโลกที่มีกำไรเติบโตก้าวกระโดดด้วยนวัตกรรมและ AI เหมาะสำหรับผู้ที่ต้องการปั้นพอร์ตให้โตเร็ว",
      descEn: "Focus on compounding capital gains through disruptive technological advancements and AI scale.",
      badge: lang === "th" ? "ปั้นพอร์ตโต" : "Compounding Core",
      stocks: ["NVDA", "AAPL", "MSFT"],
      insights: {
        NVDA: lang === "th" ? "ผู้นำด้านชิปประมวลผลกราฟิกและ AI ที่เติบโตอย่างรวดเร็วที่สุดในอุตสาหกรรมเทคโนโลยีสหรัฐฯ" : "Absolute computing monopoly leading the AI infrastructure boom.",
        AAPL: lang === "th" ? "ระบบนิเวศน์ iPhone ล็อคผู้ใช้งานทั่วโลก ฐานเงินสดสูง ปลอดภัย มั่งคั่งระยะยาวแน่นอน" : "Massive device ecosystem with unbeatable customer lock-in and buybacks.",
        MSFT: lang === "th" ? "ผู้นำคลาวด์องค์กรและปัญญาประดิษฐ์ AI Copilot เติบโตไร้คู่แข่งในสเกลองค์กร" : "SaaS and cloud leader compounder scaling OpenAI software platforms.",
      } as Record<string, string>,
    },
    value: {
      titleTh: "พอร์ตหุ้นคุณค่า (Deep-Value Moats)",
      titleEn: "Buffett Value Core",
      descTh: "เน้นหุ้นคุณค่ายักษ์ใหญ่ผูกขาดตลาด ที่ราคา ณ ปัจจุบันมีส่วนต่างความปลอดภัย (MOS) เกิน 15% ขึ้นไป ราคาถูกมาก",
      descEn: "Target stable defensive giants trading at deep discounts with wide business moats.",
      badge: lang === "th" ? "ปลอดภัยสูงสุด" : "Deep Margin",
      stocks: ["PTTEP", "CPALL", "BDMS"],
      insights: {
        PTTEP: lang === "th" ? "ส่วนต่างความปลอดภัย MOS สูงถึง 35.5% ธุรกิจสำรวจพลังงานขนาดใหญ่ ปลอดหนี้สินสุทธิ" : "Massive 35.5% Margin of Safety. Debt-free exploration compounder.",
        CPALL: lang === "th" ? "เจ้าตลาดสะดวกซื้อ 7-Eleven ผูกขาดค้าปลีกไทย ราคาถูกเกินจริง มี MOS 26.1%" : "Consumer retail monopoly (7-Eleven) with solid 26.1% safety margin.",
        BDMS: lang === "th" ? "เครือโรงพยาบาลเอกชนขนาดใหญ่ที่สุดของไทย ลูกค้าชาวต่างชาติหนาแน่น มั่งคั่งต้านโรค" : "Healthcare monopoly. Defensive capital backed by private medical tourism.",
      } as Record<string, string>,
    },
  };

  const actionItems = [
    {
      href: "/stocks",
      title: lang === "th" ? "ค้นหาและคัดกรองหุ้น" : "Screen Stocks",
      desc:
        lang === "th"
          ? "หาโอกาสจากหุ้น undervalue, ปันผลสูง และหุ้นพื้นฐานดี"
          : "Find undervalued, dividend, and high-quality stocks.",
      icon: <Gauge className="h-4.5 w-4.5" />,
    },
    {
      href: "/dcf-calculator",
      title: lang === "th" ? "คำนวณ DCF" : "Run DCF",
      desc:
        lang === "th"
          ? "ประเมินมูลค่าหุ้นด้วย Free Cash Flow, WACC และ Terminal Value"
          : "Estimate fair value using FCF, WACC, and terminal value.",
      icon: <Calculator className="h-4.5 w-4.5" />,
    },
    {
      href: "/portfolio",
      title: lang === "th" ? "จัดการพอร์ต" : "Manage Portfolio",
      desc:
        lang === "th"
          ? "ติดตามต้นทุน มูลค่าพอร์ต และสัญญาณ Margin of Safety"
          : "Track cost, value, and margin-of-safety signals.",
      icon: <CircleDollarSign className="h-4.5 w-4.5" />,
    },
    {
      href: "/watchlist",
      title: lang === "th" ? "ดู Watchlist" : "Open Watchlist",
      desc:
        lang === "th"
          ? "ติดตามหุ้นที่สนใจและจังหวะเข้าซื้ออย่างเป็นระบบ"
          : "Follow your target stocks and entry opportunities.",
      icon: <Star className="h-4.5 w-4.5" />,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-2 animate-fade-up">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* 1. WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl text-ink">
            {welcomeText}
          </h1>
          <p className="mt-1 text-xs text-muted">
            {currentDate} | {t("dashboard.subtitle")}
          </p>
        </div>
        <Badge tone="gold" className="px-3.5 py-1 text-xs font-semibold self-start md:self-auto flex items-center gap-1.5 shadow-glow">
          <Crown className="h-3.5 w-3.5 text-gold shrink-0 animate-pulse" /> {t("common.currentPlan")}: {plan.name}
        </Badge>
      </div>

      {/* 2. QUICK ACTION CONTROL CENTER */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actionItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl border border-line bg-surface/35 p-4 transition hover:border-brand/45 hover:bg-brand/5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                {item.icon}
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
            </div>
            <h2 className="mt-3 font-display text-sm font-black text-ink group-hover:text-brand">
              {item.title}
            </h2>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">
              {item.desc}
            </p>
          </Link>
        ))}
      </section>

      {/* 3. REAL-TIME MARKET INDICES ROW */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MarketIndexCard
          title={t("dashboard.thaiMarket")}
          value="1,385.42"
          change="+0.45%"
          points={["1378", "1380", "1382", "1381", "1385"]}
          up={true}
        />
        <MarketIndexCard
          title={t("dashboard.usMarket")}
          value="5,277.51"
          change="-0.12%"
          points={["5290", "5285", "5280", "5275", "5277"]}
          up={false}
        />
        <MarketIndexCard
          title={lang === "th" ? "Bitcoin Index (BTC/USD)" : "Bitcoin Index (BTC)"}
          value="$67,500.00"
          change="+1.25%"
          points={["66500", "66800", "67100", "67300", "67500"]}
          up={true}
        />
        <MarketIndexCard
          title={lang === "th" ? "Gold Spot Index" : "Gold Spot Index"}
          value="$2,340.50"
          change="+0.82%"
          points={["2320", "2325", "2330", "2335", "2340.50"]}
          up={true}
        />
      </div>

      {/* 4. CORE SUMMARY STATS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryStat
          icon={<TrendingUp className="h-5 w-5" />}
          label={t("dashboard.underValuedCount")}
          value={lang === "th" ? `${undervalued} ตัว` : `${undervalued} Assets`}
          sub={lang === "th" ? `จากหุ้นทั้งหมด ${STOCKS.length} ตัว` : `Out of ${STOCKS.length} total`}
        />
        <SummaryStat
          icon={<Gauge className="h-5 w-5" />}
          label={lang === "th" ? "ส่วนเผื่อความปลอดภัยสูงสุด" : "Max Margin of Safety"}
          value={pct(ranked[0].v.marginOfSafety, 0)}
          sub={ranked[0].s.symbol}
          tone="up"
        />
        <SummaryStat
          icon={<Star className="h-5 w-5" />}
          label={t("common.watchlist")}
          value={lang === "th" ? `${watchlist.length} ตัว` : `${watchlist.length} Tickers`}
          sub={plan.limits.watchlist === "unlimited" ? (lang === "th" ? "บันทึกได้ไม่จำกัด" : "Unlimited tracking") : (lang === "th" ? `สูงสุด ${plan.limits.watchlist} ตัว` : `Max ${plan.limits.watchlist} items`)}
        />
      </div>

      {/* 5. PORTFOLIO STRATEGY WIZARD & GLOSSARY PORTAL */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* WIDGET 1: INTERACTIVE BEGINNER STRATEGY PORTABLE */}
        <Card className="lg:col-span-8 border border-line bg-surface/40 backdrop-blur-md p-5 flex flex-col justify-between rounded-2xl relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-brand animate-ping" />
          </div>

          <div className="space-y-4">
            {/* Header */}
            <div className="border-b border-line pb-3">
              <h3 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="h-4.5 w-4.5 text-brand" />
                {lang === "th" ? "ระบบจับคู่พอร์ตตามเป้าหมาย" : "Portfolio Strategy Guide"}
              </h3>
              <p className="text-[10px] text-muted mt-0.5">
                {lang === "th"
                  ? "เลือกสไตล์การลงทุนที่เหมาะกับคุณ เพื่อประเมินสัดส่วนและรายชื่อหุ้นที่คัดกรองให้อัตโนมัติ"
                  : "Pick your comfort zone and explore customized matchings dynamically with zero complex math."}
              </p>
            </div>

            {/* Quick Strategy Toggles */}
            <div className="grid grid-cols-3 gap-2 p-0.5 bg-elevate rounded-xl text-[10px] font-bold text-center">
              <button
                onClick={() => setActiveStrategy("dividend")}
                className={`py-2 rounded-lg transition ${
                  activeStrategy === "dividend"
                    ? "bg-surface text-brand shadow-sm border border-line/45"
                    : "text-muted hover:text-ink"
                }`}
              >
                {lang === "th" ? "ปันผลสูง" : "Dividend Yield"}
              </button>
              <button
                onClick={() => setActiveStrategy("growth")}
                className={`py-2 rounded-lg transition ${
                  activeStrategy === "growth"
                    ? "bg-surface text-brand shadow-sm border border-line/45"
                    : "text-muted hover:text-ink"
                }`}
              >
                {lang === "th" ? "เติบโต" : "Tech Growth"}
              </button>
              <button
                onClick={() => setActiveStrategy("value")}
                className={`py-2 rounded-lg transition ${
                  activeStrategy === "value"
                    ? "bg-surface text-brand shadow-sm border border-line/45"
                    : "text-muted hover:text-ink"
                }`}
              >
                {lang === "th" ? "หุ้นคุณค่า" : "Value Moats"}
              </button>
            </div>

            {/* Strategy descriptive info */}
            <div className="p-3 bg-elevate/30 border border-line/60 rounded-xl space-y-1.5">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-extrabold text-ink">
                  {lang === "th" ? strategyDetails[activeStrategy].titleTh : strategyDetails[activeStrategy].titleEn}
                </h4>
                <span className="text-[9px] bg-brand-soft border border-brand/20 text-brand px-1.5 py-0.5 rounded-full font-bold">
                  {strategyDetails[activeStrategy].badge}
                </span>
              </div>
              <p className="text-[10px] text-muted leading-relaxed">
                {lang === "th" ? strategyDetails[activeStrategy].descTh : strategyDetails[activeStrategy].descEn}
              </p>
            </div>

            {/* RenderCurated match list */}
            <div className="space-y-2">
              <span className="text-[9px] uppercase font-bold text-muted tracking-wider block">
                {lang === "th" ? "3 หุ้นเด่นตามเป้าหมาย (Curated Matches):" : "3 Key target picks for your strategy:"}
              </span>
              <div className="grid gap-2 sm:grid-cols-3">
                {strategyDetails[activeStrategy].stocks.map((symbol) => {
                  const s = getStock(symbol);
                  if (!s) return null;
                  const v = computeValuation(s, defaultDCFParams(s));
                  const watchedState = isWatched(s.symbol);
                  const isUp = v.marginOfSafety >= 0;

                  return (
                    <div
                      key={s.symbol}
                      className="p-3 border border-line rounded-xl bg-surface/60 hover:border-brand/40 transition flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <AssetLogo symbol={s.symbol} color={s.color} size="sm" />
                          <div>
                            <span className="font-display font-extrabold text-xs text-ink block leading-none">
                              {s.symbol}
                            </span>
                            <span className="text-[8px] text-muted truncate max-w-[80px] block mt-0.5">
                              {lang === "th" ? s.name : s.enName}
                            </span>
                          </div>
                        </div>

                        {/* Favorite switch */}
                        <button
                          onClick={() => toggleWatch(s.symbol)}
                          className={`p-1 rounded transition ${
                            watchedState ? "text-gold" : "text-muted hover:text-ink"
                          }`}
                          title={lang === "th" ? "บันทึกพอร์ตโปรด" : "Watchlist Toggle"}
                        >
                          <Star className="h-3.5 w-3.5" fill={watchedState ? "currentColor" : "none"} />
                        </button>
                      </div>

                      {/* Small details */}
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted">{lang === "th" ? "ราคาปัด" : "Price"}</span>
                          <span className="font-mono font-bold text-ink">{formatPrice(s, s.price)}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted">MOS %</span>
                          <span className={`font-mono font-bold ${isUp ? "text-up" : "text-down"}`}>
                            {isUp ? "+" : ""}
                            {v.marginOfSafety.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-line/45 text-[9px] text-muted leading-tight min-h-[28px] italic">
                        {strategyDetails[activeStrategy].insights[s.symbol]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4 pt-3 border-t border-line/45">
            <Link href="/compare" className="text-[10px] text-brand font-bold hover:underline flex items-center gap-0.5">
              {lang === "th" ? "นำพอร์ตแนะนำไปเปรียบเทียบในเครื่องมือใหญ่" : "Load these into Comparison Terminal"}
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* WIDGET 2: POP-UP FINANCIAL DICTIONARY (JARGON TRANSLATOR) */}
        <Card className="lg:col-span-4 border border-line bg-surface/40 backdrop-blur-md p-5 flex flex-col justify-between rounded-2xl">
          <div className="space-y-4">
            {/* Title */}
            <div className="border-b border-line pb-3">
              <h3 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5 uppercase tracking-wider">
                <Calculator className="h-4.5 w-4.5 text-brand" />
                {lang === "th" ? "พจนานุกรม VI ฉบับเข้าใจง่าย" : "Investment Glossary"}
              </h3>
              <p className="text-[10px] text-muted mt-0.5">
                {lang === "th"
                  ? "อธิบายศัพท์ภาษาหุ้นที่ยากที่สุด ให้เข้าใจง่ายภายใน 1 นาที"
                  : "De-jargonize institutional terms into plain human language."}
              </p>
            </div>

            {/* Glossary tabs selector */}
            <div className="flex flex-wrap gap-1 bg-elevate p-0.5 rounded-lg text-[9px] font-bold text-center">
              <button
                onClick={() => setActiveGlossary("mos")}
                className={`flex-1 py-1 rounded transition ${
                  activeGlossary === "mos" ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                MOS
              </button>
              <button
                onClick={() => setActiveGlossary("dcf")}
                className={`flex-1 py-1 rounded transition ${
                  activeGlossary === "dcf" ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                DCF
              </button>
              <button
                onClick={() => setActiveGlossary("roe")}
                className={`flex-1 py-1 rounded transition ${
                  activeGlossary === "roe" ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                ROE
              </button>
              <button
                onClick={() => setActiveGlossary("pe")}
                className={`flex-1 py-1 rounded transition ${
                  activeGlossary === "pe" ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                P/E
              </button>
              <button
                onClick={() => setActiveGlossary("de")}
                className={`flex-1 py-1 rounded transition ${
                  activeGlossary === "de" ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                D/E
              </button>
            </div>

            {/* Tab contents */}
            <div className="space-y-3 min-h-[170px] flex flex-col justify-between">
              {activeGlossary === "mos" && (
                <GlossaryContent
                  title="MOS (Margin of Safety)"
                  defTh="ส่วนลดราคาหลักทรัพย์เปรียบเทียบเหมือน ‘ป้ายลดราคาตลาด’"
                  defEn="The discount buffer between Market Price and computed Fair Value."
                  howTh="ยิ่ง MOS เป็นค่าบวกสูงๆ (เช่น เกิน 15%) แปลว่าเรามีโอกาสได้ซื้อหุ้นที่ดีในราคาเซลล์กระหน่ำ ช่วยลดการติดดอย"
                  howEn="Look for positive safety buffers. A higher MOS reduces your capital loss risk if valuations shift."
                  egTh="ถ้า Fair Value เท่ากับ 100 บาท แต่ราคาตลาดคือ 75 บาท แปลว่าหุ้นมีส่วนลดราคา MOS อยู่ที่ +25%"
                  egEn="Fair Value of 100 THB vs. Market Price of 75 THB translates to a positive +25% MOS."
                />
              )}

              {activeGlossary === "dcf" && (
                <GlossaryContent
                  title="DCF (Discounted Cash Flow)"
                  defTh="การหามูลค่าเหมาะสมจากกระแสเงินสดในอนาคตทั้งหมดแล้วลดมูลค่ากลับมา ณ วันนี้"
                  defEn="Valuing a business based on its projected future cash generation capacity discounted to present value."
                  howTh="ใช้ดูภาพจินตนาการทางคณิตศาสตร์ว่า ‘เงินสดสุทธิ’ ที่บริษัทจะสร้างได้จริงในอีก 5 ปีข้างหน้า คุ้มค่าเงินลงทุนไหม"
                  howEn="Enables auditing realistic long-term business potential over simple earnings per share numbers."
                  egTh="เหมือนการประเมินว่าควรเช่าซื้อสวนทุเรียนวันนี้ราคาเท่าไหร่ โดยเอาคาดการณ์ยอดทุเรียนที่จะขายได้ 5 ปีข้างหน้ามาหักลดหย่อนดอกเบี้ย"
                  egEn="Like appraising a rental condo by discounting the total rent you'll receive over 10 years."
                />
              )}

              {activeGlossary === "roe" && (
                <GlossaryContent
                  title="ROE (Return on Equity)"
                  defTh="ความสามารถของบริษัทในการเอาเงินทุนผู้ถือหุ้นไปผลิตผลตอบแทนกำไร"
                  defEn="How efficiently a company generates profits using equity funding."
                  howTh="บริษัทที่ดีควรมี ROE เกิน 12% ขึ้นไป ยิ่งตัวเลขนี้สูง แปลว่าทีมผู้บริหารเป็นคนเก่ง ทำกำไรได้รวดเร็วและคุ้มทุนดีเยี่ยม"
                  howEn="Seek values above 12%. Shows superior management ability in compounding shareholder capital."
                  egTh="คุณลงเงินทำร้านกาแฟกับหุ้นส่วน 100,000 บาท สิ้นปีร้านทำกำไรสุทธิคืนมา 15,000 บาท แปลว่า ROE ของร้านนี้เท่ากับ 15%"
                  egEn="Investing 100k THB into a franchise. If it yields 15k THB net profit annually, the ROE is 15%."
                />
              )}

              {activeGlossary === "pe" && (
                <GlossaryContent
                  title="P/E Ratio"
                  defTh="อัตราเปรียบเทียบระหว่างราคาหุ้นเทียบกับกำไรสุทธิที่ทำได้"
                  defEn="Price-to-Earnings multiple, measuring how much you pay per dollar of corporate profit."
                  howTh="จำง่ายๆ คือ ‘ระยะเวลาคืนทุนในสภาวะอุดมคติ’ หุ้น PE 10 เท่าแปลว่าเราคืนทุนใน 10 ปี ยิ่งตัวเลขนี้ต่ำยิ่งถูกและได้เปรียบ"
                  howEn="Lower is generally cheaper. A PE of 10 means it takes roughly 10 years of earnings to match your purchase cost."
                  egTh="หุ้นราคา 10 บาท บริษัททำกำไรต่อหุ้นปีละ 1 บาท แปลว่ามี P/E เท่ากับ 10 เท่า หากซื้อคุณจะใช้เวลาคืนทุนประมาณ 10 ปี"
                  egEn="Stock price at 10 THB with 1 THB EPS results in a 10x PE multiple."
                />
              )}

              {activeGlossary === "de" && (
                <GlossaryContent
                  title="D/E Ratio"
                  defTh="อัตราส่วนความแข็งแกร่งทางการเงิน - หนี้สินทั้งหมดเทียบกับทุนตัวเอง"
                  defEn="Debt-to-equity ratio, indicating financial risk and leverage capacity."
                  howTh="ใช้สแกนความเข้มแข็ง! ควรเลือกบริษัทที่มี D/E น้อยกว่า 1.5 เท่า ถ้าสูงเกิน 2 เท่าขึ้นไป แปลว่ากู้เงินมาทำธุรกิจมากเกินไป เสี่ยงล้มละลาย"
                  howEn="Lower means less leverage. A DE below 1.5x is conservative and safer during macroeconomic shocks."
                  egTh="บริษัทมีส่วนผู้ถือหุ้น 10 ล้านบาท แต่กู้เงินจากสถาบันการเงินรวม 5 ล้านบาท คิดเป็น D/E เท่ากับ 0.5 เท่า ปลอดภัยไร้กังวล"
                  egEn="Company with 10M THB in equity holding 5M THB in total debt represents a highly secure 0.5x D/E."
                />
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* 6. UNIQUE FX RATE & INBOUND TAX ESTIMATOR */}
      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3 border border-line bg-surface/30">
          <CardHeader
            title={lang === "th" ? "เครื่องมือคำนวณภาษีต่างประเทศ & FX" : "Foreign Capital Gains & FX Estimator"}
            subtitle={lang === "th" ? "คำนวณภาษีส่วนบุคคลเมื่อนำเงินเข้าไทยในปีภาษีเดียวกัน" : "Estimate Personal income tax liability under new Thai tax rules"}
            icon={<Calculator className="h-4.5 w-4.5 text-brand" />}
          />
          <div className="p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted font-medium block mb-1">
                  {lang === "th" ? "เงินได้นำเข้าต่างประเทศ (USD)" : "Inbound Overseas Income (USD)"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={foreignIncome}
                    onChange={(e) => setForeignIncome(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="input-base pr-12 text-sm font-semibold"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">$</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted font-medium block mb-1">
                  {lang === "th" ? "แปลงเป็นเงินบาท (อัตรา 36.45)" : "Equivalent in Thai Baht (Rate: 36.45)"}
                </label>
                <div className="input-base bg-elevate text-muted border-line flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">{num(incomeThb, 0)}</span>
                  <span className="font-bold text-muted">THB</span>
                </div>
              </div>
            </div>

            {/* Calculated brackets */}
            <div className="rounded-xl border border-line bg-elevate p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted block">{lang === "th" ? "ภาษีเงินได้ที่ต้องเสียโดยประมาณ" : "Estimated Thai Personal Tax"}</span>
                <span className="font-display font-extrabold text-lg text-down mt-1 block">
                  {estimatedTax === 0 
                    ? (lang === "th" ? "ยกเว้นภาษี (ต่ำกว่าเกณฑ์)" : "Exempted / Zero Tax") 
                    : `${num(estimatedTax, 0)} THB`}
                </span>
              </div>
              <Badge tone={estimatedTax > 0 ? "down" : "up"}>
                {estimatedTax > 0 ? (lang === "th" ? "เสียภาษี" : "Taxable") : (lang === "th" ? "ปลอดภาษี" : "Exempt")}
              </Badge>
            </div>

            <div className="text-[11px] text-muted leading-relaxed flex gap-2">
              <Info className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <span>
                {lang === "th" 
                  ? "ตัวเลขนี้เป็นเพียงการประมาณการเพื่อวางแผนเบื้องต้น ไม่ใช่คำปรึกษาภาษีอย่างเป็นทางการ อัตราและเงื่อนไขภาษีอาจเปลี่ยนได้ ควรตรวจสอบกับผู้เชี่ยวชาญหรือประกาศกรมสรรพากรก่อนยื่นจริง"
                  : "This is an estimate for planning only and is not formal tax advice. Rates and rules may change; consult a qualified tax professional or official tax guidance before filing."}
              </span>
            </div>
          </div>
        </Card>

        {/* AI Market Sentiment meter */}
        <Card className="md:col-span-2 border border-line bg-surface/30">
          <CardHeader
            title={lang === "th" ? "ความเชื่อมั่นตลาดหุ้นโดย AI" : "AI Market Sentiment"}
            subtitle={lang === "th" ? "ดัชนีชี้วัดสภาวะจิตวิทยา" : "Market greed vs. fear indicator"}
            icon={<Sparkles className="h-4.5 w-4.5 text-gold shrink-0 animate-pulse" />}
          />
          <div className="p-5 flex flex-col justify-between h-[calc(100%-60px)]">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-up/30 bg-up/10 px-3 py-1 text-xs font-bold text-up shadow-glow-up">
                {lang === "th" ? "โลภปานกลาง (64%)" : "Moderate Greed (64%)"}
              </div>
              <div className="mt-4 flex items-center justify-center gap-3">
                <span className="text-xs text-muted font-bold">Fear</span>
                <div className="h-3 w-40 bg-line rounded-full overflow-hidden relative border border-line">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-500 shadow-glow"
                    style={{ width: "64%" }}
                  />
                </div>
                <span className="text-xs text-muted font-bold">Greed</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted leading-relaxed border-t border-line/60 pt-4">
              <strong>AI Sentiment Highlight:</strong> {lang === "th" 
                ? "หุ้นปันผลไทยแข็งแกร่งรองรับดอกเบี้ยขาลง แต่กลุ่มพลังงานตึงตัว แนะนำเน้นกระจายพอร์ตหุ้น Tech สหรัฐฯ ที่ MOS ต่ำกว่ามูลค่า"
                : "Thai dividend stocks hold strong defensive values against global yield cuts. Keep accumulating US high-conviction growth during dips."}
            </p>
          </div>
        </Card>
      </div>

      {/* 7. CURATED TARGET CATEGORIES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-brand" /> {lang === "th" ? "พอร์ตแนะนำคัดแยกตามกลุ่มเป้าหมาย" : "Curated Target Categories"}
          </h2>
          <Link href="/stocks" className="text-xs text-brand hover:underline font-bold">
            {lang === "th" ? "สำรวจหุ้นทั้งหมด" : "Browse all assets"} →
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Thai High Yield Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                🇹🇭 {lang === "th" ? "หุ้นไทยเน้นปันผลสูง" : "Thai High-Yield Value"}
              </span>
              <Badge tone="up">High MOS</Badge>
            </div>
            <div className="grid gap-3">
              {topThai.map((r) => (
                <Link href={`/stocks/${r.s.symbol}`} key={r.s.symbol} className="surface border border-line/75 rounded-xl p-3.5 flex items-center justify-between hover:border-brand/40 hover:shadow-glow transition group">
                  <div className="flex items-center gap-2">
                    <AssetLogo symbol={r.s.symbol} color={r.s.color} size="sm" />
                    <div>
                      <span className="font-bold text-xs text-ink block group-hover:text-brand transition">{r.s.symbol}</span>
                      <span className="text-[10px] text-muted block max-w-[120px] truncate">{lang === "th" ? r.s.name : r.s.enName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="num font-semibold text-xs text-ink block">{baht(r.s.price)}</span>
                    <span className="num text-[10px] text-up block">MOS +{num(r.v.marginOfSafety, 0)}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* US Tech & AI Growth Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                🇺🇸 {lang === "th" ? "หุ้นเติบโตสหรัฐฯ" : "US Tech & AI Growth"}
              </span>
              <Badge tone="gold">W-8BEN Reduced</Badge>
            </div>
            <div className="grid gap-3">
              {topUs.map((r) => (
                <Link href={`/stocks/${r.s.symbol}`} key={r.s.symbol} className="surface border border-line/75 rounded-xl p-3.5 flex items-center justify-between hover:border-brand/40 hover:shadow-glow transition group">
                  <div className="flex items-center gap-2">
                    <AssetLogo symbol={r.s.symbol} color={r.s.color} size="sm" />
                    <div>
                      <span className="font-bold text-xs text-ink block group-hover:text-brand transition">{r.s.symbol}</span>
                      <span className="text-[10px] text-muted block max-w-[120px] truncate">{r.s.enName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="num font-semibold text-xs text-ink block">{dollar(r.s.price)}</span>
                    <span className="num text-[10px] text-up block">MOS +{num(r.v.marginOfSafety, 0)}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Global Feeder Funds Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                📊 {lang === "th" ? "กองทุนรวมไทย" : "Thai Mutual Funds"}
              </span>
              <Badge tone="brand">Passive / Active</Badge>
            </div>
            <div className="grid gap-3">
              {topFunds.map((r) => (
                <Link href={`/stocks/${r.s.symbol}`} key={r.s.symbol} className="surface border border-line/75 rounded-xl p-3.5 flex items-center justify-between hover:border-brand/40 hover:shadow-glow transition group">
                  <div className="flex items-center gap-2">
                    <AssetLogo symbol={r.s.symbol} color={r.s.color} size="sm" />
                    <div>
                      <span className="font-bold text-xs text-ink block group-hover:text-brand transition">{r.s.symbol}</span>
                      <span className="text-[10px] text-muted block max-w-[120px] truncate">{lang === "th" ? r.s.name : r.s.enName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="num font-semibold text-xs text-ink block">{nav(r.s.price)}</span>
                    <span className="text-[10px] text-muted block font-mono">Risk {r.s.riskLevel || 6}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* US Mutual Funds Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                🇺🇸 {lang === "th" ? "กองทุนรวมสหรัฐฯ" : "US Mutual Funds"}
              </span>
              <Badge tone="gold">Low Expense</Badge>
            </div>
            <div className="grid gap-3">
              {topUsFunds.map((r) => (
                <Link href={`/stocks/${r.s.symbol}`} key={r.s.symbol} className="surface border border-line/75 rounded-xl p-3.5 flex items-center justify-between hover:border-brand/40 hover:shadow-glow transition group">
                  <div className="flex items-center gap-2">
                    <AssetLogo symbol={r.s.symbol} color={r.s.color} size="sm" />
                    <div>
                      <span className="font-bold text-xs text-ink block group-hover:text-brand transition">{r.s.symbol}</span>
                      <span className="text-[10px] text-muted block max-w-[120px] truncate">{lang === "th" ? r.s.name : r.s.enName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="num font-semibold text-xs text-ink block">{formatPrice(r.s, r.s.price)}</span>
                    <span className="text-[10px] text-muted block font-mono">Exp {r.s.expenseRatio}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Cryptocurrency Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                🪙 {lang === "th" ? "สินทรัพย์ดิจิทัล" : "Cryptocurrencies"}
              </span>
              <Badge tone="up">24/7 Market</Badge>
            </div>
            <div className="grid gap-3">
              {topCrypto.map((r) => (
                <Link href={`/stocks/${r.s.symbol}`} key={r.s.symbol} className="surface border border-line/75 rounded-xl p-3.5 flex items-center justify-between hover:border-brand/40 hover:shadow-glow transition group">
                  <div className="flex items-center gap-2">
                    <AssetLogo symbol={r.s.symbol} color={r.s.color} size="sm" />
                    <div>
                      <span className="font-bold text-xs text-ink block group-hover:text-brand transition">{r.s.symbol}</span>
                      <span className="text-[10px] text-muted block max-w-[120px] truncate">{lang === "th" ? r.s.name : r.s.enName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="num font-semibold text-xs text-ink block">{formatPrice(r.s, r.s.price)}</span>
                    <span className="text-[10px] text-muted block font-mono">{r.s.cryptoConsensus === "Proof of Work (PoW)" ? "PoW" : "PoS"}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Futures Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                📈 {lang === "th" ? "สัญญาซื้อขายล่วงหน้า" : "Futures & Commodities"}
              </span>
              <Badge tone="brand">Leveraged</Badge>
            </div>
            <div className="grid gap-3">
              {topFutures.map((r) => (
                <Link href={`/stocks/${r.s.symbol}`} key={r.s.symbol} className="surface border border-line/75 rounded-xl p-3.5 flex items-center justify-between hover:border-brand/40 hover:shadow-glow transition group">
                  <div className="flex items-center gap-2">
                    <AssetLogo symbol={r.s.symbol} color={r.s.color} size="sm" />
                    <div>
                      <span className="font-bold text-xs text-ink block group-hover:text-brand transition">{r.s.symbol}</span>
                      <span className="text-[10px] text-muted block max-w-[120px] truncate">{lang === "th" ? r.s.name : r.s.enName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="num font-semibold text-xs text-ink block">{formatPrice(r.s, r.s.price)}</span>
                    <span className="text-[10px] text-muted block font-mono">Lev {r.s.leverage}x</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 8. WATCHLIST PREVIEW LIST */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Star className="h-5 w-5 text-gold animate-pulse" /> {t("dashboard.watchlistSummary")}
          </h2>
          <Link href="/watchlist" className="text-xs text-brand hover:underline font-bold">
            {lang === "th" ? "จัดการรายการโปรด" : "Manage Watchlist"} →
          </Link>
        </div>
        {watched.length === 0 ? (
          <Card className="p-8 text-center border border-dashed border-line">
            <Star className="mx-auto h-8 w-8 text-muted" />
            <h3 className="mt-3 font-display text-base font-black text-ink">
              {lang === "th" ? "เริ่มสร้าง Watchlist แรกของคุณ" : "Start Your First Watchlist"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-xs text-muted leading-relaxed">
              {t("watchlist.noStocks")}
            </p>
            <Link href="/stocks">
              <Button className="mt-5" size="sm">
                {lang === "th" ? "ไปเลือกหุ้นที่สนใจ" : "Browse Stocks"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {watched.map((s) => s && <StockCard key={s.symbol} stock={s} />)}
          </div>
        )}
      </section>
    </div>
  );
}

// ================== GLOSSARY CONTENT HELPER COMPONENT ==================
function GlossaryContent({
  title,
  defTh,
  defEn,
  howTh,
  howEn,
  egTh,
  egEn,
}: {
  title: string;
  defTh: string;
  defEn: string;
  howTh: string;
  howEn: string;
  egTh: string;
  egEn: string;
}) {
  const { lang } = useTranslation();
  const definition = lang === "th" ? defTh : defEn;
  const usage = lang === "th" ? howTh : howEn;
  const example = lang === "th" ? egTh : egEn;

  return (
    <div className="space-y-3 animate-fade-up">
      <div>
        <span className="text-xs font-mono font-black text-brand block">{title}</span>
        <p className="text-[11px] text-ink font-bold mt-1 leading-normal">
          {definition}
        </p>
      </div>

      <div className="border-t border-line/45 pt-2">
        <span className="text-[9px] uppercase font-bold text-muted block tracking-wider">
          {lang === "th" ? "วิธีประยุกต์ใช้ช่วยตัดสินใจ" : "How to use it"}
        </span>
        <p className="text-[10px] text-muted leading-relaxed mt-0.5">
          {usage}
        </p>
      </div>

      <div className="bg-elevate/45 border border-line/50 p-2 rounded-lg text-[9px] text-muted leading-normal">
        <strong>{lang === "th" ? "ตัวอย่างเชิงปฏิบัติ:" : "Practical example:"}</strong> {example}
      </div>
    </div>
  );
}

function MarketIndexCard({
  title,
  value,
  change,
  points,
  up,
}: {
  title: string;
  value: string;
  change: string;
  points: string[];
  up: boolean;
}) {
  const data = points.map((v) => parseFloat(v));
  return (
    <Card className="p-4 border border-line flex items-center justify-between bg-surface/30">
      <div>
        <span className="text-xs text-muted font-bold">{title}</span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="num font-display text-lg font-bold text-ink">{value}</span>
          <span className={`num text-xs font-semibold ${up ? "text-up" : "text-down"}`}>
            {up ? "▲" : "▼"} {change}
          </span>
        </div>
      </div>
      <div className="h-10 w-24 shrink-0">
        <Sparkline data={data} up={up} />
      </div>
    </Card>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  sub,
  tone = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: "brand" | "up";
}) {
  return (
    <Card className="p-5 border border-line bg-surface/30 hover:border-brand/40 transition">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted font-bold">{label}</span>
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl ${
            tone === "up" ? "bg-up/10 text-up" : "bg-brand-soft text-brand"
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="num mt-3 font-display text-2xl font-bold text-ink">{value}</div>
      <div className="num text-xs text-muted font-mono">{sub}</div>
    </Card>
  );
}

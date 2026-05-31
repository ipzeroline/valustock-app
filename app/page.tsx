"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PlanCard } from "@/components/PlanCard";
import { PLANS } from "@/lib/plans";
import { STOCKS } from "@/lib/stocks";
import { computeValuation, defaultDCFParams } from "@/lib/valuation";
import { baht, pct, num } from "@/lib/format";
import { Sparkline } from "@/components/Charts";
import { AssetLogo } from "@/components/AssetLogo";
import { useTranslation } from "@/lib/translations";
import {
  Calculator,
  Gauge,
  Filter,
  Layers,
  Star,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Shield,
  ChevronRight,
} from "@/lib/icons";

interface Article {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  summary: string;
  tag: string;
  gradient: string;
}

const FEATURED_ARTICLES_TH: Article[] = [
  {
    id: "tech-vs-dividend",
    title: "หุ้นเทคโนโลยีสหรัฐฯ vs หุ้นปันผลไทย: จัดพอร์ตอย่างไรในครึ่งปีหลัง?",
    category: "จัดพอร์ตการลงทุน",
    date: "30 พ.ค. 2026",
    readTime: "5 นาที",
    tag: "แนะจัดพอร์ต",
    gradient: "from-blue-600/20 to-purple-600/20 text-purple-400 border-purple-500/20",
    summary: "เจาะลึกโครงสร้างอุตสาหกรรมในตลาดหุ้นสหรัฐฯ (US tech) และตลาดหุ้นไทย (Value/Dividend) พร้อมวิเคราะห์วิธีลดความเสี่ยงจากอัตราแลกเปลี่ยนภาษีนำเข้าเงินกลับประเทศแบบใหม่"
  },
  {
    id: "feeder-funds-guide",
    title: "คู่มือเลือกกองทุนรวม Feeder Fund สำหรับคนไทย: เลี่ยงค่าธรรมเนียมซ้ำซ้อน",
    category: "กองทุนรวมต่างประเทศ",
    date: "29 พ.ค. 2026",
    readTime: "4 นาที",
    tag: "สำหรับกองทุน",
    gradient: "from-emerald-600/20 to-teal-600/20 text-teal-400 border-teal-500/20",
    summary: "เข้าใจความเชื่อมโยงระหว่างกองทุนไทย (Feeder Fund) และกองทุนหลักต่างประเทศ (Master Fund) เคล็ดลับดูค่าธรรมเนียมแฝงไม่ให้ผลตอบแทนตกหล่น"
  },
  {
    id: "w-8ben-tax-tips",
    title: "เจาะลึกวิธียื่นแบบฟอร์ม W-8BEN เพื่อลดภาษีปันผลหุ้นสหรัฐฯ เหลือ 15%",
    category: "ภาษี & กฎหมาย",
    date: "28 พ.ค. 2026",
    readTime: "6 นาที",
    tag: "ความรู้ภาษี",
    gradient: "from-amber-600/20 to-red-600/20 text-amber-400 border-amber-500/20",
    summary: "ขั้นตอนละเอียดสำหรับนักลงทุนที่เปิดพอร์ตนอกประเทศ เพื่อรับสิทธิ์ลดหย่อนภาษีหัก ณ ที่จ่ายจากปันผลสหรัฐฯ จากปกติ 30% ให้เหลือเพียง 15% ตามอนุสัญญาภาษีซ้อน"
  }
];

const FEATURED_ARTICLES_EN: Article[] = [
  {
    id: "tech-vs-dividend",
    title: "US Technology vs. Thai Dividend Stocks: How to Allocate in 2H2026?",
    category: "Asset Allocation",
    date: "May 30, 2026",
    readTime: "5 mins",
    tag: "Portfolio Tips",
    gradient: "from-blue-600/20 to-purple-600/20 text-purple-400 border-purple-500/20",
    summary: "A deep dive into industrial structures of the US Tech and Thai Dividend sectors, detailing global growth strategies alongside inbound personal tax updates for Thai citizens."
  },
  {
    id: "feeder-funds-guide",
    title: "Thai Feeder Funds Handbook: Avoid Double-Layer Management Fees",
    category: "Offshore Mutual Funds",
    date: "May 29, 2026",
    readTime: "4 mins",
    tag: "Fund Analysis",
    gradient: "from-emerald-600/20 to-teal-600/20 text-teal-400 border-teal-500/20",
    summary: "Understand the mechanics connecting Thai local Feeder Funds to global Master Funds. Discover hidden expense ratios to keep your compounding yields intact."
  },
  {
    id: "w-8ben-tax-tips",
    title: "Step-by-Step W-8BEN Filing Guide to Halve US Withholding Dividend Taxes",
    category: "Taxation & Regulation",
    date: "May 28, 2026",
    readTime: "6 mins",
    tag: "Tax Education",
    gradient: "from-amber-600/20 to-red-600/20 text-amber-400 border-amber-500/20",
    summary: "A complete walk-through for international investors filing W-8BEN certificates to lower US dividend withholding taxes from 30% down to 15% under double-taxation treaties."
  }
];

export default function Landing() {
  const { t, lang } = useTranslation();
  const demo = STOCKS[1]; // AOT
  const val = computeValuation(demo, defaultDCFParams(demo));

  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  
  useEffect(() => {
    fetch("/api/admin/articles")
      .then((res) => res.json())
      .then((data) => {
        if (data.articles && data.articles.length > 0) {
          const mapped = data.articles.slice(0, 3).map((a: any) => {
            const isAapl = a.tag === "AAPL";
            const isNvda = a.tag === "NVDA";
            const isMsft = a.tag === "MSFT";
            let gradient = "from-amber-600/20 to-red-600/20 text-amber-400 border-red-500/20";
            if (isAapl) gradient = "from-blue-600/20 to-purple-600/20 text-purple-400 border-purple-500/20";
            if (isNvda) gradient = "from-emerald-600/20 to-teal-600/20 text-teal-400 border-teal-500/20";
            if (isMsft) gradient = "from-blue-600/20 to-cyan-600/20 text-cyan-400 border-cyan-500/20";

            return {
              id: a.slug,
              title: a.title,
              category: a.category || (lang === "th" ? "ข่าวด่วนเชิงลึก" : "Hot News Analysis"),
              date: a.created_at ? new Date(a.created_at).toLocaleDateString(lang === "th" ? "th-TH" : "en-US") : (lang === "th" ? "วันนี้" : "Today"),
              readTime: a.read_time || (lang === "th" ? "5 นาที" : "5 mins"),
              tag: a.tag || "News",
              gradient: gradient,
              summary: a.summary || "",
            };
          });
          setDbArticles(mapped);
        }
      })
      .catch((err) => console.error("Error fetching homepage articles:", err));
  }, [lang]);

  const articlesList = useMemo(() => {
    const mocks = lang === "th" ? FEATURED_ARTICLES_TH : FEATURED_ARTICLES_EN;
    const combined = [...dbArticles, ...mocks];
    const seen = new Set<string>();
    const unique: Article[] = [];
    for (const art of combined) {
      if (!seen.has(art.id)) {
        seen.add(art.id);
        unique.push(art);
      }
    }
    return unique.slice(0, 3); // Show top 3 featured articles
  }, [dbArticles, lang]);

  const features = [
    {
      icon: Calculator,
      title: t("landing.f1Title"),
      desc: t("landing.f1Desc"),
    },
    {
      icon: Gauge,
      title: t("landing.f2Title"),
      desc: t("landing.f2Desc"),
    },
    {
      icon: Filter,
      title: t("landing.f3Title"),
      desc: t("landing.f3Desc"),
    },
    {
      icon: Layers,
      title: t("landing.f4Title"),
      desc: t("landing.f4Desc"),
    },
    {
      icon: Star,
      title: t("landing.f5Title"),
      desc: t("landing.f5Desc"),
    },
    {
      icon: Shield,
      title: t("landing.f6Title"),
      desc: t("landing.f6Desc"),
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* Structured JSON-LD Data for Search Engine Crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                "@id": "https://valustock.app/#software",
                "url": "https://valustock.app",
                "name": "ValuStock",
                "applicationCategory": "FinancialApplication",
                "operatingSystem": "All",
                "description": "Professional stock valuation and intrinsic value calculation platform featuring DCF Modeling, Graham Number calculations, and high Margin-of-Safety screeners for Thai and US stock markets.",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "THB",
                  "category": "FreeTrial"
                },
                "screenshot": "https://valustock.app/og-image.png"
              },
              {
                "@type": "WebSite",
                "@id": "https://valustock.app/#website",
                "url": "https://valustock.app",
                "name": "ValuStock — แพลตฟอร์มประเมินมูลค่าสินทรัพย์ระดับโลก",
                "description": "เครื่องมือประเมินมูลค่าสินทรัพย์และเทอร์มินัลการเงินระดับสถาบัน วิเคราะห์ครบทั้งหุ้นโลก คริปโตเคอร์เรนซี และฟิวเจอร์ส",
                "publisher": {
                  "@id": "https://valustock.app/#organization"
                },
                "inLanguage": "th"
              },
              {
                "@type": "Organization",
                "@id": "https://valustock.app/#organization",
                "name": "ValuStock",
                "url": "https://valustock.app",
                "logo": "https://valustock.app/logo.png"
              }
            ]
          })
        }}
      />

      {/* HERO */}
      <section className="relative">
        <div className="aurora absolute inset-0 -z-10" />
        <div className="grid-lines absolute inset-0 -z-10 opacity-60" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:py-24 lg:grid-cols-2 lg:gap-8">
          <div className="animate-fade-up">
            <span className="chip border-brand/30 bg-brand/10 text-brand">
              <Sparkles className="h-3.5 w-3.5" /> {t("landing.badge")}
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
              {t("landing.title1")}
              <br />
              <span className="text-brand">{t("landing.title2")}</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted md:text-lg">
              {t("landing.subtitle")}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/pricing">
                <Button size="lg">
                  {t("common.startFree")} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/stocks">
                <Button size="lg" variant="outline">
                  {t("landing.exploreBtn")}
                </Button>
              </Link>
            </div>
            <div className="mt-9 flex gap-8">
              <Stat value={`${STOCKS.length}+`} label={t("landing.statStocks")} />
              <Stat value="3" label={t("landing.statModels")} />
              <Stat value={t("common.startFree")} label={t("landing.statStart")} />
            </div>
          </div>

          {/* floating valuation card */}
          <div className="animate-fade-up [animation-delay:120ms]">
            <div className="surface mx-auto max-w-sm rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AssetLogo symbol={demo.symbol} color={demo.color} size="md" />
                  <div>
                    <div className="font-display font-bold">{demo.symbol}</div>
                    <div className="text-xs text-muted">{demo.name}</div>
                  </div>
                </div>
                <span className={`chip ${val.verdict === "undervalued" ? "border-up/30 bg-up/10 text-up" : "border-down/30 bg-down/10 text-down"}`}>
                  {t(`verdict.${val.verdict}`)}
                </span>
              </div>
              <div className="my-4 h-14">
                <Sparkline data={demo.priceHistory} up />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Mini label={t("landing.marketPrice")} value={baht(demo.price)} />
                <Mini
                  label={t("landing.fairValue")}
                  value={baht(val.fairValue)}
                  accent
                />
                <Mini label="P/E" value={num(val.ratios.pe, 1)} />
                <Mini
                  label={t("landing.marginOfSafety")}
                  value={pct(val.marginOfSafety, 0)}
                  up={val.marginOfSafety >= 0}
                />
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-2.5 text-xs text-brand">
                <TrendingUp className="h-4 w-4" />
                {t("landing.floatingTitle")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-16">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {t("landing.featuresTitle")}
          </h2>
          <p className="mt-3 text-muted">
            {t("landing.featuresSubtitle")}
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="surface rounded-2xl p-6 transition hover:border-brand/40 animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 📰 FINANCIAL NEWS & INSIGHTS (SEO & ENGAGEMENT UPGRADE) */}
      <section id="insights" className="mx-auto max-w-6xl px-5 py-16 border-t border-line/60">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div className="max-w-xl">
            <span className="chip border-brand/30 bg-brand/10 text-brand mb-2 inline-flex items-center gap-1.5 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" /> 
              {lang === "th" ? "ข่าวสารและบทวิเคราะห์พิเศษ" : "Featured Market Insights"}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl text-ink leading-tight">
              {lang === "th" ? "เกาะติดวิเคราะห์มูลค่า & เทรนด์การลงทุน" : "Compounding Knowledge & Financial Intelligence"}
            </h2>
            <p className="mt-3 text-muted text-xs sm:text-sm leading-relaxed font-semibold">
              {lang === "th"
                ? "อัปเดตบทวิเคราะห์ระดับสากล ปัจจัยภาษี ทิศทางกระดานหุ้นไทยและต่างประเทศ เพื่อให้คุณไม่พลาดทุกแต้มต่อในการลงทุน"
                : "Deep dives into valuation methods, cross-border tax rebalancing, and global market signals to sharpen your investment edge."}
            </p>
          </div>
          
          <Link href="/insights">
            <Button variant="outline" className="flex items-center gap-2 font-bold hover:scale-[1.02] active:scale-95 transition text-xs sm:text-sm">
              {lang === "th" ? "อ่านข่าวทั้งหมด" : "Explore All News"} 
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {articlesList.map((art, idx) => {
            return (
              <article 
                key={art.id} 
                className="group relative flex flex-col justify-between surface rounded-2xl p-6 border border-line/60 hover:border-brand/40 hover:shadow-lg transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="space-y-4">
                  {/* Category and Read time metadata */}
                  <div className="flex items-center justify-between">
                    <span className={`chip border px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold leading-none ${art.gradient}`}>
                      {art.category}
                    </span>
                    <span className="text-xs text-muted font-mono flex items-center gap-1 font-semibold">
                      ⏱️ {art.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-sm sm:text-base font-bold text-ink leading-snug group-hover:text-brand transition duration-200">
                    <Link href={`/insights?article=${art.id}`}>
                      {art.title}
                    </Link>
                  </h3>

                  {/* Summary description */}
                  <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-3 font-medium">
                    {art.summary}
                  </p>
                </div>

                {/* Bottom section */}
                <div className="mt-6 pt-4 border-t border-line/45 flex items-center justify-between">
                  <span className="text-[10px] text-muted font-bold tracking-wider font-mono">
                    📅 {art.date}
                  </span>
                  
                  <Link href={`/insights?article=${art.id}`} className="text-xs text-brand font-extrabold flex items-center gap-1 hover:underline">
                    {lang === "th" ? "อ่านต่อบทความ" : "Read Full"} 
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition duration-200" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {t("common.pricing")}
          </h2>
          <p className="mt-3 text-muted">
            {t("pricing.subtitle")}
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} billing="monthly" />
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          {t("common.currencyThb")} · {t("pricing.subscribeBtn")}
        </p>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-10 text-center md:p-16">
          <div className="aurora absolute inset-0 -z-10 opacity-70" />
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            {t("landing.ctaSubtitle")}
          </p>
          <Link href="/login">
            <Button size="lg" className="mt-6">
              {t("common.signUp")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <p className="mt-8 text-center text-xs text-muted">
          ⚠️ Disclaimer: ValuStock provides simulated historical data for demo and analysis support purposes only.
        </p>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-extrabold text-ink">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function Mini({
  label,
  value,
  accent,
  up,
}: {
  label: string;
  value: string;
  accent?: boolean;
  up?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-bg px-3 py-2.5">
      <div className="text-[11px] text-muted">{label}</div>
      <div
        className={`num mt-0.5 font-semibold ${
          accent ? "text-gold" : up === false ? "text-down" : up ? "text-up" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

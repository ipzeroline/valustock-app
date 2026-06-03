import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, FileText, ChevronRight, Search, Mail, Crown } from "@/lib/icons";
import { blogArticles } from "@/lib/blogArticles";
import { moneyKeywordLinks, seoClusters } from "@/lib/seoClusters";

export const metadata: Metadata = {
  title: "บทวิเคราะห์หุ้นและ ETF 2 ภาษา | S&P 500 Nasdaq TISCO KBANK PTTEP",
  description:
    "รวมบทวิเคราะห์หุ้นและ ETF 2 ภาษาแบบ SEO สำหรับ S&P 500, Nasdaq, Nasdaq-100, ETF, TISCO, KBANK, PTTEP, BBL และ ADVANC",
  alternates: {
    canonical: "https://valustock.com/blog",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/blog",
    title: "บทวิเคราะห์หุ้นและ ETF 2 ภาษา | ValuStock",
    description:
      "อ่านบทวิเคราะห์หุ้นไทย หุ้นสหรัฐ และ ETF เชิงลึกพร้อมภาษาอังกฤษ สำหรับนักลงทุนที่ต้องการดูวิธีเริ่มลงทุน valuation ปันผล และความเสี่ยง",
    siteName: "ValuStock",
  },
};

export default function BlogIndexPage() {
  const funnelSteps = [
    {
      titleTh: "Google Search Ads",
      titleEn: "Google Search Ads",
      bodyTh: "ยิงคำค้นที่มี intent สูง เช่น หุ้นปันผลสูง 2569, หุ้นธนาคารตัวไหนดี, TISCO vs KBANK และหุ้น PTTEP ดีไหม",
      bodyEn: "Capture high-intent searches such as dividend stocks, Thai bank stocks, stock comparisons and PTTEP analysis.",
      icon: Search,
    },
    {
      titleTh: "บทความ SEO 2 ภาษา",
      titleEn: "Bilingual SEO Articles",
      bodyTh: "พาผู้ใช้จากโฆษณาและ organic search เข้าบทวิเคราะห์ที่ตอบคำถามจริง มี FAQ, schema และข้อมูลเชิงลึก",
      bodyEn: "Send traffic to bilingual research pages with real answers, FAQ schema, valuation context and risk checklists.",
      icon: FileText,
    },
    {
      titleTh: "สมัครสมาชิกฟรี",
      titleEn: "Free Signup",
      bodyTh: "ให้ผู้ใช้ทดลอง watchlist, screener และ valuation tools โดยยังไม่ต้องจ่ายเงิน ลดแรงเสียดทานก่อน upsell",
      bodyEn: "Convert readers into free users through watchlists, screeners and valuation tools before asking for payment.",
      icon: BarChart3,
    },
    {
      titleTh: "Email Marketing",
      titleEn: "Email Marketing",
      bodyTh: "ส่งบทวิเคราะห์ต่อเนื่อง เช่น หุ้นธนาคารรายสัปดาห์ หุ้นปันผลเข้าเกณฑ์ และ alert มูลค่าเหมาะสม",
      bodyEn: "Nurture users with weekly bank-stock notes, dividend watchlists and fair-value alerts.",
      icon: Mail,
    },
    {
      titleTh: "ขาย Premium",
      titleEn: "Premium Conversion",
      bodyTh: "ปิดการขายด้วย pain point ที่ชัด เช่น DCF เต็มรูปแบบ, portfolio alerts, compare stocks และข้อมูลเชิงลึกกว่า free tier",
      bodyEn: "Upgrade users with clear value: full DCF tools, portfolio alerts, stock comparisons and deeper research workflows.",
      icon: Crown,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ValuStock Thai Stock Analysis Blog",
    url: "https://valustock.com/blog",
    hasPart: blogArticles.map((article) => ({
      "@type": "Article",
      headline: article.titleTh,
      url: `https://valustock.com/blog/${article.slug}`,
      datePublished: article.published,
      dateModified: article.modified,
    })),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="rounded-2xl border border-line bg-surface/55 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand">
          <FileText className="h-4 w-4" />
          Bilingual Equity Research
        </div>
        <h1 className="mt-4 max-w-3xl font-display text-3xl font-black leading-tight text-ink sm:text-5xl">
          บทวิเคราะห์หุ้นและ ETF 2 ภาษา สำหรับนักลงทุนที่ต้องการข้อมูลแน่นก่อนตัดสินใจ
        </h1>
        <p className="mt-4 max-w-3xl text-sm font-medium leading-relaxed text-muted sm:text-base">
          วิเคราะห์ S&P 500, Nasdaq, Nasdaq-100, ETF, TISCO, KBANK, PTTEP, BBL และ ADVANC
          ด้วยกรอบวิธีเริ่มลงทุน valuation, dividend quality, business model, risk checklist และคำถามที่นักลงทุนค้นหาบ่อย
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-brand">SEO + Ads Funnel</div>
            <h2 className="mt-2 font-display text-2xl font-black text-ink sm:text-3xl">
              Funnel ที่แนะนำ: จาก Google Search สู่สมาชิก Premium
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-muted">
              Use Google Search Ads to capture urgent investor questions, let bilingual SEO articles build trust,
              convert readers into free members, then nurture them with email until Premium becomes the natural next step.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-black text-bg shadow-soft transition hover:opacity-90"
          >
            สมัครสมาชิกฟรี
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {moneyKeywordLinks.map((item) => (
            <Link key={item.label} href={item.href} className="rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-bold text-muted hover:border-brand/40 hover:text-brand">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {funnelSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.titleTh} className="rounded-xl border border-line bg-bg p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="mt-3 text-[11px] font-black text-muted">STEP {index + 1}</div>
                <h3 className="mt-1 font-display text-base font-black text-ink">{step.titleTh}</h3>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-muted">{step.bodyTh}</p>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-muted" lang="en">{step.bodyEn}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand">
          <Search className="h-4 w-4" />
          SEO Topic Clusters
        </div>
        <h2 className="mt-2 font-display text-2xl font-black text-ink sm:text-3xl">
          โครงสร้างบทความที่ทำให้ Google เข้าใจว่า ValuStock เชี่ยวชาญด้านมูลค่าหุ้น
        </h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-muted">
          แต่ละ cluster ถูกออกแบบจาก search intent ก่อนซื้อหุ้นจริง ไม่ใช่ข่าวรายวัน เพื่อพาคนไทยจาก Google
          ไปสมัครสมาชิกฟรี ใช้ watchlist/screener แล้วค่อยอัปเกรด Premium เมื่ออยากวิเคราะห์ลึกขึ้น
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {seoClusters.map((cluster) => (
            <div key={cluster.title} className="rounded-xl border border-line bg-bg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={cluster.href} className="font-display text-lg font-black text-ink hover:text-brand">
                    {cluster.title}
                  </Link>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">{cluster.desc}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {cluster.links.slice(0, 8).map((link) => (
                  <Link key={`${cluster.title}-${link.label}`} href={link.href} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-bold text-muted hover:border-brand/40 hover:text-brand">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {blogArticles.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="group rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full border border-line bg-bg px-3 py-1 text-[11px] font-black text-muted">
                  <BarChart3 className="h-3.5 w-3.5" />
                  {article.symbol}
                </span>
                <h2 className="mt-4 font-display text-xl font-black leading-snug text-ink">
                  {article.titleTh}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
                  {article.descriptionTh}
                </p>
              </div>
              <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-brand" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {article.keywords.slice(0, 3).map((keyword) => (
                <span key={keyword} className="rounded-full bg-elevate px-2.5 py-1 text-[11px] font-bold text-muted">
                  {keyword}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}

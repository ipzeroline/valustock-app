"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  ArrowUpRight,
  AlertTriangle,
  Mail,
  Crown,
  Calculator,
  FileText,
  Layers,
  Shield,
  Sparkles,
  Target,
  Eye,
} from "@/lib/icons";
import type { BlogArticle } from "@/lib/blogArticles";
import { useTranslation } from "@/lib/translations";

type Props = {
  article: BlogArticle;
  related: BlogArticle[];
};

const VIEWER_ID_KEY = "valustock.articleViewerId";
const VIEWED_PREFIX = "valustock.articleViewed.";

const hasThaiText = (value: string) => /[\u0E00-\u0E7F]/.test(value);

function sectionId(index: number) {
  return `section-${index + 1}`;
}

function englishFaq(article: BlogArticle) {
  return [
    {
      q: `Is ${article.symbol} worth studying?`,
      a: article.verdictEn,
    },
    {
      q: `What should investors check before acting on ${article.symbol}?`,
      a: "Review valuation, business quality, cash flow, risk factors and position sizing before making any investment decision.",
    },
    {
      q: "Is this article investment advice?",
      a: "No. This article is educational research only. Investors should verify current data and consult a licensed professional when needed.",
    },
  ];
}

function getOrCreateVisitorId() {
  const existing = window.localStorage.getItem(VIEWER_ID_KEY);
  if (existing) return existing;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(VIEWER_ID_KEY, id);
  return id;
}

function formatViews(value: number, lang: "th" | "en") {
  return new Intl.NumberFormat(lang === "th" ? "th-TH" : "en-US").format(value);
}

function uniqueKeywords(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function BlogArticleClient({ article, related }: Props) {
  const { lang } = useTranslation();
  const [views, setViews] = useState(0);
  const isTh = lang === "th";
  const title = isTh ? article.titleTh : article.titleEn;
  const description = isTh ? article.descriptionTh : article.descriptionEn;
  const verdict = isTh ? article.verdictTh : article.verdictEn;
  const sections = isTh ? article.sectionsTh : article.sectionsEn;
  const faq = isTh ? article.faq : englishFaq(article);
  const imageSrc = `/article-image/${encodeURIComponent(article.slug)}?category=${encodeURIComponent(article.category)}&symbol=${encodeURIComponent(article.symbol)}&v=5`;
  const viewedKey = useMemo(() => `${VIEWED_PREFIX}${article.slug}`, [article.slug]);
  const topicKeywords = useMemo(
    () => uniqueKeywords([article.symbol, article.category, ...article.keywords]),
    [article.category, article.keywords, article.symbol],
  );
  const takeaways = [
    verdict,
    ...(sections[0]?.body || []),
  ].slice(0, 3);
  const internalLinks = [
    {
      href: "/dcf-calculator",
      icon: Calculator,
      label: isTh ? "คำนวณมูลค่าหุ้นด้วย DCF Calculator" : "Run a DCF Calculator",
      desc: isTh ? "ใช้กระแสเงินสดคิดลดเพื่อประเมินราคาเหมาะสม" : "Estimate fair value with discounted cash flow assumptions.",
    },
    {
      href: "/intrinsic-value-calculator",
      icon: Target,
      label: isTh ? "เช็ก Intrinsic Value และ Margin of Safety" : "Check Intrinsic Value And Margin Of Safety",
      desc: isTh ? "ดูส่วนต่างระหว่างราคาและมูลค่าที่ประเมินได้" : "Compare market price with estimated business value.",
    },
    {
      href: "/stocks",
      icon: Layers,
      label: isTh ? "ค้นหาหุ้นและ ETF เพิ่มเติม" : "Explore More Stocks And ETFs",
      desc: isTh ? "ใช้ screener เพื่อเทียบสินทรัพย์ในกลุ่มเดียวกัน" : "Screen comparable assets before building a watchlist.",
    },
  ];

  useEffect(() => {
    let cancelled = false;

    async function trackView() {
      try {
        const alreadyViewed = window.localStorage.getItem(viewedKey) === "1";
        const visitorId = getOrCreateVisitorId();

        if (alreadyViewed) {
          const res = await fetch(`/api/blog/views?slugs=${encodeURIComponent(article.slug)}`, { cache: "no-store" });
          const payload = await res.json();
          if (!cancelled) setViews(Number(payload.views?.[article.slug] || 0));
          return;
        }

        const res = await fetch("/api/blog/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: article.slug, visitorId }),
        });
        const payload = await res.json();
        if (!payload.error) window.localStorage.setItem(viewedKey, "1");
        if (!cancelled) setViews(Number(payload.views || 0));
      } catch {
        if (!cancelled) setViews(0);
      }
    }

    trackView();
    return () => {
      cancelled = true;
    };
  }, [article.slug, viewedKey]);

  return (
    <>
      <article className="space-y-8">
        <header className="rounded-2xl border border-line bg-surface/55 p-6 sm:p-8">
          <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
            <Link href="/blog" className="inline-flex items-center gap-1 hover:text-brand">
              <ArrowRight className="h-3.5 w-3.5 rotate-180" />
              Blog
            </Link>
            <span>/</span>
            <span className="text-brand">{article.symbol}</span>
          </nav>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] font-black text-brand">
              <BarChart3 className="h-3.5 w-3.5" />
              {article.category}
            </span>
            <span className="rounded-full border border-line bg-bg px-3 py-1 text-[11px] font-black text-muted">
              {isTh ? "อัปเดต" : "Updated"} {article.modified}
            </span>
            <span className="rounded-full border border-line bg-bg px-3 py-1 text-[11px] font-black text-muted">
              {article.readTime}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-line bg-bg px-3 py-1 text-[11px] font-black text-muted">
              <Eye className="h-3.5 w-3.5" />
              {isTh ? `${formatViews(views, lang)} อ่าน` : `${formatViews(views, lang)} reads`}
            </span>
          </div>
          <h1 className="mt-5 max-w-4xl font-display text-3xl font-black leading-tight text-ink sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-base font-semibold leading-relaxed text-muted">
            {description}
          </p>
        </header>

        <figure className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
          <img
            src={imageSrc}
            alt={isTh ? `ภาพสรุปบทวิเคราะห์ ${title}` : `${title} research summary cover`}
            width={1200}
            height={630}
            className="h-auto w-full object-contain"
            decoding="async"
            loading="eager"
          />
          <figcaption className="border-t border-line px-5 py-3 text-xs font-semibold text-muted">
            {isTh
              ? `ภาพรวมบทวิเคราะห์ ${article.symbol}: ${article.category}, valuation, ความเสี่ยง และข้อมูลที่ควรตรวจต่อ`
              : `${article.symbol} research overview: ${article.category}, valuation, risks and follow-up checks.`}
          </figcaption>
        </figure>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-black text-brand">
              <Sparkles className="h-5 w-5" />
              {isTh ? "สรุปประเด็นสำคัญก่อนอ่านต่อ" : "Key Takeaways Before You Continue"}
            </div>
            <div className="mt-4 space-y-3">
              {takeaways.map((item, index) => (
                <div key={item} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-black text-brand">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold leading-7 text-muted">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <nav className="rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-label={isTh ? "สารบัญบทความ" : "Article table of contents"}>
            <div className="flex items-center gap-2 text-sm font-black text-brand">
              <FileText className="h-5 w-5" />
              {isTh ? "สารบัญบทความ" : "Table Of Contents"}
            </div>
            <div className="mt-4 space-y-2">
              {sections.map((section, index) => (
                <a
                  key={section.heading}
                  href={`#${sectionId(index)}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-3 py-2 text-sm font-bold text-muted hover:border-brand/40 hover:text-brand"
                >
                  <span>{section.heading}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </a>
              ))}
              <a
                href="#faq"
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-3 py-2 text-sm font-bold text-muted hover:border-brand/40 hover:text-brand"
              >
                <span>{isTh ? "คำถามที่พบบ่อย" : "Frequently Asked Questions"}</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </a>
            </div>
          </nav>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {article.metrics.map((metric) => {
            const note = !isTh && hasThaiText(metric.note) ? "Research checkpoint for valuation and risk review." : metric.note;
            return (
              <div key={metric.label} className="rounded-2xl border border-line bg-surface p-4">
                <div className="text-[11px] font-black uppercase text-muted">{metric.label}</div>
                <div className="mt-2 font-display text-2xl font-black text-ink">{metric.value}</div>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">{note}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-brand/25 bg-brand/10 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-black text-brand">
            <CheckCircle className="h-5 w-5" />
            {isTh ? "มุมมองสรุปแบบมืออาชีพ" : "Professional verdict"}
          </div>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-ink sm:text-base">{verdict}</p>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-black text-brand">
            <Shield className="h-5 w-5" />
            {isTh ? "หัวข้อและคำค้นที่บทความนี้ครอบคลุม" : "Topics And Search Entities Covered"}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {topicKeywords.map((keyword) => (
              <span key={keyword} className="rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-black text-muted">
                {keyword}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand">
                <Mail className="h-4 w-4" />
                {isTh ? "ขั้นตอนต่อหลังอ่านบทวิเคราะห์" : "Next Research Step"}
              </div>
              <h2 className="mt-2 font-display text-2xl font-black text-ink">
                {isTh
                  ? `อ่านบทวิเคราะห์ ${article.symbol} แล้วต่อด้วยเครื่องมือประเมินมูลค่าฟรี`
                  : `Continue ${article.symbol} research with valuation tools`}
              </h2>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-muted">
                {isTh
                  ? "สมัครฟรีเพื่อสร้าง watchlist, ทดลองเปรียบเทียบหุ้น และรับบทวิเคราะห์ต่อเนื่องทางอีเมล ก่อนอัปเกรดเมื่อคุณต้องการ DCF, portfolio alerts และข้อมูลเชิงลึกมากขึ้น"
                  : "Start free with watchlists and comparison tools, then upgrade when deeper DCF workflows, alerts and research coverage become useful."}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-black text-bg shadow-soft transition hover:opacity-90"
              >
                {isTh ? "สมัครสมาชิกฟรี" : "Start Free"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-bg px-4 py-3 text-sm font-black text-ink transition hover:border-brand/40 hover:text-brand"
              >
                <Crown className="h-4 w-4" />
                {isTh ? "ดู Premium" : "View Premium"}
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {sections.map((section, index) => (
            <div id={sectionId(index)} key={section.heading} className="scroll-mt-24 rounded-2xl border border-line bg-surface p-5 sm:p-6">
              <h2 className="font-display text-2xl font-black text-ink">{section.heading}</h2>
              <div className="mt-4 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm font-medium leading-7 text-muted sm:text-base">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-black text-brand">
            <CheckCircle className="h-5 w-5" />
            {isTh ? "เช็กลิสต์ก่อนตัดสินใจลงทุน" : "Pre-Decision Research Checklist"}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(isTh
              ? [
                  "ตรวจราคาเทียบ fair value และ margin of safety",
                  "อ่านงบล่าสุด รายได้ กำไร กระแสเงินสด และหนี้สิน",
                  "เปรียบเทียบกับคู่แข่งหรือ ETF ในกลุ่มเดียวกัน",
                  "กำหนดสัดส่วนพอร์ต จุดทบทวน thesis และความเสี่ยงที่รับได้",
                ]
              : [
                  "Compare market price with fair value and margin of safety.",
                  "Review latest revenue, earnings, free cash flow and leverage.",
                  "Compare against peers or ETFs in the same exposure bucket.",
                  "Define allocation, thesis review points and acceptable risks.",
                ]
            ).map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-line bg-bg p-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <p className="text-sm font-semibold leading-6 text-muted">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-black text-brand">
            <Layers className="h-5 w-5" />
            {isTh ? "เครื่องมือที่ควรใช้ต่อจากบทความนี้" : "Tools To Use After This Article"}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {internalLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="rounded-xl border border-line bg-bg p-4 hover:border-brand/40">
                  <Icon className="h-5 w-5 text-brand" />
                  <div className="mt-3 text-sm font-black leading-snug text-ink">{item.label}</div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-muted">{item.desc}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="faq" className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-2xl font-black text-ink">
            {isTh ? `คำถามที่พบบ่อยเกี่ยวกับ ${article.symbol}` : `Frequently Asked Questions About ${article.symbol}`}
          </h2>
          <div className="mt-4 divide-y divide-line">
            {faq.map((item) => (
              <div key={item.q} className="py-4 first:pt-0 last:pb-0">
                <h3 className="font-display text-base font-black text-ink">{item.q}</h3>
                <p className="mt-2 text-sm font-medium leading-7 text-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h2 className="font-display text-lg font-black text-ink">
                {isTh ? "หมายเหตุด้านการลงทุน" : "Investment Disclaimer"}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-7 text-muted">
                {isTh
                  ? "บทความนี้จัดทำเพื่อการศึกษาและการวิเคราะห์ข้อมูลเท่านั้น ไม่ใช่คำแนะนำซื้อ ขาย หรือถือหลักทรัพย์ นักลงทุนควรตรวจสอบข้อมูลล่าสุดจากบริษัท ตลาดหลักทรัพย์ และที่ปรึกษาการลงทุนที่ได้รับอนุญาตก่อนตัดสินใจ"
                  : "This article is for education and research only. It is not a recommendation to buy, sell or hold securities. Investors should verify current data and consult a licensed professional when needed."}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-xl font-black text-ink">
            {isTh ? "แหล่งข้อมูลอ้างอิง" : "Sources"}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {article.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-bold text-muted hover:border-brand/40 hover:text-brand"
              >
                {source.label}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </section>
      </article>

      <aside className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-display text-xl font-black text-ink">{isTh ? "อ่านต่อ" : "Related Articles"}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {related.map((item) => (
            <Link key={item.slug} href={`/blog/${item.slug}`} className="rounded-xl border border-line bg-bg p-4 hover:border-brand/40">
              <div className="text-[11px] font-black text-brand">{item.symbol}</div>
              <div className="mt-1 text-sm font-black leading-snug text-ink">{isTh ? item.titleTh : item.titleEn}</div>
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}

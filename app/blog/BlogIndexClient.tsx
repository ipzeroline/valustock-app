"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { BlogArticle } from "@/lib/blogArticles";
import { useTranslation } from "@/lib/translations";
import { BarChart3, ChevronRight, Clock, Eye, FileText, Search, Shield, Sparkles, Target } from "@/lib/icons";

const PAGE_SIZE = 12;

const clusters = [
  {
    titleTh: "หุ้นรายตัวก่อนซื้อจริง",
    titleEn: "Single-Stock Pre-Buy Research",
    descTh: "รวมคำถามหุ้นรายตัว เช่น หุ้นน่าซื้อไหม มูลค่าเหมาะสม ปันผล ความเสี่ยง และจุดที่ควรตรวจในงบ",
    descEn: "Single-stock research around fair value, dividends, business quality, risks, and pre-buy checklists.",
    icon: Target,
  },
  {
    titleTh: "หุ้นปันผลและรายได้สม่ำเสมอ",
    titleEn: "Dividend And Income Research",
    descTh: "ดู dividend yield, payout, cash flow, dividend trap และความเหมาะสมกับพอร์ตระยะยาว",
    descEn: "Dividend yield, payout quality, cash flow, dividend traps, and long-term portfolio fit.",
    icon: Shield,
  },
  {
    titleTh: "มือใหม่และ ETF",
    titleEn: "Beginner And ETF Guides",
    descTh: "คู่มือเริ่มลงทุน S&P 500, Nasdaq, ETF, DCA และวิธีจัดพอร์ตสำหรับคนเริ่มต้น",
    descEn: "Beginner guides for S&P 500, Nasdaq, ETFs, DCA, and practical portfolio building.",
    icon: FileText,
  },
];

function clampPage(page: number, totalPages: number) {
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(page, Math.max(totalPages, 1));
}

function pageHref(page: number) {
  return page <= 1 ? "/blog" : `/blog/${page}`;
}

function getSeoFocus(article: BlogArticle, lang: "th" | "en") {
  if (lang === "th") return article.keywords.slice(0, 4);
  return [
    article.symbol,
    article.category,
    "Fair value",
    "Risk checklist",
  ].filter(Boolean).slice(0, 4);
}

function articleSearchText(article: BlogArticle) {
  return [
    article.symbol,
    article.category,
    article.titleTh,
    article.titleEn,
    article.descriptionTh,
    article.descriptionEn,
    article.verdictTh,
    article.verdictEn,
    ...article.keywords,
    ...article.sectionsTh.map((section) => section.heading),
    ...article.sectionsEn.map((section) => section.heading),
  ]
    .join(" ")
    .toLowerCase();
}

function formatViews(value: number, lang: "th" | "en") {
  return new Intl.NumberFormat(lang === "th" ? "th-TH" : "en-US").format(value);
}

export function BlogIndexClient({ articles, currentPage: requestedPage = 1 }: { articles: BlogArticle[]; currentPage?: number }) {
  const { lang } = useTranslation();
  const [query, setQuery] = useState("");
  const [localPage, setLocalPage] = useState(requestedPage);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const isTh = lang === "th";
  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;
  const filteredArticles = useMemo(() => {
    if (!normalizedQuery) return articles;
    return articles.filter((article) => articleSearchText(article).includes(normalizedQuery));
  }, [articles, normalizedQuery]);
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const currentPage = clampPage(localPage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleArticles = useMemo(() => filteredArticles.slice(start, start + PAGE_SIZE), [filteredArticles, start]);
  const popularQueries = isTh
    ? ["S&P 500", "Nasdaq", "ETF", "หุ้นปันผล", "DCF", "Fair Value", "TISCO", "KBANK"]
    : ["S&P 500", "Nasdaq", "ETF", "Dividend", "DCF", "Fair Value", "TISCO", "KBANK"];

  const pageTitle = isTh
    ? "บทวิเคราะห์หุ้นและ ETF"
    : "Stock And ETF Research Library";
  const pageSubtitle = isTh
    ? "แยกบทความตามหัวข้อที่นักลงทุนค้นหาก่อนตัดสินใจจริง พร้อมกรอบ DCF, Fair Value, Margin of Safety, ปันผล และความเสี่ยง"
    : "Research organized by real investor search intent, with DCF, fair value, margin of safety, dividends, and risk checklists.";
  const heroImageSrc = "/article-image/valustock-research-library?category=Stock%20ETF%20Research&symbol=VS&v=5";

  useEffect(() => {
    const slugs = visibleArticles.map((article) => article.slug);
    if (!slugs.length) return;

    let cancelled = false;
    fetch(`/api/blog/views?slugs=${encodeURIComponent(slugs.join(","))}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        if (!cancelled && payload.views) {
          setViewCounts((current) => ({ ...current, ...payload.views }));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [visibleArticles]);

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-line bg-surface/55">
        <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_0.92fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand">
              <FileText className="h-4 w-4" />
              {isTh ? "คลังบทวิเคราะห์ ValuStock" : "ValuStock Research Library"}
            </div>
            <h1 className="mt-4 max-w-3xl font-display text-3xl font-black leading-tight text-ink sm:text-5xl">
              {pageTitle}
            </h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-muted sm:text-base">
              {pageSubtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {(isTh
                ? ["หุ้นตัวไหนดี", "หุ้นปันผลสูง", "DCF", "Fair Value", "ETF", "หุ้น Undervalue"]
                : ["Stock ideas", "Dividend stocks", "DCF", "Fair value", "ETF", "Undervalued stocks"]
              ).map((item) => (
                <span key={item} className="rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-bold text-muted">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <figure className="overflow-hidden rounded-2xl border border-line bg-bg shadow-soft">
            <img
              src={heroImageSrc}
              alt={
                isTh
                  ? "ภาพคลังบทวิเคราะห์หุ้น ETF DCF Fair Value และ Margin of Safety ของ ValuStock"
                  : "ValuStock stock and ETF research library cover for DCF fair value and margin of safety articles"
              }
              width={1200}
              height={630}
              loading="eager"
              decoding="async"
              className="aspect-[1200/630] w-full object-cover object-center"
            />
          </figure>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand">
          <Search className="h-4 w-4" />
          {isTh ? "ค้นหาบทความ" : "Search Articles"}
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setLocalPage(1);
              }}
              placeholder={isTh ? "ค้นหาชื่อหุ้น ETF หัวข้อ เช่น S&P 500, Nasdaq, ปันผล, DCF" : "Search symbol, ETF, topic, e.g. S&P 500, Nasdaq, dividend, DCF"}
              className="h-12 w-full rounded-xl border border-line bg-bg pl-11 pr-4 text-sm font-bold text-ink outline-none transition placeholder:text-muted focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
            />
          </label>
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setLocalPage(requestedPage);
              }}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-line bg-bg px-4 text-sm font-black text-muted transition hover:border-brand/40 hover:text-brand"
            >
              {isTh ? "ล้างคำค้น" : "Clear Search"}
            </button>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {popularQueries.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setQuery(item);
                setLocalPage(1);
              }}
              className="rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-bold text-muted transition hover:border-brand/40 hover:text-brand"
            >
              {item}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs font-bold text-muted">
          {isSearching
            ? isTh
              ? `พบ ${filteredArticles.length} บทความจากคำค้น "${query.trim()}"`
              : `Found ${filteredArticles.length} articles for "${query.trim()}"`
            : isTh
              ? `ค้นหาได้จาก ${articles.length} บทความ ทั้งชื่อหุ้น หัวข้อ คำอธิบาย หมวดหมู่ และ keyword`
              : `Search across ${articles.length} articles by symbol, topic, description, category and keyword`}
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand">
          <Search className="h-4 w-4" />
          {isTh ? "Topic Clusters สำหรับ SEO" : "SEO Topic Clusters"}
        </div>
        <h2 className="mt-2 font-display text-2xl font-black text-ink sm:text-3xl">
          {isTh ? "เลือกอ่านตามเจตนาการค้นหา" : "Browse By Search Intent"}
        </h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-muted">
          {isTh
            ? "ทุกบทความถูกจัดให้ตอบคำถามก่อนซื้อหุ้นจริง เช่น มูลค่าเหมาะสม ปันผล ความเสี่ยง และวิธีใช้เครื่องมือวิเคราะห์ต่อ"
            : "Every guide is structured around pre-buy questions: valuation, dividend quality, risk, and the next research workflow."}
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {clusters.map((cluster) => {
            const Icon = cluster.icon;
            return (
              <div key={cluster.titleEn} className="rounded-xl border border-line bg-bg p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-display text-lg font-black text-ink">
                  {isTh ? cluster.titleTh : cluster.titleEn}
                </h3>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-muted">
                  {isTh ? cluster.descTh : cluster.descEn}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-brand">
              {isTh ? "บทความทั้งหมด" : "All Articles"}
            </div>
            <h2 className="mt-1 font-display text-2xl font-black text-ink">
              {isSearching
                ? isTh
                  ? `ผลการค้นหา หน้า ${currentPage} จาก ${totalPages}`
                  : `Search results page ${currentPage} of ${totalPages}`
                : isTh
                  ? `หน้า ${currentPage} จาก ${totalPages}`
                  : `Page ${currentPage} of ${totalPages}`}
            </h2>
          </div>
          <p className="text-xs font-bold text-muted">
            {filteredArticles.length > 0
              ? isTh
                ? `แสดง ${start + 1}-${Math.min(start + PAGE_SIZE, filteredArticles.length)} จาก ${filteredArticles.length} บทความ`
                : `Showing ${start + 1}-${Math.min(start + PAGE_SIZE, filteredArticles.length)} of ${filteredArticles.length} articles`
              : isTh
                ? "ไม่พบบทความที่ตรงกับคำค้น"
                : "No matching articles"}
          </p>
        </div>

        {visibleArticles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleArticles.map((article, index) => {
            const title = isTh ? article.titleTh : article.titleEn;
            const description = isTh ? article.descriptionTh : article.descriptionEn;
            const seoFocus = getSeoFocus(article, lang);
            const imageSrc = `/article-image/${encodeURIComponent(article.slug)}?category=${encodeURIComponent(article.category)}&symbol=${encodeURIComponent(article.symbol)}&v=5`;

            return (
              <article
                key={article.slug}
                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft"
              >
                <Link href={`/blog/${article.slug}`} className="flex aspect-[1200/630] items-center justify-center overflow-hidden border-b border-line/50 bg-bg">
                  <img
                    src={imageSrc}
                    alt={isTh ? `ภาพประกอบบทความ ${title}` : `${title} article cover`}
                    width={1200}
                    height={630}
                    loading={index < 6 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                  />
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-bg px-3 py-1 text-[11px] font-black text-muted">
                      <BarChart3 className="h-3.5 w-3.5" />
                      {article.symbol}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-bg px-3 py-1 text-[11px] font-black text-muted">
                      <Clock className="h-3.5 w-3.5" />
                      {article.readTime}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-bg px-3 py-1 text-[11px] font-black text-muted">
                      <Eye className="h-3.5 w-3.5" />
                      {isTh
                        ? `${formatViews(viewCounts[article.slug] || 0, lang)} อ่าน`
                        : `${formatViews(viewCounts[article.slug] || 0, lang)} reads`}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-lg font-black leading-snug text-ink">
                    <Link href={`/blog/${article.slug}`} className="hover:text-brand">
                      {title}
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm font-semibold leading-relaxed text-muted">
                    {description}
                  </p>

                  <div className="mt-4 rounded-xl border border-line bg-bg/60 p-3">
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-brand">
                      <Sparkles className="h-3.5 w-3.5" />
                      {isTh ? "SEO focus" : "Research focus"}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {seoFocus.map((keyword) => (
                        <span key={keyword} className="rounded-full bg-elevate px-2 py-0.5 text-[10px] font-bold text-muted">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-5">
                    <span className="text-[11px] font-bold text-muted">
                      {isTh ? `อัปเดต ${article.modified}` : `Updated ${article.modified}`}
                    </span>
                    <Link href={`/blog/${article.slug}`} className="inline-flex items-center gap-1 text-xs font-black text-brand hover:underline">
                      {isTh ? "อ่านต่อ" : "Read"}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-xl font-black text-ink">
              {isTh ? "ไม่พบบทความที่ตรงกับคำค้น" : "No Articles Found"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-muted">
              {isTh
                ? "ลองค้นด้วยชื่อหุ้น สัญลักษณ์ ETF หรือหัวข้อกว้างขึ้น เช่น DCF, ปันผล, Nasdaq, S&P 500"
                : "Try a broader symbol, ETF, or topic such as DCF, dividend, Nasdaq, or S&P 500."}
            </p>
          </div>
        )}

        {filteredArticles.length > PAGE_SIZE ? (
          <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label={isTh ? "แบ่งหน้าบทความ" : "Article pagination"}>
            {isSearching ? (
              <button
                type="button"
                onClick={() => setLocalPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className={`inline-flex h-10 items-center gap-1 rounded-xl border border-line px-3 text-sm font-bold ${
                  currentPage === 1 ? "opacity-45" : "hover:border-brand hover:text-brand"
                }`}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                {isTh ? "ก่อนหน้า" : "Prev"}
              </button>
            ) : (
              <Link
                href={pageHref(currentPage - 1)}
                onClick={() => setLocalPage(Math.max(currentPage - 1, 1))}
                aria-disabled={currentPage === 1}
                className={`inline-flex h-10 items-center gap-1 rounded-xl border border-line px-3 text-sm font-bold ${
                  currentPage === 1 ? "pointer-events-none opacity-45" : "hover:border-brand hover:text-brand"
                }`}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                {isTh ? "ก่อนหน้า" : "Prev"}
              </Link>
            )}
            {Array.from({ length: totalPages }).map((_, index) => {
              const page = index + 1;
              const className = `grid h-10 w-10 place-items-center rounded-xl border text-sm font-black ${
                page === currentPage
                  ? "border-brand bg-brand text-bg"
                  : "border-line text-muted hover:border-brand hover:text-brand"
              }`;
              return isSearching ? (
                <button key={page} type="button" onClick={() => setLocalPage(page)} className={className}>
                  {page}
                </button>
              ) : (
                <Link key={page} href={pageHref(page)} onClick={() => setLocalPage(page)} className={className}>
                  {page}
                </Link>
              );
            })}
            {isSearching ? (
              <button
                type="button"
                onClick={() => setLocalPage(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`inline-flex h-10 items-center gap-1 rounded-xl border border-line px-3 text-sm font-bold ${
                  currentPage === totalPages ? "opacity-45" : "hover:border-brand hover:text-brand"
                }`}
              >
                {isTh ? "ถัดไป" : "Next"}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href={pageHref(currentPage + 1)}
                onClick={() => setLocalPage(Math.min(currentPage + 1, totalPages))}
                aria-disabled={currentPage === totalPages}
                className={`inline-flex h-10 items-center gap-1 rounded-xl border border-line px-3 text-sm font-bold ${
                  currentPage === totalPages ? "pointer-events-none opacity-45" : "hover:border-brand hover:text-brand"
                }`}
              >
                {isTh ? "ถัดไป" : "Next"}
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </nav>
        ) : null}
      </section>
    </>
  );
}

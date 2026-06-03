import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BarChart3, FileText, CheckCircle, ArrowUpRight, AlertTriangle, Mail, Crown } from "@/lib/icons";
import { blogArticles, getBlogArticle } from "@/lib/blogArticles";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getBlogArticle(slug);

  if (!article) {
    return {
      title: "ไม่พบบทความ | ValuStock",
    };
  }

  const url = `https://valustock.com/blog/${article.slug}`;

  return {
    title: `${article.titleTh} | ValuStock`,
    description: article.descriptionTh,
    keywords: article.keywords,
    alternates: {
      canonical: url,
      languages: {
        "th-TH": url,
        "en-US": url,
      },
    },
    openGraph: {
      type: "article",
      locale: "th_TH",
      url,
      title: article.titleTh,
      description: article.descriptionTh,
      siteName: "ValuStock",
      publishedTime: article.published,
      modifiedTime: article.modified,
      authors: ["ValuStock Research"],
      tags: article.keywords,
    },
    twitter: {
      card: "summary_large_image",
      title: article.titleTh,
      description: article.descriptionTh,
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getBlogArticle(slug);

  if (!article) notFound();

  const url = `https://valustock.com/blog/${article.slug}`;
  const related = blogArticles.filter((item) => item.slug !== article.slug).slice(0, 4);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: article.titleTh,
        alternativeHeadline: article.titleEn,
        description: article.descriptionTh,
        inLanguage: ["th-TH", "en-US"],
        datePublished: article.published,
        dateModified: article.modified,
        author: { "@type": "Organization", name: "ValuStock Research" },
        publisher: {
          "@type": "Organization",
          name: "ValuStock",
          logo: { "@type": "ImageObject", url: "https://valustock.com/logo.png" },
        },
        mainEntityOfPage: url,
        about: article.symbol,
        keywords: article.keywords.join(", "),
        citation: article.sources.map((source) => source.url),
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: article.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ValuStock", item: "https://valustock.com" },
          { "@type": "ListItem", position: 2, name: "Blog", item: "https://valustock.com/blog" },
          { "@type": "ListItem", position: 3, name: article.symbol, item: url },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

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
              Updated {article.modified}
            </span>
            <span className="rounded-full border border-line bg-bg px-3 py-1 text-[11px] font-black text-muted">
              {article.readTime}
            </span>
          </div>
          <h1 className="mt-5 font-display text-3xl font-black leading-tight text-ink sm:text-5xl">
            {article.titleTh}
          </h1>
          <p className="mt-4 text-base font-semibold leading-relaxed text-muted">
            {article.descriptionTh}
          </p>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-muted">
            {article.titleEn}
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {article.metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-line bg-surface p-4">
              <div className="text-[11px] font-black uppercase text-muted">{metric.label}</div>
              <div className="mt-2 font-display text-2xl font-black text-ink">{metric.value}</div>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">{metric.note}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-brand/25 bg-brand/10 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-black text-brand">
            <CheckCircle className="h-5 w-5" />
            Professional verdict
          </div>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-ink sm:text-base">{article.verdictTh}</p>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-muted">{article.verdictEn}</p>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand">
                <Mail className="h-4 w-4" />
                Reader Conversion Funnel
              </div>
              <h2 className="mt-2 font-display text-2xl font-black text-ink">
                อ่านบทวิเคราะห์ {article.symbol} แล้วต่อด้วยเครื่องมือประเมินมูลค่าฟรี
              </h2>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-muted">
                สมัครฟรีเพื่อสร้าง watchlist, ทดลองเปรียบเทียบหุ้น และรับบทวิเคราะห์ต่อเนื่องทางอีเมล
                ก่อนอัปเกรดเป็น Premium เมื่อคุณต้องการ DCF, portfolio alerts และข้อมูลเชิงลึกมากขึ้น
              </p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-muted" lang="en">
                Start free with watchlists and comparison tools, then upgrade to Premium when deeper DCF workflows,
                alerts and research coverage become useful.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-black text-bg shadow-soft transition hover:opacity-90"
              >
                สมัครสมาชิกฟรี
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-bg px-4 py-3 text-sm font-black text-ink transition hover:border-brand/40 hover:text-brand"
              >
                <Crown className="h-4 w-4" />
                ดู Premium
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {article.sectionsTh.map((section) => (
            <div key={section.heading} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
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

        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6" lang="en">
          <div className="flex items-center gap-2 text-sm font-black text-brand">
            <FileText className="h-5 w-5" />
            English version
          </div>
          <h2 className="mt-3 font-display text-2xl font-black text-ink">{article.titleEn}</h2>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-muted">{article.descriptionEn}</p>
          <div className="mt-5 space-y-5">
            {article.sectionsEn.map((section) => (
              <section key={section.heading}>
                <h3 className="font-display text-lg font-black text-ink">{section.heading}</h3>
                <div className="mt-2 space-y-2">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm font-medium leading-7 text-muted">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section id="faq" className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-2xl font-black text-ink">คำถามที่พบบ่อยเกี่ยวกับ {article.symbol}</h2>
          <div className="mt-4 divide-y divide-line">
            {article.faq.map((item) => (
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
              <h2 className="font-display text-lg font-black text-ink">หมายเหตุด้านการลงทุน</h2>
              <p className="mt-2 text-sm font-semibold leading-7 text-muted">
                บทความนี้จัดทำเพื่อการศึกษาและการวิเคราะห์ข้อมูลเท่านั้น ไม่ใช่คำแนะนำซื้อ ขาย หรือถือหลักทรัพย์
                นักลงทุนควรตรวจสอบข้อมูลล่าสุดจากบริษัท ตลาดหลักทรัพย์ และที่ปรึกษาการลงทุนที่ได้รับอนุญาตก่อนตัดสินใจ
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-xl font-black text-ink">แหล่งข้อมูลอ้างอิง</h2>
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
        <h2 className="font-display text-xl font-black text-ink">อ่านต่อ</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {related.map((item) => (
            <Link key={item.slug} href={`/blog/${item.slug}`} className="rounded-xl border border-line bg-bg p-4 hover:border-brand/40">
              <div className="text-[11px] font-black text-brand">{item.symbol}</div>
              <div className="mt-1 text-sm font-black leading-snug text-ink">{item.titleTh}</div>
            </Link>
          ))}
        </div>
      </aside>
    </main>
  );
}

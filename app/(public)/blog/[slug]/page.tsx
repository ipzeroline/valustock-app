import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { blogArticles, getBlogArticle } from "@/lib/blogArticles";
import { BlogArticleClient } from "./BlogArticleClient";
import { BlogIndexClient } from "../BlogIndexClient";

const PAGE_SIZE = 12;

type Props = {
  params: Promise<{ slug: string }>;
};

function totalPages() {
  return Math.max(1, Math.ceil(blogArticles.length / PAGE_SIZE));
}

function parsePageSlug(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : null;
}

export function generateStaticParams() {
  const articleParams = blogArticles.map((article) => ({ slug: article.slug }));
  const pageParams = Array.from({ length: Math.max(totalPages() - 1, 0) }).map((_, index) => ({
    slug: String(index + 2),
  }));
  return [...articleParams, ...pageParams];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = parsePageSlug(slug);
  if (page) {
    if (page === 1 || page > totalPages()) {
      return {
        title: "ไม่พบบทความ | ValuStock",
      };
    }

    const url = `https://valustock.com/blog/${page}`;
    return {
      title: `บทวิเคราะห์หุ้นและ ETF หน้า ${page} | ValuStock Research Library`,
      description:
        "อ่านบทวิเคราะห์หุ้นไทย หุ้นสหรัฐ ETF DCF Fair Value Margin of Safety หุ้นปันผล และหุ้น Undervalue พร้อมคู่มือสำหรับนักลงทุนไทย",
      alternates: {
        canonical: url,
        types: {
          "text/html": [
            { url: page === 2 ? "https://valustock.com/blog" : `https://valustock.com/blog/${page - 1}`, title: "Previous" },
            ...(page < totalPages() ? [{ url: `https://valustock.com/blog/${page + 1}`, title: "Next" }] : []),
          ],
        },
      },
      openGraph: {
        type: "website",
        locale: "th_TH",
        url,
        title: `บทวิเคราะห์หุ้นและ ETF หน้า ${page} | ValuStock`,
        description:
          "Research library สำหรับหุ้นไทย หุ้นสหรัฐ ETF DCF Fair Value และ Margin of Safety",
        siteName: "ValuStock",
        images: [
          {
            url: "https://valustock.com/opengraph-image",
            width: 1200,
            height: 630,
            alt: "ValuStock research library",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `บทวิเคราะห์หุ้นและ ETF หน้า ${page} | ValuStock`,
        description:
          "Research library สำหรับหุ้นไทย หุ้นสหรัฐ ETF DCF Fair Value และ Margin of Safety",
        images: ["https://valustock.com/opengraph-image"],
      },
    };
  }

  const article = getBlogArticle(slug);

  if (!article) {
    return {
      title: "ไม่พบบทความ | ValuStock",
    };
  }

  const url = `https://valustock.com/blog/${article.slug}`;
  const imageUrl = `https://valustock.com/article-image/${encodeURIComponent(article.slug)}?category=${encodeURIComponent(article.category)}&symbol=${encodeURIComponent(article.symbol)}&v=5`;

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
      images: [
        {
          url: imageUrl,
          width: 900,
          height: 506,
          alt: `${article.titleTh} research cover`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.titleTh,
      description: article.descriptionTh,
      images: [imageUrl],
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const page = parsePageSlug(slug);
  if (page) {
    if (page === 1) redirect("/blog");
    if (page > totalPages()) notFound();

    const url = `https://valustock.com/blog/${page}`;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `ValuStock Research Library Page ${page}`,
      url,
      isPartOf: {
        "@type": "CollectionPage",
        name: "ValuStock Research Library",
        url: "https://valustock.com/blog",
      },
    };

    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <BlogIndexClient articles={blogArticles} currentPage={page} />
      </main>
    );
  }

  const article = getBlogArticle(slug);

  if (!article) notFound();

  const url = `https://valustock.com/blog/${article.slug}`;
  const imageUrl = `https://valustock.com/article-image/${encodeURIComponent(article.slug)}?category=${encodeURIComponent(article.category)}&symbol=${encodeURIComponent(article.symbol)}&v=5`;
  const related = blogArticles.filter((item) => item.slug !== article.slug).slice(0, 4);
  const articleText = [
    article.titleTh,
    article.descriptionTh,
    article.verdictTh,
    ...article.sectionsTh.flatMap((section) => [section.heading, ...section.body]),
    ...article.faq.flatMap((item) => [item.q, item.a]),
  ].join(" ");
  const wordCount = articleText.split(/\s+/).filter(Boolean).length;
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
        image: {
          "@type": "ImageObject",
          url: imageUrl,
          width: 900,
          height: 506,
        },
        thumbnailUrl: imageUrl,
        articleSection: article.category,
        wordCount,
        datePublished: article.published,
        dateModified: article.modified,
        author: { "@type": "Organization", name: "ValuStock Research" },
        publisher: {
          "@type": "Organization",
          name: "ValuStock",
          logo: { "@type": "ImageObject", url: "https://valustock.com/logo.png" },
        },
        mainEntityOfPage: url,
        about: [
          { "@type": "Thing", name: article.symbol },
          { "@type": "Thing", name: article.category },
          ...article.keywords.slice(0, 6).map((keyword) => ({ "@type": "Thing", name: keyword })),
        ],
        keywords: article.keywords.join(", "),
        citation: article.sources.map((source) => source.url),
        isAccessibleForFree: true,
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: article.titleTh,
        description: article.descriptionTh,
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: imageUrl,
          width: 900,
          height: 506,
        },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        mainEntity: { "@id": `${url}#article` },
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
      <BlogArticleClient article={article} related={related} />
    </main>
  );
}

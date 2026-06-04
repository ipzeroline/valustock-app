import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { blogArticles } from "@/lib/blogArticles";
import { BlogIndexClient } from "./BlogIndexClient";

type Props = {
  searchParams?: Promise<{ page?: string | string[] }>;
};

const BLOG_IMAGE_URL =
  "https://valustock.com/article-image/valustock-research-library?category=Stock%20ETF%20Research&symbol=VS&v=5";

export const metadata: Metadata = {
  title: "บทวิเคราะห์หุ้นและ ETF | ValuStock Research Library",
  description:
    "รวมบทวิเคราะห์หุ้นไทย หุ้นสหรัฐ ETF DCF Fair Value Margin of Safety หุ้นปันผล และหุ้น Undervalue พร้อมคู่มือสำหรับนักลงทุนไทย",
  alternates: {
    canonical: "https://valustock.com/blog",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/blog",
    title: "บทวิเคราะห์หุ้นและ ETF | ValuStock Research Library",
    description:
      "อ่านบทวิเคราะห์หุ้นไทย หุ้นสหรัฐ และ ETF เชิงลึก พร้อมกรอบประเมินมูลค่า ปันผล ความเสี่ยง และคำถามที่นักลงทุนค้นหาบ่อย",
    siteName: "ValuStock",
    images: [
      {
        url: BLOG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "ValuStock stock and ETF research library",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "บทวิเคราะห์หุ้นและ ETF | ValuStock",
    description:
      "Research library สำหรับหุ้นไทย หุ้นสหรัฐ ETF DCF Fair Value และ Margin of Safety",
    images: [BLOG_IMAGE_URL],
  },
};

function parseLegacyPage(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page > 1 ? page : null;
}

export default async function BlogIndexPage({ searchParams }: Props) {
  const legacyPage = parseLegacyPage((await searchParams)?.page);
  if (legacyPage) {
    redirect(`/blog/${legacyPage}`);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ValuStock Research Library",
    url: "https://valustock.com/blog",
    description: metadata.description,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: blogArticles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://valustock.com/blog/${article.slug}`,
        item: {
          "@type": "Article",
          headline: article.titleTh,
          alternativeHeadline: article.titleEn,
          description: article.descriptionTh,
          datePublished: article.published,
          dateModified: article.modified,
          author: { "@type": "Organization", name: "ValuStock Research" },
          image: `https://valustock.com/article-image/${encodeURIComponent(article.slug)}?category=${encodeURIComponent(article.category)}&symbol=${encodeURIComponent(article.symbol)}&v=5`,
          keywords: article.keywords.join(", "),
        },
      })),
    },
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogIndexClient articles={blogArticles} currentPage={1} />
    </main>
  );
}

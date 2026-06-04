import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { blogArticles } from "@/lib/blogArticles";

const PAGE_SIZE = 12;

type Props = {
  params: Promise<{ page: string }>;
};

function totalPages() {
  return Math.max(1, Math.ceil(blogArticles.length / PAGE_SIZE));
}

function parsePage(value: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : null;
}

export function generateStaticParams() {
  return Array.from({ length: Math.max(totalPages() - 1, 0) }).map((_, index) => ({
    page: String(index + 2),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page: pageValue } = await params;
  const page = parsePage(pageValue);
  if (!page || page > totalPages() || page === 1) {
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

export default async function BlogPaginatedPage({ params }: Props) {
  const { page: pageValue } = await params;
  const page = parsePage(pageValue);

  if (!page || page === 1 || page > totalPages()) {
    notFound();
  }

  redirect(`/blog/${page}`);
}

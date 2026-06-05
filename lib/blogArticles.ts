import { articleData } from "@/content/articles";

export type BlogArticle = {
  slug: string;
  symbol: string;
  titleTh: string;
  titleEn: string;
  descriptionTh: string;
  descriptionEn: string;
  category: string;
  published: string;
  modified: string;
  readTime: string;
  verdictTh: string;
  verdictEn: string;
  keywords: string[];
  metrics: { label: string; value: string; note: string }[];
  sectionsTh: { heading: string; body: string[] }[];
  sectionsEn: { heading: string; body: string[] }[];
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
};

export const blogArticles: BlogArticle[] = [...articleData].sort((a, b) => {
  const dateA = new Date(a.modified || a.published).getTime();
  const dateB = new Date(b.modified || b.published).getTime();
  return dateB - dateA;
});

export function getBlogArticle(slug: string) {
  return blogArticles.find((article) => article.slug === slug);
}

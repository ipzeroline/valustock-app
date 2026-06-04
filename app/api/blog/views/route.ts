import { NextRequest, NextResponse } from "next/server";
import { getArticleViewCounts, recordArticleView } from "@/lib/article-views";

export async function GET(req: NextRequest) {
  const slugs = (req.nextUrl.searchParams.get("slugs") || "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean)
    .slice(0, 80);

  if (!slugs.length) {
    return NextResponse.json({ views: {} });
  }

  try {
    const views = await getArticleViewCounts(slugs);
    return NextResponse.json({ views });
  } catch (err: any) {
    return NextResponse.json({ views: {}, error: err?.message || "Could not load article views" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await recordArticleView(body.slug, body.visitorId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ counted: false, views: 0, error: err?.message || "Could not record article view" }, { status: 500 });
  }
}

import type { Metadata } from "next";
import Link from "next/link";
import { getDbConnectionStatus, query } from "@/lib/db";
import { ensureReviewsTable, maskReviewEmail, ReviewRow } from "@/lib/reviews";
import { ArrowRight, CheckCircle, MessageSquare, Star, User } from "@/lib/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "รีวิวจากสมาชิก ValuStock | ประสบการณ์ใช้งานเครื่องมือวิเคราะห์หุ้น",
  description:
    "อ่านรีวิวจากสมาชิก ValuStock ที่ใช้เครื่องมือประเมินมูลค่าหุ้น DCF, Fair Value, Margin of Safety, Watchlist, Portfolio และ Stock Screener",
  alternates: {
    canonical: "https://valustock.com/member-reviews",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/member-reviews",
    title: "รีวิวจากสมาชิก ValuStock",
    description:
      "รวมประสบการณ์จากสมาชิกที่ใช้ ValuStock วิเคราะห์หุ้นไทย หุ้นอเมริกา ETF, DCF, Fair Value และ Margin of Safety",
    siteName: "ValuStock",
  },
};

interface PublicReview {
  id: number;
  name: string;
  emailMask: string;
  rating: number;
  title: string;
  content: string;
  date: string;
}

async function getReviews(): Promise<PublicReview[]> {
  const status = await getDbConnectionStatus();
  if (!status.connected) return [];

  try {
    await ensureReviewsTable();
    const rows = await query<ReviewRow[]>(
      `SELECT id, user_email, user_name, rating, title, content, status, admin_note, approved_at, created_at, updated_at
       FROM reviews
       WHERE status = 'approved'
       ORDER BY approved_at DESC, created_at DESC
       LIMIT 48`
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.user_name,
      emailMask: maskReviewEmail(row.user_email),
      rating: Number(row.rating || 0),
      title: row.title || "รีวิว ValuStock",
      content: row.content,
      date: row.approved_at || row.created_at,
    }));
  } catch {
    return [];
  }
}

function Stars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5 text-gold">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={`${size} ${index < rating ? "fill-current" : "opacity-25"}`} />
      ))}
    </div>
  );
}

export default async function MemberReviewsPage() {
  const reviews = await getReviews();
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "รีวิวจากสมาชิก ValuStock",
    url: "https://valustock.com/member-reviews",
    description:
      "รวมรีวิวจากสมาชิก ValuStock ที่ใช้เครื่องมือวิเคราะห์หุ้น DCF, Fair Value, Margin of Safety, Watchlist และ Portfolio",
    mainEntity: {
      "@type": "SoftwareApplication",
      name: "ValuStock",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: "https://valustock.com",
      ...(reviews.length
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: Number(average.toFixed(1)),
              ratingCount: reviews.length,
              bestRating: 5,
              worstRating: 1,
            },
            review: reviews.slice(0, 12).map((review) => ({
              "@type": "Review",
              author: { "@type": "Person", name: review.name },
              datePublished: review.date,
              name: review.title,
              reviewBody: review.content,
              reviewRating: {
                "@type": "Rating",
                ratingValue: review.rating,
                bestRating: 5,
                worstRating: 1,
              },
            })),
          }
        : {}),
    },
  };

  return (
    <main className="bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[minmax(0,1fr)_320px] md:items-end md:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-bold text-gold">
              <MessageSquare className="h-3.5 w-3.5" />
              รีวิวจากสมาชิก
            </div>
            <h1 className="mt-5 max-w-3xl font-display text-3xl font-black leading-tight text-ink md:text-5xl">
              สมาชิกใช้ ValuStock วิเคราะห์หุ้นอย่างไร
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-muted md:text-base">
              รวมประสบการณ์จากผู้ใช้งานจริงที่ใช้ ValuStock ประเมินมูลค่าหุ้น ดู Fair Value, DCF, Margin of Safety, Watchlist, Portfolio และ Stock Screener ก่อนตัดสินใจลงทุน
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-bg shadow-[0_8px_24px_-10px_rgb(var(--brand))] transition hover:brightness-110"
              >
                เริ่มใช้งาน ValuStock <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/reviews"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-5 text-sm font-bold text-ink transition hover:border-brand hover:text-brand"
              >
                เขียนรีวิว
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-muted">คะแนนเฉลี่ย</div>
                <div className="mt-1 font-display text-3xl font-black text-ink">{average.toFixed(1)}</div>
              </div>
              <Stars rating={Math.round(average)} size="h-5 w-5" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
              <div>
                <div className="font-display text-xl font-black text-ink">{reviews.length}</div>
                <div className="text-xs font-semibold text-muted">รีวิวจากสมาชิก</div>
              </div>
              <div>
                <div className="font-display text-xl font-black text-ink">1:1</div>
                <div className="text-xs font-semibold text-muted">รีวิวต่อสมาชิก</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 md:py-14">
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center">
            <User className="mx-auto h-9 w-9 text-muted" />
            <h2 className="mt-4 font-display text-xl font-bold text-ink">ยังไม่มีรีวิวจากสมาชิก</h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-muted">
              เมื่อสมาชิกส่งรีวิวและรีวิวถูกเผยแพร่ รายการจะแสดงในหน้านี้โดยอัตโนมัติ
            </p>
            <Link
              href="/reviews"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-brand px-4 text-sm font-bold text-bg transition hover:brightness-110"
            >
              เขียนรีวิว
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.id} className="surface flex min-h-[230px] flex-col justify-between rounded-2xl border border-line p-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-base font-bold text-ink">{review.title}</h2>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-muted">
                        {review.name} · {review.emailMask}
                      </p>
                    </div>
                    <Stars rating={review.rating} size="h-3.5 w-3.5" />
                  </div>
                  <p className="mt-4 line-clamp-6 text-sm font-medium leading-relaxed text-muted [overflow-wrap:anywhere]">
                    {review.content}
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-line/50 pt-3 text-[11px] font-bold text-muted">
                  <span>{new Date(review.date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}</span>
                  <span className="inline-flex items-center gap-1 text-up">
                    <CheckCircle className="h-3.5 w-3.5" />
                    เผยแพร่แล้ว
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-line bg-surface/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <h2 className="font-display text-2xl font-black text-ink">พร้อมทดลองวิเคราะห์หุ้นด้วยตัวเอง?</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-muted">
              เริ่มจาก Watchlist, DCF, Fair Value และ Margin of Safety แล้วค่อยอัปเกรดเมื่อ workflow การลงทุนของคุณต้องการเครื่องมือที่ลึกขึ้น
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-bg transition hover:brightness-110"
          >
            ดูแพ็กเกจ <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

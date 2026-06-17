import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle, Crown, Mail } from "@/lib/icons";
import { dividendLinks, moneyKeywordLinks } from "@/lib/seoClusters";

export const metadata: Metadata = {
  title: "หุ้นปันผลสูง 2569 | หุ้นปันผลดี ถือยาว สำหรับมือใหม่และเกษียณ",
  description:
    "SEO hub หุ้นปันผลสูง 2569 หุ้นปันผลรายเดือน หุ้นปันผลเกษียณ หุ้นธนาคารปันผลดี หุ้นพลังงานปันผลสูง และ REIT ปันผลสูง พร้อมทางลัดไป screener",
  alternates: {
    canonical: "https://valustock.com/dividend",
  },
};

export default function DividendHubPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "หุ้นปันผลสูง 2569 และหุ้นปันผลดี",
    url: "https://valustock.com/dividend",
    hasPart: dividendLinks.map((item) => ({
      "@type": "WebPage",
      name: item.label,
      url: `https://valustock.com${item.href}`,
    })),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="rounded-2xl border border-line bg-surface/55 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand">
          <BarChart3 className="h-4 w-4" />
          Dividend SEO Hub
        </div>
        <h1 className="mt-4 max-w-3xl font-display text-3xl font-black leading-tight text-ink sm:text-5xl">
          หุ้นปันผลสูง 2569: ศูนย์รวมบทวิเคราะห์หุ้นปันผลสำหรับคนไทย
        </h1>
        <p className="mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-muted sm:text-base">
          รวมคำค้นหุ้นปันผลที่คนไทยใช้ก่อนลงทุนจริง ตั้งแต่หุ้นปันผลสูง หุ้นปันผลดีถือยาว
          หุ้นธนาคารปันผลดี หุ้นพลังงานปันผลสูง ไปจนถึงพอร์ตปันผลเพื่อเกษียณ
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {moneyKeywordLinks.slice(0, 3).map((item) => (
            <Link key={item.label} href={item.href} className="rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-bold text-muted hover:text-brand">
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-2xl font-black text-ink">บทความหุ้นปันผลที่ควรมีใน cluster</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {dividendLinks.map((item) => (
              <Link key={item.label} href={item.href} className="rounded-xl border border-line bg-bg p-4 hover:border-brand/40">
                <div className="text-sm font-black text-ink">{item.label}</div>
                <div className="mt-1 text-xs font-semibold text-muted">{item.intent}</div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border border-brand/25 bg-brand/10 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-black text-brand">
            <CheckCircle className="h-5 w-5" />
            Funnel Recommendation
          </div>
          <h2 className="mt-3 font-display text-2xl font-black text-ink">จากบทความปันผลสู่สมาชิก Premium</h2>
          <div className="mt-4 space-y-3 text-sm font-semibold leading-relaxed text-muted">
            <p>1. ดึงทราฟฟิกจาก Google ด้วยคำว่า หุ้นปันผลสูง 2569 และหุ้นปันผลเกษียณ</p>
            <p>2. ให้สมัครฟรีเพื่อใช้ dividend screener และ watchlist</p>
            <p>3. ส่ง email หุ้นปันผลเข้าเกณฑ์รายสัปดาห์</p>
            <p>4. Upsell Premium ด้วย portfolio alerts และ DCF dividend safety</p>
          </div>
          <div className="mt-5 grid gap-2">
            <Link href="/dividend-stocks" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-black text-bg">
              เปิดหุ้นปันผลสูง
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-bg px-4 py-3 text-sm font-black text-ink hover:text-brand">
              <Mail className="h-4 w-4" />
              สมัครสมาชิกฟรี
            </Link>
            <Link href="/pricing" className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-bg px-4 py-3 text-sm font-black text-ink hover:text-brand">
              <Crown className="h-4 w-4" />
              ดู Premium
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

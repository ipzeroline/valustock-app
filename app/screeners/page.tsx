import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Filter, Search, Shield, Target } from "@/lib/icons";
import { screenerLinks } from "@/lib/seoClusters";

export const metadata: Metadata = {
  title: "Stock Screeners | หุ้น Undervalue หุ้นปันผลสูง หุ้น PE ต่ำ",
  description:
    "รวมเครื่องมือคัดกรองหุ้น ValuStock สำหรับหุ้น Undervalue หุ้นปันผลสูง หุ้น PE ต่ำ หุ้นพื้นฐานดี และหุ้น fair value สำหรับนักลงทุนไทย",
  alternates: {
    canonical: "https://valustock.com/screeners",
  },
};

export default function ScreenersHubPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ValuStock Stock Screeners",
    url: "https://valustock.com/screeners",
    hasPart: screenerLinks.map((item) => ({
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
          <Filter className="h-4 w-4" />
          Screener SEO Hub
        </div>
        <h1 className="mt-4 max-w-3xl font-display text-3xl font-black leading-tight text-ink sm:text-5xl">
          หุ้น Undervalue หุ้นปันผลสูง หุ้น PE ต่ำ: เครื่องมือคัดกรองก่อนซื้อจริง
        </h1>
        <p className="mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-muted sm:text-base">
          หน้านี้รวมคำค้นที่มีโอกาสเปลี่ยนเป็นสมาชิกสูงที่สุด เพราะผู้ใช้ไม่ได้แค่อ่านข่าว
          แต่กำลังมองหาเครื่องมือช่วยคัดหุ้นก่อนลงทุนจริง
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "หุ้น Undervalue",
            desc: "ดู margin of safety และราคาเหมาะสมจาก DCF/Graham",
            href: "/undervalued-stocks",
            icon: Shield,
          },
          {
            title: "หุ้นปันผลสูง",
            desc: "คัดหุ้น dividend yield สูง พร้อมระวัง dividend trap",
            href: "/dividend-stocks",
            icon: Target,
          },
          {
            title: "หุ้น PE ต่ำ",
            desc: "เริ่มจาก valuation filter แล้วตรวจคุณภาพกำไรต่อ",
            href: "/stocks",
            icon: Search,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.title} href={item.href} className="rounded-2xl border border-line bg-surface p-5 hover:border-brand/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-xl font-black text-ink">{item.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">{item.desc}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-black text-brand">
                เปิดเครื่องมือ
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-display text-2xl font-black text-ink">คำค้น Screener ที่ควรเก็บ SEO</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {screenerLinks.map((item) => (
            <Link key={item.label} href={item.href} className="rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-bold text-muted hover:border-brand/40 hover:text-brand">
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

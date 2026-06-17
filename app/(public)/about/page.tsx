import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle, Filter, Layers, LineChart, Shield, Star, Target } from "@/lib/icons";

const ABOUT_IMAGE_URL = "https://valustock.com/images/about-valuation-platform.png?v=1";
const ABOUT_IMAGE_PATH = "/images/about-valuation-platform.png?v=1";

export const metadata: Metadata = {
  title: "ValuStock คืออะไร | เครื่องมือวิเคราะห์หุ้นไทย หุ้นอเมริกา ETF และ DCF",
  description:
    "ValuStock คือแพลตฟอร์มวิเคราะห์หุ้นสำหรับนักลงทุนไทย ช่วยประเมินมูลค่าหุ้นไทย หุ้นอเมริกา ETF ด้วย DCF, Fair Value, Margin of Safety, หุ้น Undervalue และหุ้นปันผลสูง",
  keywords: [
    "ValuStock คืออะไร",
    "เครื่องมือวิเคราะห์หุ้น",
    "ประเมินมูลค่าหุ้น",
    "DCF Calculator หุ้น",
    "หุ้น undervalue",
    "หุ้นปันผลสูง",
    "หุ้นอเมริกา",
    "ETF คืออะไร",
    "S&P 500",
    "Nasdaq 100",
    "SPY",
    "VOO",
    "QQQ",
    "SCHD",
  ],
  alternates: {
    canonical: "https://valustock.com/about",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://valustock.com/about",
    title: "ValuStock คืออะไร | เครื่องมือวิเคราะห์หุ้นไทย หุ้นอเมริกา และ ETF",
    description:
      "รู้จัก ValuStock แพลตฟอร์มวิเคราะห์หุ้นสำหรับนักลงทุนไทยที่ต้องการดู Fair Value, DCF, Margin of Safety, หุ้น Undervalue, หุ้นปันผล และ ETF ก่อนลงทุนจริง",
    siteName: "ValuStock",
    images: [
      {
        url: ABOUT_IMAGE_URL,
        width: 1672,
        height: 941,
        alt: "ValuStock stock valuation platform dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ValuStock คืออะไร | เครื่องมือวิเคราะห์หุ้นไทย หุ้นอเมริกา และ ETF",
    description:
      "รู้จัก ValuStock แพลตฟอร์มวิเคราะห์หุ้นสำหรับนักลงทุนไทยที่ต้องการดู Fair Value, DCF, Margin of Safety, หุ้น Undervalue, หุ้นปันผล และ ETF ก่อนลงทุนจริง",
    images: [ABOUT_IMAGE_URL],
  },
};

const coreTools = [
  {
    title: "DCF และ Fair Value",
    desc: "ประเมินมูลค่าหุ้นจากกระแสเงินสดคิดลด ราคาเหมาะสม และสมมติฐานระยะยาว",
    icon: LineChart,
    href: "/dcf-calculator",
  },
  {
    title: "หุ้น Undervalue",
    desc: "คัดกรองหุ้นที่ราคาตลาดต่ำกว่ามูลค่าประเมินพร้อม Margin of Safety",
    icon: Target,
    href: "/undervalued-stocks",
  },
  {
    title: "หุ้นปันผลสูง",
    desc: "ดู Dividend Yield, payout, cash flow และความเสี่ยง Dividend Trap",
    icon: BarChart3,
    href: "/dividend",
  },
  {
    title: "เปรียบเทียบหุ้น",
    desc: "เทียบหุ้นไทย หุ้นอเมริกา และ ETF แบบ side-by-side ก่อนตัดสินใจ",
    icon: Layers,
    href: "/compare",
  },
];

const thaiStocks = ["TISCO", "KBANK", "BBL", "KTB", "SCB", "ADVANC", "TRUE", "INTUCH", "PTTEP", "PTT", "AOT", "BDMS", "CPALL", "CPN"];
const usStocks = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "BRK.B", "JPM", "V", "JNJ", "PG", "WMT", "LLY"];
const etfs = ["SPY", "VOO", "IVV", "QQQ", "QQQM", "SCHD", "VTI", "VT", "DIA", "IWM", "TLT", "XLK", "XLE", "GLD"];

const faqItems = [
  {
    q: "ValuStock ใช้ทำอะไร?",
    a: "ValuStock ใช้คัดกรองหุ้น ประเมินมูลค่าหุ้น เปรียบเทียบหุ้น สร้าง watchlist และดูบทวิเคราะห์เชิงลึกก่อนตัดสินใจลงทุน",
  },
  {
    q: "ValuStock วิเคราะห์หุ้นอเมริกาและ ETF ได้ไหม?",
    a: "ได้ ValuStock รองรับทั้งหุ้นไทย หุ้นอเมริกา และ ETF ยอดนิยม เช่น S&P 500 ETF, Nasdaq-100 ETF, SPY, VOO, QQQ, SCHD และ ETF กลุ่มต่าง ๆ",
  },
  {
    q: "ValuStock บอกหุ้นน่าซื้อหรือไม่?",
    a: "ValuStock ช่วยวิเคราะห์มูลค่า ความเสี่ยง และส่วนเผื่อความปลอดภัย แต่ไม่ใช่คำแนะนำซื้อขายเฉพาะบุคคล นักลงทุนควรใช้ประกอบการตัดสินใจร่วมกับข้อมูลอื่น",
  },
  {
    q: "มือใหม่ใช้ ValuStock ได้ไหม?",
    a: "เหมาะกับมือใหม่ เพราะมีทั้งบทความพื้นฐาน เครื่องมือคำนวณ DCF หน้าคัดกรองหุ้น และ watchlist เพื่อฝึกวิเคราะห์อย่างเป็นระบบ",
  },
  {
    q: "ValuStock ต่างจากเว็บข่าวหุ้นอย่างไร?",
    a: "ValuStock เน้นเครื่องมือและกรอบวิเคราะห์ก่อนซื้อหุ้นจริง เช่น Fair Value, DCF, Margin of Safety, Dividend Safety และการเปรียบเทียบหุ้น ไม่ได้เน้นข่าวรายวัน",
  },
];

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://valustock.com/#organization",
        name: "ValuStock",
        url: "https://valustock.com",
        description:
          "ValuStock is a stock valuation and research platform for Thai investors covering Thai stocks, US stocks, ETFs, DCF, fair value, dividend stocks and undervalued stocks.",
        image: ABOUT_IMAGE_URL,
        sameAs: ["https://valustock.com"],
      },
      {
        "@type": "WebSite",
        "@id": "https://valustock.com/#website",
        url: "https://valustock.com",
        name: "ValuStock",
        publisher: { "@id": "https://valustock.com/#organization" },
        potentialAction: {
          "@type": "SearchAction",
          target: "https://valustock.com/stocks?query={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "AboutPage",
        "@id": "https://valustock.com/about#about",
        url: "https://valustock.com/about",
        name: "ValuStock คืออะไร",
        description: metadata.description,
        primaryImageOfPage: ABOUT_IMAGE_URL,
        image: ABOUT_IMAGE_URL,
        isPartOf: { "@id": "https://valustock.com/#website" },
        about: { "@id": "https://valustock.com/#organization" },
      },
      {
        "@type": "FAQPage",
        "@id": "https://valustock.com/about#faq",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="grid gap-7 rounded-2xl border border-line bg-surface/55 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center lg:p-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand">
            <Shield className="h-4 w-4" />
            About ValuStock
          </div>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-black leading-[1.08] text-ink sm:text-5xl lg:text-5xl">
            ValuStock คืออะไร
          </h1>
          <p className="mt-4 max-w-2xl text-xl font-black leading-snug text-ink/90 sm:text-2xl">
            เครื่องมือวิเคราะห์หุ้นไทย หุ้นอเมริกา และ ETF สำหรับนักลงทุนที่ต้องการตัดสินใจจากมูลค่าจริง
          </p>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-muted sm:text-base">
            ValuStock ถูกสร้างขึ้นเพื่อช่วยให้นักลงทุนไทยวิเคราะห์หุ้นไทย หุ้นอเมริกา และ ETF อย่างเป็นระบบ
            ก่อนตัดสินใจซื้อ ขาย หรือถือหลักทรัพย์ เป้าหมายของเราไม่ใช่การบอกว่า “หุ้นตัวไหนต้องซื้อ”
            แต่คือการให้เครื่องมือและกรอบคิดที่ช่วยให้นักลงทุนประเมินมูลค่า ความเสี่ยง และโอกาสด้วยตัวเอง
          </p>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-muted" lang="en">
            ValuStock helps Thai investors research Thai equities, U.S. stocks, ETFs, fair value, DCF,
            dividend quality and margin of safety before making real investment decisions.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["DCF Calculator", "Fair Value", "Margin of Safety", "หุ้น Undervalue", "หุ้นปันผลสูง", "หุ้นอเมริกา", "ETF"].map((item) => (
              <span key={item} className="rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-bold text-muted">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-bg/55 shadow-card lg:-mr-2">
          <img
            src={ABOUT_IMAGE_PATH}
            alt="ValuStock valuation dashboard showing DCF, fair value, margin of safety, Thai stocks, US stocks and ETFs"
            width={1672}
            height={941}
            loading="eager"
            decoding="async"
            className="block aspect-[16/9] w-full object-cover"
          />
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {coreTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.title} href={tool.href} className="rounded-2xl border border-line bg-surface p-5 transition hover:border-brand/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-lg font-black text-ink">{tool.title}</h2>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-muted">{tool.desc}</p>
            </Link>
          );
        })}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-2xl font-black text-ink">ValuStock ช่วยวิเคราะห์อะไรบ้าง</h2>
          <div className="mt-5 space-y-4">
            {[
              "คัดกรองหุ้น Undervalue และหุ้นพื้นฐานดีจากมูลค่าประเมิน",
              "ประเมินราคาเหมาะสมของหุ้นด้วย DCF, Fair Value และ Graham Number",
              "ดู Margin of Safety ก่อนตัดสินใจซื้อหุ้นจริง",
              "เปรียบเทียบหุ้นรายตัว เช่น TISCO vs KBANK, ADVANC vs TRUE, PTT vs PTTEP",
              "ค้นหาหุ้นปันผลสูงและตรวจความเสี่ยง Dividend Trap",
              "สร้าง Watchlist, Portfolio Tracker และ Portfolio Alerts",
              "อ่านบทวิเคราะห์ SEO เชิงลึกสำหรับคำค้นก่อนซื้อหุ้น เช่น หุ้นตัวไหนดี 2569 และหุ้นปันผลสูง 2569",
            ].map((item) => (
              <div key={item} className="flex gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <p className="text-sm font-semibold leading-relaxed text-muted">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border border-brand/25 bg-brand/10 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-black text-brand">
            <Star className="h-5 w-5" />
            Mission
          </div>
          <h2 className="mt-3 font-display text-2xl font-black text-ink">พันธกิจของเรา</h2>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-muted">
            พันธกิจของ ValuStock คือทำให้การวิเคราะห์มูลค่าหุ้นเป็นเรื่องเข้าถึงง่ายสำหรับนักลงทุนไทย
            ตั้งแต่มือใหม่ที่เพิ่งเริ่มลงทุน ไปจนถึงนักลงทุน VI ที่ต้องการเครื่องมือช่วยประเมินมูลค่าและเปรียบเทียบหุ้นอย่างมีวินัย
          </p>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-muted">
            เราเชื่อว่านักลงทุนที่ดีไม่จำเป็นต้องเดาตลาดได้ทุกวัน แต่ควรมีระบบตัดสินใจที่ชัดเจน
            รู้ว่ากำลังซื้อธุรกิจอะไร ซื้อที่ราคาเท่าไร และมีส่วนเผื่อความปลอดภัยมากพอหรือไม่
          </p>
          <div className="mt-5 grid gap-2">
            <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-black text-bg">
              สมัครสมาชิกฟรี
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/blog" className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-bg px-4 py-3 text-sm font-black text-ink hover:text-brand">
              อ่านบทวิเคราะห์ทั้งหมด
            </Link>
          </div>
        </aside>
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand">
          <Filter className="h-4 w-4" />
          Coverage Universe
        </div>
        <h2 className="mt-2 font-display text-2xl font-black text-ink">ครอบคลุมหุ้นไทย หุ้นอเมริกา และ ETF ยอดนิยม</h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-muted">
          ValuStock ถูกออกแบบให้ใช้ได้ทั้งนักลงทุนหุ้นไทยและคนที่เริ่มลงทุนต่างประเทศผ่านหุ้นอเมริกา,
          S&P 500, Nasdaq-100 และ ETF ดัง ๆ โดยเน้นการวิเคราะห์มูลค่าและความเสี่ยงมากกว่าการไล่ตามข่าว
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <TickerGroup title="หุ้นไทย" items={thaiStocks} hrefPrefix="/stocks" />
          <TickerGroup title="หุ้นอเมริกา" items={usStocks} hrefPrefix="/stocks" />
          <TickerGroup title="ETF ดัง ๆ" items={etfs} hrefPrefix="/stocks" />
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-display text-2xl font-black text-ink">ValuStock ไม่ใช่อะไร</h2>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-muted">
          ValuStock ไม่ใช่เว็บใบ้หุ้น ไม่ใช่สัญญาณซื้อขายระยะสั้น และไม่ใช่คำแนะนำการลงทุนเฉพาะบุคคล
          ข้อมูลทั้งหมดจัดทำเพื่อการศึกษาและการวิเคราะห์ นักลงทุนควรตรวจสอบข้อมูลล่าสุด งบการเงิน ความเสี่ยง
          และเป้าหมายของตนเองก่อนตัดสินใจลงทุน
        </p>
      </section>

      <section id="faq" className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-display text-2xl font-black text-ink">คำถามที่พบบ่อยเกี่ยวกับ ValuStock</h2>
        <div className="mt-4 divide-y divide-line">
          {faqItems.map((item) => (
            <div key={item.q} className="py-4 first:pt-0 last:pb-0">
              <h3 className="font-display text-base font-black text-ink">{item.q}</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function TickerGroup({ title, items, hrefPrefix }: { title: string; items: string[]; hrefPrefix: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg p-4">
      <h3 className="font-display text-lg font-black text-ink">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <Link key={item} href={`${hrefPrefix}/${item.toLowerCase()}`} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-bold text-muted hover:border-brand/40 hover:text-brand">
            {item}
          </Link>
        ))}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "DCF คืออะไร? วิธีคำนวณมูลค่าหุ้นด้วย DCF Calculator สำหรับมือใหม่",
  description:
    "คู่มือ DCF Calculator สำหรับประเมินมูลค่าหุ้น อธิบาย Free Cash Flow, WACC, Terminal Value, Margin of Safety พร้อมสูตรและตัวอย่างสำหรับนักลงทุนไทย",
  keywords: [
    "DCF คืออะไร",
    "dcf calculator",
    "dcf calculator หุ้น",
    "เครื่องคำนวณ dcf",
    "คำนวณ dcf หุ้น",
    "ประเมินมูลค่าหุ้น",
    "วิธีประเมินมูลค่าหุ้น",
    "กระแสเงินสดคิดลด",
    "Discounted Cash Flow",
    "Free Cash Flow คือ",
    "WACC คือ",
    "Terminal Value คือ",
    "Margin of Safety คือ",
    "ราคาเหมาะสมหุ้น",
    "intrinsic value หุ้น",
    "หุ้นถูกหรือแพง",
    "นักลงทุน VI",
  ],
  alternates: {
    canonical: "https://valustock.com/insights/dcf-calculator-stock-valuation",
  },
  openGraph: {
    type: "article",
    locale: "th_TH",
    url: "https://valustock.com/insights/dcf-calculator-stock-valuation",
    title: "DCF คืออะไร? วิธีคำนวณมูลค่าหุ้นด้วย DCF Calculator",
    description:
      "อธิบาย DCF, Free Cash Flow, WACC, Terminal Value และ Margin of Safety สำหรับประเมินมูลค่าหุ้นแบบเข้าใจง่าย",
    siteName: "ValuStock",
  },
  twitter: {
    card: "summary_large_image",
    title: "DCF คืออะไร? วิธีคำนวณมูลค่าหุ้นด้วย DCF Calculator",
    description:
      "คู่มือ DCF Calculator สำหรับมือใหม่ พร้อมสูตรและวิธีอ่านผลเพื่อดูว่าหุ้นถูกหรือแพง",
  },
};

const faqItems = [
  {
    q: "DCF คืออะไร?",
    a: "DCF หรือ Discounted Cash Flow คือวิธีประเมินมูลค่ากิจการจากกระแสเงินสดอิสระในอนาคต แล้วคิดลดกลับมาเป็นมูลค่าปัจจุบันด้วยอัตราคิดลด เช่น WACC หรือผลตอบแทนที่นักลงทุนต้องการ",
  },
  {
    q: "DCF Calculator ใช้ข้อมูลอะไรบ้าง?",
    a: "ข้อมูลหลักคือ Free Cash Flow, Growth Rate, Discount Rate หรือ WACC, Terminal Growth, Net Debt และจำนวนหุ้นทั้งหมด เพื่อนำไปคำนวณมูลค่าเหมาะสมต่อหุ้น",
  },
  {
    q: "WACC ควรใช้เท่าไร?",
    a: "หุ้นใหญ่ที่กำไรมั่นคงอาจใช้ประมาณ 7-9% ส่วนหุ้นเติบโตสูง วัฏจักร หนี้มาก หรือคาดการณ์ยากควรใช้อัตราสูงขึ้น เช่น 10-14% เพื่อสะท้อนความเสี่ยง",
  },
  {
    q: "Terminal Value คืออะไร?",
    a: "Terminal Value คือมูลค่าของธุรกิจหลังช่วงประมาณการ เช่น หลังปีที่ 10 ซึ่งมักเป็นส่วนใหญ่ของมูลค่า DCF จึงต้องตั้ง Terminal Growth อย่างระมัดระวัง",
  },
  {
    q: "DCF เหมาะกับหุ้นทุกตัวไหม?",
    a: "ไม่เสมอไป DCF เหมาะกับธุรกิจที่มีกระแสเงินสดคาดการณ์ได้พอสมควร หากเป็นหุ้นขาดทุน ธุรกิจวัฏจักร หรือกำไรผันผวนมาก ควรใช้หลาย scenario และเผื่อ Margin of Safety สูงขึ้น",
  },
];

const steps = [
  {
    title: "หา Free Cash Flow ที่เชื่อถือได้",
    desc: "เริ่มจาก FCF ล่าสุดหรือค่าเฉลี่ยย้อนหลัง 3-5 ปี ถ้าธุรกิจมีวัฏจักรแรง ไม่ควรใช้ตัวเลขปีเดียวที่สูงผิดปกติ",
  },
  {
    title: "ประมาณการเติบโตอย่างอนุรักษ์นิยม",
    desc: "แบ่ง growth เป็นช่วง เช่น ปี 1-5 และปี 6-10 โดยช่วงหลังควรลดลงใกล้การเติบโตระยะยาวของธุรกิจมากขึ้น",
  },
  {
    title: "กำหนด WACC หรืออัตราคิดลด",
    desc: "WACC คือผลตอบแทนขั้นต่ำที่ควรได้รับจากความเสี่ยงของธุรกิจ ยิ่งธุรกิจเสี่ยงหรือคาดการณ์ยาก อัตราคิดลดควรสูงขึ้น",
  },
  {
    title: "คำนวณ Terminal Value",
    desc: "ใช้ Gordon Growth Model โดย Terminal Growth ต้องต่ำกว่า WACC เสมอ และไม่ควรสูงกว่าอัตราเติบโตเศรษฐกิจระยะยาว",
  },
  {
    title: "หักหนี้สุทธิและหารจำนวนหุ้น",
    desc: "หลังได้ Enterprise Value ให้หัก Net Debt แล้วหารด้วยจำนวนหุ้น เพื่อหา Fair Value หรือราคาเหมาะสมต่อหุ้น",
  },
  {
    title: "เทียบราคาตลาดกับ Margin of Safety",
    desc: "หากราคาตลาดต่ำกว่ามูลค่าประเมินมากพอ เช่น 15-30% อาจมีแต้มต่อ แต่ยังต้องตรวจคุณภาพธุรกิจและความเสี่ยงเสมอ",
  },
];

export default function DcfStockValuationArticlePage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://valustock.com/insights/dcf-calculator-stock-valuation#article",
        "headline": "DCF คืออะไร? วิธีคำนวณมูลค่าหุ้นด้วย DCF Calculator สำหรับมือใหม่",
        "description": "คู่มือ DCF Calculator สำหรับประเมินมูลค่าหุ้น อธิบาย Free Cash Flow, WACC, Terminal Value และ Margin of Safety",
        "datePublished": "2026-05-26",
        "dateModified": "2026-06-01",
        "author": {
          "@type": "Organization",
          "name": "ValuStock"
        },
        "publisher": {
          "@type": "Organization",
          "name": "ValuStock",
          "logo": {
            "@type": "ImageObject",
            "url": "https://valustock.com/logo.png"
          }
        },
        "mainEntityOfPage": "https://valustock.com/insights/dcf-calculator-stock-valuation"
      },
      {
        "@type": "FAQPage",
        "@id": "https://valustock.com/insights/dcf-calculator-stock-valuation#faq",
        "mainEntity": faqItems.map((faq) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://valustock.com/insights/dcf-calculator-stock-valuation#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "ValuStock",
            "item": "https://valustock.com",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Insights",
            "item": "https://valustock.com/insights",
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "DCF Calculator Stock Valuation",
            "item": "https://valustock.com/insights/dcf-calculator-stock-valuation",
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="space-y-8">
        <header className="surface rounded-2xl border border-line bg-surface/40 p-6">
          <nav className="mb-5 flex flex-wrap gap-2 text-[11px] font-bold text-muted">
            <Link href="/" className="hover:text-brand">หน้าแรก</Link>
            <span>/</span>
            <Link href="/insights" className="hover:text-brand">บทวิเคราะห์</Link>
            <span>/</span>
            <span className="text-brand">DCF Calculator</span>
          </nav>
          <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold">
            คู่มือประเมินมูลค่าหุ้น
          </span>
          <h1 className="mt-4 font-display text-2xl font-black leading-tight text-ink sm:text-4xl">
            DCF คืออะไร? วิธีคำนวณมูลค่าหุ้นด้วย DCF Calculator สำหรับมือใหม่
          </h1>
          <p className="mt-4 text-sm font-medium leading-relaxed text-muted sm:text-base">
            Discounted Cash Flow หรือ DCF คือหนึ่งในวิธีประเมินมูลค่าหุ้นที่นักลงทุนระยะยาวใช้เพื่อดูว่า
            ราคาหุ้นปัจจุบันถูกหรือแพงเมื่อเทียบกับกระแสเงินสดที่ธุรกิจน่าจะสร้างได้ในอนาคต บทความนี้สรุปสูตร
            วิธีคิด และข้อควรระวังแบบใช้งานได้จริงสำหรับนักลงทุนไทย
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["DCF คืออะไร", "Free Cash Flow", "WACC", "Terminal Value", "Margin of Safety"].map((item) => (
              <span key={item} className="rounded-full border border-line bg-bg px-3 py-1 text-[11px] font-bold text-muted">
                {item}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-muted">
            <span>เผยแพร่: 26 พ.ค. 2026</span>
            <span>เวลาอ่าน: 10 นาที</span>
            <span>ผู้เขียน: ValuStock Research</span>
          </div>
        </header>

        <Card className="border border-line p-5 sm:p-6">
          <h2 className="font-display text-xl font-black text-ink">สรุปสั้น: DCF ใช้ตอบคำถามอะไร?</h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-muted">
            DCF ใช้ตอบคำถามว่า “ธุรกิจนี้ควรมีมูลค่าเท่าไรจากเงินสดที่สร้างได้จริง” ไม่ใช่แค่ดูว่าหุ้นขึ้นหรือลง
            หรือ P/E ต่ำหรือสูง วิธีนี้เหมาะกับนักลงทุนที่ต้องการคิดแบบเจ้าของกิจการ เพราะมูลค่าหุ้นระยะยาวมักผูกกับ
            ความสามารถในการสร้าง Free Cash Flow และการเติบโตที่ยั่งยืน
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-bg p-4">
              <div className="font-display text-sm font-bold text-ink">ใช้หา Fair Value</div>
              <p className="mt-1 text-xs leading-relaxed text-muted">ประเมินราคาเหมาะสมต่อหุ้นจากกระแสเงินสดในอนาคต</p>
            </div>
            <div className="rounded-xl border border-line bg-bg p-4">
              <div className="font-display text-sm font-bold text-ink">ใช้วัด MOS</div>
              <p className="mt-1 text-xs leading-relaxed text-muted">เทียบราคาตลาดกับมูลค่าประเมินเพื่อหาส่วนเผื่อความปลอดภัย</p>
            </div>
            <div className="rounded-xl border border-line bg-bg p-4">
              <div className="font-display text-sm font-bold text-ink">ใช้ทดสอบสมมติฐาน</div>
              <p className="mt-1 text-xs leading-relaxed text-muted">ลองปรับ growth, WACC และ terminal growth เพื่อดูช่วงมูลค่า</p>
            </div>
          </div>
        </Card>

        <section className="space-y-5">
          <h2 className="font-display text-2xl font-black text-ink">สูตร DCF แบบเข้าใจง่าย</h2>
          <p className="text-sm font-medium leading-relaxed text-muted">
            หลักของ DCF คือคาดการณ์ Free Cash Flow ในอนาคต แล้วคิดลดกลับมาเป็นมูลค่าปัจจุบัน จากนั้นรวม Terminal Value
            หักหนี้สินสุทธิ และหารด้วยจำนวนหุ้นทั้งหมด
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border border-line bg-surface/25 p-5">
              <h3 className="font-display text-base font-black text-ink">1. Present Value of FCF</h3>
              <div className="mt-3 rounded-xl border border-line bg-bg p-3 font-mono text-[11px] font-bold text-gold">
                PV = FCFₙ ÷ (1 + WACC)ⁿ
              </div>
              <p className="mt-3 text-xs font-medium leading-relaxed text-muted">
                กระแสเงินสดในอนาคตต้องถูกคิดลด เพราะเงินในอนาคตมีมูลค่าน้อยกว่าเงินวันนี้
              </p>
            </Card>
            <Card className="border border-line bg-surface/25 p-5">
              <h3 className="font-display text-base font-black text-ink">2. Terminal Value</h3>
              <div className="mt-3 rounded-xl border border-line bg-bg p-3 font-mono text-[11px] font-bold text-gold">
                TV = FCF₁₀ × (1 + g) ÷ (WACC - g)
              </div>
              <p className="mt-3 text-xs font-medium leading-relaxed text-muted">
                มูลค่าหลังช่วงประมาณการ มักเป็นสัดส่วนใหญ่ของ DCF จึงควรตั้ง g อย่างระมัดระวัง
              </p>
            </Card>
            <Card className="border border-line bg-surface/25 p-5">
              <h3 className="font-display text-base font-black text-ink">3. Fair Value Per Share</h3>
              <div className="mt-3 rounded-xl border border-line bg-bg p-3 font-mono text-[11px] font-bold text-gold">
                (PV FCF + PV TV - Net Debt) ÷ Shares
              </div>
              <p className="mt-3 text-xs font-medium leading-relaxed text-muted">
                หักหนี้สินสุทธิและหารจำนวนหุ้น เพื่อได้ราคาเหมาะสมต่อหุ้นสำหรับเทียบกับราคาตลาด
              </p>
            </Card>
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="font-display text-2xl font-black text-ink">วิธีใช้ DCF Calculator ทีละขั้นตอน</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => (
              <Card key={step.title} className="border border-line bg-surface/25 p-5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10 font-mono text-xs font-black text-brand">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-display text-sm font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-xs font-medium leading-relaxed text-muted">{step.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="font-display text-2xl font-black text-ink">ตัวอย่างการตีความผลลัพธ์ DCF</h2>
          <Card className="border border-line bg-surface/25 p-5">
            <p className="text-sm font-medium leading-relaxed text-muted">
              สมมติว่าหุ้นตัวหนึ่งมีราคาตลาด 80 บาท แต่ DCF Calculator ประเมินมูลค่าเหมาะสมได้ 100 บาท
              ส่วนต่างนี้เท่ากับ Margin of Safety 20% หมายความว่าราคาตลาดต่ำกว่ามูลค่าประเมินพอสมควร
              แต่ไม่ได้แปลว่าต้องซื้อทันที นักลงทุนควรตรวจว่า FCF เติบโตจริงไหม หนี้สูงหรือไม่ ธุรกิจมีคูเมืองหรือเปล่า
              และสมมติฐาน WACC/Terminal Growth เข้มงวดพอหรือยัง
            </p>
            <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs font-semibold leading-relaxed text-muted">
              ข้อควรจำ: DCF ให้ “ช่วงมูลค่า” มากกว่า “เลขเป๊ะ” การลองหลาย scenario เช่น conservative, base case และ optimistic
              จะช่วยให้เห็นความเสี่ยงของสมมติฐานได้ดีกว่าการยึดราคาเหมาะสมเพียงตัวเดียว
            </div>
          </Card>
        </section>

        <section className="grid gap-5 md:grid-cols-[1fr_0.9fr]">
          <Card className="border border-line bg-surface/25 p-5">
            <h2 className="font-display text-xl font-black text-ink">ข้อผิดพลาดที่พบบ่อยในการใช้ DCF</h2>
            <ul className="mt-4 space-y-3 text-xs font-medium leading-relaxed text-muted">
              <li><strong className="text-ink">ตั้ง Growth สูงเกินจริง:</strong> ถ้าคาดการณ์เติบโตสูงนานเกินไป มูลค่าหุ้นจะพุ่งเกินพื้นฐาน</li>
              <li><strong className="text-ink">ใช้ WACC ต่ำเกินไป:</strong> ธุรกิจเสี่ยงควรใช้อัตราคิดลดสูงขึ้น ไม่เช่นนั้น fair value จะสูงเกินจริง</li>
              <li><strong className="text-ink">มองข้ามหนี้สินสุทธิ:</strong> หนี้สูงทำให้มูลค่าของผู้ถือหุ้นลดลง แม้ Enterprise Value จะดูดี</li>
              <li><strong className="text-ink">ไม่ทำ Margin of Safety:</strong> สมมติฐานอาจผิดได้เสมอ จึงควรมีส่วนเผื่อความปลอดภัย</li>
            </ul>
          </Card>
          <Card className="border border-line bg-surface/25 p-5">
            <h2 className="font-display text-xl font-black text-ink">เครื่องมือที่ควรใช้ต่อ</h2>
            <div className="mt-4 space-y-2">
              {[
                { href: "/dcf-calculator", label: "เปิด DCF Calculator" },
                { href: "/intrinsic-value-calculator", label: "คำนวณ Intrinsic Value และ Graham Number" },
                { href: "/stocks", label: "สแกนหุ้นพื้นฐานดีด้วย Stock Screener" },
                { href: "/undervalued-stocks", label: "ดูหุ้น undervalue" },
                { href: "/stock-valuation", label: "อ่านคู่มือวิธีประเมินมูลค่าหุ้น" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-xl border border-line bg-bg px-3 py-2.5 text-xs font-bold text-muted transition hover:border-brand/40 hover:text-brand"
                >
                  {item.label}
                  <span>›</span>
                </Link>
              ))}
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl font-black text-ink">คำถามที่พบบ่อยเกี่ยวกับ DCF</h2>
          <div className="space-y-3">
            {faqItems.map((faq) => (
              <Card key={faq.q} className="border border-line bg-bg/40 p-5">
                <h3 className="font-display text-sm font-bold text-ink">{faq.q}</h3>
                <p className="mt-2 text-xs font-medium leading-relaxed text-muted">{faq.a}</p>
              </Card>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}

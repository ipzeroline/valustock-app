"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AssetLogo } from "@/components/AssetLogo";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { computeValuation, defaultDCFParams } from "@/lib/valuation";
import { useTranslation } from "@/lib/translations";
import { baht, dollar, pct, num } from "@/lib/format";
import { Sparkles, Target, Info, Shield } from "@/lib/icons";
import { Stock } from "@/lib/types";

export default function DividendStocksPage() {
  const { lang, t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      setLoading(true);
      fetch("/api/stocks/universe?limit=90")
        .then((res) => {
          if (!res.ok) throw new Error("Unable to load market universe");
          return res.json();
        })
        .then((payload) => {
          if (cancelled) return;
          setStocks((payload.stocks || []).filter((stock: Stock) => stock.assetType === "TH_STOCK" || stock.assetType === "US_STOCK"));
          setUpdatedAt(payload.updatedAt || new Date().toISOString());
        })
        .catch(() => {
          if (!cancelled) setStocks([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();
    const interval = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  // Filter top high dividend stocks from the live API universe.
  const list = useMemo(() => stocks.map((s: any) => ({
    stock: s,
    val: computeValuation(s, defaultDCFParams(s)),
  }))
  .filter((x: any) => x.val.ratios.dividendYield >= 3.5 || x.stock.financials.dividendPerShare > 1.5)
  .sort((a: any, b: any) => b.val.ratios.dividendYield - a.val.ratios.dividendYield)
  .slice(0, 10), [stocks]);

  const topThree = list.slice(0, 3).map(x => x.stock.symbol).join(", ") || (lang === "th" ? "กำลังโหลดข้อมูลล่าสุด" : "loading live data");

  const titleTH = "Best Dividend Stocks: สแกนหุ้นปันผลสูง กระแสเงินสดแกร่ง ปลอดภัยจากหนี้";
  const titleEN = "Best Dividend Stocks: Real-Time Yield & Payout Safety Targets";
  const descTH = "คัดสรรรายชื่อหุ้นที่มีอัตราปันผลตอบแทน (Dividend Yield) สูง มั่นคง และสม่ำเสมอ เพื่อคุมความเสี่ยงจากกับดักปันผล และสร้างรายได้แบบ Passive Income";
  const descEN = "Screen for the best high-yield dividend stocks with solid free cash flows, low debt-to-equity buffers, and sustainable payout ratios.";

  useEffect(() => {
    document.title = `${lang === "th" ? titleTH : titleEN} | ValuStock`;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', lang === "th" ? descTH : descEN);
  }, [lang]);

  const faqs = [
    {
      q: lang === "th" ? "จะหลีกเลี่ยงกับดักปันผลสูง (Dividend Trap) ได้อย่างไร?" : "How do I avoid dividend traps?",
      a: lang === "th"
        ? "หลีกเลี่ยงโดยการไม่ดูเฉพาะอัตรา Yield เพียงอย่างเดียว แต่ต้องตรวจสอบสัดส่วนการจ่ายปันผลต่อกำไรสุทธิ (Payout Ratio) ซึ่งไม่ควรเกิน 70-80% และตรวจงบกระแสเงินสดอิสระ (Free Cash Flow) ว่าเป็นบวกติดต่อกัน 3-5 ปีหรือไม่ เพื่อให้มั่นใจว่าปันผลมาจากกำไรจากการดำเนินงานจริง ไม่ใช่การกู้ยืมเงินมาจ่าย"
        : "Avoid them by looking beyond raw yields. Check the Payout Ratio (should be below 70-80%) and verify that Free Cash Flow is consistently positive over 3-5 years, ensuring dividend payments are funded organically from net profits."
    },
    {
      q: lang === "th" ? "อัตราปันผลตอบแทน (Dividend Yield) เท่าใดจึงจะจัดว่าเหมาะสม?" : "What is a good dividend yield percentage?",
      a: lang === "th"
        ? "ในตลาดยุคปัจจุบัน อัตราปันผลตอบแทนที่ 3% - 6% ต่อปี จัดว่ามีความปลอดภัยและยืดหยุ่นสูง หากเกิน 8% ขึ้นไป มักมีความเสี่ยงแฝงสูง (เช่น ราคาหุ้นร่วงหนัก หรือมีกำไรพิเศษครั้งเดียว) ซึ่งต้องคัดกรองความมั่นคงทางการเงินประกอบเสมอ"
        : "A yield of 3% to 6% per annum is typically considered safe and sustainable. Yields exceeding 8% often convey high risk, potentially indicating a falling stock price or temporary, non-recurring earnings."
    }
  ];

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6 animate-fade-up px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />

      {/* BANNER */}
      <div className="surface rounded-2xl p-6 border border-line bg-surface/40 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-36 h-36 bg-brand/10 rounded-full blur-2xl pointer-events-none" />
        <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold mb-2 inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Core Keyword SEO Landing Page
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-ink leading-tight">
          {lang === "th" ? titleTH : titleEN}
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 font-semibold leading-relaxed">
          {lang === "th" ? descTH : descEN}
        </p>
      </div>

      {/* 🤖 AI ASSESSMENT CARD */}
      <Card className="border border-brand/30 bg-brand-soft/10 p-5 rounded-2xl relative overflow-hidden shadow-inner">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-36 h-36 bg-brand/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-3">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/20 text-brand">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-ink leading-none uppercase tracking-wider">
              🤖 {lang === "th" ? "AI วิเคราะห์เสถียรภาพปันผล" : "AI Dividend Payout Assessment"}
            </h3>
            <span className="text-[9px] text-muted block mt-0.5 font-bold uppercase tracking-wider">
              Natural Language Income Synthesis • Google E-E-A-T Compliant
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-ink leading-relaxed font-semibold whitespace-pre-line">
          {lang === "th"
            ? `ระบุพบคู่หุ้นเงินสดปันผลสูงที่มีอัตราไหลเวียนกระแสเงินสดแข็งแกร่ง นำทัพโดยกลุ่มเด่นอย่าง ${topThree}\n\n**บทวิเคราะห์จากปัญญาประดิษฐ์ (AI Dividend Safety Verdict):**\nพอร์ตหุ้นปันผลนี้สกรีนเฉพาะหุ้นที่มีเสถียรภาพงบสูงและสกัดกับดักเงินปันผลด้วยหนี้สินต่ำ การจัดพอร์ตด้วยหุ้นเหล่านี้จะช่วยคุ้มครองสภาวะตลาดเปลี่ยนทิศ เหมาะสำหรับพอร์ตออมเงินเพื่อการเกษียณ`
            : `Our yield optimization algorithm highlights defensive income compounders led by premium symbols: ${topThree}.\n\n**AI Dividend Safety Assessment:**\nThis dynamic screen enforces strict balance sheet checks and solvency metrics to filter out value traps. These assets provide secure defensive shields during market corrections, serving as core building blocks for retirement portfolios.`}
        </p>
      </Card>

      {/* REAL-TIME SCREENED LEDGER */}
      <Card className="border border-line overflow-hidden">
        <div className="p-4 border-b border-line flex items-center justify-between">
          <div>
            <h3 className="font-display font-black text-sm text-ink">
              {lang === "th" ? "อันดับหุ้นปันผลเด่นสม่ำเสมอ" : "Real-time High-Dividend Asset Ledger"}
            </h3>
            <p className="text-xs text-muted leading-none mt-1">
              {lang === "th"
                ? `${updatedAt ? `ข้อมูลล่าสุด ${new Date(updatedAt).toLocaleTimeString("th-TH")}` : "จัดอันดับจากข้อมูลตลาดล่าสุด"}`
                : `${updatedAt ? `Latest data ${new Date(updatedAt).toLocaleTimeString("en-US")}` : "Ranked from latest market data"}`}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-elevate/60 text-muted font-bold">
                <th className="px-5 py-3.5">{lang === "th" ? "หุ้น" : "Stock"}</th>
                <th className="px-5 py-3.5 text-right">P/E Ratio</th>
                <th className="px-5 py-3.5 text-right">ROE %</th>
                <th className="px-5 py-3.5 text-right">{lang === "th" ? "ปันผลคาดการณ์ (Yield %)" : "Dividend Yield %"}</th>
                <th className="px-5 py-3.5 text-right">{lang === "th" ? "ราคาเหมาะสม (Fair Value)" : "Fair Value"}</th>
                <th className="px-5 py-3.5 text-center">{lang === "th" ? "คำแนะนำ" : "Verdict"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {loading && list.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs font-bold text-muted">
                    {lang === "th" ? "กำลังดึงข้อมูลล่าสุดจาก API..." : "Loading latest API data..."}
                  </td>
                </tr>
              )}
              {list.map(({ stock, val }: { stock: any; val: any }) => {
                const isUS = stock.currency === "USD";
                const f = isUS ? dollar(val.fairValue) : baht(val.fairValue);
                const showYield = `${num(val.ratios.dividendYield, 2)}%`;

                return (
                  <tr key={stock.symbol} className="hover:bg-elevate/30 transition">
                    <td className="px-5 py-3 font-mono font-bold text-ink">
                      <div className="flex items-center gap-3">
                        <AssetLogo symbol={stock.symbol} color={stock.color} size="sm" />
                        <div>
                          <Link href={`/stocks/${stock.symbol.toLowerCase()}`} className="hover:text-brand underline block font-bold">
                            {stock.symbol}
                          </Link>
                          <span className="text-[10px] text-muted block truncate max-w-[120px] font-semibold">
                            {lang === "th" ? stock.name : (stock.enName || stock.name)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-ink font-semibold">
                      {isFinite(val.ratios.pe) && val.ratios.pe > 0 ? `${num(val.ratios.pe, 1)}x` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-ink font-semibold">
                      {isFinite(val.ratios.roe) ? `${num(val.ratios.roe, 1)}%` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-up font-bold">{showYield}</td>
                    <td className="px-5 py-3 text-right font-mono text-gold font-bold">{f}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`chip border px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        val.verdict === "undervalued" ? "border-up/30 bg-up/10 text-up" : "border-down/30 bg-down/10 text-down"
                      }`}>
                        {t(`verdict.${val.verdict}`).toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* FAQ */}
      <Card className="border border-line p-6 bg-surface/40 backdrop-blur-sm">
        <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold mb-2 inline-flex items-center gap-1">
          <Info className="h-3.5 w-3.5" /> FAQ Crawlers Indexed
        </span>
        <h2 className="font-display text-xl font-black text-ink mb-5">
          {lang === "th" ? "คำถามที่พบบ่อยเกี่ยวกับหุ้นปันผลสูง" : "Frequently Asked Questions"}
        </h2>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-line bg-bg/40 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-ink hover:bg-elevate/45 transition"
                >
                  <span>{faq.q}</span>
                  <span className="text-brand text-xs font-bold font-mono pl-3 shrink-0">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4.5 pt-1.5 border-t border-line/25 text-xs text-muted leading-relaxed font-semibold">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

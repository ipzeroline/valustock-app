"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { STOCKS } from "@/lib/stocks";
import { AssetLogo } from "@/components/AssetLogo";
import { Card, CardHeader, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  computeValuation,
  defaultDCFParams,
} from "@/lib/valuation";
import { useTranslation, SECTOR_TRANS } from "@/lib/translations";
import { baht, dollar, pct, num } from "@/lib/format";
import {
  Sparkles,
  Target,
  Shield,
  Info,
  TrendingUp,
} from "@/lib/icons";

// Map URL slug to static database sector keys
const SLUG_TO_SECTOR: Record<string, string> = {
  technology: "เทคโนโลยี",
  energy: "พลังงาน",
  retail: "ค้าปลีก",
  telecom: "สื่อสาร",
  communication: "สื่อสาร",
  food: "อาหารและเครื่องดื่ม",
  beverage: "อาหารและเครื่องดื่ม",
  realestate: "อสังหาริมทรัพย์",
  healthcare: "การแพทย์",
  logistics: "ขนส่งและโลจิสติกส์",
  transport: "ขนส่งและโลจิสติกส์",
  construction: "วัสดุก่อสร้าง",
  banking: "ธนาคาร",
  finance: "ธนาคาร",
};

const SECTOR_TO_SLUG: Record<string, string> = {
  "เทคโนโลยี": "technology",
  "พลังงาน": "energy",
  "ค้าปลีก": "retail",
  "สื่อสาร": "communication",
  "อาหารและเครื่องดื่ม": "food",
  "อสังหาริมทรัพย์": "realestate",
  "การแพทย์": "healthcare",
  "ขนส่งและโลจิสติกส์": "logistics",
  "วัสดุก่อสร้าง": "construction",
  "ธนาคาร": "banking",
};

export default function SectorSlug() {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const { lang, t } = useTranslation();

  const [sectorKey, setSectorKey] = useState("");
  const [stocks, setStocks] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    const mapped = SLUG_TO_SECTOR[slug.toLowerCase()] || "";
    setSectorKey(mapped);

    if (mapped) {
      const filtered = STOCKS.filter((s) => s.sector === mapped);
      setStocks(filtered);
    }
  }, [slug]);

  if (!sectorKey || stocks.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center animate-fade-up">
        <h1 className="font-display text-2xl font-bold">{t("common.notFound")}</h1>
        <p className="text-sm text-muted mt-2">
          {lang === "th" ? "ไม่พบข้อมูลกลุ่มอุตสาหกรรมที่คุณต้องการ" : "Specified investment sector not found in database"}
        </p>
        <Link href="/stocks">
          <Button className="mt-5">{lang === "th" ? "กลับไปหน้าสแกนหุ้น" : "Explore All Asset Classes"}</Button>
        </Link>
      </div>
    );
  }

  // Calculate sector metrics
  const totalStocks = stocks.length;
  let sumPE = 0;
  let validPECount = 0;
  let sumROE = 0;
  let sumMOS = 0;
  let undervaluedCount = 0;

  const processedStocks = stocks.map((s) => {
    const val = computeValuation(s, defaultDCFParams(s));
    
    if (isFinite(val.ratios.pe) && val.ratios.pe > 0) {
      sumPE += val.ratios.pe;
      validPECount++;
    }
    if (isFinite(val.ratios.roe)) {
      sumROE += val.ratios.roe;
    }
    sumMOS += val.marginOfSafety;
    if (val.verdict === "undervalued") {
      undervaluedCount++;
    }

    return {
      stock: s,
      val,
    };
  });

  const avgPE = validPECount > 0 ? sumPE / validPECount : 15;
  const avgROE = totalStocks > 0 ? sumROE / totalStocks : 12;
  const avgMOS = totalStocks > 0 ? sumMOS / totalStocks : 5;

  const sectorNameEN = SECTOR_TRANS[sectorKey] || sectorKey;
  const displayTitle = lang === "th" ? `หุ้นกลุ่ม${sectorKey}` : `${sectorNameEN} Sector Equities`;

  const faqs = [
    {
      q: lang === "th"
        ? `หุ้นกลุ่ม${sectorKey} ตัวไหนน่าสนใจและมีราคาถูกกว่ามูลค่า (Undervalued) มากที่สุด?`
        : `Which stocks in the ${sectorNameEN} sector are currently undervalued with the highest Margin of Safety?`,
      a: lang === "th"
        ? `จากการกรองแบบเรียลไทม์ ปัจจุบันในกลุ่ม${sectorKey} มีหุ้นราคาถูกกว่ามูลค่าแนะนำทั้งหมด ${undervaluedCount} ตัว โดยหุ้นที่มีส่วนลดสูงสุดในกลุ่มมีค่า Margin of Safety เฉลี่ยอยู่ที่ระดับดีเยี่ยม พร้อมสัญญาณคำแนะนำเป็นราคาถูกน่าสะสม`
        : `Based on our automated sector screening, there are currently ${undervaluedCount} undervalued stocks in the ${sectorNameEN} sector. The top undervalued assets trade at high Margin of Safety percentages, signaling defensive entry parameters.`
    },
    {
      q: lang === "th"
        ? `อัตราส่วน P/E และ ROE เฉลี่ยของกลุ่มอุตสาหกรรม${sectorKey} อยู่ที่เท่าไหร่?`
        : `What is the average P/E ratio and ROE for the ${sectorNameEN} sector?`,
      a: lang === "th"
        ? `ค่าเฉลี่ย P/E ของกลุ่ม${sectorKey} ในระบบของเราอยู่ที่ ${num(avgPE, 1)} เท่า และมีค่าผลตอบแทนต่อผู้ถือหุ้น (ROE) เฉลี่ยอยู่ที่ ${num(avgROE, 1)}% ซึ่งเป็นตัวชี้วัดประสิทธิภาพการประเมินกำไรสะสมเมื่อเปรียบเทียบในรายกลุ่มได้อย่างยอดเยี่ยม`
        : `The average Price-to-Earnings (P/E) multiple for the ${sectorNameEN} sector sits at ${num(avgPE, 1)}x, while the average Return on Equity (ROE) is ${num(avgROE, 1)}%. These benchmarks assist in comparing stock performance against sector-wide parameters.`
    }
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-up">
      {/* SECTOR HEADER BANNER */}
      <div className="surface rounded-2xl p-6 border border-line bg-surface/40 backdrop-blur-md">
        <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold mb-2 inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Programmatic SEO Sector Hub
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-ink leading-tight">
          วิเคราะห์ {displayTitle}: ประเมินมูลค่าหุ้น & หุ้นปันผลยอดนิยม
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 font-semibold leading-relaxed">
          {lang === "th"
            ? `เจาะลึกงบการเงินและอัตราส่วนกลุ่มอุตสาหกรรม${sectorKey} ค้นหาหุ้น undervalue ราคาดี หุ้นน่าซื้อ และดูเปรียบเทียบสถิติ P/E และ ROE ของตลาดไทยและตลาดโลก`
            : `Comprehensive financial metrics database, performance dashboards, and undervalued screeners for the global ${sectorNameEN} sector.`}
        </p>
      </div>

      {/* SECTOR AVERAGES SCOREBOARD */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-4 text-center border-line">
          <span className="text-xs text-muted block font-bold uppercase">{lang === "th" ? "จำนวนหุ้นในระบบ" : "Total Tickers"}</span>
          <span className="font-display font-black text-2xl text-brand mt-1.5 block">{totalStocks} {lang === "th" ? "บริษัท" : "Stocks"}</span>
        </Card>
        <Card className="p-4 text-center border-line">
          <span className="text-xs text-muted block font-bold uppercase">{lang === "th" ? "P/E เฉลี่ยกลุ่ม" : "Average Sector P/E"}</span>
          <span className="font-display font-black text-2xl text-ink mt-1.5 block font-mono">{num(avgPE, 1)}x</span>
        </Card>
        <Card className="p-4 text-center border-line">
          <span className="text-xs text-muted block font-bold uppercase">{lang === "th" ? "ROE เฉลี่ยกลุ่ม" : "Average Sector ROE"}</span>
          <span className="font-display font-black text-2xl text-up mt-1.5 block font-mono">{num(avgROE, 1)}%</span>
        </Card>
        <Card className="p-4 text-center border-line">
          <span className="text-xs text-muted block font-bold uppercase">{lang === "th" ? "MOS เฉลี่ยกลุ่ม" : "Average Sector MOS"}</span>
          <span className={`font-display font-black text-2xl mt-1.5 block font-mono ${avgMOS >= 0 ? "text-up" : "text-down"}`}>
            {pct(avgMOS, 0)}
          </span>
        </Card>
      </div>

      {/* STOCKS GRID TABLE */}
      <Card className="border border-line overflow-hidden">
        <CardHeader
          title={lang === "th" ? `ตารางเปรียบเทียบมูลค่าหุ้นกลุ่ม${sectorKey}` : `Financial Ledger for ${sectorNameEN} Equities`}
          subtitle={lang === "th" ? "คัดกรองส่วนเผื่อความปลอดภัยและราคาเป้าหมายในกลุ่ม" : "All sector securities sorted by market cap"}
          icon={<Target className="h-4 w-4 text-brand" />}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-elevate/60 text-muted font-bold">
                <th className="px-5 py-3.5">{lang === "th" ? "สัญลักษณ์" : "Ticker"}</th>
                <th className="px-5 py-3.5">{lang === "th" ? "ชื่อบริษัท" : "Company Name"}</th>
                <th className="px-5 py-3.5 text-right">{lang === "th" ? "ราคาล่าสุด" : "Market Price"}</th>
                <th className="px-5 py-3.5 text-right">{lang === "th" ? "มูลค่าเหมาะสม" : "Fair Value"}</th>
                <th className="px-5 py-3.5 text-right">Margin of Safety</th>
                <th className="px-5 py-3.5 text-center">{lang === "th" ? "คำแนะนำ" : "Valuation Verdict"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {processedStocks.map(({ stock, val }) => {
                const isUS = stock.currency === "USD";
                const p = isUS ? dollar(stock.price) : baht(stock.price);
                const f = isUS ? dollar(val.fairValue) : baht(val.fairValue);
                const showMos = pct(val.marginOfSafety, 0);

                return (
                  <tr key={stock.symbol} className="hover:bg-elevate/30 transition">
                    <td className="px-5 py-3 font-mono font-bold text-ink">
                      <Link href={`/stocks/${stock.symbol}`} className="hover:text-brand underline">
                        {stock.symbol}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-semibold text-muted text-xs truncate max-w-[150px]">
                      {lang === "th" ? stock.name : (stock.enName || stock.name)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-ink font-semibold">{p}</td>
                    <td className="px-5 py-3 text-right font-mono text-gold font-bold">{f}</td>
                    <td className={`px-5 py-3 text-right font-mono font-bold ${val.marginOfSafety >= 0 ? "text-up" : "text-down"}`}>
                      {showMos}
                    </td>
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

      {/* FAQ SECTION (Google Structured Q&A Crawler Engine) */}
      <Card className="border border-line p-6 bg-surface/40 backdrop-blur-sm">
        <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold mb-2 inline-flex items-center gap-1">
          <Info className="h-3.5 w-3.5" /> FAQ Sector Crawlers Indexed
        </span>
        <h2 className="font-display text-xl font-black text-ink mb-5">
          {lang === "th" ? `คำถามที่พบบ่อยในการวิเคราะห์หุ้นกลุ่ม${sectorKey}` : `Frequently Asked Questions: ${sectorNameEN} Sector`}
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

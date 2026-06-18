"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AssetLogo } from "@/components/AssetLogo";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  computeValuation,
  defaultDCFParams,
} from "@/lib/valuation";
import { useTranslation } from "@/lib/translations";
import { baht, dollar, pct, num } from "@/lib/format";
import {
  Sparkles,
  Target,
  Shield,
  Info,
} from "@/lib/icons";
import { Stock } from "@/lib/types";

export default function CountrySlug() {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const { lang, t } = useTranslation();

  const [countryKey, setCountryKey] = useState("");
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    const lower = slug.toLowerCase();
    
    let key = "";
    if (lower === "usa" || lower === "us") {
      key = "usa";
    } else if (lower === "thailand" || lower === "th") {
      key = "thailand";
    }
    
    setCountryKey(key);
    if (!key) {
      setStocks([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch("/api/stocks/universe?limit=90")
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load market universe");
        return res.json();
      })
      .then((payload) => {
        if (cancelled) return;
        const liveStocks = (payload.stocks || []).filter((stock: Stock) => {
          if (stock.assetType !== "TH_STOCK" && stock.assetType !== "US_STOCK") return false;
          return key === "usa" ? stock.currency === "USD" : stock.currency === "THB";
        });
        setStocks(liveStocks);
      })
      .catch(() => {
        if (!cancelled) setStocks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center animate-fade-up">
        <h1 className="font-display text-2xl font-bold">{lang === "th" ? "กำลังดึงข้อมูลตลาดล่าสุด" : "Loading live market data"}</h1>
        <p className="text-sm text-muted mt-2">
          {lang === "th" ? "โหลดข้อมูลจากเซิร์ฟเวอร์เพื่อจัดอันดับตามประเทศ" : "Fetching real-time market data for this country."}
        </p>
      </div>
    );
  }

  if (!countryKey || stocks.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center animate-fade-up">
        <h1 className="font-display text-2xl font-bold">{t("common.notFound")}</h1>
        <p className="text-sm text-muted mt-2">
          {lang === "th" ? "ไม่พบข้อมูลกลุ่มประเทศที่คุณต้องการ" : "Specified geographic country not found in database"}
        </p>
        <Link href="/stocks">
          <Button className="mt-5">{lang === "th" ? "กลับไปหน้าสแกนหุ้น" : "Explore All Asset Classes"}</Button>
        </Link>
      </div>
    );
  }

  // Calculate country stats
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

  const countryNameTH = countryKey === "usa" ? "สหรัฐอเมริกา" : "ประเทศไทย";
  const countryNameEN = countryKey === "usa" ? "United States" : "Thailand";
  const displayTitle = lang === "th" ? `ตลาดหุ้น${countryNameTH}` : `${countryNameEN} Equities Market`;

  const faqs = [
    {
      q: lang === "th"
        ? `ลงทุนในหุ้น${countryNameTH} ตัวไหนดี และมีตัวไหนที่ราคา undervalue ต่ำกว่ามูลค่าที่สุด?`
        : `Which stocks in ${countryNameEN} are currently undervalued with the highest Margin of Safety?`,
      a: lang === "th"
        ? `จากการสแกนดัชนี มีหุ้นใน${countryNameTH} ที่เป็นประเภทราคาต่ำกว่ามูลค่าแนะนำจำนวน ${undervaluedCount} บริษัท ซึ่งมีส่วนเผื่อความปลอดภัยที่ยอดเยี่ยม เหมาะสำหรับผู้ถือครองสัญญาระยะยาวเพื่อจำกัดความเสี่ยงพอร์ต`
        : `Our quantitative screen identifies ${undervaluedCount} undervalued stocks in the ${countryNameEN} market. These tickers represent defensive entry buffers based on deep margin-of-safety discounts.`
    },
    {
      q: lang === "th"
        ? countryKey === "usa"
          ? "มีกฎหมายภาษีหรือข้อควรระวังอย่างไรสำหรับคนไทยที่ลงทุนในหุ้นสหรัฐฯ?"
          : "มีปัจจัยเสี่ยงและภาษีปันผลสำหรับคนไทยที่ลงทุนในหุ้นไทยอย่างไร?"
        : `What are the tax implications and withholding policies for ${countryNameEN} assets?`,
      a: lang === "th"
        ? countryKey === "usa"
          ? "ปันผลหุ้นสหรัฐฯ จะถูกหักภาษี ณ ที่จ่ายตามมาตรฐาน 30% แต่คนไทยสามารถยื่นแบบฟอร์ม W-8BEN เพื่อลดเหลือ 15% ได้ตามอนุสัญญาภาษีซ้อน และแนะนำหลีกเลี่ยงการนำเงินกำไรกลับประเทศในปีภาษีเดียวกันเพื่อลดการคิดคำนวณเสียภาษีซ้ำซ้อนในไทย"
          : "การลงทุนในหุ้นไทยได้รับความสะดวกด้านภาษีปันผล ซึ่งคนไทยสามารถนำไปขอเครดิตภาษีเงินปันผลคืนได้ตามสัดส่วนการเสียภาษีของบริษัทผู้จ่ายเงินปันผล อย่างไรก็ควรระวังค่าเฉลี่ย P/E ตลาดโดยรวมเพื่อหาจังหวะสะสมที่เหมาะสมที่สุด"
        : countryKey === "usa"
          ? "Offshore investors are subject to a standard 30% dividend withholding tax in the US, which can generally be reduced to 15% by filing a W-8BEN form under double-taxation treaties."
          : "Thai residents benefit from domestic dividend tax credits depending on corporate tax rates, offering a powerful compounding advantage for value investors."
    }
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-up">
      {/* COUNTRY HEADER BANNER */}
      <div className="surface rounded-2xl p-6 border border-line bg-surface/40 backdrop-blur-md">
        <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold mb-2 inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Programmatic SEO Country Hub
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-ink leading-tight">
          วิเคราะห์ {displayTitle}: เครื่องมือสแกนหาหุ้นน่าซื้อ & หุ้นปันผลสูง
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 font-semibold leading-relaxed">
          {lang === "th"
            ? `เจาะลึกงบการเงินและอัตราส่วนเฉลี่ยของตลาดหุ้น${countryNameTH} คัดกรองหุ้นเติบโต หุ้นงบแกร่งหนี้ต่ำ และเปรียบเทียบราคาที่เหมาะสมในดัชนี ${countryKey === "usa" ? "S&P 500 / NASDAQ" : "SET / mai"}`
            : `Comprehensive stock screeners, performance dashboards, and undervalued financial analysis for the ${countryNameEN} equity market.`}
        </p>
      </div>

      {/* COUNTRY MARKET AVERAGES SCOREBOARD */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-4 text-center border-line">
          <span className="text-xs text-muted block font-bold uppercase">{lang === "th" ? "สินทรัพย์ในประเทศ" : "Index Assets"}</span>
          <span className="font-display font-black text-2xl text-brand mt-1.5 block">{totalStocks} {lang === "th" ? "ตัวหลัก" : "Equities"}</span>
        </Card>
        <Card className="p-4 text-center border-line">
          <span className="text-xs text-muted block font-bold uppercase">{lang === "th" ? "P/E ตลาดเฉลี่ย" : "Market Average P/E"}</span>
          <span className="font-display font-black text-2xl text-ink mt-1.5 block font-mono">{num(avgPE, 1)}x</span>
        </Card>
        <Card className="p-4 text-center border-line">
          <span className="text-xs text-muted block font-bold uppercase">{lang === "th" ? "ROE ตลาดเฉลี่ย" : "Market Average ROE"}</span>
          <span className="font-display font-black text-2xl text-up mt-1.5 block font-mono">{num(avgROE, 1)}%</span>
        </Card>
        <Card className="p-4 text-center border-line">
          <span className="text-xs text-muted block font-bold uppercase">{lang === "th" ? "ส่วนลดตลาดเฉลี่ย" : "Market Average MOS"}</span>
          <span className={`font-display font-black text-2xl mt-1.5 block font-mono ${avgMOS >= 0 ? "text-up" : "text-down"}`}>
            {pct(avgMOS, 0)}
          </span>
        </Card>
      </div>

      {/* TAX & GLOBAL COMPLIANCE WARNING */}
      <Card className={`border p-4.5 bg-bg/25 backdrop-blur-sm ${countryKey === "usa" ? "border-gold/30 bg-gold/5" : "border-brand/30 bg-brand/5"}`}>
        <div className="flex gap-3">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl font-bold ${countryKey === "usa" ? "bg-gold/15 text-gold" : "bg-brand/15 text-brand"}`}>
            🛡️
          </span>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-ink">
              {lang === "th" 
                ? `💡 ข้อมูลข้อบังคับและกฎหมายเฉพาะสำหรับตลาด ${countryNameTH}:` 
                : `💡 Essential investment compliance for the ${countryNameEN} market:`}
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              {lang === "th"
                ? countryKey === "usa"
                  ? "แนะนำศึกษาเกณฑ์ W-8BEN และเรื่องการรับรู้รายได้ข้ามขอบเขตประเทศเพื่อหลีกเลี่ยงการโดนภาษีซ้อนเชิงบุคคลในการนำเงินปันผลและส่วนต่างราคาหุ้นต่างประเทศกลับมาในปีงบการเงินเดียวกัน"
                  : "หุ้นไทยได้รับการคุ้มครองการขจัดภาษีซ้อนและการได้รับสิทธิ์ลดหย่อนเครดิตภาษีเงินปันผล แนะนำให้เลือกหุ้นที่จ่ายกระแสเงินสดปันผลที่อัตรา 3-5% ขึ้นไปเพื่อจัดเก็บเป็นเงินรับสะสมกระแสเงินสดเชิงรุก"
                : countryKey === "usa"
                  ? "Always secure a W-8BEN filing with your banking representative to automatically shave US tax withholdings down to a treaty-based 15% rate."
                  : "Thai residents benefit from domestic dividend tax credits depending on corporate tax rates, offering a powerful compounding advantage."}
            </p>
          </div>
        </div>
      </Card>

      {/* STOCKS GRID TABLE */}
      <Card className="border border-line overflow-hidden">
        <CardHeader
          title={lang === "th" ? `บัญชีรายชื่อหุ้นและมูลค่าเหมาะสมในประเทศ${countryNameTH}` : `Intrinsic Valuation Table for ${countryNameEN} Assets`}
          subtitle={lang === "th" ? "คัดกรองหุ้นตามสัญลักษณ์และส่วนเผื่อความปลอดภัยที่เหลืออยู่" : "All domestic assets sorted by Margin of Safety"}
          icon={<Target className="h-4 w-4 text-brand" />}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-elevate/60 text-muted font-bold">
                <th className="px-5 py-3.5">{lang === "th" ? "สัญลักษณ์" : "Ticker"}</th>
                <th className="px-5 py-3.5">{lang === "th" ? "ชื่อบริษัท" : "Company Name"}</th>
                <th className="px-5 py-3.5 text-right">{lang === "th" ? "ราคาตลาด" : "Market Price"}</th>
                <th className="px-5 py-3.5 text-right">{lang === "th" ? "เป้าเหมาะสม" : "Fair Value"}</th>
                <th className="px-5 py-3.5 text-right">Margin of Safety</th>
                <th className="px-5 py-3.5 text-center">{lang === "th" ? "สถานะการประเมิน" : "Valuation Verdict"}</th>
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
          <Info className="h-3.5 w-3.5" /> FAQ Country Crawlers Indexed
        </span>
        <h2 className="font-display text-xl font-black text-ink mb-5">
          {lang === "th" ? `คำถามที่พบบ่อยเกี่ยวกับการลงทุนในหุ้น${countryNameTH}` : `Frequently Asked Questions: Investing in ${countryNameEN}`}
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

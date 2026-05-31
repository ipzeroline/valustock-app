"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { STOCKS, getStock } from "@/lib/stocks";
import { AssetLogo } from "@/components/AssetLogo";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  computeValuation,
  defaultDCFParams,
  grahamNumber,
  enterpriseValue,
  marketCap,
} from "@/lib/valuation";
import { useTranslation, SECTOR_TRANS } from "@/lib/translations";
import { baht, dollar, pct, num, moneyMB } from "@/lib/format";
import {
  Sparkles,
  Target,
  Shield,
  Info,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ArrowRight,
} from "@/lib/icons";

export default function CompareSlug() {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const { lang, t } = useTranslation();

  const [stock1, setStock1] = useState<any>(null);
  const [stock2, setStock2] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    const parts = slug.toLowerCase().split("-vs-");
    if (parts.length >= 2) {
      const s1 = getStock(parts[0].toUpperCase());
      const s2 = getStock(parts[1].toUpperCase());
      setStock1(s1);
      setStock2(s2);
    }
    setLoading(false);
  }, [slug]);

  const name1 = stock1 ? (lang === "th" ? stock1.name : (stock1.enName || stock1.name)) : "";
  const name2 = stock2 ? (lang === "th" ? stock2.name : (stock2.enName || stock2.name)) : "";
  
  const val1 = stock1 ? computeValuation(stock1, defaultDCFParams(stock1)) : null;
  const val2 = stock2 ? computeValuation(stock2, defaultDCFParams(stock2)) : null;
  
  const graham1 = stock1 ? grahamNumber(stock1) : 0;
  const graham2 = stock2 ? grahamNumber(stock2) : 0;

  const isFund1 = stock1?.assetType === "FUND";
  const isFund2 = stock2?.assetType === "FUND";

  // Dynamic Programmatic SEO client title/description metadata sync
  useEffect(() => {
    if (!stock1 || !stock2) return;
    const title = lang === "th"
      ? `เปรียบเทียบหุ้น ${stock1.symbol} vs ${stock2.symbol}: วิเคราะห์ราคาเหมาะสม & อัตราส่วนการเงิน`
      : `Compare ${stock1.symbol} vs ${stock2.symbol} Stock Valuation: Ratios & Intrinsic Price`;
    const desc = lang === "th"
      ? `เจาะลึกงบการเงิน เปรียบเทียบ ${stock1.symbol} และ ${stock2.symbol} แบบเคียงข้างกัน ค้นหาหุ้นปันผลและมูลค่าเหมาะสมที่มี Margin of Safety ดีที่สุด`
      : `Compare ${stock1.symbol} vs ${stock2.symbol} side-by-side. Analyze P/E, ROE, dividend yields, expense ratios, and intrinsic fair values to identify the best entry price.`;
      
    document.title = `${title} | ValuStock`;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);
  }, [lang, stock1, stock2]);

  if (loading || (!stock1 && !stock2)) {
    return (
      <div className="mx-auto max-w-2xl py-32 text-center animate-pulse">
        <Sparkles className="mx-auto h-10 w-10 text-brand animate-spin" />
        <h2 className="mt-4 font-display text-lg font-bold text-ink">
          {lang === "th" ? "กำลังประมวลผลข้อมูลเปรียบเทียบเชิงลึก..." : "Running dynamic side-by-side financial audit..."}
        </h2>
      </div>
    );
  }

  // Handle single stock fallback or invalid slug
  if (!stock1 || !stock2 || !val1 || !val2) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center animate-fade-up">
        <h1 className="font-display text-2xl font-bold">{t("common.notFound")}</h1>
        <p className="text-sm text-muted mt-2">
          {lang === "th" ? "กรุณาระบุสัญลักษณ์เปรียบเทียบในรูปแบบ: AAPL-vs-MSFT" : "Please use the format: AAPL-vs-MSFT"}
        </p>
        <Link href="/compare">
          <Button className="mt-5">{lang === "th" ? "กลับไปหน้าเปรียบเทียบ" : "Back to Comparison"}</Button>
        </Link>
      </div>
    );
  }

  const formatP = (p: number, s: any) => {
    return s.currency === "USD" ? dollar(p) : baht(p);
  };

  const getVerdictTone = (verdict: string) => {
    if (verdict === "undervalued") return "text-up";
    if (verdict === "overvalued") return "text-down";
    return "text-muted";
  };

  // Determine better value entry
  const defensiveWinner = val1.marginOfSafety > val2.marginOfSafety ? stock1 : stock2;
  const defensiveLoser = defensiveWinner.symbol === stock1.symbol ? stock2 : stock1;
  const winnerMOS = Math.max(val1.marginOfSafety, val2.marginOfSafety);
  const loserMOS = Math.min(val1.marginOfSafety, val2.marginOfSafety);

  const getComparisonProse = () => {
    if (isFund1 && isFund2) {
      const exp1 = stock1.expenseRatio || 0;
      const exp2 = stock2.expenseRatio || 0;
      const cheaperExpSymbol = exp1 < exp2 ? stock1.symbol : stock2.symbol;
      const expensiveExpSymbol = cheaperExpSymbol === stock1.symbol ? stock2.symbol : stock1.symbol;
      const cheaperExp = Math.min(exp1, exp2);
      const expensiveExp = Math.max(exp1, exp2);
      
      if (lang === "th") {
        return `จากการวิเคราะห์เชิงเปรียบเทียบพอร์ตโฟลิโอระหว่างคู่กองทุนระดับโลก ${stock1.symbol} และ ${stock2.symbol} ด้วยระบบประมวลผลของ ValuStock\n\n**บทวิเคราะห์เชิงโครงสร้าง (Structural Index Review):**\nคู่กองทุนคู่นี้มีความโดดเด่นเฉพาะตัวในแง่ของสัดส่วนค่าใช้จ่าย โดย ${cheaperExpSymbol} ได้เปรียบอย่างเห็นได้ชัดด้วย Expense Ratio ที่ต่ำกว่าเพียง ${num(cheaperExp, 2)}% ต่อปี เมื่อเทียบกับ ${expensiveExpSymbol} ที่มีค่าใช้จ่าย ${num(expensiveExp, 2)}% ต่อปี ซึ่งในระยะยาวจะช่วยลดการกร่อนกำไรทบต้นของพอร์ตได้อย่างมีนัยสำคัญ\n\n**คำแนะนำการลงทุน (Strategic Allocation Advice):**\nหากคุณเป็นนักลงทุนแบบเน้นความคุ้มค่าและต้องการผลตอบแทนล้อไปกับดัชนีเป็นหลัก ${cheaperExpSymbol} คือทางเลือกที่ประหยัดกว่า อย่างไรก็ตาม ขอให้ตรวจสอบสินทรัพย์ที่กองทุนเข้าไปถือครอง (Underlying Holdings) และนโยบายจ่ายเงินปันผลประกอบการตัดสินใจเพื่อให้ตรงกับเป้าหมายกระแสเงินสดของคุณมากที่สุด`;
      } else {
        return `Based on our side-by-side ETF portfolio audit comparing ${stock1.symbol} and ${stock2.symbol} via the ValuStock engine.\n\n**Structural Index Review:**\nThis ETF matchup presents a clear cost-efficiency divide. ${cheaperExpSymbol} holds a significant structural advantage with a lower Expense Ratio of just ${num(cheaperExp, 2)}% per year, compared to ${expensiveExpSymbol} which charges a higher expense of ${num(expensiveExp, 2)}%. Over a multi-decade investing horizon, a lower expense ratio plays a critical role in preserving compounding returns from capital erosion.\n\n**Strategic Allocation Advice:**\nFor cost-sensitive passive index compounders, ${cheaperExpSymbol} stands out as the highly optimized choice. However, we advise reinvestors to examine the underlying asset holdings and the historical dividend payout frequencies to ensure complete alignment with your passive income objectives.`;
      }
    } else {
      const pe1 = val1.ratios.pe;
      const pe2 = val2.ratios.pe;
      const roe1 = val1.ratios.roe;
      const roe2 = val2.ratios.roe;
      
      const roeWinner = roe1 > roe2 ? stock1 : stock2;
      const roeLoser = roeWinner.symbol === stock1.symbol ? stock2 : stock1;
      const winningROE = Math.max(roe1, roe2);
      const losingROE = Math.min(roe1, roe2);

      const peWinner = (pe1 > 0 && pe2 > 0) ? (pe1 < pe2 ? stock1 : stock2) : (pe1 > 0 ? stock1 : stock2);
      const peLoser = peWinner.symbol === stock1.symbol ? stock2 : stock1;
      const winningPE = peWinner.symbol === stock1.symbol ? pe1 : pe2;
      const losingPE = peWinner.symbol === stock1.symbol ? pe2 : pe1;

      if (lang === "th") {
        return `จากการวิเคราะห์ปัจจัยพื้นฐานปะทะดวลอัตราส่วนการเงินระหว่างสองยักษ์ใหญ่แห่งวงการ ${stock1.symbol} และ ${stock2.symbol}\n\n**ด้านประสิทธิภาพการทำกำไร (Profitability & Capital Moat):**\nในแง่ของอัตราผลตอบแทนต่อส่วนของผู้ถือหุ้น (Return on Equity) พบว่า ${roeWinner.symbol} มีประสิทธิภาพบริหารทุนทบต้นที่สูงและแข็งแกร่งกว่าอย่างชัดเจนที่ระดับ ${num(winningROE, 1)}% เมื่อเทียบกับ ${roeLoser.symbol} ซึ่งสร้างผลตอบแทนได้ที่ระดับ ${num(losingROE, 1)}% อัตรา ROE ที่สูงนี้สะท้อนถึง Moat หรือคูเมืองทางธุรกิจที่หนาแน่นและความได้เปรียบเชิงโครงสร้างในตลาด\n\n**ด้านราคาและการประเมินมูลค่า (Multiple & Safety Margin Review):**\nเมื่อพิจารณาในเชิงความถูกแพง อัตราส่วน P/E บ่งชี้ว่า ${peWinner.symbol} ซื้อขายที่ตัวคูณอัตราส่วนถูกกว่าที่ระดับ ${isFinite(winningPE) && winningPE > 0 ? num(winningPE, 1) + " เท่า" : "—"} ขณะที่ ${peLoser.symbol} ซื้อขายที่ตัวคูณพรีเมียมขึ้นมาที่ ${isFinite(losingPE) && losingPE > 0 ? num(losingPE, 1) + " เท่า" : "—"}\n\nระบบประเมินว่า ${defensiveWinner.symbol} เป็นจุดซื้อที่ให้ส่วนเผื่อความปลอดภัย (Margin of Safety) สูงสุดในเวลานี้ เหมาะสำหรับสายออมหุ้นระยะยาว`;
      } else {
        return `Based on our rigorous side-by-side equity audit analyzing corporate fundamentals and multiples for industry titans ${stock1.symbol} and ${stock2.symbol}.\n\n**Capital moats & Profitability:**\nIn terms of Return on Equity (ROE), ${roeWinner.symbol} demonstrates superior capital efficiency and a wider economic moat, compounding shareholder equity at a robust rate of ${num(winningROE, 1)}% compared to ${roeLoser.symbol}'s rate of ${num(losingROE, 1)}%. A premium ROE showcases management's capability to allocate capital organically.\n\n**Valuation & Pricing Safety:**\nFrom a relative multiple standpoint, ${peWinner.symbol} offers a discount valuation trading at a P/E multiple of ${isFinite(winningPE) && winningPE > 0 ? num(winningPE, 1) + "x" : "—"}, whereas ${peLoser.symbol} commands a premium pricing multiple at ${isFinite(losingPE) && losingPE > 0 ? num(losingPE, 1) + "x" : "—"}.\n\nOur system determines that ${defensiveWinner.symbol} yields the most defensive entry parameter with the highest computed Margin of Safety, serving as the superior vehicle for risk-averse long-term investors.`;
      }
    }
  };

  const faqs = [
    {
      q: lang === "th"
        ? `ระหว่าง ${stock1.symbol} กับ ${stock2.symbol} ตัวไหนมีราคาถูกกว่าและมีส่วนเผื่อความปลอดภัย (Margin of Safety) สูงกว่า?`
        : `Between ${stock1.symbol} and ${stock2.symbol}, which has a higher Margin of Safety and cheaper price?`,
      a: lang === "th"
        ? `จากการประเมินด้วยแบบจำลองทางการเงินของ ValuStock ${defensiveWinner.symbol} มีส่วนเผื่อความปลอดภัยที่ดึงดูดมากกว่า อยู่ที่ระดับ ${pct(winnerMOS, 1)} เทียบกับ ${defensiveLoser.symbol} ซึ่งมีส่วนเผื่อความปลอดภัยที่ระดับ ${pct(loserMOS, 1)} จึงทำให้ ${defensiveWinner.symbol} มีแต้มต่อด้านส่วนลดราคาในขณะนี้`
        : `According to our side-by-side financial audit, ${defensiveWinner.symbol} offers a more defensive entry with a Margin of Safety margin of ${pct(winnerMOS, 1)}, compared to ${defensiveLoser.symbol} which sits at ${pct(loserMOS, 1)}. This gives ${defensiveWinner.symbol} a higher pricing discount advantage at current market prices.`
    },
    {
      q: lang === "th"
        ? `เปรียบเทียบแบบจำลองมูลค่าเหมาะสมของ ${stock1.symbol} และ ${stock2.symbol} เป็นอย่างไร?`
        : `How do the Intrinsic Target values compare for ${stock1.symbol} vs. ${stock2.symbol}?`,
      a: lang === "th"
        ? `แบบจำลองประเมินราคาเหมาะสมทางทฤษฎีของ ${stock1.symbol} ได้เท่ากับ ${formatP(val1.fairValue, stock1)} (ราคาปัจจุบัน ${formatP(stock1.price, stock1)}) ในขณะที่ ${stock2.symbol} มีมูลค่าเหมาะสมอยู่ที่ ${formatP(val2.fairValue, stock2)} (ราคาปัจจุบัน ${formatP(stock2.price, stock2)})`
        : `Our analysis estimates ${stock1.symbol}'s intrinsic price target at ${formatP(val1.fairValue, stock1)} (current price: ${formatP(stock1.price, stock1)}), whereas ${stock2.symbol} exhibits a target of ${formatP(val2.fairValue, stock2)} (current price: ${formatP(stock2.price, stock2)}).`
    },
    {
      q: lang === "th"
        ? `ความแตกต่างด้านอัตราส่วน PE/ROE หรือดัชนีกองทุนของ ${stock1.symbol} กับ ${stock2.symbol} คืออะไร?`
        : `What are the core PE, ROE or index cost differences between ${stock1.symbol} and ${stock2.symbol}?`,
      a: isFund1 && isFund2
        ? (lang === "th"
            ? `ทั้งคู่เป็นกองทุนดัชนี (ETF) โดย ${stock1.symbol} มีค่าธรรมเนียมกองทุน (Expense Ratio) อยู่ที่ ${num(stock1.expenseRatio || 0, 2)}% ขณะที่ ${stock2.symbol} อยู่ที่ระดับ ${num(stock2.expenseRatio || 0, 2)}% กองทุนที่มีอัตราค่าใช้จ่ายต่ำกว่าจะปกป้องผลตอบแทนจากการหดตัวได้ดีกว่า`
            : `Both are index funds. ${stock1.symbol} charges an expense ratio of ${num(stock1.expenseRatio || 0, 2)}%, while ${stock2.symbol} sits at ${num(stock2.expenseRatio || 0, 2)}%. Lower expenses secure superior long-term compounded growth.`)
        : (lang === "th"
            ? `ในเชิงเปรียบเทียบคุณภาพหุ้น ${stock1.symbol} มี ROE อยู่ที่ ${num(val1.ratios.roe, 1)}% และ PE ที่ ${num(val1.ratios.pe, 1)} เท่า ขณะที่ ${stock2.symbol} มี ROE ระดับ ${num(val2.ratios.roe, 1)}% และ PE ที่ ${num(val2.ratios.pe, 1)} เท่า ค่า ROE สูงแสดงถึงประสิทธิภาพการจัดการทรัพย์สินสร้างกำไรของฝ่ายบริหาร`
            : `${stock1.symbol} compounds ROE at ${num(val1.ratios.roe, 1)}% with a P/E of ${num(val1.ratios.pe, 1)}x, compared to ${stock2.symbol}'s ROE of ${num(val2.ratios.roe, 1)}% and P/E of ${num(val2.ratios.pe, 1)}x. A higher ROE demonstrates premium earnings efficiency.`)
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
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-up">
      {/* 📊 Structured JSON-LD Data for Google SEO FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />

      {/* HEADER COMPARISON BANNER */}
      <div className="surface rounded-2xl p-6 border border-line bg-surface/40 backdrop-blur-md">
        <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold mb-2 inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Programmatic SEO Equity Comparison Terminal
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-ink leading-tight">
          เปรียบเทียบหุ้น {stock1.symbol} vs {stock2.symbol}: วิเคราะห์ราคาเป้าหมาย & อัตราส่วนการเงิน
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 font-semibold leading-relaxed">
          {lang === "th"
            ? `บทวิเคราะห์เชิงเปรียบเทียบเคียงข้างกันระหว่าง ${name1} (${stock1.symbol}) และ ${name2} (${stock2.symbol}) เพื่อค้นหาหุ้นปันผลและมูลค่าเหมาะสมที่มี Margin of Safety ดีที่สุด`
            : `Institutional side-by-side investment report comparing financial ratios, intrinsic values, and discount buffers for ${stock1.symbol} and ${stock2.symbol}.`}
        </p>
      </div>

      {/* 🤖 Dynamic AI Pairwise Assessment (Helpful Content Asset) */}
      <Card className="border border-brand/30 bg-brand-soft/10 p-5 rounded-2xl relative overflow-hidden shadow-inner animate-fade-up">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-36 h-36 bg-brand/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-3">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/20 text-brand">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-ink leading-none uppercase tracking-wider">
              🤖 {lang === "th" ? "AI วิเคราะห์เจาะลึกปะทะดวลพื้นฐานคู่มวย" : "AI Peer-to-Peer Strategic Assessment & Review"}
            </h3>
            <span className="text-[9px] text-muted block mt-0.5 font-bold uppercase tracking-wider">
              Qualitative Pairwise Synthesis • Google E-E-A-T Compliant
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-ink leading-relaxed font-semibold whitespace-pre-line">
          {getComparisonProse()}
        </p>
      </Card>

      {/* SIDE-BY-SIDE HIGHLIGHT GRID */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Stock 1 Card */}
        <div className="surface rounded-2xl p-5 border border-line/75 bg-surface/20 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <AssetLogo symbol={stock1.symbol} color={stock1.color} size="md" />
            <div>
              <h2 className="font-display font-black text-lg text-ink">{stock1.symbol}</h2>
              <p className="text-xs text-muted leading-none mt-1">{name1}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-line/45 grid grid-cols-2 gap-2 text-center">
            <div className="bg-bg/50 p-2 rounded-xl border border-line">
              <span className="text-[11px] text-muted block">{lang === "th" ? "ราคาปัจจุบัน" : "Market Price"}</span>
              <span className="font-mono font-bold text-ink mt-0.5 block">{formatP(stock1.price, stock1)}</span>
            </div>
            <div className="bg-bg/50 p-2 rounded-xl border border-line">
              <span className="text-[11px] text-muted block">{lang === "th" ? "มูลค่าเหมาะสม" : "Fair Value"}</span>
              <span className="font-mono font-bold text-gold mt-0.5 block">{formatP(val1.fairValue, stock1)}</span>
            </div>
            <div className="bg-bg/50 p-2 rounded-xl border border-line col-span-2">
              <span className="text-[11px] text-muted block">{lang === "th" ? "คำแนะนำทางมูลค่า" : "Valuation Status"}</span>
              <span className={`font-display font-extrabold text-xs mt-0.5 block ${getVerdictTone(val1.verdict)}`}>
                {t(`verdict.${val1.verdict}`).toUpperCase()} ({pct(val1.marginOfSafety, 0)})
              </span>
            </div>
          </div>
        </div>

        {/* Stock 2 Card */}
        <div className="surface rounded-2xl p-5 border border-line/75 bg-surface/20 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <AssetLogo symbol={stock2.symbol} color={stock2.color} size="md" />
            <div>
              <h2 className="font-display font-black text-lg text-ink">{stock2.symbol}</h2>
              <p className="text-xs text-muted leading-none mt-1">{name2}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-line/45 grid grid-cols-2 gap-2 text-center">
            <div className="bg-bg/50 p-2 rounded-xl border border-line">
              <span className="text-[11px] text-muted block">{lang === "th" ? "ราคาปัจจุบัน" : "Market Price"}</span>
              <span className="font-mono font-bold text-ink mt-0.5 block">{formatP(stock2.price, stock2)}</span>
            </div>
            <div className="bg-bg/50 p-2 rounded-xl border border-line">
              <span className="text-[11px] text-muted block">{lang === "th" ? "มูลค่าเหมาะสม" : "Fair Value"}</span>
              <span className="font-mono font-bold text-gold mt-0.5 block">{formatP(val2.fairValue, stock2)}</span>
            </div>
            <div className="bg-bg/50 p-2 rounded-xl border border-line col-span-2">
              <span className="text-[11px] text-muted block">{lang === "th" ? "คำแนะนำทางมูลค่า" : "Valuation Status"}</span>
              <span className={`font-display font-extrabold text-xs mt-0.5 block ${getVerdictTone(val2.verdict)}`}>
                {t(`verdict.${val2.verdict}`).toUpperCase()} ({pct(val2.marginOfSafety, 0)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SIDE-BY-SIDE DETAILED METRICS TABLE */}
      <Card className="border border-line overflow-hidden">
        <CardHeader
          title={lang === "th" ? "ตารางเปรียบเทียบอัตราส่วนทางการเงินเคียงข้างกัน" : "Detailed Ratio Comparison Ledger"}
          subtitle={`${stock1.symbol} vs ${stock2.symbol} Side-by-Side Comparison`}
          icon={<Target className="h-4 w-4 text-brand" />}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-elevate/60 text-muted font-bold">
                <th className="px-5 py-3.5">{lang === "th" ? "ตัวชี้วัด / อัตราส่วนการเงิน" : "Financial Metric Ratio"}</th>
                <th className="px-5 py-3.5 text-right">{stock1.symbol}</th>
                <th className="px-5 py-3.5 text-right">{stock2.symbol}</th>
                <th className="px-5 py-3.5 text-center">{lang === "th" ? "ผลการเปรียบเทียบ" : "Comparison Verdict"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {/* Expense Ratio (ETFs only) */}
              {(isFund1 || isFund2) && (
                <tr className="hover:bg-elevate/30 transition">
                  <td className="px-5 py-3 font-semibold text-ink">Expense Ratio (%)</td>
                  <td className="px-5 py-3 text-right font-mono text-ink">
                    {stock1.expenseRatio ? `${num(stock1.expenseRatio, 2)}%` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-ink">
                    {stock2.expenseRatio ? `${num(stock2.expenseRatio, 2)}%` : "—"}
                  </td>
                  <td className="px-5 py-3 text-center text-[11px] font-bold text-brand">
                    {stock1.expenseRatio && stock2.expenseRatio
                      ? (stock1.expenseRatio < stock2.expenseRatio ? `${stock1.symbol} ประหยัดกว่า` : `${stock2.symbol} ประหยัดกว่า`)
                      : "—"}
                  </td>
                </tr>
              )}
              {/* AUM (ETFs only) */}
              {(isFund1 || isFund2) && (
                <tr className="hover:bg-elevate/30 transition">
                  <td className="px-5 py-3 font-semibold text-ink">AUM (Asset Under Management)</td>
                  <td className="px-5 py-3 text-right font-mono text-ink">
                    {stock1.aum ? (lang === "th" ? `${num(stock1.aum, 0)} ล้านบาท` : `${num(stock1.aum, 0)}M THB`) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-ink">
                    {stock2.aum ? (lang === "th" ? `${num(stock2.aum, 0)} ล้านบาท` : `${num(stock2.aum, 0)}M THB`) : "—"}
                  </td>
                  <td className="px-5 py-3 text-center text-[11px] font-bold text-brand">
                    {stock1.aum && stock2.aum
                      ? (stock1.aum > stock2.aum ? `${stock1.symbol} กองใหญ่กว่า` : `${stock2.symbol} กองใหญ่กว่า`)
                      : "—"}
                  </td>
                </tr>
              )}
              {/* P/E (Stocks only) */}
              {(!isFund1 || !isFund2) && (
                <tr className="hover:bg-elevate/30 transition">
                  <td className="px-5 py-3 font-semibold text-ink">Price-to-Earnings Ratio (P/E)</td>
                  <td className="px-5 py-3 text-right font-mono text-ink">{num(val1.ratios.pe, 1)}x</td>
                  <td className="px-5 py-3 text-right font-mono text-ink">{num(val2.ratios.pe, 1)}x</td>
                  <td className="px-5 py-3 text-center text-[11px] font-bold text-brand">
                    {val1.ratios.pe < val2.ratios.pe ? `${stock1.symbol} ถูกกว่า` : `${stock2.symbol} ถูกกว่า`}
                  </td>
                </tr>
              )}
              {/* P/B */}
              <tr className="hover:bg-elevate/30 transition">
                <td className="px-5 py-3 font-semibold text-ink">Price-to-Book Ratio (P/B)</td>
                <td className="px-5 py-3 text-right font-mono text-ink">{num(val1.ratios.pb, 2)}x</td>
                <td className="px-5 py-3 text-right font-mono text-ink">{num(val2.ratios.pb, 2)}x</td>
                <td className="px-5 py-3 text-center text-[11px] font-bold text-brand">
                  {val1.ratios.pb < val2.ratios.pb ? `${stock1.symbol} สินทรัพย์ถูกกว่า` : `${stock2.symbol} สินทรัพย์ถูกกว่า`}
                </td>
              </tr>
              {/* ROE (Stocks only) */}
              {(!isFund1 || !isFund2) && (
                <tr className="hover:bg-elevate/30 transition">
                  <td className="px-5 py-3 font-semibold text-ink">Return on Equity (ROE)</td>
                  <td className="px-5 py-3 text-right font-mono text-ink">{num(val1.ratios.roe, 1)}%</td>
                  <td className="px-5 py-3 text-right font-mono text-ink">{num(val2.ratios.roe, 1)}%</td>
                  <td className="px-5 py-3 text-center text-[11px] font-bold text-up">
                    {val1.ratios.roe > val2.ratios.roe ? `${stock1.symbol} ปั้นกำไรดีกว่า` : `${stock2.symbol} ปั้นกำไรดีกว่า`}
                  </td>
                </tr>
              )}
              {/* Dividend Yield */}
              <tr className="hover:bg-elevate/30 transition">
                <td className="px-5 py-3 font-semibold text-ink">Dividend Yield (%)</td>
                <td className="px-5 py-3 text-right font-mono text-ink">{num(val1.ratios.dividendYield, 2)}%</td>
                <td className="px-5 py-3 text-right font-mono text-ink">{num(val2.ratios.dividendYield, 2)}%</td>
                <td className="px-5 py-3 text-center text-[11px] font-bold text-gold">
                  {val1.ratios.dividendYield > val2.ratios.dividendYield ? `${stock1.symbol} ปันผลสูงกว่า` : `${stock2.symbol} ปันผลสูงกว่า`}
                </td>
              </tr>
              {/* DCF Target (Stocks only) */}
              {(!isFund1 || !isFund2) && (
                <tr className="hover:bg-elevate/30 transition">
                  <td className="px-5 py-3 font-semibold text-ink">DCF Target Intrinsic</td>
                  <td className="px-5 py-3 text-right font-mono text-ink">{formatP(val1.dcf.intrinsicValue, stock1)}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink">{formatP(val2.dcf.intrinsicValue, stock2)}</td>
                  <td className="px-5 py-3 text-center text-[11px] font-bold text-muted">—</td>
                </tr>
              )}
              {/* Graham Target (Stocks only) */}
              {(!isFund1 || !isFund2) && (
                <tr className="hover:bg-elevate/30 transition">
                  <td className="px-5 py-3 font-semibold text-ink">Graham Intrinsic Valuation</td>
                  <td className="px-5 py-3 text-right font-mono text-ink">{isFinite(graham1) ? formatP(graham1, stock1) : "—"}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink">{isFinite(graham2) ? formatP(graham2, stock2) : "—"}</td>
                  <td className="px-5 py-3 text-center text-[11px] font-bold text-muted">—</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DEFENSIVE WINNER RECOMMENDATION SUMMARY */}
      <Card className="border border-line bg-surface/30 p-5.5 space-y-2 animate-fade-up">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-up/15 text-up">
            <Shield className="h-4.5 w-4.5" />
          </span>
          <h3 className="font-display font-black text-base text-ink">
            {lang === "th" ? `บทสรุปประมาณการป้องกันความเสี่ยง (Margin-of-Safety Verdict)` : "Margin-of-Safety Verdict"}
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-muted leading-relaxed font-semibold pl-10">
          {lang === "th"
            ? (isFund1 && isFund2
                ? `สำหรับคู่กองทุนดัชนี ทั้ง ${stock1.symbol} และ ${stock2.symbol} สามารถจัดสรรพอร์ตได้ตามนโยบายค่าธรรมเนียม โดยแนะนำให้พิจารณากองทุนที่มีค่าธรรมเนียมต่ำกว่าอย่างละเอียดเพื่อรักษากำไรสะสม`
                : `จากแบบจำลองทั้งหมด หุ้น ${defensiveWinner.symbol} (${defensiveWinner.enName}) นำเสนอจุดซื้อที่ปลอดภัยกว่าเนื่องจากมีสัดส่วนลดราคา (Margin of Safety) สูงสุดในระดับ ${pct(winnerMOS, 0)} ซึ่งช่วยปกป้องความผันผวนจากการเคลื่อนตัวของดัชนีได้มีประสิทธิภาพยอดเยี่ยมกว่า หุ้น ${defensiveLoser.symbol} (ซึ่งมีส่วนเผื่อความปลอดภัยที่ ${pct(loserMOS, 0)})`)
            : isFund1 && isFund2
              ? `For index fund investors, selecting the fund with the lowest expense ratio maximizes multi-decade compound gains.`
              : `Consolidating all evaluation tracks, ${defensiveWinner.symbol} is positioned as a defensively stronger entry parameter with a Margin of Safety of ${pct(winnerMOS, 0)}, yielding a far safer capitalization profile compared to ${defensiveLoser.symbol}'s discount index of ${pct(loserMOS, 0)}.`}
        </p>
      </Card>

      {/* FAQ SECTION (Google Structured Q&A Crawler Engine) */}
      <Card className="border border-line p-6 bg-surface/40 backdrop-blur-sm animate-fade-up">
        <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold mb-2 inline-flex items-center gap-1">
          <Info className="h-3.5 w-3.5" /> FAQ & Q&A Crawlers Comparison Indexed
        </span>
        <h2 className="font-display text-xl font-black text-ink mb-5">
          {lang === "th" ? `คำถามที่พบบ่อยในการวิเคราะห์เปรียบเทียบ ${stock1.symbol} vs ${stock2.symbol}` : `Frequently Asked Questions: ${stock1.symbol} vs. ${stock2.symbol}`}
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

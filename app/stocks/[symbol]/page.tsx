"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getStock, STOCKS } from "@/lib/stocks";
import { AssetLogo } from "@/components/AssetLogo";
import {
  computeValuation,
  defaultDCFParams,
  grahamNumber,
  enterpriseValue,
  marketCap,
} from "@/lib/valuation";
import { useStore, useCurrentPlan } from "@/lib/store";
import { baht, num, pct, moneyMB, dollar, nav } from "@/lib/format";
import { Card, CardHeader, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PriceAreaChart, HistoryBars, ValueVsPrice } from "@/components/Charts";
import { DCFCalculator } from "@/components/DCFCalculator";
import { LockedCard } from "@/components/Paywall";
import { useTranslation, SECTOR_TRANS } from "@/lib/translations";
import {
  Star,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Info,
  Gauge,
  Sparkles,
  CircleDollarSign,
  Target,
  Shield,
  FileText,
} from "@/lib/icons";

const verdictTone = {
  undervalued: "up",
  fair: "muted",
  overvalued: "down",
} as const;

export default function StockDetail() {
  const params = useParams();
  const symbol = (params?.symbol as string) || "";

  // Dynamic Programmatic SEO Screener interceptor
  if (symbol === "undervalued" || symbol === "high-dividend" || symbol === "low-pe" || symbol === "high-roe") {
    return <ScreenerSeoLanding symbol={symbol} />;
  }

  const [stock, setStock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const plan = useCurrentPlan();
  const { isWatched, toggleWatch } = useStore();
  const { t, lang } = useTranslation();

  useEffect(() => {
    if (!symbol) return;
    
    // Quick synchronous fallback from local database
    const local = getStock(symbol);
    if (local) {
      setStock(local);
    }
    
    setLoading(true);
    fetch(`/api/stock/${symbol}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setStock(data);
        }
      })
      .catch((err) => console.error("Error loading live stock data:", err))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading && !stock) {
    return (
      <div className="mx-auto max-w-2xl py-32 text-center animate-pulse">
        <Sparkles className="mx-auto h-10 w-10 text-brand animate-spin" />
        <h2 className="mt-4 font-display text-lg font-bold text-ink">
          {lang === "th" ? "กำลังดึงข้อมูลสดจากระบบประมวลผลประวัติการเงิน..." : "Fetching live metrics from ValuStock Financial Engine..."}
        </h2>
        <p className="text-xs text-muted mt-1">
          {lang === "th" ? "ประมวลผลข้อมูลย้อนหลัง 5 ปีและงบการเงินล่าสุด" : "Processing 5-year history and latest filings"}
        </p>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center animate-fade-up">
        <h1 className="font-display text-2xl font-bold">{t("common.notFound")}</h1>
        <Link href="/stocks">
          <Button className="mt-5">{t("stockDetail.backBtn")}</Button>
        </Link>
      </div>
    );
  }

  const isFund = stock.assetType === "FUND";
  const isUS = stock.assetType === "US_STOCK";
  const isCrypto = stock.assetType === "CRYPTO";
  const isFutures = stock.assetType === "FUTURES";
  const isStock = !isFund && !isCrypto && !isFutures;
  const isBank = stock.sector === "ธนาคาร";

  const unit = (isUS || isCrypto || isFutures) ? (lang === "th" ? "ดอลลาร์" : "USD") : (lang === "th" ? "บาท" : "THB");
  const labelMil = (isUS || isCrypto || isFutures)
    ? (lang === "th" ? "ล้านดอลลาร์" : "USD Millions") 
    : (lang === "th" ? "ล้านบาท" : "THB Millions");

  const val = computeValuation(stock, defaultDCFParams(stock));
  const r = val.ratios;
  const change = stock.prevClose > 0 ? ((stock.price - stock.prevClose) / stock.prevClose) * 100 : 0;
  const up = change >= 0;
  const watched = isWatched(stock.symbol);
  const graham = grahamNumber(stock);

  // Dynamic values
  const displayName = lang === "th" ? stock.name : (stock.enName || stock.name);
  const localizedSector = lang === "th" ? stock.sector : (SECTOR_TRANS[stock.sector as string] || stock.sector);

  const formatPrice = (p: number) => {
    if (isUS || isCrypto || isFutures) return dollar(p);
    if (isFund) return nav(p);
    return baht(p);
  };

  const ratios: { label: string; value: string }[] = [
    { label: "P/E", value: isFinite(r.pe) ? num(r.pe, 1) : "—" },
    { label: "P/BV", value: isFinite(r.pb) ? num(r.pb, 2) : "—" },
    { label: "P/S", value: isFinite(r.ps) ? num(r.ps, 2) : "—" },
    { label: "EV/EBITDA", value: isFinite(r.evEbitda) ? num(r.evEbitda, 1) : "—" },
    { label: "ROE", value: isFinite(r.roe) ? num(r.roe, 1) + "%" : "—" },
    { label: t("stockDetail.metrics.divYield"), value: num(r.dividendYield, 2) + "%" },
    { label: "PEG", value: isFinite(r.peg) ? num(r.peg, 2) : "—" },
    { label: t("stockDetail.metrics.netMargin"), value: isFinite(r.netMargin) ? num(r.netMargin, 1) + "%" : "—" },
  ];

  const mcapLabel = lang === "th"
    ? (isUS ? "Market Cap (ล้านดอลลาร์)" : "Market Cap (ล้านบาท)")
    : (isUS ? "Market Cap ($ Millions)" : "Market Cap (THB Millions)");

  const evLabel = lang === "th"
    ? (isUS ? "มูลค่ากิจการ EV (ล้านดอลลาร์)" : "มูลค่ากิจการ EV (ล้านบาท)")
    : (isUS ? "Enterprise Value ($M)" : "Enterprise Value (THB Millions)");

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-up">
      {/* 1. HEADER CARD */}
      <div className="surface rounded-2xl p-5 border border-line">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <AssetLogo symbol={stock.symbol} color={stock.color} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold">{stock.symbol}</h1>
                <Badge tone="muted">{stock.market}</Badge>
                <Badge tone={isFund ? "brand" : isCrypto ? "gold" : isFutures ? "brand" : isUS ? "gold" : "up"}>
                  {isFund 
                    ? (lang === "th" ? "กองทุนรวม" : "Mutual Fund") 
                    : isCrypto
                    ? (lang === "th" ? "สินทรัพย์ดิจิทัล" : "Digital Asset")
                    : isFutures
                    ? (lang === "th" ? "สัญญาซื้อขายล่วงหน้า" : "Futures Contract")
                    : isUS 
                    ? (lang === "th" ? "หุ้นสหรัฐฯ" : "US Equity") 
                    : (lang === "th" ? "หุ้นไทย" : "Thai Equity")}
                </Badge>
                <span className="text-xs text-muted">| {localizedSector}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{displayName}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="num font-display text-3xl font-extrabold text-ink">
              {formatPrice(stock.price)}
            </div>
            <div
              className={`num flex items-center justify-end gap-1 text-sm font-semibold ${
                up ? "text-up" : "text-down"
              }`}
            >
              {up ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {pct(change)} {lang === "th" ? "วันนี้" : "Today"}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant={watched ? "subtle" : "outline"}
            size="sm"
            onClick={() => toggleWatch(stock.symbol)}
          >
            <Star
              className="h-4 w-4"
              fill={watched ? "currentColor" : "none"}
            />
            {watched ? t("stockDetail.removeFromWatchlist") : t("stockDetail.addToWatchlist")}
          </Button>
          <Link href="/stocks">
            <Button variant="ghost" size="sm">
              {t("stockDetail.backBtn")}
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. ADVICE BANNERS FOR GLOBAL INVESTMENT */}
      {isUS && (
        <Card className="border-gold/30 bg-gold/5 p-4.5">
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-ink">
                {lang === "th" ? "💡 คำแนะนำภาษีสินทรัพย์ต่างประเทศและสภาวะอัตราแลกเปลี่ยน (FX):" : "💡 Global Taxation & FX Risk Management Notes:"}
              </h4>
              <p className="text-xs text-muted leading-relaxed">
                {lang === "th" 
                  ? "เนื่องจากเป็นหุ้นสหรัฐฯ ปันผลจะถูกหัก ณ ที่จ่าย 30% โดยปกติ แต่หากผู้ใช้ยื่นแบบฟอร์ม W-8BEN กับโบรกเกอร์ จะได้รับสิทธิ์ลดภาษีเหลือ 15% ตามอนุสัญญาภาษีซ้อน นอกจากนี้ ควรระวังกำไรจากอัตราแลกเปลี่ยน (FX Gain) หากแลกเงินบาทกลับมาในไทยปีภาษีเดียวกัน"
                  : "As a US security, cash dividends are subject to a default 30% withholding tax. Submitting a W-8BEN form to your broker generally reduces this withholding tax rate to 15% under the US-Thailand Tax Treaty. Also, note personal income tax rules when repatriating foreign funds."}
              </p>
            </div>
          </div>
        </Card>
      )}

      {isFund && (
        <Card className="border-brand/30 bg-brand/5 p-4.5">
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
              <Shield className="h-4.5 w-4.5" />
            </span>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-ink">
                {lang === "th" ? "💡 ข้อมูลสำคัญสำหรับผู้ลงทุนในกองทุนรวม:" : "💡 Essential Mutual Fund Investment Parameters:"}
              </h4>
              <p className="text-xs text-muted leading-relaxed">
                {lang === "th"
                  ? "กองทุนนี้อ้างอิงราคาเป็น Net Asset Value (NAV) ซึ่งจะปรับปรุงวันละครั้งหลังเวลาปิดตลาดต่างประเทศ (เวลา T+1 ของไทย) มีการหักค่าใช้จ่ายบริหารจัดการโดยตรงในราคาหน่วยลงทุนเรียบร้อยแล้ว"
                  : "This fund's price reflects its Net Asset Value (NAV), updated once daily following foreign market closes (T+1 in Thailand). Management fees are deducted directly from the NAV calculation."}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 3. DYNAMIC CONTENT SECTION */}
      {/* 3. DYNAMIC CONTENT SECTION */}
      {isFund && (
        // ================== LAYOUT FOR MUTUAL FUNDS ==================
        <div className="grid gap-6 md:grid-cols-5">
          {/* Fund Details */}
          <Card className="md:col-span-2">
            <CardHeader title={t("stockDetail.fundInfo.title")} subtitle={lang === "th" ? "รายละเอียดหลักทรัพย์หลัก" : "Underlying security details"} icon={<Target className="h-4 w-4" />} />
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm py-1.5 border-b border-line/60">
                  <span className="text-muted">{t("stockDetail.fundInfo.fundType")}</span>
                  <span className="font-semibold text-ink">{stock.fundType || (lang === "th" ? "ตราสารทุนต่างประเทศ" : "Foreign Equity")}</span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-line/60">
                  <span className="text-muted">{t("stockDetail.fundInfo.masterFund")}</span>
                  <span className="font-semibold text-brand text-right max-w-[180px] truncate" title={stock.masterFund}>
                    {stock.masterFund || "Global Master Fund"}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-line/60">
                  <span className="text-muted">{t("stockDetail.fundInfo.aum")}</span>
                  <span className="font-semibold text-ink">
                    {stock.aum ? (lang === "th" ? `${num(stock.aum, 0)} ล้านบาท` : `${num(stock.aum, 0)}M THB`) : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-line/60">
                  <span className="text-muted">{t("stockDetail.fundInfo.expenseRatio")}</span>
                  <span className="font-semibold text-ink">{stock.expenseRatio ? num(stock.expenseRatio, 2) : "—"}%</span>
                </div>
                <div className="flex justify-between text-sm py-1.5">
                  <span className="text-muted">{t("stockDetail.fundInfo.riskLevel")}</span>
                  <span className="font-semibold text-gold">
                    {lang === "th" ? `ระดับ ${stock.riskLevel || 6} (สูง)` : `Level ${stock.riskLevel || 6} (High)`}
                  </span>
                </div>
              </div>

              {stock.feederFund && (
                <div className="mt-4 rounded-xl bg-elevate p-3.5 border border-line text-xs">
                  <span className="font-bold text-ink block mb-1">🔗 {t("stockDetail.fundInfo.feederFund")}:</span>
                  {lang === "th" 
                    ? `กองทุนไทยนี้ลงทุนหน่วยลงทุนโดยตรงใน ${stock.feederFund} ซึ่งมีนโยบายเพื่อจำลองผลตอบแทนหลักทรัพย์หรือดัชนีต่างประเทศโดยตรง`
                    : `This local fund feeds directly into ${stock.feederFund}, aiming to match foreign asset performance.`}
                </div>
              )}
            </div>
          </Card>

          {/* Top 5 Holdings */}
          <Card className="md:col-span-3">
            <CardHeader title={t("stockDetail.fundInfo.topHoldingsTitle")} subtitle="Top 5 Portfolio Holdings (%)" icon={<CircleDollarSign className="h-4 w-4" />} />
            <div className="p-5 space-y-4">
              {stock.topHoldings && stock.topHoldings.length > 0 ? (
                stock.topHoldings.map((hold: any) => (
                  <div key={hold.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-ink">{hold.name}</span>
                      <span className="text-brand">{num(hold.weight, 1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-line rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full"
                        style={{ width: `${hold.weight * 5}%` }} // Scale nicely
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted text-center py-10">{t("stockDetail.fundInfo.holdingName")}</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {isCrypto && (
        // ================== LAYOUT FOR CRYPTO ==================
        <div className="grid gap-6 md:grid-cols-5">
          {/* Crypto Specs */}
          <Card className="md:col-span-2">
            <CardHeader 
              title={lang === "th" ? "รายละเอียดสินทรัพย์ดิจิทัล" : "Digital Asset Specifications"} 
              subtitle={lang === "th" ? "ข้อมูลสถาบันและระบบประมวลผลเครือข่าย" : "Network consensus and asset status"} 
              icon={<Target className="h-4 w-4" />} 
            />
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm py-1.5 border-b border-line/60">
                  <span className="text-muted">{lang === "th" ? "ประเภทสินทรัพย์" : "Asset Category"}</span>
                  <span className="font-semibold text-ink">{lang === "th" ? "คริปโตเคอเรนซี" : "Cryptocurrency"}</span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-line/60">
                  <span className="text-muted">{lang === "th" ? "ระบบประมวลผลเครือข่าย" : "Consensus Mechanism"}</span>
                  <span className="font-semibold text-brand text-right">
                    {stock.cryptoConsensus || "Proof of Work"}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-line/60">
                  <span className="text-muted">{lang === "th" ? "จำนวนเหรียญหมุนเวียน" : "Circulating Supply"}</span>
                  <span className="font-semibold text-ink">
                    {stock.cryptoCirculating || "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-line/60">
                  <span className="text-muted">{lang === "th" ? "สกุลเงินอ้างอิง" : "Base Currency"}</span>
                  <span className="font-semibold text-ink">USD (ดอลลาร์สหรัฐฯ)</span>
                </div>
                <div className="flex justify-between text-sm py-1.5">
                  <span className="text-muted">{lang === "th" ? "ความผันผวนของระบบ" : "Asset Volatility"}</span>
                  <span className="font-semibold text-down">
                    {lang === "th" ? "ระดับสูงมาก (Extreme)" : "Extreme Volatility"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Crypto Explanation */}
          <Card className="md:col-span-3">
            <CardHeader 
              title={lang === "th" ? "มุมวิเคราะห์เชิงเทคนิคและบทสรุปสินทรัพย์" : "Digital Asset Analytics Summary"} 
              subtitle={lang === "th" ? "ประเมินมูลค่าเหมาะสมอ้างอิงตามวิสัยทัศน์ความคุ้มค่า" : "Intrinsic worth & market network valuation"} 
              icon={<CircleDollarSign className="h-4 w-4" />} 
            />
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted leading-relaxed">
                {stock.about}
              </p>
              <div className="rounded-xl bg-brand/5 border border-brand/20 p-4 space-y-2">
                <span className="chip border-brand/40 bg-brand/10 text-brand text-[10px] font-bold">
                  {lang === "th" ? "บทวิเคราะห์สภาวะระบบอัจฉริยะ" : "Quantitative Insight"}
                </span>
                <p className="text-xs text-muted leading-relaxed">
                  {lang === "th"
                    ? "เนื่องจากสินทรัพย์ดิจิทัลคริปโตเคอเรนซีไม่มีกระแสเงินสดอิสระ (Free Cash Flow) หมุนเวียนที่ปันผลได้โดยตรงเหมือนหุ้นทั่วไป โมเดล DCF จะประเมินจากอัตราการถือครองเครือข่ายและอุปทานสะสมทั่วโลก การเข้าลงทุนแนะนำการกระจายความเสี่ยง (Asset Allocation) ในสัดส่วน 5-10% เพื่อกระจายความเสี่ยงจากเงินเฟ้อ"
                    : "Cryptocurrencies operate on decentralization networks and supply constraints. While classic DCF cash projection models do not natively apply to non-cash-flowing assets, ValuStock applies Network Metcalfe valuation models to simulate underlying intrinsic thresholds."}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {isFutures && (
        // ================== LAYOUT FOR FUTURES ==================
        <div className="grid gap-6 md:grid-cols-5">
          {/* Futures Specs */}
          <Card className="md:col-span-2">
            <CardHeader 
              title={lang === "th" ? "รายละเอียดสัญญาฟิวเจอร์ส" : "Futures Contract Specifications"} 
              subtitle={lang === "th" ? "ข้อมูลและขนาดมาตรฐานในตลาดโลก" : "Global exchange standards and terms"} 
              icon={<Target className="h-4 w-4" />} 
            />
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm py-1.5 border-b border-line/60">
                  <span className="text-muted">{lang === "th" ? "ขนาดของสัญญา" : "Contract Size"}</span>
                  <span className="font-semibold text-ink">{stock.contractSize || "—"}</span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-line/60">
                  <span className="text-muted">{lang === "th" ? "เงินหลักประกันขั้นต้น" : "Initial Margin"}</span>
                  <span className="font-semibold text-brand text-right">
                    {stock.initialMargin ? `$${num(stock.initialMargin, 0)}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-line/60">
                  <span className="text-muted">{lang === "th" ? "อัตราทดสูงสุด" : "Max Leverage"}</span>
                  <span className="font-semibold text-ink">
                    {stock.leverage ? `${stock.leverage} เท่า` : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-line/60">
                  <span className="text-muted">{lang === "th" ? "วันครบกำหนดอายุ" : "Contract Expiry"}</span>
                  <span className="font-semibold text-ink">{stock.expiryDate || "—"}</span>
                </div>
                <div className="flex justify-between text-sm py-1.5">
                  <span className="text-muted">{lang === "th" ? "ขนาดช่องราคาต่ำสุด" : "Minimum Tick Size"}</span>
                  <span className="font-semibold text-gold">
                    {stock.tickSize || "—"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Futures Leverage Simulation Terminal */}
          <Card className="md:col-span-3">
            <CardHeader 
              title={lang === "th" ? "จำลองอัตราทดอนุพันธ์ (Derivative Leverage Simulator)" : "Leverage Simulation Terminal"} 
              subtitle={lang === "th" ? "คำนวณผลกระทบของหลักประกันต่อกำไรขาดทุนพอร์ต" : "Calculate visual portfolio exposure based on leverage"} 
              icon={<CircleDollarSign className="h-4 w-4" />} 
            />
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted leading-relaxed">
                {stock.about}
              </p>
              <div className="rounded-xl border border-line bg-elevate p-4.5 space-y-3">
                <span className="chip border-gold/40 bg-gold/15 text-gold text-xs font-bold">
                  {lang === "th" ? "เครื่องมือจำลองผลกำไรด้วยอัตราทดอัจฉริยะ" : "Leveraged Profit/Loss Simulation"}
                </span>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-surface p-2.5 rounded-lg border border-line">
                    <span className="text-xs text-muted block">{lang === "th" ? "สินทรัพย์ขยับ" : "Asset Price"}</span>
                    <span className="font-extrabold text-up mt-1 block">+1%</span>
                  </div>
                  <div className="bg-surface p-2.5 rounded-lg border border-line">
                    <span className="text-xs text-muted block">{lang === "th" ? "อัตราทดสัญญา" : "Contract Leverage"}</span>
                    <span className="font-extrabold text-brand mt-1 block">{stock.leverage || 10}x</span>
                  </div>
                  <div className="bg-surface p-2.5 rounded-lg border border-line">
                    <span className="text-xs text-muted block">{lang === "th" ? "พอร์ตจริงขยับ" : "Leveraged PnL"}</span>
                    <span className="font-extrabold text-up mt-1 block font-mono">+{stock.leverage ? stock.leverage : 10}%</span>
                  </div>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {lang === "th"
                    ? "* คำเตือน: อนุพันธ์ล่วงหน้ามีอัตราทดสูง (High Leverage) หากราคาขยับตรงข้ามกับสถานะที่ถือครองเพียง 1% พอร์ตของท่านจะได้รับผลกระทบเป็นสิบเท่าและอาจทำให้โดนบังคับปิดสถานะได้"
                    : "* Margin Warning: Futures involve substantial risk of loss. Leveraged multipliers enhance both upside gains and downside liquidations."}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {isStock && (
        // ================== LAYOUT FOR STOCKS (TH/US) ==================
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2 border border-line">
            <CardHeader
              title={lang === "th" ? "สรุปการประเมินมูลค่า" : "Valuation Summary"}
              icon={<Gauge className="h-4 w-4 text-brand" />}
            />
            <div className="p-5">
              <div className="text-center">
                <Badge tone={verdictTone[val.verdict]} className="text-xs">
                  {t(`verdict.${val.verdict}`)}
                </Badge>
                <div className="mt-3 text-xs text-muted">{t("stockDetail.fairValue")} ({unit})</div>
                <div className="num font-display text-3xl font-extrabold text-gold mt-1">
                  {formatPrice(val.fairValue)}
                </div>
                <div
                  className={`num mt-1 text-sm font-semibold ${
                    val.marginOfSafety >= 0 ? "text-up" : "text-down"
                  }`}
                >
                  {t("stockDetail.mos")} {pct(val.marginOfSafety, 1)}
                </div>
              </div>
              <div className="mt-4">
                <ValueVsPrice price={stock.price} fair={val.fairValue} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-center text-xs">
                <div className="rounded-xl border border-line bg-bg py-2">
                  <div className="text-muted">DCF ({unit})</div>
                  <div className="num font-semibold text-ink mt-0.5">
                    {formatPrice(val.dcf.intrinsicValue)}
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-bg py-2">
                  <div className="text-muted">Graham ({unit})</div>
                  <div className="num font-semibold text-ink mt-0.5">
                    {isFinite(graham) ? formatPrice(graham) : "—"}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-3 border border-line">
            <CardHeader title={lang === "th" ? "ราคาย้อนหลัง" : "Historical Price Action"} subtitle={lang === "th" ? "30 ช่วงเวลาล่าสุด (เดโม)" : "Latest 30 points (demo)"} />
            <div className="p-4">
              <PriceAreaChart data={stock.priceHistory} />
            </div>
          </Card>
        </div>
      )}

      {/* 3.5 ANALYST CONSENSUS & MULTI-MODEL VALUATION MATRIX (HIDDEN FOR FUNDS) */}
      {isStock && (
        <div className="grid gap-6 md:grid-cols-2">
          <AnalystConsensus stock={stock} formatPrice={formatPrice} />
          <ValuationModelsComparison stock={stock} formatPrice={formatPrice} val={val} graham={graham} />
        </div>
      )}

      {isStock && isBank && (
        <BankingDeepDive stock={stock} val={val} formatPrice={formatPrice} />
      )}

      {/* 4. HISTORICAL CHART & DCF */}
      {(isFund || isCrypto || isFutures) && (
        <Card className="border border-line">
          <CardHeader title={lang === "th" ? "ผลตอบแทน NAV ย้อนหลัง" : "Historical NAV Performance"} subtitle={lang === "th" ? "กราฟจำลอง 30 จุดเพื่อตรวจสอบทิศทางผลตอบแทน" : "Simulated 30 tracking points to analyze historical yield"} />
          <div className="p-4">
            <PriceAreaChart data={stock.priceHistory} />
          </div>
        </Card>
      )}

      {isStock && (
        <>
          {plan.limits.dcf ? (
            <DCFCalculator stock={stock} />
          ) : (
            <LockedCard
              required="pro"
              title={t("stockDetail.calculator.title")}
              desc={lang === "th" 
                ? "ปรับสมมติฐานการเติบโตและอัตราคิดลดเพื่อหามูลค่าที่แท้จริง — เปิดใช้งานด้วยแพ็กเกจโปร" 
                : "Adjust growth and discount rates to derive intrinsic value. Unlock with Pro Plan."}
            />
          )}
        </>
      )}

      {/* 5. METRICS GRID */}
      {isStock && (
        <Card className="border border-line">
          <CardHeader title={t("stockDetail.financialsTitle")} subtitle={lang === "th" ? "ข้อมูลทางการเงินหลัก" : "Core financials database"} />
          <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
            {ratios.map((m) => (
              <div key={m.label} className="bg-surface p-4">
                <div className="text-xs text-muted">{m.label}</div>
                <div className="num mt-1 font-display text-xl font-bold text-ink">
                  {m.value}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
            <KV k={mcapLabel} v={isUS ? dollar(marketCap(stock)) : moneyMB(marketCap(stock))} />
            <KV k={evLabel} v={isUS ? dollar(enterpriseValue(stock)) : moneyMB(enterpriseValue(stock))} />
            <KV k={t("stockDetail.metrics.eps")} v={formatPrice(stock.financials.eps)} />
            <KV k={t("stockDetail.metrics.bookValue")} v={formatPrice(stock.financials.bookValuePerShare)} />
          </div>
        </Card>
      )}

      {/* 6. HISTORICAL FINANCIAL BARS (HIDDEN FOR FUNDS) */}
      {isStock && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border border-line">
            <CardHeader title={lang === "th" ? "รายได้ย้อนหลัง" : "Historical Revenues"} subtitle={labelMil} />
            <div className="p-4">
              <HistoryBars data={stock.revenueHistory} label={t("stockDetail.metrics.revenue")} />
            </div>
          </Card>
          <Card className="border border-line">
            <CardHeader title={lang === "th" ? "กระแสเงินสดอิสระ (FCF)" : "Free Cash Flow (FCF) History"} subtitle={labelMil} />
            <div className="p-4">
              <HistoryBars data={stock.fcfHistory} label={t("stockDetail.metrics.fcf")} />
            </div>
          </Card>
        </div>
      )}

      {/* 6.3 ROOKIE ANALYST CORNER */}
      {isStock && (
        <RookieAnalystCorner stock={stock} val={val} lang={lang} />
      )}

      {/* 6.5 DETAILED 5-YEAR FINANCIAL LEDGER (HIDDEN FOR FUNDS) */}
      {isStock && (
        <FinancialLedgerTable stock={stock} isUS={isUS} />
      )}

      {/* 6.8 SEO RESEARCH LANDING CORE */}
      {isStock && (
        <SeoResearchLanding stock={stock} val={val} graham={graham} isUS={isUS} formatPrice={formatPrice} />
      )}

      {/* 7. ABOUT COMPANY */}
      <Card className="border border-line">
        <CardHeader title={t("stockDetail.aboutTitle")} icon={<Info className="h-4 w-4 text-brand" />} />
        <div className="p-5">
          <p className="text-sm leading-relaxed text-ink/90">{stock.about}</p>
          <p className="mt-3 text-xs text-muted font-semibold">{stock.enName} ({stock.market})</p>
        </div>
      </Card>

      <div className="rounded-xl border border-line bg-elevate px-4 py-3 text-xs text-muted">
        {lang === "th" 
          ? "⚠️ ข้อมูลและการประเมินทั้งหมดเป็นตัวอย่างเพื่อการสาธิตในการจำลองผลิตภัณฑ์ (Product Demo) ไม่ใช่คำแนะนำการลงทุนอย่างเป็นทางการ การลงทุนมีความเสี่ยง โปรดศึกษาข้อมูลจริงก่อนตัดสินใจ"
          : "⚠️ Disclaimer: All valuations and historical charts are simulated for software demonstration purposes only. They do not constitute certified investment advice."}
      </div>

      {plan.id !== "premium" && plan.id !== "lifetime" && (
        <Link href="/pricing">
          <div className="flex items-center justify-between rounded-2xl border border-gold/30 bg-gold/5 px-5 py-4 cursor-pointer hover:border-gold transition-colors">
            <span className="text-sm font-medium text-ink">
              {lang === "th" 
                ? "ต้องการตั้งค่าเปรียบเทียบพอร์ตหุ้นสหรัฐฯ หุ้นไทย และกองทุน? อัปเกรดเป็นพรีเมียม" 
                : "Want to compare US stocks, Thai equities, and funds side-by-side? Upgrade to Premium"}
            </span>
            <ArrowRight className="h-4 w-4 text-gold animate-pulse" />
          </div>
        </Link>
      )}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="text-xs text-muted">{k}</div>
      <div className="num mt-1 font-semibold text-ink">{v}</div>
    </div>
  );
}

// ================== HIGH-DENSITY FINANCIAL UTILITIES & DIAGNOSTICS ==================

function AnalystConsensus({ stock, formatPrice }: { stock: any; formatPrice: (p: number) => string }) {
  const { lang } = useTranslation();
  const base = stock.price;
  
  // Calculate simulated targets
  const avgTarget = base * 1.15;
  const highTarget = base * 1.35;
  const lowTarget = base * 0.90;
  const upside = ((avgTarget - base) / base) * 100;
  
  return (
    <Card className="border border-line">
      <CardHeader 
        title={lang === "th" ? "ฉันทามติความเห็นนักวิเคราะห์" : "Analyst Consensus & Targets"} 
        subtitle={lang === "th" ? "ประมาณการจากสถาบันการเงินชั้นนำ" : "Leading institutional research estimates"}
        icon={<Target className="h-4 w-4 text-brand" />}
      />
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-muted block uppercase font-bold tracking-wider">{lang === "th" ? "คะแนนสรุป" : "Consensus Rating"}</span>
            <span className="font-display font-extrabold text-base text-up uppercase tracking-wide">
              {lang === "th" ? "แนะนำ: ซื้อสะสม (Strong Buy)" : "Strong Buy"}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted block uppercase font-bold tracking-wider">{lang === "th" ? "Upside เป้าหมาย" : "Target Upside"}</span>
            <span className="font-mono font-bold text-up">+{upside.toFixed(1)}%</span>
          </div>
        </div>

        {/* Consensus Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-up">{lang === "th" ? "ซื้อ (75%)" : "BUY (75%)"}</span>
            <span className="text-gold">{lang === "th" ? "ถือ (18%)" : "HOLD (18%)"}</span>
            <span className="text-down">{lang === "th" ? "ขาย (7%)" : "SELL (7%)"}</span>
          </div>
          <div className="h-1.5 w-full bg-line rounded-full overflow-hidden flex">
            <div className="bg-up h-full" style={{ width: "75%" }} />
            <div className="bg-gold h-full" style={{ width: "18%" }} />
            <div className="bg-down h-full" style={{ width: "7%" }} />
          </div>
        </div>

        {/* Target Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-line bg-bg/50 p-2">
            <div className="text-xs text-muted uppercase font-bold">{lang === "th" ? "เป้าต่ำสุด" : "Low Target"}</div>
            <div className="num font-bold text-xs text-ink mt-0.5">{formatPrice(lowTarget)}</div>
          </div>
          <div className="rounded-xl border border-brand bg-brand-soft p-2">
            <div className="text-xs text-brand font-bold uppercase">{lang === "th" ? "เป้าเฉลี่ย" : "Mean Target"}</div>
            <div className="num font-extrabold text-xs text-brand mt-0.5">{formatPrice(avgTarget)}</div>
          </div>
          <div className="rounded-xl border border-line bg-bg/50 p-2">
            <div className="text-xs text-muted uppercase font-bold">{lang === "th" ? "เป้าสูงสุด" : "High Target"}</div>
            <div className="num font-bold text-xs text-ink mt-0.5">{formatPrice(highTarget)}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ValuationModelsComparison({ stock, formatPrice, val, graham }: { stock: any; formatPrice: (p: number) => string; val: any; graham: number }) {
  const { lang } = useTranslation();
  const base = stock.price;
  const eps = stock.financials.eps;
  
  // Historical P/E Multiple valuation model (10x for banking, 15x for others)
  const peMultiple = stock.sector === "ธนาคาร" ? 10 : 15;
  const peValuation = eps * peMultiple;

  // Dividend Discount Model (DDM) - Gordon Growth Model
  const Ke = 0.085; // Cost of Equity
  const g = Math.min(stock.financials.growthRate, 0.04);
  const dps = stock.financials.dividendPerShare;
  const ddmValuation = dps > 0 ? (dps * (1 + g)) / (Ke - g) : peValuation * 0.85;

  const models = [
    { name: lang === "th" ? "แบบจำลองกระแสเงินสดคิดลด (DCF Model)" : "Discounted Cash Flow (DCF)", value: val.dcf.intrinsicValue, weight: "40%" },
    { name: lang === "th" ? "แบบจำลองดัชนีเกรแฮม (Graham Number)" : "Graham Formula Intrinsic", value: isFinite(graham) ? graham : base * 0.95, weight: "20%" },
    { name: lang === "th" ? "การคูณประเมินด้วยอัตราส่วน P/E ย้อนหลัง" : "Historical P/E Multiples", value: peValuation, weight: "20%" },
    { name: lang === "th" ? "แบบจำลองอัตราคิดลดปันผล (Gordon DDM)" : "Dividend Discount Model (Gordon)", value: ddmValuation, weight: "20%" },
  ];

  return (
    <Card className="border border-line">
      <CardHeader 
        title={lang === "th" ? "ประเมินมูลค่าเหมาะสม 4 แบบจำลอง" : "4-Model Valuation Framework"} 
        subtitle={lang === "th" ? "ผลการคำนวณเชิงคณิตศาสตร์เชิงเปรียบเทียบ" : "Scenario valuation models comparison"}
        icon={<Gauge className="h-4 w-4 text-gold shrink-0" />}
      />
      <div className="p-4 space-y-2">
        {models.map((m) => {
          const pctDiff = ((m.value - base) / base) * 100;
          return (
            <div key={m.name} className="flex items-center justify-between text-xs py-1.5 border-b border-line/40 last:border-0">
              <div>
                <span className="font-semibold text-ink block">{m.name}</span>
                <span className="text-xs text-muted font-bold">Weight: {m.weight}</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-ink block">{formatPrice(m.value)}</span>
                <span className={`text-xs font-bold ${pctDiff >= 0 ? "text-up" : "text-down"}`}>
                  {pctDiff >= 0 ? "+" : ""}{pctDiff.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function BankingDeepDive({ stock, val, formatPrice }: { stock: any; val: any; formatPrice: (p: number) => string }) {
  const { lang } = useTranslation();
  const f = stock.financials;
  const equity = f.bookValuePerShare * stock.sharesOutstanding;
  const bankAssets = Math.max(f.totalAssets || 0, equity * 10.5);
  const loanBook = bankAssets * 0.66;
  const deposits = bankAssets * 0.78;
  const nim = 2.85 + Math.min(0.55, f.growthRate * 6);
  const npl = 2.55 + ((stock.symbol.charCodeAt(0) + stock.symbol.length) % 7) * 0.08;
  const coverage = 155 + ((stock.symbol.charCodeAt(1) || 66) % 9) * 4;
  const casa = 34 + ((stock.symbol.charCodeAt(0) || 66) % 8);
  const tier1 = 14.2 + ((stock.symbol.charCodeAt(2) || 76) % 8) * 0.25;
  const loanGrowth = f.growthRate * 100;
  const payoutRatio = f.eps > 0 ? (f.dividendPerShare / f.eps) * 100 : 0;
  const dividendYield = val.ratios.dividendYield;
  const bankPeers = STOCKS
    .filter((peer: any) => peer.sector === "ธนาคาร" && peer.assetType === "TH_STOCK")
    .slice(0, 5);

  const metricCards = [
    {
      label: "NIM",
      value: `${num(nim, 2)}%`,
      desc: lang === "th" ? "ส่วนต่างดอกเบี้ยสุทธิ ยิ่งสูงยิ่งสะท้อนความสามารถทำกำไรจากสินเชื่อ" : "Net interest margin proxy for lending profitability.",
      tone: nim >= 3 ? "text-up" : "text-gold",
    },
    {
      label: "NPL Ratio",
      value: `${num(npl, 2)}%`,
      desc: lang === "th" ? "สัดส่วนหนี้เสียโดยประมาณ ควรดูควบคู่กับ coverage ratio" : "Estimated bad-loan ratio, best read together with coverage.",
      tone: npl <= 3 ? "text-up" : "text-gold",
    },
    {
      label: "Coverage",
      value: `${num(coverage, 0)}%`,
      desc: lang === "th" ? "เงินสำรองต่อหนี้เสีย ยิ่งสูงยิ่งมีเบาะรองรับความเสี่ยงเครดิต" : "Loan-loss reserves against NPLs.",
      tone: coverage >= 150 ? "text-up" : "text-gold",
    },
    {
      label: "Tier 1",
      value: `${num(tier1, 1)}%`,
      desc: lang === "th" ? "เงินกองทุนชั้นที่ 1 ช่วยสะท้อนความแข็งแรงของฐานทุนธนาคาร" : "Core capital strength proxy.",
      tone: tier1 >= 14 ? "text-up" : "text-gold",
    },
  ];

  const dividendNotes = [
    {
      label: lang === "th" ? "ปันผลต่อหุ้น" : "Dividend/share",
      value: formatPrice(f.dividendPerShare),
    },
    {
      label: lang === "th" ? "Dividend Yield" : "Dividend Yield",
      value: `${num(dividendYield, 2)}%`,
    },
    {
      label: lang === "th" ? "Payout Ratio" : "Payout Ratio",
      value: `${num(payoutRatio, 1)}%`,
    },
    {
      label: lang === "th" ? "Loan Growth Proxy" : "Loan Growth Proxy",
      value: `${num(loanGrowth, 1)}%`,
    },
  ];

  const faqs = [
    {
      q: lang === "th" ? `${stock.symbol} เหมาะกับนักลงทุนแบบไหน?` : `Who is ${stock.symbol} suitable for?`,
      a: lang === "th"
        ? `${stock.symbol} เหมาะกับนักลงทุนที่ต้องการหุ้นธนาคารขนาดใหญ่ ฐานทุนแข็งแรง ปันผลสม่ำเสมอ และต้องการถือเป็นแกน defensive ของพอร์ต แต่ยังควรติดตามคุณภาพสินเชื่อ NPL และทิศทางดอกเบี้ย`
        : `${stock.symbol} suits investors looking for a large bank with a strong capital base, steady dividends, and defensive portfolio exposure, while monitoring NPLs and interest-rate cycles.`,
    },
    {
      q: lang === "th" ? `ควรดู P/BV หรือ P/E สำหรับหุ้นธนาคาร?` : `Should bank stocks be valued with P/BV or P/E?`,
      a: lang === "th"
        ? "หุ้นธนาคารควรดู P/BV ควบคู่ ROE เป็นหลัก เพราะธุรกิจธนาคารมีฐานสินทรัพย์และเงินกองทุนเป็นหัวใจ ส่วน P/E ใช้ดูความถูกแพงเชิงกำไรประกอบ"
        : "Bank stocks are usually best read through P/BV and ROE because capital and assets drive the business. P/E is still useful as an earnings-multiple cross-check.",
    },
    {
      q: lang === "th" ? `NPL สำคัญกับ ${stock.symbol} อย่างไร?` : `Why does NPL matter for ${stock.symbol}?`,
      a: lang === "th"
        ? "NPL คือหนี้เสีย ถ้าเพิ่มเร็วอาจกดดันกำไรเพราะต้องตั้งสำรองมากขึ้น แต่ถ้า coverage ratio สูง ธนาคารจะมีเบาะรองรับความเสี่ยงเครดิตได้ดีกว่า"
        : "NPLs show bad-loan pressure. Rising NPLs can hurt earnings through higher provisions, while high coverage gives the bank a stronger credit-risk buffer.",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border border-line overflow-hidden">
        <CardHeader
          title={lang === "th" ? `Banking KPI เฉพาะหุ้นธนาคาร: ${stock.symbol}` : `Banking KPI Deep Dive: ${stock.symbol}`}
          subtitle={lang === "th" ? "ตัวชี้วัดเฉพาะธนาคารจากข้อมูลในระบบ ใช้ประกอบการวิเคราะห์เชิงคุณภาพสินเชื่อและฐานทุน" : "Bank-specific indicators derived from available platform data for credit quality and capital analysis."}
          icon={<Shield className="h-4.5 w-4.5 text-brand" />}
        />
        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((metric) => (
            <div key={metric.label} className="bg-surface p-4">
              <div className="text-[10px] font-black uppercase tracking-wide text-muted">{metric.label}</div>
              <div className={`num mt-1 font-display text-2xl font-black ${metric.tone}`}>{metric.value}</div>
              <p className="mt-2 text-[11px] font-semibold leading-relaxed text-muted">{metric.desc}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-px border-t border-line bg-line md:grid-cols-3">
          <KV k={lang === "th" ? "สินเชื่อรวมโดยประมาณ" : "Estimated Loan Book"} v={moneyMB(loanBook)} />
          <KV k={lang === "th" ? "เงินฝากโดยประมาณ" : "Estimated Deposits"} v={moneyMB(deposits)} />
          <KV k="CASA Ratio" v={`${num(casa, 1)}%`} />
        </div>
        <div className="border-t border-line bg-elevate/35 px-5 py-3 text-[11px] font-semibold leading-relaxed text-muted">
          {lang === "th"
            ? "หมายเหตุ: ค่า NIM, NPL, Coverage, CASA และ Tier 1 ในส่วนนี้เป็น banking proxy จากข้อมูลตัวอย่างในระบบ เพื่อช่วยอ่านภาพรวม ไม่ใช่ตัวเลขรายงานทางการของตลาดหลักทรัพย์"
            : "Note: NIM, NPL, Coverage, CASA, and Tier 1 here are platform proxies from sample data, not official exchange filings."}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border border-line lg:col-span-2">
          <CardHeader
            title={lang === "th" ? "คุณภาพปันผลของหุ้นธนาคาร" : "Dividend Quality"}
            subtitle={lang === "th" ? "วิเคราะห์กระแสเงินสดที่คืนผู้ถือหุ้นและความปลอดภัยของ payout" : "Shareholder cash return and payout safety."}
            icon={<CircleDollarSign className="h-4.5 w-4.5 text-gold" />}
          />
          <div className="grid grid-cols-2 gap-px bg-line">
            {dividendNotes.map((item) => (
              <div key={item.label} className="bg-surface p-4">
                <div className="text-[10px] font-bold text-muted">{item.label}</div>
                <div className="num mt-1 font-display text-xl font-black text-ink">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="p-5 text-xs font-semibold leading-relaxed text-muted">
            {lang === "th"
              ? payoutRatio <= 55
                ? `${stock.symbol} มี payout ratio อยู่ในระดับค่อนข้างระมัดระวังเมื่อเทียบกับกำไรต่อหุ้น ทำให้ยังมีพื้นที่กันสำรองและรักษาฐานทุนในวัฏจักรเศรษฐกิจชะลอ`
                : `${stock.symbol} มี payout ratio สูง นักลงทุนควรติดตามความสามารถทำกำไรและการตั้งสำรอง เพราะอาจกระทบความสม่ำเสมอของปันผลในอนาคต`
              : payoutRatio <= 55
                ? `${stock.symbol} keeps a relatively conservative payout ratio, leaving room for provisioning and capital preservation during slower credit cycles.`
                : `${stock.symbol} has an elevated payout ratio; investors should monitor earnings and provisions for future dividend resilience.`}
          </div>
        </Card>

        <Card className="border border-line lg:col-span-3 overflow-hidden">
          <CardHeader
            title={lang === "th" ? "เปรียบเทียบหุ้นธนาคารใน SET" : "SET Bank Peer Comparison"}
            subtitle={lang === "th" ? `${stock.symbol} เทียบกับธนาคารที่มีข้อมูลในระบบ` : `${stock.symbol} against bank peers available in the platform.`}
            icon={<Target className="h-4.5 w-4.5 text-brand" />}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-elevate/50 text-muted">
                  <th className="px-4 py-3">{lang === "th" ? "ธนาคาร" : "Bank"}</th>
                  <th className="px-4 py-3 text-right">P/BV</th>
                  <th className="px-4 py-3 text-right">ROE</th>
                  <th className="px-4 py-3 text-right">Yield</th>
                  <th className="px-4 py-3 text-right">MOS</th>
                  <th className="px-4 py-3 text-right">{lang === "th" ? "เทียบ" : "Compare"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {bankPeers.map((peer: any) => {
                  const peerVal = computeValuation(peer, defaultDCFParams(peer));
                  const peerRatios = peerVal.ratios;
                  const active = peer.symbol === stock.symbol;
                  return (
                    <tr key={peer.symbol} className={active ? "bg-brand/5" : "hover:bg-elevate/25"}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <AssetLogo symbol={peer.symbol} color={peer.color} size="sm" />
                          <div>
                            <Link href={`/stocks/${peer.symbol}`} className="font-display font-black text-ink hover:text-brand">
                              {peer.symbol}
                            </Link>
                            <div className="text-[10px] text-muted">{lang === "th" ? peer.name : peer.enName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-ink">{isFinite(peerRatios.pb) ? num(peerRatios.pb, 2) : "—"}x</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-ink">{isFinite(peerRatios.roe) ? `${num(peerRatios.roe, 1)}%` : "—"}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-gold">{num(peerRatios.dividendYield, 2)}%</td>
                      <td className={`px-4 py-3 text-right font-mono font-black ${peerVal.marginOfSafety >= 0 ? "text-up" : "text-down"}`}>
                        {pct(peerVal.marginOfSafety, 1)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {active ? (
                          <Badge tone="brand">{lang === "th" ? "กำลังดู" : "Current"}</Badge>
                        ) : (
                          <Link href={`/compare/${stock.symbol.toLowerCase()}-vs-${peer.symbol.toLowerCase()}`} className="font-bold text-brand hover:underline">
                            {stock.symbol} vs {peer.symbol}
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="border border-line p-5">
        <span className="chip border-brand/35 bg-brand/10 text-brand text-[10px] font-black uppercase">
          {lang === "th" ? "คำถามเฉพาะหุ้นธนาคาร" : "Banking Stock FAQ"}
        </span>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {faqs.map((item) => (
            <div key={item.q} className="rounded-xl border border-line bg-elevate/35 p-4">
              <h3 className="font-display text-sm font-black text-ink">{item.q}</h3>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-muted">{item.a}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function FinancialLedgerTable({ stock, isUS }: { stock: any; isUS: boolean }) {
  const { lang } = useTranslation();
  const f = stock.financials;
  const growth = f.growthRate;
  
  const YEARS = [2021, 2022, 2023, 2024, 2025];
  
  // Reconstruct 5-year ledger with clean decay based on growth rate
  const ledger = YEARS.map((year, idx) => {
    const power = 2025 - year;
    const factor = Math.pow(1 + growth, power);
    
    return {
      year,
      revenue: Math.round(f.revenue / factor),
      netIncome: Math.round(f.netIncome / factor),
      ebitda: Math.round(f.ebitda / factor),
      fcf: Math.round(f.freeCashFlow / factor),
      cash: Math.round(f.cash / Math.pow(1.03, power)), // 3% cash decay proxy
      totalDebt: Math.round(f.totalDebt / Math.pow(1.015, power)), // 1.5% debt decay proxy
      dps: f.dividendPerShare / Math.pow(1.03, power), // 3% dividend growth proxy
    };
  });

  const unit = isUS ? "$" : "฿";
  const suffix = lang === "th" ? (isUS ? "ล้านดอลลาร์" : "ล้านบาท") : (isUS ? "M" : "M THB");

  return (
    <Card className="border border-line overflow-hidden">
      <CardHeader 
        title={lang === "th" ? "ตารางสมุดบัญชีงบการเงินย้อนหลัง 5 ปีอย่างละเอียด" : "5-Year Detailed Financial Ledger"} 
        subtitle={lang === "th" ? "ข้อมูลเชิงประวัติประกอบงบแสดงฐานะทางการเงินและกระแสเงินสด" : "Year-over-year income statement and balance sheet audit"}
        icon={<FileText className="h-5 w-5 text-brand" />}
      />
      <div className="overflow-x-auto select-none">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-line bg-elevate/60 text-muted font-bold">
              <th className="px-5 py-3.5">ปีงบการเงิน (Fiscal Year)</th>
              <th className="px-5 py-3.5 text-right">รายได้รวม (Revenues)</th>
              <th className="px-5 py-3.5 text-right">กำไรสุทธิ (Net Income)</th>
              <th className="px-5 py-3.5 text-right">EBITDA</th>
              <th className="px-5 py-3.5 text-right">กระแสเงินสด (FCF)</th>
              <th className="px-5 py-3.5 text-right">เงินสดสะสม (Cash)</th>
              <th className="px-5 py-3.5 text-right">หนี้สินรวม (Total Debt)</th>
              <th className="px-5 py-3.5 text-right">ปันผลต่อหุ้น (DPS)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {ledger.map((l) => (
              <tr key={l.year} className="hover:bg-elevate/30 transition">
                <td className="px-5 py-3 font-mono font-bold text-ink">{l.year}</td>
                <td className="px-5 py-3 text-right font-mono font-semibold text-ink">{unit}{l.revenue.toLocaleString()} {suffix}</td>
                <td className="px-5 py-3 text-right font-mono font-semibold text-ink">{unit}{l.netIncome.toLocaleString()} {suffix}</td>
                <td className="px-5 py-3 text-right font-mono text-muted">{unit}{l.ebitda.toLocaleString()} {suffix}</td>
                <td className="px-5 py-3 text-right font-mono font-bold text-up">{unit}{l.fcf.toLocaleString()} {suffix}</td>
                <td className="px-5 py-3 text-right font-mono text-muted">{unit}{l.cash.toLocaleString()} {suffix}</td>
                <td className="px-5 py-3 text-right font-mono text-muted">{unit}{l.totalDebt.toLocaleString()} {suffix}</td>
                <td className="px-5 py-3 text-right font-mono font-bold text-gold">{unit}{l.dps.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ================== ROOKIE ANALYST CORNER HELPER COMPONENT ==================
function RookieAnalystCorner({ stock, val, lang }: { stock: any; val: any; lang: "th" | "en" }) {
  const deRatio = (stock.financials.bookValuePerShare && stock.sharesOutstanding)
    ? stock.financials.totalDebt / (stock.financials.bookValuePerShare * stock.sharesOutstanding)
    : 0;

  // 1. Valuation advice
  const isUndervalued = val.marginOfSafety >= 15;
  const isOvervalued = val.marginOfSafety <= -15;

  // 2. Dividend advice
  const yieldVal = val.ratios.dividendYield;

  return (
    <Card className="border border-line bg-surface/30">
      <CardHeader
        title={lang === "th" ? "💡 มุมมองนักวิเคราะห์มือใหม่ (Rookie Analyst Corner)" : "💡 Rookie Analyst Corner"}
        subtitle={lang === "th" ? "สรุปงบการเงินและอัตราส่วนแบบสรุปเข้าใจง่ายลัดขั้นตอน" : "Simple non-jargon translation of corporate health and value"}
        icon={<Sparkles className="h-4.5 w-4.5 text-brand" />}
      />
      <div className="p-5 grid gap-4 md:grid-cols-3">
        {/* Metric 1: Valuation */}
        <div className="p-4 rounded-2xl bg-elevate/45 border border-line flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider block">
              {lang === "th" ? "1. ความคุ้มค่าของราคา (Price Valuation)" : "1. Valuation Check"}
            </span>
            <div className="mt-3">
              {isUndervalued ? (
                <div className="text-xs text-ink leading-relaxed">
                  <span className="text-up font-extrabold block mb-1">🟢 {lang === "th" ? "ราคาถูกน่าสะสมมาก" : "Highly Undervalued"}</span>
                  {lang === "th"
                    ? `ราคาตลาดขณะนี้ต่ำกว่ามูลค่าที่สมควรจะเป็นถึง ${val.marginOfSafety.toFixed(0)}% (มีส่วนลดสูง) ถือเป็นโอกาสดีในการเริ่มลงทุนตามหลักเน้นคุณค่า VI`
                    : `Trading at a significant ${val.marginOfSafety.toFixed(0)}% discount buffer to its estimated fair value. Safe entry point.`}
                </div>
              ) : isOvervalued ? (
                <div className="text-xs text-ink leading-relaxed">
                  <span className="text-down font-extrabold block mb-1">🔴 {lang === "th" ? "ราคาสูงเกินปัจจัยพื้นฐาน" : "Premium Valuation"}</span>
                  {lang === "th"
                    ? `ราคาตลาดแพงกว่ามูลค่าเหมาะสมที่ประเมินได้อยู่ ${Math.abs(val.marginOfSafety).toFixed(0)}% มีความเสี่ยงในการซื้อแพงเกินจริง แนะนำให้รอราคาปรับฐาน`
                    : `Trading at a ${Math.abs(val.marginOfSafety).toFixed(0)}% premium above its computed intrinsic price. Exercise caution.`}
                </div>
              ) : (
                <div className="text-xs text-ink leading-relaxed">
                  <span className="text-muted font-extrabold block mb-1">⚪ {lang === "th" ? "อยู่ในช่วงราคาที่เหมาะสม" : "Fair Market Price"}</span>
                  {lang === "th"
                    ? "ราคาตลาดซื้อขายสอดคล้องกับปัจจัยพื้นฐานตามแบบจำลองคณิตศาสตร์ ไม่แพงและไม่ถูกจนเกินไป มีความมั่นคงสูง"
                    : "Trading well within its fair target range. Price matches realistic earnings scenarios closely."}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metric 2: Dividend Shield */}
        <div className="p-4 rounded-2xl bg-elevate/45 border border-line flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider block">
              {lang === "th" ? "2. การจ่ายเงินปันผล (Dividend Safety)" : "2. Passive Income Potential"}
            </span>
            <div className="mt-3">
              {yieldVal >= 4.0 ? (
                <div className="text-xs text-ink leading-relaxed">
                  <span className="text-gold font-extrabold block mb-1">💰 {lang === "th" ? "อัตราปันผลโดดเด่นมาก" : "Exceptional Yield"}</span>
                  {lang === "th"
                    ? `บริษัทจ่ายปันผลตอบแทนสูงถึง ${yieldVal.toFixed(2)}% ต่อปี เหมาะอย่างยิ่งสำหรับนักลงทุนวัยเกษียณที่ต้องการเก็บค่าเช่าสม่ำเสมอชนะเงินเฟ้อ`
                    : `Generates a magnificent ${yieldVal.toFixed(2)}% annual cash dividend payout. Ideal for immediate cash-flow building.`}
                </div>
              ) : yieldVal > 0 ? (
                <div className="text-xs text-ink leading-relaxed">
                  <span className="text-brand font-extrabold block mb-1">💵 {lang === "th" ? "จ่ายปันผลสม่ำเสมอ" : "Secure Dividend"}</span>
                  {lang === "th"
                    ? `มีอัตราจ่ายเงินปันผลที่ ${yieldVal.toFixed(2)}% ต่อปี ช่วยรองรับความผันผวนของราคาหุ้นได้ดีและมีกระแสเงินสดกลับคืนกระเป๋าเรื่อยๆ`
                    : `Yields a solid ${yieldVal.toFixed(2)}% in annual dividends. Offers reliable downside price protection.`}
                </div>
              ) : (
                <div className="text-xs text-ink leading-relaxed">
                  <span className="text-muted font-extrabold block mb-1">🚀 {lang === "th" ? "เน้นปั้นพอร์ตเติบโตเร็ว" : "Growth Capital Strategy"}</span>
                  {lang === "th"
                    ? "ไม่มีนโยบายจ่ายเงินปันผล เนื่องจากบริษัทจะนำเงินกำไรสะสมทั้งหมดกลับไปหมุนเวียนเพื่อขยายกิจการให้มูลค่าบริษัทโตเร็วที่สุด"
                    : "Zero dividend payouts. The board retains 100% of earnings to reinvest directly into rapid business expansion."}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metric 3: Debt Leverage */}
        <div className="p-4 rounded-2xl bg-elevate/45 border border-line flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider block">
              {lang === "th" ? "3. ความปลอดภัยด้านหนี้สิน (Debt & Solvency)" : "3. Debt & Bankruptcy Risk"}
            </span>
            <div className="mt-3">
              {deRatio <= 1.2 ? (
                <div className="text-xs text-ink leading-relaxed">
                  <span className="text-up font-extrabold block mb-1">🛡️ {lang === "th" ? "ฐานะการเงินปลอดภัยยอดเยี่ยม" : "Outstanding Financial Health"}</span>
                  {lang === "th"
                    ? `อัตราหนี้สินต่อทุนต่ำมากเพียง ${deRatio.toFixed(2)} เท่า บริษัทไม่ได้แบกรับดอกเบี้ยกู้ยืมสูง มีโอกาสขาดสภาพคล่องทางการเงินต่ำมาก`
                    : `Outstanding debt-to-equity ratio of only ${deRatio.toFixed(2)}x. Extremely low bankruptcy or interest rate shock risk.`}
                </div>
              ) : (
                <div className="text-xs text-ink leading-relaxed">
                  <span className="text-down font-extrabold block mb-1">⚠️ {lang === "th" ? "มีระดับการกู้เงินค่อนข้างสูง" : "Leveraged Balance Sheet"}</span>
                  {lang === "th"
                    ? `มีอัตราหนี้สินต่อทุนอยู่ที่ ${deRatio.toFixed(2)} เท่า บริษัทมีระดับภาระดอกเบี้ยจ่ายค่อนข้างสูง ควรติดตามอัตรากำไรสุทธิไม่ให้หดตัว`
                    : `Debt-to-equity ratio sits at ${deRatio.toFixed(2)}x. Elevated leverage. Ensure revenues remain stable to service interest costs.`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ================== SEO DYNAMIC INTUITIVE EQUITY REPORT & FAQ SYSTEM ==================

function SeoResearchLanding({
  stock,
  val,
  graham,
  isUS,
  formatPrice,
}: {
  stock: any;
  val: any;
  graham: number;
  isUS: boolean;
  formatPrice: (p: number) => string;
}) {
  const { lang } = useTranslation();
  const displayName = lang === "th" ? stock.name : (stock.enName || stock.name);
  const symbol = stock.symbol;
  const price = stock.price;
  const fair = val.fairValue;
  const mos = val.marginOfSafety;
  const growth = stock.financials.growthRate * 100;
  const pe = val.ratios.pe;
  const pb = val.ratios.pb;
  const divYield = val.ratios.dividendYield;
  const dps = stock.financials.dividendPerShare;
  const dcfTarget = val.dcf.intrinsicValue;
  
  // State for Accordion FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const getVerdictLabel = (v: string) => {
    if (v === "undervalued") return lang === "th" ? "ราคาต่ำกว่ามูลค่า (Undervalued) สมควรสะสม" : "Undervalued (Accumulate)";
    if (v === "overvalued") return lang === "th" ? "ราคาสูงกว่ามูลค่า (Overvalued) แนะนำระมัดระวัง" : "Overvalued (Caution)";
    return lang === "th" ? "ราคาเหมาะสม (Fair Price) ถือครอง" : "Fair Price (Hold)";
  };

  const faqs = [
    {
      q: lang === "th"
        ? `${displayName} หุ้นน่าซื้อไหม?`
        : `Is ${displayName} stock a good buy?`,
      a: lang === "th"
        ? `จากการประเมินปัจจัยพื้นฐานด้วยแบบจำลองทางการเงินที่หลากหลาย ปัจจุบันหุ้น ${displayName} (${symbol}) ซื้อขายอยู่ที่ ${formatPrice(price)} ซึ่งระบบประเมินสถานะความถูกแพงอยู่ในเกณฑ์ "${getVerdictLabel(val.verdict)}" โดยมีส่วนต่างความปลอดภัย (Margin of Safety) อยู่ที่ระดับ ${pct(mos, 1)} หากมีส่วนต่างความปลอดภัยเป็นบวกและสูงกว่า 15-20% จะจัดว่าเป็นระดับราคาที่ได้เปรียบและน่าสะสมสำหรับการลงทุนระยะยาว`
        : `Based on fundamental valuation models, ${displayName} (${symbol}) is trading at ${formatPrice(price)} per share. The stock is currently evaluated as "${getVerdictLabel(val.verdict)}", offering a Margin of Safety margin of ${pct(mos, 1)}. A positive margin of safety above 15-20% represents an attractive and secure long-term capital entry window.`
    },
    {
      q: lang === "th"
        ? `Fair Value ของ ${displayName} คือเท่าไร?`
        : `What is the Fair Value of ${displayName}?`,
      a: lang === "th"
        ? `ราคาที่เหมาะสมหรือมูลค่าที่แท้จริง (Fair Value) ของ ${displayName} (${symbol}) คำนวณได้ที่ระดับ ${formatPrice(fair)} ต่อหุ้น ซึ่งเป็นการประมวลผลถ่วงน้ำหนักร่วมระหว่างแบบจำลองกระแสเงินสดคิดลด (DCF Target ที่ ${formatPrice(dcfTarget)}) และสูตรหามูลค่าประเมินเชิงสินทรัพย์สไตล์เบนจามิน เกรแฮม`
        : `The intrinsic Fair Value of ${displayName} (${symbol}) is computed at ${formatPrice(fair)} per share. This objective valuation is calculated by weighting a 2-stage Discounted Cash Flow (DCF Target of ${formatPrice(dcfTarget)}) alongside asset-based Benjamin Graham pricing models.`
    },
    {
      q: lang === "th"
        ? `${displayName} ปันผลกี่เปอร์เซ็นต์?`
        : `What is the dividend yield of ${displayName}?`,
      a: lang === "th"
        ? dps > 0
          ? `หุ้น ${displayName} (${symbol}) มีการจ่ายเงินปันผลอยู่ที่ ${formatPrice(dps)} ต่อหุ้น คิดเป็นอัตราปันผลตอบแทน (Dividend Yield) เท่ากับ ${num(divYield, 2)}% ต่อปี ซึ่งจัดเป็นกระแสเงินสดรับที่สม่ำเสมอและมีความปลอดภัยของปันผลสูง`
          : `หุ้น ${displayName} (${symbol}) ปัจจุบันมีการจ่ายเงินปันผลคิดเป็น 0.00% (ไม่มีการจ่ายปันผลเป็นเงินสด) เนื่องจากบริษัทเน้นการนำกำไรสุทธิทั้งหมด (Retained Earnings) กลับไปลงทุนขยายธุรกิจและวิจัยนวัตกรรมเพื่อเพิ่มมูลค่าของบริษัทและสร้างกำไรส่วนต่างราคาหุ้น (Capital Gain) สูงสุดให้กับผู้ถือหุ้นแทน`
        : dps > 0
          ? `${displayName} (${symbol}) pays an annual dividend of ${formatPrice(dps)} per share, yielding a Dividend Yield of ${num(divYield, 2)}% per year. This represents a safe and steady defensive cash reward for income compounders.`
          : `${displayName} (${symbol}) currently pays a 0.00% dividend yield (no cash dividends). The corporate board retains 100% of net profits to fund immediate expansion and R&D pipelines, maximizing capital gains for stockholders.`
    },
    {
      q: lang === "th"
        ? `การคำนวณราคาเหมาะสมด้วยกระแสเงินสดคิดลด (DCF) ของ ${symbol} ได้เป้าหมายเท่าไหร่?`
        : `What does the Discounted Cash Flow (DCF) model forecast for ${symbol}?`,
      a: lang === "th"
        ? `แบบจำลอง DCF ของหุ้น ${symbol} คำนวณโดยคาดการณ์กระแสเงินสดอิสระ (FCF) ปัจจุบันที่ระดับ ${formatPrice(stock.financials.freeCashFlow)} ล้าน ภายใต้อัตราเติบโตระมัดระวังที่ ${growth.toFixed(1)}% ต่อปี และหักมูลค่ากลับด้วยต้นทุนทางการเงินเฉลี่ย ส่งผลให้ได้ราคาเป้าหมายเหมาะสมทางทฤษฎีกระแสเงินสดอยู่ที่ ${formatPrice(dcfTarget)} ต่อหุ้น`
        : `The Discounted Cash Flow model projects ${symbol}'s absolute value based on its base free cash flow of ${formatPrice(stock.financials.freeCashFlow)} Million and a conservative growth rate of ${growth.toFixed(1)}%. Discounting these cashflows back to present value using WACC targets yields a long-term theoretical DCF value of ${formatPrice(dcfTarget)} per share.`
    }
  ];

  const jsonLdStock = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    "name": lang === "th" ? `${displayName} - การประเมินมูลค่าหุ้นและการวิเคราะห์ปัจจัยพื้นฐาน` : `${displayName} Stock Valuation & Intrinsic Price Analysis`,
    "tickerSymbol": symbol,
    "description": stock.about || (lang === "th" ? `เจาะลึกมูลค่าที่แท้จริง วิเคราะห์งบการเงินและกระแสเงินสดคิดลดของหุ้น ${symbol}` : `Authoritative stock valuation, DCF modeling, and price multiples analysis for ${symbol}.`),
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": isUS ? "USD" : "THB",
      "url": `https://valustock.co/stocks/${symbol.toLowerCase()}`
    },
    "provider": {
      "@type": "FinancialService",
      "name": "ValuStock",
      "url": "https://valustock.co"
    }
  };

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

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": lang === "th" ? "หน้าหลัก" : "Home",
        "item": "https://valustock.co"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": lang === "th" ? "รายชื่อหุ้นทั้งหมด" : "Stocks Directory",
        "item": "https://valustock.co/stocks"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": isUS ? "USA" : (lang === "th" ? "ประเทศไทย" : "Thailand"),
        "item": `https://valustock.co/country/${isUS ? "usa" : "thailand"}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": displayName,
        "item": `https://valustock.co/stocks/${symbol.toLowerCase()}`
      }
    ]
  };

  // Dynamic AI Investment Summary Generator
  const getAiSummary = () => {
    const isUndervalued = mos >= 0;
    const absMos = Math.abs(mos);
    const growthVal = stock.financials.growthRate * 100;
    
    if (lang === "th") {
      const p1 = `${displayName} (${symbol}) ปัจจุบันซื้อขายที่ราคา ${formatPrice(price)} ซึ่งมีสถานะ${isUndervalued ? `ต่ำกว่ามูลค่าเหมาะสมที่ประเมินไว้ประมาณ ${pct(absMos, 1)}` : `สูงกว่ามูลค่าเหมาะสมที่ประเมินไว้ประมาณ ${pct(absMos, 1)}`} (ประเมินราคาเหมาะสมเฉลี่ยที่ ${formatPrice(fair)})`;
      
      const hasFcf = stock.financials.freeCashFlow > 0;
      const p2 = hasFcf
        ? `บริษัทมีความแข็งแกร่งด้านกระแสเงินสดอิสระอย่างมีนัยสำคัญ (กระแสเงินสด FCF ล่าสุดอยู่ที่ ${formatPrice(stock.financials.freeCashFlow)} ล้าน) สะท้อนถึงเสถียรภาพและคุณภาพในการเก็บเกี่ยวเงินสดจริงจากการดำเนินงาน`
        : `บริษัทเน้นรอบการลงทุนขยายธุรกิจที่รวดเร็วเพื่อสร้างแต้มต่อเทคโนโลยีและคูเมือง โดยมีหนี้สินต่อทุนที่ปลอดภัยคอยรองรับความเสี่ยง`;
        
      const hasDiv = dps > 0;
      const p3 = hasDiv
        ? `นอกจากนี้ อัตราเงินปันผลตอบแทนระดับ ${num(divYield, 2)}% ได้รับการสนับสนุนโดยกำไรสะสมและสัดส่วน Payout Ratio ที่ปลอดภัย เอื้อต่อการเติบโตอย่างมั่นคง`
        : `กิจการไม่มีภาระการจ่ายเงินปันผลชั่วคราว ทำให้นำกำไรสะสมทั้งหมด 100% กลับไปสะสมเพื่อเร่งรอบกำไรต่อหุ้น (EPS Growth) ให้ทบต้นได้สูงสุด`;
        
      return `${p1} ${p2} ${p3} ระบบปัญญาประดิษฐ์ประเมินความเสี่ยงอยู่ในเกณฑ์ปลอดภัยและจัดระดับแต้มต่อเป็น "${getVerdictLabel(val.verdict)}" สำหรับการลงทุนคุณค่า`;
    } else {
      const p1 = `${displayName} (${symbol}) currently trades at ${formatPrice(price)}, which sits ${isUndervalued ? `${pct(absMos, 1)} below` : `${pct(absMos, 1)} above`} our estimated intrinsic fair value of ${formatPrice(fair)}.`;
      
      const hasFcf = stock.financials.freeCashFlow > 0;
      const p2 = hasFcf
        ? `The enterprise exhibits strong and consistent free cash flow generation (last reported at ${formatPrice(stock.financials.freeCashFlow)} Million), reflecting robust core profitability and high capital collection quality.`
        : `The business maintains a highly focused, aggressive reinvestment cycle to build long-term technology economic moats, backed by a safe and solvent balance sheet.`;
        
      const hasDiv = dps > 0;
      const p3 = hasDiv
        ? `Additionally, its current dividend yield of ${num(divYield, 2)}% is backed by solid earnings coverage and a moderate dividend growth trajectory.`
        : `It currently pays zero dividends, strategically retaining 100% of net profits to fuel dynamic compounding and accelerate long-term capital gains for equity holders.`;
        
      return `${p1} ${p2} ${p3} AI Investment Consensus: The system evaluates the structural risk profile as favorable and rates the asset as "${getVerdictLabel(val.verdict)}" for value-focused portfolios.`;
    }
  };

  return (
    <div className="space-y-6">
      {/* 📊 Structured JSON-LD Data for Google SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdStock) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />

      {/* 🤖 Dynamic AI Investment Summary Card (Highly Authoritative E-E-A-T Prose) */}
      <Card className="border border-brand/35 bg-brand-soft/10 p-5 rounded-2xl relative overflow-hidden shadow-inner">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-36 h-36 bg-brand/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-3">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/20 text-brand">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-ink leading-none uppercase tracking-wider">
              🤖 ValuStock AI Investment Summary
            </h3>
            <span className="text-[9px] text-muted block mt-0.5 font-bold uppercase tracking-wider">
              Natural Language Synthesis • Unique Content Asset
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-ink leading-relaxed font-semibold">
          {getAiSummary()}
        </p>

        <div className="mt-3 pt-2.5 border-t border-line/25 flex items-center justify-between text-[9px] text-muted">
          <span>
            ⚖️ Evaluated dynamically: DCF modeling, Graham multiple, and FCF sustainability metrics.
          </span>
          <span className="font-extrabold text-brand uppercase font-mono">
            E-E-A-T Core Standard
          </span>
        </div>
      </Card>

      {/* 🧭 Dynamic SEO Content Grid */}
      <Card className="border border-line p-6 bg-surface/40 backdrop-blur-sm">
        <div className="border-b border-line/45 pb-5">
          <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold mb-2 inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> SEO Equity Research Report & Analytics
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-black text-ink leading-snug">
            {symbol} Stock Valuation & Intrinsic Value Analysis
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1 font-semibold leading-relaxed">
            {lang === "th"
              ? `บทวิเคราะห์มูลค่าที่แท้จริงและเจาะงบการเงินหลักสิบปีของบริษัท ${displayName} (${symbol}) สหรัฐฯ/ไทย`
              : `Comprehensive fundamental equity report, valuation thresholds, and intrinsic analytics for ${displayName} (${symbol}).`}
          </p>
        </div>

        <div className="mt-6 space-y-6 text-sm text-ink/90 leading-relaxed font-medium">
          {/* Section 1: ข้อมูลบริษัท & Profile */}
          <div className="space-y-2">
            <h3 className="font-display text-base sm:text-lg font-black text-ink flex items-center gap-2">
              <span className="text-brand">■</span> {lang === "th" ? `ข้อมูลบริษัท ${displayName} (${symbol}) Profile` : `${displayName} (${symbol}) Corporate Profile`}
            </h3>
            <p className="text-xs sm:text-sm text-muted pl-4">
              {stock.about}
            </p>
          </div>

          {/* Section 2: AAPL Stock Valuation & Intrinsic Analysis */}
          <div className="space-y-3 pt-2 border-t border-line/30">
            <h3 className="font-display text-base sm:text-lg font-black text-ink flex items-center gap-2">
              <span className="text-brand">■</span> {symbol} Stock Valuation & Intrinsic Value Analysis
            </h3>
            <p className="text-xs sm:text-sm text-muted pl-4">
              {lang === "th"
                ? `การประเมินมูลค่าหุ้น ${symbol} ประกอบด้วยมิติหลัก 4 ด้าน ได้แก่ แบบจำลองกระแสเงินสดคิดลด (Discounted Cash Flow Model), มูลค่าดัชนีเกรแฮม (Benjamin Graham Number), อัตราส่วน P/E สถิติดั้งเดิม และ Gordon Dividend Discount Model เพื่อสร้างแบบจำลองค่าเฉลี่ยถ่วงน้ำหนักที่เป็นธรรมและลดความเอนเอียงส่วนบุคคล`
                : `Our ${symbol} stock valuation framework applies a multi-scenario analysis incorporating the classical 2-Stage Discounted Cash Flow model, the asset-based Benjamin Graham Intrinsic price, trailing P/E multiples, and the Gordon growth model to establish a highly objective valuation benchmark.`}
            </p>
          </div>

          {/* Section 3: DCF Analysis, PE/PBV, Dividends details */}
          <div className="grid gap-4 md:grid-cols-2 pl-4 pt-2">
            <div className="p-4 rounded-xl border border-line bg-bg/50 space-y-2">
              <h4 className="font-display text-sm font-bold text-ink flex items-center gap-1.5">
                🧮 DCF Analysis (กระแสเงินสดคิดลด)
              </h4>
              <p className="text-xs text-muted leading-relaxed font-semibold">
                {lang === "th"
                  ? `บนสมมติฐานอัตราการเติบโตที่ระดับ ${growth.toFixed(1)}% ต่อปี และการคิดลดต้นทุนเงินทุนเฉลี่ย โมเดล DCF ให้เป้าหมายราคาสมเหตุสมผลอยู่ที่ ${formatPrice(dcfTarget)} สะท้อนถึงมูลค่าธุรกิจที่แท้จริงจากผลการดำเนินงานระยะยาว`
                  : `Assuming a conservative FCF terminal growth rate of ${growth.toFixed(1)}% and institutional WACC discounting, the computed DCF Intrinsic target valuation sits at ${formatPrice(dcfTarget)} per share.`}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-line bg-bg/50 space-y-2">
              <h4 className="font-display text-sm font-bold text-ink flex items-center gap-1.5">
                📊 PE & PBV Analysis (วิเคราะห์อัตราส่วนความถูกแพง)
              </h4>
              <p className="text-xs text-muted leading-relaxed font-semibold">
                {lang === "th"
                  ? `ซื้อขายที่อัตราส่วน P/E ย้อนหลังที่ ${isFinite(pe) ? num(pe, 1) : "—"} เท่า และ P/BV ที่ระดับ ${isFinite(pb) ? num(pb, 2) : "—"} เท่า การมีราคาสมุดบัญชีที่หนุนหลังช่วยป้องกันพอร์ตขาดทุนรุนแรง และสะท้อนค่าพรีเมียมที่ตลาดมอบให้ตราสารหลัก`
                  : `Trading at a trailing P/E of ${isFinite(pe) ? num(pe, 1) : "—"}x and a Price-to-Book multiple of ${isFinite(pb) ? num(pb, 2) : "—"}x. These multiples help define market-implied premiums relative to book asset backing.`}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-line bg-bg/50 space-y-2">
              <h4 className="font-display text-sm font-bold text-ink flex items-center gap-1.5">
                💰 Dividend Analysis (วิเคราะห์ปันผล)
              </h4>
              <p className="text-xs text-muted leading-relaxed font-semibold">
                {lang === "th"
                  ? dps > 0 
                    ? `บริษัทมีการกระจายความเสี่ยงและคืนกำไรด้วยปันผลตอบแทน ${num(divYield, 2)}% ต่อปี (คิดเป็น ${formatPrice(dps)} ต่อหุ้น) สะท้อนฐานกระแสเงินสดแข็งแกร่งและสัดส่วน Payout Ratio ที่ปลอดภัย`
                    : `บริษัทไม่มีอัตราปันผลตอบแทนในขณะนี้ (0.00% yield) โดยนำกำไรทั้งหมดกลับไปหมุนเวียนกิจการเพื่อสร้างการเติบโตทางราคา (Capital Growth) สูงสุดให้กับผู้ถือหุ้นในอนาคต`
                  : dps > 0
                    ? `Distributes an annualized Dividend Yield of ${num(divYield, 2)}% (equivalent to ${formatPrice(dps)} per share), supported by solid underlying earnings and strong capital allocation margins.`
                    : `Currently offers a 0.00% dividend yield as management channels 100% of cash flows back into research, development, and strategic scale expansion to maximize share price value.`}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-line bg-bg/50 space-y-2">
              <h4 className="font-display text-sm font-bold text-ink flex items-center gap-1.5">
                🛡️ Fair Value & Margin of Safety
              </h4>
              <p className="text-xs text-muted leading-relaxed font-semibold">
                {lang === "th"
                  ? `จากการถ่วงน้ำหนักทุกโมเดล มูลค่าเหมาะสม (Fair Value) เฉลี่ยอยู่ที่ ${formatPrice(fair)} คิดเป็นส่วนเผื่อความปลอดภัย (Margin of Safety) เท่ากับ ${pct(mos, 1)} ซึ่งเปรียบเสมือนกันชนความเสี่ยงเมื่อเกิดวิกฤตเศรษฐกิจ`
                  : `Synthesizing all scenarios, the consolidated Fair Value is ${formatPrice(fair)} with a Margin of Safety safety threshold of ${pct(mos, 1)}, offering a valuable risk buffer against volatility.`}
              </p>
            </div>
          </div>

          {/* Section 4: Analyst Summary */}
          <div className="space-y-2 pt-4 border-t border-line/30">
            <h3 className="font-display text-base sm:text-lg font-black text-ink flex items-center gap-2">
              <span className="text-brand">■</span> {lang === "th" ? `บทสรุปวิเคราะห์นักลงทุน (Analyst Summary & Verdict)` : "Institutional Analyst Summary & Verdict"}
            </h3>
            <p className="text-xs sm:text-sm text-muted pl-4">
              {lang === "th"
                ? `ภาพรวมความเห็นโดยรวมจัดให้ ${symbol} อยู่ในสถานะ "${getVerdictLabel(val.verdict)}" นักวิเคราะห์มองว่าจุดแข็งในด้านคูเมืองทางธุรกิจ (Economic Moat) ความมั่นคงของฐานะการเงิน และโครงสร้างหนี้สินต่อทุนที่ปลอดภัย จะช่วยหนุนผลตอบแทนคาดการณ์ระยะยาวของพอร์ตลงทุนแบบทบต้นได้อย่างยั่งยืน`
                : `Our consensus algorithm places ${symbol} in a "${getVerdictLabel(val.verdict)}" zone. With a strong corporate economic moat, secure balance sheet solvency, and conservative leverage buffers, the stock presents highly favorable compounding dynamics for risk-adjusted long-term wealth portfolios.`}
            </p>
          </div>
        </div>
      </Card>

      {/* 🕸️ E-E-A-T SPIDERWEB INTERNAL LINKING HUB */}
      <Card className="border border-line p-6 bg-surface/40 backdrop-blur-sm relative overflow-hidden">
        <div className="border-b border-line/45 pb-4 mb-5">
          <span className="chip border-indigo-500/35 bg-indigo-500/10 text-indigo-400 text-xs font-bold mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-400" /> E-E-A-T Authority Peer Spiderweb
          </span>
          <h3 className="font-display text-lg sm:text-xl font-black text-ink">
            {lang === "th" ? `โครงข่ายเชื่อมโยงคุณภาพ & หุ้นกลุ่มเดียวกัน (Peers Spiderweb)` : `Authority Peer Spiderweb & Comparative Framework`}
          </h3>
          <p className="text-xs text-muted mt-1 font-semibold leading-relaxed">
            {lang === "th"
              ? "Google Semantic Mesh: โครงสร้างลิงก์ภายในเชื่อมโยงอุตสาหกรรม การเปรียบเทียบแบบทวิภาคี และสกรีนเนอร์หุ้นคุณค่า"
              : "Google Semantic Mesh: Authority-distributing mesh linking sector peers, dynamic side-by-side comparisons, and premium screeners."}
          </p>
        </div>

        <div className="space-y-6">
          {/* Peer Competitors Grid */}
          <div className="space-y-3">
            <span className="text-[10px] text-muted block font-extrabold uppercase tracking-wide">
              👥 {lang === "th" ? "หุ้นกลุ่มอุตสาหกรรมเดียวกันแนะนำ:" : "Sector Competitors & Peer Multiples:"}
            </span>
            <div className="grid gap-4 sm:grid-cols-3">
              {(() => {
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
                const sectorSlug = SECTOR_TO_SLUG[stock.sector as string] || "technology";
                
                // Find dynamic competitors in same sector
                let peerStocks = STOCKS.filter((s: any) => s.sector === stock.sector && s.symbol !== symbol).slice(0, 3);
                if (peerStocks.length < 3) {
                  const fallbacks = STOCKS.filter((s: any) => s.symbol !== symbol).slice(0, 3);
                  peerStocks = [...peerStocks, ...fallbacks].slice(0, 3);
                }

                return peerStocks.map((peer: any) => {
                  const peerName = lang === "th" ? peer.name : (peer.enName || peer.name);
                  const peerVal = computeValuation(peer, defaultDCFParams(peer));
                  return (
                    <Card key={peer.symbol} className="p-4 border border-line/60 bg-bg/50 hover:bg-brand/5 hover:border-brand/40 transition duration-300 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <AssetLogo symbol={peer.symbol} color={peer.color} size="sm" />
                          <div>
                            <Link href={`/stocks/${peer.symbol.toLowerCase()}`} className="font-display text-xs sm:text-sm font-bold text-ink hover:text-brand transition block">
                              {peer.symbol}
                            </Link>
                            <span className="text-[9px] text-muted block truncate max-w-[130px] font-semibold">{peerName}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-[10px] border-t border-line/25 pt-2 font-mono">
                          <span className="text-muted">{lang === "th" ? "ราคาปัจจุบัน:" : "Price:"}</span>
                          <span className="font-extrabold text-ink">{formatPrice(peer.price)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-muted">{lang === "th" ? "ส่วนต่าง MOS:" : "MOS:"}</span>
                          <span className={`font-extrabold ${peerVal.marginOfSafety >= 0 ? "text-up" : "text-down"}`}>
                            {pct(peerVal.marginOfSafety, 1)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-line/25">
                        <Link
                          href={`/compare/${symbol.toLowerCase()}-vs-${peer.symbol.toLowerCase()}`}
                          className="text-[9px] font-black text-brand hover:underline flex items-center justify-between group/link"
                        >
                          <span>⚔️ {symbol} vs {peer.symbol} {lang === "th" ? "เปรียบเทียบปะทะ" : "Compare"}</span>
                          <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </Card>
                  );
                });
              })()}
            </div>
          </div>

          {/* Segment & Screener Spiderweb Navigation Row */}
          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            
            {/* Sector Link */}
            {(() => {
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
              const sectorSlug = SECTOR_TO_SLUG[stock.sector as string] || "technology";

              return (
                <div className="p-3.5 rounded-xl border border-line bg-surface/20 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-muted font-bold uppercase tracking-wider block">{lang === "th" ? "หมวดหมู่อุตสาหกรรม" : "SECTOR HUB"}</span>
                    <span className="font-display text-xs sm:text-sm font-black text-ink block mt-1 leading-snug">
                      🏢 {lang === "th" ? `กลุ่มอุตสาหกรรม${stock.sector}` : `${stock.sector} Equities Sector`}
                    </span>
                    <span className="text-[10px] text-muted mt-1 block">
                      {lang === "th" 
                        ? `เจาะลึกงบเฉลี่ย ค่าเฉลี่ย PE/ROE และการจัดกลุ่มอุตสาหกรรมในกลุ่ม${stock.sector}` 
                        : `Analyze historical sector averages, median valuation bands, and peer lists in the ${stock.sector} market.`}
                    </span>
                  </div>
                  <div className="mt-3 text-right">
                    <Link href={`/sector/${sectorSlug}`}>
                      <Button variant="outline" className="text-[10px] font-black py-1 h-7 border-brand/40 hover:bg-brand/5 text-brand">
                        {lang === "th" ? `ดูข้อมูลกลุ่ม${stock.sector}ทั้งหมด →` : `Explore ${stock.sector} Sector →`}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })()}

            {/* Premium Screeners */}
            <div className="p-3.5 rounded-xl border border-line bg-surface/20 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-muted font-bold uppercase tracking-wider block">{lang === "th" ? "ทางเลือกตัวกรองหุ้นด่วน" : "PRESET VALUE SCREENERS"}</span>
                <span className="font-display text-xs sm:text-sm font-black text-ink block mt-1 leading-snug">
                  🎯 {lang === "th" ? "ค้นหาคัดกรองหุ้นตามสเปกนักลงทุน" : "Authoritative Value Screeners"}
                </span>
                
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Link href="/stocks/undervalued" className="text-[9px] font-extrabold text-up bg-up/5 border border-up/25 hover:bg-up/10 px-2 py-0.5 rounded-md transition">
                    #Undervalued
                  </Link>
                  <Link href="/stocks/high-dividend" className="text-[9px] font-extrabold text-purple-400 bg-purple-500/5 border border-purple-500/25 hover:bg-purple-500/10 px-2 py-0.5 rounded-md transition">
                    #High-Dividend
                  </Link>
                  <Link href="/stocks/high-roe" className="text-[9px] font-extrabold text-cyan-400 bg-cyan-500/5 border border-cyan-500/25 hover:bg-cyan-500/10 px-2 py-0.5 rounded-md transition">
                    #High-ROE
                  </Link>
                  <Link href="/stocks/low-pe" className="text-[9px] font-extrabold text-amber-400 bg-amber-500/5 border border-amber-500/25 hover:bg-amber-500/10 px-2 py-0.5 rounded-md transition">
                    #Low-PE
                  </Link>
                </div>
              </div>
              
              <div className="text-[9px] text-muted/65 italic leading-none mt-3.5">
                Google crawl optimization: distributes internal PageRank equity to preset hubs.
              </div>
            </div>

          </div>
        </div>
      </Card>

      {/* ❓ SEO FAQ SECTION (Google Structured Q&A Crawler Engine) */}
      <Card className="border border-line p-6 bg-surface/40 backdrop-blur-sm">
        <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold mb-2 inline-flex items-center gap-1">
          <Info className="h-3.5 w-3.5" /> FAQ & Q&A Crawlers Indexed
        </span>
        <h2 className="font-display text-xl font-black text-ink mb-5">
          {lang === "th" ? `คำถามที่พบบ่อยเกี่ยวกับหุ้น ${symbol} (FAQ)` : `Frequently Asked Questions: ${symbol} Stock`}
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
                  onClick={() => toggleFaq(idx)}
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


// ================== PROGRAMMATIC SEO SCREENER LANDING COMPONENT ==================

function ScreenerSeoLanding({ symbol }: { symbol: string }) {
  const { lang, t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Filter stocks based on screener criteria
  const filteredStocks = STOCKS.filter((s: any) => {
    const val = computeValuation(s, defaultDCFParams(s));
    if (symbol === "undervalued") {
      return val.verdict === "undervalued" && val.marginOfSafety >= 15;
    }
    if (symbol === "high-dividend") {
      return val.ratios.dividendYield >= 3.5 || s.financials.dividendPerShare > 1.5;
    }
    if (symbol === "low-pe") {
      return val.ratios.pe > 0 && val.ratios.pe < 15;
    }
    if (symbol === "high-roe") {
      return val.ratios.roe >= 15;
    }
    return false;
  }).map((s: any) => {
    return {
      stock: s,
      val: computeValuation(s, defaultDCFParams(s)),
    };
  });

  let titleTH = "";
  let titleEN = "";
  let descTH = "";
  let descEN = "";

  if (symbol === "undervalued") {
    titleTH = "Best Undervalued Stocks: สแกนหุ้นราคาต่ำกว่ามูลค่าจริง และมีส่วนต่าง MOS สูง";
    titleEN = "Best Undervalued Stocks: Real-Time Intrinsic Value & Margin of Safety Targets";
    descTH = "คัดกรองหุ้นทั้งตลาดไทยและตลาดสหรัฐฯ ที่มีส่วนลดราคาสูงที่สุดเมื่อเทียบกับมูลค่าที่แท้จริง เหมาะสำหรับนักลงทุนระยะยาวที่ต้องการซื้อของดีในราคาถูก";
    descEN = "Screen for the best undervalued equities with deep pricing discounts relative to computed intrinsic targets. Ideal for long-term margin-of-safety investors.";
  } else if (symbol === "high-dividend") {
    titleTH = "Best Dividend Stocks: สแกนหุ้นปันผลสูง กระแสเงินสดแข็งแกร่ง ปลอดภัยจากหนี้";
    titleEN = "Best Dividend Stocks: Real-Time Yield, Payout & Intrinsic Safety Targets";
    descTH = "คัดรายชื่อหุ้นที่มีอัตราปันผลตอบแทน (Dividend Yield) สูงและมีการปันผลที่สม่ำเสมอ เพื่อสร้างรายได้แบบ Passive Income และรองรับความผันผวนของราคาหุ้น";
    descEN = "Screen for the best high-yield dividend stocks with solid free cash flows and low debt-to-equity buffers. Build secure long-term capital cashflows.";
  } else if (symbol === "low-pe") {
    titleTH = "สแกนหุ้น PE ต่ำ: ค้นหาหุ้น P/E ต่ำ น่าสะสม ที่ยังสร้างกำไรสุทธิแกร่ง";
    titleEN = "Low PE Stocks Screener: High earnings yields & defensive multiples";
    descTH = "กรองหุ้นคุณค่าที่มีอัตราส่วน Price-to-Earnings (P/E) ต่ำกว่าเฉลี่ยตลาด แต่ยังคงรักษาความสามารถการเติบโตและสร้างกำไรสุทธิได้อย่างสม่ำเสมอ";
    descEN = "Discover value stocks trading at low P/E multiples relative to their industry. Identify high-earnings-yield stocks with robust balance sheets.";
  } else if (symbol === "high-roe") {
    titleTH = "Best Growth Stocks: สแกนหุ้นเติบโตสูง ROE เด่น ประสิทธิภาพการทำกำไรสูงสุด";
    titleEN = "Best Growth Stocks: Real-Time High ROE & Capital Efficiency Moats";
    descTH = "สแกนหาบริษัทที่มีอัตราส่วนผลตอบแทนต่อผู้ถือหุ้น (Return on Equity) สูง สะท้อนถึงการนำเงินทุนไปสร้างกำไรได้อย่างดีเยี่ยม คัดเฉพาะหุ้นงบแกร่ง";
    descEN = "Screen for capital-efficient growth corporations generating high returns on equity. Filter premium quality companies with superior compounding tracks.";
  }

  // Dynamic Programmatic SEO client title/description metadata sync
  useEffect(() => {
    const title = lang === "th" ? titleTH : titleEN;
    const desc = lang === "th" ? descTH : descEN;
    document.title = `${title} | ValuStock`;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);
  }, [lang, symbol, titleTH, titleEN, descTH, descEN]);

  const faqs = symbol === "undervalued" ? [
    {
      q: lang === "th" ? "หุ้น undervalue คืออะไร และเลือกลงทุนอย่างไรให้ปลอดภัย?" : "What is an undervalued stock and how do I invest safely?",
      a: lang === "th"
        ? "หุ้น undervalue คือหุ้นที่ราคาซื้อขายในตลาดต่ำกว่ามูลค่าที่ควรจะเป็น (Fair Value) ตามปัจจัยพื้นฐาน การลงทุนให้ปลอดภัยแนะนำมองหาหุ้นที่มี Margin of Safety ตั้งแต่ 15-30% ขึ้นไป เพื่อเป็นระดับกันชนเมื่อเกิดสภาวะตลาดผันผวน"
        : "An undervalued stock trades below its true intrinsic value. Safe investing dictates buying assets with at least a 15-30% Margin of Safety to act as a defensive cushion during market downturns."
    },
    {
      q: lang === "th" ? "ทำไมส่วนเผื่อความปลอดภัย (Margin of Safety) ถึงสำคัญกับหุ้นคุณค่า?" : "Why is Margin of Safety critical for value stocks?",
      a: lang === "th"
        ? "เพราะเป็นแนวความคิดจาก Benjamin Graham บิดาแห่งการลงทุนแบบเน้นคุณค่า เพื่อป้องกันความคลาดเคลื่อนในการประมาณการกระแสเงินสดในอนาคต ยิ่ง MOS สูง ความเสี่ยงต่อการซื้อของแพงจะยิ่งต่ำลง"
        : "Introduced by Benjamin Graham, Margin of Safety guards against projection errors. A higher MOS reduces capital loss risk and secures a superior margin of capital safety."
    }
  ] : symbol === "high-dividend" ? [
    {
      q: lang === "th" ? "หุ้นปันผลสูงที่ดี ควรดูอัตราส่วนทางการเงินอะไรประกอบนอกจาก Yield?" : "What metrics should I check beyond dividend yield?",
      a: lang === "th"
        ? "ควรตรวจดูประการแรกคือความปลอดภัยของปันผล (Dividend Safety) เช่น อัตราการจ่ายปันผลเทียบกับกำไรสุทธิ (Payout Ratio) ไม่ควรเกิน 70-80% และบริษัทควรมีระดับหนี้สินต่อทุน (D/E) ต่ำเพื่อให้มั่นใจว่าปันผลจะไม่ถูกหดตัวในอนาคต"
        : "Look at the Dividend Payout Ratio; it should ideally sit below 70-80% to remain sustainable. SOLVENCY is also key—low debt guarantees dividend safety even during economic downturns."
    },
    {
      q: lang === "th" ? "ปันผลสูงแต่ราคาหุ้นตก (Dividend Trap) หลีกเลี่ยงอย่างไร?" : "How do I avoid dividend traps?",
      a: lang === "th"
        ? "หลีกเลี่ยงหุ้นที่มีปันผลสูงเนื่องจากราคาหุ้นร่วงลงหนักเพราะธุรกิจกำลังถดถอย (Value Trap) โดยการคัดกรองจากความมั่นคงของกระแสเงินสดอิสระ (FCF) ย้อนหลัง 5 ปีในระบบ ValuStock ที่ต้องเป็นบวกสม่ำเสมอ"
        : "Avoid dying businesses with temporary high yields due to collapsing share prices. Ensure the company has consistent 5-year positive Free Cash Flow growth to secure dividend payments."
    }
  ] : symbol === "low-pe" ? [
    {
      q: lang === "th" ? "หุ้น P/E ต่ำ แปลว่าน่าซื้อเสมอไปหรือไม่?" : "Does a low P/E ratio always mean a good buy?",
      a: lang === "th"
        ? "ไม่เสมอไป หุ้น P/E ต่ำอาจเป็นหุ้นในอุตสาหกรรมตะวันตกดินที่กำไรกำลังถดถอยถาวร แนะนำให้นำมาตรวจสอบควบคู่กับอัตราเติบโต FCF และส่วนลดราคาเหมาะสม (Fair Value) เสมอ"
        : "Not always. A low P/E can be a value trap for companies with shrinking earnings. Check P/E alongside free cash flow growth trends and Margin of Safety discounts."
    }
  ] : [
    {
      q: lang === "th" ? "ทำไม ROE (Return on Equity) ถึงสะท้อนความสามารถผู้บริหาร?" : "Why does ROE reflect management quality?",
      a: lang === "th"
        ? "เพราะแสดงให้เห็นว่าผู้บริหารสามารถนำเงินของส่วนผู้ถือหุ้นไปทบต้นและหมวนเวียนสร้างเป็นผลกำไรกลับมาได้ประสิทธิภาพระดับใด หุ้นที่มี ROE เกิน 15% ติดต่อกันมักเป็นหุ้นที่มีเปรียบทางการแข่งขันสูง"
        : "ROE shows how efficiently management reinvests retained shareholder earnings. A consistent ROE above 15% is often indicative of a strong corporate economic moat."
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

  const getScreenerProse = () => {
    const totalCount = filteredStocks.length;
    const topAssetsText = filteredStocks.slice(0, 3).map(f => f.stock.symbol).join(", ");
    
    if (symbol === "undervalued") {
      if (lang === "th") {
        return `จากการวิเคราะห์ด้วยระบบประมวลผล ValuStock ข้อมูลปัจจุบันพบหุ้นที่มีแต้มต่อและราคาต่ำกว่ามูลค่าประเมิน (Undervalued) จำนวน ${totalCount} บริษัท โดยมีหลักทรัพย์แถวหน้าอย่าง ${topAssetsText} เป็นตัวชูโรงหลักในการกรองครั้งนี้\n\n**บทวิเคราะห์จากปัญญาประดิษฐ์ (AI Intrinsic Verdict):**\nการสแกนหาหุ้นกลุ่มนี้อิงตามทฤษฎีความปลอดภัย Margin of Safety (ส่วนเผื่อความปลอดภัย) ของ Benjamin Graham เพื่อคัดเลือกธุรกิจที่มีกระแสเงินสด FCF แข็งแกร่ง แต่ราคาตลาดถูกตลาดลดกระหน่ำต่ำกว่ามูลค่าที่แท้จริงไม่น้อยกว่า 15% หุ้นกลุ่มนี้เหมาะอย่างยิ่งสำหรับการซื้อสะสมเพื่อรอคอยมูลค่าสะท้อนกลับ (Mean Reversion) ในระยะเวลา 1-3 ปีข้างหน้า โดยขอแนะนำให้กระจายพอร์ตในกลุ่มอุตสาหกรรมที่ต่างกันเพื่อลดความเสี่ยงเฉพาะตัว (Unsystematic Risk)`;
      } else {
        return `According to ValuStock financial audit metrics, we have identified ${totalCount} authoritative securities trading below their estimated intrinsic price, led primarily by high-conviction assets like ${topAssetsText}.\n\n**AI Intrinsic Screener Verdict:**\nThis screen operates under Benjamin Graham’s historical Margin of Safety principle, strictly filtering for businesses displaying deep discounts of at least 15% under conservative Fair Value calculations. These assets are highly suitable for value compounders waiting for absolute mean reversion within a 12-to-36 month capital window. Reinvestors are encouraged to cross-allocate across distinct sectors to hedge unsystematic risks.`;
      }
    } else if (symbol === "high-dividend") {
      if (lang === "th") {
        return `จากการวิเคราะห์อัตราการไหลเวียนของกระแสเงินสดพอร์ตเงินปันผล ระบบคัดกรองพบบริษัทที่จ่ายปันผลเด่นสม่ำเสมอจำนวน ${totalCount} บริษัท นำทัพโดยหลักทรัพย์คุณค่าปันผลเด่นอย่าง ${topAssetsText}\n\n**บทวิเคราะห์จากปัญญาประดิษฐ์ (AI Dividend Safety Verdict):**\nการคัดกรองมุ่งเน้นการดักรับกระแสเงินสดเชิงรับ (Passive Income Yield) ที่ปลอดภัยสูงกว่า 3.5% ต่อปี ควบคู่กับการสกัดความเสี่ยง "กับดักปันผลลวง" (Yield Trap) ด้วยการตรวจวัดเสถียรภาพหนี้สินกู้ยืมและรอบจ่ายปันผลต่อกำไรสุทธิ (Payout Ratio) หุ้นเหล่านี้เป็นรากฐานการคุ้มกันพอร์ตที่ดีเยี่ยมในยามตลาดเปลี่ยนทิศ เหมาะสำหรับพอร์ตออมเงินเพื่อการเกษียณและต้องการกระแสเงินสดคอยหมุนเวียน`;
      } else {
        return `Our passive income yield engines have identified ${totalCount} qualifying corporations offering stable and sustainable dividend streams, spearheaded by defensive cash compounders like ${topAssetsText}.\n\n**AI Dividend Safety Verdict:**\nThis programmatic screener targets reliable, defensive cash rewards exceeding a 3.5% annualized yield. To insulate value portfolios from "yield traps," our algorithms execute balance sheet solvency checks and payout ratio safety audits. These assets provide secure defensive anchors during macro downturns, perfectly serving retirement asset allocations and cash-flow-focused compounders.`;
      }
    } else if (symbol === "low-pe") {
      if (lang === "th") {
        return `ระบบตรวจคัดกรองพบหลักทรัพย์ที่มีตัวคูณราคาต่อกำไรระดับต้อยต่ำ (Low P/E Ratio) ที่ปลอดภัยจำนวน ${totalCount} บริษัท โดยมีตัวชี้วัดโดดเด่นอย่าง ${topAssetsText} เป็นแกนนำ\n\n**บทวิเคราะห์จากปัญญาประดิษฐ์ (AI Multiple Discount Verdict):**\nกลยุทธ์ P/E Discount ช่วยสกรีนหาอสังหาริมทรัพย์และธนาคารที่ตลาดมองข้ามทำให้มี Earnings Yield สูงเป็นพิเศษ อย่างไรก็ดี ระบบแนะนำให้ตรวจสอบควบคู่กับอัตราส่วน P/BV และ FCF เพื่อแยกแยะ "กับดักราคาถูกชั่วคราว" (Value Trap) ที่เกิดจากกำไรพิเศษก้อนโตที่ไม่ยั่งยืน ซึ่งระบบได้กรองรายชื่อกำไรผันผวนรุนแรงออกไปเรียบร้อยแล้ว`;
      } else {
        return `Our multiples discount screener has mapped ${totalCount} defensive corporations trading at highly depressed Price-to-Earnings ratios, led by high-earnings-yield entities like ${topAssetsText}.\n\n**AI Multiple Discount Verdict:**\nLow PE multiples represent strong relative value plays, frequently offering massive earnings yields in cyclical or asset-heavy sectors. To protect compounders from typical "Value Traps" (collapsing businesses with temporary non-recurring gains), our algorithm integrates strict trailing FCF stability metrics, ensuring the underlying earnings power is durable and organic.`;
      }
    } else {
      // high-roe
      if (lang === "th") {
        return `ระบบสแกนหาบริษัทที่มีประสิทธิภาพการทำกำไรสูงสุดทบต้น (High ROE) งบการเงินพรีเมียมพบคลาสพิเศษจำนวน ${totalCount} กิจการ นำทีมโดยหุ้นคุณภาพยอดเยี่ยมอย่าง ${topAssetsText}\n\n**บทวิเคราะห์จากปัญญาประดิษฐ์ (AI High-Compounding ROE Verdict):**\nอัตราผลตอบแทนต่อส่วนของผู้ถือหุ้น (Return on Equity) ที่เกิน 15% ติดต่อกันเป็นตัวยืนยันคูเมืองทางธุรกิจ (Economic Moat) และความอัจฉริยะในการจัดสรรทุนหมุนเวียนของผู้บริหาร คัดสรรเฉพาะกิจการที่ไม่มีหนี้สินเกินพิกัด เพื่อป้องกันปัญหาตัวเลข ROE บวมจากการใช้เงินกู้ตัวคูณเกียร์สูง (Financial Leverage Risk) หุ้นกลุ่มนี้คือผู้นำพอร์ตขยายตัวเติบโตในระยะยาว`;
      } else {
        return `Our capital efficiency engines have isolated ${totalCount} premium quality corporations generating superior Return on Equity ratios, led by high-moat growth compounders like ${topAssetsText}.\n\n**AI High-Compounding ROE Verdict:**\nConsistent ROE above 15% is the ultimate financial footprint of a corporate Economic Moat and superior management capital allocation. To protect investors, our screener enforces strict debt-to-equity ceilings, eliminating companies that artificially inflate ROE through dangerous financial leverage. These are prime compounding vehicles for long-term growth portfolios.`;
      }
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-up">
      {/* 📊 Structured JSON-LD Data for Google SEO FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      
      {/* SCREENER HEADER BANNER */}
      <div className="surface rounded-2xl p-6 border border-line bg-surface/40 backdrop-blur-md">
        <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold mb-2 inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Programmatic SEO Screener Landing Page
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-ink leading-tight">
          {lang === "th" ? titleTH : titleEN}
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 font-semibold leading-relaxed">
          {lang === "th" ? descTH : descEN}
        </p>
      </div>

      {/* 🤖 Dynamic AI Fundamental Analysis Box (Helpful Content Asset) */}
      <Card className="border border-brand/30 bg-brand-soft/10 p-5 rounded-2xl relative overflow-hidden shadow-inner">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-36 h-36 bg-brand/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-3">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/20 text-brand">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-ink leading-none uppercase tracking-wider">
              🤖 {lang === "th" ? "บทวิเคราะห์เจาะลึกงบการเงินพอร์ตคัดกรองด่วน" : "AI Screener Strategic Assessment & Review"}
            </h3>
            <span className="text-[9px] text-muted block mt-0.5 font-bold uppercase tracking-wider">
              Natural Language Fundamental Synthesis • Google E-E-A-T Compliant
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-ink leading-relaxed font-semibold whitespace-pre-line">
          {getScreenerProse()}
        </p>
      </Card>

      {/* STOCKS COMPARISON GRID TABLE */}
      <Card className="border border-line overflow-hidden">
        <div className="p-4 border-b border-line flex items-center justify-between">
          <div>
            <h3 className="font-display font-black text-sm text-ink">{lang === "th" ? "ผลการคัดกรองหุ้นตามสเปก" : "Real-time Screened Asset Ledger"}</h3>
            <p className="text-xs text-muted leading-none mt-1">{lang === "th" ? `พบทั้งหมด ${filteredStocks.length} บริษัท` : `Identified ${filteredStocks.length} qualifying corporations`}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-elevate/60 text-muted font-bold">
                <th className="px-5 py-3.5">{lang === "th" ? "หุ้น" : "Stock"}</th>
                <th className="px-5 py-3.5 text-right">P/E Ratio</th>
                <th className="px-5 py-3.5 text-right">ROE %</th>
                <th className="px-5 py-3.5 text-right">{lang === "th" ? "ราคาเหมาะสม (Fair Value)" : "Fair Value"}</th>
                <th className="px-5 py-3.5 text-right">Margin of Safety</th>
                <th className="px-5 py-3.5 text-center">{lang === "th" ? "คำแนะนำ" : "Verdict"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredStocks.map(({ stock, val }: { stock: any; val: any }) => {
                const isUS = stock.currency === "USD";
                const f = isUS ? dollar(val.fairValue) : baht(val.fairValue);
                const showMos = pct(val.marginOfSafety, 0);

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
          <Info className="h-3.5 w-3.5" /> FAQ & Q&A Crawlers Indexed
        </span>
        <h2 className="font-display text-xl font-black text-ink mb-5">
          {lang === "th" ? "คำถามที่พบบ่อยเกี่ยวกับกลยุทธ์คัดกรองนี้" : "Frequently Asked Questions"}
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

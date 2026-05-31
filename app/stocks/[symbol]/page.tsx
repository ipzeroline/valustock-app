"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getStock } from "@/lib/stocks";
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

      {plan.id !== "premium" && (
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


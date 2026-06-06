"use client";
import { Plan } from "@/lib/types";
import { num } from "@/lib/format";
import { Check, Crown, Zap, Shield } from "@/lib/icons";
import { Button } from "./ui/Button";
import { useTranslation } from "@/lib/translations";

const planIcon = {
  free: Shield,
  pro: Zap,
  premium: Crown,
  lifetime: Crown,
} as const;

export const PLAN_TRANS = {
  th: {
    free: {
      name: "ฟรี",
      tagline: "เริ่มต้นสำรวจมูลค่าหุ้น",
      badge: "เริ่มต้นฟรี",
      features: [
        "ดูข้อมูลหุ้นได้ 5 ตัว",
        "อัตราส่วนพื้นฐาน (P/E, P/B, ปันผล)",
        "กราฟเส้นราคาย้อนหลัง",
        "บันทึกรายการโปรดได้ 3 ตัว",
        "ทดลองดู Portfolio/Watchlist พื้นฐาน",
        "🧪 พอร์ตจำลอง ฿100,000",
        "📊 ValueSignal พื้นฐาน (MOS)",
      ]
    },
    pro: {
      name: "โปร",
      tagline: "เครื่องมือครบสำหรับนักลงทุนเน้นคุณค่า",
      badge: "ยอดนิยม",
      features: [
        "ดูหุ้นไทย/สหรัฐฯ + ETF/กองทุน",
        "เครื่องคำนวณ DCF แบบปรับค่าได้",
        "Graham Number & มูลค่าเหมาะสม",
        "สกรีนเนอร์คัดกรองหุ้นถูก",
        "กราฟแท่งเทียน + Volume + Fullscreen",
        "Technical Chart: MA, EMA, RSI, MACD, Bollinger",
        "Market Intelligence รายตัว",
        "Smart Symbol Lookup สำหรับสินทรัพย์ใหม่",
        "Drawing Tools และ Custom Range",
        "โหลดราคายอดนิยมเร็วขึ้นด้วยระบบราคาล่าสุด",
        "Market Pulse ตัวขึ้น/ลง/ผันผวนล่าสุด",
        "รายการโปรดไม่จำกัด",
        "Portfolio Tracker ไม่จำกัด",
        "Telegram Mini App แบบ Overview",
        "🧪 พอร์ตจำลอง ฿1,000,000",
        "📊 ValueSignal™ 5 ระดับ + Score",
      ]
    },
    premium: {
      name: "พรีเมียม",
      tagline: "สำหรับมืออาชีพและพอร์ตจริงจัง",
      badge: "ครบทุกฟีเจอร์",
      features: [
        "ทุกอย่างในแพ็กเกจโปร",
        "ข้อมูล Crypto & Futures",
        "เปรียบเทียบหุ้นหลายตัวพร้อมกัน",
        "Telegram Watchlist Digest ทุกตัว",
        "Telegram Portfolio Summary",
        "Telegram Compare Set Alerts",
        "Mini App ส่งสรุปกลับเข้า Telegram",
        "Mini Command Center ดู best/worst และ concentration",
        "ปฏิทินเศรษฐกิจ: Macro, Earnings, Dividends, IPO",
        "Market Movers และความสดใหม่ของราคา",
        "ระบบตรวจสอบความเสถียรของข้อมูล",
        "ส่งออกข้อมูลเป็น CSV",
        "Backtest และ Alert Center ในพอร์ต",
        "สมมติฐาน/Scenario การประเมินขั้นสูง",
        "สนับสนุนแบบเร่งด่วน",
        "🧪 พอร์ตจำลองไม่จำกัด + ValueSignal",
        "📊 ValueSignal API + Factor Breakdown",
      ]
    },
    lifetime: {
      name: "ตลอดชีพ",
      tagline: "จ่ายครั้งเดียว ใช้งานครบระยะยาว",
      badge: "จ่ายครั้งเดียว",
      features: [
        "ทุกอย่างใน Premium",
        "สิทธิ์ใช้งานตลอดชีพ",
        "รองรับ Bulk historical workflow สำหรับงานวิเคราะห์ย้อนหลัง",
        "ส่งออกข้อมูล CSV สำหรับ backtest",
        "Telegram Watchlist/Portfolio/Compare ครบ",
        "Telegram Mini App และ reply ในแชทส่วนตัว",
        "ปฏิทินเศรษฐกิจ Premium ครบทุกประเภท",
        "Market Intelligence และ workflow ระยะยาว",
        "บันทึกจุดราคาย้อนหลังสำหรับวิเคราะห์แนวโน้ม",
        "Priority warmup สำหรับหุ้นยอดนิยม",
        "เหมาะกับคนใช้ต่อเนื่องเกิน 10 เดือน",
        "🧪 พอร์ตจำลองไม่จำกัด + ValueSignal",
        "📊 ValueSignal API + Factor Breakdown",
      ]
    }
  },
  en: {
    free: {
      name: "Free",
      tagline: "Start exploring stock valuations",
      badge: "Start Free",
      features: [
        "Research up to 5 assets",
        "Basic ratios (P/E, P/B, yield)",
        "Historical line price charts",
        "Track up to 3 watchlist items",
        "Basic portfolio/watchlist preview",
        "🧪 Virtual Portfolio ฿100K",
        "📊 Basic ValueSignal (MOS)",
      ]
    },
    pro: {
      name: "Pro",
      tagline: "Advanced tools for value investors",
      badge: "Most Popular",
      features: [
        "Latest market data for Thai/US stocks and popular ETFs",
        "Interactive DCF modeling engine",
        "Graham Number & Fair Value calculations",
        "High Margin-of-Safety stock screener",
        "Candlesticks + volume + fullscreen",
        "Technical chart: MA, EMA, RSI, MACD, Bollinger",
        "Per-asset Market Intelligence",
        "Smart Symbol Lookup for new assets",
        "Drawing tools and custom range",
        "Faster popular quotes with latest-price infrastructure",
        "Market Pulse gainers/losers/active movers",
        "Unlimited synced watchlist tracking",
        "Unlimited Portfolio Tracker",
        "Telegram Mini App overview",
        "🧪 Virtual Portfolio ฿1M",
        "📊 ValueSignal™ 5-level + Score",
      ]
    },
    premium: {
      name: "Premium",
      tagline: "Built for active portfolio managers",
      badge: "Full Access",
      features: [
        "Everything in the Pro plan",
        "Crypto & Futures data access",
        "Side-by-side asset comparison tool",
        "Telegram Watchlist Digest for all symbols",
        "Telegram Portfolio Summary",
        "Telegram Compare Set Alerts",
        "Mini App actions back to Telegram chat",
        "Mini Command Center with best/worst and concentration",
        "Economic Calendar: macro, earnings, dividends, IPO",
        "Market Movers + quote freshness",
        "Data reliability diagnostics",
        "Prism direct exports (Excel & CSV)",
        "Portfolio backtest and Alert Center",
        "Advanced valuation scenario workflows",
        "Institutional priority support",
        "🧪 Unlimited Virtual Portfolio + ValueSignal",
        "📊 ValueSignal API + Factor Breakdown",
      ]
    },
    lifetime: {
      name: "Lifetime",
      tagline: "One-time payment for long-term access",
      badge: "One-time",
      features: [
        "Everything in Premium",
        "Lifetime access",
        "Bulk historical workflow for research",
        "CSV exports for backtesting",
        "Full Telegram Watchlist/Portfolio/Compare",
        "Premium Economic Calendar across all event types",
        "Market Intelligence and long-term workflows",
        "Stored price points for historical workflows",
        "Priority warmup for popular assets",
        "Telegram Mini App and chat replies",
        "Best if you use it beyond 10 months",
        "🧪 Unlimited Virtual Portfolio + ValueSignal",
        "📊 ValueSignal API + Factor Breakdown",
      ]
    }
  }
};

export function PlanCard({
  plan,
  billing,
  current,
  actionLabel,
  disabled,
  onSelect,
}: {
  plan: Plan;
  billing: "monthly" | "yearly";
  current?: boolean;
  actionLabel?: string;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  const { lang, t } = useTranslation();
  const Icon = planIcon[plan.id];
  const isLifetime = plan.id === "lifetime";
  const price = isLifetime ? plan.priceMonthly : billing === "monthly" ? plan.priceMonthly : plan.priceYearly;
  const per = isLifetime
    ? (lang === "th" ? "/ครั้งเดียว" : "/once")
    : billing === "monthly" 
    ? (lang === "th" ? "/เดือน" : "/mo") 
    : (lang === "th" ? "/ปี" : "/yr");
  const highlight = plan.highlight;

  const localPlan = PLAN_TRANS[lang || "th"][plan.id];

  return (
    <div
      className={`relative mx-auto flex w-full max-w-sm min-w-0 flex-col rounded-2xl border p-6 transition md:max-w-none ${
        highlight
          ? "border-brand bg-surface shadow-glow"
          : "border-line bg-surface"
      }`}
    >
      {localPlan.badge && (
        <span
          className={`absolute -top-3 left-6 chip ${
            highlight
              ? "border-brand/40 bg-brand text-bg font-semibold"
              : "border-gold/40 bg-gold/15 text-gold font-semibold"
          }`}
        >
          {localPlan.badge}
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${
            plan.id === "premium" || plan.id === "lifetime"
              ? "bg-gold/15 text-gold"
              : "bg-brand-soft text-brand"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="font-display text-lg font-bold">{localPlan.name}</div>
          <div className="text-xs text-muted [overflow-wrap:anywhere]">{localPlan.tagline}</div>
        </div>
      </div>

      <div className="mt-5 flex items-end gap-1">
        <span className="num font-display text-4xl font-extrabold">
          {price === 0 ? "0" : num(price, 0)}
        </span>
        <span className="mb-1.5 text-sm text-muted">
          {lang === "th" ? "บาท" : "THB"}{per}
        </span>
      </div>
      {billing === "yearly" && plan.priceMonthly > 0 && !isLifetime && (
        <div className="num mt-1 text-xs text-up font-medium">
          {lang === "th" 
            ? `ประหยัด ${num(plan.priceMonthly * 12 - plan.priceYearly, 0)} บาท/ปี` 
            : `Save ${num(plan.priceMonthly * 12 - plan.priceYearly, 0)} THB/yr`}
        </div>
      )}

      <ul className="mt-5 flex-1 space-y-2.5">
        {localPlan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span className="min-w-0 text-ink/90 [overflow-wrap:anywhere]">{f}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={highlight ? "primary" : plan.id === "premium" || plan.id === "lifetime" ? "gold" : "outline"}
        className="mt-6 w-full"
        onClick={onSelect}
        disabled={current || disabled}
      >
        {actionLabel
          ? actionLabel
          : current
          ? t("pricing.currentPlanBadge")
          : plan.id === "free"
          ? t("common.startFree")
          : `${lang === "th" ? "เลือก" : "Select"} ${localPlan.name}`}
      </Button>
    </div>
  );
}

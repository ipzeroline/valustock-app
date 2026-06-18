"use client";

import VirtualPortfolio from "@/components/VirtualPortfolio";
import { useTranslation } from "@/lib/translations";
import { Sparkles, Target, Info } from "@/lib/icons";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function VirtualPortfolioPage() {
  const { t, lang } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-[calc(100vw-24px)] space-y-5 overflow-x-hidden pb-24 pt-1 animate-fade-up sm:max-w-full sm:space-y-6 lg:max-w-7xl lg:pb-2">
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Target className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 font-display text-xl font-bold leading-tight text-ink sm:text-2xl md:text-3xl">
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {lang === "th" ? "พอร์ตจำลอง" : "Virtual Portfolio"}
              </span>
              <span className="text-[9px] bg-up/15 border border-up/30 text-up px-2 py-0.5 rounded-full font-sans uppercase font-bold">
                {lang === "th" ? "ฟรีทุกแพ็กเกจ" : "Free for all"}
              </span>
            </h1>
            <p className="mt-1 max-w-full whitespace-normal text-xs leading-relaxed text-muted [overflow-wrap:anywhere] sm:max-w-2xl">
              {lang === "th"
                ? "ฝึกเทรดหุ้นด้วยเงินเสมือน ใช้ราคาสดจากตลาดจริง พร้อมสัญญาณ ValueSignal™ — ไม่ต้องใช้เงินจริง ไม่มีความเสี่ยง"
                : "Practice trading with virtual money using live market prices and ValueSignal™ — no real money, zero risk."}
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
          <Info className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-sm font-bold text-ink">
            {lang === "th" ? "🧪 นี่คือพอร์ตจำลอง — ไม่ใช้เงินจริง" : "🧪 Paper Trading — No Real Money"}
          </h3>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            {lang === "th"
              ? "ข้อมูลพอร์ตจำลองถูกเก็บใน Browser ของคุณเท่านั้น (localStorage) ไม่มีการซื้อขายจริงเกิดขึ้น ราคาหุ้นดึงจากตลาดจริงโดยตรงเพื่อให้สมจริงที่สุด"
              : "Virtual portfolio data is stored only in your browser (localStorage). No real trades are executed. Stock prices are live from the market for realistic simulation."}
          </p>
        </div>
      </div>

      {/* Virtual Portfolio */}
      <VirtualPortfolio />

      {/* Footer CTA */}
      <div className="rounded-2xl border border-line bg-surface/30 p-5 text-center">
        <p className="text-sm font-semibold text-muted">
          {lang === "th"
            ? "พร้อมใช้เงินจริงหรือยัง? อัปเกรดเป็น Pro เพื่อบันทึกพอร์ตจริง ติดตามต้นทุน และรับสัญญาณ ValueSignal เต็มรูปแบบ"
            : "Ready for real trading? Upgrade to Pro for real portfolio tracking, cost basis, and full ValueSignal™."}
        </p>
        <Link href="/pricing">
          <Button variant="gold" size="sm" className="mt-3">
            {lang === "th" ? "ดูแพ็กเกจ" : "View Plans"}
          </Button>
        </Link>
      </div>
    </div>
  );
}

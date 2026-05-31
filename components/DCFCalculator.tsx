"use client";
import { useState } from "react";
import { Stock, DCFParams } from "@/lib/types";
import { computeDCF, defaultDCFParams, netDebt } from "@/lib/valuation";
import { baht, num, pct, dollar } from "@/lib/format";
import { Card, CardHeader } from "./ui/Card";
import { Calculator } from "@/lib/icons";
import { useTranslation } from "@/lib/translations";

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  fmt,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  fmt: (v: number) => string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="num text-sm font-semibold text-brand">{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-brand"
      />
    </div>
  );
}

export function DCFCalculator({ stock }: { stock: Stock }) {
  const { t, lang } = useTranslation();
  const [params, setParams] = useState<DCFParams>(defaultDCFParams(stock));
  const res = computeDCF(stock, params);
  const up = res.upside >= 0;

  const set = (patch: Partial<DCFParams>) =>
    setParams((p) => ({ ...p, ...patch }));

  const isUS = stock.assetType === "US_STOCK";
  const formatPrice = (p: number) => {
    if (isUS) return dollar(p);
    return baht(p);
  };

  const formatMoney = (v: number) => {
    if (isUS) {
      if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(2)}B`;
      return `$${num(v, 0)}M`;
    } else {
      if (lang === "en") {
        if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(2)}B THB`;
        return `${num(v, 0)}M THB`;
      } else {
        if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(2)} ล้านล้านบาท`;
        if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(2)} พันล้านบาท`;
        return `${num(v, 0)} ล้านบาท`;
      }
    }
  };

  return (
    <Card>
      <CardHeader
        title={t("stockDetail.calculator.title")}
        subtitle={lang === "th" ? "ปรับสมมติฐานเพื่อหามูลค่าที่แท้จริง" : "Adjust assumptions to derive intrinsic stock value"}
        icon={<Calculator className="h-4 w-4" />}
      />
      <div className="grid gap-6 p-5 md:grid-cols-2">
        <div className="space-y-5">
          <Slider
            label={t("stockDetail.calculator.fcfGrowth")}
            value={params.growthRate}
            min={-0.05}
            max={0.3}
            step={0.005}
            onChange={(v) => set({ growthRate: v })}
            fmt={(v) => pct(v * 100)}
          />
          <Slider
            label={t("stockDetail.calculator.discountRate")}
            value={params.discountRate}
            min={0.05}
            max={0.18}
            step={0.005}
            onChange={(v) => set({ discountRate: v })}
            fmt={(v) => num(v * 100, 1) + "%"}
          />
          <Slider
            label={t("stockDetail.calculator.terminalGrowth")}
            value={params.terminalGrowth}
            min={0}
            max={0.05}
            step={0.0025}
            onChange={(v) => set({ terminalGrowth: v })}
            fmt={(v) => num(v * 100, 2) + "%"}
          />
          <Slider
            label={t("stockDetail.calculator.projectionYears")}
            value={params.years}
            min={3}
            max={10}
            step={1}
            onChange={(v) => set({ years: v })}
            fmt={(v) => lang === "th" ? `${num(v, 0)} ปี` : `${num(v, 0)} Years`}
          />
          <button
            onClick={() => setParams(defaultDCFParams(stock))}
            className="text-xs text-muted underline-offset-2 hover:underline"
          >
            {lang === "th" ? "รีเซ็ตค่าเริ่มต้น" : "Reset Defaults"}
          </button>
        </div>

        <div className="flex flex-col justify-center rounded-2xl border border-line bg-elevate p-5 text-center">
          <span className="text-xs text-muted">{t("stockDetail.calculator.intrinsicValue")}</span>
          <span className="num mt-1 font-display text-3xl font-extrabold">
            {formatPrice(res.intrinsicValue)}
          </span>
          <div
            className={`num mt-2 inline-flex items-center justify-center gap-1 text-sm font-semibold ${
              up ? "text-up" : "text-down"
            }`}
          >
            {up ? "▲" : "▼"} {pct(res.upside)} {lang === "th" ? "เทียบราคาตลาด" : "vs Market"} {formatPrice(stock.price)}
          </div>
          <div className="mt-4 space-y-1.5 border-t border-line pt-4 text-left text-xs text-muted">
            <Row k={lang === "th" ? "มูลค่ากิจการ (EV)" : "Enterprise Value (EV)"} v={formatMoney(res.enterpriseValue)} />
            <Row k={lang === "th" ? "มูลค่าส่วนผู้ถือหุ้น" : "Equity Value"} v={formatMoney(res.equityValue)} />
            <Row k={t("stockDetail.calculator.netDebt")} v={formatMoney(netDebt(stock))} />
            <Row k={lang === "th" ? "Terminal Value (PV)" : "PV of Terminal Value"} v={formatMoney(res.pvTerminal)} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{k}</span>
      <span className="num text-ink">{v}</span>
    </div>
  );
}

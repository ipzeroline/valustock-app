"use client";

import React from "react";
import type { ValueSignalResult, Signal } from "@/lib/value-signal";
import { getSignalLabel, getSignalEmoji } from "@/lib/value-signal";
import { useTranslation } from "@/lib/translations";
import { Gauge } from "@/lib/icons";

const sizeClasses = {
  sm: "text-[10px] px-2 py-0.5 gap-1",
  md: "text-xs px-3 py-1 gap-1.5",
  lg: "text-sm px-4 py-2 gap-2",
};

const scoreColor = (score: number) => {
  if (score >= 80) return "text-up";
  if (score >= 60) return "text-up/80";
  if (score >= 40) return "text-gold";
  if (score >= 20) return "text-down/80";
  return "text-down";
};

export function ValueSignalBadge({
  signal,
  size = "md",
  showScore = true,
  showEmoji = true,
  className = "",
}: {
  signal: ValueSignalResult;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  showEmoji?: boolean;
  className?: string;
}) {
  const { lang } = useTranslation();
  const label = getSignalLabel(signal.signal, lang);

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border transition-all ${signal.color} ${sizeClasses[size]} ${className}`}
      title={`${label} · Score ${signal.score}/100 · Fair Value ${signal.fairValue.toFixed(2)}`}
    >
      {showEmoji && <span className="shrink-0">{getSignalEmoji(signal.signal)}</span>}
      <span>{label}</span>
      {showScore && (
        <span className={`flex items-center gap-0.5 font-mono font-black ${scoreColor(signal.score)}`}>
          <Gauge className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
          {signal.score}
        </span>
      )}
    </span>
  );
}

export function ValueSignalCard({
  signal,
  className = "",
}: {
  signal: ValueSignalResult;
  className?: string;
}) {
  const { lang } = useTranslation();
  const label = getSignalLabel(signal.signal, lang);

  return (
    <div className={`rounded-2xl border p-4 ${signal.color.replace("text-", "bg-").replace(/\/\d+/, "/8")} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getSignalEmoji(signal.signal)}</span>
          <div>
            <span className="font-display text-base font-black">{label}</span>
            <span className="ml-2 text-xs font-mono text-muted">
              Score {signal.score}/100
            </span>
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-3 h-2 w-full rounded-full bg-white/20 dark:bg-black/20">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${scoreColor(signal.score).replace("text-", "bg-")}`}
          style={{ width: `${signal.score}%` }}
        />
      </div>

      {/* Factor grid */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
        <FactorChip label="MOS" value={signal.factors.mos} unit="%" lang={lang} />
        <FactorChip label="P/E" value={signal.factors.pe} lang={lang} />
        <FactorChip label="ROE" value={signal.factors.roe} unit="%" lang={lang} />
        <FactorChip label={lang === "th" ? "ปันผล" : "Yield"} value={signal.factors.yield} unit="%" lang={lang} />
        <FactorChip label="PEG" value={signal.factors.peg} lang={lang} />
        <FactorChip label={lang === "th" ? "มูลค่าเหมาะสม" : "Fair Value"} value={signal.fairValue} isPrice lang={lang} />
      </div>
    </div>
  );
}

function FactorChip({
  label,
  value,
  unit,
  isPrice,
  lang,
}: {
  label: string;
  value: number;
  unit?: string;
  isPrice?: boolean;
  lang: "th" | "en";
}) {
  const formatted = isPrice
    ? Number.isFinite(value) && value > 0
      ? new Intl.NumberFormat(lang === "th" ? "th-TH" : "en-US", {
          style: "currency",
          currency: lang === "th" ? "THB" : "USD",
          maximumFractionDigits: 0,
        }).format(value)
      : "—"
    : Number.isFinite(value)
    ? `${value.toFixed(1)}${unit || ""}`
    : "—";

  return (
    <div className="rounded-lg bg-white/15 dark:bg-black/15 px-1.5 py-1">
      <span className="block text-[9px] font-bold uppercase opacity-60">{label}</span>
      <span className="block text-[11px] font-mono font-bold">{formatted}</span>
    </div>
  );
}

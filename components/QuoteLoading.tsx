"use client";

import { RefreshCw } from "@/lib/icons";

export function QuoteLoading({
  label,
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold text-muted ${className}`}>
      <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand" />
      <span>{label || "Loading quote"}</span>
    </span>
  );
}

export function QuoteLoadingCard({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface/35 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
          <RefreshCw className="h-4.5 w-4.5 animate-spin" />
        </span>
        <div className="min-w-0">
          <div className="text-xs font-black text-ink">
            {title || "Loading live quotes"}
          </div>
          <div className="mt-0.5 text-[10px] font-semibold text-muted">
            {subtitle || "Fetching latest market prices..."}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2.5 w-3/4 animate-pulse rounded-full bg-elevate" />
        <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-elevate" />
      </div>
    </div>
  );
}

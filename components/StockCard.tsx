"use client";
import Link from "next/link";
import { Stock } from "@/lib/types";
import { computeValuation, defaultDCFParams } from "@/lib/valuation";
import { baht, pct, num, dollar, nav } from "@/lib/format";
import { Sparkline } from "./Charts";
import { Badge } from "./ui/Card";
import { Star, TrendingUp, TrendingDown } from "@/lib/icons";
import { useStore } from "@/lib/store";
import { AssetLogo } from "./AssetLogo";
import { useTranslation, SECTOR_TRANS } from "@/lib/translations";

const verdictTone = {
  undervalued: "up",
  fair: "muted",
  overvalued: "down",
} as const;

export function StockCard({ stock }: { stock: Stock }) {
  const { isWatched, toggleWatch } = useStore();
  const { t, lang } = useTranslation();
  
  const val = computeValuation(stock, defaultDCFParams(stock));
  const change = stock.prevClose > 0 ? ((stock.price - stock.prevClose) / stock.prevClose) * 100 : 0;
  const up = change >= 0;
  const watched = isWatched(stock.symbol);

  const displayName = lang === "th" ? stock.name : (stock.enName || stock.name);
  const localizedSector = lang === "th" ? stock.sector : (SECTOR_TRANS[stock.sector as string] || stock.sector);

  return (
    <Link
      href={`/stocks/${stock.symbol}`}
      className="surface group block rounded-2xl p-4 transition hover:border-brand/50 hover:shadow-glow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <AssetLogo symbol={stock.symbol} color={stock.color} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold">{stock.symbol}</span>
              <span className="text-xs text-muted">{stock.market}</span>
            </div>
            <div className="max-w-[140px] truncate text-xs text-muted">
              {displayName}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWatch(stock.symbol);
          }}
          className={`grid h-8 w-8 place-items-center rounded-lg transition ${
            watched ? "text-gold" : "text-muted hover:text-ink"
          }`}
          aria-label={lang === "th" ? "เพิ่มรายการโปรด" : "Add to Watchlist"}
        >
          <Star className="h-4 w-4" fill={watched ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="my-3 h-10">
        <Sparkline data={stock.priceHistory} up={up} />
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="num text-lg font-semibold">
            {stock.assetType === "US_STOCK" || stock.currency === "USD"
              ? dollar(stock.price)
              : stock.assetType === "FUND"
              ? nav(stock.price)
              : baht(stock.price)}
          </div>
          <div
            className={`num flex items-center gap-1 text-xs ${
              up ? "text-up" : "text-down"
            }`}
          >
            {up ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {pct(change)}
          </div>
        </div>
        <div className="text-right">
          {stock.assetType === "FUND" ? (
            <>
              <Badge tone="brand">
                {localizedSector}
              </Badge>
              <div className="num mt-1 text-xs text-muted">
                {lang === "th" ? `เสี่ยงระดับ ${stock.riskLevel || 6}` : `Risk Level ${stock.riskLevel || 6}`}
              </div>
            </>
          ) : (
            <>
              <Badge tone={verdictTone[val.verdict]}>
                {t(`verdict.${val.verdict}`)}
              </Badge>
              <div className="num mt-1 text-xs text-muted">
                MOS {num(val.marginOfSafety, 0)}%
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

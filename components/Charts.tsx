"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { DCFResult, OhlcPoint, YearPoint } from "@/lib/types";
import { num } from "@/lib/format";
import { useTranslation } from "@/lib/translations";

const BRAND = "rgb(52 211 153)";
const DOWN = "rgb(248 113 113)";
const GOLD = "rgb(232 188 96)";
const MUTED = "rgb(138 150 170)";

export function CandlestickChart({ data }: { data: OhlcPoint[] }) {
  if (!data.length) {
    return (
      <div className="grid h-[320px] place-items-center text-xs font-semibold text-muted">
        No price data
      </div>
    );
  }

  const width = 900;
  const height = 320;
  const chartTop = 18;
  const priceHeight = 210;
  const volumeTop = 246;
  const volumeHeight = 50;
  const padX = 38;
  const lows = data.map((item) => item.low);
  const highs = data.map((item) => item.high);
  const minPrice = Math.min(...lows);
  const maxPrice = Math.max(...highs);
  const priceRange = Math.max(maxPrice - minPrice, 1);
  const maxVolume = Math.max(...data.map((item) => item.volume || 0), 1);
  const step = data.length > 1 ? (width - padX * 2) / (data.length - 1) : width - padX * 2;
  const candleWidth = Math.max(3, Math.min(12, step * 0.58));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => maxPrice - priceRange * ratio);

  const x = (index: number) => padX + index * step;
  const priceY = (price: number) => chartTop + ((maxPrice - price) / priceRange) * priceHeight;
  const volumeY = (volume: number) => volumeTop + volumeHeight - (volume / maxVolume) * volumeHeight;

  const dateLabel = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-line bg-bg">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[320px] w-full" role="img" aria-label="Candlestick price chart">
        {ticks.map((tick) => {
          const y = priceY(tick);
          return (
            <g key={tick}>
              <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="rgb(38 48 66)" strokeDasharray="4 6" />
              <text x={width - padX + 8} y={y + 4} fill={MUTED} fontSize="11">
                {num(tick, 2)}
              </text>
            </g>
          );
        })}

        {data.map((item, index) => {
          const isUp = item.close >= item.open;
          const color = isUp ? BRAND : DOWN;
          const center = x(index);
          const openY = priceY(item.open);
          const closeY = priceY(item.close);
          const highY = priceY(item.high);
          const lowY = priceY(item.low);
          const bodyY = Math.min(openY, closeY);
          const bodyHeight = Math.max(2, Math.abs(closeY - openY));
          const volY = volumeY(item.volume || 0);
          const showLabel = data.length <= 18 || index === 0 || index === data.length - 1 || index % Math.ceil(data.length / 4) === 0;

          return (
            <g key={`${item.date}-${index}`}>
              <line x1={center} x2={center} y1={highY} y2={lowY} stroke={color} strokeWidth="1.5" />
              <rect
                x={center - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                rx="1.5"
                fill={color}
              >
                <title>
                  {`${item.date} O ${num(item.open, 2)} H ${num(item.high, 2)} L ${num(item.low, 2)} C ${num(item.close, 2)} Vol ${num(item.volume, 0)}`}
                </title>
              </rect>
              <rect
                x={center - candleWidth / 2}
                y={volY}
                width={candleWidth}
                height={volumeTop + volumeHeight - volY}
                rx="1"
                fill={color}
                opacity="0.35"
              />
              {showLabel && (
                <text x={center} y={height - 8} fill={MUTED} fontSize="10" textAnchor="middle">
                  {dateLabel(item.date)}
                </text>
              )}
            </g>
          );
        })}

        <line x1={padX} x2={width - padX} y1={volumeTop - 10} y2={volumeTop - 10} stroke="rgb(38 48 66)" />
        <text x={padX} y={volumeTop - 16} fill={MUTED} fontSize="11">
          Volume
        </text>
      </svg>
    </div>
  );
}

export function Sparkline({
  data,
  up = true,
}: {
  data: number[];
  up?: boolean;
}) {
  const chart = data.map((v, i) => ({ i, v }));
  const color = up ? BRAND : DOWN;
  const id = `spark-${up ? "u" : "d"}`;
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={chart} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.8}
          fill={`url(#${id})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PriceAreaChart({ data }: { data: number[] }) {
  const { t } = useTranslation();
  const chart = data.map((v, i) => ({ i, v }));
  const up = data.length > 0 && data[data.length - 1] >= data[0];
  const color = up ? BRAND : DOWN;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chart} margin={{ top: 10, right: 6, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="price" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="i" hide />
        <YAxis
          domain={["dataMin", "dataMax"]}
          tick={{ fontSize: 11, fill: "rgb(138 150 170)" }}
          tickFormatter={(v) => num(v, 0)}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: "rgb(20 28 42)",
            border: "1px solid rgb(38 48 66)",
            borderRadius: 12,
            color: "#fff",
            fontSize: 12,
          }}
          labelFormatter={() => ""}
          formatter={(v: number) => [num(v, 2), t("common.price")]}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill="url(#price)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HistoryBars({
  data,
  label,
}: {
  data: YearPoint[];
  label: string;
}) {
  const { lang } = useTranslation();
  const unit = lang === "th" ? " ลบ." : "M";
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 6, bottom: 0, left: -8 }}>
        <XAxis
          dataKey="year"
          tick={{ fontSize: 11, fill: "rgb(138 150 170)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "rgb(138 150 170)" }}
          tickFormatter={(v) => num(v / 1000, 0) + "k"}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          cursor={{ fill: "rgb(38 48 66 / 0.4)" }}
          contentStyle={{
            background: "rgb(20 28 42)",
            border: "1px solid rgb(38 48 66)",
            borderRadius: 12,
            color: "#fff",
            fontSize: 12,
          }}
          formatter={(v: number) => [`${num(v, 0)}${unit}`, label]}
        />
        <Bar dataKey="value" radius={[5, 5, 0, 0]} fill={BRAND} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DCFProjectionBars({
  data,
  fcfLabel,
  pvLabel,
  unit,
}: {
  data: DCFResult["projections"];
  fcfLabel: string;
  pvLabel: string;
  unit: string;
}) {
  const chart = data.map((item) => ({
    year: item.year,
    fcf: item.fcf,
    pv: item.pv,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chart} margin={{ top: 10, right: 8, bottom: 0, left: -8 }}>
        <XAxis
          dataKey="year"
          tick={{ fontSize: 11, fill: "rgb(138 150 170)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "rgb(138 150 170)" }}
          tickFormatter={(v) => num(v / 1000, 0) + "k"}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip
          cursor={{ fill: "rgb(38 48 66 / 0.4)" }}
          contentStyle={{
            background: "rgb(20 28 42)",
            border: "1px solid rgb(38 48 66)",
            borderRadius: 12,
            color: "#fff",
            fontSize: 12,
          }}
          formatter={(v: number, name: string) => [
            `${num(v, 0)} ${unit}`,
            name === "fcf" ? fcfLabel : pvLabel,
          ]}
        />
        <Bar dataKey="fcf" radius={[5, 5, 0, 0]} fill={BRAND} isAnimationActive={false} />
        <Bar dataKey="pv" radius={[5, 5, 0, 0]} fill={GOLD} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** แท่งเปรียบเทียบ ราคาปัจจุบัน vs มูลค่าเหมาะสม */
export function ValueVsPrice({
  price,
  fair,
}: {
  price: number;
  fair: number;
}) {
  const { t } = useTranslation();
  const data = [
    { name: t("landing.marketPrice"), v: price, key: "price" },
    { name: t("landing.fairValue"), v: fair, key: "fair" },
  ];
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: -10 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "rgb(138 150 170)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide domain={[0, Math.max(price, fair) * 1.15]} />
        <Tooltip
          cursor={{ fill: "rgb(38 48 66 / 0.4)" }}
          contentStyle={{
            background: "rgb(20 28 42)",
            border: "1px solid rgb(38 48 66)",
            borderRadius: 12,
            color: "#fff",
            fontSize: 12,
          }}
          formatter={(v: number) => [num(v, 2), ""]}
        />
        <ReferenceLine y={price} stroke="rgb(138 150 170)" strokeDasharray="4 4" />
        <Bar dataKey="v" radius={[6, 6, 0, 0]} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.key} fill={d.key === "fair" ? GOLD : BRAND} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

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
import { YearPoint } from "@/lib/types";
import { num } from "@/lib/format";
import { useTranslation } from "@/lib/translations";

const BRAND = "rgb(52 211 153)";
const DOWN = "rgb(248 113 113)";
const GOLD = "rgb(232 188 96)";

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

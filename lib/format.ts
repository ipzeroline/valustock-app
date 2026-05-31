export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

const thb = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const thb0 = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

/** ราคา/บาทต่อหุ้น */
export function baht(n: number): string {
  return thb.format(n);
}

export function baht0(n: number): string {
  return thb0.format(n);
}

/** ตัวเลขล้านบาท -> ย่อ เช่น 1,234,567 ลบ. => 1.23 ลลบ. */
export function moneyMB(millionBaht: number): string {
  const v = millionBaht;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)} ล้านลบ.`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(2)} พันลบ.`;
  return `${num(v, 0)} ลบ.`;
}

export function num(n: number, digits = 2): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function pct(n: number, digits = 1): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${num(n, digits)}%`;
}

export function pctRaw(n: number, digits = 1): string {
  return `${num(n, digits)}%`;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function dollar(n: number): string {
  return usd.format(n);
}

export function nav(n: number): string {
  return `${new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(n)} บาท`;
}

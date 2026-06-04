type FxRateResult = {
  pair: string;
  rate: number;
  date: string;
  source: string;
  isFallback: boolean;
};

const FALLBACK_USD_THB = 36.5;
const fxMemory = new Map<string, { value: FxRateResult; expiresAt: number }>();

function finiteNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function previousDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return isoDate(date);
}

function fallbackRate(date: string): FxRateResult {
  return {
    pair: "USDTHB",
    rate: FALLBACK_USD_THB,
    date,
    source: "fallback-usdthb",
    isFallback: true,
  };
}

async function fetchEodhdUsdThb(date: string): Promise<FxRateResult | null> {
  const apiKey = process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN;
  if (!apiKey) return null;

  const today = isoDate(new Date());
  if (date >= today) {
    const res = await fetch(
      `https://eodhd.com/api/real-time/USDTHB.FOREX?api_token=${encodeURIComponent(apiKey)}&fmt=json`,
      { next: { revalidate: 900 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rate = finiteNumber(data.close) || finiteNumber(data.last) || finiteNumber(data.price) || finiteNumber(data.previousClose);
    if (!rate) return null;
    return {
      pair: "USDTHB",
      rate,
      date: typeof data.timestamp === "number" ? isoDate(new Date(data.timestamp * 1000)) : today,
      source: "eodhd-realtime-USDTHB.FOREX",
      isFallback: false,
    };
  }

  const from = previousDate(date, 7);
  const res = await fetch(
    `https://eodhd.com/api/eod/USDTHB.FOREX?from=${from}&to=${date}&period=d&api_token=${encodeURIComponent(apiKey)}&fmt=json`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;

  const rows = await res.json();
  if (!Array.isArray(rows)) return null;
  const latest = [...rows]
    .filter((row) => String(row?.date || "") <= date)
    .sort((a, b) => String(a?.date || "").localeCompare(String(b?.date || "")))
    .at(-1);
  const rate = finiteNumber(latest?.close) || finiteNumber(latest?.adjusted_close);
  if (!latest?.date || !rate) return null;

  return {
    pair: "USDTHB",
    rate,
    date: String(latest.date),
    source: "eodhd-eod-USDTHB.FOREX",
    isFallback: false,
  };
}

export async function getUsdThbRate(date = isoDate(new Date())): Promise<FxRateResult> {
  const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : isoDate(new Date());
  const cacheKey = `USDTHB:${normalizedDate}`;
  const cached = fxMemory.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const rate = (await fetchEodhdUsdThb(normalizedDate).catch(() => null)) || fallbackRate(normalizedDate);
  fxMemory.set(cacheKey, {
    value: rate,
    expiresAt: Date.now() + (rate.isFallback ? 5 * 60_000 : 60 * 60_000),
  });
  return rate;
}

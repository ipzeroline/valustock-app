const SOURCE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/eodhd/gi, "market-data-network"],
  [/massive/gi, "market-data-network"],
  [/mongodb/gi, "data-cache"],
  [/mongo/gi, "data-cache"],
  [/set-online-data/gi, "licensed-market-feed"],
];

export function maskPublicMarketSource(value: string) {
  return SOURCE_REPLACEMENTS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

export function sanitizePublicMarketPayload<T>(payload: T): T {
  if (typeof payload === "string") return maskPublicMarketSource(payload) as T;
  if (!payload || typeof payload !== "object") return payload;
  if (Array.isArray(payload)) return payload.map((item) => sanitizePublicMarketPayload(item)) as T;

  const output: Record<string, unknown> = {};
  Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
    if (key === "providerPolicy") return;
    output[key] = sanitizePublicMarketPayload(value);
  });
  return output as T;
}

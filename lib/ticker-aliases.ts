const TICKER_ALIASES: Record<string, string> = {
  RKBL: "RKLB",
};

export function normalizeTickerSymbol(symbol: string) {
  const normalized = symbol.toUpperCase().trim();
  return TICKER_ALIASES[normalized] || normalized;
}

export function tickerAliasNote(symbol: string) {
  const normalized = symbol.toUpperCase().trim();
  const canonical = normalizeTickerSymbol(normalized);
  return canonical === normalized ? null : { requestedSymbol: normalized, canonicalSymbol: canonical };
}

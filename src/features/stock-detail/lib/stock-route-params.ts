const SAFE_TOKEN_PATTERN = /^[A-Z0-9&.\-_]{1,20}$/;

export type StockRouteParams = {
  exchange: string;
  symbol: string;
};

export function normalizeStockRouteParams(
  rawExchange: string,
  rawSymbol: string,
): StockRouteParams | null {
  const exchange = rawExchange.trim().toUpperCase();
  const symbol = rawSymbol.trim().toUpperCase();

  if (!SAFE_TOKEN_PATTERN.test(exchange) || !SAFE_TOKEN_PATTERN.test(symbol)) {
    return null;
  }

  return { exchange, symbol };
}

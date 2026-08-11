export type MarketExchangeCode = string;

export const DEFAULT_MARKET_EXCHANGE: MarketExchangeCode = "US";
// BSE_IDX stays hidden here — it's a virtual index-only exchange, never
// meant to be picked in the general stock browser/selector (same as
// NSE_IDX, which the backend never even exposes via /exchanges).
export const HIDDEN_MARKET_EXCHANGES = ["BSE_IDX"] as const;

export function isEnabledMarketExchange(exchange: string) {
  return !HIDDEN_MARKET_EXCHANGES.includes(
    exchange as (typeof HIDDEN_MARKET_EXCHANGES)[number]
  );
}

export type MarketExchangeCode = string;

export const DEFAULT_MARKET_EXCHANGE: MarketExchangeCode = "US";

export const HIDDEN_MARKET_EXCHANGES = ["BSE_IDX"] as const;

export function isEnabledMarketExchange(exchange: string) {
  return !HIDDEN_MARKET_EXCHANGES.includes(
    exchange as (typeof HIDDEN_MARKET_EXCHANGES)[number]
  );
}

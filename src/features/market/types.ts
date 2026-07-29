export type MarketExchangeInfo = {
  code: string;
  name: string;
  currency: string;
  country: string;
};

export type MarketExchangesResponse = {
  exchanges: MarketExchangeInfo[];
};

export type ExchangeRatesResponse = {
  rates: Record<string, number>;
  base: "USD";
};

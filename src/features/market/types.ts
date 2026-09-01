export type MarketExchangeInfo = {
  code: string;
  name: string;
  currency: string;
  country: string;
};

export type MarketExchangesResponse = {
  exchanges: MarketExchangeInfo[];
};

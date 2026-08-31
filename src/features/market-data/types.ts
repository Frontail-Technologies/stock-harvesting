import type { Candle, Stock } from "@/types/market";

export type StockListItem = {
  symbol: string;
  name: string;
  exchange: Stock["exchange"];
  close?: number;
  changePct?: number;
  volume?: number;
  open?: number;
};

export type StockListResponse = {
  stocks: StockListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ChartEligibleStockSearchResponse = {
  stocks: StockListItem[];
};

export type CandleListResponse = {
  candles: Candle[];
};

export type HistoryRangeInput = {
  symbol: string;
  timeframe: string;
  exchange?: string;
};

export type HistoryRangeResponse = {
  symbol: string;
  exchange: string;
  timeframe: string;
  from: string | null;
  to: string | null;
};

export type StockMoveFilter = "all" | "gainers" | "decliners" | "unchanged";

export type StockListInput = {
  q?: string;
  page?: number;
  limit?: number;
  sortBy?: "symbol" | "name" | "close" | "changePct" | "volume";
  sortDirection?: "asc" | "desc";
  exchange?: string;
  moveFilter?: StockMoveFilter;
  minVolume?: number;
  includeUnpriced?: boolean;
};

export type CandleListInput = {
  symbol: string;
  timeframe: string;
  from?: string;
  to?: string;
  exchange?: string;
};

export type IndexRelativeStrengthMetric = {
  symbol: string;
  name: string;
  exchange: string;
  close: number;
  volume: number;
  change55dPct: number;
};

export type IndexRelativeStrengthResponse = {
  metrics: IndexRelativeStrengthMetric[];
  asOfDate: string;
};

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
  // The latest ACTUAL underlying 1D trading-day candle date, never a
  // weekly/monthly aggregated bucket's own display timestamp (which may be
  // a future-within-its-own-week Friday label that hasn't completed yet).
  // Null only when there is no daily data at all to derive it from.
  dataThrough: string | null;
  nextBefore?: string | null;
  hasMore?: boolean;
};

// Today's still-forming, provider-delayed session - chart display only,
// never a completed/canonical candle. Never fed into Scanner/Weekly
// Strong/any analytical read.
export type CurrentDayDelayedCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  lastUpdatedAt: string;
  provisional: true;
};

export type CurrentDayCandleResponse = {
  candle: CurrentDayDelayedCandle | null;
  capability: {
    realtime: "available" | "unavailable" | "unknown";
    currentDayCandle: "available" | "unavailable" | "unknown";
    completedDailyHistory: "available" | "unavailable" | "unknown";
    reason: string | null;
    lastCheckedAt: string | null;
    retryAfter: string | null;
  } | null;
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
  before?: string;
  limit?: number;
  exchange?: string;
};

export type EnsureFreshCandlesInput = {
  symbol: string;
  exchange?: string;
};

export type EnsureFreshCandlesStatus =
  | "updated"
  | "repaired"
  | "already-current"
  | "in-progress"
  | "bootstrap-required"
  | "provider-empty"
  | "failed";

export type EnsureFreshCandlesResponse = {
  status: EnsureFreshCandlesStatus;
  changed: boolean;
  latestExpectedDate: string;
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

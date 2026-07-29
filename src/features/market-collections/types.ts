export type MarketCollection = {
  id: string;
  code: string;
  name: string;
  exchange: string;
  memberCount: number;
};

export type CollectionMemberQuote = {
  lastPrice: number;
  change: number;
  changePercent: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  lastUpdatedAt?: string;
};

export type CollectionMember = {
  instrumentId: string;
  instrumentToken: string;
  exchange: string;
  tradingSymbol: string;
  name: string;
  quote?: CollectionMemberQuote;
};

export type CollectionMembersResponse = {
  collection: { code: string; name: string; memberCount: number };
  items: CollectionMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CollectionMembersInput = {
  code: string;
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: "symbol" | "name";
  sortDirection?: "asc" | "desc";
};

export type CollectionRelativeStrengthMetric = {
  symbol: string;
  name: string;
  exchange: string;
  close: number;
  volume: number;
  change55dPct: number;
  monthlyPct: number;
  weeklyMacdPct: number;
  weeklyMacdHistogramPct: number;
  combinedScore: number;
};

export type CollectionRelativeStrengthResponse = {
  collection: { code: string; name: string };
  metrics: CollectionRelativeStrengthMetric[];
};

export type CollectionWeeklyStrongStock = {
  symbol: string;
  name: string;
  exchange: string;
  close: number;
  changePct: number;
  volume: number;
};

export type CollectionWeeklyStrongStocksResponse = {
  collection: { code: string; name: string };
  items: CollectionWeeklyStrongStock[];
};

export type CollectionWeeklyStrongBacktestPoint = {
  date: string;
  passCount: number;
};

export type CollectionWeeklyStrongBacktestResponse = {
  collection: { code: string; name: string };
  points: CollectionWeeklyStrongBacktestPoint[];
};

export type CollectionImportRow = { symbol: string; instrumentId: string; status?: string };

export type CollectionImportReport = {
  matched: CollectionImportRow[];
  unmatched: string[];
  duplicate: string[];
  invalid: string[];
  toDeactivate: Array<{ symbol: string; instrumentId: string }>;
  summary: {
    toAddCount: number;
    toReactivateCount: number;
    alreadyActiveCount: number;
    toDeactivateCount: number;
    unmatchedCount: number;
    duplicateCount: number;
    invalidCount: number;
  };
};

export type AdminMarketCollection = MarketCollection & {
  description: string | null;
  active: boolean;
  sourceName: string | null;
  sourceDate: string | null;
  lastImportedAt: string | null;
};

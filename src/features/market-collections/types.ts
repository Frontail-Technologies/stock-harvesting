export type MarketCollection = {
  id: string;
  code: string;
  name: string;
  exchange: string;
  countryCode: string;
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
  // Cross-filter pass (item 13) - the backend's RelativeStrengthMetricRow
  // already carries both fields (confirmed live against
  // /api/market-collections/:code/relative-strength) and always has, they
  // were just never declared on this frontend type before since nothing
  // consumed them. Widening the type here is the entire "API change" this
  // feature needed - no backend edit, no new endpoint: see
  // dashboard-cross-filter.ts, which derives the industry<->sector
  // relation from this same ungrouped metrics array.
  sector: string | null;
  industry: string | null;
  close: number;
  volume: number;
  change55dPct: number;
  monthlyPct: number;
  weeklyMacdPct: number;
  weeklyMacdHistogramPct: number;
  combinedScore: number;
};

export type CollectionGroupRelativeStrengthRow = {
  label: string;
  score: number;
  memberCount: number;
};

export type CollectionRelativeStrengthResponse = {
  collection: { code: string; name: string; exchange: string };
  metrics?: CollectionRelativeStrengthMetric[];
  groups?: CollectionGroupRelativeStrengthRow[];
};

export type CollectionWeeklyStrongStock = {
  symbol: string;
  name: string;
  exchange: string;
  close: number;
  changePct: number;
  volume: number;
  sector: string | null;
  industry: string | null;
};

export type CollectionWeeklyStrongStocksResponse = {
  collection: { code: string; name: string };
  items: CollectionWeeklyStrongStock[];
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

// A confirmed import (never a dry-run) additionally reports the immutable
// membership version it created, plus any backtest runs the import
// invalidated as a lifecycle side effect (Phase D.5): the entire
// current_membership series when the active set actually changed (#2),
// and any historical_membership weeks that fell inside this version's own
// now-authoritative window and were resolved against a different,
// now-superseded version (#1). Neither is auto-regenerated - see
// AdminWeeklyStrongBacktestStatus's explicit rebuild actions.
export type CollectionImportResult = CollectionImportReport & {
  versionId: string;
  effectiveFrom: string;
  invalidatedCurrentMembershipRuns: number;
  invalidatedHistoricalWeeks: string[];
};

export type CollectionVersionStatus = "current" | "superseded" | "scheduled";

export type CollectionVersionSummary = {
  id: string;
  effectiveFrom: string;
  memberCount: number;
  sourceName: string | null;
  sourceDate: string | null;
  importedAt: string;
  status: CollectionVersionStatus;
};

export type CollectionVersionMember = {
  instrumentId: string;
  symbol: string;
  exchange: string;
  name: string;
};

export type CollectionVersionMembersResponse = {
  version: {
    id: string;
    effectiveFrom: string;
    memberCount: number;
    sourceName: string | null;
    sourceDate: string | null;
    importedAt: string;
  };
  members: CollectionVersionMember[];
};

export type CollectionVersionReplaceResult = {
  versionId: string;
  memberCount: number;
  unmatched: string[];
  invalid: string[];
  invalidatedWeeks: string[];
};

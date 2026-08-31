export const queryKeys = {
  auth: {
    currentUser: ["auth", "current-user"] as const,

    adminCurrentUser: ["auth", "admin-current-user"] as const,
  },
  profile: {
    current: ["profile", "current"] as const,
  },
  marketData: {
    stocks: (input: {
      q?: string;
      page?: number;
      limit?: number;
      sortBy?: "symbol" | "name" | "close" | "changePct" | "volume";
      sortDirection?: "asc" | "desc";
      exchange?: string;
      moveFilter?: "all" | "gainers" | "decliners" | "unchanged";
      minVolume?: number;
      includeUnpriced?: boolean;
    }) => ["market-data", "stocks", input] as const,
    infiniteStocks: (input: {
      q?: string;
      limit?: number;
      sortBy?: "symbol" | "name" | "close" | "changePct" | "volume";
      sortDirection?: "asc" | "desc";
      exchange?: string;
      moveFilter?: "all" | "gainers" | "decliners" | "unchanged";
      minVolume?: number;
      includeUnpriced?: boolean;
    }) => ["market-data", "stocks", "infinite", input] as const,
    stockSearch: (input: { query: string; limit?: number; exchange?: string }) =>
      ["market-data", "stock-search", input] as const,
    chartEligibleBseStockSearch: (input: { query: string; limit?: number }) =>
      ["market-data", "chart-eligible-bse-stock-search", input] as const,
    candles: (input: {
      symbol: string;
      timeframe: string;
      from?: string;
      to?: string;
      exchange?: string;
    }) => ["market-data", "candles", input] as const,
    historyRange: (input: { symbol: string; timeframe: string; exchange?: string }) =>
      ["market-data", "history-range", input] as const,
    exchanges: ["market-data", "exchanges"] as const,
    exchangeRates: ["market-data", "exchange-rates"] as const,
    indexRelativeStrength: (limit?: number, exchange?: string) =>
      ["market-data", "index-relative-strength", limit, exchange] as const,
  },
  marketCollections: {
    list: (input: { exchange?: string }) => ["market-collections", "list", input] as const,
    members: (input: {
      code: string;
      page: number;
      limit: number;
      q?: string;
      sortBy?: string;
      sortDirection?: string;
    }) => ["market-collections", "members", input] as const,
    relativeStrength: (input: {
      code: string;
      limit?: number;
      groupBy?: "sector" | "industry";
    }) => ["market-collections", "relative-strength", input] as const,
    weeklyStrongStocks: (input: { code: string }) =>
      ["market-collections", "weekly-strong-stocks", input] as const,
    admin: {
      list: ["admin", "market-collections"] as const,
      detail: (id: string) => ["admin", "market-collections", id] as const,
      members: (input: {
        id: string;
        page: number;
        limit: number;
        q?: string;
        sortBy?: string;
        sortDirection?: string;
      }) => ["admin", "market-collections", input.id, "members", input] as const,
      weeklyStrongBacktestStatus: (id: string) =>
        ["admin", "market-collections", id, "weekly-strong-backtest-status"] as const,
      weeklyStrongBacktestHistoricalStatus: (id: string) =>
        ["admin", "market-collections", id, "weekly-strong-backtest-historical-status"] as const,
      versions: (id: string) => ["admin", "market-collections", id, "versions"] as const,
      versionMembers: (input: { id: string; versionId: string }) =>
        ["admin", "market-collections", input.id, "versions", input.versionId] as const,
    },
  },
  weeklyStrongBacktest: {
    stacked: (input: { code: string }) => ["weekly-strong-backtest", "stacked", input] as const,
    weekDetail: (input: { code: string; weekEnding: string }) =>
      ["weekly-strong-backtest", "week-detail", input] as const,
  },
  scanner: {
    results: (input: {
      symbol: string;
      timeframe: string;
      rule?: string;
      limit?: number;
      exchange?: string;
      lookback?: string;
    }) => ["scanner", "results", input] as const,
    workspaceDrawings: (input: { symbol: string; timeframe: string }) =>
      ["scanner", "workspace-drawings", input] as const,
    backtest: (input: { symbol: string; exchange?: string; lookback?: string }) =>
      ["scanner", "backtest", input] as const,
  },
  admin: {
    usersRoot: ["admin", "users"] as const,
    users: (input: {
      q?: string;
      role?: string;
      plan?: string;
      page: number;
      limit: number;
      sort: string;
      direction: string;
    }) => ["admin", "users", input] as const,
    branding: ["admin", "branding"] as const,
    dataProviderStatus: ["admin", "data-provider-status"] as const,
    dataProviderStatuses: ["admin", "data-provider-statuses"] as const,
    dataProviderConnect: ["admin", "data-provider-connect"] as const,
    aiSettings: ["admin", "ai-settings"] as const,
    aiSettingsKey: ["admin", "ai-settings", "key"] as const,
    jobs: ["admin", "jobs"] as const,
    monetization: ["admin", "monetization"] as const,
    dataProviders: ["admin", "data-providers"] as const,
  },
  watchlists: {
    list: ["watchlists", "list"] as const,
    detail: (id: string) => ["watchlists", "detail", id] as const,
  },
  priceAlerts: {
    list: (input: { exchange?: string; symbol?: string; status?: string }) =>
      ["price-alerts", "list", input] as const,
  },
} as const;
